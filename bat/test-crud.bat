@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion
cd /d "%~dp0.."
echo ========================================
echo        CRUD功能测试脚本
echo ========================================
echo.

echo 正在检查依赖...
if not exist "server\node_modules\axios" (
    echo ⚠️  缺少 axios 依赖，正在安装...
    cd server
    npm install axios
    cd ..
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
)

echo.
echo 正在运行 CRUD 测试...
echo    工作目录: %CD%
echo.
echo 提示: 如果服务器未运行，测试脚本将自动启动测试服务器（端口 3002）
echo.

node server\core\database\test-crud.js
set test_result=%errorlevel%

if %test_result% equ 0 (
    echo.
    echo ========================================
    echo        测试完成
    echo ========================================
    echo.
) else (
    echo.
    echo ========================================
    echo        测试完成（有错误）
    echo ========================================
    echo.
    echo 请检查上面的错误信息
    echo.
)

pause
exit /b %test_result%

