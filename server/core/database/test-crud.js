#!/usr/bin/env node

/**
 * 测试脚本 - 测试每个模块的增删改查功能
 * 
 * 位置: server/core/database/test-crud.js
 * 运行方式: node server/core/database/test-crud.js
 */

const axios = require('axios');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// 默认端口和测试端口
const DEFAULT_PORT = 3001;
const TEST_PORT = 3002;
let currentPort = DEFAULT_PORT;
let baseURL = `http://localhost:${DEFAULT_PORT}/api`;
let testServerProcess = null;
let serverStartedByScript = false;

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
    const loginURL = `${baseURL}/auth/login`;
    log.info(`尝试登录: ${loginURL}`);
    const response = await axios.post(loginURL, {
      username: 'admin',
      password: 'admin123'
    }, {
      timeout: 5000,
      validateStatus: function (status) {
        return status >= 200 && status < 500; // 不抛出错误，手动处理
      }
    });
    
    if (response.status === 200 && response.data && response.data.token) {
      authToken = response.data.token;
      log.success('登录成功，获取token');
      return true;
    }
    
    if (response.status === 401) {
      log.error(`登录失败: 用户名或密码错误`);
      log.error(`请检查默认账号: admin / admin123`);
      log.warning('提示: 如果密码不对，请检查数据库初始化脚本中的密码');
      return false;
    }
    
    log.error(`登录失败: 响应状态码 ${response.status}`);
    log.error(`响应数据: ${JSON.stringify(response.data)}`);
    return false;
  } catch (error) {
    if (error.response) {
      log.error(`登录失败: HTTP ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
      if (error.response.status === 401) {
        log.error(`用户名或密码错误，请检查: admin / admin123`);
      }
    } else if (error.request) {
      log.error(`登录失败: 无法连接到服务器`);
      log.error(`错误类型: ${error.code || 'UNKNOWN_ERROR'}`);
      log.error(`错误消息: ${error.message}`);
      log.error(`请求URL: ${baseURL}/auth/login`);
      console.log('');
      log.warning('可能的原因：');
      log.warning('1. 服务器未运行');
      log.warning('   解决方案: 打开新终端运行 "npm run dev" 或 "cd server && npm run dev"');
      log.warning('2. 端口号不正确');
      log.warning(`   当前检查端口: 3001`);
      log.warning('   如果使用其他端口，请修改 test-crud.js 中的 baseURL');
      log.warning('3. 防火墙或网络问题');
      log.warning('   检查防火墙设置或网络连接');
      console.log('');
      log.info('启动服务器命令：');
      log.info('   cd server');
      log.info('   npm run dev');
      log.info('   或者');
      log.info('   npm run dev  (在项目根目录)');
    } else {
      log.error(`登录失败: ${error.message}`);
      if (error.stack) {
        console.log('错误堆栈:', error.stack);
      }
    }
    return false;
  }
};

// 创建axios实例（baseURL会在服务器启动后更新）
let api = axios.create({
  baseURL,
  headers: {
    'Authorization': `Bearer ${authToken}`
  }
});

// 启动测试服务器
const startTestServer = () => {
  return new Promise((resolve, reject) => {
    log.info(`正在启动测试服务器 (端口 ${TEST_PORT})...`);
    
    // 获取项目根目录路径
    // test-crud.js 位于 server/core/database/
    // 向上3级到项目根目录
    const projectRoot = path.resolve(__dirname, '../../..');
    const serverPath = path.join(projectRoot, 'server', 'index.js');
    
    // 输出调试信息
    log.info(`项目根目录: ${projectRoot}`);
    log.info(`服务器文件路径: ${serverPath}`);
    
    // 检查服务器文件是否存在
    let actualServerPath = serverPath;
    let actualProjectRoot = projectRoot;
    
    if (!fs.existsSync(serverPath)) {
      log.warning(`服务器文件不存在: ${serverPath}`);
      // 尝试查找备用路径
      const altPath = path.join(projectRoot, '..', 'server', 'index.js');
      log.info(`尝试备用路径: ${altPath}`);
      if (fs.existsSync(altPath)) {
        log.warning(`找到备用路径，使用: ${altPath}`);
        actualServerPath = altPath;
        actualProjectRoot = path.join(projectRoot, '..');
      } else {
        reject(new Error(`服务器文件不存在: ${serverPath}`));
        return;
      }
    }
    
    // 启动服务器，使用测试端口
    const env = {
      ...process.env,
      PORT: TEST_PORT.toString()
    };
    
    testServerProcess = spawn('node', [actualServerPath], {
      cwd: actualProjectRoot,
      env: env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let serverOutput = '';
    let errorOutput = '';
    
    testServerProcess.stdout.on('data', (data) => {
      const output = data.toString();
      serverOutput += output;
      // 服务器启动成功会输出 "服务器运行在 http://localhost:3002"
      if (output.includes(`服务器运行在 http://localhost:${TEST_PORT}`)) {
        log.success(`测试服务器已启动 (端口 ${TEST_PORT})`);
      }
    });
    
    testServerProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    testServerProcess.on('error', (error) => {
      log.error(`启动服务器失败: ${error.message}`);
      reject(error);
    });
    
    testServerProcess.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log.error(`服务器异常退出 (代码: ${code})`);
        if (errorOutput) {
          console.log('服务器错误输出:', errorOutput);
        }
      }
    });
    
    // 等待服务器启动（最多等待30秒）
    const maxWaitTime = 30000;
    const startTime = Date.now();
    const checkInterval = 500;
    
    const checkServer = async () => {
      try {
        const response = await axios.get(`http://localhost:${TEST_PORT}/api/health`, {
          timeout: 1000
        });
        if (response.status === 200) {
          currentPort = TEST_PORT;
          baseURL = `http://localhost:${TEST_PORT}/api`;
          // 更新 axios 实例的 baseURL
          api = axios.create({
            baseURL,
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });
          resolve();
          return;
        }
      } catch (error) {
        // 服务器尚未就绪，继续等待
      }
      
      if (Date.now() - startTime < maxWaitTime) {
        setTimeout(checkServer, checkInterval);
      } else {
        reject(new Error('等待服务器启动超时'));
      }
    };
    
    // 延迟一点开始检查，给服务器启动时间
    setTimeout(checkServer, 1000);
  });
};

