# 技术设计文档：ChewyTodoList 移动端 App

## 概述

本文档描述将 ChewyTodoList Web 应用迁移到移动端的技术设计方案。移动端基于 React Native + Expo SDK 52+ 构建，复用现有后端 Django REST API，与 Web 端共享同一套数据。

核心设计原则：
- **最大化代码复用**：类型定义、API 层、React Query hooks 直接复用或微调后复用
- **原生体验优先**：充分利用 RN 手势、动画能力，而非简单移植 Web 交互
- **配置驱动渲染**：TaskCardConfig 驱动卡片渲染，视图类型驱动布局切换

---

## 当前实现状态与差距分析（2026-04-18 审查）

### Web 端 vs Mobile 端功能对等矩阵

```
功能模块                    | Web 端 | Mobile 端 | 差距
---------------------------|--------|-----------|------
用户认证（登录/注册/登出）    | ✅     | ✅        | 0%
用户初始化                   | ✅     | ❌        | 100%
主页导航与视图切换            | ✅     | ✅        | 0%
任务列表视图（ListView）      | ✅     | ✅        | ~10%（缺左滑操作）
看板视图（BoardView）        | ✅     | ❌        | 100%
日历视图（CalendarView）     | ✅     | ❌        | 100%
表格视图（TableView）        | ✅     | ❌        | 100%
时间线视图（TimelineView）   | ✅     | ❌        | 100%
画廊视图（GalleryView）      | ✅     | ❌        | 100%
任务创建                     | ✅     | ❌        | 100%
任务详情/编辑                | ✅     | ❌        | 100%
任务删除                     | ✅     | ❌        | 100%
任务搜索                     | ✅     | ❌        | 100%
项目管理（CRUD）             | ✅     | ❌        | 100%（仅占位页）
分组管理（Group CRUD）       | ✅     | ❌        | 100%
视图管理（CRUD）             | ✅     | ❌        | 100%（仅占位页）
高级筛选器（FilterBuilder）   | ✅     | ❌        | 100%
排序/分组配置                | ✅     | ❌        | 100%
卡片配置编辑器               | ✅     | ❌        | 100%
标签管理                     | ✅     | ❌        | 100%
附件上传/管理                | ✅     | ❌        | 100%（API 层也缺失）
活动日志                     | ✅     | ❌        | 100%
深色模式                     | ✅     | ❌        | 100%
Toast 通知                   | ✅     | ❌        | 100%
视图模板市场                 | ✅     | ❌        | 100%
卡片样式市场                 | ✅     | ❌        | 100%
离线状态检测                 | ❌     | ✅        | Mobile 独有
离线缓存持久化               | ❌     | ❌        | 未实现
修改密码                     | ✅     | ❌        | 100%
```

### 已实现的 Mobile 组件清单

| 组件 | 路径 | 状态 |
|------|------|------|
| TaskCard | components/task/TaskCard.tsx | ✅ 完整 |
| TaskCardRenderer | components/task/TaskCardRenderer.tsx | ✅ 完整 |
| ListView | components/views/ListView.tsx | ✅ 基本完整（缺左滑） |
| ProjectSelector | components/navigation/ProjectSelector.tsx | ✅ 完整 |
| FAB | components/ui/FAB.tsx | ✅ 完整（未连接创建逻辑） |
| ActionSheet | components/ui/ActionSheet.tsx | ✅ 完整 |
| ConfirmDialog | components/ui/ConfirmDialog.tsx | ✅ 完整 |
| OfflineBanner | components/ui/OfflineBanner.tsx | ✅ 完整 |
| ProgressBar | components/ui/ProgressBar.tsx | ✅ 完整 |

### 缺失的 Mobile 组件清单

