const express = require('express');
const router = express.Router();
const positionController = require('../controllers/positionController');

// 获取岗位列表
router.get('/', positionController.getPositions);

// 获取所有岗位（用于下拉选择）
router.get('/all', positionController.getAllPositions);

// 创建岗位
router.post('/', positionController.createPosition);

// 更新岗位
router.put('/:id', positionController.updatePosition);

// 删除岗位
router.delete('/:id', positionController.deletePosition);

module.exports = router;
