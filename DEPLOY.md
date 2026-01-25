# ChewyTodoList 部署指南

## 快速开始

### 一键部署

**标准部署（国际网络）：**

```bash
# 赋予执行权限
chmod +x deploy.sh

# 一键部署（构建 + 启动）
./deploy.sh deploy
```

**国内镜像源部署（推荐国内用户）：**

```bash
# 使用国内镜像源部署（更快）
./deploy.sh deploy-cn
```

部署完成后：
- 访问地址: http://localhost:8040
- 默认管理员账号: `admin` / `admin123`

### 镜像源说明

如果在国内网络环境下构建较慢或失败，建议使用国内镜像源版本：

- **Docker 镜像**: DaoCloud (docker.m.daocloud.io)
- **npm 镜像**: npmmirror (registry.npmmirror.com)
- **pip 镜像**: 清华源 (pypi.tuna.tsinghua.edu.cn)
- **apt 镜像**: 清华源 (mirrors.tuna.tsinghua.edu.cn)

## 详细说明

### 系统要求

- Docker 20.10+
- 2GB+ 内存
- 2GB+ 磁盘空间

### 部署命令

```bash
# 完整部署（国际网络）
./deploy.sh deploy

# 完整部署（国内镜像源，推荐）
./deploy.sh deploy-cn

# 仅构建镜像
./deploy.sh build

# 仅构建镜像（国内镜像源）
./deploy.sh build-cn

# 启动容器
./deploy.sh start

# 停止容器
./deploy.sh stop

# 重启容器
./deploy.sh restart

# 查看日志
./deploy.sh logs

# 查看状态
./deploy.sh status

# 清理容器和镜像
./deploy.sh clean
```

### 自定义端口

编辑 `deploy.sh` 文件，修改 `PORT` 变量：

```bash
PORT=8080  # 改为你想要的端口
```

### 数据持久化

数据存储在 `./data` 目录：
- `data/db.sqlite3` - 数据库文件
- `data/media/` - 用户上传的文件
- `data/static/` - 静态文件
- `data/logs/` - 应用日志

### 环境变量

可以通过修改 Dockerfile 或在运行时传递环境变量：

```bash
docker run -d \
  --name chewytodolist-app \
  -p 80:80 \
  -e DJANGO_SECRET_KEY=your-secret-key \
  -e ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com \
  -e USE_HTTPS=true \
  -v $(pwd)/data:/app/data \
  chewytodolist:latest
```

支持的环境变量：
- `DJANGO_SECRET_KEY`: Django 密钥（生产环境必须设置）
- `ALLOWED_HOSTS`: 允许的主机名，逗号分隔（默认: `*`）
- `USE_HTTPS`: 是否启用 HTTPS 相关安全设置（默认: `false`）
- `DJANGO_SETTINGS_MODULE`: Django 设置模块（默认: `config.settings.production`）

### 生产环境建议

1. **修改默认密码**
   ```bash
   docker exec -it chewytodolist-app python /app/backend/manage.py changepassword admin
   ```

2. **配置 HTTPS**
   
   推荐使用 Nginx 反向代理 + Let's Encrypt：
   
   ```nginx
   # /etc/nginx/sites-available/chewytodolist
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
       ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
       
       location / {
           proxy_pass http://localhost:80;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   
   server {
       listen 80;
       server_name yourdomain.com;
       return 301 https://$server_name$request_uri;
   }
   ```
   
   然后设置环境变量：
   ```bash
   docker run -d \
     --name chewytodolist-app \
     -p 8080:80 \
     -e USE_HTTPS=true \
     -e ALLOWED_HOSTS=yourdomain.com \
     -v $(pwd)/data:/app/data \
     chewytodolist:latest
   ```

3. **定期备份数据**
   ```bash
   # 备份数据库
   cp data/db.sqlite3 backup/db.sqlite3.$(date +%Y%m%d)
   
   # 备份媒体文件
   tar -czf backup/media.$(date +%Y%m%d).tar.gz data/media/
   ```

4. **监控日志**
   ```bash
   # 查看应用日志
   tail -f data/logs/django.log
   
   # 查看容器日志
   docker logs -f chewytodolist-app
   ```

### 故障排查

#### 容器无法启动

```bash
# 查看容器日志
docker logs chewytodolist-app

# 检查端口占用
lsof -i :80
```

#### 数据库迁移失败

```bash
# 进入容器
docker exec -it chewytodolist-app bash

# 手动运行迁移
cd /app/backend
python manage.py migrate
```

#### 静态文件无法加载

```bash
# 重新收集静态文件
docker exec -it chewytodolist-app python /app/backend/manage.py collectstatic --noinput
```

### 更新应用

```bash
# 拉取最新代码
git pull

# 重新构建并部署
./deploy.sh clean
./deploy.sh deploy
```

### 卸载

```bash
# 停止并删除容器
./deploy.sh clean

# 删除数据（可选）
rm -rf data/
```

## 架构说明

单容器部署架构：

```
┌─────────────────────────────────────┐
│         Docker Container            │
│                                     │
│  ┌──────────┐  ┌──────────────┐   │
│  │  Nginx   │  │  Supervisor  │   │
│  │  (Port   │  │              │   │
│  │   80)    │  └──────┬───────┘   │
│  └────┬─────┘         │           │
│       │               │           │
│       │         ┌─────┴─────┐     │
│       │         │           │     │
│       │    ┌────▼────┐ ┌───▼───┐ │
│       └───►│ Django  │ │ Nginx │ │
│            │ (8000)  │ │       │ │
│            └─────────┘ └───────┘ │
│                                   │
│  ┌─────────────────────────────┐ │
│  │     Frontend (Static)       │ │
│  │     /app/frontend/dist      │ │
│  └─────────────────────────────┘ │
└─────────────────────────────────┘
```

- **Nginx**: 处理静态文件和反向代理
- **Django**: 后端 API 服务（Gunicorn）
- **Supervisor**: 进程管理
- **Frontend**: 构建后的静态文件

### 配置文件

部署相关的配置文件位于 `docker/` 目录：

- `docker/nginx.conf` - Nginx 配置
- `docker/supervisord.conf` - Supervisor 进程管理配置
- `docker/entrypoint.sh` - 容器启动脚本

如需自定义配置，可以修改这些文件后重新构建镜像。

## 技术栈

- **前端**: React + TypeScript + Vite + TailwindCSS
- **后端**: Django + Django REST Framework
- **数据库**: SQLite
- **Web服务器**: Nginx
- **进程管理**: Supervisor
- **容器化**: Docker

## 支持

如有问题，请查看：
- [项目文档](docs/)
- [GitHub Issues](https://github.com/your-repo/issues)
