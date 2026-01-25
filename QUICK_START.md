# ChewyTodoList 快速开始指南

## 🚀 一键部署

### 国内用户（推荐）

```bash
# 1. 克隆项目
git clone <repository-url>
cd ChewyTodoList

# 2. 一键部署（使用国内镜像源）
chmod +x deploy.sh
./deploy.sh deploy-cn

# 3. 等待构建完成（首次约 3-5 分钟）
# 4. 访问 http://localhost:8040
# 5. 使用默认账号登录: admin / admin123
```

### 国际用户

```bash
# 1. 克隆项目
git clone <repository-url>
cd ChewyTodoList

# 2. 一键部署
chmod +x deploy.sh
./deploy.sh deploy

# 3. 等待构建完成
# 4. 访问 http://localhost:8040
# 5. 使用默认账号登录: admin / admin123
```

## 📋 常用命令

```bash
# 查看状态
./deploy.sh status

# 查看日志
./deploy.sh logs

# 重启服务
./deploy.sh restart

# 停止服务
./deploy.sh stop

# 清理（删除容器和镜像）
./deploy.sh clean
```

## 🔧 自定义配置

### 修改端口

编辑 `deploy.sh` 文件，修改 `PORT` 变量：

```bash
PORT=8080  # 改为你想要的端口
```

### 修改管理员密码

```bash
# 进入容器
docker exec -it chewy-todolist bash

# 修改密码
cd /app/backend
python manage.py changepassword admin
```

## 🐛 故障排查

### 端口被占用

```bash
# 查看占用端口的进程
lsof -i :8040

# 或修改 deploy.sh 中的 PORT 变量
```

### 容器无法启动

```bash
# 查看容器日志
./deploy.sh logs

# 或
docker logs chewy-todolist
```

### 构建失败

**国内用户：**
```bash
# 使用国内镜像源重新构建
./deploy.sh clean
./deploy.sh build-cn
./deploy.sh start
```

**国际用户：**
```bash
# 清理后重新构建
./deploy.sh clean
./deploy.sh build
./deploy.sh start
```

## 📚 更多文档

- [完整部署指南](DEPLOY.md)
- [项目文档](docs/)
- [API 文档](docs/api-design.md)

## 💡 提示

1. **首次部署**会自动创建：
   - 管理员账号（admin/admin123）
   - 默认分组
   - 默认项目
   - 默认视图

2. **数据持久化**：
   - 数据存储在 `./data` 目录
   - 删除容器不会丢失数据
   - 备份时只需备份 `./data` 目录

3. **性能优化**：
   - 国内用户建议使用 `deploy-cn` 命令
   - 首次构建会下载依赖，后续构建会使用缓存

4. **安全建议**：
   - 生产环境请修改默认密码
   - 配置 HTTPS（参考 DEPLOY.md）
   - 定期备份数据

## 🎉 开始使用

部署完成后，打开浏览器访问 http://localhost:8040

1. 使用 `admin` / `admin123` 登录
2. 开始创建你的第一个任务
3. 探索视图、项目、标签等功能

祝你使用愉快！ 🎊
