const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

const dbPath = path.join(__dirname, 'oa.db');

console.log('========================================');
console.log('        数据库初始化脚本');
console.log('========================================');
console.log();

// 检查数据库是否已存在
if (fs.existsSync(dbPath)) {
  console.log('⚠️  数据库文件已存在');
  console.log('如需重新初始化，请先运行: node reset-db.js');
  console.log();
  process.exit(0);
}

// 创建数据库
const db = new sqlite3.Database(dbPath);
console.log('✓ 数据库连接已建立');

// 创建基础表结构
const createTables = () => {
  return new Promise((resolve, reject) => {
    const tables = [
      // 组织表
      `CREATE TABLE organizations (
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
      )`,

      // 岗位表
      `CREATE TABLE positions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        organization_id INTEGER,
        level INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (organization_id) REFERENCES organizations (id)
      )`,

      // 角色表
      `CREATE TABLE roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        description TEXT,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // 菜单表
      `CREATE TABLE menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        path TEXT,
        component TEXT,
        icon TEXT,
        parent_id INTEGER,
        level INTEGER DEFAULT 1,
        sort_order INTEGER DEFAULT 0,
        type INTEGER DEFAULT 1,
        status INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (parent_id) REFERENCES menus (id)
      )`,

      // 用户表
      `CREATE TABLE users (
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
      )`,

      // 用户角色关联表
      `CREATE TABLE user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (role_id) REFERENCES roles (id),
        UNIQUE(user_id, role_id)
      )`,

      // 角色菜单权限表
      `CREATE TABLE role_menus (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        role_id INTEGER NOT NULL,
        menu_id INTEGER NOT NULL,
        permissions TEXT DEFAULT 'read',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles (id),
        FOREIGN KEY (menu_id) REFERENCES menus (id),
        UNIQUE(role_id, menu_id)
      )`
    ];

    let completed = 0;
    tables.forEach((sql, index) => {
      db.run(sql, (err) => {
        if (err) {
          console.error(`❌ 创建表 ${index + 1} 失败:`, err.message);
          reject(err);
        } else {
          completed++;
          if (completed === tables.length) {
            console.log('✓ 基础表结构创建完成');
            resolve();
          }
        }
      });
    });
  });
};

// 插入基础数据
const insertBasicData = () => {
  return new Promise((resolve, reject) => {
    // 插入默认组织
    const organizations = [
      { id: 1, name: '总公司', code: 'HQ', parent_id: null, level: 1, sort_order: 1 },
      { id: 2, name: '技术部', code: 'TECH', parent_id: 1, level: 2, sort_order: 1 },
      { id: 3, name: '人事部', code: 'HR', parent_id: 1, level: 2, sort_order: 2 },
      { id: 4, name: '财务部', code: 'FINANCE', parent_id: 1, level: 2, sort_order: 3 }
    ];

    let orgCompleted = 0;
    organizations.forEach(org => {
      db.run(`
        INSERT INTO organizations (id, name, code, parent_id, level, sort_order) 
        VALUES (?, ?, ?, ?, ?, ?)
      `, [org.id, org.name, org.code, org.parent_id, org.level, org.sort_order], (err) => {
        if (err) {
          console.error('❌ 插入组织失败:', err.message);
        }
        orgCompleted++;
        if (orgCompleted === organizations.length) {
          console.log('✓ 组织数据插入完成');
          
          // 插入默认岗位
          const positions = [
            { id: 1, name: '总经理', code: 'GM', organization_id: 1, level: 1, sort_order: 1 },
            { id: 2, name: '技术总监', code: 'CTO', organization_id: 2, level: 2, sort_order: 1 },
            { id: 3, name: '人事经理', code: 'HRM', organization_id: 3, level: 2, sort_order: 1 },
            { id: 4, name: '财务经理', code: 'CFM', organization_id: 4, level: 2, sort_order: 1 },
            { id: 5, name: '软件工程师', code: 'SE', organization_id: 2, level: 3, sort_order: 1 },
            { id: 6, name: '人事专员', code: 'HRS', organization_id: 3, level: 3, sort_order: 1 }
          ];

          let posCompleted = 0;
          positions.forEach(pos => {
            db.run(`
              INSERT INTO positions (id, name, code, organization_id, level, sort_order) 
              VALUES (?, ?, ?, ?, ?, ?)
            `, [pos.id, pos.name, pos.code, pos.organization_id, pos.level, pos.sort_order], (err) => {
              if (err) {
                console.error('❌ 插入岗位失败:', err.message);
              }
              posCompleted++;
              if (posCompleted === positions.length) {
                console.log('✓ 岗位数据插入完成');
                
                // 插入默认角色
                const roles = [
                  { id: 1, name: '超级管理员', code: 'SUPER_ADMIN', description: '系统超级管理员，拥有所有权限' },
                  { id: 2, name: '管理员', code: 'ADMIN', description: '系统管理员' },
                  { id: 3, name: 'HR管理员', code: 'HR_ADMIN', description: 'HR模块管理员' },
                  { id: 4, name: '普通用户', code: 'USER', description: '普通用户' }
                ];

                let roleCompleted = 0;
                roles.forEach(role => {
                  db.run(`
                    INSERT INTO roles (id, name, code, description) 
                    VALUES (?, ?, ?, ?)
                  `, [role.id, role.name, role.code, role.description], (err) => {
                    if (err) {
                      console.error('❌ 插入角色失败:', err.message);
                    }
                    roleCompleted++;
                    if (roleCompleted === roles.length) {
                      console.log('✓ 角色数据插入完成');
                      resolve();
                    }
                  });
                });
              }
            });
          });
        }
      });
    });
  });
};

// 插入菜单和用户数据
const insertMenuUserData = () => {
  return new Promise((resolve, reject) => {
    // 插入默认菜单
    const menus = [
      { id: 1, name: '首页', path: '/', component: 'Dashboard', icon: 'House', parent_id: null, level: 1, sort_order: 1 },
      { id: 2, name: '系统管理', path: '/system', component: 'Layout', icon: 'Setting', parent_id: null, level: 1, sort_order: 2 },
      { id: 3, name: '组织管理', path: '/system/organization', component: 'system/Organization', icon: 'OfficeBuilding', parent_id: 2, level: 2, sort_order: 1 },
      { id: 4, name: '岗位管理', path: '/system/position', component: 'system/Position', icon: 'User', parent_id: 2, level: 2, sort_order: 2 },
      { id: 5, name: '用户管理', path: '/system/user', component: 'system/User', icon: 'Avatar', parent_id: 2, level: 2, sort_order: 3 },
      { id: 6, name: '角色管理', path: '/system/role', component: 'system/Role', icon: 'UserFilled', parent_id: 2, level: 2, sort_order: 4 },
      { id: 7, name: '菜单管理', path: '/system/menu', component: 'system/Menu', icon: 'Menu', parent_id: 2, level: 2, sort_order: 5 },
      { id: 8, name: 'HR管理', path: '/hr', component: 'Layout', icon: 'UserFilled', parent_id: null, level: 1, sort_order: 3 },
      { id: 9, name: '招聘管理', path: '/hr/recruitment', component: 'hr/Recruitment', icon: 'Plus', parent_id: 8, level: 2, sort_order: 1 },
      { id: 10, name: '入职离职管理', path: '/hr/onboarding', component: 'hr/Onboarding', icon: 'User', parent_id: 8, level: 2, sort_order: 2 },
      { id: 11, name: '考勤管理', path: '/hr/attendance', component: 'hr/Attendance', icon: 'Clock', parent_id: 8, level: 2, sort_order: 3 },
      { id: 12, name: '薪酬福利管理', path: '/hr/salary', component: 'hr/Salary', icon: 'Wallet', parent_id: 8, level: 2, sort_order: 4 },
      { id: 13, name: '档案管理', path: '/hr/employee', component: 'hr/Employee', icon: 'Document', parent_id: 8, level: 2, sort_order: 5 },
      { id: 14, name: '报表分析', path: '/hr/reports', component: 'hr/Report', icon: 'DataAnalysis', parent_id: 8, level: 2, sort_order: 6 },
      // 财务模块菜单
      { id: 15, name: '财务管理', path: '/finance', component: 'Layout', icon: 'Money', parent_id: null, level: 1, sort_order: 4 },
      { id: 16, name: '总账', path: '/finance/general-ledger', component: 'finance/GeneralLedger', icon: 'Document', parent_id: 15, level: 2, sort_order: 1 },
      { id: 17, name: '应收账款', path: '/finance/accounts-receivable', component: 'finance/AccountsReceivable', icon: 'CreditCard', parent_id: 15, level: 2, sort_order: 2 },
      { id: 18, name: '应付账款', path: '/finance/accounts-payable', component: 'finance/AccountsPayable', icon: 'CreditCard', parent_id: 15, level: 2, sort_order: 3 },
      { id: 19, name: '固定资产', path: '/finance/fixed-assets', component: 'finance/FixedAssets', icon: 'OfficeBuilding', parent_id: 15, level: 2, sort_order: 4 },
      { id: 20, name: '资金管理', path: '/finance/cash-management', component: 'finance/CashManagement', icon: 'Wallet', parent_id: 15, level: 2, sort_order: 5 },
      { id: 21, name: '成本管理', path: '/finance/cost-accounting', component: 'finance/CostAccounting', icon: 'Document', parent_id: 15, level: 2, sort_order: 6 },
      { id: 22, name: '预算管理', path: '/finance/budgeting', component: 'finance/Budgeting', icon: 'DataAnalysis', parent_id: 15, level: 2, sort_order: 7 },
      { id: 23, name: '报表与分析', path: '/finance/financial-reporting', component: 'finance/FinancialReporting', icon: 'Document', parent_id: 15, level: 2, sort_order: 8 },
      { id: 24, name: '税务管理', path: '/finance/tax-management', component: 'finance/TaxManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 9 },
      { id: 25, name: '费用管理', path: '/finance/expense-management', component: 'finance/ExpenseManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 10 }
    ];

    let menuCompleted = 0;
    menus.forEach(menu => {
      db.run(`
        INSERT INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [menu.id, menu.name, menu.path, menu.component || null, menu.icon, menu.parent_id, menu.level, menu.sort_order, menu.type || 1, menu.status || 1], (err) => {
        if (err) {
          console.error('❌ 插入菜单失败:', err.message);
        }
        menuCompleted++;
        if (menuCompleted === menus.length) {
          console.log('✓ 菜单数据插入完成');
          
          // 创建默认管理员用户
          const hashedPassword = bcrypt.hashSync('admin123', 10);
          db.run(`
            INSERT INTO users (id, username, password, real_name, email, position_id, organization_id) 
            VALUES (1, 'admin', ?, '系统管理员', 'admin@example.com', 1, 1)
          `, [hashedPassword], (err) => {
            if (err) {
              console.error('❌ 创建管理员用户失败:', err.message);
              reject(err);
            } else {
              console.log('✓ 管理员用户创建完成');
              
              // 分配角色给管理员
              db.run('INSERT INTO user_roles (user_id, role_id) VALUES (1, 1)', (err) => {
                if (err) {
                  console.error('❌ 分配角色失败:', err.message);
                  reject(err);
                } else {
                  console.log('✓ 角色分配完成');
                  
                  // 给超级管理员分配所有菜单权限
                  db.run(`
                    INSERT INTO role_menus (role_id, menu_id, permissions) 
                    SELECT 1, id, 'read,create,update,delete' FROM menus
                  `, (err) => {
                    if (err) {
                      console.error('❌ 分配菜单权限失败:', err.message);
                      reject(err);
                    } else {
                      console.log('✓ 菜单权限分配完成');
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
      console.log('✓ HR模块数据库初始化完成');
      resolve();
    } catch (err) {
      console.error('❌ HR模块数据库初始化失败:', err.message);
      reject(err);
    }
  });
};

// 执行初始化
const initDatabase = async () => {
  try {
    await createTables();
    await insertBasicData();
    await insertMenuUserData();
    await initHRDatabase();
    
    console.log();
    console.log('========================================');
    console.log('          数据库初始化完成');
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
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
    db.close();
    process.exit(1);
  }
};

// 执行初始化
initDatabase();
