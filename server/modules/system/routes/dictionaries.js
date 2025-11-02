const express = require('express');
const router = express.Router();
const dictionaryController = require('../controllers/dictionaryController');

// 获取字典列表
router.get('/', dictionaryController.getDictionaries);

// 根据字典编码获取字典项列表
router.get('/code/:code', dictionaryController.getDictByCode);

// 获取所有字典类型
router.get('/types', dictionaryController.getDictTypes);

// 创建字典
router.post('/', dictionaryController.createDictionary);

// 批量创建字典
router.post('/batch', dictionaryController.batchCreateDictionaries);

// 更新字典
router.put('/:id', dictionaryController.updateDictionary);

// 删除字典
router.delete('/:id', dictionaryController.deleteDictionary);

module.exports = router;
