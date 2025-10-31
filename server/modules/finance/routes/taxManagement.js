const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const taxManagementController = require('../controllers/taxManagementController');

// 获取税务申报记录
router.get('/declarations', taxManagementController.getTaxDeclarations);

// 创建税务申报
router.post('/declarations', [
  body('tax_type').notEmpty().withMessage('税种不能为空'),
  body('period').notEmpty().withMessage('申报期间不能为空'),
  body('amount').isNumeric().withMessage('税额必须是数字')
], taxManagementController.createTaxDeclaration);

// 更新税务申报
router.put('/:id', taxManagementController.updateTaxDeclaration);

// 删除税务申报
router.delete('/:id', taxManagementController.deleteTaxDeclaration);

module.exports = router;
