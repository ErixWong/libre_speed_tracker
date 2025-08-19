const axios = require('axios');
const config = require('../config.js');
const { log, error } = require('./logger');

/**
 * 测试指定的LibreSpeed服务器
 * @param {Object} server 服务器配置
 * @returns {Object} 测试结果
 */
async function testServers(server) {
  const result = {
    server_name: server.name || server.url,
    server_url: server.url,
    download_speed: null,
    upload_speed: null,
    ping: null,
    jitter: null,
    server_info: null,
    errors: []
  };

  try {
    // 准备请求配置，包括basic_auth认证
    const requestConfig = {
      baseURL: server.url,
      timeout: 30000, // 30秒超时
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

    // 获取服务器信息
    try {
      log(`获取服务器信息: ${server.url}`);
      const serverInfoResponse = await client.get('/backend/getIP.php');
      result.server_info = serverInfoResponse.data;
    } catch (error) {
      error(`获取服务器信息失败: ${server.url}`, error.message);
      result.errors.push(`获取服务器信息失败: ${error.message}`);
    }

    // 执行下载测试
    try {
      log(`执行下载测试: ${server.url}`);
      const downloadTestResult = await performDownloadTest(client);
      result.download_speed = downloadTestResult.speed;
    } catch (error) {
      error(`下载测试失败: ${server.url}`, error.message);
      result.errors.push(`下载测试失败: ${error.message}`);
    }

    // 执行上传测试
    try {
      log(`执行上传测试: ${server.url}`);
      const uploadTestResult = await performUploadTest(client);
      result.upload_speed = uploadTestResult.speed;
    } catch (error) {
      error(`上传测试失败: ${server.url}`, error.message);
      result.errors.push(`上传测试失败: ${error.message}`);
    }

    // 执行ping测试
    try {
      log(`执行ping测试: ${server.url}`);
      const pingTestResult = await performPingTest(client);
      result.ping = pingTestResult.ping;
      result.jitter = pingTestResult.jitter;
    } catch (error) {
      error(`ping测试失败: ${server.url}`, error.message);
      result.errors.push(`ping测试失败: ${error.message}`);
    }

    // 如果所有测试都失败了，抛出错误
    if (result.errors.length === 4) {
      throw new Error(`所有测试都失败了: ${result.errors.join(', ')}`);
    }

    return result;
  } catch (error) {
    error(`测试服务器 ${server.name || server.url} 失败:`, error.message);
    // 确保结果中包含错误信息，但仍然返回部分结果
    result.errors.push(`总体测试失败: ${error.message}`);
    return result;
  }
}

/**
 * 执行下载测试
 * @param {Object} client axios客户端实例
 * @returns {Object} 下载测试结果
 */
async function performDownloadTest(client) {
  try {
    // 使用LibreSpeed的API进行下载测试
    const response = await client.get('/backend/garbage.php', {
      params: {
        ckSize: config.test.downloadSize // 使用配置的下载测试数据包大小
      },
      responseType: 'stream'
    });

    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      let downloadedBytes = 0;
      let timeoutOccurred = false;
      
      // 设置超时处理
      const timeout = setTimeout(() => {
        timeoutOccurred = true;
        // 如果已经下载了一些数据，返回部分结果而不是错误
        if (downloadedBytes > 0) {
          const endTime = Date.now();
          const durationSeconds = (endTime - startTime) / 1000;
          const speedMbps = (downloadedBytes * 8) / (durationSeconds * 1000000);
          
          resolve({
            speed: parseFloat(speedMbps.toFixed(2)),
            partial: true,
            note: '下载测试超时，返回部分结果'
          });
        } else {
          reject(new Error('下载测试超时'));
        }
      }, config.test.downloadTimeout * 1000); // 使用配置的下载测试超时时间
      
      response.data.on('data', (chunk) => {
        downloadedBytes += chunk.length;
      });
      
      response.data.on('end', () => {
        if (timeoutOccurred) return; // 如果已经超时，不再处理
        
        clearTimeout(timeout);
        const endTime = Date.now();
        const durationSeconds = (endTime - startTime) / 1000;
        const speedMbps = (downloadedBytes * 8) / (durationSeconds * 1000000);
        
        resolve({
          speed: parseFloat(speedMbps.toFixed(2))
        });
      });
      
      response.data.on('error', (error) => {
        clearTimeout(timeout);
        // 如果已经下载了一些数据，返回部分结果而不是错误
        if (downloadedBytes > 0) {
          const endTime = Date.now();
          const durationSeconds = (endTime - startTime) / 1000;
          const speedMbps = (downloadedBytes * 8) / (durationSeconds * 1000000);
          
          resolve({
            speed: parseFloat(speedMbps.toFixed(2)),
            partial: true,
            note: `下载测试出错，返回部分结果: ${error.message}`
          });
        } else {
          reject(error);
        }
      });
    });
  } catch (error) {
    error('下载测试失败:', error.message);
    throw error;
  }
}

