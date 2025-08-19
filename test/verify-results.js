const config = require('../config.js');
const { initDatabase, getHistoryResults, closeConnection } = require('../utils/database');

async function verifyResults() {
  console.log('验证测试结果是否正确保存到数据库...');
  
  try {
    // 初始化数据库连接
    await initDatabase(config.database);
    
    // 获取最近的测试结果
    const results = await getHistoryResults(5);
    
    console.log(`\n获取到 ${results.length} 条最近的测试记录:\n`);
    
    // 显示每条记录的详细信息
    results.forEach((result, index) => {
      console.log(`记录 ${index + 1}:`);
      console.log(`  ID: ${result.id}`);
      console.log(`  服务器名称: ${result.server_name}`);
      console.log(`  服务器URL: ${result.server_url}`);
      console.log(`  测试时间: ${result.test_timestamp}`);
      console.log(`  下载速度: ${result.download_speed} Mbps`);
      console.log(`  上传速度: ${result.upload_speed} Mbps`);
      console.log(`  延迟: ${result.ping} ms`);
      console.log(`  抖动: ${result.jitter} ms`);
      console.log(`  服务器信息: ${JSON.stringify(result.server_info, null, 2)}`);
      console.log('----------------------------------------');
    });
    
    // 验证数据完整性
    console.log('\n验证数据完整性:');
    let allValid = true;
    
    results.forEach((result, index) => {
      const recordNumber = index + 1;
      
      // 检查必填字段
      if (!result.server_name || !result.server_url) {
        console.log(`❌ 记录 ${recordNumber}: 缺少服务器名称或URL`);
        allValid = false;
      }
      
      if (result.download_speed === undefined || result.download_speed === null || result.download_speed < 0) {
        console.log(`❌ 记录 ${recordNumber}: 下载速度无效`);
        allValid = false;
      }
      
      if (result.upload_speed === undefined || result.upload_speed === null || result.upload_speed < 0) {
        console.log(`❌ 记录 ${recordNumber}: 上传速度无效`);
        allValid = false;
      }
      
      if (result.ping === undefined || result.ping === null || result.ping < 0) {
        console.log(`❌ 记录 ${recordNumber}: 延迟无效`);
        allValid = false;
      }
      
      if (result.jitter === undefined || result.jitter === null || result.jitter < 0) {
        console.log(`❌ 记录 ${recordNumber}: 抖动无效`);
        allValid = false;
      }
      
      // 检查时间戳
      if (!result.test_timestamp) {
        console.log(`❌ 记录 ${recordNumber}: 缺少测试时间戳`);
        allValid = false;
      }
    });
    
    if (allValid) {
      console.log('✅ 所有记录的数据完整性验证通过');
    } else {
      console.log('❌ 部分记录的数据完整性验证失败');
    }
    
    // 关闭数据库连接
    await closeConnection();
    
    return allValid;
  } catch (error) {
    console.error('验证过程中发生错误:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行验证
if (require.main === module) {
  verifyResults()
    .then(success => {
      if (success) {
        console.log('\n✅ 测试结果验证完成，所有数据均正确保存');
      } else {
        console.log('\n❌ 测试结果验证完成，发现数据问题');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('验证过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { verifyResults };