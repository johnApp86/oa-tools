// 财务模块数据库表结构初始化
const db = require('./db-connection');

// 创建财务模块相关表
const createFinanceTables = () => {
  console.log('开始创建财务模块数据库表...');

  // 总账科目表
  db.run(`
    CREATE TABLE IF NOT EXISTS general_ledger_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      type VARCHAR(20) NOT NULL,
      parent_id INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 总账凭证表
  db.run(`
    CREATE TABLE IF NOT EXISTS general_ledger_vouchers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_number VARCHAR(50) UNIQUE,
      date DATE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 总账分录表
  db.run(`
    CREATE TABLE IF NOT EXISTS general_ledger_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      voucher_id INTEGER NOT NULL,
      account_id INTEGER NOT NULL,
      type VARCHAR(10) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (voucher_id) REFERENCES general_ledger_vouchers(id),
      FOREIGN KEY (account_id) REFERENCES general_ledger_accounts(id)
    )
  `);

  // 应收账款表
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts_receivable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name VARCHAR(100) NOT NULL,
      invoice_number VARCHAR(50),
      amount DECIMAL(10,2) NOT NULL,
      due_date DATE NOT NULL,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 应收账款收款记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts_receivable_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_method VARCHAR(20),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts_receivable(id)
    )
  `);

  // 应付账款表
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts_payable (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplier_name VARCHAR(100) NOT NULL,
      invoice_number VARCHAR(50),
      amount DECIMAL(10,2) NOT NULL,
      due_date DATE NOT NULL,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 应付账款付款记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts_payable_payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      payment_date DATE NOT NULL,
      payment_method VARCHAR(20),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES accounts_payable(id)
    )
  `);

  // 固定资产表
  db.run(`
    CREATE TABLE IF NOT EXISTS fixed_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE,
      category VARCHAR(50) NOT NULL,
      purchase_price DECIMAL(10,2) NOT NULL,
      purchase_date DATE NOT NULL,
      depreciation_method VARCHAR(20),
      useful_life INTEGER,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 固定资产折旧记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS fixed_asset_depreciation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL,
      depreciation_amount DECIMAL(10,2) NOT NULL,
      depreciation_date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (asset_id) REFERENCES fixed_assets(id)
    )
  `);

  // 现金账户表
  db.run(`
    CREATE TABLE IF NOT EXISTS cash_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      account_type VARCHAR(20) NOT NULL,
      bank_name VARCHAR(100),
      account_number VARCHAR(50),
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 资金流水表
  db.run(`
    CREATE TABLE IF NOT EXISTS cash_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      account_id INTEGER NOT NULL,
      type VARCHAR(10) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      transaction_date DATE NOT NULL,
      description TEXT NOT NULL,
      category VARCHAR(50),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (account_id) REFERENCES cash_accounts(id)
    )
  `);

  // 成本中心表
  db.run(`
    CREATE TABLE IF NOT EXISTS cost_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) UNIQUE NOT NULL,
      description TEXT,
      parent_id INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 成本分配表
  db.run(`
    CREATE TABLE IF NOT EXISTS cost_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_center INTEGER NOT NULL,
      to_center INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      allocation_date DATE NOT NULL,
      description TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (from_center) REFERENCES cost_centers(id),
      FOREIGN KEY (to_center) REFERENCES cost_centers(id)
    )
  `);

  // 预算表
  db.run(`
    CREATE TABLE IF NOT EXISTS budgets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      year INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      department VARCHAR(100),
      category VARCHAR(50),
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 费用申请表
  db.run(`
    CREATE TABLE IF NOT EXISTS expense_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      category VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      application_date DATE NOT NULL,
      description TEXT NOT NULL,
      attachments TEXT,
      notes TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      approver_id INTEGER,
      approval_date DATETIME,
      approval_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // 税务申报表
  db.run(`
    CREATE TABLE IF NOT EXISTS tax_declarations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tax_type VARCHAR(50) NOT NULL,
      period VARCHAR(20) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      declaration_date DATE,
      due_date DATE,
      description TEXT,
      status INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 最后一个表创建完成后，插入示例数据
  console.log('财务模块数据库表创建完成');
  // 等待一小段时间确保所有表创建完成
  setTimeout(() => {
    insertSampleData();
  }, 100);
};

// 插入示例数据
const insertSampleData = () => {
  console.log('开始插入财务模块示例数据...');

  // 插入示例总账科目
  db.run(`
    INSERT OR IGNORE INTO general_ledger_accounts 
    (code, name, type, parent_id, level) 
    VALUES 
    ('1001', '库存现金', 'asset', 0, 1),
    ('1002', '银行存款', 'asset', 0, 1),
    ('2001', '短期借款', 'liability', 0, 1),
    ('4001', '实收资本', 'equity', 0, 1),
    ('5001', '主营业务收入', 'revenue', 0, 1),
    ('6001', '主营业务成本', 'expense', 0, 1)
  `, (err) => {
    if (err) {
      console.error('插入示例总账科目失败:', err);
      return;
    }

    // 插入示例现金账户
    db.run(`
      INSERT OR IGNORE INTO cash_accounts 
      (name, account_type, bank_name, account_number) 
      VALUES 
      ('基本账户', 'bank', '中国工商银行', '6222021234567890123'),
      ('现金账户', 'cash', NULL, NULL)
    `, (err) => {
      if (err) {
        console.error('插入示例现金账户失败:', err);
        return;
      }

      // 插入示例成本中心
      db.run(`
        INSERT OR IGNORE INTO cost_centers 
        (name, code, description) 
        VALUES 
        ('管理部门', 'CC001', '公司管理部门'),
        ('销售部门', 'CC002', '销售部门'),
        ('生产部门', 'CC003', '生产制造部门')
      `, (err) => {
        if (err) {
          console.error('插入示例成本中心失败:', err);
          return;
        }

        // 插入示例预算
        const currentYear = new Date().getFullYear();
        db.run(`
          INSERT OR IGNORE INTO budgets 
          (name, year, amount, department, category) 
          VALUES 
          ('年度管理费用预算', ${currentYear}, 1000000, '管理部门', '管理费用'),
          ('年度销售费用预算', ${currentYear}, 800000, '销售部门', '销售费用'),
          ('年度生产成本预算', ${currentYear}, 2000000, '生产部门', '生产成本')
        `, (err) => {
          if (err) {
            console.error('插入示例预算失败:', err);
            return;
          }

          console.log('财务模块示例数据插入完成');
        });
      });
    });
  });
};

// 执行初始化
const initFinanceDatabase = () => {
  createFinanceTables();
  // insertSampleData() 现在在 createFinanceTables() 完成后通过 setTimeout 调用
};

module.exports = { initFinanceDatabase };
