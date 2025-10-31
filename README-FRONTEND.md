# 前端开发文档

## 技术栈

- Vue 3.3+ - 渐进式 JavaScript 框架
- Vite 4.4+ - 快速的前端构建工具
- Element Plus 2.3+ - Vue 3 组件库
- Vue Router 4.2+ - 官方路由管理器
- Pinia 2.1+ - Vue 状态管理库
- Axios 1.4+ - HTTP 客户端

## 项目结构

```
client/
├── src/
│   ├── api/              # API接口
│   │   ├── request.js   # Axios请求封装
│   │   ├── auth.js      # 认证接口
│   │   ├── user.js      # 用户接口
│   │   ├── organization.js  # 组织接口
│   │   ├── position.js  # 岗位接口
│   │   ├── role.js      # 角色接口
│   │   ├── menu.js      # 菜单接口
│   │   ├── hr.js        # HR接口
│   │   └── finance.js   # 财务接口
│   ├── components/      # 公共组件
│   ├── layout/          # 布局组件
│   │   └── Layout.vue  # 主布局
│   ├── router/          # 路由配置
│   │   └── index.js    # 路由定义
│   ├── stores/         # 状态管理
│   │   └── user.js    # 用户状态
│   ├── styles/         # 样式文件
│   │   └── common.css # 公共样式
│   ├── views/          # 页面组件
│   │   ├── Login.vue  # 登录页
│   │   ├── Register.vue # 注册页
│   │   ├── Dashboard.vue # 仪表盘
│   │   ├── system/     # 系统管理页面
│   │   ├── hr/         # HR管理页面
│   │   └── finance/    # 财务管理页面
│   ├── App.vue         # 根组件
│   ├── main.js         # 入口文件
│   └── style.css       # 全局样式
├── index.html          # HTML模板
├── package.json        # 依赖配置
└── vite.config.js      # Vite配置
```

## 开发指南

### 环境要求

- Node.js 16.0+
- npm 8.0+

### 安装依赖

```bash
cd client
npm install
```

### 启动开发服务器

```bash
npm run dev
```

开发服务器将在 `http://localhost:3000` 启动，并自动代理API请求到后端服务器 `http://localhost:3001`。

### 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

## API请求封装

### 请求配置

所有API请求都通过 `src/api/request.js` 封装，配置了：

- 基础URL: `/api`
- 请求超时: 10秒
- 自动添加Authorization token
- 统一错误处理
- 响应拦截

### 使用示例

```javascript
import request from '@/api/request'

// GET请求
export const getUsers = () => {
  return request({
    url: '/system/users',
    method: 'get'
  })
}

// POST请求
export const createUser = (data) => {
  return request({
    url: '/system/users',
    method: 'post',
    data
  })
}
```

## 状态管理

使用 Pinia 进行状态管理，主要存储：

- 用户信息（token、用户资料等）
- 登录状态
- 权限信息

### 使用示例

```javascript
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

// 获取用户信息
const user = userStore.user

// 检查是否已登录
if (userStore.isLoggedIn) {
  // 已登录逻辑
}
```

## 路由配置

路由定义在 `src/router/index.js`，包括：

- 登录/注册路由
- 系统管理路由
- HR管理路由
- 财务管理路由

### 路由守卫

所有需要登录的页面都配置了路由守卫，未登录用户将被重定向到登录页。

## 组件开发

### 页面组件

页面组件位于 `src/views/` 目录，按照功能模块组织。

### 公共组件

公共组件位于 `src/components/` 目录，可以在多个页面中复用。

## 样式规范

- 全局样式定义在 `src/style.css`
- 公共样式定义在 `src/styles/common.css`
- 组件样式使用 `<style scoped>` 定义局部样式

## 开发建议

1. **API调用**: 所有API调用都应在对应的 `src/api/` 文件中封装
2. **状态管理**: 全局状态使用Pinia管理，组件内部状态使用 `ref` 或 `reactive`
3. **组件复用**: 可复用的逻辑应抽取为公共组件或组合式函数
4. **错误处理**: API调用错误已在request.js中统一处理，组件中可根据需要进行额外处理
5. **代码规范**: 遵循Vue 3组合式API的编码规范

## 常见问题

### 代理配置

开发环境的API代理配置在 `vite.config.js` 中：

```javascript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

### 跨域问题

开发环境通过Vite代理解决，生产环境需要后端配置CORS。

### Token过期

Token过期时会自动清除登录状态并跳转到登录页。

