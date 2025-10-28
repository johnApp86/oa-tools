# OA 管理系统

基于 Vue3 + Element Plus + Express + SQLite3 的现代化 OA 管理系统。

## 功能特性

- 🏢 **组织管理** - 支持多级组织架构管理
- 👥 **用户管理** - 完整的用户信息管理和权限控制
- 🎭 **角色管理** - 基于角色的权限控制系统
- 📋 **岗位管理** - 灵活的岗位设置和管理
- 🍔 **菜单管理** - 动态菜单配置和权限分配
- 🔐 **权限控制** - 细粒度的菜单和功能权限管理
- 🎨 **明亮主题** - 现代化的明亮风格界面设计
- 📱 **响应式设计** - 支持各种设备尺寸

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
│   │   ├── views/         # 页面组件
│   │   └── style.css      # 全局样式
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── server/                # 后端项目
│   ├── database/          # 数据库相关
│   ├── routes/            # 路由处理
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

### 用户管理

- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户
- `DELETE /api/users/:id` - 删除用户
- `PUT /api/users/:id/reset-password` - 重置密码

### 组织管理

- `GET /api/organizations` - 获取组织列表
- `GET /api/organizations/tree` - 获取组织树
- `POST /api/organizations` - 创建组织
- `PUT /api/organizations/:id` - 更新组织
- `DELETE /api/organizations/:id` - 删除组织

### 岗位管理

- `GET /api/positions` - 获取岗位列表
- `POST /api/positions` - 创建岗位
- `PUT /api/positions/:id` - 更新岗位
- `DELETE /api/positions/:id` - 删除岗位

### 角色管理

- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色

### 菜单管理

- `GET /api/menus` - 获取菜单列表
- `GET /api/menus/tree` - 获取菜单树
- `POST /api/menus` - 创建菜单
- `PUT /api/menus/:id` - 更新菜单
- `DELETE /api/menus/:id` - 删除菜单

## 数据库设计

系统使用 SQLite 数据库，包含以下主要表：

- `organizations` - 组织表
- `positions` - 岗位表
- `users` - 用户表
- `roles` - 角色表
- `menus` - 菜单表
- `user_roles` - 用户角色关联表
- `role_menus` - 角色菜单权限表

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

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件
- 微信交流

---

**注意**: 这是一个演示项目，生产环境使用前请进行充分的安全测试和性能优化。
