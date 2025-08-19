module.exports = {
  // 优先使用环境变量，如果没有则使用默认值
  database: {
    // MySQL数据库配置
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'erixdb',
    username: process.env.DB_USER || 'eric',
    password: process.env.DB_PASSWORD || 'erixPwd@2025',
    
    // 连接池配置
    pool: {
      min: parseInt(process.env.DB_POOL_MIN || 2),
      max: parseInt(process.env.DB_POOL_MAX || 10),
      idle: parseInt(process.env.DB_POOL_IDLE || 30000),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || 60000)
    }
  },
  
  // 服务器配置，支持环境变量
  servers: process.env.SPEEDTEST_SERVERS
    ? JSON.parse(process.env.SPEEDTEST_SERVERS)
    : [
        {
          name: "c.erik.top",
          url: "https://c.erik.top",
          username: "test",
          password: "speed"
        }
      ],
      
      // 测试参数配置
      test: {
        // 下载测试数据包大小（MB）
        downloadSize: parseInt(process.env.DOWNLOAD_SIZE || 50),
        
        // 上传测试数据包大小（MB）
        uploadSize: parseInt(process.env.UPLOAD_SIZE || 10),
        
        // 上传测试失败时使用的小数据包大小（MB）
        smallUploadSize: parseInt(process.env.SMALL_UPLOAD_SIZE || 1),
        
        // ping测试次数
        pingCount: parseInt(process.env.PING_COUNT || 10),
        
        // 下载测试超时时间（秒）
        downloadTimeout: parseInt(process.env.DOWNLOAD_TIMEOUT || 25),
        
        // ping测试超时时间（秒）
        pingTimeout: parseInt(process.env.PING_TIMEOUT || 5)
      }
    };