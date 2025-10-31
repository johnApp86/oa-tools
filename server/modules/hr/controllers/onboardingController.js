const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取入职申请列表
exports.getOnboardingApplications = (req, res) => {
  try {
    const { page = 1, limit = 10, user_id = '', status = '', start_date = '', end_date = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT oa.*, u.real_name as user_name, u.username, u.real_name, p.name as position_name, o.name as org_name 
               FROM onboarding_applications oa 
               LEFT JOIN users u ON oa.user_id = u.id 
               LEFT JOIN positions p ON oa.position_id = p.id 
               LEFT JOIN organizations o ON oa.org_id = o.id 
               WHERE 1=1`;
    const params = [];
    
    if (user_id) {
      sql += ` AND oa.user_id = ?`;
      params.push(user_id);
    }
    
    if (status) {
      sql += ` AND oa.status = ?`;
      params.push(status);
    }
    
    if (start_date && end_date) {
      sql += ` AND oa.start_date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    sql += ` ORDER BY oa.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, applications) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM onboarding_applications oa WHERE 1=1`;
      const countParams = [];
      
      if (user_id) {
        countSql += ` AND oa.user_id = ?`;
        countParams.push(user_id);
      }
      
      if (status) {
        countSql += ` AND oa.status = ?`;
        countParams.push(status);
      }
      
      if (start_date && end_date) {
        countSql += ` AND oa.start_date BETWEEN ? AND ?`;
        countParams.push(start_date, end_date);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: applications,
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建入职申请
exports.createOnboardingApplication = [
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('position_id').isInt().withMessage('岗位ID必须是整数'),
  body('org_id').isInt().withMessage('组织ID必须是整数'),
  body('start_date').notEmpty().withMessage('入职日期不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { user_id, position_id, org_id, start_date, salary, contract_type, notes, status = 1 } = req.body;

    db.run(
      `INSERT INTO onboarding_applications (user_id, position_id, org_id, start_date, salary, contract_type, notes, status, created_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [user_id, position_id, org_id, start_date, salary, contract_type, notes, status],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 获取离职申请列表
exports.getOffboardingApplications = (req, res) => {
  try {
    const { page = 1, limit = 10, user_id = '', status = '', leave_date_start = '', leave_date_end = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT oa.*, u.real_name as user_name, u.username, u.real_name, p.name as position_name,
                      o.name as org_name
               FROM offboarding_applications oa 
               LEFT JOIN users u ON oa.user_id = u.id 
               LEFT JOIN positions p ON u.position_id = p.id 
               LEFT JOIN organizations o ON u.organization_id = o.id 
               WHERE 1=1`;
    const params = [];
    
    if (user_id) {
      sql += ` AND oa.user_id = ?`;
      params.push(user_id);
    }
    
    if (status) {
      sql += ` AND oa.status = ?`;
      params.push(status);
    }
    
    if (leave_date_start && leave_date_end) {
      sql += ` AND oa.leave_date BETWEEN ? AND ?`;
      params.push(leave_date_start, leave_date_end);
    }

    sql += ` ORDER BY oa.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, applications) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM offboarding_applications oa WHERE 1=1`;
      const countParams = [];
      
      if (user_id) {
        countSql += ` AND oa.user_id = ?`;
        countParams.push(user_id);
      }
      
      if (status) {
        countSql += ` AND oa.status = ?`;
        countParams.push(status);
      }
      
      if (leave_date_start && leave_date_end) {
        countSql += ` AND oa.leave_date BETWEEN ? AND ?`;
        countParams.push(leave_date_start, leave_date_end);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询总数失败' });
        }

        res.json({
          data: applications,
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit)
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建离职申请
exports.createOffboardingApplication = [
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('leave_date').notEmpty().withMessage('离职日期不能为空'),
  body('reason').notEmpty().withMessage('离职原因不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { user_id, leave_date, reason, handover_notes, status = 1 } = req.body;

    db.run(
      `INSERT INTO offboarding_applications (user_id, leave_date, reason, handover_notes, status, created_at) 
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [user_id, leave_date, reason, handover_notes, status],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }

        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];
