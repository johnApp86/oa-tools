const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取税务申报记录
exports.getTaxDeclarations = (req, res) => {
  try {
    const { page = 1, limit = 10, tax_type = '', period = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM tax_declarations WHERE 1=1`;
    const params = [];
    
    if (tax_type) {
      sql += ` AND tax_type = ?`;
      params.push(tax_type);
    }
    
    if (period) {
      sql += ` AND period = ?`;
      params.push(period);
    }
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY period DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, declarations) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM tax_declarations WHERE 1=1`;
      const countParams = [];
      if (tax_type) {
        countSql += ` AND tax_type = ?`;
        countParams.push(tax_type);
      }
      if (period) {
        countSql += ` AND period = ?`;
        countParams.push(period);
      }
      if (status) {
        countSql += ` AND status = ?`;
        countParams.push(status);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: declarations,
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

// 创建税务申报
exports.createTaxDeclaration = [
  body('tax_type').notEmpty().withMessage('税种不能为空'),
  body('period').notEmpty().withMessage('申报期间不能为空'),
  body('amount').isNumeric().withMessage('税额必须是数字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { tax_type, period, amount, declaration_date, due_date, description, status = 1 } = req.body;

    db.run(
      `INSERT INTO tax_declarations (tax_type, period, amount, declaration_date, due_date, description, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [tax_type, period, amount, declaration_date, due_date, description, status],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新税务申报
exports.updateTaxDeclaration = (req, res) => {
  const { id } = req.params;
  const { tax_type, period, amount, declaration_date, due_date, description, status } = req.body;

  db.run(
    `UPDATE tax_declarations SET tax_type = ?, period = ?, amount = ?, 
     declaration_date = ?, due_date = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [tax_type, period, amount, declaration_date, due_date, description, status, id],
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

// 删除税务申报
exports.deleteTaxDeclaration = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tax_declarations WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  });
};
