const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database/db-connection');
const { initHRDatabase } = require('./database/hr-tables');

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// 静态文件服务
app.use(express.static(path.join(__dirname, '../client/dist')));

// 初始化HR数据库
initHRDatabase();

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器运行正常' });
});

// 获取菜单树（简化版，返回固定菜单）
app.get('/api/menus/tree', (req, res) => {
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
});

// 获取用户列表
app.get('/api/users', (req, res) => {
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
      return res.status(500).json({ message: '查询失败' });
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
        return res.status(500).json({ message: '查询失败' });
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

// 获取组织列表
app.get('/api/organizations', (req, res) => {
  db.all(
    `SELECT * FROM organizations WHERE status = 1 ORDER BY level, sort_order`,
    (err, organizations) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }
      res.json(organizations);
    }
  );
});

// 创建组织
app.post('/api/organizations', (req, res) => {
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
});

// 更新组织
app.put('/api/organizations/:id', (req, res) => {
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
app.delete('/api/organizations/:id', (req, res) => {
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

// 获取组织树
app.get('/api/organizations/tree', (req, res) => {
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

// 获取所有组织（用于下拉选择）
app.get('/api/organizations/all', (req, res) => {
  db.all('SELECT id, name, code FROM organizations WHERE status = 1 ORDER BY level, sort_order', (err, organizations) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }
    res.json(organizations);
  });
});

// 获取岗位列表
app.get('/api/positions', (req, res) => {
  const { page = 1, limit = 10, keyword = '', organizationId } = req.query;
  const offset = (page - 1) * limit;

  let sql = `
    SELECT p.*, o.name as org_name 
    FROM positions p 
    LEFT JOIN organizations o ON p.organization_id = o.id 
    WHERE p.status = 1
  `;
  const params = [];
  
  if (keyword) {
    sql += ` AND (p.name LIKE ? OR p.code LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (organizationId) {
    sql += ` AND p.organization_id = ?`;
    params.push(organizationId);
  }
  
  sql += ` ORDER BY p.level, p.sort_order LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, positions) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM positions p WHERE p.status = 1`;
    const countParams = [];
    
    if (keyword) {
      countSql += ` AND (p.name LIKE ? OR p.code LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    
    if (organizationId) {
      countSql += ` AND p.organization_id = ?`;
      countParams.push(organizationId);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      res.json({
        data: positions,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 创建岗位
app.post('/api/positions', (req, res) => {
  const { name, code, organizationId, level = 1, sortOrder = 0, status = 1 } = req.body;

  // 检查代码是否已存在
  db.get('SELECT id FROM positions WHERE code = ?', [code], (err, position) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (position) {
      return res.status(400).json({ message: '岗位代码已存在' });
    }

    db.run(
      `INSERT INTO positions (name, code, organization_id, level, sort_order, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, code, organizationId, level, sortOrder, status],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建岗位失败' });
        }

        res.json({ message: '创建成功', positionId: this.lastID });
      }
    );
  });
});

// 更新岗位
app.put('/api/positions/:id', (req, res) => {
  const { id } = req.params;
  const { name, code, organizationId, level, sortOrder, status } = req.body;

  // 检查代码是否被其他岗位使用
  db.get('SELECT id FROM positions WHERE code = ? AND id != ?', [code, id], (err, position) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (position) {
      return res.status(400).json({ message: '岗位代码已存在' });
    }

    db.run(
      `UPDATE positions SET name = ?, code = ?, organization_id = ?, level = ?, 
       sort_order = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, code, organizationId, level, sortOrder, status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ message: '岗位不存在' });
        }

        res.json({ message: '更新成功' });
      }
    );
  });
});

// 删除岗位
app.delete('/api/positions/:id', (req, res) => {
  const { id } = req.params;

  // 检查是否有用户属于此岗位
  db.get('SELECT id FROM users WHERE position_id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ message: '数据库错误' });
    }

    if (user) {
      return res.status(400).json({ message: '该岗位下有用户，无法删除' });
    }

    db.run('DELETE FROM positions WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ message: '删除失败' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ message: '岗位不存在' });
      }

      res.json({ message: '删除成功' });
    });
  });
});

// 获取所有岗位（用于下拉选择）
app.get('/api/positions/all', (req, res) => {
  db.all('SELECT id, name, code FROM positions WHERE status = 1 ORDER BY level, sort_order', (err, positions) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }
    res.json(positions);
  });
});

// 创建用户
app.post('/api/users', (req, res) => {
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
});

// 更新用户
app.put('/api/users/:id', (req, res) => {
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
});

// 删除用户
app.delete('/api/users/:id', (req, res) => {
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

// 修复菜单数据API
app.post('/api/fix-menu-data', (req, res) => {
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
});

// 菜单管理API
app.get('/api/menus', (req, res) => {
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
});

// 创建菜单
app.post('/api/menus', (req, res) => {
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
});

// 更新菜单
app.put('/api/menus/:id', (req, res) => {
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
app.delete('/api/menus/:id', (req, res) => {
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
});

// 引入HR模块路由
const hrRoutes = require('./routes/hr');
const roleRoutes = require('./routes/roles');

// 注册HR模块路由
app.use('/api/hr', hrRoutes);

// 注册角色管理路由
app.use('/api/roles', roleRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('数据库初始化完成');
});