| 组件 | 计划路径 | 优先级 |
|------|---------|--------|
| Toast | components/ui/Toast.tsx | 🔴 P0 |
| QuickCreateSheet | components/task/QuickCreateSheet.tsx | 🔴 P0 |
| TitleEditor | components/task/detail/TitleEditor.tsx | 🔴 P0 |
| RichTextEditor | components/task/detail/RichTextEditor.tsx | 🔴 P0 |
| StatusPicker | components/task/detail/StatusPicker.tsx | 🔴 P0 |
| PriorityPicker | components/task/detail/PriorityPicker.tsx | 🔴 P0 |
| DatePicker | components/task/detail/DatePicker.tsx | 🔴 P0 |
| ProjectPicker | components/task/detail/ProjectPicker.tsx | 🔴 P0 |
| TagPicker | components/task/detail/TagPicker.tsx | 🔴 P0 |
| SubtaskList | components/task/detail/SubtaskList.tsx | 🔴 P0 |
| AttachmentList | components/task/detail/AttachmentList.tsx | 🟡 P1 |
| ActivityLog | components/task/detail/ActivityLog.tsx | 🟡 P1 |
| ParentTaskLink | components/task/detail/ParentTaskLink.tsx | 🟡 P1 |
| BoardView | components/views/BoardView.tsx | 🟡 P1 |
| CalendarView | components/views/CalendarView.tsx | 🟡 P1 |
| TableView | components/views/TableView.tsx | 🟡 P1 |
| TimelineView | components/views/TimelineView.tsx | 🟡 P1 |
| GalleryView | components/views/GalleryView.tsx | 🟡 P1 |
| FilterBuilder | components/views/FilterBuilder.tsx | 🟡 P1 |

### 缺失的 Mobile Hooks

| Hook | 计划路径 | 优先级 |
|------|---------|--------|
| useToast | hooks/useToast.ts | 🔴 P0 |
| useAutoSave | hooks/useAutoSave.ts | 🔴 P0 |
| useGroups | hooks/useGroups.ts | 🔴 P0 |
| useTags | hooks/useTags.ts | 🔴 P0 |
| useActivityLogs | hooks/useActivityLogs.ts | 🟡 P1 |
| useConfirm | hooks/useConfirm.ts | 🟡 P1 |

### API 层差距

`shared/services/api.ts` 中缺失的 API：
- `attachmentApi`（附件上传/列表/删除）— 完全缺失，Web 端已有

### 交互模式差距

| 交互 | Web 端 | Mobile 端适配方案 |
|------|--------|------------------|
| 拖拽排序（项目/视图/排序规则） | @dnd-kit | react-native-reanimated + gesture-handler |
| 内联编辑（标题/项目名） | contentEditable / input | TextInput 内联模式 |
| 搜索防抖 | useState + setTimeout | 相同模式 |
| 底部弹窗 | 自定义 BottomSheet | 已有 ActionSheet，需扩展 |
| 确认对话框 | 自定义 ConfirmDialog | ✅ 已有 |
| 悬浮操作按钮 | FloatingAddButton | ✅ 已有 FAB |
| 侧边抽屉菜单 | DrawerMenu | 不需要（使用底部 Tab 导航） |
| 左滑快捷操作 | 无 | react-native-gesture-handler Swipeable |
| 键盘快捷键 | 有 | 不适用于移动端 |

---

## 架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                    mobile/ (Expo App)                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Expo Router (文件系统路由)            │   │
│  │  app/                                           │   │
│  │  ├── (auth)/login.tsx                          │   │
│  │  ├── (tabs)/                                   │   │
│  │  │   ├── index.tsx          # 主页（视图列表）   │   │
│  │  │   ├── projects/          # 项目管理           │   │
│  │  │   ├── views/             # 视图管理           │   │
│  │  │   └── settings/          # 设置/我的          │   │
│  │  └── task/[uid].tsx         # 任务详情（Stack）  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Components  │  │    Hooks     │  │   Services   │  │
│  │  (RN 原生)   │  │ (React Query)│  │  (API 层)    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                           │                  │          │
│                    ┌──────┴──────────────────┘          │
│                    │     shared/ (共享代码)              │
│                    │  ├── types/index.ts                │
│                    │  └── services/api.ts               │
│                    └────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
                            │
                    ┌───────┴────────┐
                    │  Django REST   │
                    │  API Backend   │
                    └────────────────┘
