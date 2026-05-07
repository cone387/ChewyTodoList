# ChewyTodoList Mobile

ChewyTodoList 的移动端 App，基于 React Native + Expo 构建，与 Web 端共享同一套后端 API 和数据。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Expo | SDK 54 | 开发框架 |
| React Native | 0.81 | UI 运行时 |
| Expo Router | 6.x | 文件系统路由 |
| NativeWind | 4.x | Tailwind CSS for RN |
| TanStack React Query | 5.x | 数据获取与缓存 |
| Axios | 1.x | HTTP 客户端 |
| Expo SecureStore | 15.x | 安全令牌存储 |
| react-native-gesture-handler | 2.x | 手势（左滑操作） |
| react-native-reanimated | 4.x | 动画 |
| react-native-calendars | 1.x | 日历视图 |
| @react-native-community/datetimepicker | 8.x | 原生日期时间选择器 |
| expo-image-picker | 17.x | 相机/相册选图 |
| expo-document-picker | 14.x | 文件选择 |

## 快速开始

### 前置条件

- Node.js 20+
- npm 或 yarn
- Expo CLI（`npx expo`）
- iOS 模拟器（macOS）或 Android 模拟器，或 Expo Go App

### 安装

```bash
cd mobile
npm install
```

### 配置

创建 `.env` 文件（或在 `app.json` 的 `extra` 中配置）：

```bash
# 后端 API 地址
EXPO_PUBLIC_API_URL=http://localhost:8400/api

# 如果使用真机调试，替换为电脑的局域网 IP
# EXPO_PUBLIC_API_URL=http://192.168.1.100:8400/api
```

### 启动开发服务器

```bash
# 启动 Expo 开发服务器
npx expo start

# 指定平台
npx expo start --ios
npx expo start --android
npx expo start --web
```

## 项目结构

