@echo off
echo ========================================
echo        OA管理系统快速启动
echo ========================================
echo.

echo 正在检查系统状态...

echo 1. 检查数据库...
if not exist "server\database\oa.db" (
    echo ⚠️  数据库不存在，正在初始化...
    call bat\init-db.bat
    if %errorlevel% neq 0 (
        echo ❌ 数据库初始化失败
        pause
        exit /b 1
    )
) else (
    echo ✓ 数据库已存在
)

echo.
echo 2. 检查依赖...
if not exist "node_modules" (
    echo ⚠️  依赖未安装，正在安装...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

if not exist "server\node_modules" (
    echo ⚠️  服务器依赖未安装，正在安装...
    cd server
    npm install
    cd ..
    if %errorlevel% neq 0 (
        echo ❌ 服务器依赖安装失败
        pause
        exit /b 1
    )
)

echo ✓ 依赖检查完成

echo.
echo 3. 启动服务器...
echo.
echo ========================================
echo        系统启动中...
echo ========================================
echo.
echo 📍 前端地址: http://localhost:3000
echo 📍 后端地址: http://localhost:3001
echo 👤 默认账号: admin / admin123
echo.
echo 按 Ctrl+C 停止服务器
echo.

npm run dev
