@echo off
echo 🧹 清理项目临时文件和缓存...

REM 删除 node_modules
if exist "node_modules" (
    echo 删除根目录 node_modules...
    rmdir /s /q "node_modules"
)

if exist "client\node_modules" (
    echo 删除客户端 node_modules...
    rmdir /s /q "client\node_modules"
)

if exist "server\node_modules" (
    echo 删除服务端 node_modules...
    rmdir /s /q "server\node_modules"
)

REM 删除构建文件
if exist "client\dist" (
    echo 删除客户端构建文件...
    rmdir /s /q "client\dist"
)

REM 删除日志文件
if exist "*.log" (
    echo 删除日志文件...
    del /q *.log
)

if exist "client\*.log" (
    echo 删除客户端日志文件...
    del /q "client\*.log"
)

if exist "server\*.log" (
    echo 删除服务端日志文件...
    del /q "server\*.log"
)

REM 删除临时文件
if exist "*.tmp" (
    echo 删除临时文件...
    del /q *.tmp
)

echo ✅ 清理完成！
pause