```

### 目录结构

```
mobile/
├── app/                          # Expo Router 路由文件
│   ├── _layout.tsx               # 根布局（QueryClient + 主题）
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx           # 底部 Tab 导航
│   │   ├── index.tsx             # 主页（视图切换 + 任务列表）
│   │   ├── projects/
│   │   │   ├── index.tsx
│   │   │   └── [uid].tsx
│   │   ├── views/
│   │   │   ├── index.tsx
│   │   │   ├── create.tsx
│   │   │   └── [uid]/edit.tsx
│   │   └── settings/
│   │       └── index.tsx
│   ├── task/
│   │   ├── [uid].tsx             # 任务详情页（Stack）
│   │   └── create.tsx
│   └── +not-found.tsx
├── components/                   # 可复用 RN 组件
│   ├── views/                    # 六种视图组件
│   │   ├── ListView.tsx
│   │   ├── BoardView.tsx
│   │   ├── CalendarView.tsx
│   │   ├── TableView.tsx
│   │   ├── TimelineView.tsx
│   │   └── GalleryView.tsx
│   ├── task/                     # 任务相关组件
│   │   ├── TaskCard.tsx          # 配置驱动的卡片渲染
│   │   ├── TaskCardRenderer.tsx  # 字段渲染引擎
│   │   ├── QuickCreateSheet.tsx  # 快速创建底部弹窗
│   │   └── detail/              # 任务详情子组件
│   │       ├── TitleEditor.tsx
│   │       ├── RichTextEditor.tsx
│   │       ├── StatusPicker.tsx
│   │       ├── PriorityPicker.tsx
│   │       ├── DatePicker.tsx
│   │       ├── ProjectPicker.tsx
│   │       ├── TagPicker.tsx
│   │       ├── SubtaskList.tsx
│   │       ├── AttachmentList.tsx
│   │       ├── ActivityLog.tsx
│   │       └── ParentTaskLink.tsx
│   ├── ui/                       # 基础 UI 组件
│   │   ├── ActionSheet.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── FAB.tsx
│   │   ├── OfflineBanner.tsx
│   │   └── ProgressBar.tsx
│   └── navigation/
│       └── ProjectSelector.tsx
├── hooks/                        # 移动端专用 hooks
│   ├── useAuth.ts                # 适配 SecureStore 的认证 hook
│   ├── useNetworkStatus.ts       # 网络状态监听
│   └── useAutoSave.ts            # 自动保存 hook
├── constants/
│   └── theme.ts                  # NativeWind 主题配置
└── package.json

shared/                           # 两端共享代码
├── types/
│   └── index.ts                  # 直接复用 frontend/src/types/index.ts
└── services/
    └── api.ts                    # 适配后的 API 层（SecureStore 替换 localStorage）
```

---

## 组件与接口

### 导航架构（Expo Router）

采用 **Stack + Tabs 嵌套**模式：

```
RootLayout (_layout.tsx)
├── AuthGuard（未登录重定向到 /auth/login）
├── (auth) Group
│   └── login.tsx
└── (tabs) Group                  # 底部 Tab 导航
    ├── Tab: 主页 (index)         # 视图切换 + 任务列表
    ├── Tab: 项目 (projects/)     # 项目列表 + 详情
    ├── Tab: 视图 (views/)        # 视图管理
    └── Tab: 我的 (settings/)     # 设置页
        
Stack（覆盖在 Tabs 之上）
└── task/[uid].tsx                # 任务详情（全屏 Stack，不显示底部 Tab）
```

路由守卫实现：在根 `_layout.tsx` 中通过 `useSegments` + `useRouter` 监听认证状态，未登录时重定向到 `/(auth)/login`。

### 认证流程

```
App 启动
    │
    ▼
SecureStore.getItemAsync('access_token')
    │
    ├── 有 token → 进入主界面，后台验证 token 有效性
    │
    └── 无 token → 跳转登录页
    
登录成功
    │
    ▼
SecureStore.setItemAsync('access_token', access)
SecureStore.setItemAsync('refresh_token', refresh)
    │
    ▼
跳转主界面

API 请求 401
    │
    ▼
isRefreshing? → 是 → 加入等待队列
    │
    否
    ▼
SecureStore.getItemAsync('refresh_token')
    │
    ├── 有 → POST /api/auth/refresh/ → 更新 access_token → 重试原请求
    │
    └── 无 → 清除所有 token → 跳转登录页
