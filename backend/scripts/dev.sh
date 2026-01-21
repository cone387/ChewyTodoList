#!/bin/bash

# 开发环境启动脚本
set -e

echo "🚀 启动开发环境..."

# 激活虚拟环境
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "❌ 虚拟环境不存在，请先运行 scripts/setup.sh"
    exit 1
fi

# 检查是否有新的迁移
echo "🔍 检查数据库迁移..."
uv run python manage.py makemigrations --check --dry-run || {
    echo "📝 发现新的迁移，正在应用..."
    uv run python manage.py makemigrations
    uv run python manage.py migrate
}

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "访问地址:"
echo "  - API: http://localhost:8000/api/v1/"
echo "  - Admin: http://localhost:8000/admin/"
echo "  - Health: http://localhost:8000/health/"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

uv run python manage.py runserver 0.0.0.0:8000