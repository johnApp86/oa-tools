import request from './request'

// 总账科目相关 API
// 获取总账科目列表
export const getGeneralLedgerAccounts = (params) => {
  return request({
    url: '/finance/general-ledger/accounts',
    method: 'get',
    params
  })
}

// 创建总账科目
export const createGeneralLedgerAccount = (data) => {
  return request({
    url: '/finance/general-ledger/accounts',
    method: 'post',
    data
  })
}

// 更新总账科目
export const updateGeneralLedgerAccount = (id, data) => {
  return request({
    url: `/finance/general-ledger/accounts/${id}`,
    method: 'put',
    data
  })
}

// 删除总账科目
export const deleteGeneralLedgerAccount = (id) => {
  return request({
    url: `/finance/general-ledger/accounts/${id}`,
    method: 'delete'
  })
}

// 获取总账凭证列表
export const getGeneralLedgerVouchers = (params) => {
  return request({
    url: '/finance/general-ledger/vouchers',
    method: 'get',
    params
  })
}

// 创建总账凭证
export const createGeneralLedgerVoucher = (data) => {
  return request({
    url: '/finance/general-ledger/vouchers',
    method: 'post',
    data
  })
}

// 获取总账余额
export const getGeneralLedgerBalances = (params) => {
  return request({
    url: '/finance/general-ledger/balances',
    method: 'get',
    params
  })
}

// ==================== 应收账款 ====================

// 获取应收账款列表
export const getAccountsReceivable = (params) => {
  return request({
    url: '/finance/accounts-receivable',
    method: 'get',
    params
  })
}

// 创建应收账款
export const createAccountReceivable = (data) => {
  return request({
    url: '/finance/accounts-receivable',
    method: 'post',
    data
  })
}

// 更新应收账款
export const updateAccountReceivable = (id, data) => {
  return request({
    url: `/finance/accounts-receivable/${id}`,
    method: 'put',
    data
  })
}

// 删除应收账款
export const deleteAccountReceivable = (id) => {
  return request({
    url: `/finance/accounts-receivable/${id}`,
    method: 'delete'
  })
}

// 添加收款记录
export const addReceivablePayment = (id, data) => {
  return request({
    url: `/finance/accounts-receivable/${id}/payments`,
    method: 'post',
    data
  })
}

// ==================== 应付账款 ====================

// 获取应付账款列表
export const getAccountsPayable = (params) => {
  return request({
    url: '/finance/accounts-payable',
    method: 'get',
    params
  })
}

// 创建应付账款
export const createAccountPayable = (data) => {
  return request({
    url: '/finance/accounts-payable',
    method: 'post',
    data
  })
}

// 更新应付账款
export const updateAccountPayable = (id, data) => {
  return request({
    url: `/finance/accounts-payable/${id}`,
    method: 'put',
    data
  })
}

// 删除应付账款
export const deleteAccountPayable = (id) => {
  return request({
    url: `/finance/accounts-payable/${id}`,
    method: 'delete'
  })
}

// 添加付款记录
export const addPayablePayment = (id, data) => {
  return request({
    url: `/finance/accounts-payable/${id}/payments`,
    method: 'post',
    data
  })
}

// ==================== 固定资产 ====================

// 获取固定资产列表
export const getFixedAssets = (params) => {
  return request({
    url: '/finance/fixed-assets',
    method: 'get',
    params
  })
}

// 创建固定资产
export const createFixedAsset = (data) => {
  return request({
    url: '/finance/fixed-assets',
    method: 'post',
    data
  })
}

// 更新固定资产
export const updateFixedAsset = (id, data) => {
  return request({
    url: `/finance/fixed-assets/${id}`,
    method: 'put',
    data
  })
}

// 删除固定资产
export const deleteFixedAsset = (id) => {
  return request({
    url: `/finance/fixed-assets/${id}`,
    method: 'delete'
  })
}

// 计提折旧
export const addDepreciation = (id, data) => {
  return request({
    url: `/finance/fixed-assets/${id}/depreciation`,
    method: 'post',
    data
  })
}

// ==================== 现金管理 ====================

// 获取资金流水
export const getCashTransactions = (params) => {
  return request({
    url: '/finance/cash-management/transactions',
    method: 'get',
    params
  })
}

// 创建资金流水
export const createCashTransaction = (data) => {
  return request({
    url: '/finance/cash-management/transactions',
    method: 'post',
    data
  })
}

// 更新资金流水
export const updateCashTransaction = (id, data) => {
  return request({
    url: `/finance/cash-management/transactions/${id}`,
    method: 'put',
    data
  })
}

// 删除资金流水
export const deleteCashTransaction = (id) => {
  return request({
    url: `/finance/cash-management/transactions/${id}`,
    method: 'delete'
  })
}

// 获取账户余额
export const getCashBalances = (params) => {
  return request({
    url: '/finance/cash-management/balances',
    method: 'get',
    params
  })
}

