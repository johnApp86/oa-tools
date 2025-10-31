const db = require('../../../core/database/db-connection');
const { body, validationResult } = require('express-validator');

// 获取员工档案列表
exports.getEmployeeFiles = (req, res) => {
  try {
    const { page = 1, limit = 10, keyword = '', employee_id = '', department = '' } = req.query;
    const offset = (page - 1) * limit;

    let sql = `SELECT ef.*, u.real_name, u.email, u.phone, p.name as position_name, o.name as org_name 
               FROM employee_files ef 
               LEFT JOIN users u ON ef.user_id = u.id 
               LEFT JOIN positions p ON ef.position_id = p.id 
               LEFT JOIN organizations o ON ef.org_id = o.id 
               WHERE 1=1`;
    const params = [];
    
    if (keyword) {
      sql += ` AND (ef.employee_id LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)`;
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    
    if (employee_id) {
      sql += ` AND ef.employee_id = ?`;
      params.push(employee_id);
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
      let countSql = `SELECT COUNT(*) as total FROM employee_files ef 
                      LEFT JOIN users u ON ef.user_id = u.id 
                      WHERE 1=1`;
      const countParams = [];
      
      if (keyword) {
        countSql += ` AND (ef.employee_id LIKE ? OR u.real_name LIKE ? OR u.email LIKE ?)`;
        countParams.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
      }
      
      if (employee_id) {
        countSql += ` AND ef.employee_id = ?`;
        countParams.push(employee_id);
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
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 创建员工档案
exports.createEmployeeFile = [
  body('user_id').isInt().withMessage('用户ID必须是整数'),
  body('employee_id').notEmpty().withMessage('员工编号不能为空'),
  body('position_id').isInt().withMessage('岗位ID必须是整数'),
  body('org_id').isInt().withMessage('组织ID必须是整数'),
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { user_id, employee_id, position_id, org_id, department, personal_info, work_info, education_info, family_info } = req.body;

    // 检查员工编号是否已存在
    db.get('SELECT id FROM employee_files WHERE employee_id = ?', [employee_id], (err, existing) => {
      if (err) {
        return res.status(500).json({ message: '数据库错误' });
      }

      if (existing) {
        return res.status(400).json({ message: '员工编号已存在' });
      }

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
  }
];

// 删除员工档案
exports.deleteEmployeeFile = (req, res) => {
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
};
