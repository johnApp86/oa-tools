const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const leaveController = require('../controllers/leaveController');

// 获取请假申请列表
router.get('/applications', leaveController.getLeaveApplications);

// 创建请假申请
router.post('/applications', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('type').notEmpty().withMessage('请假类型不能为空'),
  body('start_date').notEmpty().withMessage('开始日期不能为空'),
  body('end_date').notEmpty().withMessage('结束日期不能为空'),
  body('reason').notEmpty().withMessage('请假原因不能为空')
], leaveController.createLeaveApplication);

module.exports = router;
