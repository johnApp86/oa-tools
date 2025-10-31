const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取请假申请列表
exports.getLeaveApplications = (req, res) => {
  try {
    const { page = 1, limit = 10, user_id = '', type = '', status = '', start_date = '', end_date = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT la.*, u.real_name, p.name as position_name 
               FROM leave_applications la 
               LEFT JOIN users u ON la.user_id = u.id 
               LEFT JOIN positions p ON la.position_id = p.id 
               WHERE 1=1`;
    const params = [];
    
    if (user_id) {
      sql += ` AND la.user_id = ?`;
      params.push(user_id);
    }
    
    if (type) {
      sql += ` AND la.type = ?`;
      params.push(type);
    }
    
    if (status) {
      sql += ` AND la.status = ?`;
      params.push(status);
    }
    
    if (start_date && end_date) {
      sql += ` AND la.start_date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    sql += ` ORDER BY la.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, applications) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM leave_applications la 
                      LEFT JOIN users u ON la.user_id = u.id 
                      LEFT JOIN positions p ON la.position_id = p.id 
                      WHERE 1=1`;
      const countParams = [];
      
      if (user_id) {
        countSql += ` AND la.user_id = ?`;
        countParams.push(user_id);
      }
      
      if (type) {
        countSql += ` AND la.type = ?`;
        countParams.push(type);
      }
      
      if (status) {
        countSql += ` AND la.status = ?`;
        countParams.push(status);
      }
      
      if (start_date && end_date) {
        countSql += ` AND la.start_date BETWEEN ? AND ?`;
        countParams.push(start_date, end_date);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询失败' });
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

// 创建请假申请
exports.createLeaveApplication = [
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('type').notEmpty().withMessage('请假类型不能为空'),
  body('start_date').isISO8601().withMessage('开始日期格式不正确'),
  body('end_date').isISO8601().withMessage('结束日期格式不正确'),
  body('reason').notEmpty().withMessage('请假原因不能为空'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { user_id, position_id, type, start_date, end_date, reason, emergency_contact } = req.body;

    db.run(
      `INSERT INTO leave_applications (user_id, position_id, type, start_date, end_date, reason, emergency_contact) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, position_id, type, start_date, end_date, reason, emergency_contact],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }
        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新请假申请状态
exports.updateLeaveApplicationStatus = [
  body('status').isInt().withMessage('状态必须是整数'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { status } = req.body;

    db.run(
      'UPDATE leave_applications SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: '申请不存在' });
        }
        res.json({ message: '更新成功' });
      }
    );
  }
];

// 删除请假申请
exports.deleteLeaveApplication = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM leave_applications WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '申请不存在' });
    }
    res.json({ message: '删除成功' });
  });
};
