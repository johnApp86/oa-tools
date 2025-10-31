const db = require('../../../core/database/db-connection');

// 获取考勤统计
exports.getAttendanceStats = (req, res) => {
  try {
    const { date_start, date_end, department = '', user_id = '' } = req.query;
    const startDate = date_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
    const endDate = date_end || new Date().toISOString().split('T')[0];

    let sql = `
      SELECT 
        u.id as user_id,
        u.real_name,
        p.name as position_name,
        o.name as org_name,
        COUNT(DISTINCT ar.date) as attendance_days,
        SUM(CASE WHEN ar.checkin_time IS NOT NULL AND ar.checkout_time IS NOT NULL THEN 1 ELSE 0 END) as full_day_count,
        SUM(CASE WHEN ar.checkin_time IS NULL OR ar.checkout_time IS NULL THEN 1 ELSE 0 END) as incomplete_day_count
      FROM attendance_records ar
      LEFT JOIN users u ON ar.user_id = u.id
      LEFT JOIN positions p ON ar.position_id = p.id
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE ar.date >= ? AND ar.date <= ?
    `;
    const params = [startDate, endDate];
    
    if (user_id) {
      sql += ` AND ar.user_id = ?`;
      params.push(user_id);
    }
    
    if (department) {
      sql += ` AND o.name = ?`;
      params.push(department);
    }

    sql += ` GROUP BY ar.user_id, u.real_name, p.name, o.name ORDER BY attendance_days DESC`;

    db.all(sql, params, (err, stats) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      const totalDays = (new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1;
      
      const summary = {
        period: { start: startDate, end: endDate },
        total_working_days: totalDays,
        total_employees: stats.length,
        total_attendance_days: stats.reduce((sum, item) => sum + item.attendance_days, 0),
        total_full_days: stats.reduce((sum, item) => sum + item.full_day_count, 0),
        total_incomplete_days: stats.reduce((sum, item) => sum + item.incomplete_day_count, 0),
        details: stats
      };

      res.json(summary);
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取薪酬统计
exports.getSalaryStats = (req, res) => {
  try {
    const { year, month, department = '', user_id = '' } = req.query;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;

    let sql = `
      SELECT 
        sr.*,
        u.real_name,
        p.name as position_name,
        o.name as org_name,
        (sr.base_salary + sr.bonus + sr.allowance - sr.deduction) as total_salary
      FROM salary_records sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE sr.year = ? AND sr.month = ?
    `;
    const params = [currentYear, currentMonth];
    
    if (user_id) {
      sql += ` AND sr.user_id = ?`;
      params.push(user_id);
    }
    
    if (department) {
      sql += ` AND o.name = ?`;
      params.push(department);
    }

    sql += ` ORDER BY total_salary DESC`;

    db.all(sql, params, (err, records) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      const summary = {
        period: { year: currentYear, month: currentMonth },
        total_employees: records.length,
        total_base_salary: records.reduce((sum, item) => sum + (item.base_salary || 0), 0),
        total_bonus: records.reduce((sum, item) => sum + (item.bonus || 0), 0),
        total_allowance: records.reduce((sum, item) => sum + (item.allowance || 0), 0),
        total_deduction: records.reduce((sum, item) => sum + (item.deduction || 0), 0),
        total_salary: records.reduce((sum, item) => sum + (item.total_salary || 0), 0),
        avg_salary: records.length > 0 ? (records.reduce((sum, item) => sum + (item.total_salary || 0), 0) / records.length).toFixed(2) : 0,
        details: records
      };

      res.json(summary);
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
