const mysql = require('mysql2/promise');
const { logInfo, logError, logWarn } = require('./logger');
let pool = null;

/**
 * 统一的数据库操作日志处理
 * @param {string} operation 操作名称
 * @param {string} status 状态（success/error）
 * @param {Error|string} error 错误对象或消息（可选）
 */
function logDatabaseOperation(operation, status, error = null) {
  if (status === 'success') {
    logInfo(`${operation}成功`);
  } else if (status === 'error') {
    logError(`${operation}失败:`, error);
  }
}

/**
 * 初始化数据库连接池
 * @param {Object} dbConfig 数据库配置
 */
async function initDatabase(dbConfig) {
  try {
    // 创建MySQL连接池
    pool = mysql.createPool({
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.username,
      password: dbConfig.password,
      waitForConnections: true,
      connectionLimit: dbConfig.pool.max || 10,
      queueLimit: 0,
      namedPlaceholders: true
    });
    
    // 测试连接
    const [rows] = await pool.execute('SELECT 1');
    logDatabaseOperation('数据库连接', 'success');
    
    // 初始化表结构
    await initTables();
    
    logDatabaseOperation('数据库初始化', 'success');
  } catch (err) {
    logDatabaseOperation('数据库初始化', 'error', err);
    throw err;
  }
}

/**
 * 初始化表结构
 */
async function initTables() {
  try {
    // 创建speedtest_results表
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS speedtest_results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        server_name VARCHAR(255) NOT NULL,
        server_url VARCHAR(255) NOT NULL,
        test_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        download_speed FLOAT,
        upload_speed FLOAT,
        ping FLOAT,
        jitter FLOAT,
        server_info JSON
      )
    `;
    
    await pool.execute(createTableSql);
    
    // 创建索引
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_server_url ON speedtest_results (server_url)',
      'CREATE INDEX IF NOT EXISTS idx_test_timestamp ON speedtest_results (test_timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_server_name ON speedtest_results (server_name)'
    ];
    
    for (const indexSql of indexes) {
      try {
        await pool.execute(indexSql);
      } catch (err) {
        logWarn('创建索引时出现警告（可能已存在）:', err.message);
      }
    }
    
    logDatabaseOperation('数据库表和索引初始化', 'success');
    
    // 检查并修改现有表结构，确保允许字段为null
    await modifyTableStructure();
  } catch (err) {
    logDatabaseOperation('初始化表结构', 'error', err);
    throw err;
  }
}

/**
 * 修改表结构，确保允许字段为null
 */
async function modifyTableStructure() {
  try {
    // 检查表是否存在
    const [tables] = await pool.execute('SHOW TABLES LIKE "speedtest_results"');
    if (tables.length === 0) {
      return; // 表不存在，无需修改
    }
    
    // 获取表结构
    const [columns] = await pool.execute('SHOW COLUMNS FROM speedtest_results');
    
    // 检查并修改需要允许为null的字段
    const nullableColumns = ['download_speed', 'upload_speed', 'ping', 'jitter'];
    
    for (const column of nullableColumns) {
      const columnInfo = columns.find(col => col.Field === column);
      if (columnInfo && columnInfo.Null === 'NO') {
        logInfo(`修改表结构：允许 ${column} 字段为null`);
        await pool.execute(`ALTER TABLE speedtest_results MODIFY COLUMN ${column} FLOAT`);
      }
    }
    
    logDatabaseOperation('表结构修改', 'success');
  } catch (err) {
    logDatabaseOperation('修改表结构', 'error', err);
    throw err;
  }
}

/**
 * 验证测试结果数据
 * @param {Object} result 测试结果
 * @returns {Object} 验证结果
 */
function validateResult(result) {
  const errors = [];
  
  // 验证必填字段
  if (!result.server_name || typeof result.server_name !== 'string') {
    errors.push('server_name 必须是字符串且不能为空');
  }
  
  if (!result.server_url || typeof result.server_url !== 'string') {
    errors.push('server_url 必须是字符串且不能为空');
  }
  
  // 验证速度数据（现在可以为空）
  if (result.download_speed !== undefined && result.download_speed !== null) {
    if (typeof result.download_speed !== 'number' || isNaN(result.download_speed) || result.download_speed < 0) {
      errors.push('download_speed 必须是非负数或为空');
    }
  }
  
  if (result.upload_speed !== undefined && result.upload_speed !== null) {
    if (typeof result.upload_speed !== 'number' || isNaN(result.upload_speed) || result.upload_speed < 0) {
      errors.push('upload_speed 必须是非负数或为空');
    }
  }
  
  if (result.ping !== undefined && result.ping !== null) {
    if (typeof result.ping !== 'number' || isNaN(result.ping) || result.ping < 0) {
      errors.push('ping 必须是非负数或为空');
    }
  }
  
  if (result.jitter !== undefined && result.jitter !== null) {
    if (typeof result.jitter !== 'number' || isNaN(result.jitter) || result.jitter < 0) {
      errors.push('jitter 必须是非负数或为空');
    }
  }
  
  // 验证server_info（可选字段）
  if (result.server_info && typeof result.server_info !== 'object') {
    errors.push('server_info 必须是对象');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * 保存测试结果到数据库
 * @param {Object} result 测试结果
 */
async function saveResult(result) {
  if (!pool) {
    throw new Error('数据库连接未初始化');
  }

  // 验证数据
  const validation = validateResult(result);
  if (!validation.isValid) {
    const errorMsg = `数据验证失败: ${validation.errors.join(', ')}`;
    logError(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const sql = `
      INSERT INTO speedtest_results 
      (server_name, server_url, test_timestamp, download_speed, upload_speed, ping, jitter, server_info)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const serverInfoJson = result.server_info ? JSON.stringify(result.server_info) : '{}';
    
    const [resultData] = await pool.execute(sql, [
      result.server_name,
      result.server_url,
      new Date(),
      result.download_speed,
      result.upload_speed,
      result.ping,
      result.jitter,
      serverInfoJson
    ]);
    
    logInfo('测试结果已保存到数据库，ID:', resultData.insertId);
    return { id: resultData.insertId };
  } catch (err) {
    logDatabaseOperation('保存测试结果', 'error', err);
    throw err;
  }
}

