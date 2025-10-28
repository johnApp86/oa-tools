@echo off
echo ========================================
echo    OA管理系统启动脚本
echo ========================================
echo.

echo 正在检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到Node.js，请先安装Node.js
    pause
    exit /b 1
)

echo Node.js环境检查通过
echo.

echo 正在安装依赖...
call npm run install-all
if errorlevel 1 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 依赖安装完成
echo.

echo 正在启动OA管理系统...
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo 默认账号: admin / admin123
echo.

start "OA管理系统" cmd /k "npm run dev"

echo 系统启动中，请稍候...
echo 浏览器将自动打开系统页面
timeout /t 3 /nobreak >nul

start http://localhost:3000

echo.
echo 系统已启动完成！
echo 如需停止服务，请关闭命令行窗口
pause
