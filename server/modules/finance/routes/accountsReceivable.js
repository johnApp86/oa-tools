const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const accountsReceivableController = require('../controllers/accountsReceivableController');

// 获取应收账款列表
router.get('/', accountsReceivableController.getAccountsReceivable);

// 创建应收账款
router.post('/', [
  body('customer_name').notEmpty().withMessage('客户名称不能为空'),
  body('amount').isNumeric().withMessage('金额必须是数字'),
  body('due_date').notEmpty().withMessage('到期日期不能为空')
], accountsReceivableController.createAccountReceivable);

// 更新应收账款
router.put('/:id', accountsReceivableController.updateAccountReceivable);

// 删除应收账款
router.delete('/:id', accountsReceivableController.deleteAccountReceivable);

// 收款记录
router.post('/:id/payments', [
  body('amount').isNumeric().withMessage('收款金额必须是数字'),
  body('payment_date').notEmpty().withMessage('收款日期不能为空')
], accountsReceivableController.addPayment);

module.exports = router;
