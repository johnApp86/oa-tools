@echo off
echo ========================================
echo          数据库清理脚本
echo ========================================
echo.

echo 正在停止服务器进程...
taskkill /f /im node.exe 2>nul || echo 没有运行的Node.js进程

echo.
echo 正在删除数据库文件...
if exist "server\database\oa.db" (
    del "server\database\oa.db"
    echo 数据库文件已删除
) else (
    echo 数据库文件不存在
)

echo.
echo 正在清理临时文件...
if exist "client\dist" (
    rmdir /s /q "client\dist"
    echo 前端构建文件已清理
)

if exist "client\node_modules\.vite" (
    rmdir /s /q "client\node_modules\.vite"
    echo Vite缓存已清理
)

echo.
echo ========================================
echo          清理完成
echo ========================================
echo.
echo 请运行以下命令重新初始化：
echo 1. npm run install-all
echo 2. reset-database.bat
echo 3. npm run dev
echo.
pause
