// HR模块数据库表结构初始化
const db = require('./db-connection');

// 创建HR模块相关表
const createHRTables = () => {
  console.log('开始创建HR模块数据库表...');

  // 招聘职位表
  db.run(`
    CREATE TABLE IF NOT EXISTS recruitment_positions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title VARCHAR(100) NOT NULL,
      position_id INTEGER NOT NULL,
      org_id INTEGER NOT NULL,
      description TEXT,
      requirements TEXT,
      salary_range VARCHAR(50),
      urgent_level INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 简历表
  db.run(`
    CREATE TABLE IF NOT EXISTS resumes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(50) NOT NULL,
      email VARCHAR(100) NOT NULL,
      phone VARCHAR(20) NOT NULL,
      position_id INTEGER NOT NULL,
      resume_file VARCHAR(255),
      experience TEXT,
      education VARCHAR(100),
      skills TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 入职申请表
  db.run(`
    CREATE TABLE IF NOT EXISTS onboarding_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      position_id INTEGER NOT NULL,
      org_id INTEGER NOT NULL,
      start_date DATE NOT NULL,
      salary DECIMAL(10,2),
      contract_type VARCHAR(20),
      notes TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 离职申请表
  db.run(`
    CREATE TABLE IF NOT EXISTS offboarding_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      leave_date DATE NOT NULL,
      reason VARCHAR(100) NOT NULL,
      handover_notes TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 考勤记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      position_id INTEGER,
      date DATE NOT NULL,
      checkin_time DATETIME,
      checkout_time DATETIME,
      checkin_location VARCHAR(100),
      checkout_location VARCHAR(100),
      checkin_notes TEXT,
      checkout_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, date)
    )
  `);

  // 请假申请表
  db.run(`
    CREATE TABLE IF NOT EXISTS leave_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      position_id INTEGER,
      type VARCHAR(20) NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      emergency_contact VARCHAR(100),
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 薪酬记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS salary_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      year INTEGER NOT NULL,
      month INTEGER NOT NULL,
      base_salary DECIMAL(10,2) NOT NULL,
      bonus DECIMAL(10,2) DEFAULT 0,
      allowance DECIMAL(10,2) DEFAULT 0,
      deduction DECIMAL(10,2) DEFAULT 0,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, year, month)
    )
  `);

  // 员工档案表
  db.run(`
    CREATE TABLE IF NOT EXISTS employee_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      employee_id VARCHAR(50) NOT NULL,
      position_id INTEGER NOT NULL,
      org_id INTEGER NOT NULL,
      department VARCHAR(100),
      personal_info TEXT,
      work_info TEXT,
      education_info TEXT,
      family_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(employee_id)
    )
  `);

  // 所有表创建完成
  console.log('HR模块数据库表创建完成');
  // 注意：示例数据由 system-init.js 统一插入，这里只创建表结构
};

// 执行初始化
const initHRDatabase = () => {
  createHRTables();
  // 注意：示例数据由 system-init.js 统一插入，这里只创建表结构
};

module.exports = { initHRDatabase };
