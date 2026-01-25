# 多阶段构建 Dockerfile - 单容器部署前后端 + Nginx

# ==================== 阶段 1: 构建前端 ====================
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制前端依赖文件
COPY frontend/package*.json ./

# 安装所有依赖（构建需要 devDependencies）
RUN npm ci

# 复制前端源码
COPY frontend/ ./

# 构建前端（使用生产环境配置）
RUN npm run build -- --mode production

# ==================== 阶段 2: 最终镜像 ====================
FROM python:3.11-slim

# 安装 Nginx 和 Supervisor
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制后端依赖文件并安装
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# 复制后端代码
COPY backend/ ./backend/

# 创建生产环境配置文件（如果不存在）
RUN if [ ! -f ./backend/.env ]; then \
    echo "SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')" > ./backend/.env && \
    echo "DEBUG=False" >> ./backend/.env && \
    echo "ALLOWED_HOSTS=*" >> ./backend/.env && \
    echo "DATABASE_URL=sqlite:///data/db.sqlite3" >> ./backend/.env; \
    fi

# 从前端构建阶段复制构建产物
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# 创建必要的目录
RUN mkdir -p /app/data/logs /app/data/media /app/data/static \
    && mkdir -p /var/log/supervisor \
    && mkdir -p /run/nginx

# 复制配置文件
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /app/entrypoint.sh

# 设置执行权限
RUN chmod +x /app/entrypoint.sh

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    DJANGO_SETTINGS_MODULE=config.settings.production \
    PORT=8000

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost/health || exit 1

# 启动脚本
ENTRYPOINT ["/app/entrypoint.sh"]
