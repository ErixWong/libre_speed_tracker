const { testServers } = require('./utils/speedtest');
const { saveResult, initDatabase, closeConnection, getHistoryResults } = require('./utils/database');
const config = require('./config.js');

/**
 * 初始化数据库连接
 * @returns {Promise<void>}
 */
async function initDatabaseConnection() {
  console.log('初始化数据库连接...');
  await initDatabase(config.database);
  console.log('数据库连接成功');
}

/**
 * 测试单个服务器
 * @param {Object} serverConfig 服务器配置
 * @returns {Promise<Object>} 测试结果
 */
async function testServer(serverConfig) {
  try {
    console.log(`正在测试: ${serverConfig.name || serverConfig.url}`);
    const result = await testServers(serverConfig);
    console.log(`测试完成: ${serverConfig.name || serverConfig.url} - 下载: ${result.download_speed} Mbps, 上传: ${result.upload_speed} Mbps, 延迟: ${result.ping} ms`);
    return result;
  } catch (error) {
    console.error(`测试失败: ${serverConfig.name || serverConfig.url}`, error.message);
    throw error;
  }
}

/**
 * 保存测试结果到数据库
 * @param {Object} result 测试结果
 * @returns {Promise<Object>} 保存的记录
 */
async function saveTestResult(result) {
  try {
    const record = await saveResult(result);
    console.log('测试结果已保存到数据库，ID:', record.id);
    return record;
  } catch (error) {
    console.error('保存测试结果失败:', error);
    throw error;
  }
}

/**
 * 获取历史测试结果
 * @param {number} limit 限制返回的记录数
 * @returns {Promise<Array>} 历史测试结果数组
 */
async function getTestHistoryResults(limit = 10) {
  try {
    const results = await getHistoryResults(limit);
    console.log(`获取到 ${results.length} 条历史测试结果`);
    return results;
  } catch (error) {
    console.error('获取历史测试结果失败:', error);
    throw error;
  }
}

/**
 * 测试所有服务器
 * @returns {Promise<Array>} 所有服务器的测试结果
 */
async function testAllServers() {
  console.log('开始LibreSpeed测试...');
  const results = [];
  
  try {
    // 初始化数据库
    await initDatabaseConnection();
    
    // 测试所有服务器
    console.log(`开始测试 ${config.servers.length} 个服务器...`);
    for (const server of config.servers) {
      try {
        const result = await testServer(server);
        await saveTestResult(result);
        results.push(result);
      } catch (error) {
        console.error(`测试失败: ${server.name || server.url}`, error.message);
        // 继续测试其他服务器，而不是终止整个测试过程
      }
    }
    
    console.log('所有测试完成');
    return results;
  } catch (error) {
    console.error('程序执行出错:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 * @returns {Promise<void>}
 */
async function closeDatabaseConnection() {
  console.log('关闭数据库连接...');
  await closeConnection();
  console.log('数据库连接已关闭');
}

/**
 * 主函数 - 程序入口点
 */
async function main() {
  try {
    await testAllServers();
    await closeDatabaseConnection();
  } catch (error) {
    console.error('程序执行出错:', error);
    // 确保在出错时也关闭数据库连接
    try {
      await closeDatabaseConnection();
    } catch (closeError) {
      console.error('关闭数据库连接时出错:', closeError);
    }
    process.exit(1);
  }
}

// 导出接口方法
module.exports = {
  testAllServers,
  testServer,
  saveResult: saveTestResult,
  initDatabase: initDatabaseConnection,
  getHistoryResults: getTestHistoryResults,
  closeDatabaseConnection
};

// 如果直接运行此文件，则执行主函数
if (require.main === module) {
  main().catch(console.error);
}