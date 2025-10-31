@echo off
:menu
cls
echo ========================================
echo        OA管理系统管理菜单
echo ========================================
echo.
echo 请选择操作:
echo 1. 安装依赖
echo 2. 初始化数据库
echo 3. 重置数据库
echo 4. 清理项目
echo 5. 启动系统
echo 6. 停止服务
echo 7. 测试CRUD功能
echo 8. 退出
echo.

set /p choice=请输入选择 (1-8): 

if "%choice%"=="1" goto install
if "%choice%"=="2" goto init_db
if "%choice%"=="3" goto reset_db
if "%choice%"=="4" goto clean
if "%choice%"=="5" goto start
if "%choice%"=="6" goto stop
if "%choice%"=="7" goto test_crud
if "%choice%"=="8" goto exit
echo 无效选择，请重新输入
pause
goto menu

:install
echo.
echo 正在安装依赖...
call bat\install.bat
pause
goto menu

:init_db
echo.
echo 正在初始化数据库...
call bat\init-db.bat
pause
goto menu

:reset_db
echo.
echo 正在重置数据库...
call bat\reset-db.bat
pause
goto menu

:clean
echo.
echo 正在清理项目...
call bat\clean.bat
pause
goto menu

:start
echo.
echo 正在启动系统...
call bat\start.bat
pause
goto menu

:stop
echo.
echo 正在停止服务...
taskkill /f /im node.js 2>nul || echo 没有运行的Node.js进程
echo 服务已停止
pause
goto menu

:test_crud
echo.
echo 正在运行CRUD测试...
call bat\test-crud.bat
pause
goto menu

:exit
echo 再见！
exit /b 0
