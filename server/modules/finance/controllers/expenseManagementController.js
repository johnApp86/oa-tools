const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取费用申请列表
exports.getExpenseApplications = (req, res) => {
  try {
    const { page = 1, limit = 10, user_id = '', category = '', status = '', date_start = '', date_end = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT ea.*, u.real_name as applicant_name 
               FROM expense_applications ea 
               LEFT JOIN users u ON ea.user_id = u.id 
               WHERE 1=1`;
    const params = [];
    
    if (user_id) {
      sql += ` AND ea.user_id = ?`;
      params.push(user_id);
    }
    
    if (category) {
      sql += ` AND ea.category = ?`;
      params.push(category);
    }
    
    if (status) {
      sql += ` AND ea.status = ?`;
      params.push(status);
    }
    
    if (date_start) {
      sql += ` AND ea.application_date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      sql += ` AND ea.application_date <= ?`;
      params.push(date_end);
    }

    sql += ` ORDER BY ea.application_date DESC, ea.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, applications) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM expense_applications ea WHERE 1=1`;
      const countParams = [];
      if (user_id) {
        countSql += ` AND ea.user_id = ?`;
        countParams.push(user_id);
      }
      if (category) {
        countSql += ` AND ea.category = ?`;
        countParams.push(category);
      }
      if (status) {
        countSql += ` AND ea.status = ?`;
        countParams.push(status);
      }
      if (date_start) {
        countSql += ` AND ea.application_date >= ?`;
        countParams.push(date_start);
      }
      if (date_end) {
        countSql += ` AND ea.application_date <= ?`;
        countParams.push(date_end);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: applications,
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

// 创建费用申请
exports.createExpenseApplication = [
  body('category').notEmpty().withMessage('费用类别不能为空'),
  body('amount').custom((value) => {
    if (value === undefined || value === null || value === '') {
      throw new Error('费用金额不能为空');
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue <= 0) {
      throw new Error('费用金额必须是大于0的数字');
    }
    return true;
  }).withMessage('费用金额必须是数字'),
  body('description').notEmpty().withMessage('费用描述不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { user_id, category, amount, application_date, description, attachments, notes } = req.body;

      // user_id 可以为空，如果没有提供则设置为默认值（例如从token中获取）
      // 这里先设置为1作为默认值，实际应该从认证token中获取
      const userId = user_id || 1;

      // 确保amount是数字类型
      const amountValue = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);

      db.run(
        `INSERT INTO expense_applications (user_id, category, amount, application_date, description, attachments, notes, status, created_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)`,
        [userId, category, amountValue, application_date || new Date().toISOString().split('T')[0], description || '', attachments || null, notes || null],
        function(err) {
          if (err) {
            console.error('创建费用申请失败:', err);
            return res.status(500).json({ message: '创建失败', error: err.message });
          }

          res.json({ message: '创建成功', id: this.lastID });
        }
      );
    } catch (error) {
      console.error('创建费用申请异常:', error);
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }
];

// 审批费用申请
exports.approveExpenseApplication = (req, res) => {
  const { id } = req.params;
  const { approver_id, approval_notes } = req.body;

  db.run(
    `UPDATE expense_applications 
     SET status = 'approved', approver_id = ?, approval_date = CURRENT_TIMESTAMP, approval_notes = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [approver_id, approval_notes, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '审批失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '申请不存在' });
      }

      res.json({ message: '审批通过' });
    }
  );
};

// 拒绝费用申请
exports.rejectExpenseApplication = (req, res) => {
  const { id } = req.params;
  const { approver_id, rejection_reason } = req.body;

  db.run(
    `UPDATE expense_applications 
     SET status = 'rejected', approver_id = ?, approval_date = CURRENT_TIMESTAMP, approval_notes = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [approver_id, rejection_reason, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '拒绝失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '申请不存在' });
      }

      res.json({ message: '已拒绝' });
    }
  );
};

// 获取费用统计
exports.getExpenseStatistics = (req, res) => {
  try {
    const { date_start, date_end, category = '', department = '' } = req.query;
    const startDate = date_start || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = date_end || new Date().toISOString().split('T')[0];

    let sql = `
      SELECT 
        category,
        COUNT(*) as count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount
      FROM expense_applications
      WHERE application_date >= ? AND application_date <= ? AND status = 'approved'
    `;
    const params = [startDate, endDate];
    
    if (category) {
      sql += ` AND category = ?`;
      params.push(category);
    }
    
    if (department) {
      sql += ` AND department = ?`;
      params.push(department);
    }

    sql += ` GROUP BY category ORDER BY total_amount DESC`;

    db.all(sql, params, (err, statistics) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      const totalAmount = statistics.reduce((sum, item) => sum + item.total_amount, 0);

      res.json({
        period: { start: startDate, end: endDate },
        statistics: statistics,
        total_amount: totalAmount,
        total_count: statistics.reduce((sum, item) => sum + item.count, 0)
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
