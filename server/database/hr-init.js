// HR模块数据库表结构初始化
const db = require('./db');

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

  console.log('HR模块数据库表创建完成');
};

// 插入示例数据
const insertSampleData = () => {
  console.log('开始插入HR模块示例数据...');

  // 插入示例招聘职位
  db.run(`
    INSERT OR IGNORE INTO recruitment_positions 
    (title, position_id, org_id, description, requirements, salary_range, urgent_level) 
    VALUES 
    ('高级前端开发工程师', 1, 1, '负责公司前端产品开发', '3年以上前端开发经验，熟悉Vue.js', '15K-25K', 2),
    ('Java后端开发工程师', 2, 1, '负责公司后端服务开发', '3年以上Java开发经验，熟悉Spring框架', '12K-20K', 1),
    ('产品经理', 3, 1, '负责产品规划和设计', '2年以上产品经验，熟悉产品设计流程', '10K-18K', 1)
  `);

  // 插入示例简历
  db.run(`
    INSERT OR IGNORE INTO resumes 
    (name, email, phone, position_id, experience, education, skills) 
    VALUES 
    ('张三', 'zhangsan@example.com', '13800138001', 1, '5年前端开发经验', '本科', 'Vue.js, React, JavaScript'),
    ('李四', 'lisi@example.com', '13800138002', 2, '4年Java开发经验', '本科', 'Java, Spring, MySQL'),
    ('王五', 'wangwu@example.com', '13800138003', 3, '3年产品经验', '硕士', '产品设计, 用户研究')
  `);

  // 插入示例入职申请
  db.run(`
    INSERT OR IGNORE INTO onboarding_applications 
    (user_id, position_id, org_id, start_date, salary, contract_type) 
    VALUES 
    (1, 1, 1, '2024-01-15', 20000, 'formal'),
    (2, 2, 1, '2024-02-01', 18000, 'formal')
  `);

  // 插入示例考勤记录
  const today = new Date().toISOString().split('T')[0];
  db.run(`
    INSERT OR IGNORE INTO attendance_records 
    (user_id, position_id, date, checkin_time, checkout_time, checkin_location, checkout_location) 
    VALUES 
    (1, 1, '${today}', '${today} 09:00:00', '${today} 18:00:00', '办公室', '办公室'),
    (2, 2, '${today}', '${today} 09:30:00', '${today} 18:30:00', '办公室', '办公室')
  `);

  // 插入示例请假申请
  db.run(`
    INSERT OR IGNORE INTO leave_applications 
    (user_id, position_id, type, start_date, end_date, reason) 
    VALUES 
    (1, 1, 'annual', '2024-01-20', '2024-01-22', '年假'),
    (2, 2, 'sick', '2024-01-25', '2024-01-25', '生病请假')
  `);

  // 插入示例薪酬记录
  db.run(`
    INSERT OR IGNORE INTO salary_records 
    (user_id, year, month, base_salary, bonus, allowance, deduction) 
    VALUES 
    (1, 2024, 1, 20000, 5000, 2000, 1000),
    (2, 2024, 1, 18000, 3000, 1500, 800)
  `);

  // 插入示例员工档案
  db.run(`
    INSERT OR IGNORE INTO employee_files 
    (user_id, employee_id, position_id, org_id, department, personal_info, work_info) 
    VALUES 
    (1, 'EMP001', 1, 1, '技术部', '{"age": 28, "gender": "男", "marital_status": "未婚"}', '{"join_date": "2024-01-15", "work_years": 5}'),
    (2, 'EMP002', 2, 1, '技术部', '{"age": 26, "gender": "女", "marital_status": "已婚"}', '{"join_date": "2024-02-01", "work_years": 4}')
  `);

  console.log('HR模块示例数据插入完成');
};

// 执行初始化
const initHRDatabase = () => {
  createHRTables();
  insertSampleData();
};

module.exports = { initHRDatabase };
