const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../database/db-connection');

const router = express.Router();

// ==================== 招聘管理 ====================

// 获取招聘职位列表
router.get('/recruitment/positions', (req, res) => {
  const { page = 1, limit = 10, keyword = '', status = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT rp.*, p.name as position_name, o.name as org_name 
             FROM recruitment_positions rp 
             LEFT JOIN positions p ON rp.position_id = p.id 
             LEFT JOIN organizations o ON rp.org_id = o.id 
             WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (rp.title LIKE ? OR p.name LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (status) {
    sql += ` AND rp.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY rp.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, positions) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM recruitment_positions rp WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND (rp.title LIKE ? OR EXISTS(SELECT 1 FROM positions p WHERE p.id = rp.position_id AND p.name LIKE ?))`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      countSql += ` AND rp.status = ?`;
      countParams.push(status);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
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

// 创建招聘职位
router.post('/recruitment/positions', [
  body('title').notEmpty().withMessage('职位标题不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是数字'),
  body('org_id').isInt().withMessage('组织ID必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { title, position_id, org_id, description, requirements, salary_range, urgent_level = 1 } = req.body;

  db.run(
    `INSERT INTO recruitment_positions (title, position_id, org_id, description, requirements, salary_range, urgent_level, status, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [title, position_id, org_id, description, requirements, salary_range, urgent_level],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建失败' });
      }

      res.json({ message: '创建成功', id: this.lastID });
    }
  );
});

// 删除招聘职位
router.delete('/recruitment/positions/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM recruitment_positions WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '职位不存在' });
    }

    res.json({ message: '删除成功' });
  });
});

// 获取简历列表
router.get('/recruitment/resumes', (req, res) => {
  const { page = 1, limit = 10, keyword = '', position_id = '', status = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT r.*, rp.title as position_title 
             FROM resumes r 
             LEFT JOIN recruitment_positions rp ON r.position_id = rp.id 
             WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (r.name LIKE ? OR r.email LIKE ? OR r.phone LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  if (position_id) {
    sql += ` AND r.position_id = ?`;
    params.push(position_id);
  }
  
  if (status) {
    sql += ` AND r.status = ?`;
    params.push(status);
  }

  sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, resumes) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM resumes r WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND (r.name LIKE ? OR r.email LIKE ? OR r.phone LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (position_id) {
      countSql += ` AND r.position_id = ?`;
      countParams.push(position_id);
    }
    if (status) {
      countSql += ` AND r.status = ?`;
      countParams.push(status);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: resumes,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 提交简历
router.post('/recruitment/resumes', [
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('phone').notEmpty().withMessage('手机号不能为空'),
  body('position_id').isInt().withMessage('职位ID必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { name, email, phone, position_id, resume_file, experience, education, skills } = req.body;

  db.run(
    `INSERT INTO resumes (name, email, phone, position_id, resume_file, experience, education, skills, status, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [name, email, phone, position_id, resume_file, experience, education, skills],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '提交失败' });
      }

      res.json({ message: '提交成功', id: this.lastID });
    }
  );
});

// ==================== 入职离职管理 ====================

// 获取入职申请列表
router.get('/onboarding/applications', (req, res) => {
  const { page = 1, limit = 10, keyword = '', status = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT oa.*, u.real_name as user_name, p.name as position_name, o.name as org_name 
             FROM onboarding_applications oa 
             LEFT JOIN users u ON oa.user_id = u.id 
             LEFT JOIN positions p ON oa.position_id = p.id 
             LEFT JOIN organizations o ON oa.org_id = o.id 
             WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (u.real_name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (status) {
    sql += ` AND oa.status = ?`;
    params.push(status);
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
    if (keyword) {
      countSql += ` AND EXISTS(SELECT 1 FROM users u WHERE u.id = oa.user_id AND (u.real_name LIKE ? OR u.email LIKE ?))`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      countSql += ` AND oa.status = ?`;
      countParams.push(status);
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
});

// 创建入职申请
router.post('/onboarding/applications', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('position_id').isInt().withMessage('岗位ID必须是数字'),
  body('org_id').isInt().withMessage('组织ID必须是数字'),
  body('start_date').notEmpty().withMessage('入职日期不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { user_id, position_id, org_id, start_date, salary, contract_type, notes } = req.body;

  db.run(
    `INSERT INTO onboarding_applications (user_id, position_id, org_id, start_date, salary, contract_type, notes, status, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [user_id, position_id, org_id, start_date, salary, contract_type, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建失败' });
      }

      res.json({ message: '创建成功', id: this.lastID });
    }
  );
});

// 获取离职申请列表
router.get('/offboarding/applications', (req, res) => {
  const { page = 1, limit = 10, keyword = '', status = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT oa.*, u.real_name as user_name, p.name as position_name, o.name as org_name 
             FROM offboarding_applications oa 
             LEFT JOIN users u ON oa.user_id = u.id 
             LEFT JOIN positions p ON u.position_id = p.id 
             LEFT JOIN organizations o ON u.organization_id = o.id 
             WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (u.real_name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (status) {
    sql += ` AND oa.status = ?`;
    params.push(status);
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
    if (keyword) {
      countSql += ` AND EXISTS(SELECT 1 FROM users u WHERE u.id = oa.user_id AND (u.real_name LIKE ? OR u.email LIKE ?))`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      countSql += ` AND oa.status = ?`;
      countParams.push(status);
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
});

// 创建离职申请
router.post('/offboarding/applications', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('leave_date').notEmpty().withMessage('离职日期不能为空'),
  body('reason').notEmpty().withMessage('离职原因不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { user_id, leave_date, reason, handover_notes } = req.body;

  db.run(
    `INSERT INTO offboarding_applications (user_id, leave_date, reason, handover_notes, status, created_at) 
     VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [user_id, leave_date, reason, handover_notes],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建失败' });
      }

      res.json({ message: '创建成功', id: this.lastID });
    }
  );
});

// ==================== 考勤管理 ====================

// 获取考勤记录
router.get('/attendance/records', (req, res) => {
  const { page = 1, limit = 10, user_id = '', date_start = '', date_end = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT ar.*, u.real_name as user_name, p.name as position_name 
             FROM attendance_records ar 
             LEFT JOIN users u ON ar.user_id = u.id 
             LEFT JOIN positions p ON ar.position_id = p.id 
             WHERE 1=1`;
  const params = [];
  
  if (user_id) {
    sql += ` AND ar.user_id = ?`;
    params.push(user_id);
  }
  
  if (date_start) {
    sql += ` AND ar.date >= ?`;
    params.push(date_start);
  }
  
  if (date_end) {
    sql += ` AND ar.date <= ?`;
    params.push(date_end);
  }

  sql += ` ORDER BY ar.date DESC, ar.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, records) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM attendance_records ar WHERE 1=1`;
    const countParams = [];
    if (user_id) {
      countSql += ` AND ar.user_id = ?`;
      countParams.push(user_id);
    }
    if (date_start) {
      countSql += ` AND ar.date >= ?`;
      countParams.push(date_start);
    }
    if (date_end) {
      countSql += ` AND ar.date <= ?`;
      countParams.push(date_end);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: records,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 打卡记录
router.post('/attendance/checkin', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('type').isIn(['checkin', 'checkout']).withMessage('打卡类型必须是checkin或checkout')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { user_id, type, location, notes } = req.body;
  const today = new Date().toISOString().split('T')[0];

  // 检查今天是否已有记录
  db.get('SELECT * FROM attendance_records WHERE user_id = ? AND date = ?', [user_id, today], (err, existing) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    if (type === 'checkin') {
      if (existing && existing.checkin_time) {
        return res.status(400).json({ message: '今日已签到' });
      }
      
      if (existing) {
        // 更新签到时间
        db.run('UPDATE attendance_records SET checkin_time = ?, checkin_location = ?, checkin_notes = ? WHERE id = ?',
          [new Date().toISOString(), location, notes, existing.id], function(err) {
          if (err) {
            return res.status(500).json({ message: '签到失败' });
          }
          res.json({ message: '签到成功' });
        });
      } else {
        // 创建新记录
        db.run('INSERT INTO attendance_records (user_id, date, checkin_time, checkin_location, checkin_notes, created_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
          [user_id, today, new Date().toISOString(), location, notes], function(err) {
          if (err) {
            return res.status(500).json({ message: '签到失败' });
          }
          res.json({ message: '签到成功' });
        });
      }
    } else if (type === 'checkout') {
      if (!existing) {
        return res.status(400).json({ message: '请先签到' });
      }
      
      if (existing.checkout_time) {
        return res.status(400).json({ message: '今日已签退' });
      }
      
      // 更新签退时间
      db.run('UPDATE attendance_records SET checkout_time = ?, checkout_location = ?, checkout_notes = ? WHERE id = ?',
        [new Date().toISOString(), location, notes, existing.id], function(err) {
        if (err) {
          return res.status(500).json({ message: '签退失败' });
        }
        res.json({ message: '签退成功' });
      });
    }
  });
});

// ==================== 请假管理 ====================

// 获取请假申请列表
router.get('/leave/applications', (req, res) => {
  const { page = 1, limit = 10, keyword = '', status = '', type = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT la.*, u.real_name as user_name, p.name as position_name 
             FROM leave_applications la 
             LEFT JOIN users u ON la.user_id = u.id 
             LEFT JOIN positions p ON la.position_id = p.id 
             WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (u.real_name LIKE ? OR u.email LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  
  if (status) {
    sql += ` AND la.status = ?`;
    params.push(status);
  }
  
  if (type) {
    sql += ` AND la.type = ?`;
    params.push(type);
  }

  sql += ` ORDER BY la.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, applications) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM leave_applications la WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND EXISTS(SELECT 1 FROM users u WHERE u.id = la.user_id AND (u.real_name LIKE ? OR u.email LIKE ?))`;
      countParams.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (status) {
      countSql += ` AND la.status = ?`;
      countParams.push(status);
    }
    if (type) {
      countSql += ` AND la.type = ?`;
      countParams.push(type);
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
});

// 创建请假申请
router.post('/leave/applications', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('type').notEmpty().withMessage('请假类型不能为空'),
  body('start_date').notEmpty().withMessage('开始日期不能为空'),
  body('end_date').notEmpty().withMessage('结束日期不能为空'),
  body('reason').notEmpty().withMessage('请假原因不能为空')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { user_id, type, start_date, end_date, reason, emergency_contact } = req.body;

  db.run(
    `INSERT INTO leave_applications (user_id, type, start_date, end_date, reason, emergency_contact, status, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)`,
    [user_id, type, start_date, end_date, reason, emergency_contact],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建失败' });
      }

      res.json({ message: '创建成功', id: this.lastID });
    }
  );
});

// ==================== 薪酬福利管理 ====================

// 获取薪酬记录
router.get('/salary/records', (req, res) => {
  const { page = 1, limit = 10, user_id = '', year = '', month = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT sr.*, u.real_name as user_name, p.name as position_name 
             FROM salary_records sr 
             LEFT JOIN users u ON sr.user_id = u.id 
             LEFT JOIN positions p ON u.position_id = p.id 
             WHERE 1=1`;
  const params = [];
  
  if (user_id) {
    sql += ` AND sr.user_id = ?`;
    params.push(user_id);
  }
  
  if (year) {
    sql += ` AND sr.year = ?`;
    params.push(year);
  }
  
  if (month) {
    sql += ` AND sr.month = ?`;
    params.push(month);
  }

  sql += ` ORDER BY sr.year DESC, sr.month DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, records) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM salary_records sr WHERE 1=1`;
    const countParams = [];
    if (user_id) {
      countSql += ` AND sr.user_id = ?`;
      countParams.push(user_id);
    }
    if (year) {
      countSql += ` AND sr.year = ?`;
      countParams.push(year);
    }
    if (month) {
      countSql += ` AND sr.month = ?`;
      countParams.push(month);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: records,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 创建薪酬记录
router.post('/salary/records', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('year').isInt().withMessage('年份必须是数字'),
  body('month').isInt().withMessage('月份必须是数字'),
  body('base_salary').isNumeric().withMessage('基本工资必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { user_id, year, month, base_salary, bonus, allowance, deduction, notes } = req.body;

  db.run(
    `INSERT INTO salary_records (user_id, year, month, base_salary, bonus, allowance, deduction, notes, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [user_id, year, month, base_salary, bonus || 0, allowance || 0, deduction || 0, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建失败' });
      }

      res.json({ message: '创建成功', id: this.lastID });
    }
  );
});

// 删除薪酬记录
router.delete('/salary/records/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM salary_records WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }

    res.json({ message: '删除成功' });
  });
});

// ==================== 档案管理 ====================

// 获取员工档案列表
router.get('/employee/files', (req, res) => {
  const { page = 1, limit = 10, keyword = '', department = '' } = req.query;
  const offset = (page - 1) * limit;

  let sql = `SELECT ef.*, u.real_name as user_name, p.name as position_name, o.name as org_name 
             FROM employee_files ef 
             LEFT JOIN users u ON ef.user_id = u.id 
             LEFT JOIN positions p ON ef.position_id = p.id 
             LEFT JOIN organizations o ON ef.org_id = o.id 
             WHERE 1=1`;
  const params = [];
  
  if (keyword) {
    sql += ` AND (u.real_name LIKE ? OR u.email LIKE ? OR ef.employee_id LIKE ?)`;
    params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
  }
  
  if (department) {
    sql += ` AND ef.department = ?`;
    params.push(department);
  }

  sql += ` ORDER BY ef.created_at DESC LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), parseInt(offset));

  db.all(sql, params, (err, files) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    // 获取总数
    let countSql = `SELECT COUNT(*) as total FROM employee_files ef WHERE 1=1`;
    const countParams = [];
    if (keyword) {
      countSql += ` AND (EXISTS(SELECT 1 FROM users u WHERE u.id = ef.user_id AND (u.real_name LIKE ? OR u.email LIKE ?)) OR ef.employee_id LIKE ?)`;
      countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (department) {
      countSql += ` AND ef.department = ?`;
      countParams.push(department);
    }

    db.get(countSql, countParams, (err, countResult) => {
      if (err) {
        return res.status(500).json({ message: '查询总数失败' });
      }

      res.json({
        data: files,
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit)
      });
    });
  });
});

// 创建员工档案
router.post('/employee/files', [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('employee_id').notEmpty().withMessage('员工编号不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是数字'),
  body('org_id').isInt().withMessage('组织ID必须是数字')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }

  const { user_id, employee_id, position_id, org_id, department, personal_info, work_info, education_info, family_info } = req.body;

  db.run(
    `INSERT INTO employee_files (user_id, employee_id, position_id, org_id, department, personal_info, work_info, education_info, family_info, created_at) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
    [user_id, employee_id, position_id, org_id, department, personal_info, work_info, education_info, family_info],
    function(err) {
      if (err) {
        return res.status(500).json({ message: '创建失败' });
      }

      res.json({ message: '创建成功', id: this.lastID });
    }
  );
});

// 删除员工档案
router.delete('/employee/files/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM employee_files WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ message: '档案不存在' });
    }

    res.json({ message: '删除成功' });
  });
});

// ==================== 报表分析 ====================

// 获取考勤统计
router.get('/reports/attendance', (req, res) => {
  const { year = new Date().getFullYear(), month = new Date().getMonth() + 1, department = '' } = req.query;

  let sql = `
    SELECT 
      u.id as user_id,
      u.real_name as user_name,
      p.name as position_name,
      o.name as org_name,
      COUNT(CASE WHEN ar.checkin_time IS NOT NULL THEN 1 END) as work_days,
      COUNT(CASE WHEN ar.checkout_time IS NOT NULL THEN 1 END) as complete_days,
      COUNT(CASE WHEN ar.checkin_time IS NULL THEN 1 END) as absent_days,
      AVG(CASE 
        WHEN ar.checkin_time IS NOT NULL AND ar.checkout_time IS NOT NULL 
        THEN (julianday(ar.checkout_time) - julianday(ar.checkin_time)) * 24 
        ELSE NULL 
      END) as avg_work_hours
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN attendance_records ar ON u.id = ar.user_id 
      AND strftime('%Y', ar.date) = ? 
      AND strftime('%m', ar.date) = ?
    WHERE u.status = 1
  `;
  
  const params = [year.toString(), month.toString().padStart(2, '0')];
  
  if (department) {
    sql += ` AND o.name = ?`;
    params.push(department);
  }
  
  sql += ` GROUP BY u.id, u.real_name, p.name, o.name ORDER BY u.real_name`;

  db.all(sql, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    res.json({ data: stats });
  });
});

// 获取薪酬统计
router.get('/reports/salary', (req, res) => {
  const { year = new Date().getFullYear(), department = '' } = req.query;

  let sql = `
    SELECT 
      u.id as user_id,
      u.real_name as user_name,
      p.name as position_name,
      o.name as org_name,
      SUM(sr.base_salary) as total_base_salary,
      SUM(sr.bonus) as total_bonus,
      SUM(sr.allowance) as total_allowance,
      SUM(sr.deduction) as total_deduction,
      SUM(sr.base_salary + sr.bonus + sr.allowance - sr.deduction) as total_salary,
      COUNT(sr.id) as salary_months
    FROM users u
    LEFT JOIN positions p ON u.position_id = p.id
    LEFT JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN salary_records sr ON u.id = sr.user_id AND sr.year = ?
    WHERE u.status = 1
  `;
  
  const params = [year.toString()];
  
  if (department) {
    sql += ` AND o.name = ?`;
    params.push(department);
  }
  
  sql += ` GROUP BY u.id, u.real_name, p.name, o.name ORDER BY total_salary DESC`;

  db.all(sql, params, (err, stats) => {
    if (err) {
      return res.status(500).json({ message: '查询失败' });
    }

    res.json({ data: stats });
  });
});

module.exports = router;