/**
 * 获取最近的测试结果
 * @param {number} limit 限制返回的记录数
 * @param {string} serverName 可选，按服务器名称筛选
 * @returns {Array} 测试结果数组
 */
async function getHistoryResults(limit = 10, serverName = null) {
  if (!pool) {
    throw new Error('数据库连接未初始化');
  }

  try {
    let sql = `
      SELECT id, server_name, server_url, test_timestamp, download_speed, upload_speed, ping, jitter, server_info
      FROM speedtest_results
    `;
    
    const params = [];
    
    if (serverName) {
      sql += ' WHERE server_name = ?';
      params.push(serverName);
    }
    
    sql += ' ORDER BY test_timestamp DESC LIMIT ?';
    params.push(parseInt(limit));
    
    const [rows] = await pool.execute(sql, params);
    
    // 处理server_info字段，从JSON字符串转换为对象
    return rows.map(row => {
      if (typeof row.server_info === 'string') {
        try {
          row.server_info = JSON.parse(row.server_info);
        } catch (e) {
          logWarn('解析server_info JSON失败:', e.message);
          row.server_info = {};
        }
      }
      return row;
    });
  } catch (err) {
    logDatabaseOperation('获取历史结果', 'error', err);
    throw err;
  }
}

/**
 * 获取指定服务器的测试统计信息
 * @param {string} serverUrl 服务器URL
 * @returns {Object} 统计信息
 */
async function getServerStats(serverUrl) {
  if (!pool) {
    throw new Error('数据库连接未初始化');
  }

  try {
    const sql = `
      SELECT 
        AVG(download_speed) as avg_download_speed,
        AVG(upload_speed) as avg_upload_speed,
        AVG(ping) as avg_ping,
        AVG(jitter) as avg_jitter,
        COUNT(id) as test_count
      FROM speedtest_results
      WHERE server_url = ?
    `;
    
    const [rows] = await pool.execute(sql, [serverUrl]);
    return rows[0] || {};
  } catch (err) {
    logDatabaseOperation('获取服务器统计信息', 'error', err);
    throw err;
  }
}

/**
 * 关闭数据库连接池
 */
async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    logDatabaseOperation('数据库连接关闭', 'success');
  }
}

module.exports = {
  initDatabase,
  saveResult,
  getHistoryResults,
  getServerStats,
  closeConnection
};