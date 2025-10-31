const db = require('../../../core/database/db-connection');

// 获取资产负债表
exports.getBalanceSheet = (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    // 资产
    const assetsSql = `
      SELECT 
        gla.code,
        gla.name,
        COALESCE(SUM(CASE WHEN gle.type = 'debit' THEN gle.amount ELSE -gle.amount END), 0) as balance
      FROM general_ledger_accounts gla
      LEFT JOIN general_ledger_entries gle ON gla.id = gle.account_id
      LEFT JOIN general_ledger_vouchers glv ON gle.voucher_id = glv.id AND glv.date <= ?
      WHERE gla.type IN ('asset', 'equity') AND gla.status = 1
      GROUP BY gla.id, gla.code, gla.name
      ORDER BY gla.code
    `;

    // 负债
    const liabilitiesSql = `
      SELECT 
        gla.code,
        gla.name,
        COALESCE(SUM(CASE WHEN gle.type = 'debit' THEN -gle.amount ELSE gle.amount END), 0) as balance
      FROM general_ledger_accounts gla
      LEFT JOIN general_ledger_entries gle ON gla.id = gle.account_id
      LEFT JOIN general_ledger_vouchers glv ON gle.voucher_id = glv.id AND glv.date <= ?
      WHERE gla.type = 'liability' AND gla.status = 1
      GROUP BY gla.id, gla.code, gla.name
      ORDER BY gla.code
    `;

    db.all(assetsSql, [date], (err, assets) => {
      if (err) {
        return res.status(500).json({ message: '查询资产失败' });
      }

      db.all(liabilitiesSql, [date], (err, liabilities) => {
        if (err) {
          return res.status(500).json({ message: '查询负债失败' });
        }

        const totalAssets = assets.reduce((sum, item) => sum + item.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, item) => sum + item.balance, 0);

        res.json({
          date: date,
          assets: assets,
          liabilities: liabilities,
          total_assets: totalAssets,
          total_liabilities: totalLiabilities,
          equity: totalAssets - totalLiabilities
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取利润表
exports.getIncomeStatement = (req, res) => {
  try {
    const { date_start, date_end } = req.query;
    const startDate = date_start || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = date_end || new Date().toISOString().split('T')[0];

    // 收入
    const revenueSql = `
      SELECT 
        gla.code,
        gla.name,
        COALESCE(SUM(CASE WHEN gle.type = 'credit' THEN gle.amount ELSE -gle.amount END), 0) as amount
      FROM general_ledger_accounts gla
      LEFT JOIN general_ledger_entries gle ON gla.id = gle.account_id
      LEFT JOIN general_ledger_vouchers glv ON gle.voucher_id = glv.id 
        AND glv.date >= ? AND glv.date <= ?
      WHERE gla.type = 'revenue' AND gla.status = 1
      GROUP BY gla.id, gla.code, gla.name
      ORDER BY gla.code
    `;

    // 支出
    const expenseSql = `
      SELECT 
        gla.code,
        gla.name,
        COALESCE(SUM(CASE WHEN gle.type = 'debit' THEN gle.amount ELSE -gle.amount END), 0) as amount
      FROM general_ledger_accounts gla
      LEFT JOIN general_ledger_entries gle ON gla.id = gle.account_id
      LEFT JOIN general_ledger_vouchers glv ON gle.voucher_id = glv.id 
        AND glv.date >= ? AND glv.date <= ?
      WHERE gla.type = 'expense' AND gla.status = 1
      GROUP BY gla.id, gla.code, gla.name
      ORDER BY gla.code
    `;

    db.all(revenueSql, [startDate, endDate], (err, revenues) => {
      if (err) {
        return res.status(500).json({ message: '查询收入失败' });
      }

      db.all(expenseSql, [startDate, endDate], (err, expenses) => {
        if (err) {
          return res.status(500).json({ message: '查询支出失败' });
        }

        const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
        const totalExpense = expenses.reduce((sum, item) => sum + item.amount, 0);

        res.json({
          period: { start: startDate, end: endDate },
          revenues: revenues,
          expenses: expenses,
          total_revenue: totalRevenue,
          total_expense: totalExpense,
          net_profit: totalRevenue - totalExpense
        });
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取现金流量表
exports.getCashFlowStatement = (req, res) => {
  try {
    const { date_start, date_end } = req.query;
    const startDate = date_start || new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    const endDate = date_end || new Date().toISOString().split('T')[0];

    const sql = `
      SELECT 
        type,
        category,
        SUM(amount) as total_amount
      FROM cash_transactions
      WHERE transaction_date >= ? AND transaction_date <= ?
      GROUP BY type, category
      ORDER BY type, category
    `;

    db.all(sql, [startDate, endDate], (err, transactions) => {
      if (err) {
        return res.status(500).json({ message: '查询失败' });
      }

      const cashInflow = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, item) => sum + item.total_amount, 0);
      
      const cashOutflow = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, item) => sum + item.total_amount, 0);

      res.json({
        period: { start: startDate, end: endDate },
        transactions: transactions,
        cash_inflow: cashInflow,
        cash_outflow: cashOutflow,
        net_cash_flow: cashInflow - cashOutflow
      });
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};

// 获取财务指标
exports.getFinancialRatios = (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    // 这里需要根据实际业务逻辑计算财务指标
    // 简化示例：返回基本的财务指标结构
    res.json({
      date: date,
      liquidity_ratio: 0, // 流动性比率
      profitability_ratio: 0, // 盈利能力比率
      debt_ratio: 0, // 负债比率
      asset_turnover: 0, // 资产周转率
      note: '财务指标计算需要完整的财务数据支持'
    });
  } catch (error) {
    res.status(500).json({ message: '服务器错误' });
  }
};
