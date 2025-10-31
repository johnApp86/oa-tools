const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');

// 获取入职申请列表
router.get('/applications', onboardingController.getOnboardingApplications);

// 创建入职申请
router.post('/applications', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('position_id').isInt().withMessage('岗位ID必须是数字'),
  body('org_id').isInt().withMessage('组织ID必须是数字'),
  body('start_date').notEmpty().withMessage('入职日期不能为空')
], onboardingController.createOnboardingApplication);

// 获取离职申请列表
router.get('/offboarding/applications', onboardingController.getOffboardingApplications);

// 创建离职申请
router.post('/offboarding/applications', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('leave_date').notEmpty().withMessage('离职日期不能为空'),
  body('reason').notEmpty().withMessage('离职原因不能为空')
], onboardingController.createOffboardingApplication);

module.exports = router;
