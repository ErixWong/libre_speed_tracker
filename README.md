# LibreSpeed 测试脚本需求文档

## 项目概述

本项目旨在开发一个脚本，用于在青龙面板上运行，通过调用目标LibreSpeed站点的后端API进行测速，并将测试结果存储到MySQL数据库中。该脚本将支持nginx的basic_auth保护的站点，并能够测试多项网络性能指标。

## 功能需求

### 1. 配置文件

脚本需要使用JSON格式的配置文件，包含以下信息：

- **目标Librespeed站点**：支持配置多个站点，每个站点包含：
  - 站点名称（可选）
  - 站点URL
  - 用户名（如果站点使用HTTP基本认证）
  - 密码（如果站点使用HTTP基本认证）

- **MySQL数据库连接信息**：
  - 数据库主机地址
  - 数据库端口（默认：3306）
  - 数据库名称
  - 数据库用户名
  - 数据库密码
  - 连接池配置（可选）

配置文件示例：
```json
{
  "servers": [
    {
      "name": "LibreSpeed官方测试",
      "url": "https://librespeed.org/",
      "username": "",
      "password": ""
    },
    {
      "name": "本地测试服务器",
      "url": "http://localhost/speedtest/",
      "username": "admin",
      "password": "password123"
    }
  ],
  "database": {
    "host": "localhost",
    "port": 3306,
    "database": "speedtest_results",
    "username": "root",
    "password": "",
    "pool": {
      "min": 2,
      "max": 10,
      "idle": 30000,
      "acquire": 60000
    }
  }
}
```

### 2. 环境变量配置

除了使用配置文件外，脚本还支持通过环境变量进行配置：

```bash
# MySQL数据库连接信息
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

### 3. 测试功能

脚本需要提供以下测试功能：

- **测试多个LibreSpeed站点**：能够对配置文件中的所有站点进行测速
- **支持HTTP基本认证**：能够访问需要用户名和密码的站点
- **测试多项指标**：
  - 下载速度
  - 上传速度
  - 延迟（Ping）
  - 抖动（Jitter）
  - 服务器信息

### 4. 数据存储

脚本需要将测试结果存储到MySQL数据库中：

- **自动创建表**：如果表不存在，脚本应该自动创建
- **表结构**：
  ```sql
  CREATE TABLE IF NOT EXISTS speedtest_results (
    id INT AUTO_INCREMENT PRIMARY KEY,
    server_name VARCHAR(255),
    server_url VARCHAR(255),
    test_timestamp DATETIME,
    download_speed FLOAT,
    upload_speed FLOAT,
    ping FLOAT,
    jitter FLOAT,
    server_info JSON
  );
  ```

### 5. 脚本方法

脚本需要提供以下方法：

- **测试所有服务器**：`testAllServers()` - 测试配置文件中的所有服务器
- **测试单个服务器**：`testServer(serverConfig)` - 测试指定的服务器
- **保存结果**：`saveResult(result)` - 将测试结果保存到数据库
- **初始化数据库**：`initDatabase()` - 初始化数据库连接和表结构
- **获取历史结果**：`getHistoryResults(limit)` - 获取最近的测试结果

## 技术考虑

### 1. 实现方式

脚本将采用API方式实现：

- **API方式**：直接调用LibreSpeed站点的后端API进行测试，这种方式更轻量级，资源消耗少，适合在青龙面板等环境中运行

### 2. 依赖库

脚本需要以下依赖库：

- `mysql2`：用于MySQL数据库连接
- `sequelize`：用于ORM和数据库操作
- `axios`：用于HTTP请求和basic_auth认证

### 3. 青龙面板支持

脚本设计为在青龙面板上运行：

- 支持环境变量配置数据库连接信息
- 支持定时任务执行
- 支持通过环境变量配置目标站点信息
- 支持nginx的basic_auth认证

## 使用场景

### 1. 青龙面板使用（主要场景）

- 用户可以在青龙面板上创建定时任务，定期执行测速
- 通过环境变量配置数据库连接信息和目标站点信息
- 支持nginx的basic_auth认证，可访问受保护的站点

### 2. 本地使用（次要场景）

- 用户可以通过命令行运行脚本进行调试
- 提供配置文件方式设置参数
- 提供命令行选项，支持测试指定服务器、查看历史结果等

## 后续步骤

1. 设计脚本架构和类结构，适配青龙面板环境
2. 实现核心功能，重点开发API调用方式
3. 添加nginx的basic_auth认证支持
4. 实现青龙面板环境变量配置支持
5. 添加定时任务支持
6. 编写青龙面板部署文档和示例

## 项目开发信息

- **开发模型**：GLM-4.5
- **开发环境**：Kilo Code
- **开发用时**：5小时