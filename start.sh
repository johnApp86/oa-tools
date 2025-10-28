#!/bin/bash

echo "========================================"
echo "   OA管理系统启动脚本"
echo "========================================"
echo

echo "正在检查Node.js环境..."
if ! command -v node &> /dev/null; then
    echo "错误: 未找到Node.js，请先安装Node.js"
    exit 1
fi

echo "Node.js环境检查通过"
echo

echo "正在安装依赖..."
npm run install-all
if [ $? -ne 0 ]; then
    echo "错误: 依赖安装失败"
    exit 1
fi

echo
echo "依赖安装完成"
echo

echo "正在启动OA管理系统..."
echo "前端地址: http://localhost:3000"
echo "后端地址: http://localhost:3001"
echo "默认账号: admin / admin123"
echo

# 启动服务
npm run dev &

# 等待服务启动
sleep 3

echo "系统启动中，请稍候..."
echo "浏览器将自动打开系统页面"

# 尝试打开浏览器
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000
elif command -v open &> /dev/null; then
    open http://localhost:3000
fi

echo
echo "系统已启动完成！"
echo "如需停止服务，请按 Ctrl+C"
