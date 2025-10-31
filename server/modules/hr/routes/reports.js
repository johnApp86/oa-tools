const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// 获取考勤统计
router.get('/attendance', reportController.getAttendanceStats);

// 获取薪酬统计
router.get('/salary', reportController.getSalaryStats);

module.exports = router;
