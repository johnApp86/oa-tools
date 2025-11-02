const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取考勤记录列表
exports.getAttendanceRecords = (req, res) => {
  try {
    const { page = 1, limit = 10, user_id = '', date = '', start_date = '', end_date = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT ar.*, u.real_name as user_name, u.username, u.real_name, p.name as position_name 
               FROM attendance_records ar 
               LEFT JOIN users u ON ar.user_id = u.id 
               LEFT JOIN positions p ON ar.position_id = p.id 
               WHERE 1=1`;
    const params = [];
    
    if (user_id) {
      sql += ` AND ar.user_id = ?`;
      params.push(user_id);
    }
    
    if (date) {
      sql += ` AND ar.date = ?`;
      params.push(date);
    }
    
    if (start_date && end_date) {
      sql += ` AND ar.date BETWEEN ? AND ?`;
      params.push(start_date, end_date);
    }

    sql += ` ORDER BY ar.date DESC, ar.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    db.all(sql, params, (err, records) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      // 获取总数
      let countSql = `SELECT COUNT(*) as total FROM attendance_records ar 
                      LEFT JOIN users u ON ar.user_id = u.id 
                      LEFT JOIN positions p ON ar.position_id = p.id 
                      WHERE 1=1`;
      const countParams = [];
      
      if (user_id) {
        countSql += ` AND ar.user_id = ?`;
        countParams.push(user_id);
      }
      
      if (date) {
        countSql += ` AND ar.date = ?`;
        countParams.push(date);
      }
      
      if (start_date && end_date) {
        countSql += ` AND ar.date BETWEEN ? AND ?`;
        countParams.push(start_date, end_date);
      }

      db.get(countSql, countParams, (err, countResult) => {
        if (err) {
          return res.status(500).json({ message: '查询失败' });
        }

        res.json({
          data: records,
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

// 创建考勤记录
exports.createAttendanceRecord = [
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('date').isISO8601().withMessage('日期格式不正确'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { user_id, position_id, date, checkin_time, checkout_time, checkin_location, checkout_location, checkin_notes, checkout_notes } = req.body;

    db.run(
      `INSERT INTO attendance_records (user_id, position_id, date, checkin_time, checkout_time, checkin_location, checkout_location, checkin_notes, checkout_notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [user_id, position_id, date, checkin_time, checkout_time, checkin_location, checkout_location, checkin_notes, checkout_notes],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '创建失败' });
        }
        res.json({ message: '创建成功', id: this.lastID });
      }
    );
  }
];

// 更新考勤记录
exports.updateAttendanceRecord = [
  body('date').isISO8601().withMessage('日期格式不正确'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { checkin_time, checkout_time, checkin_location, checkout_location, checkin_notes, checkout_notes } = req.body;

    db.run(
      `UPDATE attendance_records 
       SET checkin_time = ?, checkout_time = ?, checkin_location = ?, checkout_location = ?, 
           checkin_notes = ?, checkout_notes = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [checkin_time, checkout_time, checkin_location, checkout_location, checkin_notes, checkout_notes, id],
      function(err) {
        if (err) {
          return res.status(500).json({ message: '更新失败' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ message: '记录不存在' });
        }
        res.json({ message: '更新成功' });
      }
    );
  }
];

// 删除考勤记录
exports.deleteAttendanceRecord = (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM attendance_records WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ message: '删除失败' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: '记录不存在' });
    }
    res.json({ message: '删除成功' });
  });
};

// 打卡（签到/签退）
exports.checkIn = [
  body('user_id').isInt().withMessage('用户ID必须是数字'),
  body('type').isIn(['checkin', 'checkout']).withMessage('打卡类型必须是checkin或checkout'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { user_id, position_id, type, location, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    // 先查询今天是否已有记录
    db.get('SELECT * FROM attendance_records WHERE user_id = ? AND date = ?', [user_id, today], (err, existing) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      if (existing) {
        // 更新已有记录
        if (type === 'checkin') {
          db.run(
            `UPDATE attendance_records 
             SET checkin_time = ?, checkin_location = ?, checkin_notes = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [now, location, notes, existing.id],
            function(err) {
              if (err) {
                return res.status(500).json({ message: '签到失败' });
              }
              res.json({ message: '签到成功', id: existing.id });
            }
          );
        } else {
          // 签退：验证签退时间不能早于签到时间
          if (existing.checkin_time && now < existing.checkin_time) {
            return res.status(400).json({ message: '签退时间不能早于签到时间，请检查时间设置' });
          }
          
          db.run(
            `UPDATE attendance_records 
             SET checkout_time = ?, checkout_location = ?, checkout_notes = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [now, location, notes, existing.id],
            function(err) {
              if (err) {
                return res.status(500).json({ message: '签退失败' });
              }
              res.json({ message: '签退成功', id: existing.id });
            }
          );
        }
      } else {
        // 创建新记录
        if (type === 'checkin') {
          db.run(
            `INSERT INTO attendance_records (user_id, position_id, date, checkin_time, checkin_location, checkin_notes, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [user_id, position_id, today, now, location, notes],
            function(err) {
              if (err) {
                return res.status(500).json({ message: '签到失败' });
              }
              res.json({ message: '签到成功', id: this.lastID });
            }
          );
        } else {
          // 签退但没有签到记录，提示需要先签到
          return res.status(400).json({ message: '请先完成签到后再进行签退' });
        }
      }
    });
  }
];
