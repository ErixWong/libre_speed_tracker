# LibreSpeed Tracker

## Overview

LibreSpeed Tracker is a Node.js script designed to run on Qinglong Panel, which performs network speed tests by calling the backend API of target LibreSpeed sites and stores the results in a MySQL database. The script supports sites protected by nginx's basic_auth and can test multiple network performance metrics.

## Features

- **Multi-server Testing**: Test multiple LibreSpeed servers configured in the configuration file
- **HTTP Basic Authentication**: Access sites that require username and password authentication
- **Comprehensive Metrics**: Test download speed, upload speed, ping, jitter, and server information
- **MySQL Database Storage**: Automatically create tables and store test results
- **Environment Variable Support**: Configure database connections and server settings via environment variables
- **Qinglong Panel Integration**: Optimized for running on Qinglong Panel with scheduled tasks
- **Error Handling**: Robust error handling with partial results when tests fail

## Installation

1. Clone or download the project files
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure the settings by copying `config.example.js` to `config.js` and modifying it, or use environment variables
4. Run the script:
   ```bash
   node index.js
   ```

## Configuration

### Configuration File

Create a `config.js` file based on `config.example.js`:

```javascript
module.exports = {
  // MySQL database configuration
  database: {
    host: 'localhost',
    port: 3306,
    database: 'speedtest_results',
    username: 'root',
    password: 'password',
    
    // Connection pool configuration
    pool: {
      min: 2,
      max: 10,
      idle: 30000,
      acquire: 60000
    }
  },
  
  // Server configuration
  servers: [
    {
      name: "LibreSpeed Official Test",
      url: "https://librespeed.org/",
      username: "",
      password: ""
    },
    {
      name: "Local Test Server",
      url: "http://localhost/speedtest/",
      username: "admin",
      password: "password123"
    }
  ],
  
  // Test parameters
  test: {
    downloadSize: 50,      // Download test data size (MB)
    uploadSize: 10,        // Upload test data size (MB)
    smallUploadSize: 1,    // Small data packet size for upload test fallback (MB)
    pingCount: 10,         // Number of ping tests
    downloadTimeout: 60,   // Download test timeout (seconds)
    uploadTimeout: 60,     // Upload test timeout (seconds)
    pingTimeout: 5         // Ping test timeout (seconds)
  }
};
```

### Environment Variables

Alternatively, you can configure the script using environment variables:

```bash
# MySQL database connection
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=speedtest_results
export DB_USER=root
export DB_PASSWORD=password

# Connection pool configuration
export DB_POOL_MIN=2
export DB_POOL_MAX=10
export DB_POOL_IDLE=30000
export DB_POOL_ACQUIRE=60000

# Server configuration
export SPEEDTEST_SERVERS='[{"name":"Test Server","url":"https://example.com/","username":"","password":""}]'
```

## Database Schema

The script automatically creates the following table in the MySQL database:

```sql
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
);
```

## API Reference

The script provides the following methods:

- `testAllServers()`: Test all servers configured in the configuration file
- `testServer(serverConfig)`: Test a specific server
- `saveResult(result)`: Save test results to the database
- `initDatabase()`: Initialize database connection and table structure
- `getHistoryResults(limit)`: Get recent test results
- `closeConnection()`: Close the database connection

## Usage Examples

### Basic Usage

```javascript
const { testAllServers } = require('./index.js');

// Test all servers and save results to database
testAllServers()
  .then(results => {
    console.log('All tests completed:', results);
  })
  .catch(error => {
    console.error('Test failed:', error);
  });
```

### Custom Usage

```javascript
const { testServer, saveResult, initDatabase, getHistoryResults } = require('./index.js');

// Initialize database
await initDatabase();

// Test a specific server
const serverConfig = {
  name: "Custom Server",
  url: "https://example.com/speedtest/",
  username: "user",
  password: "pass"
};

const result = await testServer(serverConfig);
await saveResult(result);

// Get historical results
const history = await getHistoryResults(10);
console.log('Recent test results:', history);
```

## Qinglong Panel Integration

### Setup

1. Upload all project files to the Qinglong Panel script directory
2. Install dependencies in the Qinglong Panel script management: `npm install axios mysql2`
3. Configure environment variables in the Qinglong Panel environment variable management
4. Create a scheduled task with the command: `node index.js`

### Environment Variables for Qinglong Panel

- `DB_HOST`: Database host address
- `DB_PORT`: Database port
- `DB_NAME`: Database name
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `SPEEDTEST_SERVERS`: JSON formatted server configuration array

## Dependencies

- `axios`: HTTP client for API requests and basic authentication
- `mysql2`: MySQL database client

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

