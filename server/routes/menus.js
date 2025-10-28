const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');

const router = express.Router();

// 获取菜单树
router.get('/tree',  (req, res) => {
  db.all(
    `SELECT * FROM menus WHERE status = 1 ORDER BY level, sort_order`,
    (err, menus) => {
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

      const tree = buildTree(menus);
      res.json(tree);
    }
  );
});

// 获取菜单列表
router.get('/',  (req, res) => {
  const { page = 1, limit = 10, keyword = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT * FROM menus WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (name LIKE ? OR path LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ` ORDER BY level, sort_order LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, menus) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM menus WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND (name LIKE ? OR path LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: menus,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 获取菜单详情
router.get('/:id',  (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM menus WHERE id = ?', [id], (err, menu) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    if (!menu) {
      return res.status(404).json({ message: '菜单不存在' });
    }

    res.json(menu);
  });
});

// 创建菜单
router.post('/',  [
  body('name').notEmpty().withMessage('菜单名称不能为空'),
  body('type').isInt().withMessage('菜单类型必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, path, component, icon, parentId = 0, level = 1, sortOrder = 0, type = 1 } = req.body;

  db.run(
    `INSERT INTO menus (name, path, component, icon, parent_id, level, sort_order, type) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, path, component, icon, parentId, level, sortOrder, type],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建菜单失败' });
      }

      res.json({ message: '创建成功', menuId: this.lastID });
    }
  );
});

// 更新菜单
router.put('/:id',  [
  body('name').notEmpty().withMessage('菜单名称不能为空'),
  body('type').isInt().withMessage('菜单类型必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { id } = req.params;
  const { name, path, component, icon, parentId, level, sortOrder, type, status } = req.body;

  db.run(
    `UPDATE menus SET name = ?, path = ?, component = ?, icon = ?, parent_id = ?, 
     level = ?, sort_order = ?, type = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [name, path, component, icon, parentId, level, sortOrder, type, status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '更新失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '菜单不存在' });
      }

      res.json({ message: '更新成功' });
    }
  );
});

// 删除菜单
router.delete('/:id',  (req, res) => {
  const { id } = req.params;

  // 检查是否有子菜单
  db.get('SELECT id FROM menus WHERE parent_id = ?', [id], (err, child) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (child) {
      return res.status(400).json({ message: '该菜单下有子菜单，无法删除' });
    }

    // 检查是否有角色使用此菜单
    db.get('SELECT id FROM role_menus WHERE menu_id = ?', [id], (err, roleMenu) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误' });
      }

      if (roleMenu) {
        return res.status(400).json({ message: '该菜单正在被角色使用，无法删除' });
      }

      db.run('DELETE FROM menus WHERE id = ?', [id], function(err) {
        if (err) {
          return res.status(500).json({ message: '删除失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '菜单不存在' });
        }

        res.json({ message: '删除成功' });
      });
    });
  });
});

module.exports = router;
