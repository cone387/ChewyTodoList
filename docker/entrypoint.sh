#!/bin/bash
set -e

echo "=========================================="
echo "Starting ChewyTodoList..."
echo "=========================================="

# 进入后端目录
cd /app/backend

# 运行数据库迁移
echo "Running database migrations..."
python manage.py migrate --noinput

# 收集静态文件
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

# 创建超级用户（如果不存在）
echo "Creating superuser if not exists..."
python manage.py shell << EOF
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username="admin").exists():
    User.objects.create_superuser("admin", "admin@example.com", "admin123")
    print("✓ Superuser created: admin/admin123")
else:
    print("✓ Superuser already exists")
EOF

echo "=========================================="
echo "Starting services..."
echo "=========================================="

# 启动 Supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