# LibreSpeed Tracker

## 概述

LibreSpeed Tracker 是一个 Node.js 脚本，设计用于在青龙面板上运行，通过调用目标 LibreSpeed 站点的后端 API 进行网络速度测试，并将结果存储到 MySQL 数据库中。该脚本支持受 nginx basic_auth 保护的站点，并能够测试多项网络性能指标。

## 功能特点

- **多服务器测试**：测试配置文件中的多个 LibreSpeed 服务器
- **HTTP 基本认证**：访问需要用户名和密码认证的站点
- **全面指标**：测试下载速度、上传速度、延迟、抖动和服务器信息
- **MySQL 数据库存储**：自动创建表并存储测试结果
- **环境变量支持**：通过环境变量配置数据库连接和服务器设置
- **青龙面板集成**：优化为在青龙面板上运行，支持定时任务
- **错误处理**：强大的错误处理机制，测试失败时返回部分结果

## 安装

1. 克隆或下载项目文件
2. 安装依赖：
   ```bash
   npm install
   ```
3. 通过复制 `config.example.js` 为 `config.js` 并修改它来配置设置，或使用环境变量
4. 运行脚本：
   ```bash
   node index.js
   ```

## 配置

### 配置文件

基于 `config.example.js` 创建一个 `config.js` 文件：

```javascript
module.exports = {
  // MySQL数据库配置
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
  
  // 服务器配置
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
  
  // 测试参数
  test: {
    downloadSize: 50,      // 下载测试数据包大小（MB）
    uploadSize: 10,        // 上传测试数据包大小（MB）
    smallUploadSize: 1,    // 上传测试失败时使用的小数据包大小（MB）
    pingCount: 10,         // ping测试次数
    downloadTimeout: 60,   // 下载测试超时时间（秒）
    uploadTimeout: 60,     // 上传测试超时时间（秒）
    pingTimeout: 5         // ping测试超时时间（秒）
  }
};
```

### 环境变量

或者，您可以使用环境变量配置脚本：

```bash
# MySQL数据库连接
export DB_HOST=localhost
export DB_PORT=3306
export DB_NAME=speedtest_results
export DB_USER=root
export DB_PASSWORD=password

# 连接池配置
export DB_POOL_MIN=2
export DB_POOL_MAX=10
export DB_POOL_IDLE=30000
export DB_POOL_ACQUIRE=60000

# 服务器配置
export SPEEDTEST_SERVERS='[{"name":"测试服务器","url":"https://example.com/","username":"","password":""}]'
```

## 数据库结构

脚本会自动在 MySQL 数据库中创建以下表：

```sql
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
);
```

## API 参考

脚本提供以下方法：

- `testAllServers()`: 测试配置文件中的所有服务器
- `testServer(serverConfig)`: 测试指定的服务器
- `saveResult(result)`: 将测试结果保存到数据库
- `initDatabase()`: 初始化数据库连接和表结构
- `getHistoryResults(limit)`: 获取最近的测试结果
- `closeConnection()`: 关闭数据库连接

## 使用示例

### 基本用法

```javascript
const { testAllServers } = require('./index.js');

// 测试所有服务器并将结果保存到数据库
testAllServers()
  .then(results => {
    console.log('所有测试完成:', results);
  })
  .catch(error => {
    console.error('测试失败:', error);
  });
```

### 自定义用法

```javascript
const { testServer, saveResult, initDatabase, getHistoryResults } = require('./index.js');

// 初始化数据库
await initDatabase();

// 测试特定服务器
const serverConfig = {
  name: "自定义服务器",
  url: "https://example.com/speedtest/",
  username: "user",
  password: "pass"
};

const result = await testServer(serverConfig);
await saveResult(result);

// 获取历史结果
const history = await getHistoryResults(10);
console.log('最近的测试结果:', history);
```

## 青龙面板集成

### 设置

1. 将所有项目文件上传到青龙面板的脚本目录
2. 在青龙面板的脚本管理中安装依赖：`npm install axios mysql2`
3. 在青龙面板的环境变量管理中配置环境变量
4. 创建定时任务，命令为：`node index.js`

### 青龙面板环境变量

- `DB_HOST`: 数据库主机地址
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名称
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `SPEEDTEST_SERVERS`: JSON 格式的服务器配置数组

## 依赖项

- `axios`: 用于 API 请求和基本认证的 HTTP 客户端
- `mysql2`: MySQL 数据库客户端

## 许可证

MIT

## 贡献

1. Fork 仓库
2. 创建功能分支
3. 进行更改
4. 提交拉取请求