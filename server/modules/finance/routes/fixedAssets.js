const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();
const fixedAssetsController = require('../controllers/fixedAssetsController');

// 获取固定资产列表
router.get('/', fixedAssetsController.getFixedAssets);

// 创建固定资产
router.post('/', fixedAssetsController.createFixedAsset);

// 更新固定资产
router.put('/:id', fixedAssetsController.updateFixedAsset);

// 删除固定资产
router.delete('/:id', fixedAssetsController.deleteFixedAsset);

// 计提折旧
router.post('/:id/depreciation', [
  body('depreciation_amount').isNumeric().withMessage('折旧金额必须是数字'),
  body('depreciation_date').notEmpty().withMessage('折旧日期不能为空')
], fixedAssetsController.addDepreciation);

module.exports = router;
