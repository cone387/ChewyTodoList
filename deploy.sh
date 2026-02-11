#!/bin/bash

# ChewyTodoList 单容器部署脚本
# 用法: ./deploy.sh [命令] [--cn]

set -e

# 配置
IMAGE_NAME="chewytodolist"
CONTAINER_NAME="chewy-todolist"
PORT=4030

# 颜色
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 解析 --cn 标志
DOCKERFILE="Dockerfile"
for arg in "$@"; do
    if [ "$arg" = "--cn" ]; then
        DOCKERFILE="Dockerfile.cn"
        info "使用国内镜像源"
    fi
done
# 去掉 --cn，保留命令
CMD="${1:-deploy}"
[[ "$CMD" == "--cn" ]] && CMD="deploy"

# 检查 Docker
check_docker() {
    command -v docker &>/dev/null || { error "Docker 未安装"; exit 1; }
}

# 构建
build() {
    info "构建镜像 (${DOCKERFILE})..."
    docker build -f ${DOCKERFILE} -t ${IMAGE_NAME}:latest .
    info "构建完成"
}

# 启动
start() {
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        info "容器已在运行"
        return
    fi

    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        info "启动已有容器..."
        docker start ${CONTAINER_NAME}
    else
        info "创建并启动容器..."
        docker run -d \
            --name ${CONTAINER_NAME} \
            -p ${PORT}:4030 \
            -v $(pwd)/data:/app/data \
            -e DEFAULT_ADMIN_USERNAME=${DEFAULT_ADMIN_USERNAME:-admin} \
            -e DEFAULT_ADMIN_PASSWORD=${DEFAULT_ADMIN_PASSWORD:-admin123456} \
            -e DEFAULT_ADMIN_EMAIL=${DEFAULT_ADMIN_EMAIL:-admin@example.com} \
            --restart unless-stopped \
            ${IMAGE_NAME}:latest
    fi

    info "访问: http://localhost:${PORT}"
    info "账号: ${DEFAULT_ADMIN_USERNAME:-admin} / ${DEFAULT_ADMIN_PASSWORD:-admin123456}"
}

# 停止
stop() {
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop ${CONTAINER_NAME}
        info "已停止"
    else
        warn "容器未运行"
    fi
}

# 清理
clean() {
    docker stop ${CONTAINER_NAME} 2>/dev/null || true
    docker rm ${CONTAINER_NAME} 2>/dev/null || true
    docker rmi ${IMAGE_NAME}:latest 2>/dev/null || true
    info "已清理"
}

# 主逻辑
check_docker
case "$CMD" in
    deploy)
        clean
        build
        start
        sleep 3
        docker ps --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        ;;
    build)  build ;;
    start)  start ;;
    stop)   stop ;;
    restart) stop; sleep 2; start ;;
    logs)   docker logs -f ${CONTAINER_NAME} ;;
    status) docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" ;;
    clean)  clean ;;
    *)
        cat <<EOF
用法: ./deploy.sh [命令] [--cn]

命令:
  deploy   构建并启动（默认）
  build    仅构建镜像
  start    启动容器
  stop     停止容器
  restart  重启容器
  logs     查看日志
  status   查看状态
  clean    清理容器和镜像

选项:
  --cn     使用国内镜像源 (Dockerfile.cn)

示例:
  ./deploy.sh              # 部署
  ./deploy.sh --cn         # 国内镜像部署
  ./deploy.sh build --cn   # 仅构建（国内镜像）
  ./deploy.sh logs         # 查看日志
EOF
        ;;
esac
