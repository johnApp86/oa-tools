@echo off
chcp 65001 >nul
title OA管理系统 - 简单启动
color 0B

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    OA管理系统简单启动                        ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM 检查Node.js
echo 🔍 检查Node.js环境...
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ 错误: 未找到Node.js
    echo 📥 请先安装Node.js: https://nodejs.org/
    pause
    exit /b 1
)
echo ✅ Node.js环境正常

REM 停止现有进程
echo 🛑 停止现有服务...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM 启动服务
echo 🚀 启动OA管理系统...
echo.
echo 📍 前端地址: http://localhost:3000
echo 📍 后端地址: http://localhost:3001 (API)
echo 👤 默认账号: admin / admin123
echo.

REM 使用PowerShell启动
powershell -Command "Start-Process cmd -ArgumentList '/k', 'npm run dev' -WindowStyle Normal"

echo ⏳ 等待服务启动...
timeout /t 8 /nobreak >nul

echo 🌐 打开浏览器...
start http://localhost:3000

echo.
echo ✅ 系统启动完成！
echo 📝 关闭此窗口不会停止服务
echo 🛑 如需停止服务，请关闭服务窗口
echo.
pause