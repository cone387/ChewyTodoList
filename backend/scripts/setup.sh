#!/bin/bash

# 设置脚本在遇到错误时退出
set -e

echo "🚀 开始设置待办应用后端..."

# 检查是否安装了uv
if ! command -v uv &> /dev/null; then
    echo "❌ uv 未安装，请先安装 uv"
    echo "安装命令: pip install uv"
    exit 1
fi

# 创建虚拟环境并安装依赖
echo "📦 创建虚拟环境并安装依赖..."
uv venv
source .venv/bin/activate
uv sync

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p ../data/logs
mkdir -p ../data/media
mkdir -p ../data/static

# 复制环境变量文件
if [ ! -f .env ]; then
    echo "📝 复制环境变量文件..."
    cp .env.example .env
    echo "⚠️  请编辑 .env 文件设置您的配置"
fi

# 运行数据库迁移
echo "🗄️  运行数据库迁移..."
uv run python manage.py makemigrations
uv run python manage.py migrate

# 创建超级用户（可选）
echo "👤 是否创建超级用户？(y/n)"
read -r create_superuser
if [ "$create_superuser" = "y" ] || [ "$create_superuser" = "Y" ]; then
    uv run python manage.py createsuperuser
fi

# 创建示例数据（可选）
echo "📊 是否创建示例数据？(y/n)"
read -r create_sample
if [ "$create_sample" = "y" ] || [ "$create_sample" = "Y" ]; then
    uv run python manage.py create_sample_data
fi

# 收集静态文件
echo "📦 收集静态文件..."
uv run python manage.py collectstatic --noinput

echo "✅ 设置完成！"
echo ""
echo "🎯 下一步："
echo "1. 编辑 .env 文件设置您的配置"
echo "2. 运行开发服务器: uv run python manage.py runserver"
echo "3. 访问 http://localhost:8000/admin/ 查看管理后台"
echo "4. 访问 http://localhost:8000/api/v1/ 查看API"