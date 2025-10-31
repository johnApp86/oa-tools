const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const salaryController = require('../controllers/salaryController');

// 获取薪酬记录
router.get('/records', salaryController.getSalaryRecords);

// 创建薪酬记录
router.post('/records', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('year').isInt().withMessage('年份必须是数字'),
  body('month').isInt().withMessage('月份必须是数字'),
  body('base_salary').isNumeric().withMessage('基本工资必须是数字')
], salaryController.createSalaryRecord);

// 更新薪酬记录
router.put('/records/:id', [
  body('base_salary').isNumeric().withMessage('基本工资必须是数字')
], salaryController.updateSalaryRecord);

// 删除薪酬记录
router.delete('/records/:id', salaryController.deleteSalaryRecord);

module.exports = router;