```
mobile/
├── app/                              # Expo Router 路由（文件系统路由）
│   ├── _layout.tsx                   # 根布局（QueryClient、Theme、Toast、AuthGuard）
│   ├── +not-found.tsx                # 404 页面
│   ├── (auth)/                       # 认证路由组
│   │   ├── _layout.tsx
│   │   ├── login.tsx                 # 登录页
│   │   └── register.tsx              # 注册页
│   ├── (tabs)/                       # 底部 Tab 导航
│   │   ├── _layout.tsx               # Tab 配置（主页/项目/视图/我的）
│   │   ├── index.tsx                 # 主页（视图切换 + 任务列表 + 搜索）
│   │   ├── projects/                 # 项目管理
│   │   │   ├── index.tsx             # 项目列表（按分组展示）
│   │   │   └── [uid].tsx             # 项目详情（任务列表）
│   │   ├── views/                    # 视图管理
│   │   │   ├── index.tsx             # 视图列表
│   │   │   ├── create.tsx            # 创建视图（含 FilterBuilder）
│   │   │   └── templates.tsx         # 视图模板市场
│   │   └── settings/                 # 设置
│   │       ├── index.tsx             # 设置主页（用户信息/密码/深色模式）
│   │       ├── tags.tsx              # 标签管理
│   │       └── card-configs.tsx      # 卡片配置编辑器
│   └── task/
│       └── [uid].tsx                 # 任务详情/编辑/创建
│
├── components/                       # 可复用组件
│   ├── views/                        # 6 种视图组件
│   │   ├── ListView.tsx              # 列表视图（含左滑操作）
│   │   ├── BoardView.tsx             # 看板视图（4 列按状态）
│   │   ├── CalendarView.tsx          # 日历视图（月历 + 日期任务列表）
│   │   ├── TableView.tsx             # 表格视图（横向滚动）
│   │   ├── TimelineView.tsx          # 时间线视图（按日期分组）
│   │   ├── GalleryView.tsx           # 画廊视图（双列网格）
│   │   └── FilterBuilder.tsx         # 筛选条件构建器
│   ├── task/                         # 任务相关组件
│   │   ├── TaskCard.tsx              # 配置驱动的任务卡片
│   │   ├── TaskCardRenderer.tsx      # 字段渲染引擎
│   │   ├── QuickCreateSheet.tsx      # 快速创建底部弹窗
│   │   └── detail/                   # 任务详情子组件
│   │       ├── TagPicker.tsx         # 标签选择器（多选 + 创建）
│   │       ├── SubtaskList.tsx       # 子任务列表（CRUD + 进度条）
│   │       ├── ActivityLog.tsx       # 活动日志（折叠式时间线）
│   │       ├── AttachmentList.tsx    # 附件管理（上传/预览/删除）
│   │       └── DatePicker.tsx        # 日期时间选择器（快捷日期 + 原生选择器）
│   ├── ui/                           # 基础 UI 组件
│   │   ├── Toast.tsx                 # Toast 通知
│   │   ├── ActionSheet.tsx           # 底部操作菜单
│   │   ├── ConfirmDialog.tsx         # 确认对话框
│   │   ├── FAB.tsx                   # 悬浮操作按钮
│   │   ├── OfflineBanner.tsx         # 离线状态横幅
│   │   └── ProgressBar.tsx           # 进度条
│   └── navigation/
│       └── ProjectSelector.tsx       # 项目选择器下拉菜单
│
├── hooks/                            # 自定义 Hooks
│   ├── useAuth.ts                    # 认证状态管理（SecureStore）
│   ├── useToast.ts                   # Toast 通知上下文
│   ├── useTheme.ts                   # 深色模式上下文（AsyncStorage 持久化）
│   ├── useNetworkStatus.ts           # 网络状态监听
│   ├── useOfflineGuard.ts            # 离线写操作拦截
│   ├── useTasks.ts                   # 任务 CRUD + 乐观更新
│   ├── useSubtasks.ts                # 子任务查询
│   ├── useProjects.ts                # 项目 CRUD
│   ├── useGroups.ts                  # 分组 CRUD
│   ├── useTags.ts                    # 标签 CRUD
│   ├── useViews.ts                   # 视图 CRUD
│   └── useCardConfigs.ts             # 卡片配置 CRUD
│
├── shared/                           # 与 Web 端共享的代码
│   ├── types/index.ts                # 类型定义（Task, Project, View 等）
│   └── services/
│       ├── api.ts                    # API 层（axios + SecureStore + 401 自动刷新）
│       └── storage.ts                # SecureStore 封装
│
├── constants/
│   └── theme.ts                      # 主题常量（Light/Dark 双色方案）
│
├── data/
│   └── viewTemplates.ts              # 视图模板数据（10 个预设模板）
│
└── assets/                           # 图标和启动图
```

## 功能清单

### 认证
- ✅ 登录 / 注册 / 退出
- ✅ JWT 令牌安全存储（SecureStore）
- ✅ 401 自动刷新 token
- ✅ 路由守卫（未登录重定向）
- ✅ 新用户自动初始化

### 任务管理
- ✅ 快速创建任务（底部弹窗，标题/项目/优先级）
- ✅ 任务详情编辑（标题/内容/状态/优先级/项目/标签/日期）
- ✅ 自动保存（1 秒防抖）
- ✅ 状态切换（待分配/待办/已完成/已放弃）
- ✅ 优先级选择（低/中/高/紧急）
- ✅ 快捷日期设置（今天/明天/周末/下周一）
- ✅ 原生日期时间选择器
- ✅ 标签选择器（多选/搜索/内联创建）
- ✅ 子任务管理（列表/添加/完成/删除/进度条/嵌套导航）
- ✅ 附件上传（相机/相册/文件）+ 进度条
- ✅ 活动日志（折叠式时间线）
- ✅ 父任务链接
- ✅ 删除确认（子任务二次确认）
- ✅ 任务搜索（300ms 防抖）
- ✅ 列表左滑操作（完成/删除）

