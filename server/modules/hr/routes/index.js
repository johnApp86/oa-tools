const express = require('express');
const router = express.Router();

// 导入各个子路由
const recruitmentRoutes = require('./recruitment');
const onboardingRoutes = require('./onboarding');
const attendanceRoutes = require('./attendance');
const leaveRoutes = require('./leave');
const salaryRoutes = require('./salary');
const employeeRoutes = require('./employee');
const reportRoutes = require('./reports');

// 注册子路由
router.use('/recruitment', recruitmentRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/salary', salaryRoutes);
router.use('/employee', employeeRoutes);
router.use('/reports', reportRoutes);

module.exports = router;
