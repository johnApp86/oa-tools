const db = require('../../../core/database/db-connection');

class MenuController {
  // 获取菜单树
  async getMenuTree(req, res) {
    try {
      const menus = [
        {
          id: 1,
          name: '系统管理',
          path: '/system',
          icon: 'Setting',
          children: [
            {
              id: 2,
              name: '组织管理',
              path: '/system/organization',
              icon: 'OfficeBuilding'
            },
            {
              id: 3,
              name: '岗位管理',
              path: '/system/position',
              icon: 'User'
            },
            {
              id: 4,
              name: '用户管理',
              path: '/system/user',
              icon: 'Avatar'
            },
            {
              id: 5,
              name: '菜单管理',
              path: '/system/menu',
              icon: 'Menu'
            }
          ]
        },
        {
          id: 6,
          name: 'HR管理',
          path: '/hr',
          icon: 'UserGroup',
          children: [
            {
              id: 7,
              name: '招聘管理',
              path: '/hr/recruitment',
              icon: 'UserPlus'
            },
            {
              id: 8,
              name: '入职离职管理',
              path: '/hr/onboarding',
              icon: 'UserCheck'
            },
            {
              id: 9,
              name: '考勤、请假',
              path: '/hr/attendance',
              icon: 'Clock'
            },
            {
              id: 10,
              name: '薪酬福利管理',
              path: '/hr/salary',
              icon: 'CurrencyDollar'
            },
            {
              id: 11,
              name: '档案管理',
              path: '/hr/employee',
              icon: 'DocumentText'
            },
            {
              id: 12,
              name: '报表分析',
              path: '/hr/reports',
              icon: 'ChartBar'
            }
          ]
        }
      ];
      res.json(menus);
    } catch (error) {
      res.status(500).json({ message: '服务器错误' });
    }
  }

  // 获取菜单列表
  async getMenus(req, res) {
    try {
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
            return res.status(500).json({ message: '查询失败' });
          }

          res.json({
            data: menus,
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
          { id: 23, name: '报表与分析', path: '/finance/financial-reporting', component: 'finance/FinancialReporting', icon: 'Document', parent_id: 15, level: 2, sort_order: 8, type: 1, status: 1 },
          { id: 24, name: '税务管理', path: '/finance/tax-management', component: 'finance/TaxManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 9, type: 1, status: 1 },
          { id: 25, name: '费用管理', path: '/finance/expense-management', component: 'finance/ExpenseManagement', icon: 'Document', parent_id: 15, level: 2, sort_order: 10, type: 1, status: 1 }
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
