const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'oa.db');
const db = new sqlite3.Database(dbPath);

// 初始化数据库表
const initDatabase = () => {
  // 组织表
  db.run(`
    CREATE TABLE IF NOT EXISTS organizations (
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
    CREATE TABLE IF NOT EXISTS positions (
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

  // 用户表（简化版，去掉认证相关字段）
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
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

  // 菜单表
  db.run(`
    CREATE TABLE IF NOT EXISTS menus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      path VARCHAR(200),
      component VARCHAR(200),
      icon VARCHAR(50),
      parent_id INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      type INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 插入初始数据
  insertInitialData();
};

// 插入初始数据
const insertInitialData = () => {
  // 插入默认组织
  db.run(`
    INSERT OR IGNORE INTO organizations (id, name, code, parent_id, level, sort_order) 
    VALUES (1, '总公司', 'ROOT', 0, 1, 1)
  `);

  // 插入默认岗位
  db.run(`
    INSERT OR IGNORE INTO positions (id, name, code, organization_id, level, sort_order) 
    VALUES (1, '系统管理员', 'SYS_ADMIN', 1, 1, 1)
  `);

  // 插入默认用户
  db.run(`
    INSERT OR IGNORE INTO users (id, username, real_name, email, organization_id, position_id) 
    VALUES (1, 'admin', '系统管理员', 'admin@example.com', 1, 1)
  `);

  // 插入默认菜单
  db.run(`
    INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (1, '首页', '/', 'Dashboard', 'House', 0, 1, 1, 1, 1)
  `);
  
  db.run(`
    INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (2, '系统管理', '/system', 'Layout', 'Setting', 0, 1, 2, 1, 1)
  `);
  
  db.run(`
    INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (3, '组织管理', '/system/organization', 'Organization', 'OfficeBuilding', 2, 2, 1, 1, 1)
  `);
  
  db.run(`
    INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (4, '岗位管理', '/system/position', 'Position', 'User', 2, 2, 2, 1, 1)
  `);
  
  db.run(`
    INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (5, '用户管理', '/system/user', 'User', 'Avatar', 2, 2, 3, 1, 1)
  `);
  
  db.run(`
    INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
    VALUES (6, '菜单管理', '/system/menu', 'Menu', 'Menu', 2, 2, 4, 1, 1)
  `);
};

// 初始化数据库
initDatabase();

module.exports = db;