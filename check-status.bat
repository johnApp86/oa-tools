@echo off
echo ========================================
echo    OA管理系统状态检查
echo ========================================
echo.

echo 检查Node.js环境...
node --version
if errorlevel 1 (
    echo 错误: 未找到Node.js
    goto :end
)

echo.
echo 检查端口占用情况...
echo 前端端口 3000:
netstat -an | findstr :3000
echo.
echo 后端端口 3001:
netstat -an | findstr :3001

echo.
echo 检查进程...
echo Node.js进程:
tasklist | findstr node.exe

echo.
echo 测试后端API...
curl -s http://localhost:3001/api/health 2>nul
if errorlevel 1 (
    echo 后端服务未响应
) else (
    echo 后端服务正常
)

echo.
echo 测试前端服务...
curl -s http://localhost:3000 2>nul
if errorlevel 1 (
    echo 前端服务未响应
) else (
    echo 前端服务正常
)

:end
echo.
echo 状态检查完成
pause
