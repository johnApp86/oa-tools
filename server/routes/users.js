const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const db = require('../database/db');

const router = express.Router();

// 获取用户列表
router.get('/',  (req, res) => {
  const { page = 1, limit = 10, keyword = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT u.*, o.name as org_name, p.name as position_name,
           GROUP_CONCAT(r.name) as role_names
    FROM users u
    LEFT JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE 1=1
  `;
  
  const params = [];
  if (keyword) {
    sql += ` AND (u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }

  sql += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, users) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM users WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND (username LIKE ? OR real_name LIKE ? OR email LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: users,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 获取用户详情
router.get('/:id',  (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT u.*, o.name as org_name, p.name as position_name
     FROM users u
     LEFT JOIN organizations o ON u.organization_id = o.id
     LEFT JOIN positions p ON u.position_id = p.id
     WHERE u.id = ?`,
    [id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // 获取用户角色
      db.all(
        `SELECT r.id, r.name, r.code FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = ?`,
        [id],
        (err, roles) => {
          if (err) {
            return res.status(500).json({ message: '获取角色失败' });
          }

          res.json({ ...user, roles });
        }
      );
    }
  );
});

// 创建用户
router.post('/',  [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('realName').notEmpty().withMessage('真实姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { username, password, realName, email, phone, organizationId, positionId, roleIds } = req.body;

  // 检查用户名是否已存在
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (user) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run(
      `INSERT INTO users (username, password, real_name, email, phone, organization_id, position_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, hashedPassword, realName, email, phone, organizationId, positionId],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建用户失败' });
        }

        const userId = this.lastID;

        // 分配角色
        if (roleIds && roleIds.length > 0) {
          const roleInserts = roleIds.map(roleId => 
            db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId])
          );
        }

        res.json({ message: '创建成功', userId });
      }
    );
  });
});

// 更新用户
router.put('/:id',  [
  body('realName').notEmpty().withMessage('真实姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { id } = req.params;
  const { realName, email, phone, organizationId, positionId, roleIds, status } = req.body;

  db.run(
    `UPDATE users SET real_name = ?, email = ?, phone = ?, organization_id = ?, position_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [realName, email, phone, organizationId, positionId, status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '更新失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '用户不存在' });
      }

      // 更新角色
      if (roleIds) {
        db.run('DELETE FROM user_roles WHERE user_id = ?', [id], (err) => {
          if (roleIds.length > 0) {
            const roleInserts = roleIds.map(roleId => 
              db.run('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [id, roleId])
            );
          }
        });
      }

      res.json({ message: '更新成功' });
    }
  );
});

// 删除用户
router.delete('/:id',  (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({ message: '删除成功' });
  });
});

// 重置密码
router.put('/:id/reset-password',  [
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { id } = req.params;
  const { password } = req.body;
  const hashedPassword = bcrypt.hashSync(password, 10);

  db.run(
    'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [hashedPassword, id],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '重置密码失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '用户不存在' });
      }

      res.json({ message: '密码重置成功' });
    }
  );
});

module.exports = router;
