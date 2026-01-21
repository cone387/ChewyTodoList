#!/bin/bash

# 测试脚本
set -e

echo "🧪 运行测试..."

# 激活虚拟环境
if [ -d ".venv" ]; then
    source .venv/bin/activate
else
    echo "❌ 虚拟环境不存在，请先运行 scripts/setup.sh"
    exit 1
fi

# 代码格式检查
echo "🔍 检查代码格式..."
uv run black --check .
uv run isort --check-only .
uv run flake8 .

# 运行测试
echo "🧪 运行单元测试..."
uv run python manage.py test

# 生成覆盖率报告
echo "📊 生成测试覆盖率报告..."
uv run coverage run --source='.' manage.py test
uv run coverage report
uv run coverage html

echo "✅ 测试完成！"
echo "📊 覆盖率报告已生成到 htmlcov/ 目录"