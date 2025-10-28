const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');

const router = express.Router();

// 获取角色列表
router.get('/',  (req, res) => {
  const { page = 1, limit = 10, keyword = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT * FROM roles WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (name LIKE ? OR code LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }

  sql += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, roles) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM roles WHERE 1=1`;
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
        data: roles,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 获取所有角色（用于下拉选择）
router.get('/all',  (req, res) => {
  db.all('SELECT id, name, code FROM roles WHERE status = 1 ORDER BY created_at', (err, roles) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }
    res.json(roles);
  });
});

// 获取角色详情
router.get('/:id',  (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM roles WHERE id = ?', [id], (err, role) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    if (!role) {
      return res.status(404).json({ message: '角色不存在' });
    }

    // 获取角色菜单权限
    db.all(
      `SELECT rm.*, m.name as menu_name, m.path, m.icon, m.parent_id
       FROM role_menus rm
       JOIN menus m ON rm.menu_id = m.id
       WHERE rm.role_id = ?
       ORDER BY m.level, m.sort_order`,
      [id],
      (err, permissions) => {
        if (err) {
          return res.status(500).json({ message: '获取权限失败' });
        }

        res.json({ ...role, permissions });
      }
    );
  });
});

// 创建角色
router.post('/',  [
  body('name').notEmpty().withMessage('角色名称不能为空'),
  body('code').notEmpty().withMessage('角色代码不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, code, description, menuIds } = req.body;

  // 检查代码是否已存在
  db.get('SELECT id FROM roles WHERE code = ?', [code], (err, role) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (role) {
      return res.status(400).json({ message: '角色代码已存在' });
    }

    db.run(
      'INSERT INTO roles (name, code, description) VALUES (?, ?, ?)',
      [name, code, description],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建角色失败' });
        }

        const roleId = this.lastID;

        // 分配菜单权限
        if (menuIds && menuIds.length > 0) {
          const menuInserts = menuIds.map(menuId => 
            db.run('INSERT INTO role_menus (role_id, menu_id, permissions) VALUES (?, ?, ?)', 
              [roleId, menuId, 'read,create,update,delete'])
          );
        }

        res.json({ message: '创建成功', roleId });
      }
    );
  });
});

// 更新角色
router.put('/:id',  [
  body('name').notEmpty().withMessage('角色名称不能为空'),
  body('code').notEmpty().withMessage('角色代码不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { id } = req.params;
  const { name, code, description, status, menuIds } = req.body;

  // 检查代码是否被其他角色使用
  db.get('SELECT id FROM roles WHERE code = ? AND id != ?', [code, id], (err, role) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (role) {
      return res.status(400).json({ message: '角色代码已存在' });
    }

    db.run(
      'UPDATE roles SET name = ?, code = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, code, description, status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '角色不存在' });
        }

        // 更新菜单权限
        if (menuIds !== undefined) {
          db.run('DELETE FROM role_menus WHERE role_id = ?', [id], (err) => {
            if (menuIds && menuIds.length > 0) {
              const menuInserts = menuIds.map(menuId => 
                db.run('INSERT INTO role_menus (role_id, menu_id, permissions) VALUES (?, ?, ?)', 
                  [id, menuId, 'read,create,update,delete'])
              );
            }
          });
        }

        res.json({ message: '更新成功' });
      }
    );
  });
});

// 删除角色
router.delete('/:id',  (req, res) => {
  const { id } = req.params;

  // 检查是否有用户使用此角色
  db.get('SELECT id FROM user_roles WHERE role_id = ?', [id], (err, userRole) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (userRole) {
      return res.status(400).json({ message: '该角色正在被用户使用，无法删除' });
    }

    db.run('DELETE FROM roles WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: '删除失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '角色不存在' });
      }

      res.json({ message: '删除成功' });
    });
  });
});

module.exports = router;
