const config = require('../config.js');
const { initDatabase, closeConnection } = require('../utils/database-native');
const { logInfo, logError } = require('../utils/logger');

/**
 * 初始化测试数据库连接
 * @returns {Promise<void>}
 */
async function setupTestDatabase() {
  try {
    logInfo('初始化测试数据库连接...');
    await initDatabase(config.database);
    logInfo('✅ 测试数据库连接初始化成功');
  } catch (error) {
    logError('❌ 初始化测试数据库连接失败:', error);
    throw error;
  }
}

/**
 * 关闭测试数据库连接
 * @returns {Promise<void>}
 */
async function teardownTestDatabase() {
  try {
    logInfo('关闭测试数据库连接...');
    await closeConnection();
    logInfo('✅ 测试数据库连接已关闭');
  } catch (error) {
    logError('❌ 关闭测试数据库连接失败:', error);
    throw error;
  }
}

/**
 * 执行带有数据库连接的测试函数
 * @param {Function} testFunction - 要执行的测试函数
 * @returns {Promise<any>} - 测试函数的返回值
 */
async function runTestWithDatabase(testFunction) {
  try {
    await setupTestDatabase();
    const result = await testFunction();
    return result;
  } finally {
    await teardownTestDatabase();
  }
}

module.exports = {
  setupTestDatabase,
  teardownTestDatabase,
  runTestWithDatabase
};