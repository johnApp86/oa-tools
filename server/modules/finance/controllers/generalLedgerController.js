const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取总账科目列表
exports.getAccounts = (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', type = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM general_ledger_accounts WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      sql += ` AND (code LIKE ? OR name LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (type) {
      sql += ` AND type = ?`;
      params.push(type);
    }

    sql += ` ORDER BY code LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, accounts) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM general_ledger_accounts WHERE 1=1`;
      const countParams = [];
      if (keyword) {
        countSql += ` AND (code LIKE ? OR name LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      if (type) {
        countSql += ` AND type = ?`;
        countParams.push(type);
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

// 创建总账科目
exports.createAccount = [
  body('code').notEmpty().withMessage('科目代码不能为空'),
  body('name').notEmpty().withMessage('科目名称不能为空'),
  body('type').isIn(['asset', 'liability', 'equity', 'revenue', 'expense']).withMessage('科目类型无效'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { code, name, type, parent_id = 0, level = 1, status = 1 } = req.body;

    // 检查代码是否已存在
    db.get('SELECT id FROM general_ledger_accounts WHERE code = ?', [code], (err, account) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误' });
      }

      if (account) {
        return res.status(400).json({ message: '科目代码已存在' });
      }

      db.run(
        `INSERT INTO general_ledger_accounts (code, name, type, parent_id, level, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [code, name, type, parent_id, level, status],
        function(err) {
          if (err) {
            return res.status(500).json({ message: '创建失败' });
          }

          res.json({ message: '创建成功', id: this.lastID });
        }
      );
    });
  }
];

// 更新总账科目
exports.updateAccount = [
  body('name').notEmpty().withMessage('科目名称不能为空'),
  body('type').isIn(['asset', 'liability', 'equity', 'revenue', 'expense']).withMessage('科目类型无效'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { name, type, parent_id, level, status } = req.body;

    db.run(
      `UPDATE general_ledger_accounts 
       SET name = ?, type = ?, parent_id = ?, level = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, type, parent_id || 0, level || 1, status || 1, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '科目不存在' });
        }

        res.json({ message: '更新成功' });
      }
    );
  }
];

// 删除总账科目
exports.deleteAccount = (req, res) => {
  const { id } = req.params;

  // 检查是否有子科目
  db.get('SELECT COUNT(*) as count FROM general_ledger_accounts WHERE parent_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (result.count > 0) {
      return res.status(400).json({ message: '该科目下有子科目，无法删除' });
    }

    // 检查是否有关联的凭证分录
    db.get('SELECT COUNT(*) as count FROM general_ledger_entries WHERE account_id = ?', [id], (err, result) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误' });
      }

      if (result.count > 0) {
        return res.status(400).json({ message: '该科目已使用，无法删除' });
      }

      db.run('DELETE FROM general_ledger_accounts WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ message: '删除失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '科目不存在' });
        }

        res.json({ message: '删除成功' });
      });
    });
  });
};

// 获取总账凭证列表
exports.getVouchers = (req, res) => {
  try {
    const { page = 1, limit = 10, date_start = '', date_end = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT * FROM general_ledger_vouchers WHERE 1=1`;
    const params = [];
    
    if (date_start) {
      sql += ` AND date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      sql += ` AND date <= ?`;
      params.push(date_end);
    }

    sql += ` ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, vouchers) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM general_ledger_vouchers WHERE 1=1`;
      const countParams = [];
      if (date_start) {
        countSql += ` AND date >= ?`;
        countParams.push(date_start);
      }
      if (date_end) {
        countSql += ` AND date <= ?`;
        countParams.push(date_end);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: vouchers,
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

// 创建总账凭证
exports.createVoucher = [
  body('date').notEmpty().withMessage('凭证日期不能为空'),
  body('description').notEmpty().withMessage('凭证摘要不能为空'),
  body('entries').isArray().withMessage('分录必须是数组'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { date, description, entries } = req.body;

    // 验证借贷平衡
    const debitTotal = entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const creditTotal = entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + parseFloat(e.amount), 0);

    if (Math.abs(debitTotal - creditTotal) > 0.01) {
      return res.status(400).json({ message: '借贷不平衡' });
    }

    db.run(
      `INSERT INTO general_ledger_vouchers (date, description, created_at) 
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [date, description],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        const voucherId = this.lastID;

        // 插入分录
        let completed = 0;
        let hasError = false;

        entries.forEach(entry => {
          db.run(
            `INSERT INTO general_ledger_entries (voucher_id, account_id, type, amount, description) 
             VALUES (?, ?, ?, ?, ?)`,
            [voucherId, entry.account_id, entry.type, entry.amount, entry.description],
            (err) => {
              if (err) {
                hasError = true;
              }
              
              completed++;
              if (completed === entries.length) {
                if (hasError) {
                  res.status(500).json({ message: '部分分录创建失败' });
                } else {
                  res.json({ message: '创建成功', id: voucherId });
                }
              }
            }
          );
        });
      }
    );
  }
];

// 获取总账余额
exports.getBalances = (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const sql = `
      SELECT 
        gla.id,
        gla.code,
        gla.name,
        gla.type,
        COALESCE(SUM(CASE WHEN gle.type = 'debit' THEN gle.amount ELSE -gle.amount END), 0) as balance
      FROM general_ledger_accounts gla
      LEFT JOIN general_ledger_entries gle ON gla.id = gle.account_id
      LEFT JOIN general_ledger_vouchers glv ON gle.voucher_id = glv.id AND glv.date <= ?
      WHERE gla.status = 1
      GROUP BY gla.id, gla.code, gla.name, gla.type
      ORDER BY gla.code
    `;

    db.all(sql, [date], (err, balances) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      res.json({ data: balances });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
