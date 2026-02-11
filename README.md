# 待办事项管理系统

一个功能完整的自托管待办事项管理系统，采用现代化技术栈构建。

## 🚀 功能特性

- ✅ **任务管理**: 创建、编辑、删除任务，支持子任务
- 📋 **项目分组**: 灵活的项目分组管理
- 🏷️ **标签系统**: 多标签分类和过滤
- ⏰ **时间管理**: 开始时间、截止时间、全天任务
- 📊 **优先级**: 四级优先级管理
- 🔍 **搜索过滤**: 强大的搜索和过滤功能
- 📱 **响应式设计**: 支持桌面和移动端
- 🔐 **用户认证**: JWT 认证，数据隔离
- 📈 **活动日志**: 完整的操作历史记录
- 🐳 **容器化部署**: Docker 支持

## 🛠️ 技术栈

### 后端
- **框架**: Django 5.0 + Django REST Framework
- **数据库**: SQLite (默认) / PostgreSQL
- **认证**: JWT (Simple JWT)
- **环境管理**: uv
- **Python**: 3.13+

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **HTTP客户端**: Axios
- **路由**: React Router

## 📁 项目结构

```
ChewyTodoList/
├── backend/                # Django 后端
│   ├── config/            # Django 配置
│   │   └── settings/      # 环境配置
│   ├── apps/              # 应用模块
│   │   └── todolist/      # 待办事项核心模块
│   └── scripts/           # 脚本文件
├── frontend/              # React 前端
│   ├── src/
│   │   ├── components/    # UI 组件
│   │   ├── pages/         # 页面组件
│   │   ├── hooks/         # 自定义 Hooks
│   │   ├── services/      # API 服务
│   │   └── types/         # TypeScript 类型
│   └── public/            # 静态资源
├── docker/                # Docker 配置文件
│   ├── nginx.conf         # Nginx 配置
│   ├── supervisord.conf   # Supervisor 配置
│   └── entrypoint.sh      # 容器启动脚本
├── docs/                  # 项目文档
├── data/                  # 数据目录
├── Dockerfile             # Docker 镜像构建
├── deploy.sh              # 一键部署脚本
└── docker-compose.yml     # Docker Compose 配置
```

## 🚀 快速开始

### 方式一：Docker 一键部署 (推荐)

**国内用户（推荐）：**

```bash
# 克隆项目
git clone <repository-url>
cd ChewyTodoList

# 一键部署（使用国内镜像源）
chmod +x deploy.sh
./deploy.sh deploy-cn
```

**国际用户：**

```bash
# 克隆项目
git clone <repository-url>
cd ChewyTodoList

# 一键部署
chmod +x deploy.sh
./deploy.sh deploy
```

部署完成后访问 http://localhost:4030
- 默认管理员账号: 通过 `.env` 中 `DEFAULT_ADMIN_USERNAME` / `DEFAULT_ADMIN_PASSWORD` 配置（默认 `admin` / `admin123456`）

详细部署说明请查看 [DEPLOY.md](DEPLOY.md)

### 方式二：Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend
```

访问 http://localhost:4030/api/ 查看API

### 方式三：本地开发

#### 1. 后端设置

```bash
# 进入后端目录
cd backend

# 安装 uv (如果未安装)
pip install uv

# 运行设置脚本
./scripts/setup.sh

# 启动开发服务器
./scripts/dev.sh
```

#### 2. 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:4030

## 📖 API 文档

### 认证端点
- `POST /api/v1/auth/register/` - 用户注册
- `POST /api/v1/auth/login/` - 用户登录
- `POST /api/v1/auth/refresh/` - 刷新Token
- `GET /api/v1/auth/me/` - 获取用户信息

### 核心功能
- `GET /api/v1/groups/` - 分组管理
- `GET /api/v1/projects/` - 项目管理
- `GET /api/v1/tasks/` - 任务管理
- `GET /api/v1/tags/` - 标签管理

### 特殊端点
- `GET /api/v1/tasks/today/` - 今日任务
- `GET /api/v1/tasks/overdue/` - 逾期任务
- `PATCH /api/v1/tasks/bulk-update/` - 批量更新

详细API文档请查看 [docs/api-design.md](docs/api-design.md)

## 🔧 开发指南

### 环境要求
- Python 3.13+
- Node.js 20+ (前端)
- uv (Python包管理)
- Docker & Docker Compose (可选)

### 开发流程

1. **Fork 项目**
2. **创建功能分支**: `git checkout -b feature/amazing-feature`
3. **提交更改**: `git commit -m 'Add amazing feature'`
4. **推送分支**: `git push origin feature/amazing-feature`
5. **创建 Pull Request**

### 代码规范

```bash
# 代码格式化
cd backend
uv run black .
uv run isort .

# 代码检查
uv run flake8 .

# 运行测试
./scripts/test.sh
```

## 📚 文档

- [需求文档](docs/requirements.md)
- [开发规范](docs/development-standards.md)
- [API设计](docs/api-design.md)
- [部署指南](docs/deployment-guide.md)

## 🐳 部署

### Docker 部署

```bash
# 构建并启动
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

### 传统部署

参考 [部署指南](docs/deployment-guide.md) 获取详细说明。

## 🤝 贡献

欢迎贡献代码！请查看 [贡献指南](CONTRIBUTING.md) 了解详情。

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者！

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 [Issue](../../issues)
- 发送邮件到 [your-email@example.com]
- 加入我们的 [讨论区](../../discussions)

---

**⭐ 如果这个项目对你有帮助，请给它一个星标！**