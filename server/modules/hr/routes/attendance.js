const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');

// 获取考勤记录
router.get('/records', attendanceController.getAttendanceRecords);

// 打卡记录
router.post('/checkin', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('type').isIn(['checkin', 'checkout']).withMessage('打卡类型必须是checkin或checkout')
], attendanceController.checkIn);

module.exports = router;