```

### 六种视图组件接口

所有视图组件共享统一接口：

```typescript
interface ViewProps {
  tasks: Task[];
  view: TaskView;
  onTaskPress: (task: Task) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
}
```

| 视图类型 | 核心组件 | 关键依赖 |
|---------|---------|---------|
| list | `FlatList` + `TaskCard` | react-native-gesture-handler（左滑） |
| board | `ScrollView(horizontal)` + 列 `FlatList` | react-native-reanimated（拖拽） |
| calendar | `react-native-calendars` | 月历网格 + 日期任务列表 |
| table | `ScrollView(horizontal)` + `FlatList` | 固定列头 + 横向滚动 |
| timeline | 自定义时间轴 | `ScrollView` + 绝对定位任务条 |
| gallery | `FlatList(numColumns=2)` + `TaskCard` | 双列网格 |

### 任务卡片渲染架构（TaskCardConfig 驱动）

```
TaskView.card_config (TaskCardConfig)
    │
    ▼
TaskCardRenderer
    │
    ├── 读取 field_configs（按 position 分组）
    │   ├── header_left: [checkbox, title]
    │   ├── header_right: [priority, status]
    │   ├── body: [description]
    │   └── footer: [due_date, tags, project, subtasks_progress]
    │
    └── 按 layout 密度（compact/comfortable/spacious）调整间距
    
每个 CardField 由 FieldRenderer 渲染：
    field: 'due_date' → DueDateField（支持 showRelative 样式选项）
    field: 'tags'     → TagsField（支持 pill/badge/minimal variant）
    field: 'priority' → PriorityField（支持 flag/dot/badge variant）
    field: 'status'   → StatusField（支持 badge/icon/border variant）
```

### 任务详情页组件拆分

任务详情页（`task/[uid].tsx`）采用 `ScrollView` + 分区块组件：

```
TaskDetailPage
├── ParentTaskLink          # 父任务链接（条件渲染）
├── TitleEditor             # 内联标题编辑（TextInput）
├── StatusBar               # 状态复选框 + 完成时间
├── ─── 分隔线 ───
├── RichTextEditor          # Markdown 富文本编辑区
├── ─── 属性区 ───
├── StatusPicker            # 状态选择（ActionSheet）
├── PriorityPicker          # 优先级选择（ActionSheet）
├── DateSection             # 开始/截止日期 + 全天开关 + 快捷选项
├── ProjectPicker           # 项目选择（搜索+列表 Modal）
├── TagPicker               # 标签多选（带创建入口）
├── CustomGroupField        # 自定义分组文本输入
├── ─── 子任务区 ───
├── SubtaskList             # 子任务列表 + 进度条 + 快速添加
├── ─── 附件区 ───
├── AttachmentList          # 附件列表 + 上传入口
├── ─── 活动日志 ───
└── ActivityLog             # 折叠式活动日志
```

自动保存策略：使用 `useAutoSave` hook，监听字段变更，debounce 1000ms 后调用 `PATCH /api/tasks/{uid}/`，顶部显示保存状态（"保存中..." / "已保存"）。

---

## 数据模型

### 共享代码策略

`shared/` 目录作为两端共享的代码层：

```
shared/
├── types/index.ts      # 直接复制自 frontend/src/types/index.ts，无需修改
└── services/api.ts     # 基于 frontend/src/services/api.ts 适配：
                        #   - 将 localStorage 替换为 expo-secure-store
                        #   - 将 window.location.replace 替换为 Expo Router 导航
                        #   - baseURL 从环境变量读取（EXPO_PUBLIC_API_URL）
```

移动端 hooks 直接引用 `shared/` 中的类型和 API，与 Web 端保持逻辑一致。

### 状态管理方案

```
QueryClient（全局单例，在 _layout.tsx 初始化）
    │
    ├── 查询缓存（staleTime 配置）
    │   ├── ['views']              staleTime: 5min
    │   ├── ['view-tasks', uid]    staleTime: 1min
    │   ├── ['task', uid]          staleTime: 30s
    │   ├── ['projects']           staleTime: 5min
    │   └── ['tags']               staleTime: 10min
    │
    └── 离线支持
        ├── persistQueryClient（@tanstack/query-async-storage-persister）
        └── AsyncStorage 作为持久化存储
