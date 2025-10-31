const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取应付账款列表
exports.getAccountsPayable = (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM accounts_payable WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      sql += ` AND (supplier_name LIKE ? OR invoice_number LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, accounts) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM accounts_payable WHERE 1=1`;
      const countParams = [];
      if (keyword) {
        countSql += ` AND (supplier_name LIKE ? OR invoice_number LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
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
          data: accounts,
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

// 创建应付账款
exports.createAccountPayable = [
  body('supplier_name').notEmpty().withMessage('供应商名称不能为空'),
  body('amount').isNumeric().withMessage('金额必须是数字'),
  body('due_date').notEmpty().withMessage('到期日期不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { supplier_name, invoice_number, amount, due_date, description, status = 1 } = req.body;

    db.run(
      `INSERT INTO accounts_payable (supplier_name, invoice_number, amount, due_date, description, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [supplier_name, invoice_number, amount, due_date, description, status],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新应付账款
exports.updateAccountPayable = (req, res) => {
  const { id } = req.params;
  const { supplier_name, invoice_number, amount, due_date, description, status } = req.body;

  db.run(
    `UPDATE accounts_payable SET supplier_name = ?, invoice_number = ?, amount = ?, 
     due_date = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [supplier_name, invoice_number, amount, due_date, description, status, id],
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

// 删除应付账款
exports.deleteAccountPayable = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM accounts_payable WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  });
};

// 添加付款记录
exports.addPayment = [
  body('amount').isNumeric().withMessage('付款金额必须是数字'),
  body('payment_date').notEmpty().withMessage('付款日期不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { amount, payment_date, payment_method, notes } = req.body;

    db.run(
      `INSERT INTO accounts_payable_payments (account_id, amount, payment_date, payment_method, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [id, amount, payment_date, payment_method, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '添加付款记录失败' });
        }

        res.json({ message: '付款记录添加成功', id: this.lastID });
      }
    );
  }
];
