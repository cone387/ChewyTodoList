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

# 创建默认用户（从环境变量读取）
echo "Creating default user if not exists..."
python manage.py shell << EOF
import os
from django.contrib.auth import get_user_model
from apps.todolist.models import TaskView, Group, Project

User = get_user_model()
username = os.environ.get('DEFAULT_ADMIN_USERNAME', 'admin')
password = os.environ.get('DEFAULT_ADMIN_PASSWORD', 'admin123456')
email = os.environ.get('DEFAULT_ADMIN_EMAIL', 'admin@example.com')

if not User.objects.filter(username=username).exists():
    admin = User.objects.create_superuser(username, email, password)
    print(f"\u2713 Superuser created: {username}")
else:
    admin = User.objects.get(username=username)
    print(f"\u2713 Superuser already exists: {username}")

# 创建默认分组
default_group, created = Group.objects.get_or_create(
    user=admin,
    name="默认分组",
    defaults={'desc': '系统默认分组'}
)
if created:
    print("✓ Default group created")
else:
    print("✓ Default group already exists")

# 创建默认项目
default_project, created = Project.objects.get_or_create(
    user=admin,
    name="默认项目",
    defaults={
        'group': default_group,
        'desc': '系统默认项目',
        'view_type': 'list'
    }
)
if created:
    print("✓ Default project created")
else:
    print("✓ Default project already exists")

# 创建默认视图
if not TaskView.objects.filter(user=admin, is_visible_in_nav=True).exists():
    TaskView.objects.create(
        name='所有任务',
        view_type='list',
        is_visible_in_nav=True,
        is_default=True,
        user=admin,
        project=None,
        filters=[],
        sorts=[{'field': 'created_at', 'order': 'desc'}]
    )
    print("✓ Default view created")
else:
    print("✓ Default views already exist")
EOF

echo "=========================================="
echo "Starting services..."
echo "=========================================="

# 启动 Supervisor
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
