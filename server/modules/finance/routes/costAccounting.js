const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const costAccountingController = require('../controllers/costAccountingController');

// 获取成本中心列表
router.get('/cost-centers', costAccountingController.getCostCenters);

// 创建成本中心
router.post('/cost-centers', [
  body('name').notEmpty().withMessage('成本中心名称不能为空'),
  body('code').notEmpty().withMessage('成本中心代码不能为空')
], costAccountingController.createCostCenter);

// 更新成本中心
router.put('/cost-centers/:id', [
  body('name').notEmpty().withMessage('成本中心名称不能为空')
], costAccountingController.updateCostCenter);

// 删除成本中心
router.delete('/cost-centers/:id', costAccountingController.deleteCostCenter);

// 更新成本分配
router.put('/allocations/:id', costAccountingController.updateCostAllocation);

// 删除成本分配
router.delete('/allocations/:id', costAccountingController.deleteCostAllocation);

// 获取成本分配
router.get('/allocations', costAccountingController.getCostAllocations);

// 创建成本分配
router.post('/allocations', [
  body('from_center').notEmpty().withMessage('分配来源不能为空'),
  body('to_center').notEmpty().withMessage('分配目标不能为空'),
  body('amount').isNumeric().withMessage('分配金额必须是数字')
], costAccountingController.createCostAllocation);

module.exports = router;
