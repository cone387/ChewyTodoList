#!/bin/bash

# ChewyTodoList 一键部署脚本
# 使用方法: ./deploy.sh [选项]
# 选项:
#   build   - 构建 Docker 镜像
#   start   - 启动容器
#   stop    - 停止容器
#   restart - 重启容器
#   logs    - 查看日志
#   clean   - 清理容器和镜像

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
IMAGE_NAME="chewytodolist"
CONTAINER_NAME="chewy-todolist"
PORT=8040
DOCKERFILE="Dockerfile"  # 默认使用标准 Dockerfile

# 检查是否使用国内镜像源
if [ "$1" = "build-cn" ] || [ "$1" = "deploy-cn" ]; then
    DOCKERFILE="Dockerfile.cn"
    echo "使用国内镜像源版本"
fi

# 打印带颜色的消息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    print_info "Docker 已安装: $(docker --version)"
}

# 构建镜像
build_image() {
    print_info "开始构建 Docker 镜像..."
    docker build -f ${DOCKERFILE} -t ${IMAGE_NAME}:latest .
    print_info "镜像构建完成！"
}

# 启动容器
start_container() {
    print_info "检查是否有运行中的容器..."
    
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        print_warn "容器 ${CONTAINER_NAME} 已存在"
        
        if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
            print_info "容器正在运行中"
            return
        else
            print_info "启动已存在的容器..."
            docker start ${CONTAINER_NAME}
            print_info "容器已启动！"
            return
        fi
    fi
    
    print_info "创建并启动新容器..."
    docker run -d \
        --name ${CONTAINER_NAME} \
        -p ${PORT}:80 \
        -v $(pwd)/data:/app/data \
        --restart unless-stopped \
        ${IMAGE_NAME}:latest
    
    print_info "容器已启动！"
    print_info "访问地址: http://localhost:${PORT}"
    print_info "默认管理员账号: admin / admin123"
}

# 停止容器
stop_container() {
    print_info "停止容器..."
    if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker stop ${CONTAINER_NAME}
        print_info "容器已停止"
    else
        print_warn "容器未运行"
    fi
}

# 重启容器
restart_container() {
    print_info "重启容器..."
    stop_container
    sleep 2
    start_container
}

# 查看日志
show_logs() {
    print_info "显示容器日志 (Ctrl+C 退出)..."
    docker logs -f ${CONTAINER_NAME}
}

# 清理容器和镜像
clean_all() {
    print_warn "这将删除容器和镜像，数据卷将保留"
    read -p "确认继续? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "停止并删除容器..."
        docker stop ${CONTAINER_NAME} 2>/dev/null || true
        docker rm ${CONTAINER_NAME} 2>/dev/null || true
        
        print_info "删除镜像..."
        docker rmi ${IMAGE_NAME}:latest 2>/dev/null || true
        
        print_info "清理完成！"
    else
        print_info "取消清理"
    fi
}

# 显示状态
show_status() {
    print_info "容器状态:"
    if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
        docker ps -a --filter "name=${CONTAINER_NAME}" --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
    else
        print_warn "容器不存在"
    fi
}

# 完整部署流程
full_deploy() {
    print_info "开始完整部署流程..."
    check_docker
    build_image
    start_container
    sleep 5
    show_status
    print_info "部署完成！"
    print_info "访问地址: http://localhost:${PORT}"
    print_info "默认管理员账号: admin / admin123"
}

# 完整部署流程（国内镜像源）
full_deploy_cn() {
    DOCKERFILE="Dockerfile.cn"
    print_info "使用国内镜像源进行部署..."
    full_deploy
}

# 显示帮助信息
show_help() {
    cat << EOF
ChewyTodoList 一键部署脚本

使用方法:
    ./deploy.sh [命令]

命令:
    deploy      完整部署（构建 + 启动）
    deploy-cn   完整部署（使用国内镜像源）
    build       仅构建 Docker 镜像
    build-cn    仅构建 Docker 镜像（使用国内镜像源）
    start       启动容器
    stop        停止容器
    restart     重启容器
    logs        查看容器日志
    status      查看容器状态
    clean       清理容器和镜像
    help        显示此帮助信息

示例:
    ./deploy.sh deploy      # 一键部署
    ./deploy.sh deploy-cn   # 一键部署（国内镜像源）
    ./deploy.sh logs        # 查看日志
    ./deploy.sh restart     # 重启服务

注意:
    - 如果在国内网络环境下构建较慢，建议使用 deploy-cn 或 build-cn
    - 国内镜像源使用 DaoCloud、清华源、npmmirror 等

EOF
}

# 主函数
main() {
    case "${1:-deploy}" in
        deploy)
            full_deploy
            ;;
        deploy-cn)
            full_deploy_cn
            ;;
        build)
            check_docker
            build_image
            ;;
        build-cn)
            check_docker
            DOCKERFILE="Dockerfile.cn"
            build_image
            ;;
        start)
            check_docker
            start_container
            ;;
        stop)
            stop_container
            ;;
        restart)
            restart_container
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_all
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "未知命令: $1"
            show_help
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