### 6 种视图
- ✅ **列表视图** — FlatList + 配置驱动卡片 + 左滑操作
- ✅ **看板视图** — 4 列横向滚动（按状态分组）
- ✅ **日历视图** — 月历网格 + 日期任务列表
- ✅ **表格视图** — 横向滚动表格（6 列）
- ✅ **时间线视图** — 按日期分组的时间轴
- ✅ **画廊视图** — 双列渐变色卡片网格

### 项目管理
- ✅ 项目列表（按分组展示）
- ✅ 创建项目 / 分组
- ✅ 项目详情（任务列表 + 统计）
- ✅ 编辑项目名称
- ✅ 删除项目 / 分组

### 视图管理
- ✅ 视图列表（系统/用户分类）
- ✅ 创建视图（类型/名称/项目/导航栏/跟随项目）
- ✅ 筛选条件构建器（FilterBuilder）
- ✅ 复制 / 删除视图
- ✅ 导航栏显示切换
- ✅ 视图模板市场（10 个预设模板，分类/搜索/一键创建）

### 卡片配置
- ✅ 配置列表（预设 + 自定义）
- ✅ 实时预览卡片
- ✅ 字段可见性开关
- ✅ 布局密度切换（紧凑/舒适/宽松）
- ✅ 从预设复制

### 标签管理
- ✅ 标签列表
- ✅ 创建 / 编辑 / 删除
- ✅ 10 种预设颜色

### 设置
- ✅ 用户信息展示
- ✅ 修改密码
- ✅ 深色模式切换（持久化）
- ✅ 标签管理入口
- ✅ 卡片配置入口
- ✅ 退出登录

### 离线支持
- ✅ 离线状态检测 + 横幅提示
- ✅ QueryClient 持久化缓存（AsyncStorage，24 小时）
- ✅ 离线写操作拦截（useOfflineGuard）
- ✅ 联网后自动刷新缓存

### 主题
- ✅ 浅色 / 深色模式
- ✅ 主题持久化（AsyncStorage）
- ✅ StatusBar 自适应

## 架构说明

### 数据流

```
用户操作 → Hook (useTasks/useProjects/...) → API 层 (shared/services/api.ts)
                                                    ↓
                                              Django REST API
                                                    ↓
                                              React Query Cache
                                                    ↓
                                              UI 自动更新
```

### 认证流程

```
App 启动 → SecureStore 读取 token → 有 token → 进入主界面
                                  → 无 token → 跳转登录页

API 401 → 自动刷新 token → 成功 → 重试原请求
                         → 失败 → 清除 token → 跳转登录页
```

### 离线策略

```
在线 → 正常请求 API → 缓存到 AsyncStorage
离线 → 展示缓存数据 → 写操作被拦截 → Toast 提示
恢复 → 自动 invalidateQueries → 后台刷新
```

## 与 Web 端的关系

Mobile 和 Web 共享：
- 同一套后端 Django REST API
- 同一套数据模型和类型定义（`shared/types/index.ts`）
- 同一套 API 接口封装（`shared/services/api.ts`，适配了 SecureStore）

Mobile 独有：
- 原生手势交互（左滑操作、下拉刷新）
- 离线缓存持久化
- SecureStore 安全令牌存储
- 原生日期时间选择器
- 相机/相册附件上传

## 开发注意事项

1. **API 地址**：确保 `EXPO_PUBLIC_API_URL` 指向正确的后端地址。真机调试时需要使用局域网 IP。
2. **SecureStore**：在 Web 平台上 SecureStore 会降级为 localStorage，仅在原生平台使用 Keychain/Keystore。
3. **手势**：根布局已包裹 `GestureHandlerRootView`，所有手势组件可直接使用。
4. **缓存**：QueryClient 使用 `PersistQueryClientProvider`，缓存存储在 AsyncStorage 中，24 小时过期。
5. **主题**：通过 `useTheme()` hook 获取当前主题颜色，新组件应使用 `colors` 对象而非硬编码颜色值。
