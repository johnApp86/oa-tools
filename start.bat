@echo off
chcp 65001 >nul
title OA管理系统
color 0A

echo.
echo  ██████╗  █████╗     ████████╗ ██████╗  ██████╗ ██╗     ███████╗
echo  ██╔══██╗██╔══██╗    ╚══██╔══╝██╔═══██╗██╔═══██╗██║     ██╔════╝
echo  ██████╔╝███████║       ██║   ██║   ██║██║   ██║██║     ███████╗
echo  ██╔═══╝ ██╔══██║       ██║   ██║   ██║██║   ██║██║     ╚════██║
echo  ██║     ██║  ██║       ██║   ╚██████╔╝╚██████╔╝███████╗███████║
echo  ╚═╝     ╚═╝  ╚═╝       ╚═╝    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
echo.
echo                    🚀 OA管理系统完整启动 🚀
echo.

REM 检查Node.js环境
echo [1/5] 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js
    echo 📥 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js环境正常

REM 停止现有进程
echo [2/5] 停止现有服务...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo ✅ 现有服务已停止

REM 检查端口占用
echo [3/5] 检查端口占用...
netstat -ano | findstr ":3000" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  警告: 端口3000已被占用，正在尝试释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000"') do taskkill /f /pid %%a >nul 2>&1
)

netstat -ano | findstr ":3001" >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  警告: 端口3001已被占用，正在尝试释放...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001"') do taskkill /f /pid %%a >nul 2>&1
)
echo ✅ 端口检查完成

REM 检查依赖
echo [4/5] 检查依赖...
if not exist "node_modules" (
    echo 📦 安装根目录依赖...
    npm install --silent
)
if not exist "server\node_modules" (
    echo 📦 安装服务端依赖...
    cd server && npm install --silent && cd ..
)
if not exist "client\node_modules" (
    echo 📦 安装客户端依赖...
    cd client && npm install --silent && cd ..
)
echo ✅ 依赖检查完成

REM 启动服务
echo [5/5] 启动服务...
echo.
echo 🚀 正在启动OA管理系统...
echo 📍 前端地址: http://localhost:3000
echo 📍 后端地址: http://localhost:3001 (API)
echo 👤 默认账号: admin / admin123
echo.

REM 使用concurrently同时启动前后端
start "OA管理系统" cmd /k "npm run dev"

REM 等待服务启动
echo ⏳ 等待服务启动...
timeout /t 8 /nobreak >nul

REM 检查服务状态
echo 🔍 检查服务状态...
timeout /t 2 /nobreak >nul

REM 打开浏览器
echo 🌐 正在打开浏览器...
start http://localhost:3000

echo.
echo ✅ 系统启动完成！
echo 📝 如需停止服务，请关闭命令行窗口
echo 🔄 如需重新启动，请运行此脚本
echo.
pause