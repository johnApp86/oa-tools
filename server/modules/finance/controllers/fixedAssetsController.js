const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取固定资产列表
exports.getFixedAssets = (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', category = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM fixed_assets WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      sql += ` AND (name LIKE ? OR code LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, assets) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM fixed_assets WHERE 1=1`;
      const countParams = [];
      if (keyword) {
        countSql += ` AND (name LIKE ? OR code LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      if (category) {
        countSql += ` AND category = ?`;
        countParams.push(category);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: assets,
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建固定资产
exports.createFixedAsset = [
  body('name').notEmpty().withMessage('资产名称不能为空'),
  body('category').notEmpty().withMessage('资产类别不能为空'),
  body('purchase_price').isNumeric().withMessage('购买价格必须是数字'),
  body('purchase_date').notEmpty().withMessage('购买日期不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, code, category, purchase_price, purchase_date, depreciation_method, useful_life, description } = req.body;

    db.run(
      `INSERT INTO fixed_assets (name, code, category, purchase_price, purchase_date, depreciation_method, useful_life, description, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, code, category, purchase_price, purchase_date, depreciation_method, useful_life, description],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新固定资产
exports.updateFixedAsset = (req, res) => {
  const { id } = req.params;
  const { name, code, category, purchase_price, purchase_date, depreciation_method, useful_life, description } = req.body;

  db.run(
    `UPDATE fixed_assets SET name = ?, code = ?, category = ?, purchase_price = ?, 
     purchase_date = ?, depreciation_method = ?, useful_life = ?, description = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, code, category, purchase_price, purchase_date, depreciation_method, useful_life, description, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '更新失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '记录不存在' });
      }

      res.json({ message: '更新成功' });
    }
  );
};

// 删除固定资产
exports.deleteFixedAsset = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM fixed_assets WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  });
};

// 计提折旧
exports.addDepreciation = [
  body('depreciation_amount').isNumeric().withMessage('折旧金额必须是数字'),
  body('depreciation_date').notEmpty().withMessage('折旧日期不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { depreciation_amount, depreciation_date, notes } = req.body;

    db.run(
      `INSERT INTO fixed_asset_depreciation (asset_id, depreciation_amount, depreciation_date, notes, created_at) 
       VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, depreciation_amount, depreciation_date, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '计提折旧失败' });
        }

        res.json({ message: '折旧记录添加成功', id: this.lastID });
      }
    );
  }
];
