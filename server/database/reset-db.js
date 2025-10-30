const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, 'oa.db');

console.log('========================================');
console.log('          数据库重置脚本');
console.log('========================================');
console.log();

// 删除现有数据库文件
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✓ 已删除现有数据库文件');
} else {
  console.log('- 数据库文件不存在，将创建新数据库');
}

// 重新创建数据库
const db = new sqlite3.Database(dbPath);
console.log('✓ 数据库连接已建立');

// 创建表结构
const createTables = () => {
  return new Promise((resolve, reject) => {
    // 组织表
    db.run(`
      CREATE TABLE organizations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE,
        parent_id INTEGER,
        level INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 岗位表
    db.run(`
      CREATE TABLE positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE,
        organization_id INTEGER,
        level INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id)
      )
    `);

    // 角色表
    db.run(`
      CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE,
        description TEXT,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 菜单表
    db.run(`
      CREATE TABLE menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(100) NOT NULL,
        path VARCHAR(200),
        component VARCHAR(200),
        icon VARCHAR(50),
        parent_id INTEGER,
        level INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        type INTEGER DEFAULT 1,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 用户表
    db.run(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        real_name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        organization_id INTEGER,
        position_id INTEGER,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations(id),
        FOREIGN KEY (position_id) REFERENCES positions(id)
      )
    `);

    // 用户角色关联表
    db.run(`
      CREATE TABLE user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        role_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (role_id) REFERENCES roles(id),
        UNIQUE(user_id, role_id)
      )
    `);

    // 角色菜单权限表
    db.run(`
      CREATE TABLE role_menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER,
        menu_id INTEGER,
        permissions VARCHAR(500),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id),
        FOREIGN KEY (menu_id) REFERENCES menus(id),
        UNIQUE(role_id, menu_id)
      )
    `, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// 插入初始数据
const insertInitialData = () => {
  return new Promise((resolve, reject) => {
    // 插入默认组织
    db.run(`
      INSERT INTO organizations (id, name, code, parent_id, level, sort_order) 
      VALUES (1, '总公司', 'ROOT', 0, 1, 1)
    `);

    // 插入默认岗位
    db.run(`
      INSERT INTO positions (id, name, code, organization_id, level, sort_order) 
      VALUES (1, '系统管理员', 'SYS_ADMIN', 1, 1, 1)
    `);

    // 插入默认角色
    db.run(`
      INSERT INTO roles (id, name, code, description) 
      VALUES (1, '超级管理员', 'SUPER_ADMIN', '系统超级管理员')
    `);

    // 插入默认菜单
    const menus = [
      { id: 1, name: '首页', path: '/', component: 'Dashboard', icon: 'House', parent_id: 0, level: 1, sort_order: 1, type: 1 },
      { id: 2, name: '系统管理', path: '/system', component: 'Layout', icon: 'Setting', parent_id: 0, level: 1, sort_order: 2, type: 1 },
      { id: 3, name: '组织管理', path: '/system/organization', component: 'system/Organization', icon: 'OfficeBuilding', parent_id: 2, level: 2, sort_order: 1, type: 1 },
      { id: 4, name: '岗位管理', path: '/system/position', component: 'system/Position', icon: 'User', parent_id: 2, level: 2, sort_order: 2, type: 1 },
      { id: 5, name: '用户管理', path: '/system/user', component: 'system/User', icon: 'Avatar', parent_id: 2, level: 2, sort_order: 3, type: 1 },
      { id: 6, name: '角色管理', path: '/system/role', component: 'system/Role', icon: 'UserFilled', parent_id: 2, level: 2, sort_order: 4, type: 1 },
      { id: 7, name: '菜单管理', path: '/system/menu', component: 'system/Menu', icon: 'Menu', parent_id: 2, level: 2, sort_order: 5, type: 1 }
    ];

    let completed = 0;
    menus.forEach(menu => {
      db.run(`
        INSERT INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [menu.id, menu.name, menu.path, menu.component, menu.icon, menu.parent_id, menu.level, menu.sort_order, menu.type], (err) => {
        if (err) {
          console.error('插入菜单失败:', err);
        }
        completed++;
        if (completed === menus.length) {
          // 插入默认管理员用户
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          db.run(`
            INSERT INTO users (id, username, password, real_name, email, organization_id, position_id) 
            VALUES (1, 'admin', ?, '系统管理员', 'admin@example.com', 1, 1)
          `, [hashedPassword], (err) => {
            if (err) {
              console.error('插入用户失败:', err);
            } else {
              // 分配角色给管理员
              db.run(`
                INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)
              `, (err) => {
                if (err) {
                  console.error('分配角色失败:', err);
                } else {
                  // 给超级管理员分配所有菜单权限
                  db.run(`
                    INSERT INTO role_menus (role_id, menu_id, permissions) 
                    SELECT 1, id, 'read,create,update,delete' FROM menus
                  `, (err) => {
                    if (err) {
                      console.error('分配菜单权限失败:', err);
                    } else {
                      console.log('数据库初始化完成！');
                      resolve();
                    }
                  });
                }
              });
            }
          });
        }
      });
    });
  });
};

// 初始化HR模块数据库
const initHRDatabase = () => {
  return new Promise((resolve, reject) => {
    const { initHRDatabase: initHR } = require('./hr-tables');
    try {
      initHR();
      console.log('HR模块数据库初始化完成');
      resolve();
    } catch (err) {
      console.error('HR模块数据库初始化失败:', err);
      reject(err);
    }
  });
};

// 执行初始化
createTables()
  .then(() => insertInitialData())
  .then(() => initHRDatabase())
  .then(() => {
    console.log();
    console.log('========================================');
    console.log('          数据库重置完成');
    console.log('========================================');
    console.log();
    console.log('🔑 默认账号信息:');
    console.log('  用户名: admin');
    console.log('  密码: admin123');
    console.log();
    console.log('🚀 启动命令:');
    console.log('  npm run dev        # 开发模式');
    console.log('  npm start          # 生产模式');
    console.log();
    db.close();
  })
  .catch(err => {
    console.error('❌ 数据库初始化失败:', err);
    db.close();
    process.exit(1);
  });
