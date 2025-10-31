const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');

// 获取角色列表
router.get('/', roleController.getRoles);

// 获取所有角色（用于下拉选择）
router.get('/all', roleController.getAllRoles);

// 创建角色
router.post('/', roleController.createRole);

// 更新角色
router.put('/:id', roleController.updateRole);

// 删除角色
router.delete('/:id', roleController.deleteRole);

module.exports = router;
