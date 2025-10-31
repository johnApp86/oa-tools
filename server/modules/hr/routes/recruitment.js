const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');

// 获取招聘职位列表
router.get('/positions', recruitmentController.getPositions);

// 创建招聘职位
router.post('/positions', [
  body('title').notEmpty().withMessage('职位标题不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是数字'),
  body('org_id').isInt().withMessage('组织ID必须是数字')
], recruitmentController.createPosition);

// 删除招聘职位
router.delete('/positions/:id', recruitmentController.deletePosition);

// 获取简历列表
router.get('/resumes', recruitmentController.getResumes);

// 提交简历
router.post('/resumes', [
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('phone').notEmpty().withMessage('手机号不能为空'),
  body('position_id').isInt().withMessage('职位ID必须是数字')
], recruitmentController.createResume);

module.exports = router;
