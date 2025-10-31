const express = require('express');
const router = express.Router();
const financialReportingController = require('../controllers/financialReportingController');

// 获取资产负债表
router.get('/balance-sheet', financialReportingController.getBalanceSheet);

// 获取利润表
router.get('/income-statement', financialReportingController.getIncomeStatement);

// 获取现金流量表
router.get('/cash-flow', financialReportingController.getCashFlowStatement);

// 获取财务指标
router.get('/financial-ratios', financialReportingController.getFinancialRatios);

module.exports = router;
