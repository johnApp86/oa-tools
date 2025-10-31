@echo off
echo ========================================
echo          项目清理脚本
echo ========================================
echo.

echo 正在停止服务器进程...
taskkill /f /im node.exe 2>nul || echo 没有运行的Node.js进程

echo.
echo 正在清理数据库文件...
if exist "server\database\oa.db" (
    del "server\database\oa.db"
    echo ✓ 数据库文件已删除
) else (
    echo - 数据库文件不存在
)

echo.
echo 正在清理前端构建文件...
if exist "client\dist" (
    rmdir /s /q "client\dist"
    echo ✓ 前端构建文件已清理
) else (
    echo - 前端构建文件不存在
)

echo.
echo 正在清理缓存文件...
if exist "client\node_modules\.vite" (
    rmdir /s /q "client\node_modules\.vite"
    echo ✓ Vite缓存已清理
) else (
    echo - Vite缓存不存在
)

if exist "server\node_modules\.cache" (
    rmdir /s /q "server\node_modules\.cache"
    echo ✓ 服务器缓存已清理
) else (
    echo - 服务器缓存不存在
)

echo.
echo 正在清理日志文件...
if exist "*.log" (
    del "*.log"
    echo ✓ 日志文件已清理
) else (
    echo - 日志文件不存在
)

echo.
echo ========================================
echo          清理完成
echo ========================================
echo.
echo 清理内容:
echo ✓ 数据库文件
echo ✓ 前端构建文件
echo ✓ 缓存文件
echo ✓ 日志文件
echo.
echo 下一步:
echo 1. 运行 system-init.js 初始化数据库
echo 2. 运行 npm run dev 启动开发服务器
echo.
pause