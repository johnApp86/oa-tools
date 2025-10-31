const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const expenseManagementController = require('../controllers/expenseManagementController');

// 获取费用申请列表
router.get('/applications', expenseManagementController.getExpenseApplications);

// 创建费用申请
router.post('/applications', expenseManagementController.createExpenseApplication);

// 审批费用申请
router.put('/applications/:id/approve', expenseManagementController.approveExpenseApplication);

// 拒绝费用申请
router.put('/applications/:id/reject', expenseManagementController.rejectExpenseApplication);

// 获取费用统计
router.get('/statistics', expenseManagementController.getExpenseStatistics);

module.exports = router;
