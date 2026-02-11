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

# 加载 .env 中的默认账号配置
if [ -f .env ]; then
    export DEFAULT_ADMIN_USERNAME=$(grep '^DEFAULT_ADMIN_USERNAME=' .env | cut -d'=' -f2)
    export DEFAULT_ADMIN_PASSWORD=$(grep '^DEFAULT_ADMIN_PASSWORD=' .env | cut -d'=' -f2)
    export DEFAULT_ADMIN_EMAIL=$(grep '^DEFAULT_ADMIN_EMAIL=' .env | cut -d'=' -f2)
fi
DEFAULT_ADMIN_USERNAME=${DEFAULT_ADMIN_USERNAME:-admin}
DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD:-admin123456}
DEFAULT_ADMIN_EMAIL=${DEFAULT_ADMIN_EMAIL:-admin@example.com}

# 检查是否有新的迁移
echo "🔍 检查数据库迁移..."
uv run python manage.py makemigrations --check --dry-run || {
    echo "📝 发现新的迁移，正在应用..."
    uv run python manage.py makemigrations
    uv run python manage.py migrate
}

# 确保迁移已应用
uv run python manage.py migrate --run-syncdb 2>/dev/null || true

# 初始化默认用户（从 .env 读取）
echo "👤 检查默认用户..."
uv run python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
username = '$DEFAULT_ADMIN_USERNAME'
if not User.objects.filter(username=username).exists():
    User.objects.create_superuser(username, '$DEFAULT_ADMIN_EMAIL', '$DEFAULT_ADMIN_PASSWORD')
    print(f'  ✅ 默认用户已创建: {username}')
else:
    print(f'  ✅ 默认用户已存在: {username}')
"

# 启动开发服务器
echo "🌐 启动开发服务器..."
echo "访问地址:"
echo "  - API: http://localhost:8030/api/v1/"
echo "  - Admin: http://localhost:8030/admin/"
echo "  - Health: http://localhost:8030/health/"
echo "默认账号: $DEFAULT_ADMIN_USERNAME / $DEFAULT_ADMIN_PASSWORD"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

uv run python manage.py runserver 0.0.0.0:8030