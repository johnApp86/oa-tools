@echo off
echo ========================================
echo          数据库重置脚本
echo ========================================
echo.

echo 正在停止服务器进程...
taskkill /f /im node.exe 2>nul || echo 没有运行的Node.js进程

echo.
echo 正在备份当前数据库...
if exist "server\database\oa.db" (
    copy "server\database\oa.db" "server\database\oa_backup_%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%.db" 2>nul
    echo 数据库已备份
) else (
    echo 数据库文件不存在，跳过备份
)

echo.
echo 正在删除旧数据库...
if exist "server\database\oa.db" (
    del "server\database\oa.db"
    echo 旧数据库已删除
)

echo.
echo 正在重新创建数据库...
cd server
node -e "
const db = require('./database/db');
const { initHRDatabase } = require('./database/hr-init');

// 创建基础表
db.serialize(() => {
  // 组织表
  db.run(\`CREATE TABLE IF NOT EXISTS organizations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    parent_id INTEGER,
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES organizations (id)
  )\`);

  // 岗位表
  db.run(\`CREATE TABLE IF NOT EXISTS positions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )\`);

  // 角色表
  db.run(\`CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )\`);

  // 菜单表
  db.run(\`CREATE TABLE IF NOT EXISTS menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT,
    icon TEXT,
    parent_id INTEGER,
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES menus (id)
  )\`);

  // 用户表
  db.run(\`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    real_name TEXT,
    email TEXT UNIQUE,
    phone TEXT,
    position_id INTEGER,
    organization_id INTEGER,
    status INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions (id),
    FOREIGN KEY (organization_id) REFERENCES organizations (id)
  )\`);

  // 用户角色关联表
  db.run(\`CREATE TABLE IF NOT EXISTS user_roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (role_id) REFERENCES roles (id),
    UNIQUE(user_id, role_id)
  )\`);

  // 角色菜单权限表
  db.run(\`CREATE TABLE IF NOT EXISTS role_menus (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    role_id INTEGER NOT NULL,
    menu_id INTEGER NOT NULL,
    permissions TEXT DEFAULT 'read',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles (id),
    FOREIGN KEY (menu_id) REFERENCES menus (id),
    UNIQUE(role_id, menu_id)
  )\`);

  console.log('基础表创建完成');
});

// 初始化HR数据库
initHRDatabase();

console.log('数据库初始化完成');
process.exit(0);
"

echo.
echo 正在插入基础数据...
node -e "
const db = require('./database/db');
const bcrypt = require('bcryptjs');

// 插入默认组织
db.run(\`INSERT OR IGNORE INTO organizations (id, name, code, parent_id, level, sort_order) VALUES 
  (1, '总公司', 'HQ', NULL, 1, 1),
  (2, '技术部', 'TECH', 1, 2, 1),
  (3, '人事部', 'HR', 1, 2, 2),
  (4, '财务部', 'FINANCE', 1, 2, 3)\`);

// 插入默认岗位
db.run(\`INSERT OR IGNORE INTO positions (id, name, code, level, sort_order) VALUES 
  (1, '总经理', 'GM', 1, 1),
  (2, '技术总监', 'CTO', 2, 1),
  (3, '人事经理', 'HRM', 2, 1),
  (4, '财务经理', 'CFM', 2, 1),
  (5, '软件工程师', 'SE', 3, 1),
  (6, '人事专员', 'HRS', 3, 1)\`);

// 插入默认角色
db.run(\`INSERT OR IGNORE INTO roles (id, name, code, description) VALUES 
  (1, '超级管理员', 'SUPER_ADMIN', '系统超级管理员，拥有所有权限'),
  (2, '管理员', 'ADMIN', '系统管理员'),
  (3, 'HR管理员', 'HR_ADMIN', 'HR模块管理员'),
  (4, '普通用户', 'USER', '普通用户')\`);

// 插入默认菜单
db.run(\`INSERT OR IGNORE INTO menus (id, name, path, icon, parent_id, level, sort_order) VALUES 
  (1, '系统管理', '/system', 'Setting', NULL, 1, 1),
  (2, '组织管理', '/system/organization', 'OfficeBuilding', 1, 2, 1),
  (3, '岗位管理', '/system/position', 'User', 1, 2, 2),
  (4, '用户管理', '/system/user', 'Avatar', 1, 2, 3),
  (5, '角色管理', '/system/role', 'UserFilled', 1, 2, 4),
  (6, '菜单管理', '/system/menu', 'Menu', 1, 2, 5),
  (7, 'HR管理', '/hr', 'UserFilled', NULL, 1, 2),
  (8, '招聘管理', '/hr/recruitment', 'Plus', 7, 2, 1),
  (9, '入职离职管理', '/hr/onboarding', 'User', 7, 2, 2),
  (10, '考勤管理', '/hr/attendance', 'Clock', 7, 2, 3),
  (11, '薪酬福利管理', '/hr/salary', 'Wallet', 7, 2, 4),
  (12, '档案管理', '/hr/employee', 'Document', 7, 2, 5),
  (13, '报表分析', '/hr/reports', 'DataAnalysis', 7, 2, 6)\`);

// 插入默认用户
const hashedPassword = bcrypt.hashSync('admin123', 10);
db.run(\`INSERT OR IGNORE INTO users (id, username, password, real_name, email, position_id, organization_id) VALUES 
  (1, 'admin', ?, '系统管理员', 'admin@example.com', 1, 1)\`, [hashedPassword]);

// 分配用户角色
db.run(\`INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (1, 1)\`);

// 分配角色菜单权限（超级管理员拥有所有权限）
const menuIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
menuIds.forEach(menuId => {
  db.run(\`INSERT OR IGNORE INTO role_menus (role_id, menu_id, permissions) VALUES (1, ?, 'read,create,update,delete')\`, [menuId]);
});

console.log('基础数据插入完成');
process.exit(0);
"

cd ..

echo.
echo ========================================
echo          数据库重置完成
echo ========================================
echo.
echo 默认账号信息：
echo 用户名: admin
echo 密码: admin123
echo.
echo 请重新启动服务器
echo.
pause
