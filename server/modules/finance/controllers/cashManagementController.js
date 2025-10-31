const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取资金流水
exports.getTransactions = (req, res) => {
  try {
    const { page = 1, limit = 10, account = '', type = '', date_start = '', date_end = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM cash_transactions WHERE 1=1`;
    const params = [];
    
    if (account) {
      sql += ` AND account_id = ?`;
      params.push(account);
    }
    
    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }
    
    if (date_start) {
      sql += ` AND transaction_date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      sql += ` AND transaction_date <= ?`;
      params.push(date_end);
    }

    sql += ` ORDER BY transaction_date DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, transactions) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM cash_transactions WHERE 1=1`;
      const countParams = [];
      if (account) {
        countSql += ` AND account_id = ?`;
        countParams.push(account);
      }
      if (type) {
        countSql += ` AND type = ?`;
        countParams.push(type);
      }
      if (date_start) {
        countSql += ` AND transaction_date >= ?`;
        countParams.push(date_start);
      }
      if (date_end) {
        countSql += ` AND transaction_date <= ?`;
        countParams.push(date_end);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: transactions,
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

// 创建资金流水
exports.createTransaction = [
  body('type').isIn(['income', 'expense']).withMessage('流水类型必须是income或expense'),
  body('amount').isNumeric().withMessage('金额必须是数字'),
  body('description').notEmpty().withMessage('描述不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { account_id, type, amount, transaction_date, description, category, notes } = req.body;

    db.run(
      `INSERT INTO cash_transactions (account_id, type, amount, transaction_date, description, category, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [account_id, type, amount, transaction_date || new Date().toISOString().split('T')[0], description, category, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新资金流水
exports.updateTransaction = [
  body('type').isIn(['income', 'expense']).withMessage('流水类型必须是income或expense'),
  body('amount').isNumeric().withMessage('金额必须是数字'),
  body('description').notEmpty().withMessage('描述不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { account_id, type, amount, transaction_date, description, category, notes } = req.body;

    db.run(
      `UPDATE cash_transactions 
       SET account_id = ?, type = ?, amount = ?, transaction_date = ?, description = ?, category = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [account_id, type, amount, transaction_date, description, category, notes, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '交易记录不存在' });
        }

        res.json({ message: '更新成功' });
      }
    );
  }
];

// 删除资金流水
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM cash_transactions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '交易记录不存在' });
    }

    res.json({ message: '删除成功' });
  });
};

// 获取账户余额
exports.getBalances = (req, res) => {
  try {
    const sql = `
      SELECT 
        ca.id,
        ca.name,
        ca.account_type,
        COALESCE(SUM(CASE WHEN ct.type = 'income' THEN ct.amount ELSE -ct.amount END), 0) as balance
      FROM cash_accounts ca
      LEFT JOIN cash_transactions ct ON ca.id = ct.account_id
      WHERE ca.status = 1
      GROUP BY ca.id, ca.name, ca.account_type
      ORDER BY ca.name
    `;

    db.all(sql, [], (err, balances) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      res.json({ data: balances });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 资金调拨
exports.transferFunds = [
  body('from_account').notEmpty().withMessage('转出账户不能为空'),
  body('to_account').notEmpty().withMessage('转入账户不能为空'),
  body('amount').isNumeric().withMessage('调拨金额必须是数字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { from_account, to_account, amount, transfer_date, notes } = req.body;

    // 创建转出记录
    db.run(
      `INSERT INTO cash_transactions (account_id, type, amount, transaction_date, description, notes, created_at) 
       VALUES (?, 'expense', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [from_account, amount, transfer_date || new Date().toISOString().split('T')[0], '资金调拨', notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建转出记录失败' });
        }

        // 创建转入记录
        db.run(
          `INSERT INTO cash_transactions (account_id, type, amount, transaction_date, description, notes, created_at) 
           VALUES (?, 'income', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [to_account, amount, transfer_date || new Date().toISOString().split('T')[0], '资金调拨', notes],
          function(err) {
            if (err) {
              return res.status(500).json({ message: '创建转入记录失败' });
            }

            res.json({ message: '资金调拨成功' });
          }
        );
      }
    );
  }
];
