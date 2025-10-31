const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// 获取菜单树
router.get('/tree', menuController.getMenuTree);

// 获取菜单列表
router.get('/', menuController.getMenus);

// 创建菜单
router.post('/', menuController.createMenu);

// 更新菜单
router.put('/:id', menuController.updateMenu);

// 删除菜单
router.delete('/:id', menuController.deleteMenu);

// 修复菜单数据
router.post('/fix-data', menuController.fixMenuData);

module.exports = router;