// 关闭测试服务器
const stopTestServer = () => {
  return new Promise((resolve) => {
    if (testServerProcess && serverStartedByScript) {
      log.info('正在关闭测试服务器...');
      testServerProcess.kill('SIGTERM');
      
      testServerProcess.on('exit', () => {
        log.success('测试服务器已关闭');
        testServerProcess = null;
        resolve();
      });
      
      // 如果服务器在3秒内没有关闭，强制关闭
      setTimeout(() => {
        if (testServerProcess) {
          log.warning('强制关闭测试服务器...');
          testServerProcess.kill('SIGKILL');
          testServerProcess = null;
        }
        resolve();
      }, 3000);
    } else {
      resolve();
    }
  });
};

// 测试系统模块
const testSystemModule = async () => {
  log.title('=== 测试系统模块 ===');
  
  // 测试组织管理
  log.info('测试组织管理...');
  try {
    // 查询
    const orgs = await api.get('/system/organizations');
    const orgList = orgs.data?.data || orgs.data || [];
    log.success(`查询组织成功: 共${Array.isArray(orgList) ? orgList.length : 0}条记录`);
    
    // 使用时间戳生成唯一代码
    const timestamp = Date.now();
    const orgCode = `TEST_DEPT_${timestamp}`;
    
    // 创建
    const newOrg = await api.post('/system/organizations', {
      name: `测试部门_${timestamp}`,
      code: orgCode,
      parent_id: 1,
      level: 2
    });
    // 提取ID：可能是 organizationId 或 id
    const orgId = newOrg.data?.organizationId || newOrg.data?.data?.organizationId || newOrg.data?.data?.id || newOrg.data?.id;
    if (!orgId || typeof orgId !== 'number') {
      log.error(`创建组织失败: 无法获取ID，响应: ${JSON.stringify(newOrg.data)}`);
      throw new Error('无法获取组织ID');
    }
    log.success(`创建组织成功: ID=${orgId}`);
    
    // 更新时需要提供完整字段
    await api.put(`/system/organizations/${orgId}`, {
      name: `测试部门（已更新）_${timestamp}`,
      code: orgCode,
      parentId: 1,
      level: 2,
      sortOrder: 0,
      status: 1
    });
    log.success('更新组织成功');
    
    // 删除
    await api.delete(`/system/organizations/${orgId}`);
    log.success('删除组织成功');
  } catch (error) {
    if (error.response) {
      log.error(`组织管理测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`组织管理测试失败: ${error.message}`);
    }
  }
  
  // 测试用户管理
  log.info('测试用户管理...');
  try {
    const users = await api.get('/system/users');
    const userList = users.data?.data || users.data || [];
    log.success(`查询用户成功: 共${Array.isArray(userList) ? userList.length : 0}条记录`);
    
    // 使用时间戳生成唯一用户名
    const timestamp = Date.now();
    const username = `testuser_${timestamp}`;
    
    const newUser = await api.post('/system/users', {
      username: username,
      real_name: `测试用户_${timestamp}`,
      email: `testuser_${timestamp}@example.com`,
      password: '123456',
      organization_id: 1,
      position_id: 2
    });
    // 提取ID：可能是 userId 或 id
    const userId = newUser.data?.userId || newUser.data?.data?.userId || newUser.data?.data?.id || newUser.data?.id;
    if (!userId || typeof userId !== 'number') {
      log.error(`创建用户失败: 无法获取ID，响应: ${JSON.stringify(newUser.data)}`);
      throw new Error('无法获取用户ID');
    }
    log.success(`创建用户成功: ID=${userId}`);
    
    // 更新时需要提供完整字段
    await api.put(`/system/users/${userId}`, {
      username: username,  // 必须提供username
      realName: `测试用户（已更新）_${timestamp}`,
      email: `testuser_${timestamp}@example.com`,
      phone: null,
      organizationId: 1,
      positionId: 2,
      status: 1
    });
    log.success('更新用户成功');
    
    await api.delete(`/system/users/${userId}`);
    log.success('删除用户成功');
  } catch (error) {
    if (error.response) {
      log.error(`用户管理测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`用户管理测试失败: ${error.message}`);
    }
  }
};

