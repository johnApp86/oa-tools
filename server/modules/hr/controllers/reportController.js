const db = require('../../../core/database/db-connection');

// 计算工作天数（排除周末）
function calculateWorkDays(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // 0 = 周日, 6 = 周六
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  
  return count;
}

// 获取考勤统计
exports.getAttendanceStats = (req, res) => {
  try {
    // 支持 year/month 参数（前端传的）和 date_start/date_end 参数
    const { year, month, date_start, date_end, department = '', user_id = '' } = req.query;
    
    let startDate, endDate;
    if (year && month) {
      // 如果传了 year 和 month，计算该月的开始和结束日期
      const yearNum = parseInt(year);
      const monthNum = parseInt(month);
      startDate = new Date(yearNum, monthNum - 1, 1).toISOString().split('T')[0];
      // 计算该月最后一天
      const lastDay = new Date(yearNum, monthNum, 0).getDate();
      endDate = new Date(yearNum, monthNum - 1, lastDay).toISOString().split('T')[0];
    } else {
      // 否则使用 date_start/date_end 或默认值
      startDate = date_start || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
      endDate = date_end || new Date().toISOString().split('T')[0];
    }

    // 计算该期间的工作天数（排除周末，可以根据实际需求调整）
    const totalWorkDays = calculateWorkDays(startDate, endDate);

    let sql = `
      SELECT 
        u.id as user_id,
        u.real_name as user_name,
        u.username,
        p.name as position_name,
        o.name as org_name,
        ? as work_days,
        COUNT(DISTINCT ar.date) as attendance_days,
        SUM(CASE WHEN ar.checkin_time IS NOT NULL AND ar.checkout_time IS NOT NULL THEN 1 ELSE 0 END) as complete_days,
        SUM(CASE WHEN ar.checkin_time IS NULL AND ar.checkout_time IS NULL THEN 1 ELSE 0 END) as absent_days,
        AVG(CASE 
          WHEN ar.checkin_time IS NOT NULL AND ar.checkout_time IS NOT NULL 
          THEN (
            (julianday(ar.checkout_time) - julianday(ar.checkin_time)) * 24
          )
          ELSE NULL
        END) as avg_work_hours
      FROM attendance_records ar
      LEFT JOIN users u ON ar.user_id = u.id
      LEFT JOIN positions p ON ar.position_id = p.id
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE ar.date >= ? AND ar.date <= ?
    `;
    const params = [totalWorkDays, startDate, endDate];
    
    if (user_id) {
      sql += ` AND ar.user_id = ?`;
      params.push(user_id);
    }
    
    if (department) {
      sql += ` AND o.name = ?`;
      params.push(department);
    }

    sql += ` GROUP BY u.id, u.real_name, u.username, p.name, o.name ORDER BY attendance_days DESC`;

    db.all(sql, params, (err, stats) => {
      if (err) {
        console.error('查询考勤统计失败:', err);
        return res.status(500).json({ message: '查询失败', error: err.message });
      }

      // 处理数据，确保所有字段都有值
      const processedStats = (stats || []).map(item => ({
        user_id: item.user_id,
        user_name: item.user_name || item.username || '-',
        username: item.username,
        position_name: item.position_name || '-',
        org_name: item.org_name || '-',
        work_days: item.work_days || totalWorkDays,
        complete_days: item.complete_days || 0,
        absent_days: item.absent_days || Math.max(0, totalWorkDays - (item.attendance_days || 0)),
        avg_work_hours: item.avg_work_hours ? parseFloat(item.avg_work_hours.toFixed(2)) : 0
      }));
      
      res.json({
        data: processedStats,
        total: processedStats.length,
        summary: {
          period: { start: startDate, end: endDate },
          total_working_days: totalWorkDays,
          total_employees: processedStats.length
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取薪酬统计
exports.getSalaryStats = (req, res) => {
  try {
    const { year, department = '', user_id = '' } = req.query;
    const currentYear = year || new Date().getFullYear();

    let sql = `
      SELECT 
        sr.user_id,
        u.real_name as user_name,
        u.username,
        p.name as position_name,
        o.name as org_name,
        SUM(sr.base_salary) as total_base_salary,
        SUM(sr.bonus) as total_bonus,
        SUM(sr.allowance) as total_allowance,
        SUM(sr.deduction) as total_deduction,
        SUM(sr.base_salary + sr.bonus + sr.allowance - sr.deduction) as total_salary,
        COUNT(DISTINCT sr.month) as salary_months
      FROM salary_records sr
      LEFT JOIN users u ON sr.user_id = u.id
      LEFT JOIN positions p ON u.position_id = p.id
      LEFT JOIN organizations o ON u.organization_id = o.id
      WHERE sr.year = ?
    `;
    const params = [currentYear];
    
    if (user_id) {
      sql += ` AND sr.user_id = ?`;
      params.push(user_id);
    }
    
    if (department) {
      sql += ` AND o.name = ?`;
      params.push(department);
    }

    sql += ` GROUP BY sr.user_id, u.real_name, u.username, p.name, o.name ORDER BY total_salary DESC`;

    db.all(sql, params, (err, records) => {
      if (err) {
        console.error('查询薪酬统计失败:', err);
        return res.status(500).json({ message: '查询失败', error: err.message });
      }

      // 处理数据，确保所有字段都有值
      const processedRecords = (records || []).map(item => ({
        user_id: item.user_id,
        user_name: item.user_name || item.username || '-',
        username: item.username,
        position_name: item.position_name || '-',
        org_name: item.org_name || '-',
        total_base_salary: item.total_base_salary || 0,
        total_bonus: item.total_bonus || 0,
        total_allowance: item.total_allowance || 0,
        total_deduction: item.total_deduction || 0,
        total_salary: item.total_salary || 0,
        salary_months: item.salary_months || 0
      }));

      res.json({
        data: processedRecords,
        total: processedRecords.length,
        summary: {
          period: { year: currentYear },
          total_employees: processedRecords.length,
          total_salary: processedRecords.reduce((sum, item) => sum + (item.total_salary || 0), 0),
          avg_salary: processedRecords.length > 0 
            ? (processedRecords.reduce((sum, item) => sum + (item.total_salary || 0), 0) / processedRecords.length).toFixed(2) 
            : 0
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
