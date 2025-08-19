/**
 * 日志工具模块，提供带时间戳的日志输出功能
 */

/**
 * 获取当前时间戳，格式为 yyyy-MM-dd HH:mm:ss
 * @returns {string} 格式化的时间戳
 */
function getTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 输出带时间戳的信息日志
 * @param {...any} args 要输出的内容
 */
function log(...args) {
  const timestamp = getTimestamp();
  console.log(`[${timestamp}]`, ...args);
}

/**
 * 输出带时间戳的错误日志
 * @param {...any} args 要输出的内容
 */
function error(...args) {
  const timestamp = getTimestamp();
  console.error(`[${timestamp}]`, ...args);
}

/**
 * 输出带时间戳的警告日志
 * @param {...any} args 要输出的内容
 */
function warn(...args) {
  const timestamp = getTimestamp();
  console.warn(`[${timestamp}]`, ...args);
}

module.exports = {
  log,
  error,
  warn
};