// 测试HR模块
const testHRModule = async () => {
  log.title('=== 测试HR模块 ===');
  
  // 测试招聘管理
  log.info('测试招聘管理...');
  try {
    const positions = await api.get('/hr/recruitment/positions');
    const positionList = positions.data?.data || positions.data || [];
    log.success(`查询招聘职位成功: 共${Array.isArray(positionList) ? positionList.length : 0}条记录`);
    
    const timestamp = Date.now();
    const newPosition = await api.post('/hr/recruitment/positions', {
      title: `测试职位_${timestamp}`,
      position_id: 2,
      org_id: 1,
      description: '这是一个测试职位',
      requirements: '测试要求',
      salary_range: '10K-15K',
      urgent_level: 1
    });
    const positionId = newPosition.data?.data?.id || newPosition.data?.id || newPosition.data;
    log.success(`创建招聘职位成功: ID=${positionId}`);
    
    // 注意：招聘管理没有PUT更新接口，只有DELETE
    await api.delete(`/hr/recruitment/positions/${positionId}`);
    log.success('删除招聘职位成功');
  } catch (error) {
    if (error.response) {
      log.error(`招聘管理测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`招聘管理测试失败: ${error.message}`);
    }
  }
  
  // 测试考勤管理
  log.info('测试考勤管理...');
  try {
    const records = await api.get('/hr/attendance/records');
    const recordList = records.data?.data || records.data || [];
    log.success(`查询考勤记录成功: 共${Array.isArray(recordList) ? recordList.length : 0}条记录`);
    
    const today = new Date().toISOString().split('T')[0];
    const checkin = await api.post('/hr/attendance/checkin', {
      user_id: 1,  // 添加必需的user_id
      type: 'checkin',
      date: today,
      time: `${today} 09:00:00`,
      location: '办公室',
      notes: '测试打卡'
    });
    const checkinId = checkin.data?.data?.id || checkin.data?.id || checkin.data;
    log.success(`考勤打卡成功: ID=${checkinId}`);
  } catch (error) {
    if (error.response) {
      log.error(`考勤管理测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`考勤管理测试失败: ${error.message}`);
    }
  }
  
  // 测试薪酬管理
  log.info('测试薪酬管理...');
  try {
    const salaries = await api.get('/hr/salary/records');
    const salaryList = salaries.data?.data || salaries.data || [];
    log.success(`查询薪酬记录成功: 共${Array.isArray(salaryList) ? salaryList.length : 0}条记录`);
    
    const newSalary = await api.post('/hr/salary/records', {
      user_id: 2,
      year: 2025,
      month: 1,
      base_salary: 20000,
      bonus: 5000,
      allowance: 2000,
      deduction: 1000
    });
    const salaryId = newSalary.data?.data?.id || newSalary.data?.id || newSalary.data;
    log.success(`创建薪酬记录成功: ID=${salaryId}`);
    
    await api.delete(`/hr/salary/records/${salaryId}`);
    log.success('删除薪酬记录成功');
  } catch (error) {
    if (error.response) {
      log.error(`薪酬管理测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`薪酬管理测试失败: ${error.message}`);
    }
  }
};

// 测试财务模块
const testFinanceModule = async () => {
  log.title('=== 测试财务模块 ===');
  
  // 测试总账科目
  log.info('测试总账科目管理...');
  try {
    const accounts = await api.get('/finance/general-ledger/accounts');
    const accountList = accounts.data?.data || accounts.data || [];
    log.success(`查询总账科目成功: 共${Array.isArray(accountList) ? accountList.length : 0}条记录`);
    
    // 使用时间戳生成唯一代码
    const timestamp = Date.now();
    const accountCode = `999${timestamp.toString().slice(-6)}`;
    
    const newAccount = await api.post('/finance/general-ledger/accounts', {
      code: accountCode,
      name: `测试科目_${timestamp}`,
      type: 'expense',  // 允许的类型: asset, liability, equity, revenue, expense
      parent_id: 0,
      level: 1
    });
    const accountId = newAccount.data?.data?.id || newAccount.data?.id || newAccount.data;
    log.success(`创建总账科目成功: ID=${accountId}`);
    
    // 更新时需要提供完整字段，包括type
    await api.put(`/finance/general-ledger/accounts/${accountId}`, {
      name: `测试科目（已更新）_${timestamp}`,
      type: 'expense',  // 必须提供type字段
      parent_id: 0,
      level: 1,
      status: 1
    });
    log.success('更新总账科目成功');
    
    await api.delete(`/finance/general-ledger/accounts/${accountId}`);
    log.success('删除总账科目成功');
  } catch (error) {
    if (error.response) {
      log.error(`总账科目测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`总账科目测试失败: ${error.message}`);
    }
  }
  
  // 测试应收账款
  log.info('测试应收账款管理...');
  try {
    const receivables = await api.get('/finance/accounts-receivable');
    const receivableList = receivables.data?.data || receivables.data || [];
    log.success(`查询应收账款成功: 共${Array.isArray(receivableList) ? receivableList.length : 0}条记录`);
    
    const timestamp = Date.now();
    const invoiceNumber = `INV-TEST-${timestamp}`;
    
    const newReceivable = await api.post('/finance/accounts-receivable', {
      customer_name: `测试客户_${timestamp}`,
      invoice_number: invoiceNumber,
      amount: 10000.00,
      due_date: '2025-12-31'
    });
    const receivableId = newReceivable.data?.data?.id || newReceivable.data?.id || newReceivable.data;
    log.success(`创建应收账款成功: ID=${receivableId}`);
    
    // 更新时需要提供完整字段，不能只更新一个字段
    await api.put(`/finance/accounts-receivable/${receivableId}`, {
      customer_name: `测试客户（已更新）_${timestamp}`,
      invoice_number: invoiceNumber,
      amount: 10000.00,
      due_date: '2025-12-31',
      description: null,
      status: 1
    });
    log.success('更新应收账款成功');
    
    await api.delete(`/finance/accounts-receivable/${receivableId}`);
    log.success('删除应收账款成功');
  } catch (error) {
    if (error.response) {
      log.error(`应收账款测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`应收账款测试失败: ${error.message}`);
    }
  }
  
  // 测试应付账款
  log.info('测试应付账款管理...');
  try {
    const payables = await api.get('/finance/accounts-payable');
    const payableList = payables.data?.data || payables.data || [];
    log.success(`查询应付账款成功: 共${Array.isArray(payableList) ? payableList.length : 0}条记录`);
    
    const timestamp = Date.now();
    const invoiceNumber = `INV-SUP-TEST-${timestamp}`;
    
    const newPayable = await api.post('/finance/accounts-payable', {
      supplier_name: `测试供应商_${timestamp}`,
      invoice_number: invoiceNumber,
      amount: 5000.00,
      due_date: '2025-12-31'
    });
    const payableId = newPayable.data?.data?.id || newPayable.data?.id || newPayable.data;
    log.success(`创建应付账款成功: ID=${payableId}`);
    
    // 更新时需要提供完整字段
    await api.put(`/finance/accounts-payable/${payableId}`, {
      supplier_name: `测试供应商（已更新）_${timestamp}`,
      invoice_number: invoiceNumber,
      amount: 5000.00,
      due_date: '2025-12-31',
      description: null,
      status: 1
    });
    log.success('更新应付账款成功');
    
    await api.delete(`/finance/accounts-payable/${payableId}`);
    log.success('删除应付账款成功');
  } catch (error) {
    if (error.response) {
      log.error(`应付账款测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`应付账款测试失败: ${error.message}`);
    }
  }
  
  // 测试固定资产
  log.info('测试固定资产管理...');
  try {
    const assets = await api.get('/finance/fixed-assets');
    const assetList = assets.data?.data || assets.data || [];
    log.success(`查询固定资产成功: 共${Array.isArray(assetList) ? assetList.length : 0}条记录`);
    
    const timestamp = Date.now();
    const assetCode = `FA-TEST-${timestamp}`;
    
    const newAsset = await api.post('/finance/fixed-assets', {
      name: `测试资产_${timestamp}`,
      code: assetCode,
      category: '电子设备',
      purchase_price: 5000.00,
      purchase_date: '2025-01-01',
      depreciation_method: 'straight_line',
      useful_life: 5,
      description: '测试资产描述'
    });
    const assetId = newAsset.data?.data?.id || newAsset.data?.id || newAsset.data;
    log.success(`创建固定资产成功: ID=${assetId}`);
    
    await api.put(`/finance/fixed-assets/${assetId}`, {
      name: `测试资产（已更新）_${timestamp}`,
      code: assetCode,
      category: '电子设备',
      purchase_price: 5000.00,
      purchase_date: '2025-01-01',
      depreciation_method: 'straight_line',
      useful_life: 5,
      description: '测试资产描述（已更新）'
    });
    log.success('更新固定资产成功');
    
    await api.delete(`/finance/fixed-assets/${assetId}`);
    log.success('删除固定资产成功');
  } catch (error) {
    if (error.response) {
      log.error(`固定资产测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`固定资产测试失败: ${error.message}`);
    }
  }
  
  // 测试预算管理
  log.info('测试预算管理...');
  try {
    const budgets = await api.get('/finance/budgeting');
    const budgetList = budgets.data?.data || budgets.data || [];
    log.success(`查询预算成功: 共${Array.isArray(budgetList) ? budgetList.length : 0}条记录`);
    
    const timestamp = Date.now();
    const newBudget = await api.post('/finance/budgeting', {
      name: `测试预算_${timestamp}`,
      year: 2025,
      amount: 100000.00,
      department: '测试部门',
      category: '管理费用',
      description: '测试预算描述',
      status: 1
    });
    const budgetId = newBudget.data?.data?.id || newBudget.data?.id || newBudget.data;
    log.success(`创建预算成功: ID=${budgetId}`);
    
    // 更新时需要提供完整字段
    await api.put(`/finance/budgeting/${budgetId}`, {
      name: `测试预算（已更新）_${timestamp}`,
      year: 2025,
      amount: 100000.00,
      department: '测试部门',
      category: '管理费用',
      description: '测试预算描述（已更新）',
      status: 1
    });
    log.success('更新预算成功');
    
    await api.delete(`/finance/budgeting/${budgetId}`);
    log.success('删除预算成功');
  } catch (error) {
    if (error.response) {
      log.error(`预算管理测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`预算管理测试失败: ${error.message}`);
    }
  }
  
  // 测试成本核算
  log.info('测试成本核算管理...');
  try {
    const costCenters = await api.get('/finance/cost-accounting/cost-centers');
    const costCenterList = costCenters.data?.data || costCenters.data || [];
    log.success(`查询成本中心成功: 共${Array.isArray(costCenterList) ? costCenterList.length : 0}条记录`);
    
    const timestamp = Date.now();
    const costCenterCode = `CC-TEST-${timestamp}`;
    
    const newCostCenter = await api.post('/finance/cost-accounting/cost-centers', {
      name: `测试成本中心_${timestamp}`,
      code: costCenterCode,
      description: '测试成本中心描述',
      parent_id: null,
      status: 1
    });
    const costCenterId = newCostCenter.data?.data?.id || newCostCenter.data?.id || newCostCenter.data;
    log.success(`创建成本中心成功: ID=${costCenterId}`);
    
    await api.put(`/finance/cost-accounting/cost-centers/${costCenterId}`, {
      name: `测试成本中心（已更新）_${timestamp}`,
      code: costCenterCode,
      description: '测试成本中心描述（已更新）',
      parent_id: null,
      status: 1
    });
    log.success('更新成本中心成功');
    
    await api.delete(`/finance/cost-accounting/cost-centers/${costCenterId}`);
    log.success('删除成本中心成功');
  } catch (error) {
    if (error.response) {
      log.error(`成本核算测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`成本核算测试失败: ${error.message}`);
    }
  }
  
  // 测试税务管理
  log.info('测试税务管理...');
  try {
    const taxDeclarations = await api.get('/finance/tax-management/declarations');
    const taxList = taxDeclarations.data?.data || taxDeclarations.data || [];
    log.success(`查询税务申报成功: 共${Array.isArray(taxList) ? taxList.length : 0}条记录`);
    
    const newTax = await api.post('/finance/tax-management/declarations', {
      tax_type: 'vat',
      period: '2025-01',
      amount: 5000.00
    });
    const taxId = newTax.data?.data?.id || newTax.data?.id || newTax.data;
    log.success(`创建税务申报成功: ID=${taxId}`);
    
    // 更新时需要提供完整字段
    await api.put(`/finance/tax-management/${taxId}`, {
      tax_type: 'vat',
      period: '2025-01',
      amount: 6000.00,
      declaration_date: null,
      due_date: null,
      description: null,
      status: 1
    });
    log.success('更新税务申报成功');
    
    await api.delete(`/finance/tax-management/${taxId}`);
    log.success('删除税务申报成功');
  } catch (error) {
    if (error.response) {
      log.error(`税务管理测试失败: ${error.response.status} - ${error.response.data?.message || error.response.statusText}`);
    } else {
      log.error(`税务管理测试失败: ${error.message}`);
    }
  }
};

// 检查服务器是否运行
const checkServer = async (port = DEFAULT_PORT) => {
  const testBaseURL = `http://localhost:${port}/api`;
  try {
    // 尝试访问健康检查端点
    const response = await axios.get(`${testBaseURL}/health`, { timeout: 3000 });
    if (response.status === 200) {
      return { success: true, endpoint: '/health', port };
    }
    return { success: false, endpoint: '/health', error: `HTTP ${response.status}`, port };
  } catch (error) {
    // 返回详细错误信息
    const errorInfo = {
      success: false,
      endpoint: '/health',
      code: error.code,
      message: error.message,
      fullError: error.code === 'ECONNREFUSED' ? '连接被拒绝（服务器未运行）' : error.message,
      port
    };
    return errorInfo;
  }
};

// 主函数
const runTests = async () => {
  console.log('\n========================================');
  console.log('        增删改查功能测试');
  console.log('========================================\n');
  
  // 检查默认端口服务器是否运行
  log.info(`正在检查服务器连接 (端口 ${DEFAULT_PORT})...`);
  log.info(`检查地址: http://localhost:${DEFAULT_PORT}/api/health`);
  let serverCheck = await checkServer(DEFAULT_PORT);
  
  if (!serverCheck.success) {
    log.warning(`端口 ${DEFAULT_PORT} 上未检测到服务器`);
    log.info(`将自动启动测试服务器 (端口 ${TEST_PORT})...`);
    console.log('');
    
    try {
      await startTestServer();
      serverStartedByScript = true;
      currentPort = TEST_PORT;
      baseURL = `http://localhost:${TEST_PORT}/api`;
      // 重新创建 axios 实例
      api = axios.create({
        baseURL,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      log.success(`测试服务器启动成功，使用端口 ${TEST_PORT}`);
    } catch (error) {
      log.error(`启动测试服务器失败: ${error.message}`);
      log.error('测试终止');
      process.exit(1);
    }
  } else {
    log.success(`服务器连接正常 (端口 ${DEFAULT_PORT})`);
    currentPort = DEFAULT_PORT;
    baseURL = `http://localhost:${DEFAULT_PORT}/api`;
    // 更新 axios 实例的 baseURL
    api = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
  }
  console.log('');
  
  // 登录
  log.info(`正在登录 (端口 ${currentPort})...`);
  const loggedIn = await login();
  if (!loggedIn) {
    log.error('登录失败，测试终止');
    log.error('请检查默认账号: admin / admin123');
    await stopTestServer();
    process.exit(1);
  }
  
  // 更新axios实例的headers
  api.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;
  
  // 运行测试
  try {
    await testSystemModule();
    await testHRModule();
    await testFinanceModule();
    
    log.title('\n=== 测试完成 ===');
    log.success('所有模块测试完成！');
  } catch (error) {
    log.error(`测试过程中出错: ${error.message}`);
    if (error.response) {
      log.error(`响应状态: ${error.response.status}`);
      log.error(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    await stopTestServer();
    process.exit(1);
  } finally {
    // 如果脚本启动了服务器，则关闭它
    if (serverStartedByScript) {
      await stopTestServer();
    }
  }
};

// 处理程序退出信号，确保关闭测试服务器
process.on('SIGINT', async () => {
  log.warning('\n收到退出信号，正在关闭测试服务器...');
  await stopTestServer();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  log.warning('\n收到终止信号，正在关闭测试服务器...');
  await stopTestServer();
  process.exit(0);
});

// 处理未捕获的异常
process.on('uncaughtException', async (error) => {
  log.error(`未捕获的异常: ${error.message}`);
  await stopTestServer();
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  log.error(`未处理的 Promise 拒绝: ${reason}`);
  await stopTestServer();
  process.exit(1);
});

// 开始测试
runTests().catch(async error => {
  log.error(`测试失败: ${error.message}`);
  await stopTestServer();
  process.exit(1);
});

