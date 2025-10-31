const db = require('../../../core/database/db-connection');

class UserController {
  // 获取用户列表
  async getUsers(req, res) {
    try {
      const { page = 1, limit = 10, keyword = '' } = req.query;
      const offset = (page - 1) * limit;

      let sql = `SELECT u.*, o.name as org_name, p.name as position_name 
                 FROM users u 
                 LEFT JOIN organizations o ON u.organization_id = o.id 
                 LEFT JOIN positions p ON u.position_id = p.id 
                 WHERE 1=1`;
      const params = [];
      
      if (keyword) {
        sql += ` AND (u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }

      sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
      params.push(parseInt(limit), parseInt(offset));

      db.all(sql, params, (err, users) => {
        if (err) {
          console.error('查询用户列表失败:', err);
          return res.status(500).json({ message: '查询失败', error: err.message });
        }

        // 获取总数
        let countSql = `SELECT COUNT(*) as total FROM users u WHERE 1=1`;
        const countParams = [];
        
        if (keyword) {
          countSql += ` AND (u.username LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)`;
          countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        db.get(countSql, countParams, (err, countResult) => {
          if (err) {
            console.error('查询用户总数失败:', err);
            return res.status(500).json({ message: '查询失败', error: err.message });
          }

          res.json({
            data: users,
            total: countResult.total,
            page: parseInt(page),
            limit: parseInt(limit)
          });
        });
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 创建用户
  async createUser(req, res) {
    try {
      const { username, realName, email, phone, organizationId, positionId, status = 1, password } = req.body;

      // 检查用户名是否已存在
      db.get('SELECT id FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
          return res.status(500).json({ message: '数据库错误' });
        }

        if (user) {
          return res.status(400).json({ message: '用户名已存在' });
        }

        // 检查邮箱是否已存在
        if (email) {
          db.get('SELECT id FROM users WHERE email = ?', [email], (err, emailUser) => {
            if (err) {
              return res.status(500).json({ message: '数据库错误' });
            }

            if (emailUser) {
              return res.status(400).json({ message: '邮箱已存在' });
            }

            // 创建用户
            const defaultPassword = password || '123456'; // 默认密码
            db.run(
              `INSERT INTO users (username, password, real_name, email, phone, organization_id, position_id, status) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
              [username, defaultPassword, realName, email, phone, organizationId, positionId, status],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: '创建用户失败' });
                }

                res.json({ message: '创建成功', userId: this.lastID });
              }
            );
          });
        } else {
          // 创建用户（无邮箱）
          const defaultPassword = password || '123456'; // 默认密码
          db.run(
            `INSERT INTO users (username, password, real_name, email, phone, organization_id, position_id, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [username, defaultPassword, realName, email, phone, organizationId, positionId, status],
            function(err) {
              if (err) {
                return res.status(500).json({ message: '创建用户失败' });
              }

              res.json({ message: '创建成功', userId: this.lastID });
            }
          );
        }
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 更新用户
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, realName, email, phone, organizationId, positionId, status } = req.body;

      // 检查用户名是否被其他用户使用
      db.get('SELECT id FROM users WHERE username = ? AND id != ?', [username, id], (err, user) => {
        if (err) {
          return res.status(500).json({ message: '数据库错误' });
        }

        if (user) {
          return res.status(400).json({ message: '用户名已存在' });
        }

        // 检查邮箱是否被其他用户使用
        if (email) {
          db.get('SELECT id FROM users WHERE email = ? AND id != ?', [email, id], (err, emailUser) => {
            if (err) {
              return res.status(500).json({ message: '数据库错误' });
            }

            if (emailUser) {
              return res.status(400).json({ message: '邮箱已存在' });
            }

            // 更新用户
            db.run(
              `UPDATE users SET username = ?, real_name = ?, email = ?, phone = ?, 
               organization_id = ?, position_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
               WHERE id = ?`,
              [username, realName, email, phone, organizationId, positionId, status, id],
              function(err) {
                if (err) {
                  return res.status(500).json({ message: '更新失败' });
                }

                if (this.changes === 0) {
                  return res.status(404).json({ message: '用户不存在' });
                }

                res.json({ message: '更新成功' });
              }
            );
          });
        } else {
          // 更新用户（无邮箱）
          db.run(
            `UPDATE users SET username = ?, real_name = ?, email = ?, phone = ?, 
             organization_id = ?, position_id = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [username, realName, email, phone, organizationId, positionId, status, id],
            function(err) {
              if (err) {
                return res.status(500).json({ message: '更新失败' });
              }

              if (this.changes === 0) {
                return res.status(404).json({ message: '用户不存在' });
              }

              res.json({ message: '更新成功' });
            }
          );
        }
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 删除用户
  async deleteUser(req, res) {
    try {
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
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }
}

module.exports = new UserController();
