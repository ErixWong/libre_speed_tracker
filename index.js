const { testServers } = require('./utils/speedtest');
const { saveResult, initDatabase, closeConnection, getHistoryResults } = require('./utils/database-native');
const { logInfo, logError } = require('./utils/logger');
const config = require('./config.js');

/**
 * 初始化数据库连接
 * @returns {Promise<void>}
 */
async function initDatabaseConnection() {
  logInfo('初始化数据库连接...');
  await initDatabase(config.database);
  logInfo('数据库连接成功');
}

/**
 * 测试单个服务器
 * @param {Object} serverConfig 服务器配置
 * @returns {Promise<Object>} 测试结果
 */
async function testServer(serverConfig) {
  try {
    logInfo(`正在测试: ${serverConfig.name || serverConfig.url}`);
    const result = await testServers(serverConfig);
    logInfo(`测试完成: ${serverConfig.name || serverConfig.url} - 下载: ${result.download_speed} Mbps, 上传: ${result.upload_speed} Mbps, 延迟: ${result.ping} ms`);
    return result;
  } catch (err) {
    logError(`测试失败: ${serverConfig.name || serverConfig.url}`, err.message);
    throw err;
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
    logInfo('测试结果已保存到数据库，ID:', record.id);
    return record;
  } catch (err) {
    logError('保存测试结果失败:', err);
    throw err;
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
    logInfo(`获取到 ${results.length} 条历史测试结果`);
    return results;
  } catch (err) {
    logError('获取历史测试结果失败:', err);
    throw err;
  }
}

/**
 * 处理单个服务器测试错误
 * @param {Object} server 服务器配置
 * @param {Error} error 错误对象
 */
function handleServerError(server, error) {
  logError(`测试失败: ${server.name || server.url}`, error.message);
}

/**
 * 测试所有服务器
 * @returns {Promise<Array>} 所有服务器的测试结果
 */
async function testAllServers() {
  logInfo('开始LibreSpeed测试...');
  const results = [];
  
  try {
    // 初始化数据库
    await initDatabaseConnection();
    
    // 测试所有服务器
    logInfo(`开始测试 ${config.servers.length} 个服务器...`);
    for (const server of config.servers) {
      try {
        const result = await testServer(server);
        await saveTestResult(result);
        results.push(result);
      } catch (err) {
        handleServerError(server, err);
        // 继续测试其他服务器，而不是终止整个测试过程
      }
    }
    
    logInfo('所有测试完成');
    return results;
  } catch (err) {
    logError('程序执行出错:', err);
    throw err;
  }
}

/**
 * 关闭数据库连接
 * @returns {Promise<void>}
 */
async function closeDatabaseConnection() {
  logInfo('关闭数据库连接...');
  await closeConnection();
  logInfo('数据库连接已关闭');
}

/**
 * 安全关闭数据库连接
 */
async function safeCloseDatabaseConnection() {
  try {
    await closeDatabaseConnection();
  } catch (closeError) {
    logError('关闭数据库连接时出错:', closeError);
  }
}

/**
 * 主函数 - 程序入口点
 */
async function main() {
  try {
    await testAllServers();
    await safeCloseDatabaseConnection();
    // 程序正常完成，显式退出
    process.exit(0);
  } catch (err) {
    logError('程序执行出错:', err);
    // 确保在出错时也关闭数据库连接
    await safeCloseDatabaseConnection();
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