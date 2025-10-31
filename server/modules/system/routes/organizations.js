const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizationController');

// 获取组织列表
router.get('/', organizationController.getOrganizations);

// 获取组织树
router.get('/tree', organizationController.getOrganizationTree);

// 获取所有组织（用于下拉选择）
router.get('/all', organizationController.getAllOrganizations);

// 创建组织
router.post('/', organizationController.createOrganization);

// 更新组织
router.put('/:id', organizationController.updateOrganization);

// 删除组织
router.delete('/:id', organizationController.deleteOrganization);

module.exports = router;
