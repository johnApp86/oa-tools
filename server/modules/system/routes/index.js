const express = require('express');
const router = express.Router();

// 导入各个子路由
const organizationRoutes = require('./organizations');
const positionRoutes = require('./positions');
const userRoutes = require('./users');
const menuRoutes = require('./menus');
const roleRoutes = require('./roles');

// 注册子路由（正常路径：/api/system/...）
router.use('/organizations', organizationRoutes);
router.use('/positions', positionRoutes);
router.use('/users', userRoutes);
router.use('/menus', menuRoutes);
router.use('/roles', roleRoutes);

module.exports = router;
