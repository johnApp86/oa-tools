const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../database/db-connection');

const router = express.Router();
const JWT_SECRET = 'oa-system-secret-key';

// 用户登录
router.post('/login', [
  body('username').notEmpty().withMessage('用户名不能为空'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { username, password } = req.body;

  db.get(
    `SELECT u.*, o.name as org_name, p.name as position_name 
     FROM users u 
     LEFT JOIN organizations o ON u.organization_id = o.id 
     LEFT JOIN positions p ON u.position_id = p.id 
     WHERE u.username = ? AND u.status = 1`,
    [username],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误' });
      }

      if (!user) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      if (!bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ message: '用户名或密码错误' });
      }

      // 更新最后登录时间
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

      // 生成JWT token
      const token = jwt.sign(
        { userId: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 获取用户角色和权限
      db.all(
        `SELECT r.id, r.name, r.code, rm.permissions, m.id as menu_id, m.name as menu_name, m.path, m.icon
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         LEFT JOIN role_menus rm ON r.id = rm.role_id
         LEFT JOIN menus m ON rm.menu_id = m.id
         WHERE ur.user_id = ? AND r.status = 1 AND m.status = 1
         ORDER BY m.level, m.sort_order`,
        [user.id],
        (err, permissions) => {
          if (err) {
            return res.status(500).json({ message: '获取权限失败' });
          }

          // 整理权限数据
          const roles = [...new Set(permissions.map(p => ({ id: p.id, name: p.name, code: p.code })))];
          const menus = permissions.reduce((acc, p) => {
            if (p.menu_id && !acc.find(m => m.id === p.menu_id)) {
              acc.push({
                id: p.menu_id,
                name: p.menu_name,
                path: p.path,
                icon: p.icon,
                permissions: p.permissions
              });
            }
            return acc;
          }, []);

          res.json({
            message: '登录成功',
            token,
            user: {
              id: user.id,
              username: user.username,
              realName: user.real_name,
              email: user.email,
              phone: user.phone,
              avatar: user.avatar,
              organization: user.org_name,
              position: user.position_name,
              roles,
              menus
            }
          });
        }
      );
    }
  );
});

// 用户注册
router.post('/register', [
  body('username').isLength({ min: 3 }).withMessage('用户名至少3位'),
  body('password').isLength({ min: 6 }).withMessage('密码至少6位'),
  body('realName').notEmpty().withMessage('真实姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { username, password, realName, email, phone } = req.body;

  // 检查用户名是否已存在
  db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (user) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 加密密码
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 创建用户
    db.run(
      `INSERT INTO users (username, password, real_name, email, phone, organization_id, position_id) 
       VALUES (?, ?, ?, ?, ?, 1, 1)`,
      [username, hashedPassword, realName, email, phone],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '注册失败' });
        }

        res.json({ message: '注册成功', userId: this.lastID });
      }
    );
  });
});

// 验证token中间件
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: '未提供token' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'token无效' });
  }
};

// 获取当前用户信息
router.get('/profile', verifyToken, (req, res) => {
  db.get(
    `SELECT u.*, o.name as org_name, p.name as position_name 
     FROM users u 
     LEFT JOIN organizations o ON u.organization_id = o.id 
     LEFT JOIN positions p ON u.position_id = p.id 
     WHERE u.id = ?`,
    [req.user.userId],
    (err, user) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误' });
      }

      if (!user) {
        return res.status(404).json({ message: '用户不存在' });
      }

      res.json({
        id: user.id,
        username: user.username,
        realName: user.real_name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        organization: user.org_name,
        position: user.position_name
      });
    }
  );
});

module.exports = router;
