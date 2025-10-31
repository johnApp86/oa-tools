const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取招聘职位列表
exports.getPositions = (req, res) => {
  try {
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
      let countSql = `SELECT COUNT(*) as total FROM recruitment_positions rp 
                      LEFT JOIN positions p ON rp.position_id = p.id 
                      LEFT JOIN organizations o ON rp.org_id = o.id 
                      WHERE 1=1`;
      const countParams = [];
      
      if (keyword) {
        countSql += ` AND (rp.title LIKE ? OR p.name LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
      }
      
      if (status) {
        countSql += ` AND rp.status = ?`;
        countParams.push(status);
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
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建招聘职位
exports.createPosition = [
  body('title').notEmpty().withMessage('职位标题不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是整数'),
  body('org_id').isInt().withMessage('组织ID必须是整数'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { title, position_id, org_id, description, requirements, salary_range, urgent_level } = req.body;

    db.run(
      `INSERT INTO recruitment_positions (title, position_id, org_id, description, requirements, salary_range, urgent_level) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [title, position_id, org_id, description, requirements, salary_range, urgent_level || 1],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }
        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新招聘职位
exports.updatePosition = [
  body('title').notEmpty().withMessage('职位标题不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是整数'),
  body('org_id').isInt().withMessage('组织ID必须是整数'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { title, position_id, org_id, description, requirements, salary_range, urgent_level, status } = req.body;

    db.run(
      `UPDATE recruitment_positions 
       SET title = ?, position_id = ?, org_id = ?, description = ?, requirements = ?, 
           salary_range = ?, urgent_level = ?, status = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [title, position_id, org_id, description, requirements, salary_range, urgent_level, status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: '职位不存在' });
        }
        res.json({ message: '更新成功' });
      }
    );
  }
];

// 删除招聘职位
exports.deletePosition = (req, res) => {
  const { id } = req.params;

  db.run('UPDATE recruitment_positions SET status = 0 WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '职位不存在' });
    }
    res.json({ message: '删除成功' });
  });
};

// 获取简历列表
exports.getResumes = (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', position_id = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT r.*, p.name as position_name 
               FROM resumes r 
               LEFT JOIN positions p ON r.position_id = p.id 
               WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      sql += ` AND (r.name LIKE ? OR r.email LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`);
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
      let countSql = `SELECT COUNT(*) as total FROM resumes r 
                      LEFT JOIN positions p ON r.position_id = p.id 
                      WHERE 1=1`;
      const countParams = [];
      
      if (keyword) {
        countSql += ` AND (r.name LIKE ? OR r.email LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`);
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
          return res.status(500).json({ message: '查询失败' });
        }

        res.json({
          data: resumes,
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

// 创建简历
exports.createResume = [
  body('name').notEmpty().withMessage('姓名不能为空'),
  body('email').isEmail().withMessage('邮箱格式不正确'),
  body('phone').notEmpty().withMessage('手机号不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是整数'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { name, email, phone, position_id, resume_file, experience, education, skills } = req.body;

    db.run(
      `INSERT INTO resumes (name, email, phone, position_id, resume_file, experience, education, skills) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, email, phone, position_id, resume_file, experience, education, skills],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }
        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新简历状态
exports.updateResumeStatus = [
  body('status').isInt().withMessage('状态必须是整数'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { status } = req.body;

    db.run(
      'UPDATE resumes SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: '简历不存在' });
        }
        res.json({ message: '更新成功' });
      }
    );
  }
];