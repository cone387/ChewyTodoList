# 部署指南

## 部署概述

本文档提供了待办事项管理系统的完整部署指南，包括开发环境、测试环境和生产环境的部署方案。

## 系统要求

### 最低配置
- **CPU**: 2 核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / macOS 10.15+ / Windows 10+

### 推荐配置
- **CPU**: 4 核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **操作系统**: Ubuntu 22.04 LTS

### 软件依赖
- **Python**: 3.13+
- **Node.js**: 20+
- **Docker**: 24.0+
- **Docker Compose**: 2.20+
- **PostgreSQL**: 15+ (生产环境)
- **Redis**: 7+ (可选，用于缓存和任务队列)

## 开发环境部署

### 1. 环境准备

#### 安装 Python 和 uv
```bash
# macOS (使用 Homebrew)
brew install python@3.13
pip install uv

# Ubuntu/Debian
sudo apt update
sudo apt install python3.13 python3.13-venv python3-pip
pip install uv

# 验证安装
python3.13 --version
uv --version
```

#### 安装 Node.js
```bash
# 使用 nvm (推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# 验证安装
node --version
npm --version
```

### 2. 项目设置

#### 克隆项目
```bash
git clone https://github.com/your-org/todo-app.git
cd todo-app
```

#### 后端设置
```bash
cd backend

# 创建虚拟环境并安装依赖
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv sync

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
vim .env
```

**.env 文件配置**:
```env
# Django 设置
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# 数据库设置 (开发环境使用 SQLite)
DB_ENGINE=django.db.backends.sqlite3
DB_NAME=db.sqlite3

# 或使用 PostgreSQL
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=todoapp_dev
# DB_USER=todouser
# DB_PASSWORD=todopass
# DB_HOST=localhost
# DB_PORT=5432

# Redis 设置 (可选)
REDIS_URL=redis://localhost:6379/0

# 邮件设置 (开发环境)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# 其他设置
TIME_ZONE=Asia/Shanghai
LANGUAGE_CODE=zh-hans
```

#### 数据库初始化
```bash
# 运行迁移
uv run python manage.py migrate

# 创建超级用户
uv run python manage.py createsuperuser

# 加载初始数据 (可选)
uv run python manage.py loaddata fixtures/initial_data.json
```

#### 前端设置
```bash
cd ../frontend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env.local

# 编辑环境变量
vim .env.local
```

**.env.local 文件配置**:
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_WS_BASE_URL=ws://localhost:8000/ws
VITE_APP_TITLE=待办事项管理系统
VITE_APP_VERSION=1.0.0
```

### 3. 启动开发服务器

#### 启动后端
```bash
cd backend
source .venv/bin/activate
uv run python manage.py runserver 8000
```

#### 启动前端
```bash
cd frontend
npm run dev
```

#### 启动 Celery (可选)
```bash
cd backend
source .venv/bin/activate
uv run celery -A config worker -l info
```

### 4. 验证部署
- 后端 API: http://localhost:8000/api/v1/
- 前端应用: http://localhost:5173/
- Django Admin: http://localhost:8000/admin/

## Docker 部署

### 1. 使用 Docker Compose (推荐)

#### 创建 docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: todouser
      POSTGRES_PASSWORD: todopass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U todouser -d todoapp"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    environment:
      - DEBUG=False
      - SECRET_KEY=your-production-secret-key
      - DB_ENGINE=django.db.backends.postgresql
      - DB_NAME=todoapp
      - DB_USER=todouser
      - DB_PASSWORD=todopass
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - ALLOWED_HOSTS=localhost,127.0.0.1,your-domain.com
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"
    volumes:
      - media_volume:/app/media
      - static_volume:/app/static
    command: >
      sh -c "python manage.py migrate &&
             python manage.py collectstatic --noinput &&
             gunicorn config.wsgi:application --bind 0.0.0.0:8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_BASE_URL=http://localhost:8000/api/v1
    ports:
      - "80:80"
    depends_on:
      - backend

  celery:
    build: ./backend
    environment:
      - DEBUG=False
      - SECRET_KEY=your-production-secret-key
      - DB_ENGINE=django.db.backends.postgresql
      - DB_NAME=todoapp
      - DB_USER=todouser
      - DB_PASSWORD=todopass
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - media_volume:/app/media
    command: celery -A config worker -l info

volumes:
  postgres_data:
  redis_data:
  media_volume:
  static_volume:
```

#### 启动服务
```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f backend

# 进入后端容器执行命令
docker-compose exec backend python manage.py createsuperuser
```

### 2. 单独构建镜像

#### 后端 Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.13-slim

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv
RUN pip install uv

# 复制依赖文件
COPY pyproject.toml uv.lock ./

# 创建虚拟环境并安装依赖
RUN uv venv && uv sync --frozen

# 复制应用代码
COPY . .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash app && \
    chown -R app:app /app
USER app

# 设置环境变量
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

# 暴露端口
EXPOSE 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# 启动命令
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4"]
```

#### 前端 Dockerfile
```dockerfile
# frontend/Dockerfile
# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建结果
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

## 生产环境部署

### 1. 服务器准备

#### 系统更新和基础软件安装
```bash
# Ubuntu/Debian
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git vim htop

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 防火墙配置
```bash
# Ubuntu (ufw)
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL 证书配置

#### 使用 Let's Encrypt
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Nginx 配置

#### 创建 Nginx 配置文件
```nginx
# /etc/nginx/sites-available/todoapp
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 安全头
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # 前端静态文件
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API 代理
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # WebSocket 支持
    location /ws/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态文件
    location /static/ {
        alias /var/www/todoapp/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /media/ {
        alias /var/www/todoapp/media/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # 文件上传大小限制
    client_max_body_size 10M;

    # Gzip 压缩
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

#### 启用配置
```bash
sudo ln -s /etc/nginx/sites-available/todoapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. 生产环境 Docker Compose

#### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - backend
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - backend
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    image: todoapp/backend:latest
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_ENGINE=django.db.backends.postgresql
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
      - CORS_ALLOWED_ORIGINS=${CORS_ALLOWED_ORIGINS}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    ports:
      - "8000:8000"
    volumes:
      - media_volume:/app/media
      - static_volume:/app/static
    restart: unless-stopped
    networks:
      - backend
      - frontend
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  frontend:
    image: todoapp/frontend:latest
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
    networks:
      - frontend
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

  celery:
    image: todoapp/backend:latest
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_ENGINE=django.db.backends.postgresql
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - media_volume:/app/media
    restart: unless-stopped
    networks:
      - backend
    command: celery -A config worker -l info
    deploy:
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  celery-beat:
    image: todoapp/backend:latest
    environment:
      - DEBUG=False
      - SECRET_KEY=${SECRET_KEY}
      - DB_ENGINE=django.db.backends.postgresql
      - DB_NAME=${DB_NAME}
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - backend
    command: celery -A config beat -l info
    deploy:
      resources:
        limits:
          memory: 256M
        reservations:
          memory: 128M

networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  media_volume:
  static_volume:
```

#### 生产环境变量文件
```env
# .env.prod
SECRET_KEY=your-very-secure-secret-key-here
DB_NAME=todoapp_prod
DB_USER=todouser_prod
DB_PASSWORD=very-secure-password-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# 邮件配置
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# 监控配置
SENTRY_DSN=your-sentry-dsn-here
```

### 5. 部署脚本

#### 创建部署脚本
```bash
#!/bin/bash
# deploy.sh

set -e

echo "开始部署待办应用..."

# 拉取最新代码
git pull origin main

# 构建镜像
echo "构建 Docker 镜像..."
docker-compose -f docker-compose.prod.yml build --no-cache

# 停止旧服务
echo "停止旧服务..."
docker-compose -f docker-compose.prod.yml down

# 启动新服务
echo "启动新服务..."
docker-compose -f docker-compose.prod.yml up -d

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 运行数据库迁移
echo "运行数据库迁移..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py migrate

# 收集静态文件
echo "收集静态文件..."
docker-compose -f docker-compose.prod.yml exec -T backend python manage.py collectstatic --noinput

# 检查服务状态
echo "检查服务状态..."
docker-compose -f docker-compose.prod.yml ps

echo "部署完成！"
```

#### 设置执行权限
```bash
chmod +x deploy.sh
```

## 监控和日志

### 1. 日志配置

#### Django 日志配置
```python
# config/settings/production.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/app/logs/django.log',
            'maxBytes': 1024*1024*15,  # 15MB
            'backupCount': 10,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'simple'
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}
```

### 2. 健康检查

#### 创建健康检查端点
```python
# apps/common/views.py
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis

def health_check(request):
    """系统健康检查"""
    status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'services': {}
    }
    
    # 检查数据库
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status['services']['database'] = 'healthy'
    except Exception as e:
        status['services']['database'] = f'unhealthy: {str(e)}'
        status['status'] = 'unhealthy'
    
    # 检查 Redis
    try:
        cache.set('health_check', 'ok', 10)
        cache.get('health_check')
        status['services']['redis'] = 'healthy'
    except Exception as e:
        status['services']['redis'] = f'unhealthy: {str(e)}'
        status['status'] = 'unhealthy'
    
    return JsonResponse(status)
```

### 3. 备份策略

#### 数据库备份脚本
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="todoapp_prod"
DB_USER="todouser_prod"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 数据库备份
docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# 媒体文件备份
tar -czf $BACKUP_DIR/media_backup_$DATE.tar.gz -C /var/lib/docker/volumes/todoapp_media_volume/_data .

# 删除 7 天前的备份
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "备份完成: $DATE"
```

#### 设置定时备份
```bash
# 添加到 crontab
crontab -e

# 每天凌晨 2 点备份
0 2 * * * /path/to/backup.sh >> /var/log/backup.log 2>&1
```

## 性能优化

### 1. 数据库优化

#### PostgreSQL 配置优化
```sql
-- postgresql.conf 优化建议
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 2. 缓存配置

#### Redis 缓存配置
```python
# config/settings/production.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://redis:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# 会话存储
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

### 3. 静态文件优化

#### 使用 CDN
```python
# config/settings/production.py
if USE_CDN:
    STATIC_URL = 'https://cdn.your-domain.com/static/'
    MEDIA_URL = 'https://cdn.your-domain.com/media/'
```

## 故障排除

### 常见问题

#### 1. 容器启动失败
```bash
# 查看容器日志
docker-compose logs backend

# 检查容器状态
docker-compose ps

# 进入容器调试
docker-compose exec backend bash
```

#### 2. 数据库连接问题
```bash
# 检查数据库容器
docker-compose exec db psql -U todouser -d todoapp

# 检查网络连接
docker-compose exec backend ping db
```

#### 3. 静态文件问题
```bash
# 重新收集静态文件
docker-compose exec backend python manage.py collectstatic --clear --noinput

# 检查文件权限
docker-compose exec backend ls -la /app/static/
```

### 监控命令

```bash
# 查看系统资源使用
docker stats

# 查看容器资源使用
docker-compose top

# 查看磁盘使用
df -h
du -sh /var/lib/docker/

# 清理 Docker 资源
docker system prune -a
```

这个部署指南提供了从开发环境到生产环境的完整部署方案，包括监控、备份和故障排除等运维相关内容。