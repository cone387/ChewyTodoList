#!/bin/bash

# 部署测试脚本

echo "=========================================="
echo "测试 ChewyTodoList 部署"
echo "=========================================="

# 测试健康检查
echo -n "1. 健康检查: "
HEALTH=$(curl -s http://localhost:8040/health)
if [ "$HEALTH" = "healthy" ]; then
    echo "✓ 通过"
else
    echo "✗ 失败"
    exit 1
fi

# 测试登录
echo -n "2. 登录测试: "
LOGIN_RESPONSE=$(curl -s http://localhost:8040/api/auth/login/ -X POST -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}')
TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access'])" 2>/dev/null)
if [ -n "$TOKEN" ]; then
    echo "✓ 通过"
else
    echo "✗ 失败"
    exit 1
fi

# 测试获取视图
echo -n "3. 获取视图: "
VIEWS=$(curl -s "http://localhost:8040/api/views/?is_visible_in_nav=true" -H "Authorization: Bearer $TOKEN")
VIEW_COUNT=$(echo $VIEWS | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['pagination']['count'])" 2>/dev/null)
if [ "$VIEW_COUNT" -gt 0 ]; then
    echo "✓ 通过 (找到 $VIEW_COUNT 个视图)"
else
    echo "✗ 失败"
    exit 1
fi

# 测试前端静态文件
echo -n "4. 前端访问: "
FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8040/)
if [ "$FRONTEND" = "200" ]; then
    echo "✓ 通过"
else
    echo "✗ 失败 (HTTP $FRONTEND)"
    exit 1
fi

echo "=========================================="
echo "所有测试通过！"
echo "访问地址: http://localhost:8040"
echo "管理员账号: admin / admin123"
echo "=========================================="
