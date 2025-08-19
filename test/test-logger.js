/**
 * 测试logger模块的功能
 */

const logger = require('../utils/logger');

console.log('=== 开始测试logger模块 ===\n');

// 测试logInfo功能
console.log('测试1: logInfo功能');
logger.logInfo('这是一条信息日志');
logger.logInfo('用户登录成功', { username: 'testuser', id: 123 });
console.log('');

// 测试logError功能
console.log('测试2: logError功能');
logger.logError('这是一条错误日志');
logger.logError('数据库连接失败', new Error('Connection timeout'));
console.log('');

// 测试logWarn功能
console.log('测试3: logWarn功能');
logger.logWarn('这是一条警告日志');
logger.logWarn('内存使用率过高', { usage: '85%' });
console.log('');

console.log('=== logger模块测试完成 ===');