# 后端开发文档

## 技术栈

- Node.js - JavaScript 运行时
- Express 4.18+ - Web 应用框架
- SQLite3 5.1+ - 轻量级数据库
- bcryptjs 2.4+ - 密码加密
- jsonwebtoken 9.0+ - JWT 认证
- express-validator 7.0+ - 数据验证

## 项目结构

```
server/
├── core/                    # 核心功能
│   ├── database/           # 数据库相关
│   │   ├── db-connection.js  # 数据库连接
│   │   ├── hr-tables.js     # HR表初始化
│   │   └── finance-tables.js # 财务表初始化
│   ├── middleware/         # 中间件
│   │   └── auth.js         # 认证中间件
│   └── utils/              # 工具函数
│       ├── logger.js       # 日志工具
│       ├── response.js    # 响应格式化
│       └── validation.js  # 验证工具
├── modules/                # 业务模块
│   ├── auth/              # 认证模块
│   │   └── routes/       # 认证路由
│   ├── system/            # 系统管理模块
│   │   ├── controllers/  # 控制器
│   │   └── routes/       # 路由
│   ├── hr/               # 人力资源模块
│   │   ├── controllers/  # 控制器
│   │   └── routes/       # 路由
│   └── finance/          # 财务管理模块
│       ├── controllers/  # 控制器
│       └── routes/       # 路由
├── database/             # 数据库初始化
│   └── system-init.js   # 系统表初始化
├── config/              # 配置文件
├── index.js             # 服务器入口
└── package.json         # 依赖配置
```

## 开发指南

### 环境要求

- Node.js 16.0+
- npm 8.0+

### 安装依赖

```bash
cd server
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:3001` 启动，支持热重载。

### 启动生产服务器

```bash
npm start
```

## 模块化架构

后端采用模块化架构，按业务功能划分为：

### 认证模块 (`modules/auth`)

- 用户登录
- 用户注册
- 获取用户信息

### 系统管理模块 (`modules/system`)

- 组织管理
- 岗位管理
- 用户管理
- 角色管理
- 菜单管理

### 人力资源模块 (`modules/hr`)

- 招聘管理
- 入职离职管理
- 考勤管理
- 请假管理
- 薪酬管理
- 员工档案
- 报表统计

### 财务管理模块 (`modules/finance`)

- 总账管理
- 应收账款
- 应付账款
- 固定资产
- 现金管理
- 成本核算
- 预算管理
- 财务报表
- 税务管理
- 费用管理

## API路由规范

### 路由前缀

- 认证模块: `/api/auth`
- 系统管理: `/api/system`
- HR管理: `/api/hr`
- 财务管理: `/api/finance`

### 兼容性路由

为了保持向后兼容，保留了旧的API路径：

- `/api/organizations` → `/api/system/organizations`
- `/api/positions` → `/api/system/positions`
- `/api/users` → `/api/system/users`
- `/api/menus` → `/api/system/menus`
- `/api/roles` → `/api/system/roles`

## 数据库

### 数据库文件

数据库文件位于 `core/database/oa.db`（SQLite）

### 数据库初始化

系统启动时自动初始化数据库表：

- 系统表（用户、组织、岗位、角色、菜单等）
- HR表（招聘、入职、考勤、薪酬等）
- 财务表（总账、应收、应付、资产等）

### 数据库操作

使用 SQLite3 进行数据库操作，统一通过 `core/database/db-connection.js` 连接。

## 认证与授权

### JWT认证

使用JWT进行用户认证：

1. 用户登录后生成JWT token
2. 前端在请求头中携带token: `Authorization: Bearer <token>`
3. 后端通过 `core/middleware/auth.js` 验证token

### 使用示例

```javascript
const { verifyToken } = require('../core/middleware/auth')

router.get('/profile', verifyToken, (req, res) => {
  // req.user 包含解码后的用户信息
  const userId = req.user.userId
  // ...
})
```

## 数据验证

使用 express-validator 进行请求数据验证：

```javascript
const { body, validationResult } = require('express-validator')

router.post('/users', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确')
], (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg })
  }
  // ...
})
```

## 响应格式

统一使用JSON格式响应：

```javascript
// 成功响应
res.json({
  data: {...},
  message: '操作成功'
})

// 错误响应
res.status(400).json({
  message: '错误信息'
})
```

## 错误处理

- 400: 请求参数错误
- 401: 未授权（token无效或过期）
- 404: 资源不存在
- 500: 服务器内部错误

## CORS配置

已配置CORS，允许前端跨域访问：

```javascript
app.use(cors())
```

## 添加新模块

1. 在 `modules/` 目录下创建新模块目录
2. 创建 `routes/` 和 `controllers/` 目录
3. 在 `routes/index.js` 中导出路由
4. 在 `index.js` 中注册路由：

```javascript
const newModuleRoutes = require('./modules/newModule/routes')
app.use('/api/new-module', newModuleRoutes)
```

## 日志记录

使用 `core/utils/logger.js` 进行日志记录（如需扩展）。

## 常见问题

### 数据库连接失败

检查数据库文件路径和权限。

### Token验证失败

检查JWT_SECRET配置是否一致。

### 跨域问题

已配置CORS，如仍有问题检查前端代理配置。

### 端口占用

修改 `index.js` 中的 PORT 配置，默认端口为3001。

