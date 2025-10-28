@echo off
echo ========================================
echo    OA管理系统快速启动
echo ========================================
echo.

echo 正在启动后端服务...
start "后端服务" cmd /k "cd server && node index.js"

echo 等待后端服务启动...
timeout /t 3 /nobreak >nul

echo 正在启动前端服务...
start "前端服务" cmd /k "cd client && npm run dev"

echo 等待前端服务启动...
timeout /t 10 /nobreak >nul

echo.
echo 系统启动完成！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:3001
echo 默认账号: admin / admin123
echo.

echo 正在打开浏览器...
start http://localhost:3000

echo.
echo 如需停止服务，请关闭对应的命令行窗口
pause
