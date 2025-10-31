const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const generalLedgerController = require('../controllers/generalLedgerController');

// 获取总账科目列表
router.get('/accounts', generalLedgerController.getAccounts);

// 创建总账科目
router.post('/accounts', [
  body('code').notEmpty().withMessage('科目代码不能为空'),
  body('name').notEmpty().withMessage('科目名称不能为空'),
  body('type').isIn(['asset', 'liability', 'equity', 'revenue', 'expense']).withMessage('科目类型无效')
], generalLedgerController.createAccount);

// 更新总账科目
router.put('/accounts/:id', [
  body('name').notEmpty().withMessage('科目名称不能为空'),
  body('type').isIn(['asset', 'liability', 'equity', 'revenue', 'expense']).withMessage('科目类型无效')
], generalLedgerController.updateAccount);

// 删除总账科目
router.delete('/accounts/:id', generalLedgerController.deleteAccount);

// 获取总账凭证列表
router.get('/vouchers', generalLedgerController.getVouchers);

// 创建总账凭证
router.post('/vouchers', [
  body('date').notEmpty().withMessage('凭证日期不能为空'),
  body('description').notEmpty().withMessage('凭证摘要不能为空'),
  body('entries').isArray().withMessage('分录必须是数组')
], generalLedgerController.createVoucher);

// 获取总账余额
router.get('/balances', generalLedgerController.getBalances);

module.exports = router;
