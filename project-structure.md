# LibreSpeed 测试脚本项目目录结构

## 实际项目目录结构

```
libre_speed_tracker/
├── .gitignore                    # Git忽略文件配置
├── README.md                    # 项目说明文档
├── project-structure.md         # 目录结构说明（本文件）
├── package.json                 # 项目依赖配置
├── index.js                     # 主脚本文件
├── config.example.js            # 配置文件示例
├── test/                        # 测试文件目录
│   ├── test-db-connection.js    # 数据库连接测试
│   ├── test-history.js          # 历史记录功能测试
│   ├── test-logger.js           # 日志功能测试
│   ├── test-server-connection.js # 服务器连接测试
│   ├── test-utils.js            # 测试工具函数
│   └── verify-results.js        # 结果验证测试
└── utils/                       # 工具函数目录
    ├── database-native.js       # 数据库操作工具
    ├── logger.js                # 日志记录工具
    └── speedtest.js             # 测速功能工具
```

## 文件功能说明

### 1. 主要文件
- **index.js**: 主脚本文件，包含所有核心逻辑，直接在青龙面板中运行。
- **config.example.js**: 配置文件示例，包含数据库连接信息和测试站点信息。使用时需要复制为config.js。
- **package.json**: 项目依赖配置，列出所需的npm包。
- **.gitignore**: Git忽略文件配置，指定不需要版本控制的文件和目录。

### 2. 工具文件
- **utils/database-native.js**: 数据库操作工具，处理MySQL连接、表创建和结果存储。
- **utils/speedtest.js**: 测速功能工具，调用LibreSpeed API并处理basic_auth认证。
- **utils/logger.js**: 日志记录工具，提供带时间戳的日志输出功能。

### 3. 测试文件
- **test/test-db-connection.js**: 数据库连接测试，验证数据库配置和连接是否正常。
- **test/test-history.js**: 历史记录功能测试，验证获取历史测试结果和统计信息的功能。
- **test/test-logger.js**: 日志功能测试，验证日志记录工具的各种输出功能。
- **test/test-server-connection.js**: 服务器连接测试，验证与LibreSpeed服务器的连接和API调用。
- **test/test-utils.js**: 测试工具函数，提供测试数据库连接的通用功能。
- **test/verify-results.js**: 结果验证测试，验证测试结果的准确性和完整性。

## 实现优势

1. **模块化设计**: 将功能分解为多个模块，提高代码可维护性和可扩展性。
2. **青龙面板友好**: 直接在青龙面板中运行，无需额外适配。
3. **配置灵活**: 支持通过环境变量或配置文件进行配置，适应不同部署环境。
4. **功能完整**: 包含测速、数据存储、日志记录和错误处理等完整功能。
5. **测试覆盖**: 提供全面的测试文件，确保代码质量和功能稳定性。

## 部署方式

### 青龙面板部署
1. 将所有文件上传到青龙面板的脚本目录。
2. 安装依赖：在青龙面板的脚本管理中添加依赖安装命令 `npm install axios mysql2`。
3. 复制config.example.js为config.js，并修改配置，或配置环境变量（推荐）。
4. 创建定时任务，执行 `node index.js`。

### 环境变量配置
青龙面板支持通过环境变量配置，推荐使用以下变量名：
- `DB_HOST`: 数据库主机地址
- `DB_PORT`: 数据库端口
- `DB_NAME`: 数据库名称
- `DB_USER`: 数据库用户名
- `DB_PASSWORD`: 数据库密码
- `SPEEDTEST_SERVERS`: JSON格式的服务器配置数组

## 代码结构示例

### index.js 主要结构
```javascript
const { testServers } = require('./utils/speedtest');
const { saveResult, initDatabase } = require('./utils/database-native');
const config = require('./config.js');

async function main() {
  // 初始化数据库
  await initDatabase(config.database);
  
  // 测试所有服务器
  for (const server of config.servers) {
    try {
      const result = await testServers(server);
      await saveResult(result);
      console.log(`测试完成: ${server.name || server.url}`);
    } catch (error) {
      console.error(`测试失败: ${server.name || server.url}`, error);
    }
  }
  
  console.log('所有测试完成');
}

main().catch(console.error);
```

### config.example.js 配置示例
```javascript
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

### 环境变量配置示例
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