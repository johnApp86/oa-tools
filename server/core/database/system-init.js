#!/usr/bin/env node

/**
 * 数据库初始化脚本
 * 初始化系统核心表、HR模块表和财务模块表，并插入完整的示例数据
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

// 插入系统核心模块示例数据
const insertSystemSampleData = () => {
  return new Promise((resolve, reject) => {
    console.log('正在插入系统核心模块示例数据...');
    
    // 插入更多组织数据
    db.run(`
      INSERT OR REPLACE INTO organizations (id, name, code, parent_id, level, sort_order) VALUES
      (1, '总公司', 'ROOT', 0, 1, 1),
      (2, '技术部', 'TECH', 1, 2, 1),
      (3, '销售部', 'SALES', 1, 2, 2),
      (4, '人事部', 'HR', 1, 2, 3),
      (5, '财务部', 'FINANCE', 1, 2, 4),
      (6, '前端组', 'FRONTEND', 2, 3, 1),
      (7, '后端组', 'BACKEND', 2, 3, 2)
    `, (err) => {
      if (err) {
        console.error('插入组织数据失败:', err.message);
        return reject(err);
      }
      
      // 插入更多岗位数据
      db.run(`
        INSERT OR REPLACE INTO positions (id, name, code, organization_id, level, sort_order) VALUES
        (1, '系统管理员', 'SYS_ADMIN', 1, 1, 1),
        (2, '前端开发工程师', 'FRONTEND_DEV', 6, 2, 1),
        (3, '后端开发工程师', 'BACKEND_DEV', 7, 2, 2),
        (4, '项目经理', 'PROJECT_MANAGER', 2, 2, 3),
        (5, '销售经理', 'SALES_MANAGER', 3, 2, 1),
        (6, 'HR专员', 'HR_SPECIALIST', 4, 2, 1),
        (7, '财务专员', 'FINANCE_SPECIALIST', 5, 2, 1)
      `, (err) => {
        if (err) {
          console.error('插入岗位数据失败:', err.message);
          return reject(err);
        }
        
        // 插入更多用户数据
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(`
          INSERT OR REPLACE INTO users (id, username, password, real_name, email, phone, organization_id, position_id, status) VALUES
          (1, 'admin', ?, '系统管理员', 'admin@example.com', '13800000001', 1, 1, 1),
          (2, 'zhangsan', ?, '张三', 'zhangsan@example.com', '13800000002', 6, 2, 1),
          (3, 'lisi', ?, '李四', 'lisi@example.com', '13800000003', 7, 3, 1),
          (4, 'wangwu', ?, '王五', 'wangwu@example.com', '13800000004', 3, 5, 1),
          (5, 'zhaoliu', ?, '赵六', 'zhaoliu@example.com', '13800000005', 4, 6, 1),
          (6, 'sunqi', ?, '孙七', 'sunqi@example.com', '13800000006', 5, 7, 1)
        `, [hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword, hashedPassword], (err) => {
          if (err) {
            console.error('插入用户数据失败:', err.message);
            return reject(err);
          }
          
          // 插入角色数据
          db.run(`
            INSERT OR REPLACE INTO roles (id, name, code, description, status) VALUES
            (1, '系统管理员', 'ADMIN', '系统管理员，拥有所有权限', 1),
            (2, '部门经理', 'MANAGER', '部门经理，管理本部门', 1),
            (3, '普通员工', 'EMPLOYEE', '普通员工', 1),
            (4, '财务人员', 'FINANCE', '财务人员，管理财务相关', 1),
            (5, 'HR人员', 'HR', 'HR人员，管理人员相关', 1)
          `, (err) => {
            if (err) {
              console.error('插入角色数据失败:', err.message);
              return reject(err);
            }
            
            // 插入用户角色关联
            db.run(`
              INSERT OR REPLACE INTO user_roles (id, user_id, role_id) VALUES
              (1, 1, 1),
              (2, 2, 3),
              (3, 3, 3),
              (4, 4, 2),
              (5, 5, 5),
              (6, 6, 4)
            `, (err) => {
              if (err) {
                console.error('插入用户角色关联失败:', err.message);
                return reject(err);
              }
              
              console.log('✓ 系统核心模块示例数据插入完成');
              resolve();
            });
          });
        });
      });
    });
  });
};

// 插入HR模块完整示例数据
const insertHRSampleData = () => {
  return new Promise((resolve, reject) => {
    console.log('正在插入HR模块完整示例数据...');
    
    // 插入招聘职位
    db.run(`
      INSERT OR REPLACE INTO recruitment_positions 
      (id, title, position_id, org_id, description, requirements, salary_range, urgent_level, status) VALUES
      (1, '高级前端开发工程师', 2, 6, '负责公司前端产品开发和维护', '5年以上前端开发经验，熟悉Vue.js、React等框架', '20K-30K', 2, 1),
      (2, 'Java后端开发工程师', 3, 7, '负责公司后端服务开发和维护', '5年以上Java开发经验，熟悉Spring框架', '18K-28K', 2, 1),
      (3, '产品经理', 4, 2, '负责产品规划和设计', '3年以上产品经验，熟悉产品设计流程', '15K-25K', 1, 1),
      (4, '销售专员', 5, 3, '负责产品销售和客户维护', '2年以上销售经验', '8K-15K', 1, 1)
    `, (err) => {
      if (err) {
        console.error('插入招聘职位失败:', err.message);
        return reject(err);
      }
      
      // 插入简历
      db.run(`
        INSERT OR REPLACE INTO resumes 
        (id, name, email, phone, position_id, experience, education, skills, status) VALUES
        (1, '张三', 'zhangsan@example.com', '13800138001', 1, '5年前端开发经验，曾在多家公司担任前端开发工程师', '本科', 'Vue.js, React, JavaScript, TypeScript, Node.js', 1),
        (2, '李四', 'lisi@example.com', '13800138002', 2, '4年Java开发经验，熟悉微服务架构', '本科', 'Java, Spring, MySQL, Redis, Docker', 1),
        (3, '王五', 'wangwu@example.com', '13800138003', 3, '3年产品经验，负责过多个产品项目', '硕士', '产品设计, 用户研究, 原型设计', 1)
      `, (err) => {
        if (err) {
          console.error('插入简历失败:', err.message);
          return reject(err);
        }
        
        // 插入入职申请
        const today = new Date();
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
        db.run(`
          INSERT OR REPLACE INTO onboarding_applications 
          (id, user_id, position_id, org_id, start_date, salary, contract_type, notes, status) VALUES
          (1, 2, 2, 6, '${nextMonth.toISOString().split('T')[0]}', 20000, 'formal', '通过面试，准备入职', 1),
          (2, 3, 3, 7, '${nextMonth.toISOString().split('T')[0]}', 18000, 'formal', '通过面试，准备入职', 1)
        `, (err) => {
          if (err) {
            console.error('插入入职申请失败:', err.message);
            return reject(err);
          }
          
          // 插入离职申请
          db.run(`
            INSERT OR REPLACE INTO offboarding_applications 
            (id, user_id, leave_date, reason, handover_notes, status) VALUES
            (1, 4, '${new Date(today.getFullYear(), today.getMonth() + 2, 1).toISOString().split('T')[0]}', '个人原因', '工作已交接给王五', 1)
          `, (err) => {
            if (err) {
              console.error('插入离职申请失败:', err.message);
              return reject(err);
            }
            
            // 插入考勤记录（最近7天）
            const attendanceRecords = [];
            for (let i = 0; i < 7; i++) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split('T')[0];
              attendanceRecords.push(`(1, 2, '${dateStr}', '${dateStr} 09:00:00', '${dateStr} 18:00:00', '办公室', '办公室', NULL, NULL)`);
              attendanceRecords.push(`(2, 3, '${dateStr}', '${dateStr} 09:30:00', '${dateStr} 18:30:00', '办公室', '办公室', NULL, NULL)`);
            }
            
            db.run(`
              INSERT OR REPLACE INTO attendance_records 
              (id, user_id, position_id, date, checkin_time, checkout_time, checkin_location, checkout_location, checkin_notes, checkout_notes)
              VALUES ${attendanceRecords.join(',')}
            `, (err) => {
              if (err) {
                console.error('插入考勤记录失败:', err.message);
                return reject(err);
              }
              
              // 插入请假申请
              db.run(`
                INSERT OR REPLACE INTO leave_applications 
                (id, user_id, position_id, type, start_date, end_date, reason, emergency_contact, status) VALUES
                (1, 2, 2, 'annual', '${new Date(today.getFullYear(), today.getMonth() + 1, 20).toISOString().split('T')[0]}', 
                 '${new Date(today.getFullYear(), today.getMonth() + 1, 22).toISOString().split('T')[0]}', '年假', '13800000001', 1),
                (2, 3, 3, 'sick', '${today.toISOString().split('T')[0]}', '${today.toISOString().split('T')[0]}', '生病请假', '13800000002', 1),
                (3, 2, 2, 'personal', '${new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0]}', 
                 '${new Date(today.getFullYear(), today.getMonth() + 1, 10).toISOString().split('T')[0]}', '事假', '13800000003', 1)
              `, (err) => {
                if (err) {
                  console.error('插入请假申请失败:', err.message);
                  return reject(err);
                }
                
                // 插入薪酬记录（最近3个月）
                const salaryRecords = [];
                for (let i = 0; i < 3; i++) {
                  const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
                  salaryRecords.push(`(1, ${monthDate.getFullYear()}, ${monthDate.getMonth() + 1}, 20000, ${5000 + i * 1000}, 2000, 1000, '${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月薪酬')`);
                  salaryRecords.push(`(2, ${monthDate.getFullYear()}, ${monthDate.getMonth() + 1}, 18000, ${3000 + i * 500}, 1500, 800, '${monthDate.getFullYear()}年${monthDate.getMonth() + 1}月薪酬')`);
                }
                
                db.run(`
                  INSERT OR REPLACE INTO salary_records 
                  (id, user_id, year, month, base_salary, bonus, allowance, deduction, notes)
                  VALUES ${salaryRecords.join(',')}
                `, (err) => {
                  if (err) {
                    console.error('插入薪酬记录失败:', err.message);
                    return reject(err);
                  }
                  
                  // 插入员工档案
                  db.run(`
                    INSERT OR REPLACE INTO employee_files 
                    (id, user_id, employee_id, position_id, org_id, department, personal_info, work_info, education_info, family_info) VALUES
                    (1, 2, 'EMP001', 2, 6, '技术部-前端组', '{"age": 28, "gender": "男", "marital_status": "未婚", "id_card": "110101199001011234"}', 
                     '{"join_date": "2024-01-15", "work_years": 5, "contract_type": "formal"}', 
                     '{"education": "本科", "school": "XX大学", "major": "计算机科学"}', '{"spouse": "", "children": []}'),
                    (2, 3, 'EMP002', 3, 7, '技术部-后端组', '{"age": 26, "gender": "女", "marital_status": "已婚", "id_card": "110101199501011234"}', 
                     '{"join_date": "2024-02-01", "work_years": 4, "contract_type": "formal"}', 
                     '{"education": "本科", "school": "YY大学", "major": "软件工程"}', '{"spouse": "XXX", "children": []}'),
                    (3, 4, 'EMP003', 5, 3, '销售部', '{"age": 30, "gender": "男", "marital_status": "已婚", "id_card": "110101199001011234"}', 
                     '{"join_date": "2023-06-01", "work_years": 3, "contract_type": "formal"}', 
                     '{"education": "大专", "school": "ZZ大学", "major": "市场营销"}', '{"spouse": "YYY", "children": ["孩子1"]}')
                  `, (err) => {
                    if (err) {
                      console.error('插入员工档案失败:', err.message);
                      return reject(err);
                    }
                    
                    console.log('✓ HR模块完整示例数据插入完成');
                    resolve();
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

// 插入财务模块完整示例数据
const insertFinanceSampleData = () => {
  return new Promise((resolve, reject) => {
    console.log('正在插入财务模块完整示例数据...');
    
    // 插入总账科目（已存在于finance-tables.js，这里补充更多）
    db.run(`
      INSERT OR REPLACE INTO general_ledger_accounts 
      (id, code, name, type, parent_id, level, status) VALUES
      (1, '1001', '库存现金', 'asset', 0, 1, 1),
      (2, '1002', '银行存款', 'asset', 0, 1, 1),
      (3, '1002.01', '工商银行', 'asset', 2, 2, 1),
      (4, '1002.02', '建设银行', 'asset', 2, 2, 1),
      (5, '2001', '短期借款', 'liability', 0, 1, 1),
      (6, '4001', '实收资本', 'equity', 0, 1, 1),
      (7, '5001', '主营业务收入', 'revenue', 0, 1, 1),
      (8, '6001', '主营业务成本', 'expense', 0, 1, 1),
      (9, '6002', '管理费用', 'expense', 0, 1, 1),
      (10, '6003', '销售费用', 'expense', 0, 1, 1)
    `, (err) => {
      if (err) {
        console.error('插入总账科目失败:', err.message);
        return reject(err);
      }
      
      // 插入应收账款
      const today = new Date();
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 30);
      db.run(`
        INSERT OR REPLACE INTO accounts_receivable 
        (id, customer_name, invoice_number, amount, due_date, description, status) VALUES
        (1, 'ABC科技有限公司', 'INV-2025-001', 50000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月产品采购', 1),
        (2, 'XYZ贸易公司', 'INV-2025-002', 30000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月服务费', 1),
        (3, 'DEF制造企业', 'INV-2025-003', 80000.00, '${new Date(today.getFullYear(), today.getMonth() + 2, 15).toISOString().split('T')[0]}', '2025年2月设备销售', 1)
      `, (err) => {
        if (err) {
          console.error('插入应收账款失败:', err.message);
          return reject(err);
        }
        
        // 插入应收账款收款记录
        db.run(`
          INSERT OR REPLACE INTO accounts_receivable_payments 
          (id, account_id, amount, payment_date, payment_method, notes) VALUES
          (1, 1, 20000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '部分收款'),
          (2, 2, 30000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '全额收款')
        `, (err) => {
          if (err) {
            console.error('插入应收账款收款记录失败:', err.message);
            return reject(err);
          }
          
          // 插入应付账款
          db.run(`
            INSERT OR REPLACE INTO accounts_payable 
            (id, supplier_name, invoice_number, amount, due_date, description, status) VALUES
            (1, '供应商A', 'INV-SUP-001', 25000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月原材料采购', 1),
            (2, '供应商B', 'INV-SUP-002', 15000.00, '${nextMonth.toISOString().split('T')[0]}', '2025年1月设备采购', 1),
            (3, '服务商C', 'INV-SUP-003', 10000.00, '${new Date(today.getFullYear(), today.getMonth() + 2, 10).toISOString().split('T')[0]}', '2025年2月服务费', 1)
          `, (err) => {
            if (err) {
              console.error('插入应付账款失败:', err.message);
              return reject(err);
            }
            
            // 插入应付账款付款记录
            db.run(`
              INSERT OR REPLACE INTO accounts_payable_payments 
              (id, account_id, amount, payment_date, payment_method, notes) VALUES
              (1, 1, 10000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '部分付款'),
              (2, 2, 15000.00, '${today.toISOString().split('T')[0]}', 'bank_transfer', '全额付款')
            `, (err) => {
              if (err) {
                console.error('插入应付账款付款记录失败:', err.message);
                return reject(err);
              }
              
              // 插入固定资产
              db.run(`
                INSERT OR REPLACE INTO fixed_assets 
                (id, name, code, category, purchase_price, purchase_date, depreciation_method, useful_life, description) VALUES
                (1, '办公电脑', 'FA-001', '电子设备', 5000.00, '2024-01-15', 'straight_line', 3, 'Dell办公电脑'),
                (2, '办公桌', 'FA-002', '办公家具', 2000.00, '2024-01-20', 'straight_line', 5, '实木办公桌'),
                (3, '打印机', 'FA-003', '电子设备', 3000.00, '2024-02-01', 'straight_line', 5, 'HP激光打印机'),
                (4, '服务器', 'FA-004', '电子设备', 50000.00, '2024-03-01', 'straight_line', 5, 'Dell服务器')
              `, (err) => {
                if (err) {
                  console.error('插入固定资产失败:', err.message);
                  return reject(err);
                }
                
                // 插入固定资产折旧记录
                db.run(`
                  INSERT OR REPLACE INTO fixed_asset_depreciation 
                  (id, asset_id, depreciation_amount, depreciation_date, notes) VALUES
                  (1, 1, 138.89, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧'),
                  (2, 2, 33.33, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧'),
                  (3, 3, 50.00, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧'),
                  (4, 4, 833.33, '${new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]}', '2025年1月折旧')
                `, (err) => {
                  if (err) {
                    console.error('插入固定资产折旧记录失败:', err.message);
                    return reject(err);
                  }
                  
                  // 插入资金流水（最近30天）
                  const transactions = [];
                  for (let i = 0; i < 30; i++) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    const amount = Math.random() * 10000 + 1000;
                    const type = Math.random() > 0.5 ? 'income' : 'expense';
                    transactions.push(`(1, '${type}', ${amount.toFixed(2)}, '${dateStr}', '${type === 'income' ? '销售收入' : '办公费用'}', '${type === 'income' ? '销售收入' : '管理费用'}', '日常交易')`);
                  }
                  
                  db.run(`
                    INSERT OR REPLACE INTO cash_transactions 
                    (id, account_id, type, amount, transaction_date, description, category, notes)
                    VALUES ${transactions.join(',')}
                  `, (err) => {
                    if (err) {
                      console.error('插入资金流水失败:', err.message);
                      return reject(err);
                    }
                    
                    // 插入成本分配
                    db.run(`
                      INSERT OR REPLACE INTO cost_allocations 
                      (id, from_center, to_center, amount, allocation_date, description, notes) VALUES
                      (1, 1, 2, 5000.00, '${today.toISOString().split('T')[0]}', '管理部门费用分摊到销售部门', '2025年1月成本分配'),
                      (2, 1, 3, 8000.00, '${today.toISOString().split('T')[0]}', '管理部门费用分摊到生产部门', '2025年1月成本分配')
                    `, (err) => {
                      if (err) {
                        console.error('插入成本分配失败:', err.message);
                        return reject(err);
                      }
                      
                      // 插入费用申请
                      db.run(`
                        INSERT OR REPLACE INTO expense_applications 
                        (id, user_id, category, amount, application_date, description, status) VALUES
                        (1, 2, 'travel', 2000.00, '${today.toISOString().split('T')[0]}', '出差住宿费', 'pending'),
                        (2, 3, 'office', 500.00, '${today.toISOString().split('T')[0]}', '办公用品采购', 'approved'),
                        (3, 4, 'meals', 800.00, '${new Date(today.getFullYear(), today.getMonth() - 1, 25).toISOString().split('T')[0]}', '客户招待费', 'approved'),
                        (4, 5, 'training', 1500.00, '${today.toISOString().split('T')[0]}', '培训费', 'pending')
                      `, (err) => {
                        if (err) {
                          console.error('插入费用申请失败:', err.message);
                          return reject(err);
                        }
                        
                        // 插入税务申报
                        db.run(`
                          INSERT OR REPLACE INTO tax_declarations 
                          (id, tax_type, period, amount, declaration_date, due_date, description, status) VALUES
                          (1, 'vat', '2025-01', 13000.00, '${today.toISOString().split('T')[0]}', '2025-02-15', '2025年1月增值税申报', 1),
                          (2, 'corporate_income', '2024-12', 125000.00, '${today.toISOString().split('T')[0]}', '2025-05-31', '2024年12月企业所得税申报', 1),
                          (3, 'vat', '2025-02', 15000.00, NULL, '2025-03-15', '2025年2月增值税申报（待申报）', 0)
                        `, (err) => {
                          if (err) {
                            console.error('插入税务申报失败:', err.message);
                            return reject(err);
                          }
                          
                          console.log('✓ 财务模块完整示例数据插入完成');
                          resolve();
                        });
                      });
                    });
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

// 等待系统核心数据库初始化完成
const waitForInit = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
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

// 设置默认管理员密码
const setAdminPassword = () => {
  console.log('正在设置默认管理员密码...');
  
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
  console.log('📊 已初始化模块和示例数据:');
  console.log('   ✓ 系统核心模块（组织、岗位、用户、菜单、角色）- 6个组织, 7个岗位, 6个用户');
  console.log('   ✓ HR管理模块（招聘、入职、离职、考勤、请假、薪酬、档案）- 完整示例数据');
  console.log('   ✓ 财务管理模块（总账、应收应付、固定资产、现金、预算、费用、税务）- 完整示例数据');
  console.log('');
  console.log('🚀 下一步:');
  console.log('   npm run dev        # 启动开发服务器');
  console.log('   或');
  console.log('   bat\\start.bat     # 使用批处理脚本启动');
  console.log('');
  
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

// 执行初始化流程
const runInit = async () => {
  try {
    console.log('正在初始化系统核心模块...');
    await waitForInit();
    console.log('✓ 系统核心模块初始化完成 (1/3)');
    console.log('');
    
    // 插入系统核心模块示例数据
    await insertSystemSampleData();
    console.log('');
    
    console.log('正在初始化HR模块...');
    initHRDatabase();
    
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
    
    // 等待HR模块示例数据插入完成，然后插入更多数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    await insertHRSampleData();
    console.log('');
    
    console.log('正在初始化财务模块...');
    initFinanceDatabase();
    
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
    
    // 等待财务模块示例数据插入完成，然后插入更多数据
    await new Promise(resolve => setTimeout(resolve, 1000));
    await insertFinanceSampleData();
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

