const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取成本中心列表
exports.getCostCenters = (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', costType = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT 
      id,
      code as cost_center_code,
      name as cost_center_name,
      COALESCE(cost_type, '') as cost_type,
      0 as budget_amount,
      0 as actual_amount,
      0 as variance,
      description,
      parent_id,
      status,
      created_at,
      updated_at
    FROM cost_centers WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      sql += ` AND (name LIKE ? OR code LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (costType) {
      sql += ` AND cost_type = ?`;
      params.push(costType);
    }

    sql += ` ORDER BY code LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, centers) => {
      if (err) {
        console.error('查询成本中心失败:', err);
        return res.status(500).json({ message: '查询失败', error: err.message });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM cost_centers WHERE 1=1`;
      const countParams = [];
      if (keyword) {
        countSql += ` AND (name LIKE ? OR code LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      if (costType) {
        countSql += ` AND cost_type = ?`;
        countParams.push(costType);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          console.error('查询成本中心总数失败:', err);
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: centers || [],
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

// 创建成本中心
exports.createCostCenter = [
  body('name').notEmpty().withMessage('成本中心名称不能为空'),
  body('code').notEmpty().withMessage('成本中心代码不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, code, cost_type, description, parent_id, status = 1 } = req.body;

    db.run(
      `INSERT INTO cost_centers (name, code, cost_type, description, parent_id, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [name, code, cost_type || null, description, parent_id, status],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新成本中心
exports.updateCostCenter = (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, cost_type, description, parent_id, status } = req.body;

    db.run(
      `UPDATE cost_centers 
       SET name = ?, code = ?, cost_type = ?, description = ?, parent_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, code, cost_type || null, description || null, parent_id || 0, status !== undefined ? status : 1, id],
      function(err) {
        if (err) {
          console.error('更新成本中心失败:', err);
          return res.status(500).json({ message: '更新失败', error: err.message });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '成本中心不存在' });
        }

        res.json({ message: '更新成功' });
      }
    );
  } catch (error) {
    console.error('更新成本中心异常:', error);
    res.status(500).json({ message: '服务器错误', error: error.message });
  }
};

// 删除成本中心
exports.deleteCostCenter = (req, res) => {
  const { id } = req.params;

  // 检查是否有关联的成本分配
  db.get('SELECT COUNT(*) as count FROM cost_allocations WHERE from_center = ? OR to_center = ?', [id, id], (err, result) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (result.count > 0) {
      return res.status(400).json({ message: '该成本中心已使用，无法删除' });
    }

    db.run('DELETE FROM cost_centers WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: '删除失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '成本中心不存在' });
      }

      res.json({ message: '删除成功' });
    });
  });
};

// 更新成本分配
exports.updateCostAllocation = [
  body('from_center').notEmpty().withMessage('分配来源不能为空'),
  body('to_center').notEmpty().withMessage('分配目标不能为空'),
  body('amount').isNumeric().withMessage('分配金额必须是数字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { from_center, to_center, amount, allocation_date, description, notes } = req.body;

    db.run(
      `UPDATE cost_allocations 
       SET from_center = ?, to_center = ?, amount = ?, allocation_date = ?, description = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [from_center, to_center, amount, allocation_date, description, notes, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '成本分配不存在' });
        }

        res.json({ message: '更新成功' });
      }
    );
  }
];

// 删除成本分配
exports.deleteCostAllocation = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM cost_allocations WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '成本分配不存在' });
    }

    res.json({ message: '删除成功' });
  });
};

// 获取成本分配
exports.getCostAllocations = (req, res) => {
  try {
    const { page = 1, limit = 10, date_start = '', date_end = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT ca.*, cc1.name as from_center_name, cc2.name as to_center_name 
               FROM cost_allocations ca 
               LEFT JOIN cost_centers cc1 ON ca.from_center = cc1.id 
               LEFT JOIN cost_centers cc2 ON ca.to_center = cc2.id 
               WHERE 1=1`;
    const params = [];
    
    if (date_start) {
      sql += ` AND ca.allocation_date >= ?`;
      params.push(date_start);
    }
    
    if (date_end) {
      sql += ` AND ca.allocation_date <= ?`;
      params.push(date_end);
    }

    sql += ` ORDER BY ca.allocation_date DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, allocations) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM cost_allocations WHERE 1=1`;
      const countParams = [];
      if (date_start) {
        countSql += ` AND allocation_date >= ?`;
        countParams.push(date_start);
      }
      if (date_end) {
        countSql += ` AND allocation_date <= ?`;
        countParams.push(date_end);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: allocations,
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

// 创建成本分配
exports.createCostAllocation = [
  body('from_center').notEmpty().withMessage('分配来源不能为空'),
  body('to_center').notEmpty().withMessage('分配目标不能为空'),
  body('amount').isNumeric().withMessage('分配金额必须是数字'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { from_center, to_center, amount, allocation_date, description, notes } = req.body;

    db.run(
      `INSERT INTO cost_allocations (from_center, to_center, amount, allocation_date, description, notes, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [from_center, to_center, amount, allocation_date || new Date().toISOString().split('T')[0], description, notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];
