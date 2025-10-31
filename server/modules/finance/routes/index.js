const express = require('express');
const router = express.Router();

// 导入各个子路由
const generalLedgerRoutes = require('./generalLedger');
const accountsReceivableRoutes = require('./accountsReceivable');
const accountsPayableRoutes = require('./accountsPayable');
const fixedAssetsRoutes = require('./fixedAssets');
const cashManagementRoutes = require('./cashManagement');
const costAccountingRoutes = require('./costAccounting');
const budgetingRoutes = require('./budgeting');
const financialReportingRoutes = require('./financialReporting');
const taxManagementRoutes = require('./taxManagement');
const expenseManagementRoutes = require('./expenseManagement');

// 注册子路由
router.use('/general-ledger', generalLedgerRoutes);
router.use('/accounts-receivable', accountsReceivableRoutes);
router.use('/accounts-payable', accountsPayableRoutes);
router.use('/fixed-assets', fixedAssetsRoutes);
router.use('/cash-management', cashManagementRoutes);
router.use('/cost-accounting', costAccountingRoutes);
router.use('/budgeting', budgetingRoutes);
router.use('/financial-reporting', financialReportingRoutes);
router.use('/tax-management', taxManagementRoutes);
router.use('/expense-management', expenseManagementRoutes);

module.exports = router;
