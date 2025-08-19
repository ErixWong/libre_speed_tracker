const { Sequelize, DataTypes } = require('sequelize');
let sequelize = null;
let SpeedtestResult = null;

/**
 * 初始化数据库连接和表结构
 * @param {Object} dbConfig 数据库配置
 */
async function initDatabase(dbConfig) {
  try {
    // 创建MySQL Sequelize实例
    sequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: 'mysql',
        pool: {
          min: parseInt(dbConfig.pool.min),
          max: parseInt(dbConfig.pool.max),
          idle: parseInt(dbConfig.pool.idle),
          acquire: parseInt(dbConfig.pool.acquire)
        },
        logging: process.env.NODE_ENV === 'development' ? console.log : false
      }
    );
    
    // 测试连接
    await sequelize.authenticate();
    console.log('数据库连接成功');
    
    // 定义模型
    defineSpeedtestResultModel();
    
    // 同步模型到数据库
    await sequelize.sync({ alter: true });
    console.log('数据库表初始化完成');
    
    // 创建索引以提高查询性能
    await createIndexes();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

/**
 * 定义速度测试结果模型
 */
function defineSpeedtestResultModel() {
  SpeedtestResult = sequelize.define('SpeedtestResult', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    server_name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    server_url: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    test_timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    download_speed: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    upload_speed: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    ping: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    jitter: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    server_info: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'speedtest_results',
    timestamps: false
  });
}

/**
 * 创建索引以提高查询性能
 */
async function createIndexes() {
  try {
    // 为服务器URL创建索引
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_server_url ON speedtest_results (server_url)`);
    
    // 为测试时间戳创建索引
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_test_timestamp ON speedtest_results (test_timestamp)`);
    
    // 为服务器名称创建索引
    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_server_name ON speedtest_results (server_name)`);
    
    console.log('数据库索引创建完成');
  } catch (error) {
    console.warn('创建索引时出现警告（可能已存在）:', error.message);
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
  
  // 验证速度数据
  if (result.download_speed === undefined || result.download_speed === null) {
    errors.push('download_speed 不能为空');
  } else if (typeof result.download_speed !== 'number' || isNaN(result.download_speed) || result.download_speed < 0) {
    errors.push('download_speed 必须是非负数');
  }
  
  if (result.upload_speed === undefined || result.upload_speed === null) {
    errors.push('upload_speed 不能为空');
  } else if (typeof result.upload_speed !== 'number' || isNaN(result.upload_speed) || result.upload_speed < 0) {
    errors.push('upload_speed 必须是非负数');
  }
  
  if (result.ping === undefined || result.ping === null) {
    errors.push('ping 不能为空');
  } else if (typeof result.ping !== 'number' || isNaN(result.ping) || result.ping < 0) {
    errors.push('ping 必须是非负数');
  }
  
  if (result.jitter === undefined || result.jitter === null) {
    errors.push('jitter 不能为空');
  } else if (typeof result.jitter !== 'number' || isNaN(result.jitter) || result.jitter < 0) {
    errors.push('jitter 必须是非负数');
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
  if (!sequelize || !SpeedtestResult) {
    throw new Error('数据库连接未初始化');
  }

  // 验证数据
  const validation = validateResult(result);
  if (!validation.isValid) {
    const errorMsg = `数据验证失败: ${validation.errors.join(', ')}`;
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  try {
    const record = await SpeedtestResult.create({
      server_name: result.server_name,
      server_url: result.server_url,
      test_timestamp: new Date(),
      download_speed: result.download_speed,
      upload_speed: result.upload_speed,
      ping: result.ping,
      jitter: result.jitter,
      server_info: result.server_info || {}
    });
    
    console.log('测试结果已保存到数据库，ID:', record.id);
    return record;
  } catch (error) {
    console.error('保存测试结果失败:', error);
    throw error;
  }
}

/**
 * 获取最近的测试结果
 * @param {number} limit 限制返回的记录数
 * @param {string} serverName 可选，按服务器名称筛选
 * @returns {Array} 测试结果数组
 */
async function getHistoryResults(limit = 10, serverName = null) {
  if (!sequelize || !SpeedtestResult) {
    throw new Error('数据库连接未初始化');
  }

  try {
    const whereClause = serverName ? { server_name: serverName } : {};
    
    const results = await SpeedtestResult.findAll({
      where: whereClause,
      order: [['test_timestamp', 'DESC']],
      limit: parseInt(limit)
    });
    
    return results.map(result => result.get({ plain: true }));
  } catch (error) {
    console.error('获取历史结果失败:', error);
    throw error;
  }
}

/**
 * 获取指定服务器的测试统计信息
 * @param {string} serverUrl 服务器URL
 * @returns {Object} 统计信息
 */
async function getServerStats(serverUrl) {
  if (!sequelize || !SpeedtestResult) {
    throw new Error('数据库连接未初始化');
  }

  try {
    const stats = await SpeedtestResult.findOne({
      where: { server_url: serverUrl },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('download_speed')), 'avg_download_speed'],
        [sequelize.fn('AVG', sequelize.col('upload_speed')), 'avg_upload_speed'],
        [sequelize.fn('AVG', sequelize.col('ping')), 'avg_ping'],
        [sequelize.fn('AVG', sequelize.col('jitter')), 'avg_jitter'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'test_count']
      ]
    });
    
    return stats.get({ plain: true });
  } catch (error) {
    console.error('获取服务器统计信息失败:', error);
    throw error;
  }
}

/**
 * 关闭数据库连接
 */
async function closeConnection() {
  if (sequelize) {
    await sequelize.close();
    sequelize = null;
    SpeedtestResult = null;
    console.log('数据库连接已关闭');
  }
}

module.exports = {
  initDatabase,
  saveResult,
  getHistoryResults,
  getServerStats,
  closeConnection
};