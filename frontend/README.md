# 待办事项前端应用

基于React + TypeScript + Tailwind CSS的移动端待办事项管理应用。

## 技术栈

- **React 19** - 前端框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 样式框架
- **Vite** - 构建工具
- **React Query** - 数据获取和状态管理
- **React Router** - 路由管理
- **Axios** - HTTP客户端
- **Material Symbols** - 图标库
- **date-fns** - 日期处理

## 功能特性

- 📱 **移动端优先设计** - 专为移动设备优化的UI
- 🌙 **深色模式支持** - 自动适配系统主题
- 🔐 **JWT认证** - 安全的用户认证系统
- ✅ **任务管理** - 创建、编辑、完成任务
- 🏷️ **标签系统** - 任务分类和标记
- 📁 **项目分组** - 任务项目化管理
- 🔍 **搜索功能** - 快速查找任务
- 📅 **日期管理** - 任务截止日期和提醒
- 🎨 **美观UI** - 现代化的用户界面

## 开发环境设置

### 前置要求

- Node.js 18+
- npm 或 yarn

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:5173 启动

### 构建生产版本

```bash
npm run build
```

### 预览生产版本

```bash
npm run preview
```

## 项目结构

```
frontend/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── Header.tsx       # 头部组件
│   │   ├── TaskList.tsx     # 任务列表
│   │   ├── BottomNav.tsx    # 底部导航
│   │   └── FloatingAddButton.tsx
│   ├── pages/               # 页面组件
│   │   ├── HomePage.tsx     # 首页
│   │   └── LoginPage.tsx    # 登录页
│   ├── hooks/               # 自定义Hooks
│   │   ├── useAuth.ts       # 认证相关
│   │   ├── useTasks.ts      # 任务相关
│   │   └── useProjects.ts   # 项目相关
│   ├── services/            # API服务
│   │   └── api.ts           # API客户端
│   ├── types/               # TypeScript类型定义
│   │   └── index.ts
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── public/                  # 静态资源
├── index.html               # HTML模板
├── tailwind.config.js       # Tailwind配置
├── vite.config.ts           # Vite配置
└── package.json
```

## API集成

前端通过代理配置与后端API通信：

- 开发环境：`http://localhost:8000/api`
- 生产环境：需要配置实际的API地址

### 主要API端点

- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/register/` - 用户注册
- `GET /api/tasks/` - 获取任务列表
- `POST /api/tasks/` - 创建任务
- `PATCH /api/tasks/{uid}/` - 更新任务
- `DELETE /api/tasks/{uid}/` - 删除任务

## 设计特色

### 移动端优化
- 响应式设计，适配各种屏幕尺寸
- 触摸友好的交互元素
- 底部导航栏，方便单手操作
- 浮动添加按钮，快速创建任务

### 视觉设计
- 现代化的渐变色彩
- Material Design图标
- 卡片式布局
- 微交互动画效果

### 用户体验
- 直观的任务状态切换
- 实时搜索和筛选
- 任务分组和标签
- 离线状态处理

## 开发说明

### 状态管理
使用React Query进行服务器状态管理，提供：
- 自动缓存和同步
- 乐观更新
- 错误处理
- 加载状态

### 路由保护
实现了基于JWT的路由保护：
- 未登录用户自动跳转到登录页
- 已登录用户访问登录页自动跳转到首页
- Token过期自动刷新

### 错误处理
- API错误统一处理
- 用户友好的错误提示
- 网络错误重试机制

## 部署

### 环境变量
创建 `.env` 文件配置环境变量：

```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### 构建部署
```bash
npm run build
```

构建产物在 `dist/` 目录，可以部署到任何静态文件服务器。

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License