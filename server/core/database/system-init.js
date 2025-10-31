#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 初始化系统核心表、HR模块表和财务模块表
 * 
 * 位置: server/core/database/system-init.js
 * 运行方式: node server/core/database/system-init.js
 */

const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// 从 server/core/database 目录，引用同目录下的文件
const db = require('./db-connection');
const { initHRDatabase } = require('./hr-tables');
const { initFinanceDatabase } = require('./finance-tables');

console.log('========================================');
console.log('        数据库初始化脚本');
console.log('========================================');
console.log('');

// 检查数据库文件是否存在
const dbPath = path.join(__dirname, 'oa.db');
if (fs.existsSync(dbPath)) {
  console.log('⚠️  数据库文件已存在，将更新表结构和初始数据');
} else {
  console.log('📝 创建新的数据库文件');
}

console.log('');

// 初始化完成的计数器
let initSteps = 0;
const totalSteps = 3;

// 步骤完成回调
const onStepComplete = (stepName, err) => {
  if (err) {
    console.error(`❌ ${stepName}初始化失败:`, err.message);
    process.exit(1);
  } else {
    initSteps++;
    console.log(`✓ ${stepName}初始化完成 (${initSteps}/${totalSteps})`);
    console.log('');
    
    if (initSteps === totalSteps) {
      // 所有模块初始化完成，设置默认管理员密码
      setAdminPassword();
    }
  }
};

// 设置默认管理员密码
const setAdminPassword = () => {
  console.log('正在设置默认管理员密码...');
  
  // 使用 bcryptjs 加密默认密码
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(
    `UPDATE users SET password = ? WHERE username = 'admin'`,
    [hashedPassword],
    function(err) {
      if (err) {
        console.error('❌ 设置管理员密码失败:', err.message);
        process.exit(1);
      } else {
        if (this.changes === 0) {
          // 如果没有更新到任何用户，可能是用户不存在，尝试插入
          db.run(
            `INSERT OR IGNORE INTO users (id, username, password, real_name, email, organization_id, position_id) 
             VALUES (1, 'admin', ?, '系统管理员', 'admin@example.com', 1, 1)`,
            [hashedPassword],
            function(err) {
              if (err) {
                console.error('❌ 创建管理员用户失败:', err.message);
                process.exit(1);
              } else {
                console.log('✓ 默认管理员密码设置完成');
                printSummary();
              }
            }
          );
        } else {
          console.log('✓ 默认管理员密码设置完成');
          printSummary();
        }
      }
    }
  );
};

// 打印初始化总结
const printSummary = () => {
  console.log('');
  console.log('========================================');
  console.log('        数据库初始化完成');
  console.log('========================================');
  console.log('');
  console.log('🔑 默认账号信息:');
  console.log('   用户名: admin');
  console.log('   密码: admin123');
  console.log('');
  console.log('📊 已初始化模块:');
  console.log('   ✓ 系统核心模块（组织、岗位、用户、菜单、角色）');
  console.log('   ✓ HR管理模块（招聘、入职、考勤、请假、薪酬）');
  console.log('   ✓ 财务管理模块（总账、应收应付、固定资产、现金、预算）');
  console.log('');
  console.log('🚀 下一步:');
  console.log('   npm run dev        # 启动开发服务器');
  console.log('   或');
  console.log('   bat\\start.bat     # 使用批处理脚本启动');
  console.log('');
  
  // 关闭数据库连接
  db.close((err) => {
    if (err) {
      console.error('关闭数据库连接时出错:', err.message);
      process.exit(1);
    } else {
      console.log('数据库连接已关闭');
      process.exit(0);
    }
  });
};

// 等待系统核心数据库初始化完成
// 由于 db-connection.js 中的 initDatabase 已经在模块加载时执行
// 我们需要等待一段时间确保初始化完成，或者使用一个更好的方法

// 使用 Promise 包装的初始化流程
const waitForInit = () => {
  return new Promise((resolve) => {
    // 等待一小段时间确保核心数据库初始化完成
    setTimeout(() => {
      // 检查表是否已创建
      db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='organizations'", (err, row) => {
        if (err) {
          console.error('检查数据库状态失败:', err.message);
          process.exit(1);
        }
        if (!row) {
          console.error('❌ 核心数据库表未创建成功');
          process.exit(1);
        }
        resolve();
      });
    }, 500);
  });
};

// 检查表是否存在
const checkTableExists = (tableName) => {
  return new Promise((resolve, reject) => {
    db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?`, [tableName], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(!!row);
      }
    });
  });
};

// 等待表创建完成
const waitForTables = async (tableNames, timeout = 10000) => {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const allExist = await Promise.all(tableNames.map(name => checkTableExists(name)));
    if (allExist.every(exists => exists)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  return false;
};

// 执行初始化流程
const runInit = async () => {
  try {
    console.log('正在初始化系统核心模块...');
    // 等待核心数据库初始化完成
    await waitForInit();
    console.log('✓ 系统核心模块初始化完成 (1/3)');
    console.log('');
    
    console.log('正在初始化HR模块...');
    // 初始化HR模块
    initHRDatabase();
    
    // 等待HR模块表创建完成
    const hrTables = [
      'recruitment_positions',
      'resumes',
      'onboarding_applications',
      'offboarding_applications',
      'attendance_records',
      'leave_applications',
      'salary_records',
      'employee_files'
    ];
    
    const hrTablesReady = await waitForTables(hrTables);
    if (!hrTablesReady) {
      console.error('❌ HR模块表创建超时');
      process.exit(1);
    }
    console.log('✓ HR模块初始化完成 (2/3)');
    console.log('');
    
    console.log('正在初始化财务模块...');
    // 初始化财务模块
    initFinanceDatabase();
    
    // 等待财务模块表创建完成
    const financeTables = [
      'general_ledger_accounts',
      'general_ledger_vouchers',
      'general_ledger_entries',
      'accounts_receivable',
      'accounts_receivable_payments',
      'accounts_payable',
      'accounts_payable_payments',
      'fixed_assets',
      'fixed_asset_depreciation',
      'cash_accounts',
      'cash_transactions',
      'cost_centers',
      'cost_allocations',
      'budgets',
      'expense_applications',
      'tax_declarations'
    ];
    
    const financeTablesReady = await waitForTables(financeTables);
    if (!financeTablesReady) {
      console.error('❌ 财务模块表创建超时');
      process.exit(1);
    }
    console.log('✓ 财务模块初始化完成 (3/3)');
    console.log('');
    
    // 再等待一小段时间确保数据插入完成
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setAdminPassword();
  } catch (error) {
    console.error('初始化过程中出错:', error.message);
    process.exit(1);
  }
};

// 开始初始化
runInit();


