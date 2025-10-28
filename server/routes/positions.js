const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');

const router = express.Router();

// 获取岗位列表
router.get('/', (req, res) => {
  const { page = 1, limit = 10, keyword = '', organizationId } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT p.*, o.name as org_name 
    FROM positions p
    LEFT JOIN organizations o ON p.organization_id = o.id
    WHERE 1=1
  `;
  const params = [];
  
  if (keyword) {
    sql += ` AND (p.name LIKE ? OR p.code LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  if (organizationId) {
    sql += ` AND p.organization_id = ?`;
    params.push(organizationId);
  }

  sql += ` ORDER BY p.level, p.sort_order LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, positions) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM positions WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND (name LIKE ? OR code LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (organizationId) {
      countSql += ` AND organization_id = ?`;
      countParams.push(organizationId);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: positions,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 获取所有岗位（用于下拉选择）
router.get('/all',  (req, res) => {
  const { organizationId } = req.query;
  
  let sql = 'SELECT id, name, code FROM positions WHERE status = 1';
  const params = [];
  
  if (organizationId) {
    sql += ' AND organization_id = ?';
    params.push(organizationId);
  }
  
  sql += ' ORDER BY level, sort_order';

  db.all(sql, params, (err, positions) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }
    res.json(positions);
  });
});

// 获取岗位详情
router.get('/:id',  (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT p.*, o.name as org_name 
     FROM positions p
     LEFT JOIN organizations o ON p.organization_id = o.id
     WHERE p.id = ?`,
    [id],
    (err, position) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      if (!position) {
        return res.status(404).json({ message: '岗位不存在' });
      }

      res.json(position);
    }
  );
});

// 创建岗位
router.post('/',  [
  body('name').notEmpty().withMessage('岗位名称不能为空'),
  body('code').notEmpty().withMessage('岗位代码不能为空'),
  body('organizationId').isInt().withMessage('组织ID必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, code, organizationId, level = 1, sortOrder = 0 } = req.body;

  // 检查代码是否已存在
  db.get('SELECT id FROM positions WHERE code = ?', [code], (err, position) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (position) {
      return res.status(400).json({ message: '岗位代码已存在' });
    }

    db.run(
      `INSERT INTO positions (name, code, organization_id, level, sort_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, code, organizationId, level, sortOrder],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建岗位失败' });
        }

        res.json({ message: '创建成功', positionId: this.lastID });
      }
    );
  });
});

// 更新岗位
router.put('/:id',  [
  body('name').notEmpty().withMessage('岗位名称不能为空'),
  body('code').notEmpty().withMessage('岗位代码不能为空'),
  body('organizationId').isInt().withMessage('组织ID必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { id } = req.params;
  const { name, code, organizationId, level, sortOrder, status } = req.body;

  // 检查代码是否被其他岗位使用
  db.get('SELECT id FROM positions WHERE code = ? AND id != ?', [code, id], (err, position) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (position) {
      return res.status(400).json({ message: '岗位代码已存在' });
    }

    db.run(
      `UPDATE positions SET name = ?, code = ?, organization_id = ?, level = ?, 
       sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, code, organizationId, level, sortOrder, status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '岗位不存在' });
        }

        res.json({ message: '更新成功' });
      }
    );
  });
});

// 删除岗位
router.delete('/:id',  (req, res) => {
  const { id } = req.params;

  // 检查是否有用户属于此岗位
  db.get('SELECT id FROM users WHERE position_id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (user) {
      return res.status(400).json({ message: '该岗位下有用户，无法删除' });
    }

    db.run('DELETE FROM positions WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: '删除失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '岗位不存在' });
      }

      res.json({ message: '删除成功' });
    });
  });
});

module.exports = router;
