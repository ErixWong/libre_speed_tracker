module.exports = {
  // MySQL数据库配置示例
  database: {
    host: 'localhost',
    port: 3306,
    database: 'speedtest_results',
    username: 'root',
    password: 'password',
    
    // 连接池配置
    pool: {
      min: 2,
      max: 10,
      idle: 30000,
      acquire: 60000
    }
  },
  
  // 服务器配置示例
  servers: [
    {
      name: "LibreSpeed官方测试",
      url: "https://librespeed.org/",
      username: "",
      password: ""
    },
    {
      name: "本地测试服务器",
      url: "http://localhost/speedtest/",
      username: "admin",
      password: "password123"
    }
  ],
  
  // 测试参数配置
  test: {
    // 下载测试数据包大小（MB）
    downloadSize: 50,
    
    // 上传测试数据包大小（MB）
    uploadSize: 10,
    
    // 上传测试失败时使用的小数据包大小（MB）
    smallUploadSize: 1,
    
    // ping测试次数
    pingCount: 10,
    
    // 下载测试超时时间（秒）
    downloadTimeout: 25,
    
    // ping测试超时时间（秒）
    pingTimeout: 5
  }
};