```

### Token 存储模型

| 键名 | 存储位置 | 说明 |
|-----|---------|-----|
| `access_token` | expo-secure-store | JWT access token |
| `refresh_token` | expo-secure-store | JWT refresh token |

SecureStore 在 iOS 使用 Keychain，Android 使用 Keystore，比 AsyncStorage 更安全。

### 关键第三方库选型

| 功能 | 选型 | 理由 |
|-----|-----|-----|
| 日历视图 | `react-native-calendars` | 功能完整，支持标记点、月历/周历切换 |
| 富文本编辑 | `react-native-pell-rich-editor` 或 `@10play/tentap-editor` | 支持 Markdown 工具栏，WebView 内核 |
| 拖拽（看板） | `react-native-reanimated` + `react-native-gesture-handler` | 官方推荐，Expo 内置支持 |
| 图片预览 | `react-native-image-viewing` | 轻量，支持缩放和滑动切换 |
| 日期选择 | `@react-native-community/datetimepicker` | 原生 DatePicker，iOS/Android 一致 |
| 网络状态 | `@react-native-community/netinfo` | 监听网络连接状态 |
| 文件选择 | `expo-document-picker` + `expo-image-picker` | Expo 官方，权限管理完善 |
| 安全存储 | `expo-secure-store` | Expo 官方，iOS Keychain / Android Keystore |

---

## 正确性属性

*属性（Property）是在系统所有有效执行中都应成立的特征或行为——本质上是对系统应该做什么的形式化陈述。属性是人类可读规范与机器可验证正确性保证之间的桥梁。*

### 属性 1：Token 存储往返一致性

*对于任意* 有效的 access token 和 refresh token 字符串，登录成功后将其写入 SecureStore，随后读取应得到完全相同的值，不发生截断或变形。

**验证：需求 1.2**

### 属性 2：Token 刷新后请求重试

*对于任意* 因 access token 过期而返回 401 的 API 请求，Auth_Manager 使用 refresh token 刷新成功后，应能以新 token 重试该请求，且重试请求的 Authorization header 中携带的是新 token 而非旧 token。

**验证：需求 1.4**

### 属性 3：登出后 Token 完全清除

*对于任意* 已登录状态（SecureStore 中存有 access_token 和 refresh_token），执行登出操作后，SecureStore 中的 access_token 和 refresh_token 均应不存在（读取返回 null）。

**验证：需求 1.6**

### 属性 4：项目筛选过滤的完整性

*对于任意* follow_selected_project=true 的视图和任意选中的项目 P，经过项目筛选后展示的任务列表中，每一个任务的 project.uid 都应等于 P.uid，不存在属于其他项目的任务。

**验证：需求 2.5**

### 属性 5：卡片字段渲染与配置的双向一致性

*对于任意* TaskCardConfig 和任意 Task，TaskCardRenderer 渲染出的卡片中：(a) field_configs 中 visible=true 的每个字段都应在卡片中有对应的渲染输出；(b) field_configs 中 visible=false 的字段不应出现在卡片中。

**验证：需求 3.2、需求 8.2、需求 13.4**

### 属性 6：乐观更新失败后的状态回滚

*对于任意* 任务和任意字段更新操作，若 API 调用返回错误，则 Query Cache 中该任务的所有字段值应与操作发起前完全一致，不保留任何部分更新。

**验证：需求 3.7、需求 4.3、需求 4.4**

### 属性 7：子任务进度计数的正确性

*对于任意* 包含若干子任务的父任务，界面上显示的"已完成子任务数"应等于子任务列表中 is_completed=true 的条目数量，"总子任务数"应等于子任务列表的总长度。

**验证：需求 9.22**

### 属性 8：日期先后顺序校验

*对于任意* 截止日期（due_date）严格早于开始日期（start_date）的日期组合，系统应拒绝保存该组合，展示内联错误提示，且任务的 due_date 和 start_date 字段不应被修改。

**验证：需求 9.11**

### 属性 9：空白标题的创建拦截

*对于任意* 由纯空白字符（空格、制表符 \t、换行符 \n 的任意组合）构成的标题字符串，快速创建表单应拒绝提交，不调用创建 API，任务列表的总条目数不应增加。

**验证：需求 10.4**

### 属性 10：视图配置序列化往返一致性

*对于任意* 包含筛选条件（filters）、排序规则（sorts）和卡片配置引用（card_config_uid）的视图配置对象，将其序列化后通过 API 保存，再重新加载该视图，反序列化后的配置对象应与原始配置对象在语义上完全等价。

**验证：需求 12.6**

### 属性 11：离线状态下写操作拦截

*对于任意* 写操作（创建任务、更新任务、删除任务），在设备处于离线状态时，该操作应被拦截，不发起网络请求，并向用户展示离线提示，任务列表的本地缓存状态不应发生变化。

**验证：需求 15.4**

---

## 错误处理

### 网络错误分层处理

| 错误类型 | 处理策略 |
|---------|---------|
| 401 Unauthorized | 自动刷新 token，失败则跳转登录 |
| 网络超时 / 无网络 | 展示离线横幅，显示缓存数据 |
| 400 Bad Request | 在对应表单字段下展示 API 返回的错误信息 |
| 500 Server Error | Toast 提示"服务器错误，请稍后重试" |
| 乐观更新失败 | 回滚本地状态 + Toast 提示具体操作失败原因 |

### 离线模式

使用 `@react-native-community/netinfo` 监听网络状态：
- 离线时：展示顶部 `OfflineBanner`，禁用写操作（创建/修改/删除），只读展示缓存数据
- 恢复联网：自动调用 `queryClient.invalidateQueries()` 刷新所有缓存

---

## 测试策略

### 双轨测试方法

移动端采用单元测试 + 属性测试双轨并行：

**单元测试（Jest + @testing-library/react-native）**
- 覆盖具体示例和边界条件
- 重点测试：TaskCardRenderer 字段渲染逻辑、日期校验逻辑、认证状态机
- 集成测试：API 层的 token 刷新流程（mock axios）

**属性测试（fast-check）**
- 覆盖普遍性属性，通过随机输入验证系统行为
- 每个属性测试最少运行 100 次迭代
- 每个属性测试必须通过注释引用设计文档中的属性编号

属性测试标签格式：
```typescript
// Feature: mobile-app, Property 5: 卡片字段渲染与配置的一致性
fc.assert(fc.property(arbTaskCardConfig, arbTask, (config, task) => {
  const rendered = renderTaskCard(task, config);
  const visibleFields = config.field_configs.filter(f => f.visible).map(f => f.field);
  return visibleFields.every(field => rendered.hasField(field));
}), { numRuns: 100 });
```

**属性测试覆盖矩阵**

| 属性编号 | 测试类型 | 生成器策略 |
|---------|---------|---------|
| 属性 1 | 往返属性 | 生成随机 token 字符串（任意长度、任意字符） |
| 属性 2 | 往返属性 | mock 任意 API 请求 + mock refresh 成功响应 |
| 属性 3 | 状态不变量 | 生成任意已登录状态，执行登出 |
| 属性 4 | 过滤不变量 | 生成随机项目列表 + 随机任务列表 |
| 属性 5 | 配置不变量 | 生成随机 TaskCardConfig（任意 visible 组合）+ 随机 Task |
| 属性 6 | 往返属性 | 生成随机任务 + 随机字段更新 + 模拟 API 失败 |
| 属性 7 | 计数不变量 | 生成随机子任务列表（任意完成状态组合） |
| 属性 8 | 错误条件 | 生成截止日期 < 开始日期的日期对（fc.date） |
| 属性 9 | 错误条件 | 生成纯空白字符串（fc.stringOf(fc.constantFrom(' ', '\t', '\n'))） |
| 属性 10 | 往返属性 | 生成随机视图配置对象（filters/sorts/card_config_uid） |
| 属性 11 | 错误条件 | 生成任意写操作类型 + 离线状态 |

**单元测试重点（具体示例）**
- 登录成功后 token 写入 SecureStore 的具体示例
- 看板拖拽后状态变更为目标列状态的具体示例
- 日历视图中点击日期后任务列表过滤的具体示例
- 删除有子任务的任务时二次确认弹窗的具体示例
