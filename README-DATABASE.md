# 数据库管理说明

## 📁 目录结构

```
oa-tools/
├── server/
│   └── database/      # 数据库相关文件目录
│       ├── db.js      # 数据库连接配置
│       ├── hr-init.js # HR模块初始化
│       ├── init-db.js # 数据库初始化脚本
│       ├── reset-db.js# 数据库重置脚本
│       └── oa.db      # SQLite数据库文件
├── bat/              # 批处理脚本目录
│   ├── menu.bat      # 主菜单
│   ├── install.bat   # 安装依赖
│   ├── init-db.bat   # 初始化数据库
│   ├── reset-db.bat  # 重置数据库
│   ├── clean.bat     # 清理项目
│   └── start.bat     # 快速启动
└── package.json      # NPM脚本配置
```

## 📋 脚本说明

### 批处理脚本 (bat 目录)

- **`menu.bat`** - 主菜单（推荐使用）
- **`install.bat`** - 安装所有依赖
- **`init-db.bat`** - 初始化数据库
- **`reset-db.bat`** - 重置数据库
- **`clean.bat`** - 清理项目文件
- **`start.bat`** - 快速启动系统

### JavaScript 脚本 (server/database 目录)

- **`db.js`** - 数据库连接配置
- **`hr-init.js`** - HR 模块数据库初始化
- **`init-db.js`** - 数据库初始化逻辑
- **`reset-db.js`** - 数据库重置逻辑

## 🚀 快速开始

### 方式一：使用主菜单（推荐）

```bash
# 运行主菜单
bat\menu.bat

# 或使用NPM命令
npm run menu
```

### 方式二：分步执行

```bash
# 1. 安装依赖
bat\install.bat

# 2. 初始化数据库
bat\init-db.bat

# 3. 启动系统
bat\start.bat
```

### 方式三：使用 NPM 命令

```bash
# 安装依赖
npm run install-all

# 初始化数据库
npm run init-db

# 重置数据库
npm run reset-db

# 清理项目
npm run clean

# 启动系统
npm run dev
```

## 🔑 默认账号

- **用户名**: `admin`
- **密码**: `admin123`

## 📊 数据库表结构

### 系统管理表

- `organizations` - 组织表
- `positions` - 岗位表
- `roles` - 角色表
- `menus` - 菜单表
- `users` - 用户表
- `user_roles` - 用户角色关联表
- `role_menus` - 角色菜单权限表

### HR 管理表

- `recruitment_positions` - 招聘职位表
- `resumes` - 简历表
- `onboarding_applications` - 入职申请表
- `offboarding_applications` - 离职申请表
- `attendance_records` - 考勤记录表
- `leave_applications` - 请假申请表
- `salary_records` - 薪酬记录表
- `employee_files` - 员工档案表

## ⚠️ 注意事项

1. **init-db.js**: 仅在数据库不存在时创建，不会覆盖现有数据
2. **reset-db.js**: 会删除现有数据库并重新创建，**数据会丢失**
3. **clean.bat**: 清理所有生成的文件，包括数据库
4. 运行脚本前请确保已安装所有依赖

## 🔧 故障排除

### 数据库文件损坏

```bash
bat\reset-db.bat
```

### 清理所有文件重新开始

```bash
bat\clean.bat
bat\init-db.bat
bat\start.bat
```

### 端口冲突

检查并关闭占用 3000 和 3001 端口的进程

## 📝 使用建议

1. **首次使用**: 运行 `bat\menu.bat` 选择相应选项
2. **日常开发**: 使用 `bat\start.bat` 快速启动
3. **重新开始**: 使用 `bat\clean.bat` 清理后重新初始化
4. **生产部署**: 使用 `npm run build` 构建后 `npm start` 启动
