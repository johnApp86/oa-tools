@echo off
chcp 65001 >nul
echo ========================================
echo        安装项目依赖
echo ========================================
echo.

echo 正在安装根目录依赖...
npm install
if %errorlevel% neq 0 (
    echo ❌ 根目录依赖安装失败
    pause
    exit /b 1
)

echo.
echo 正在安装服务器依赖...
cd server
npm install
if %errorlevel% neq 0 (
    echo ❌ 服务器依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo 正在安装客户端依赖...
cd client
npm install
if %errorlevel% neq 0 (
    echo ❌ 客户端依赖安装失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo        依赖安装完成
echo ========================================
echo.
echo 下一步:
echo 1. 运行 bat\init-db.bat 初始化数据库
echo 2. 运行 bat\start.bat 启动系统
echo.
pause
