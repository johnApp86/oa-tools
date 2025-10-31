# OA 管理系统

基于 Vue3 + Element Plus + Express + SQLite3 的现代化 OA 管理系统。

## 功能特性

### 系统管理

- 🏢 **组织管理** - 支持多级组织架构管理
- 👥 **用户管理** - 完整的用户信息管理和权限控制
- 🎭 **角色管理** - 基于角色的权限控制系统
- 📋 **岗位管理** - 灵活的岗位设置和管理
- 🍔 **菜单管理** - 动态菜单配置和权限分配
- 🔐 **权限控制** - 细粒度的菜单和功能权限管理

### HR 管理

- 📝 **招聘管理** - 职位发布、简历管理、面试安排
- 👤 **入职离职管理** - 入职申请、离职申请、状态跟踪
- ⏰ **考勤管理** - 签到签退、请假管理、考勤统计
- 💰 **薪酬福利** - 薪资记录、福利管理、薪酬统计
- 📊 **员工档案** - 员工信息管理、档案维护
- 📈 **报表分析** - 数据统计、图表展示、分析报告

### 界面特性

- 🎨 **统一设计** - 现代化的明亮风格界面设计
- 📱 **响应式设计** - 支持各种设备尺寸
- 🎯 **用户体验** - 直观易用的操作界面

## 技术栈

### 前端

- Vue 3.3+ - 渐进式 JavaScript 框架
- Vite 4.4+ - 快速的前端构建工具
- Element Plus 2.3+ - Vue 3 组件库
- Vue Router 4.2+ - 官方路由管理器
- Pinia 2.1+ - Vue 状态管理库
- Axios 1.4+ - HTTP 客户端

### 后端

- Node.js - JavaScript 运行时
- Express 4.18+ - Web 应用框架
- SQLite3 5.1+ - 轻量级数据库
- bcryptjs 2.4+ - 密码加密
- jsonwebtoken 9.0+ - JWT 认证
- express-validator 7.0+ - 数据验证

## 项目结构

```
oa-tools/
├── client/                 # 前端项目
│   ├── src/
│   │   ├── api/           # API接口
│   │   ├── components/    # 公共组件
│   │   ├── layout/        # 布局组件
│   │   ├── router/        # 路由配置
│   │   ├── stores/        # 状态管理
│   │   ├── styles/        # 样式文件
│   │   ├── views/         # 页面组件
│   │   └── style.css      # 全局样式
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                # 后端项目
│   ├── core/              # 核心功能
│   │   ├── database/      # 数据库相关
│   │   │   ├── db-connection.js  # 数据库连接
│   │   │   ├── hr-tables.js      # HR表初始化
│   │   │   ├── finance-tables.js # 财务表初始化
│   │   │   └── system-init.js    # 示例数据初始化
│   │   └── middleware/    # 中间件
│   ├── modules/           # 业务模块
│   │   ├── auth/          # 认证模块
│   │   ├── system/        # 系统管理模块
│   │   ├── hr/            # HR模块
│   │   └── finance/       # 财务模块
│   ├── index.js           # 服务器入口
│   └── package.json
├── package.json           # 根项目配置
└── README.md
```

## 快速开始

### 环境要求

- Node.js 16.0+
- npm 8.0+

### 安装依赖

```bash
# 安装所有依赖
npm run install-all
```

### 启动开发服务器

```bash
# 同时启动前后端服务
npm run dev
```

或者分别启动：

```bash
# 启动后端服务 (端口: 3001)
npm run server

# 启动前端服务 (端口: 3000)
npm run client
```

### 访问应用

- 前端地址: http://localhost:3000
- 后端 API: http://localhost:3001/api

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

## 开发指南

### 前端开发

```bash
cd client
npm install
npm run dev
```

### 后端开发

```bash
cd server
npm install
npm run dev
```

### 构建生产版本

```bash
# 构建前端
npm run build

# 启动生产服务器
npm start
```

