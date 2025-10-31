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
│   │   ├── db-connection.js  # 数据库连接（启动时创建核心表）
│   │   ├── hr-tables.js     # HR表初始化
│   │   ├── finance-tables.js # 财务表初始化
│   │   └── system-init.js    # 示例数据初始化（手动执行）
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

## API 路由规范

### 路由前缀

- 认证模块: `/api/auth`
- 系统管理: `/api/system`
- HR 管理: `/api/hr`
- 财务管理: `/api/finance`

### 路由规范

所有 API 路由按模块划分：

- **认证模块**: `/api/auth/*`
- **系统管理模块**: `/api/system/*`
  - `/api/system/users` - 用户管理
  - `/api/system/organizations` - 组织管理
  - `/api/system/positions` - 岗位管理
  - `/api/system/roles` - 角色管理
  - `/api/system/menus` - 菜单管理
- **HR 模块**: `/api/hr/*`
  - `/api/hr/recruitment/*` - 招聘管理
  - `/api/hr/onboarding/*` - 入职离职管理
  - `/api/hr/attendance/*` - 考勤管理
  - `/api/hr/leave/*` - 请假管理
  - `/api/hr/salary/*` - 薪酬管理
  - `/api/hr/employee/*` - 员工档案
  - `/api/hr/reports/*` - 报表统计
- **财务模块**: `/api/finance/*`
  - `/api/finance/general-ledger/*` - 总账管理
  - `/api/finance/accounts-receivable/*` - 应收账款
  - `/api/finance/accounts-payable/*` - 应付账款
  - `/api/finance/fixed-assets/*` - 固定资产
  - `/api/finance/cash-management/*` - 资金管理
  - `/api/finance/cost-accounting/*` - 成本管理
  - `/api/finance/budgeting/*` - 预算管理
  - `/api/finance/financial-reporting/*` - 财务报表
  - `/api/finance/tax-management/*` - 税务管理
  - `/api/finance/expense-management/*` - 费用管理

## 数据库

### 数据库文件

数据库文件位于 `core/database/oa.db`（SQLite）

### 数据库初始化

数据库初始化分为两个阶段：

1. **自动初始化**（服务器启动时）：

   - `db-connection.js` - 创建核心系统表（organizations, positions, users, menus, roles 等）并插入最小初始数据（如默认管理员账户）
   - `hr-tables.js` - 创建 HR 模块表（recruitment_positions, onboarding_applications, attendance_records 等）
   - `finance-tables.js` - 创建财务模块表（general_ledger_accounts, accounts_receivable, fixed_assets 等）

2. **手动初始化**（需要时执行）：
   - `system-init.js` - 插入完整的示例数据到所有表（系统、HR、财务模块）

#### 初始化示例数据

执行 `system-init.js` 插入示例数据：

```bash
# Windows
cd server
node core/database/system-init.js

# 或使用批处理脚本
bat\init-db.bat
```

**注意**:

- 系统表结构在服务器启动时自动创建
- 示例数据需要手动执行 `system-init.js` 插入
- 执行前会清空现有数据（使用 `INSERT OR REPLACE`）

### 数据库操作

使用 SQLite3 进行数据库操作，统一通过 `core/database/db-connection.js` 连接。

## 认证与授权

### JWT 认证

使用 JWT 进行用户认证：

1. 用户登录后生成 JWT token
2. 前端在请求头中携带 token: `Authorization: Bearer <token>`
3. 后端通过 `core/middleware/auth.js` 验证 token

### 使用示例

```javascript
const { verifyToken } = require("../core/middleware/auth");

router.get("/profile", verifyToken, (req, res) => {
  // req.user 包含解码后的用户信息
  const userId = req.user.userId;
  // ...
});
```

## 数据验证

使用 express-validator 进行请求数据验证：

### 验证器定义

验证器应在控制器中定义，不要在路由中重复定义：

```javascript
// controllers/exampleController.js
exports.createExample = [
  body("name").notEmpty().withMessage("名称不能为空"),
  body("amount")
    .custom((value) => {
      if (value === undefined || value === null || value === "") {
        throw new Error("金额不能为空");
      }
      const numValue = typeof value === "string" ? parseFloat(value) : value;
      if (isNaN(numValue) || numValue <= 0) {
        throw new Error("金额必须是大于0的数字");
      }
      return true;
    })
    .withMessage("金额必须是数字"),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }
    // ...
  },
];
```

### 路由使用

```javascript
// routes/example.js
router.post("/examples", exampleController.createExample);
```

## 响应格式

统一使用 JSON 格式响应：

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

### HTTP 状态码

- **400**: 请求参数错误（验证失败）
- **401**: 未授权（token 无效或过期）
- **404**: 资源不存在
- **500**: 服务器内部错误

### 错误响应格式

```javascript
// 验证错误
res.status(400).json({ message: "错误信息" });

// 数据库错误（带详细错误信息用于调试）
res.status(500).json({ message: "操作失败", error: err.message });
```

### 日志记录

所有错误都应记录日志，便于调试：

```javascript
db.run(sql, params, function (err) {
  if (err) {
    console.error("操作失败:", err);
    return res.status(500).json({ message: "操作失败", error: err.message });
  }
  // ...
});
```

## CORS 配置

已配置 CORS，允许前端跨域访问：

```javascript
app.use(cors());
```

## 添加新模块

1. 在 `modules/` 目录下创建新模块目录
2. 创建 `routes/` 和 `controllers/` 目录
3. 在 `routes/index.js` 中导出路由
4. 在 `index.js` 中注册路由：

```javascript
const newModuleRoutes = require("./modules/newModule/routes");
app.use("/api/new-module", newModuleRoutes);
```

## 日志记录

使用 `core/utils/logger.js` 进行日志记录（如需扩展）。

## 常见问题

### 数据库连接失败

检查数据库文件路径和权限。

### Token 验证失败

检查 JWT_SECRET 配置是否一致。

### 跨域问题

已配置 CORS，如仍有问题检查前端代理配置。

### 端口占用

修改 `index.js` 中的 PORT 配置，默认端口为 3001。
