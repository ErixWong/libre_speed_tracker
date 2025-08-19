const config = require('../config.js');
const { initDatabase, getHistoryResults, getServerStats, closeConnection } = require('../utils/database-native');
const { log, error } = require('../utils/logger');

async function testHistoryFunction() {
  log('测试历史记录功能...');
  
  try {
    // 初始化数据库连接
    await initDatabase(config.database);
    
    // 测试1: 获取所有历史记录
    console.log('\n测试1: 获取所有历史记录');
    const allResults = await getHistoryResults(10);
    log(`✅ 成功获取 ${allResults.length} 条历史记录`);
    
    // 测试2: 获取特定服务器的历史记录
    console.log('\n测试2: 获取特定服务器的历史记录');
    if (config.servers.length > 0) {
      const serverName = config.servers[0].name;
      const serverResults = await getHistoryResults(10, serverName);
    log(`✅ 成功获取服务器 "${serverName}" 的 ${serverResults.length} 条历史记录`);
      
      // 显示最新的一条记录
      if (serverResults.length > 0) {
        const latest = serverResults[0];
        log(`最新记录: 下载 ${latest.download_speed} Mbps, 上传 ${latest.upload_speed} Mbps, 延迟 ${latest.ping} ms`);
      }
    }
    
    // 测试3: 获取服务器统计信息
    console.log('\n测试3: 获取服务器统计信息');
    for (const server of config.servers) {
      try {
        const stats = await getServerStats(server.url);
        console.log(`\n服务器 "${server.name || server.url}" 的统计信息:`);
        console.log(`  平均下载速度: ${parseFloat(stats.avg_download_speed || 0).toFixed(2)} Mbps`);
        console.log(`  平均上传速度: ${parseFloat(stats.avg_upload_speed || 0).toFixed(2)} Mbps`);
        console.log(`  平均延迟: ${parseFloat(stats.avg_ping || 0).toFixed(2)} ms`);
        console.log(`  平均抖动: ${parseFloat(stats.avg_jitter || 0).toFixed(2)} ms`);
        console.log(`  测试次数: ${stats.test_count || 0}`);
      } catch (error) {
        error(`获取服务器 "${server.name || server.url}" 统计信息失败:`, error.message);
      }
    }
    
    // 测试4: 测试历史记录排序
    console.log('\n测试4: 测试历史记录排序');
    const sortedResults = await getHistoryResults(5);
    if (sortedResults.length >= 2) {
      const first = new Date(sortedResults[0].test_timestamp);
      const second = new Date(sortedResults[1].test_timestamp);
      if (first > second) {
        log('✅ 历史记录按时间降序排列正确');
      } else {
        log('❌ 历史记录排序不正确');
      }
    } else {
      log('ℹ️ 历史记录不足，无法测试排序功能');
    }
    
    // 测试5: 测试限制返回记录数
    console.log('\n测试5: 测试限制返回记录数');
    const limitedResults = await getHistoryResults(3);
    log(`✅ 成功获取 ${limitedResults.length} 条记录（限制3条）`);
    
    // 关闭数据库连接
    await closeConnection();
    
    console.log('\n✅ 历史记录功能测试完成');
    return true;
  } catch (error) {
    error('测试历史记录功能时发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testHistoryFunction()
    .then(success => {
      if (success) {
        console.log('\n✅ 所有历史记录功能测试通过');
      } else {
        console.log('\n❌ 部分历史记录功能测试失败');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      error('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testHistoryFunction };