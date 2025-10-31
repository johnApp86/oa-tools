#!/usr/bin/env node

/**
 * 测试脚本 - 测试每个模块的增删改查功能
 * 
 * 位置: server/core/database/test-crud.js
 * 运行方式: node server/core/database/test-crud.js
 */

const axios = require('axios');
const baseURL = 'http://localhost:3001/api';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  title: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

// 登录获取token
let authToken = '';

const login = async () => {
  try {
    const response = await axios.post(`${baseURL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    if (response.data && response.data.token) {
      authToken = response.data.token;
      log.success('登录成功，获取token');
      return true;
    }
    return false;
  } catch (error) {
    log.error(`登录失败: ${error.message}`);
    return false;
  }
};

// 创建axios实例，添加token
const api = axios.create({
  baseURL,
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

// 测试系统模块
const testSystemModule = async () => {
  log.title('=== 测试系统模块 ===');
  
  // 测试组织管理
  log.info('测试组织管理...');
  try {
    // 查询
    const orgs = await api.get('/organizations');
    log.success(`查询组织成功: 共${orgs.data?.data?.length || 0}条记录`);
    
    // 创建
    const newOrg = await api.post('/organizations', {
      name: '测试部门',
      code: 'TEST_DEPT',
      parent_id: 1,
      level: 2
    });
    log.success(`创建组织成功: ID=${newOrg.data?.data?.id}`);
    
    const orgId = newOrg.data?.data?.id;
    
    // 更新
    await api.put(`/organizations/${orgId}`, {
      name: '测试部门（已更新）'
    });
    log.success('更新组织成功');
    
    // 删除
    await api.delete(`/organizations/${orgId}`);
    log.success('删除组织成功');
  } catch (error) {
    log.error(`组织管理测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试用户管理
  log.info('测试用户管理...');
  try {
    const users = await api.get('/users');
    log.success(`查询用户成功: 共${users.data?.data?.length || 0}条记录`);
    
    const newUser = await api.post('/users', {
      username: 'testuser',
      real_name: '测试用户',
      email: 'testuser@example.com',
      password: '123456',
      organization_id: 1,
      position_id: 2
    });
    log.success(`创建用户成功: ID=${newUser.data?.data?.id}`);
    
    const userId = newUser.data?.data?.id;
    
    await api.put(`/users/${userId}`, {
      real_name: '测试用户（已更新）'
    });
    log.success('更新用户成功');
    
    await api.delete(`/users/${userId}`);
    log.success('删除用户成功');
  } catch (error) {
    log.error(`用户管理测试失败: ${error.response?.data?.message || error.message}`);
  }
};

// 测试HR模块
const testHRModule = async () => {
  log.title('=== 测试HR模块 ===');
  
  // 测试招聘管理
  log.info('测试招聘管理...');
  try {
    const positions = await api.get('/hr/recruitment/positions');
    log.success(`查询招聘职位成功: 共${positions.data?.data?.length || 0}条记录`);
    
    const newPosition = await api.post('/hr/recruitment/positions', {
      title: '测试职位',
      position_id: 2,
      org_id: 1,
      description: '这是一个测试职位',
      requirements: '测试要求',
      salary_range: '10K-15K',
      urgent_level: 1
    });
    log.success(`创建招聘职位成功: ID=${newPosition.data?.data?.id}`);
    
    const positionId = newPosition.data?.data?.id;
    
    await api.put(`/hr/recruitment/positions/${positionId}`, {
      title: '测试职位（已更新）'
    });
    log.success('更新招聘职位成功');
    
    await api.delete(`/hr/recruitment/positions/${positionId}`);
    log.success('删除招聘职位成功');
  } catch (error) {
    log.error(`招聘管理测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试考勤管理
  log.info('测试考勤管理...');
  try {
    const records = await api.get('/hr/attendance/records');
    log.success(`查询考勤记录成功: 共${records.data?.data?.length || 0}条记录`);
    
    const today = new Date().toISOString().split('T')[0];
    const checkin = await api.post('/hr/attendance/checkin', {
      type: 'checkin',
      date: today,
      time: `${today} 09:00:00`,
      location: '办公室',
      notes: '测试打卡'
    });
    log.success(`考勤打卡成功: ID=${checkin.data?.data?.id}`);
  } catch (error) {
    log.error(`考勤管理测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试薪酬管理
  log.info('测试薪酬管理...');
  try {
    const salaries = await api.get('/hr/salary/records');
    log.success(`查询薪酬记录成功: 共${salaries.data?.data?.length || 0}条记录`);
    
    const newSalary = await api.post('/hr/salary/records', {
      user_id: 2,
      year: 2025,
      month: 1,
      base_salary: 20000,
      bonus: 5000,
      allowance: 2000,
      deduction: 1000
    });
    log.success(`创建薪酬记录成功: ID=${newSalary.data?.data?.id}`);
    
    const salaryId = newSalary.data?.data?.id;
    
    await api.delete(`/hr/salary/records/${salaryId}`);
    log.success('删除薪酬记录成功');
  } catch (error) {
    log.error(`薪酬管理测试失败: ${error.response?.data?.message || error.message}`);
  }
};

// 测试财务模块
const testFinanceModule = async () => {
  log.title('=== 测试财务模块 ===');
  
  // 测试总账科目
  log.info('测试总账科目管理...');
  try {
    const accounts = await api.get('/finance/general-ledger/accounts');
    log.success(`查询总账科目成功: 共${accounts.data?.data?.length || 0}条记录`);
    
    const newAccount = await api.post('/finance/general-ledger/accounts', {
      code: '9999',
      name: '测试科目',
      type: 'expense',
      parent_id: 0,
      level: 1
    });
    log.success(`创建总账科目成功: ID=${newAccount.data?.data?.id}`);
    
    const accountId = newAccount.data?.data?.id;
    
    await api.put(`/finance/general-ledger/accounts/${accountId}`, {
      name: '测试科目（已更新）'
    });
    log.success('更新总账科目成功');
    
    await api.delete(`/finance/general-ledger/accounts/${accountId}`);
    log.success('删除总账科目成功');
  } catch (error) {
    log.error(`总账科目测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试应收账款
  log.info('测试应收账款管理...');
  try {
    const receivables = await api.get('/finance/accounts-receivable');
    log.success(`查询应收账款成功: 共${receivables.data?.data?.length || 0}条记录`);
    
    const newReceivable = await api.post('/finance/accounts-receivable', {
      customer_name: '测试客户',
      invoice_number: 'INV-TEST-001',
      amount: 10000.00,
      due_date: '2025-12-31'
    });
    log.success(`创建应收账款成功: ID=${newReceivable.data?.data?.id}`);
    
    const receivableId = newReceivable.data?.data?.id;
    
    await api.put(`/finance/accounts-receivable/${receivableId}`, {
      customer_name: '测试客户（已更新）'
    });
    log.success('更新应收账款成功');
    
    await api.delete(`/finance/accounts-receivable/${receivableId}`);
    log.success('删除应收账款成功');
  } catch (error) {
    log.error(`应收账款测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试应付账款
  log.info('测试应付账款管理...');
  try {
    const payables = await api.get('/finance/accounts-payable');
    log.success(`查询应付账款成功: 共${payables.data?.data?.length || 0}条记录`);
    
    const newPayable = await api.post('/finance/accounts-payable', {
      supplier_name: '测试供应商',
      invoice_number: 'INV-SUP-TEST-001',
      amount: 5000.00,
      due_date: '2025-12-31'
    });
    log.success(`创建应付账款成功: ID=${newPayable.data?.data?.id}`);
    
    const payableId = newPayable.data?.data?.id;
    
    await api.put(`/finance/accounts-payable/${payableId}`, {
      supplier_name: '测试供应商（已更新）'
    });
    log.success('更新应付账款成功');
    
    await api.delete(`/finance/accounts-payable/${payableId}`);
    log.success('删除应付账款成功');
  } catch (error) {
    log.error(`应付账款测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试固定资产
  log.info('测试固定资产管理...');
  try {
    const assets = await api.get('/finance/fixed-assets');
    log.success(`查询固定资产成功: 共${assets.data?.data?.length || 0}条记录`);
    
    const newAsset = await api.post('/finance/fixed-assets', {
      name: '测试资产',
      code: 'FA-TEST-001',
      category: '电子设备',
      purchase_price: 5000.00,
      purchase_date: '2025-01-01'
    });
    log.success(`创建固定资产成功: ID=${newAsset.data?.data?.id}`);
    
    const assetId = newAsset.data?.data?.id;
    
    await api.put(`/finance/fixed-assets/${assetId}`, {
      name: '测试资产（已更新）'
    });
    log.success('更新固定资产成功');
    
    await api.delete(`/finance/fixed-assets/${assetId}`);
    log.success('删除固定资产成功');
  } catch (error) {
    log.error(`固定资产测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试预算管理
  log.info('测试预算管理...');
  try {
    const budgets = await api.get('/finance/budgeting');
    log.success(`查询预算成功: 共${budgets.data?.data?.length || 0}条记录`);
    
    const newBudget = await api.post('/finance/budgeting', {
      name: '测试预算',
      year: 2025,
      amount: 100000.00,
      department: '测试部门',
      category: '管理费用'
    });
    log.success(`创建预算成功: ID=${newBudget.data?.data?.id}`);
    
    const budgetId = newBudget.data?.data?.id;
    
    await api.put(`/finance/budgeting/${budgetId}`, {
      name: '测试预算（已更新）'
    });
    log.success('更新预算成功');
    
    await api.delete(`/finance/budgeting/${budgetId}`);
    log.success('删除预算成功');
  } catch (error) {
    log.error(`预算管理测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试成本核算
  log.info('测试成本核算管理...');
  try {
    const costCenters = await api.get('/finance/cost-accounting/cost-centers');
    log.success(`查询成本中心成功: 共${costCenters.data?.data?.length || 0}条记录`);
    
    const newCostCenter = await api.post('/finance/cost-accounting/cost-centers', {
      name: '测试成本中心',
      code: 'CC-TEST-001'
    });
    log.success(`创建成本中心成功: ID=${newCostCenter.data?.data?.id}`);
    
    const costCenterId = newCostCenter.data?.data?.id;
    
    await api.put(`/finance/cost-accounting/cost-centers/${costCenterId}`, {
      name: '测试成本中心（已更新）'
    });
    log.success('更新成本中心成功');
    
    await api.delete(`/finance/cost-accounting/cost-centers/${costCenterId}`);
    log.success('删除成本中心成功');
  } catch (error) {
    log.error(`成本核算测试失败: ${error.response?.data?.message || error.message}`);
  }
  
  // 测试税务管理
  log.info('测试税务管理...');
  try {
    const taxDeclarations = await api.get('/finance/tax-management/declarations');
    log.success(`查询税务申报成功: 共${taxDeclarations.data?.data?.length || 0}条记录`);
    
    const newTax = await api.post('/finance/tax-management/declarations', {
      tax_type: 'vat',
      period: '2025-01',
      amount: 5000.00
    });
    log.success(`创建税务申报成功: ID=${newTax.data?.data?.id}`);
    
    const taxId = newTax.data?.data?.id;
    
    await api.put(`/finance/tax-management/${taxId}`, {
      amount: 6000.00
    });
    log.success('更新税务申报成功');
    
    await api.delete(`/finance/tax-management/${taxId}`);
    log.success('删除税务申报成功');
  } catch (error) {
    log.error(`税务管理测试失败: ${error.response?.data?.message || error.message}`);
  }
};

// 主函数
const runTests = async () => {
  console.log('\n========================================');
  console.log('        增删改查功能测试');
  console.log('========================================\n');
  
  // 检查服务器是否运行
  try {
    await axios.get(`${baseURL}/auth/test`).catch(() => {});
  } catch (error) {
    log.warning('无法连接到服务器，请确保服务器正在运行: npm run dev');
    process.exit(1);
  }
  
  // 登录
  const loggedIn = await login();
  if (!loggedIn) {
    log.error('登录失败，测试终止');
    process.exit(1);
  }
  
  // 更新axios实例的headers
  api.defaults.headers['Authorization'] = `Bearer ${authToken}`;
  
  // 运行测试
  try {
    await testSystemModule();
    await testHRModule();
    await testFinanceModule();
    
    log.title('\n=== 测试完成 ===');
    log.success('所有模块测试完成！');
  } catch (error) {
    log.error(`测试过程中出错: ${error.message}`);
    process.exit(1);
  }
};

// 开始测试
runTests().catch(error => {
  log.error(`测试失败: ${error.message}`);
  process.exit(1);
});

