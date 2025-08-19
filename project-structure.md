# LibreSpeed 测试脚本项目目录结构

## 推荐简化目录结构

```
scripts/
├── README.md                    # 项目说明文档
├── project-structure.md         # 目录结构说明（本文件）
├── package.json                 # 项目依赖配置
├── index.js                     # 主脚本文件
├── config.js                    # 配置文件
└── utils/
    ├── database-native.js       # 数据库操作工具
    └── speedtest.js             # 测速功能工具
```

## 文件功能说明

### 1. 主要文件
- **index.js**: 主脚本文件，包含所有核心逻辑，直接在青龙面板中运行。
- **config.js**: 配置文件，包含数据库连接信息和测试站点信息。
- **package.json**: 项目依赖配置，列出所需的npm包。

### 2. 工具文件
- **utils/database-native.js**: 数据库操作工具，处理MySQL连接、表创建和结果存储。
- **utils/speedtest.js**: 测速功能工具，调用LibreSpeed API并处理basic_auth认证。

## 实现优势

1. **极简设计**: 只使用必要的文件，减少复杂度。
2. **青龙面板友好**: 直接在青龙面板中运行，无需额外适配。
3. **配置简单**: 通过环境变量或配置文件轻松配置。
4. **功能聚焦**: 专注于测速和数据存储，不包含多余功能。

## 部署方式

### 青龙面板部署
1. 将所有文件上传到青龙面板的脚本目录。
2. 安装依赖：在青龙面板的脚本管理中添加依赖安装命令 `npm install axios mysql2`。
3. 配置环境变量（推荐）或修改config.js文件。
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

### config.js 配置示例
```javascript
module.exports = {
  // 优先使用环境变量，如果没有则使用默认值
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'speedtest_results',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || ''
  },
  
  // 服务器配置，支持环境变量
  servers: process.env.SPEEDTEST_SERVERS
    ? JSON.parse(process.env.SPEEDTEST_SERVERS)
    : [
        {
          name: "LibreSpeed官方测试",
          url: "https://librespeed.org/",
          username: "",
          password: ""
        }
      ]
};
```