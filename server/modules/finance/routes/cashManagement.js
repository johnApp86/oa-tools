const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const cashManagementController = require('../controllers/cashManagementController');

// 获取资金流水
router.get('/transactions', cashManagementController.getTransactions);

// 创建资金流水
router.post('/transactions', [
  body('type').isIn(['income', 'expense']).withMessage('流水类型必须是income或expense'),
  body('amount').isNumeric().withMessage('金额必须是数字'),
  body('description').notEmpty().withMessage('描述不能为空')
], cashManagementController.createTransaction);

// 更新资金流水
router.put('/transactions/:id', [
  body('type').isIn(['income', 'expense']).withMessage('流水类型必须是income或expense'),
  body('amount').isNumeric().withMessage('金额必须是数字'),
  body('description').notEmpty().withMessage('描述不能为空')
], cashManagementController.updateTransaction);

// 删除资金流水
router.delete('/transactions/:id', cashManagementController.deleteTransaction);

// 获取账户列表
router.get('/accounts', cashManagementController.getAccounts);

// 创建账户
router.post('/accounts', [
  body('name').notEmpty().withMessage('账户名称不能为空'),
  body('account_type').notEmpty().withMessage('账户类型不能为空')
], cashManagementController.createAccount);

// 更新账户
router.put('/accounts/:id', cashManagementController.updateAccount);

// 删除账户
router.delete('/accounts/:id', cashManagementController.deleteAccount);

// 获取账户余额
router.get('/balances', cashManagementController.getBalances);

// 资金调拨
router.post('/transfer', [
  body('from_account').notEmpty().withMessage('转出账户不能为空'),
  body('to_account').notEmpty().withMessage('转入账户不能为空'),
  body('amount').isNumeric().withMessage('调拨金额必须是数字')
], cashManagementController.transferFunds);

module.exports = router;
