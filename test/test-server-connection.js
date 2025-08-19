const config = require('../config.js');
const axios = require('axios');

async function testServerConnection() {
  console.log('正在测试LibreSpeed服务器连接...');
  
  for (const server of config.servers) {
    console.log(`\n测试服务器: ${server.name || server.url}`);
    console.log(`URL: ${server.url}`);
    
    try {
      // 准备请求配置，包括basic_auth认证
      const requestConfig = {
        baseURL: server.url,
        timeout: 10000, // 10秒超时
        headers: {
          'User-Agent': 'LibreSpeed-Test-Script/1.0'
        }
      };

      // 如果有用户名和密码，添加basic_auth认证
      if (server.username && server.password) {
        const auth = Buffer.from(`${server.username}:${server.password}`).toString('base64');
        requestConfig.headers['Authorization'] = `Basic ${auth}`;
      }

      // 创建axios实例
      const client = axios.create(requestConfig);

      // 测试基本连接
      console.log('测试基本连接...');
      const response = await client.get('/backend/getIP.php');
      console.log('✅ 服务器连接成功');
      console.log('服务器响应:', JSON.stringify(response.data, null, 2));
      
      // 测试下载端点
      console.log('\n测试下载端点...');
      try {
        const downloadResponse = await client.get('/backend/garbage.php', {
          params: { ckSize: 1 }, // 1MB测试数据
          timeout: 5000
        });
        console.log('✅ 下载端点测试成功');
      } catch (downloadError) {
        console.error('❌ 下载端点测试失败:', downloadError.message);
      }
      
      // 测试上传端点
      console.log('\n测试上传端点...');
      try {
        const testData = Buffer.alloc(1024); // 1KB测试数据
        await client.post('/backend/empty.php', testData, {
          headers: {
            'Content-Type': 'application/octet-stream'
          },
          timeout: 5000
        });
        console.log('✅ 上传端点测试成功');
      } catch (uploadError) {
        console.error('❌ 上传端点测试失败:', uploadError.message);
      }
      
    } catch (error) {
      console.error('❌ 服务器连接失败:', error.message);
      if (error.response) {
        console.error('HTTP状态码:', error.response.status);
        console.error('响应数据:', error.response.data);
      } else if (error.code === 'ECONNREFUSED') {
        console.error('连接被拒绝，请检查服务器是否运行');
      } else if (error.code === 'ENOTFOUND') {
        console.error('无法解析主机名，请检查URL是否正确');
      } else if (error.code === 'ETIMEDOUT') {
        console.error('连接超时，请检查网络或服务器状态');
      }
    }
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testServerConnection()
    .then(() => {
      console.log('\n服务器连接测试完成');
      process.exit(0);
    })
    .catch(error => {
      console.error('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testServerConnection };