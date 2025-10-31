const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const taxManagementController = require('../controllers/taxManagementController');

// 获取税务申报记录
router.get('/declarations', taxManagementController.getTaxDeclarations);

// 创建税务申报
router.post('/declarations', taxManagementController.createTaxDeclaration);

// 更新税务申报
router.put('/:id', taxManagementController.updateTaxDeclaration);

// 删除税务申报
router.delete('/:id', taxManagementController.deleteTaxDeclaration);

module.exports = router;
