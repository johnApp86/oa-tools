const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

// 导入各个子路由
const recruitmentRoutes = require('./recruitment');
const onboardingRoutes = require('./onboarding');
const attendanceRoutes = require('./attendance');
const leaveRoutes = require('./leave');
const salaryRoutes = require('./salary');
const employeeRoutes = require('./employee');
const reportRoutes = require('./reports');

// 导入控制器（用于兼容性路由）
const onboardingController = require('../controllers/onboardingController');

// 注册子路由
router.use('/recruitment', recruitmentRoutes);
router.use('/onboarding', onboardingRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/leave', leaveRoutes);
router.use('/salary', salaryRoutes);
router.use('/employee', employeeRoutes);
router.use('/reports', reportRoutes);

// HR模块兼容性路由 - 离职申请（旧路径兼容）
// 提供 /api/hr/offboarding/applications 的兼容性访问
// 正常路径应该是 /api/hr/onboarding/offboarding/applications
const offboardingRouter = express.Router();
offboardingRouter.get('/applications', onboardingController.getOffboardingApplications);
offboardingRouter.post('/applications', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('leave_date').notEmpty().withMessage('离职日期不能为空'),
  body('reason').notEmpty().withMessage('离职原因不能为空')
], onboardingController.createOffboardingApplication);
router.use('/offboarding', offboardingRouter);

module.exports = router;