// 资金调拨
export const transferFunds = (data) => {
  return request({
    url: '/finance/cash-management/transfer',
    method: 'post',
    data
  })
}

// ==================== 成本核算 ====================

// 获取成本中心列表
export const getCostCenters = (params) => {
  return request({
    url: '/finance/cost-accounting/cost-centers',
    method: 'get',
    params
  })
}

// 创建成本中心
export const createCostCenter = (data) => {
  return request({
    url: '/finance/cost-accounting/cost-centers',
    method: 'post',
    data
  })
}

// 更新成本中心
export const updateCostCenter = (id, data) => {
  return request({
    url: `/finance/cost-accounting/cost-centers/${id}`,
    method: 'put',
    data
  })
}

// 删除成本中心
export const deleteCostCenter = (id) => {
  return request({
    url: `/finance/cost-accounting/cost-centers/${id}`,
    method: 'delete'
  })
}

// 获取成本分配
export const getCostAllocations = (params) => {
  return request({
    url: '/finance/cost-accounting/allocations',
    method: 'get',
    params
  })
}

// 创建成本分配
export const createCostAllocation = (data) => {
  return request({
    url: '/finance/cost-accounting/allocations',
    method: 'post',
    data
  })
}

// 更新成本分配
export const updateCostAllocation = (id, data) => {
  return request({
    url: `/finance/cost-accounting/allocations/${id}`,
    method: 'put',
    data
  })
}

// 删除成本分配
export const deleteCostAllocation = (id) => {
  return request({
    url: `/finance/cost-accounting/allocations/${id}`,
    method: 'delete'
  })
}

// ==================== 预算管理 ====================

// 获取预算列表
export const getBudgets = (params) => {
  return request({
    url: '/finance/budgeting',
    method: 'get',
    params
  })
}

// 创建预算
export const createBudget = (data) => {
  return request({
    url: '/finance/budgeting',
    method: 'post',
    data
  })
}

// 更新预算
export const updateBudget = (id, data) => {
  return request({
    url: `/finance/budgeting/${id}`,
    method: 'put',
    data
  })
}

// 删除预算
export const deleteBudget = (id) => {
  return request({
    url: `/finance/budgeting/${id}`,
    method: 'delete'
  })
}

// 获取预算执行情况
export const getBudgetExecution = (id, params) => {
  return request({
    url: `/finance/budgeting/${id}/execution`,
    method: 'get',
    params
  })
}

// ==================== 财务报表 ====================

// 获取资产负债表
export const getBalanceSheet = (params) => {
  return request({
    url: '/finance/financial-reporting/balance-sheet',
    method: 'get',
    params
  })
}

// 获取利润表
export const getIncomeStatement = (params) => {
  return request({
    url: '/finance/financial-reporting/income-statement',
    method: 'get',
    params
  })
}

// 获取现金流量表
export const getCashFlowStatement = (params) => {
  return request({
    url: '/finance/financial-reporting/cash-flow',
    method: 'get',
    params
  })
}

// 获取财务指标
export const getFinancialRatios = (params) => {
  return request({
    url: '/finance/financial-reporting/financial-ratios',
    method: 'get',
    params
  })
}

// ==================== 税务管理 ====================

// 获取税务申报记录
export const getTaxDeclarations = (params) => {
  return request({
    url: '/finance/tax-management/declarations',
    method: 'get',
    params
  })
}

// 创建税务申报
export const createTaxDeclaration = (data) => {
  return request({
    url: '/finance/tax-management/declarations',
    method: 'post',
    data
  })
}

// 更新税务申报
export const updateTaxDeclaration = (id, data) => {
  return request({
    url: `/finance/tax-management/${id}`,
    method: 'put',
    data
  })
}

// 删除税务申报
export const deleteTaxDeclaration = (id) => {
  return request({
    url: `/finance/tax-management/${id}`,
    method: 'delete'
  })
}

// ==================== 费用管理 ====================

// 获取费用申请列表
export const getExpenseApplications = (params) => {
  return request({
    url: '/finance/expense-management/applications',
    method: 'get',
    params
  })
}

// 创建费用申请
export const createExpenseApplication = (data) => {
  return request({
    url: '/finance/expense-management/applications',
    method: 'post',
    data
  })
}

// 审批费用申请
export const approveExpenseApplication = (id) => {
  return request({
    url: `/finance/expense-management/applications/${id}/approve`,
    method: 'put'
  })
}

// 拒绝费用申请
export const rejectExpenseApplication = (id) => {
  return request({
    url: `/finance/expense-management/applications/${id}/reject`,
    method: 'put'
  })
}

// 获取费用统计
export const getExpenseStatistics = (params) => {
  return request({
    url: '/finance/expense-management/statistics',
    method: 'get',
    params
  })
}

