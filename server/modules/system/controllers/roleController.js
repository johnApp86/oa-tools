const db = require('../../../core/database/db-connection');

class RoleController {
  // 获取角色列表
  async getRoles(req, res) {
    try {
      const { page = 1, limit = 10, keyword = '' } = req.query;
      const offset = (page - 1) * limit;

      let sql = `SELECT * FROM roles WHERE 1=1`;
      const params = [];
      
      if (keyword) {
        sql += ` AND (name LIKE ? OR code LIKE ? OR description LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
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
          countSql += ` AND (name LIKE ? OR code LIKE ? OR description LIKE ?)`;
          countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
        }

        db.get(countSql, countParams, (err, countResult) => {
          if (err) {
            return res.status(500).json({ message: '查询失败' });
          }

          res.json({
            data: roles,
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

  // 获取所有角色（用于下拉选择）
  async getAllRoles(req, res) {
    try {
      db.all('SELECT id, name, code FROM roles WHERE status = 1 ORDER BY created_at DESC', (err, roles) => {
        if (err) {
          return res.status(500).json({ message: '查询失败' });
        }
        res.json(roles);
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 创建角色
  async createRole(req, res) {
    try {
      const { name, code, description, status = 1 } = req.body;

      // 检查代码是否已存在
      db.get('SELECT id FROM roles WHERE code = ?', [code], (err, role) => {
        if (err) {
          return res.status(500).json({ message: '数据库错误' });
        }

        if (role) {
          return res.status(400).json({ message: '角色代码已存在' });
        }

        db.run(
          `INSERT INTO roles (name, code, description, status) 
           VALUES (?, ?, ?, ?)`,
          [name, code, description, status],
          function(err) {
            if (err) {
              return res.status(500).json({ message: '创建角色失败' });
            }

            res.json({ message: '创建成功', roleId: this.lastID });
          }
        );
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 更新角色
  async updateRole(req, res) {
    try {
      const { id } = req.params;
      const { name, code, description, status } = req.body;

      // 检查代码是否被其他角色使用
      db.get('SELECT id FROM roles WHERE code = ? AND id != ?', [code, id], (err, role) => {
        if (err) {
          return res.status(500).json({ message: '数据库错误' });
        }

        if (role) {
          return res.status(400).json({ message: '角色代码已存在' });
        }

        db.run(
          `UPDATE roles SET name = ?, code = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
           WHERE id = ?`,
          [name, code, description, status, id],
          function(err) {
            if (err) {
              return res.status(500).json({ message: '更新失败' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ message: '角色不存在' });
            }

            res.json({ message: '更新成功' });
          }
        );
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 删除角色
  async deleteRole(req, res) {
    try {
      const { id } = req.params;

      // 检查是否有用户使用此角色
      db.get('SELECT id FROM users WHERE role_id = ?', [id], (err, user) => {
        if (err) {
          return res.status(500).json({ message: '数据库错误' });
        }

        if (user) {
          return res.status(400).json({ message: '该角色下有用户，无法删除' });
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
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }
}

module.exports = new RoleController();
