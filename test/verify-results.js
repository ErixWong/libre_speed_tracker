const config = require('../config.js');
const { initDatabase, getHistoryResults, closeConnection } = require('../utils/database-native');
const { log, error } = require('../utils/logger');

async function verifyResults() {
  log('验证测试结果是否正确保存到数据库...');
  
  try {
    // 初始化数据库连接
    await initDatabase(config.database);
    
    // 获取最近的测试结果
    const results = await getHistoryResults(5);
    
    log(`\n获取到 ${results.length} 条最近的测试记录:\n`);
    
    // 显示每条记录的详细信息
    results.forEach((result, index) => {
      log(`记录 ${index + 1}:`);
      log(`  ID: ${result.id}`);
      log(`  服务器名称: ${result.server_name}`);
      log(`  服务器URL: ${result.server_url}`);
      log(`  测试时间: ${result.test_timestamp}`);
      log(`  下载速度: ${result.download_speed !== null && result.download_speed !== undefined ? result.download_speed + ' Mbps' : 'N/A'}`);
      log(`  上传速度: ${result.upload_speed !== null && result.upload_speed !== undefined ? result.upload_speed + ' Mbps' : 'N/A'}`);
      log(`  延迟: ${result.ping !== null && result.ping !== undefined ? result.ping + ' ms' : 'N/A'}`);
      log(`  抖动: ${result.jitter !== null && result.jitter !== undefined ? result.jitter + ' ms' : 'N/A'}`);
      log(`  服务器信息: ${JSON.stringify(result.server_info, null, 2)}`);
      log('----------------------------------------');
    });
    
    // 验证数据完整性
    log('\n验证数据完整性:');
    let allValid = true;
    
    results.forEach((result, index) => {
      const recordNumber = index + 1;
      
      // 检查必填字段
      if (!result.server_name || !result.server_url) {
        log(`❌ 记录 ${recordNumber}: 缺少服务器名称或URL`);
        allValid = false;
      }
      
      // 验证下载速度（现在可以为空）
      if (result.download_speed !== null && result.download_speed !== undefined) {
        if (typeof result.download_speed !== 'number' || isNaN(result.download_speed) || result.download_speed < 0) {
          log(`❌ 记录 ${recordNumber}: 下载速度无效`);
          allValid = false;
        }
      }
      
      // 验证上传速度（现在可以为空）
      if (result.upload_speed !== null && result.upload_speed !== undefined) {
        if (typeof result.upload_speed !== 'number' || isNaN(result.upload_speed) || result.upload_speed < 0) {
          log(`❌ 记录 ${recordNumber}: 上传速度无效`);
          allValid = false;
        }
      }
      
      // 验证延迟（现在可以为空）
      if (result.ping !== null && result.ping !== undefined) {
        if (typeof result.ping !== 'number' || isNaN(result.ping) || result.ping < 0) {
          log(`❌ 记录 ${recordNumber}: 延迟无效`);
          allValid = false;
        }
      }
      
      // 验证抖动（现在可以为空）
      if (result.jitter !== null && result.jitter !== undefined) {
        if (typeof result.jitter !== 'number' || isNaN(result.jitter) || result.jitter < 0) {
          log(`❌ 记录 ${recordNumber}: 抖动无效`);
          allValid = false;
        }
      }
      
      // 检查时间戳
      if (!result.test_timestamp) {
        log(`❌ 记录 ${recordNumber}: 缺少测试时间戳`);
        allValid = false;
      }
    });
    
    if (allValid) {
      log('✅ 所有记录的数据完整性验证通过');
    } else {
      log('❌ 部分记录的数据完整性验证失败');
    }
    
    // 关闭数据库连接
    await closeConnection();
    
    return allValid;
  } catch (error) {
    error('验证过程中发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行验证
if (require.main === module) {
  verifyResults()
    .then(success => {
      if (success) {
        log('\n✅ 测试结果验证完成，所有数据均正确保存');
      } else {
        log('\n❌ 测试结果验证完成，发现数据问题');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      error('验证过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { verifyResults };