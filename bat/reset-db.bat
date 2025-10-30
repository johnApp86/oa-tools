@echo off
echo ========================================
echo        数据库重置脚本
echo ========================================
echo.

echo 正在检查数据库脚本...
if not exist "server\database\reset-db.js" (
    echo ❌ 数据库重置脚本不存在
    pause
    exit /b 1
)

echo 正在检查依赖...
if not exist "node_modules" (
    echo ⚠️  依赖未安装，正在安装...
    npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo 正在检查服务器依赖...
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

echo.
echo ⚠️  警告: 此操作将删除现有数据库并重新创建
echo 所有数据将丢失，请确认是否继续？
set /p confirm=输入 y 继续，其他任意键取消: 
if /i not "%confirm%"=="y" (
    echo 操作已取消
    pause
    exit /b 0
)

echo.
echo 正在重置数据库...
node server\database\reset-db.js
if %errorlevel% neq 0 (
    echo ❌ 数据库重置失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo        数据库重置完成
echo ========================================
echo.
echo 🔑 默认账号信息:
echo   用户名: admin
echo   密码: admin123
echo.
echo 🚀 启动命令:
echo   npm run dev        # 开发模式
echo   npm start          # 生产模式
echo.
pause
