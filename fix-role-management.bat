@echo off
echo ========================================
echo        修复角色管理问题
echo ========================================
echo.

echo 正在停止服务器进程...
taskkill /f /im node.exe 2>nul || echo 没有运行的Node.js进程

echo.
echo 正在检查角色管理相关文件...

echo 1. 检查角色管理页面...
if exist "client\src\views\system\Role.vue" (
    echo ✓ 角色管理页面存在
) else (
    echo ✗ 角色管理页面不存在
    exit /b 1
)

echo 2. 检查角色API文件...
if exist "client\src\api\role.js" (
    echo ✓ 角色API文件存在
) else (
    echo ✗ 角色API文件不存在
    exit /b 1
)

echo 3. 检查角色后端路由...
if exist "server\routes\roles.js" (
    echo ✓ 角色后端路由存在
) else (
    echo ✗ 角色后端路由不存在
    exit /b 1
)

echo 4. 检查服务器路由注册...
findstr /C:"app.use('/api/roles'" server\index.js >nul
if %errorlevel%==0 (
    echo ✓ 服务器已注册角色路由
) else (
    echo ✗ 服务器未注册角色路由，正在修复...
    echo 请手动检查 server\index.js 文件
)

echo.
echo 正在检查数据库表结构...
cd server
node -e "
const db = require('./database/db');

// 检查角色表是否存在
db.get(\"SELECT name FROM sqlite_master WHERE type='table' AND name='roles'\", (err, row) => {
  if (err) {
    console.log('✗ 数据库连接失败');
    process.exit(1);
  }
  
  if (row) {
    console.log('✓ 角色表存在');
    
    // 检查是否有数据
    db.get('SELECT COUNT(*) as count FROM roles', (err, result) => {
      if (err) {
        console.log('✗ 查询角色数据失败');
        process.exit(1);
      }
      
      if (result.count > 0) {
        console.log('✓ 角色表有数据');
      } else {
        console.log('⚠ 角色表无数据，正在插入默认数据...');
        
        // 插入默认角色
        db.run(\`INSERT OR IGNORE INTO roles (id, name, code, description) VALUES 
          (1, '超级管理员', 'SUPER_ADMIN', '系统超级管理员，拥有所有权限'),
          (2, '管理员', 'ADMIN', '系统管理员'),
          (3, 'HR管理员', 'HR_ADMIN', 'HR模块管理员'),
          (4, '普通用户', 'USER', '普通用户')\`, (err) => {
          if (err) {
            console.log('✗ 插入默认角色失败:', err.message);
          } else {
            console.log('✓ 默认角色插入成功');
          }
          process.exit(0);
        });
      }
    });
  } else {
    console.log('✗ 角色表不存在，请运行 reset-db.js 重新初始化数据库');
    process.exit(1);
  }
});
"

cd ..

echo.
echo ========================================
echo        修复完成
echo ========================================
echo.
echo 请重新启动服务器：
echo npm run dev
echo.
pause
