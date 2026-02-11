# 待办事项管理系统 - 后端

基于 Django + DRF 构建的待办事项管理系统后端 API，采用单一应用架构。

## 功能特性

- 🔐 用户认证（JWT）
- 📋 任务管理（CRUD、状态管理、优先级）
- 📁 项目分组管理
- 🏷️ 标签系统
- 📊 活动日志
- 📎 附件支持（集成chewy-attachment）
- 🔍 高级搜索和过滤
- 📱 RESTful API
- 🗄️ SQLite数据库（默认）

## 技术栈

- **框架**: Django 5.0 + Django REST Framework
- **数据库**: SQLite (默认)
- **认证**: JWT (Simple JWT)
- **环境管理**: uv
- **Python版本**: 3.13+

## 项目结构

```
backend/
├── config/                 # Django配置
├── apps/
│   └── todolist/          # 统一应用（包含所有功能）
│       ├── models.py      # 数据模型（Tag, Group, Project, Task, ActivityLog）
│       ├── serializers.py # 序列化器
│       ├── views.py       # 视图
│       ├── urls.py        # URL配置
│       └── admin.py       # 管理后台
├── data/                  # 数据目录
│   ├── db.sqlite3        # SQLite数据库
│   ├── media/            # 媒体文件
│   └── logs/             # 日志文件
└── scripts/              # 脚本文件
```

## 快速开始

### 1. 环境准备

```bash
# 安装 uv
pip install uv

# 验证安装
python --version  # 应该是 3.13+
uv --version
```

### 2. 项目设置

```bash
# 进入后端目录
cd backend

# 运行设置脚本
./scripts/setup.sh
```

### 3. 启动开发服务器

```bash
# 使用开发脚本启动
./scripts/dev.sh

# 或手动启动
source .venv/bin/activate
uv run python manage.py runserver
```

## API 端点

### 认证 (`/api/v1/auth/`)
- `POST /register/` - 用户注册
- `POST /login/` - 用户登录
- `POST /refresh/` - 刷新Token
- `POST /logout/` - 用户登出
- `GET /me/` - 获取用户信息

### 业务功能
- `GET /api/v1/groups/` - 分组管理
- `GET /api/v1/projects/` - 项目管理
- `GET /api/v1/tasks/` - 任务管理
- `GET /api/v1/tags/` - 标签管理
- `GET /api/v1/activity-logs/` - 活动日志

### 特殊端点
- `GET /api/v1/tasks/today/` - 今日任务
- `GET /api/v1/tasks/overdue/` - 逾期任务
- `PATCH /api/v1/tasks/bulk-update/` - 批量更新

## 数据模型

### 核心模型
- **Tag**: 标签模型，支持颜色和排序
- **Group**: 项目分组模型
- **Project**: 项目模型，属于某个分组
- **Task**: 任务模型，支持子任务、优先级、时间管理
- **ActivityLog**: 活动日志模型

### 附件支持
所有模型都包含 `attachments` 字段：
```python
attachments = models.JSONField(
    default=list,
    blank=True,
    help_text="附件列表，存储附件元信息的字典列表",
    verbose_name="附件"
)
```

## 开发指南

### 常用命令

```bash
# 激活虚拟环境
source .venv/bin/activate

# 创建迁移
uv run python manage.py makemigrations

# 应用迁移
uv run python manage.py migrate

# 创建超级用户
uv run python manage.py createsuperuser

# 创建示例数据
uv run python manage.py create_sample_data

# 运行测试
./scripts/test.sh
```

### 测试账户
- 管理员: 通过 `.env` 中 `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` 配置（默认 `admin` / `admin123456`）
- 演示用户: `demo` / `demo123`

## API 响应格式

### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据
  },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

## 部署

### Docker 部署
```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps
```

### 传统部署
参考 `docs/deployment-guide.md` 获取详细说明。

## 许可证

本项目采用 MIT 许可证。