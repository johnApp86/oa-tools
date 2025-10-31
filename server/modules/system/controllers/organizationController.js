const db = require('../../../core/database/db-connection');

class OrganizationController {
  // 获取组织列表
  async getOrganizations(req, res) {
    try {
      db.all(
        `SELECT * FROM organizations WHERE status = 1 ORDER BY level, sort_order`,
        (err, organizations) => {
          if (err) {
            return res.status(500).json({ message: '查询失败' });
          }
          res.json(organizations);
        }
      );
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 获取组织树
  async getOrganizationTree(req, res) {
    try {
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
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 获取所有组织（用于下拉选择）
  async getAllOrganizations(req, res) {
    try {
      db.all('SELECT id, name, code FROM organizations WHERE status = 1 ORDER BY level, sort_order', (err, organizations) => {
        if (err) {
          return res.status(500).json({ message: '查询失败' });
        }
        res.json(organizations);
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 创建组织
  async createOrganization(req, res) {
    try {
      const { name, code, parentId = 0, level = 1, sortOrder = 0, status = 1 } = req.body;

      // 检查代码是否已存在
      db.get('SELECT id FROM organizations WHERE code = ?', [code], (err, org) => {
        if (err) {
          return res.status(500).json({ message: '数据库错误' });
        }

        if (org) {
          return res.status(400).json({ message: '组织代码已存在' });
        }

        db.run(
          `INSERT INTO organizations (name, code, parent_id, level, sort_order, status) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [name, code, parentId, level, sortOrder, status],
          function(err) {
            if (err) {
              return res.status(500).json({ message: '创建组织失败' });
            }

            res.json({ message: '创建成功', organizationId: this.lastID });
          }
        );
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 更新组织
  async updateOrganization(req, res) {
    try {
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
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 删除组织
  async deleteOrganization(req, res) {
    try {
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
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }
}

module.exports = new OrganizationController();
