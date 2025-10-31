const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取薪酬记录列表
exports.getSalaryRecords = (req, res) => {
  try {
    const { page = 1, limit = 10, user_id = '', year = '', month = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT sr.*, u.real_name as user_name, u.username, u.real_name, p.name as position_name 
               FROM salary_records sr 
               LEFT JOIN users u ON sr.user_id = u.id 
               LEFT JOIN positions p ON u.position_id = p.id 
               WHERE 1=1`;
    const params = [];
    
    if (user_id) {
      sql += ` AND sr.user_id = ?`;
      params.push(user_id);
    }
    
    if (year) {
      sql += ` AND sr.year = ?`;
      params.push(year);
    }
    
    if (month) {
      sql += ` AND sr.month = ?`;
      params.push(month);
    }

    sql += ` ORDER BY sr.year DESC, sr.month DESC, sr.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, records) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM salary_records sr 
                      LEFT JOIN users u ON sr.user_id = u.id 
                      LEFT JOIN positions p ON u.position_id = p.id 
                      WHERE 1=1`;
      const countParams = [];
      
      if (user_id) {
        countSql += ` AND sr.user_id = ?`;
        countParams.push(user_id);
      }
      
      if (year) {
        countSql += ` AND sr.year = ?`;
        countParams.push(year);
      }
      
      if (month) {
        countSql += ` AND sr.month = ?`;
        countParams.push(month);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询失败' });
        }

        res.json({
          data: records,
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

// 创建薪酬记录
exports.createSalaryRecord = [
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('year').isInt().withMessage('年份必须是整数'),
  body('month').isInt().withMessage('月份必须是整数'),
  body('base_salary').isDecimal().withMessage('基本工资必须是数字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { user_id, year, month, base_salary, bonus, allowance, deduction, notes } = req.body;

    db.run(
      `INSERT INTO salary_records (user_id, year, month, base_salary, bonus, allowance, deduction, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, year, month, base_salary, bonus || 0, allowance || 0, deduction || 0, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }
        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新薪酬记录
exports.updateSalaryRecord = [
  body('base_salary').custom((value) => {
    if (value === undefined || value === null || value === '') {
      throw new Error('基本工资不能为空');
    }
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue < 0) {
      throw new Error('基本工资必须是大于等于0的数字');
    }
    return true;
  }).withMessage('基本工资必须是数字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    try {
      const { id } = req.params;
      const { base_salary, bonus, allowance, deduction, notes } = req.body;

      // 确保数字类型
      const baseSalaryValue = typeof base_salary === 'string' ? parseFloat(base_salary) : (base_salary || 0);
      const bonusValue = typeof bonus === 'string' ? parseFloat(bonus) : (bonus || 0);
      const allowanceValue = typeof allowance === 'string' ? parseFloat(allowance) : (allowance || 0);
      const deductionValue = typeof deduction === 'string' ? parseFloat(deduction) : (deduction || 0);

      db.run(
        `UPDATE salary_records 
         SET base_salary = ?, bonus = ?, allowance = ?, deduction = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [baseSalaryValue, bonusValue, allowanceValue, deductionValue, notes || null, id],
        function(err) {
          if (err) {
            console.error('更新薪酬记录失败:', err);
            return res.status(500).json({ message: '更新失败', error: err.message });
          }
          if (this.changes === 0) {
            return res.status(404).json({ message: '记录不存在' });
          }
          res.json({ message: '更新成功' });
        }
      );
    } catch (error) {
      console.error('更新薪酬记录异常:', error);
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }
];

// 删除薪酬记录
exports.deleteSalaryRecord = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM salary_records WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }
    res.json({ message: '删除成功' });
  });
};
