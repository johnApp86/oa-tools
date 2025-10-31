const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const expenseManagementController = require('../controllers/expenseManagementController');

// 获取费用申请列表
router.get('/applications', expenseManagementController.getExpenseApplications);

// 创建费用申请
router.post('/applications', [
  body('category').notEmpty().withMessage('费用类别不能为空'),
  body('amount').isNumeric().withMessage('费用金额必须是数字'),
  body('description').notEmpty().withMessage('费用描述不能为空')
], expenseManagementController.createExpenseApplication);

// 审批费用申请
router.put('/applications/:id/approve', expenseManagementController.approveExpenseApplication);

// 拒绝费用申请
router.put('/applications/:id/reject', expenseManagementController.rejectExpenseApplication);

// 获取费用统计
router.get('/statistics', expenseManagementController.getExpenseStatistics);

module.exports = router;