/**
 * 执行上传测试
 * @param {Object} client axios客户端实例
 * @returns {Object} 上传测试结果
 */
async function performUploadTest(client) {
  try {
    // 生成测试数据
    const testData = generateTestData(config.test.uploadSize * 1024 * 1024); // 使用配置的上传测试数据包大小
    
    const startTime = Date.now();
    
    // 使用LibreSpeed的API进行上传测试
    await client.post('/backend/empty.php', testData, {
      headers: {
        'Content-Type': 'application/octet-stream'
      },
      timeout: config.test.uploadTimeout * 1000, // 使用配置的上传测试超时时间
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });
    
    const endTime = Date.now();
    const durationSeconds = (endTime - startTime) / 1000;
    const speedMbps = (testData.length * 8) / (durationSeconds * 1000000);
    
    return {
      speed: parseFloat(speedMbps.toFixed(2))
    };
  } catch (error) {
    error('上传测试失败:', error.message);
    
    // 尝试使用较小的数据包进行测试
    try {
      log('尝试使用较小的数据包进行上传测试...');
      const smallTestData = generateTestData(config.test.smallUploadSize * 1024 * 1024); // 使用配置的小数据包大小
      
      const startTime = Date.now();
      
      await client.post('/backend/empty.php', smallTestData, {
        headers: {
          'Content-Type': 'application/octet-stream'
        },
        timeout: config.test.uploadTimeout * 1000 // 使用配置的上传测试超时时间
      });
      
      const endTime = Date.now();
      const durationSeconds = (endTime - startTime) / 1000;
      const speedMbps = (smallTestData.length * 8) / (durationSeconds * 1000000);
      
      return {
        speed: parseFloat(speedMbps.toFixed(2)),
        partial: true,
        note: '使用较小的数据包进行测试，可能不够准确'
      };
    } catch (smallError) {
      error('小数据包上传测试也失败:', smallError.message);
      throw error; // 抛出原始错误，而不是小数据包测试的错误
    }
  }
}

/**
 * 执行ping测试
 * @param {Object} client axios客户端实例
 * @returns {Object} ping测试结果
 */
async function performPingTest(client) {
  try {
    const pingTimes = [];
    const pingCount = config.test.pingCount; // 使用配置的ping测试次数
    let failedPings = 0;
    
    for (let i = 0; i < pingCount; i++) {
      try {
        const startTime = Date.now();
        
        await client.get('/backend/empty.php', { timeout: config.test.pingTimeout * 1000 }); // 使用配置的ping测试超时时间
        
        const endTime = Date.now();
        const pingTime = endTime - startTime;
        pingTimes.push(pingTime);
      } catch (pingError) {
        console.warn(`第 ${i + 1} 次ping请求失败:`, pingError.message);
        failedPings++;
        
        // 如果失败次数过多，提前结束测试
        if (failedPings > Math.floor(pingCount / 2)) {
          throw new Error(`超过一半的ping请求失败 (${failedPings}/${pingCount})`);
        }
      }
    }
    
    // 如果所有ping都失败了，返回错误
    if (pingTimes.length === 0) {
      throw new Error('所有ping请求都失败了');
    }
    
    // 计算平均ping和抖动
    const averagePing = pingTimes.reduce((sum, time) => sum + time, 0) / pingTimes.length;
    const jitter = calculateJitter(pingTimes);
    
    return {
      ping: parseFloat(averagePing.toFixed(2)),
      jitter: parseFloat(jitter.toFixed(2)),
      partial: pingTimes.length < pingCount,
      note: pingTimes.length < pingCount ? `部分ping请求失败 (${failedPings}/${pingCount})` : null
    };
  } catch (error) {
    error('ping测试失败:', error.message);
    throw error;
  }
}

/**
 * 生成测试数据
 * @param {number} size 数据大小（字节）
 * @returns {Buffer} 测试数据
 */
function generateTestData(size) {
  const data = Buffer.alloc(size);
  for (let i = 0; i < size; i++) {
    data[i] = Math.floor(Math.random() * 256);
  }
  return data;
}

/**
 * 计算抖动
 * @param {Array} pingTimes ping时间数组
 * @returns {number} 抖动值
 */
function calculateJitter(pingTimes) {
  if (pingTimes.length < 2) return 0;
  
  let sumOfDifferences = 0;
  for (let i = 1; i < pingTimes.length; i++) {
    sumOfDifferences += Math.abs(pingTimes[i] - pingTimes[i - 1]);
  }
  
  return sumOfDifferences / (pingTimes.length - 1);
}

module.exports = {
  testServers
};