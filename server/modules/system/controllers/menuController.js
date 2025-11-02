const db = require('../../../core/database/db-connection');

class MenuController {
  // 获取菜单树
  async getMenuTree(req, res) {
    try {
      // 从数据库获取所有启用的菜单
      db.all(
        `SELECT * FROM menus WHERE status = 1 ORDER BY level, sort_order, id`,
        [],
        (err, menus) => {
          if (err) {
            console.error('查询菜单失败:', err);
            return res.status(500).json({ message: '查询失败', error: err.message });
          }

          // 构建菜单树
          const menuMap = new Map();
          const menuTree = [];

          // 第一遍：创建所有菜单的映射
          menus.forEach(menu => {
            menuMap.set(menu.id, {
              id: menu.id,
              name: menu.name,
              path: menu.path,
              component: menu.component,
              icon: menu.icon,
              parent_id: menu.parent_id,
              level: menu.level,
              sort_order: menu.sort_order,
              children: []
            });
          });

          // 第二遍：构建树形结构
          menus.forEach(menu => {
            const menuItem = menuMap.get(menu.id);
            if (menu.parent_id === 0 || menu.parent_id === null) {
              // 顶级菜单
              menuTree.push(menuItem);
            } else {
              // 子菜单
              const parent = menuMap.get(menu.parent_id);
              if (parent) {
                parent.children.push(menuItem);
              }
            }
          });

          // 对每个节点的子菜单进行排序
          const sortChildren = (node) => {
            if (node.children && node.children.length > 0) {
              node.children.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
              node.children.forEach(sortChildren);
            }
          };

          menuTree.forEach(sortChildren);
          menuTree.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

          res.json(menuTree);
        }
      );
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 获取菜单列表（树形结构）
  async getMenus(req, res) {
    try {
      const { keyword = '', tree = false } = req.query;

      let sql = `SELECT * FROM menus WHERE 1=1`;
      const params = [];
      
      if (keyword) {
        sql += ` AND (name LIKE ? OR path LIKE ?)`;
        params.push(`%${keyword}%`, `%${keyword}%`);
      }

      sql += ` ORDER BY level, sort_order, id`;

      db.all(sql, params, (err, menus) => {
        if (err) {
          console.error('查询菜单列表失败:', err);
          return res.status(500).json({ message: '查询失败', error: err.message });
        }

        if (tree === 'true' || tree === true) {
          // 返回树形结构
          const menuMap = new Map();
          const menuTree = [];

          // 第一遍：创建所有菜单的映射
          menus.forEach(menu => {
            menuMap.set(menu.id, {
              id: menu.id,
              name: menu.name,
              path: menu.path,
              component: menu.component,
              icon: menu.icon,
              parent_id: menu.parent_id,
              level: menu.level,
              sort_order: menu.sort_order,
              type: menu.type,
              status: menu.status,
              children: []
            });
          });

          // 第二遍：构建树形结构
          menus.forEach(menu => {
            const menuItem = menuMap.get(menu.id);
            if (menu.parent_id === 0 || menu.parent_id === null) {
              // 顶级菜单
              menuTree.push(menuItem);
            } else {
              // 子菜单
              const parent = menuMap.get(menu.parent_id);
              if (parent) {
                parent.children.push(menuItem);
              }
            }
          });

          // 对每个节点的子菜单进行排序
          const sortChildren = (node) => {
            if (node.children && node.children.length > 0) {
              node.children.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
              node.children.forEach(sortChildren);
            }
          };

          menuTree.forEach(sortChildren);
          menuTree.sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

          res.json({
            data: menuTree,
            total: menus.length
          });
        } else {
          // 返回扁平列表（兼容旧代码）
          res.json({
            data: menus,
            total: menus.length
          });
        }
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误', error: error.message });
    }
  }

  // 创建菜单
  async createMenu(req, res) {
    try {
      const { name, path, component, icon, parentId = 0, level = 1, sortOrder = 0, type = 1, status = 1 } = req.body;

      db.run(
        `INSERT INTO menus (name, path, component, icon, parent_id, level, sort_order, type, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, path, component, icon, parentId, level, sortOrder, type, status],
        function(err) {
          if (err) {
            return res.status(500).json({ message: '创建菜单失败' });
          }

          res.json({ message: '创建成功', menuId: this.lastID });
        }
      );
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 更新菜单
  async updateMenu(req, res) {
    try {
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
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 删除菜单
  async deleteMenu(req, res) {
    try {
      const { id } = req.params;

      // 检查是否有子菜单
      db.get('SELECT id FROM menus WHERE parent_id = ?', [id], (err, child) => {
        if (err) {
          return res.status(500).json({ message: '数据库错误' });
        }

        if (child) {
          return res.status(400).json({ message: '该菜单下有子菜单，无法删除' });
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
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 修复菜单数据
  async fixMenuData(req, res) {
    try {
      console.log('🔧 开始修复菜单数据...');
      
      // 删除现有的财务模块菜单数据
      db.run(`DELETE FROM menus WHERE name LIKE '%财务%' OR name LIKE '%总账%' OR name LIKE '%应收%' OR name LIKE '%应付%' OR name LIKE '%固定资产%' OR name LIKE '%资金%' OR name LIKE '%成本%' OR name LIKE '%预算%' OR name LIKE '%报表%' OR name LIKE '%税务%' OR name LIKE '%费用%'`, (err) => {
        if (err) {
          console.error('❌ 删除旧数据失败:', err.message);
          return res.status(500).json({ message: '删除旧数据失败' });
        }
        console.log('✓ 删除旧的财务模块菜单数据');

        // 插入财务模块菜单数据
        const financeMenus = [
          // 财务管理主菜单
          { id: 15, name: '财务管理', path: '/finance', component: 'Layout', icon: 'Money', parent_id: 0, level: 1, sort_order: 4, type: 1, status: 1 },
          
          // 财务子菜单
          { id: 16, name: '总账', path: '/finance/general-ledger', component: 'finance/GeneralLedger', icon: 'Document', parent_id: 15, level: 2, sort_order: 1, type: 1, status: 1 },
          { id: 17, name: '应收账款', path: '/finance/accounts-receivable', component: 'finance/AccountsReceivable', icon: 'CreditCard', parent_id: 15, level: 2, sort_order: 2, type: 1, status: 1 },
          { id: 18, name: '应付账款', path: '/finance/accounts-payable', component: 'finance/AccountsPayable', icon: 'CreditCard', parent_id: 15, level: 2, sort_order: 3, type: 1, status: 1 },
          { id: 19, name: '固定资产', path: '/finance/fixed-assets', component: 'finance/FixedAssets', icon: 'OfficeBuilding', parent_id: 15, level: 2, sort_order: 4, type: 1, status: 1 },
          { id: 20, name: '资金管理', path: '/finance/cash-management', component: 'finance/CashManagement', icon: 'Wallet', parent_id: 15, level: 2, sort_order: 5, type: 1, status: 1 },
          { id: 21, name: '成本管理', path: '/finance/cost-accounting', component: 'finance/CostAccounting', icon: 'Document', parent_id: 15, level: 2, sort_order: 6, type: 1, status: 1 },
          { id: 22, name: '预算管理', path: '/finance/budgeting', component: 'finance/Budgeting', icon: 'DataAnalysis', parent_id: 15, level: 2, sort_order: 7, type: 1, status: 1 },
          { id: 24, name: '税务管理', path: '/finance/tax-management', component: 'finance/TaxManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 8, type: 1, status: 1 },
          { id: 25, name: '费用管理', path: '/finance/expense-management', component: 'finance/ExpenseManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 9, type: 1, status: 1 },
          { id: 23, name: '报表与分析', path: '/finance/financial-reporting', component: 'finance/FinancialReporting', icon: 'Document', parent_id: 15, level: 2, sort_order: 10, type: 1, status: 1 }
        ];

        let completed = 0;
        let hasError = false;

        financeMenus.forEach(menu => {
          db.run(`
            INSERT INTO menus (id, name, path, component, icon, parent_id, level, sort_order, type, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            menu.id, 
            menu.name, 
            menu.path, 
            menu.component, 
            menu.icon, 
            menu.parent_id, 
            menu.level, 
            menu.sort_order, 
            menu.type, 
            menu.status
          ], (err) => {
            if (err) {
              console.error(`❌ 插入菜单 "${menu.name}" 失败:`, err.message);
              hasError = true;
            } else {
              console.log(`✓ 插入菜单 "${menu.name}" 成功`);
            }
            
            completed++;
            if (completed === financeMenus.length) {
              if (hasError) {
                res.status(500).json({ message: '部分菜单数据插入失败' });
              } else {
                console.log('🎉 财务模块菜单数据修复完成！');
                res.json({ message: '菜单数据修复成功' });
              }
            }
          });
        });
      });
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }
}

module.exports = new MenuController();
