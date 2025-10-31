const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const budgetingController = require('../controllers/budgetingController');

// 获取预算列表
router.get('/', budgetingController.getBudgets);

// 创建预算
router.post('/', [
  body('name').notEmpty().withMessage('预算名称不能为空'),
  body('year').isInt().withMessage('预算年度必须是数字'),
  body('amount').isNumeric().withMessage('预算金额必须是数字')
], budgetingController.createBudget);

// 更新预算
router.put('/:id', budgetingController.updateBudget);

// 删除预算
router.delete('/:id', budgetingController.deleteBudget);

// 获取预算执行情况
router.get('/:id/execution', budgetingController.getBudgetExecution);

module.exports = router;
