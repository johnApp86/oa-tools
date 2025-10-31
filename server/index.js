const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./core/database/db-connection');
const { initHRDatabase } = require('./core/database/hr-tables');
const { initFinanceDatabase } = require('./core/database/finance-tables');

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

// 初始化财务数据库
initFinanceDatabase();

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '服务器运行正常' });
});

// 模块化路由注册
const authRoutes = require('./modules/auth/routes');
const systemRoutes = require('./modules/system/routes');
const hrRoutes = require('./modules/hr/routes');
const financeRoutes = require('./modules/finance/routes');

// 注册模块路由
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/finance', financeRoutes);

// 兼容性路由 - 保持原有API路径
const userRoutes = require('./modules/system/routes/users');
const menuRoutes = require('./modules/system/routes/menus');
const roleRoutes = require('./modules/system/routes/roles');
const organizationRoutes = require('./modules/system/routes/organizations');
const positionRoutes = require('./modules/system/routes/positions');
const onboardingRoutes = require('./modules/hr/routes/onboarding');

app.use('/api/organizations', organizationRoutes);
app.use('/api/positions', positionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/menus', menuRoutes);
app.use('/api/roles', roleRoutes);

// HR模块兼容性路由 - 离职申请
app.use('/api/hr/offboarding', onboardingRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log('数据库初始化完成');
  console.log('模块化架构已启用');
  console.log('可用模块: system, hr, finance');
});
