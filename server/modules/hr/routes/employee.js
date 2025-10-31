const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const employeeController = require('../controllers/employeeController');

// 获取员工档案列表
router.get('/files', employeeController.getEmployeeFiles);

// 创建员工档案
router.post('/files', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('employee_id').notEmpty().withMessage('员工编号不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是数字'),
  body('org_id').isInt().withMessage('组织ID必须是数字')
], employeeController.createEmployeeFile);

// 删除员工档案
router.delete('/files/:id', employeeController.deleteEmployeeFile);

module.exports = router;
