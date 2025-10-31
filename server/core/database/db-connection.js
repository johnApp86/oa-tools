const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'oa.db');
const db = new sqlite3.Database(dbPath);

// 初始化数据库表
const initDatabase = (callback) => {
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
  `, (err) => {
    if (err) {
      console.error('创建组织表失败:', err);
      return callback && callback(err);
    }

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
    `, (err) => {
      if (err) {
        console.error('创建岗位表失败:', err);
        return callback && callback(err);
      }

      // 用户表
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255),
          real_name VARCHAR(100),
          email VARCHAR(100),
          phone VARCHAR(20),
          avatar VARCHAR(255),
          organization_id INTEGER,
          position_id INTEGER,
          status INTEGER DEFAULT 1,
          last_login DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (organization_id) REFERENCES organizations(id),
          FOREIGN KEY (position_id) REFERENCES positions(id)
        )
      `, (err) => {
        if (err) {
          console.error('创建用户表失败:', err);
          return callback && callback(err);
        }

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
        `, (err) => {
          if (err) {
            console.error('创建菜单表失败:', err);
            return callback && callback(err);
          }

          // 角色表
          db.run(`
            CREATE TABLE IF NOT EXISTS roles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name VARCHAR(100) NOT NULL,
              code VARCHAR(50) UNIQUE NOT NULL,
              description TEXT,
              status INTEGER DEFAULT 1,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `, (err) => {
            if (err) {
              console.error('创建角色表失败:', err);
              return callback && callback(err);
            }

            // 用户角色关联表
            db.run(`
              CREATE TABLE IF NOT EXISTS user_roles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role_id INTEGER NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (role_id) REFERENCES roles(id),
                UNIQUE(user_id, role_id)
              )
            `, (err) => {
              if (err) {
                console.error('创建用户角色关联表失败:', err);
                return callback && callback(err);
              }

              // 角色菜单权限表
              db.run(`
                CREATE TABLE IF NOT EXISTS role_menus (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  role_id INTEGER NOT NULL,
                  menu_id INTEGER NOT NULL,
                  permissions TEXT,
                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (role_id) REFERENCES roles(id),
                  FOREIGN KEY (menu_id) REFERENCES menus(id),
                  UNIQUE(role_id, menu_id)
                )
              `, (err) => {
                if (err) {
                  console.error('创建角色菜单权限表失败:', err);
                  return callback && callback(err);
                }

                // 所有表创建完成，插入初始数据
                insertInitialData(callback);
              });
            });
          });
        });
      });
    });
  });
};

// 插入初始数据
const insertInitialData = (callback) => {
  // 插入默认组织
  db.run(`
    INSERT OR IGNORE INTO organizations (id, name, code, parent_id, level, sort_order) 
    VALUES (1, '总公司', 'ROOT', 0, 1, 1)
  `, (err) => {
    if (err) {
      console.error('插入默认组织失败:', err);
      return callback && callback(err);
    }

    // 插入默认岗位
    db.run(`
      INSERT OR IGNORE INTO positions (id, name, code, organization_id, level, sort_order) 
      VALUES (1, '系统管理员', 'SYS_ADMIN', 1, 1, 1)
    `, (err) => {
      if (err) {
        console.error('插入默认岗位失败:', err);
        return callback && callback(err);
      }

      // 插入默认用户
      db.run(`
        INSERT OR IGNORE INTO users (id, username, real_name, email, organization_id, position_id) 
        VALUES (1, 'admin', '系统管理员', 'admin@example.com', 1, 1)
      `, (err) => {
        if (err) {
          console.error('插入默认用户失败:', err);
          return callback && callback(err);
        }

        // 插入默认菜单 - 首页
        db.run(`
          INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
          VALUES (1, '首页', '/', 'Dashboard', 'House', 0, 1, 1, 1, 1)
        `, (err) => {
          if (err) {
            console.error('插入默认菜单失败:', err);
            return callback && callback(err);
          }

          // 插入默认菜单 - 系统管理
          db.run(`
            INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
            VALUES (2, '系统管理', '/system', 'Layout', 'Setting', 0, 1, 2, 1, 1)
          `, (err) => {
            if (err) {
              console.error('插入默认菜单失败:', err);
              return callback && callback(err);
            }

            // 插入默认菜单 - 组织管理
            db.run(`
              INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
              VALUES (3, '组织管理', '/system/organization', 'Organization', 'OfficeBuilding', 2, 2, 1, 1, 1)
            `, (err) => {
              if (err) {
                console.error('插入默认菜单失败:', err);
                return callback && callback(err);
              }

              // 插入默认菜单 - 岗位管理
              db.run(`
                INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
                VALUES (4, '岗位管理', '/system/position', 'Position', 'User', 2, 2, 2, 1, 1)
              `, (err) => {
                if (err) {
                  console.error('插入默认菜单失败:', err);
                  return callback && callback(err);
                }

                // 插入默认菜单 - 用户管理
                db.run(`
                  INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
                  VALUES (5, '用户管理', '/system/user', 'User', 'Avatar', 2, 2, 3, 1, 1)
                `, (err) => {
                  if (err) {
                    console.error('插入默认菜单失败:', err);
                    return callback && callback(err);
                  }

                  // 插入默认菜单 - 菜单管理
                  db.run(`
                    INSERT OR IGNORE INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
                    VALUES (6, '菜单管理', '/system/menu', 'Menu', 'Menu', 2, 2, 4, 1, 1)
                  `, (err) => {
                    if (err) {
                      console.error('插入默认菜单失败:', err);
                      return callback && callback(err);
                    }

                    // 所有初始数据插入完成
                    callback && callback(null);
                  });
                });
              });
            });
          });
        });
      });
    });
  });
};

// 初始化数据库
initDatabase((err) => {
  if (err) {
    console.error('数据库初始化失败:', err);
  } else {
    console.log('系统模块数据库表创建完成');
  }
});

module.exports = db;
