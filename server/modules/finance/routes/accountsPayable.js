const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const accountsPayableController = require('../controllers/accountsPayableController');

// 获取应付账款列表
router.get('/', accountsPayableController.getAccountsPayable);

// 创建应付账款
router.post('/', [
  body('supplier_name').notEmpty().withMessage('供应商名称不能为空'),
  body('amount').isNumeric().withMessage('金额必须是数字'),
  body('due_date').notEmpty().withMessage('到期日期不能为空')
], accountsPayableController.createAccountPayable);

// 更新应付账款
router.put('/:id', accountsPayableController.updateAccountPayable);

// 删除应付账款
router.delete('/:id', accountsPayableController.deleteAccountPayable);

// 付款记录
router.post('/:id/payments', [
  body('amount').isNumeric().withMessage('付款金额必须是数字'),
  body('payment_date').notEmpty().withMessage('付款日期不能为空')
], accountsPayableController.addPayment);

module.exports = router;
