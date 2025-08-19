const config = require('../config.js');
const { initDatabase, closeConnection } = require('../utils/database-native');
const { logInfo, logError } = require('../utils/logger');
const mysql = require('mysql2/promise');

async function testDatabaseConnection() {
  logInfo('正在测试数据库连接...');
  logInfo('数据库配置:', {
    host: config.database.host,
    port: config.database.port,
    database: config.database.database,
    username: config.database.username,
    // 不打印密码
    password: '******'
  });

  try {
    // 首先尝试连接到MySQL服务器（不指定数据库）
    console.log('\n步骤1: 尝试连接到MySQL服务器...');
    const connection = await mysql.createConnection({
      host: config.database.host,
      port: config.database.port,
      user: config.database.username,
      password: config.database.password
    });
    logInfo('✅ 成功连接到MySQL服务器');

    // 检查数据库是否存在
    console.log('\n步骤2: 检查数据库是否存在...');
    const [rows] = await connection.execute(`SHOW DATABASES LIKE '${config.database.database}'`);
    
    if (rows.length === 0) {
      logInfo(`📋 数据库 '${config.database.database}' 不存在，尝试创建...`);
      try {
        await connection.execute(`CREATE DATABASE ${config.database.database}`);
        logInfo(`✅ 数据库 '${config.database.database}' 创建成功`);
      } catch (createError) {
        logError(`❌ 创建数据库失败: ${createError.message}`);
        logInfo('请手动创建数据库并确保用户有适当权限');
        await connection.end();
        return false;
      }
    } else {
      logInfo(`✅ 数据库 '${config.database.database}' 已存在`);
    }

    // 关闭初始连接
    await connection.end();

    // 使用我们的数据库模块初始化连接
    console.log('\n步骤3: 使用项目配置初始化数据库连接...');
    await initDatabase(config.database);
    logInfo('✅ 数据库连接和表初始化成功！');
    
    // 关闭连接
    await closeConnection();
    logInfo('✅ 数据库连接已关闭');
    return true;
  } catch (error) {
    logError('❌ 数据库连接失败:', error.message);
    
    // 提供更详细的错误信息和解决建议
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 解决建议:');
      console.log('1. 检查MySQL服务器是否正在运行');
      console.log('2. 验证用户名和密码是否正确');
      console.log('3. 确保用户有创建数据库和表的权限');
      console.log('4. 如果使用的是远程数据库，检查网络连接和防火墙设置');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 解决建议:');
      console.log('1. 检查MySQL服务器是否正在运行');
      console.log('2. 验证主机地址和端口是否正确');
      console.log('3. 检查防火墙设置');
    }
    
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testDatabaseConnection()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      logError('测试过程中发生错误:', error);
      process.exit(1);
    });
}

module.exports = { testDatabaseConnection };