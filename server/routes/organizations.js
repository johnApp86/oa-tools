const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');

const router = express.Router();

// 获取组织树
router.get('/tree', (req, res) => {
  db.all(
    `SELECT * FROM organizations WHERE status = 1 ORDER BY level, sort_order`,
    (err, organizations) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 构建树形结构
      const buildTree = (items, parentId = 0) => {
        return items
          .filter(item => item.parent_id === parentId)
          .map(item => ({
            ...item,
            children: buildTree(items, item.id)
          }));
      };

      const tree = buildTree(organizations);
      res.json(tree);
    }
  );
});

// 获取组织列表
router.get('/', (req, res) => {
  const { page = 1, limit = 10, keyword = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT * FROM organizations WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (name LIKE ? OR code LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ` ORDER BY level, sort_order LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, organizations) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM organizations WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND (name LIKE ? OR code LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: organizations,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 获取所有组织（用于下拉选择）
router.get('/all', (req, res) => {
  db.all('SELECT id, name, code FROM organizations WHERE status = 1 ORDER BY level, sort_order', (err, organizations) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }
    res.json(organizations);
  });
});

// 获取组织详情
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM organizations WHERE id = ?', [id], (err, organization) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    if (!organization) {
      return res.status(404).json({ message: '组织不存在' });
    }

    res.json(organization);
  });
});

// 创建组织
router.post('/', [
  body('name').notEmpty().withMessage('组织名称不能为空'),
  body('code').notEmpty().withMessage('组织代码不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, code, parentId = 0, level = 1, sortOrder = 0 } = req.body;

  // 检查代码是否已存在
  db.get('SELECT id FROM organizations WHERE code = ?', [code], (err, org) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (org) {
      return res.status(400).json({ message: '组织代码已存在' });
    }

    db.run(
      `INSERT INTO organizations (name, code, parent_id, level, sort_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [name, code, parentId, level, sortOrder],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建组织失败' });
        }

        res.json({ message: '创建成功', organizationId: this.lastID });
      }
    );
  });
});

// 更新组织
router.put('/:id', [
  body('name').notEmpty().withMessage('组织名称不能为空'),
  body('code').notEmpty().withMessage('组织代码不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { id } = req.params;
  const { name, code, parentId, level, sortOrder, status } = req.body;

  // 检查代码是否被其他组织使用
  db.get('SELECT id FROM organizations WHERE code = ? AND id != ?', [code, id], (err, org) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (org) {
      return res.status(400).json({ message: '组织代码已存在' });
    }

    db.run(
      `UPDATE organizations SET name = ?, code = ?, parent_id = ?, level = ?, 
       sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, code, parentId, level, sortOrder, status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '组织不存在' });
        }

        res.json({ message: '更新成功' });
      }
    );
  });
});

// 删除组织
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // 检查是否有子组织
  db.get('SELECT id FROM organizations WHERE parent_id = ?', [id], (err, child) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (child) {
      return res.status(400).json({ message: '该组织下有子组织，无法删除' });
    }

    // 检查是否有用户属于此组织
    db.get('SELECT id FROM users WHERE organization_id = ?', [id], (err, user) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误' });
      }

      if (user) {
        return res.status(400).json({ message: '该组织下有用户，无法删除' });
      }

      db.run('DELETE FROM organizations WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ message: '删除失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '组织不存在' });
        }

        res.json({ message: '删除成功' });
      });
    });
  });
});

module.exports = router;