## API 接口

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/profile` - 获取用户信息

### 系统管理

#### 用户管理

- `GET /api/system/users` - 获取用户列表
- `POST /api/system/users` - 创建用户
- `PUT /api/system/users/:id` - 更新用户
- `DELETE /api/system/users/:id` - 删除用户

#### 组织管理

- `GET /api/system/organizations` - 获取组织列表
- `GET /api/system/organizations/tree` - 获取组织树
- `GET /api/system/organizations/all` - 获取所有组织（用于下拉选择）
- `POST /api/system/organizations` - 创建组织
- `PUT /api/system/organizations/:id` - 更新组织
- `DELETE /api/system/organizations/:id` - 删除组织

#### 岗位管理

- `GET /api/system/positions` - 获取岗位列表
- `GET /api/system/positions/all` - 获取所有岗位（用于下拉选择）
- `POST /api/system/positions` - 创建岗位
- `PUT /api/system/positions/:id` - 更新岗位
- `DELETE /api/system/positions/:id` - 删除岗位

#### 角色管理

- `GET /api/system/roles` - 获取角色列表
- `GET /api/system/roles/all` - 获取所有角色（用于下拉选择）
- `POST /api/system/roles` - 创建角色
- `PUT /api/system/roles/:id` - 更新角色
- `DELETE /api/system/roles/:id` - 删除角色

#### 菜单管理

- `GET /api/system/menus` - 获取菜单列表
- `GET /api/system/menus/tree` - 获取菜单树
- `POST /api/system/menus` - 创建菜单
- `PUT /api/system/menus/:id` - 更新菜单
- `DELETE /api/system/menus/:id` - 删除菜单

### HR 管理

#### 招聘管理

- `GET /api/hr/recruitment/positions` - 获取招聘职位列表
- `POST /api/hr/recruitment/positions` - 创建招聘职位
- `DELETE /api/hr/recruitment/positions/:id` - 删除招聘职位
- `GET /api/hr/recruitment/resumes` - 获取简历列表
- `POST /api/hr/recruitment/resumes` - 提交简历

#### 入职离职管理

- `GET /api/hr/onboarding/applications` - 获取入职申请列表
- `POST /api/hr/onboarding/applications` - 创建入职申请
- `GET /api/hr/onboarding/offboarding/applications` - 获取离职申请列表
- `POST /api/hr/onboarding/offboarding/applications` - 创建离职申请

#### 考勤管理

- `GET /api/hr/attendance/records` - 获取考勤记录
- `POST /api/hr/attendance/checkin` - 签到/签退（通过 type 参数区分：'in' 签到，'out' 签退）

#### 请假管理

- `GET /api/hr/leave/applications` - 获取请假申请列表
- `POST /api/hr/leave/applications` - 创建请假申请

#### 薪酬管理

- `GET /api/hr/salary/records` - 获取薪酬记录
- `POST /api/hr/salary/records` - 创建薪酬记录
- `DELETE /api/hr/salary/records/:id` - 删除薪酬记录

#### 员工档案

- `GET /api/hr/employee/files` - 获取员工档案
- `POST /api/hr/employee/files` - 创建员工档案
- `DELETE /api/hr/employee/files/:id` - 删除员工档案

#### 报表统计

- `GET /api/hr/reports/attendance` - 获取考勤报表
- `GET /api/hr/reports/salary` - 获取薪酬报表

### 财务管理

#### 总账管理

- `GET /api/finance/general-ledger/accounts` - 获取总账科目列表
- `POST /api/finance/general-ledger/accounts` - 创建总账科目
- `PUT /api/finance/general-ledger/accounts/:id` - 更新总账科目
- `DELETE /api/finance/general-ledger/accounts/:id` - 删除总账科目
- `GET /api/finance/general-ledger/vouchers` - 获取总账凭证列表
- `POST /api/finance/general-ledger/vouchers` - 创建总账凭证
- `GET /api/finance/general-ledger/balances` - 获取总账余额

#### 应收账款

- `GET /api/finance/accounts-receivable` - 获取应收账款列表
- `POST /api/finance/accounts-receivable` - 创建应收账款
- `PUT /api/finance/accounts-receivable/:id` - 更新应收账款
- `DELETE /api/finance/accounts-receivable/:id` - 删除应收账款
- `POST /api/finance/accounts-receivable/:id/payments` - 添加收款记录

#### 应付账款

- `GET /api/finance/accounts-payable` - 获取应付账款列表
- `POST /api/finance/accounts-payable` - 创建应付账款
- `PUT /api/finance/accounts-payable/:id` - 更新应付账款
- `DELETE /api/finance/accounts-payable/:id` - 删除应付账款
- `POST /api/finance/accounts-payable/:id/payments` - 添加付款记录

#### 固定资产

- `GET /api/finance/fixed-assets` - 获取固定资产列表
- `POST /api/finance/fixed-assets` - 创建固定资产
- `PUT /api/finance/fixed-assets/:id` - 更新固定资产
- `DELETE /api/finance/fixed-assets/:id` - 删除固定资产
- `POST /api/finance/fixed-assets/:id/depreciation` - 计提折旧

#### 资金管理

- `GET /api/finance/cash-management/accounts` - 获取资金账户列表
- `POST /api/finance/cash-management/accounts` - 创建资金账户
- `GET /api/finance/cash-management/transactions` - 获取资金流水
- `POST /api/finance/cash-management/transactions` - 创建资金流水
- `PUT /api/finance/cash-management/transactions/:id` - 更新资金流水
- `DELETE /api/finance/cash-management/transactions/:id` - 删除资金流水
- `GET /api/finance/cash-management/balances` - 获取账户余额
- `POST /api/finance/cash-management/transfer` - 资金调拨

#### 成本管理

- `GET /api/finance/cost-accounting/cost-centers` - 获取成本中心列表
- `POST /api/finance/cost-accounting/cost-centers` - 创建成本中心
- `PUT /api/finance/cost-accounting/cost-centers/:id` - 更新成本中心
- `DELETE /api/finance/cost-accounting/cost-centers/:id` - 删除成本中心
- `GET /api/finance/cost-accounting/allocations` - 获取成本分配
- `POST /api/finance/cost-accounting/allocations` - 创建成本分配

#### 预算管理

- `GET /api/finance/budgeting` - 获取预算列表
- `POST /api/finance/budgeting` - 创建预算
- `PUT /api/finance/budgeting/:id` - 更新预算
- `DELETE /api/finance/budgeting/:id` - 删除预算
- `GET /api/finance/budgeting/:id/execution` - 获取预算执行情况

#### 财务报表

- `GET /api/finance/financial-reporting/balance-sheet` - 获取资产负债表
- `GET /api/finance/financial-reporting/income-statement` - 获取利润表
- `GET /api/finance/financial-reporting/cash-flow` - 获取现金流量表
- `GET /api/finance/financial-reporting/financial-ratios` - 获取财务指标

#### 税务管理

- `GET /api/finance/tax-management/declarations` - 获取税务申报记录
- `POST /api/finance/tax-management/declarations` - 创建税务申报
- `PUT /api/finance/tax-management/:id` - 更新税务申报
- `DELETE /api/finance/tax-management/:id` - 删除税务申报

#### 费用管理

- `GET /api/finance/expense-management/applications` - 获取费用申请列表
- `POST /api/finance/expense-management/applications` - 创建费用申请
- `PUT /api/finance/expense-management/applications/:id/approve` - 审批费用申请
- `PUT /api/finance/expense-management/applications/:id/reject` - 拒绝费用申请
- `GET /api/finance/expense-management/statistics` - 获取费用统计

## 数据库设计

系统使用 SQLite 数据库，包含以下主要表：

- `organizations` - 组织表
- `positions` - 岗位表
- `users` - 用户表
- `roles` - 角色表
- `menus` - 菜单表
- `user_roles` - 用户角色关联表
- `role_menus` - 角色菜单权限表
- `recruitment_positions` - 招聘职位表
- `onboarding_applications` - 入职申请表
- `offboarding_applications` - 离职申请表
- `attendance_records` - 考勤记录表
- `salary_records` - 薪酬记录表
- `employee_files` - 员工档案表

## 权限控制

系统采用基于角色的权限控制(RBAC)模型：

1. **用户** - 系统使用者
2. **角色** - 权限的集合
3. **菜单** - 系统功能模块
4. **权限** - 具体的操作权限

用户通过角色获得权限，角色通过菜单分配权限。

## 部署说明

### 生产环境部署

1. 构建前端项目

```bash
npm run build
```

2. 启动生产服务器

```bash
npm start
```

### Docker 部署

```dockerfile
# Dockerfile示例
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3001
CMD ["npm", "start"]
```

## 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 更新日志

### 2025-01-XX 最新更新

#### 修复内容

1. **状态显示问题**

   - ✅ 修复所有财务模块页面状态显示不正确的问题
   - ✅ 支持数字状态（兼容数据库 INTEGER 类型）和字符串状态
   - ✅ 状态标签统一显示中文文字，不再显示数字

2. **日期显示问题**

   - ✅ 统一所有页面的日期格式化处理
   - ✅ 添加 `formatDate()` 函数统一格式化日期显示
   - ✅ 空值日期统一显示为 "-"

3. **数字显示问题**

   - ✅ 统一所有页面的金额格式化处理
   - ✅ 改进 `formatCurrency()` 函数，正确处理空值和零值
   - ✅ 统一数字格式（千分位分隔符，保留 2 位小数）

4. **表单字段完善**

   - ✅ 税务管理模块添加缺失的字段（申报日期、截止日期、描述）
   - ✅ 费用管理模块修复创建费用申请的问题
   - ✅ 统一使用日期选择器组件，规范日期输入格式

5. **API 路径规范**

   - ✅ 系统管理模块 API 路径统一使用 `/api/system/*` 前缀
   - ✅ 移除系统模块的兼容性路由，避免路径混淆
   - ✅ 所有前端 API 文件更新为新的路径结构

6. **数据验证改进**

   - ✅ 统一验证器定义位置（控制器中定义，不在路由中重复）
   - ✅ 改进数字类型验证，支持字符串和数字两种格式
   - ✅ 添加详细的错误日志记录，便于问题排查

7. **数据库初始化优化**
   - ✅ 明确数据库初始化流程（自动创建表结构，手动插入示例数据）
   - ✅ 优化示例数据初始化脚本，确保数据完整性

#### 修复的页面

- ✅ 总账管理 (GeneralLedger.vue)
- ✅ 应收账款 (AccountsReceivable.vue)
- ✅ 应付账款 (AccountsPayable.vue)
- ✅ 固定资产 (FixedAssets.vue)
- ✅ 资金管理 (CashManagement.vue)
- ✅ 成本管理 (CostAccounting.vue)
- ✅ 预算管理 (Budgeting.vue)
- ✅ 财务报表 (FinancialReporting.vue)
- ✅ 税务管理 (TaxManagement.vue)
- ✅ 费用管理 (ExpenseManagement.vue)

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 微信交流

---

**注意**: 这是一个演示项目，生产环境使用前请进行充分的安全测试和性能优化。
