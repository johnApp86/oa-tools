const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取预算列表
exports.getBudgets = (req, res) => {
  try {
    const { page = 1, limit = 10, year = '', department = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT 
      id,
      CASE WHEN id IS NOT NULL THEN 'BUDGET-' || SUBSTR('000000' || id, -6) ELSE NULL END as budget_code,
      name as budget_name,
      year as budget_year,
      department,
      COALESCE(amount, 0) as budget_amount,
      0 as used_amount,
      COALESCE(amount, 0) as remaining_amount,
      category,
      description,
      status,
      created_at,
      updated_at
    FROM budgets WHERE 1=1`;
    const params = [];
    
    if (year) {
      sql += ` AND year = ?`;
      params.push(year);
    }
    
    if (department) {
      sql += ` AND department LIKE ?`;
      params.push(`%${department}%`);
    }

    sql += ` ORDER BY year DESC, created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, budgets) => {
      if (err) {
        console.error('查询预算失败:', err);
        return res.status(500).json({ message: '查询失败', error: err.message });
      }

      // 处理预算数据，计算剩余金额
      const processedBudgets = (budgets || []).map(budget => {
        const budgetAmount = budget.budget_amount || 0;
        const usedAmount = budget.used_amount || 0;
        return {
          ...budget,
          used_amount: usedAmount,
          remaining_amount: budgetAmount - usedAmount
        };
      });

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM budgets WHERE 1=1`;
      const countParams = [];
      if (year) {
        countSql += ` AND year = ?`;
        countParams.push(year);
      }
      if (department) {
        countSql += ` AND department LIKE ?`;
        countParams.push(`%${department}%`);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          console.error('查询预算总数失败:', err);
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: processedBudgets,
          total: countResult ? countResult.total : 0,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建预算
exports.createBudget = [
  body('name').notEmpty().withMessage('预算名称不能为空'),
  body('year').isInt().withMessage('预算年度必须是数字'),
  body('amount').isNumeric().withMessage('预算金额必须是数字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, year, amount, department, category, description, status = 1 } = req.body;

    db.run(
      `INSERT INTO budgets (name, year, amount, department, category, description, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, year, amount, department, category, description, status],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新预算
exports.updateBudget = (req, res) => {
  const { id } = req.params;
  const { name, year, amount, department, category, description, status } = req.body;

  db.run(
    `UPDATE budgets SET name = ?, year = ?, amount = ?, department = ?, 
     category = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, year, amount, department, category, description, status, id],
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

// 删除预算
exports.deleteBudget = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM budgets WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  });
};

// 获取预算执行情况
exports.getBudgetExecution = (req, res) => {
  try {
    const { id } = req.params;
    const { year, month } = req.query;

    // 查询预算信息
    db.get('SELECT * FROM budgets WHERE id = ?', [id], (err, budget) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      if (!budget) {
        return res.status(404).json({ message: '预算不存在' });
      }

      // 查询实际支出（这里需要根据实际的费用表来查询）
      // 简化示例：假设有一个expenses表记录实际支出
      const sql = `
        SELECT 
          COALESCE(SUM(amount), 0) as actual_amount
        FROM expenses
        WHERE budget_id = ? AND status = 'approved'
        ${year ? 'AND YEAR(expense_date) = ?' : ''}
        ${month ? 'AND MONTH(expense_date) = ?' : ''}
      `;
      
      const params = [id];
      if (year) params.push(year);
      if (month) params.push(month);

      db.get(sql, params, (err, result) => {
        if (err) {
          return res.status(500).json({ message: '查询执行情况失败' });
        }

        res.json({
          budget: budget,
          actual_amount: result.actual_amount || 0,
          remaining_amount: budget.amount - (result.actual_amount || 0),
          execution_rate: budget.amount > 0 ? ((result.actual_amount || 0) / budget.amount * 100).toFixed(2) : 0
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
