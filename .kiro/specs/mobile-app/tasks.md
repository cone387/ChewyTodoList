# 实现计划：ChewyTodoList 移动端 App — Web 端完整适配

## 概述

本计划基于 2026-04-18 的全面审查，覆盖从当前 ~15% 完成度到 100% Web 端功能对等的所有剩余工作。已完成的任务标记为 [x]，未完成的按优先级排列。

## 已完成任务（Phase 0）

- [x] 1. 项目初始化与基础设施
  - [x] 1.1 创建 Expo 项目并安装核心依赖
  - [x] 1.2 配置 NativeWind 与全局主题
  - [x] 1.3 配置 Expo Router 文件系统路由入口

- [x] 2. 共享代码层
  - [x] 2.1 创建 shared/types/index.ts
  - [x] 2.2 创建 shared/services/api.ts（SecureStore 适配）

- [x] 3. 认证模块
  - [x] 3.1 实现 useAuth hook
  - [x] 3.3 实现登录页 (auth)/login.tsx
  - [x] 3.4 实现注册页 (auth)/register.tsx
  - [x] 3.5 在根布局实现路由守卫（AuthGuard）

- [x] 5. 导航架构
  - [x] 5.1 实现底部 Tab 导航布局
  - [x] 5.2 创建各 Tab 页面骨架

- [x] 6. 基础 UI 组件（部分）
  - [x] 6.1 实现 ActionSheet 组件
  - [x] 6.2 实现 ConfirmDialog 组件
  - [x] 6.3 实现 FAB 组件
  - [x] 6.4 实现 OfflineBanner 组件
  - [x] 6.5 实现 ProgressBar 组件
  - [x] 6.6 实现 useNetworkStatus hook

- [x] 7. 任务卡片渲染系统
  - [x] 7.1 实现各 FieldRenderer 组件
  - [x] 7.2 实现 TaskCard 组件（配置驱动）

- [x] 8. 主页与视图切换（部分）
  - [x] 8.1 实现 ProjectSelector 组件
  - [x] 8.2 实现主页布局与视图切换器

- [x] 10. 列表视图（部分）
  - [x] 10.1 实现 ListView 组件
  - [x] 10.3 实现任务状态乐观更新（含回滚）

---

## Phase 1：核心任务管理（🔴 P0 — 最高优先级）

- [ ] 30. Toast 通知系统
  - [x] 30.1 实现 Toast 组件与 useToast hook
    - 创建 `mobile/components/ui/Toast.tsx` 和 `mobile/hooks/useToast.ts`
    - 支持 success/error/info/warning 四种类型
    - 3 秒自动消失，支持手动关闭
    - 在根布局中集成 ToastContainer
    - _需求：需求 18_

- [ ] 31. 快速创建任务
  - [x] 31.1 实现 QuickCreateSheet 组件
    - 创建 `mobile/components/task/QuickCreateSheet.tsx`
    - 底部弹出表单：标题（必填）、项目选择、优先级选择、截止日期选择
    - 标题为空时阻止提交并提示
    - 提交成功后关闭表单、刷新任务列表、展示成功 Toast
    - _需求：需求 10.2、10.3、10.4_

  - [x] 31.2 在主页集成 FAB + QuickCreateSheet
    - 在 `mobile/app/(tabs)/index.tsx` 中连接 FAB 点击事件到 QuickCreateSheet
    - _需求：需求 10.1_

- [ ] 32. 任务详情页 — 基础信息
  - [x] 32.1 实现任务详情页骨架与数据加载
    - 完善 `mobile/app/task/[uid].tsx`
    - 调用 `GET /api/tasks/{uid}/` 获取任务完整数据
    - 实现 `useAutoSave` hook：debounce 1000ms 后 PATCH，顶部显示"保存中.../已保存"
    - _需求：需求 9.1、9.4_

  - [x] 32.2 实现 TitleEditor 组件
    - 创建 `mobile/components/task/detail/TitleEditor.tsx`
    - 内联 TextInput，点击即可编辑
    - _需求：需求 9.2_

  - [x] 32.3 实现 StatusPicker 组件
    - 创建 `mobile/components/task/detail/StatusPicker.tsx`
    - ActionSheet 展示四个状态选项（含颜色和图标）
    - 顶部完成状态复选框，点击乐观更新
    - 变更为"已完成"时自动记录完成时间
    - _需求：需求 9.5、9.6、9.8_

  - [x] 32.4 实现 PriorityPicker 组件
    - 创建 `mobile/components/task/detail/PriorityPicker.tsx`
    - ActionSheet 展示四个优先级选项（含颜色标识）
    - _需求：需求 9.7_

  - [ ] 32.5 实现 RichTextEditor 组件
    - 创建 `mobile/components/task/detail/RichTextEditor.tsx`
    - 支持 Markdown 语法（加粗、斜体、标题、列表、代码块、引用）
    - 提供格式工具栏
    - _需求：需求 9.3_

- [ ] 33. 任务详情页 — 时间管理
  - [ ] 33.1 实现 DateSection 组件
    - 创建 `mobile/components/task/detail/DatePicker.tsx`
    - 集成 `@react-native-community/datetimepicker`
    - 开始日期 + 截止日期选择器
    - "全天任务"开关
    - 快捷日期选项：今天、明天、本周末、下周一
    - 截止日期旁显示相对时间，逾期红色高亮
    - due_date < start_date 时展示内联错误提示，阻止保存
    - 时区选择器，默认 Asia/Shanghai
    - _需求：需求 9.9-9.14_

- [ ] 34. 任务详情页 — 项目与标签
  - [ ] 34.1 实现 ProjectPicker 组件
    - 创建 `mobile/components/task/detail/ProjectPicker.tsx`
    - 搜索+列表 Modal，按 Group 分组
    - 移动任务后刷新相关视图 Query Cache
    - 自定义分组字段（custom_group）文本输入
    - _需求：需求 9.15-9.17_

  - [x] 34.2 实现 TagPicker 组件
    - 创建 `mobile/components/task/detail/TagPicker.tsx`
    - 展示所有 Tag（带颜色圆点），支持多选和搜索
    - 底部"创建新标签"入口
    - 已选标签以彩色 Pill 展示，点击可移除
    - _需求：需求 9.18-9.20_

- [ ] 35. 任务详情页 — 子任务
  - [x] 35.1 实现 SubtaskList 组件
    - 创建 `mobile/components/task/detail/SubtaskList.tsx`
    - 子任务列表（标题、完成状态、优先级）
    - 完成进度（"N/M 已完成"）+ ProgressBar
    - 内联输入框快速添加子任务
    - 点击复选框乐观更新
    - 长按展示操作菜单（查看详情、删除）
    - 点击标题跳转子任务详情页（多级嵌套导航）
    - _需求：需求 9.21-9.26_

- [ ] 36. 任务详情页 — 附件
  - [x] 36.1 在 shared/services/api.ts 中添加 attachmentApi
    - 实现附件上传（multipart/form-data）、列表获取、删除接口
    - 集成 `expo-image-picker` 和 `expo-document-picker`
    - _需求：需求 9.27-9.31_

  - [x] 36.2 实现 AttachmentList 组件
    - 创建 `mobile/components/task/detail/AttachmentList.tsx`
    - 附件列表（文件名、类型图标、文件大小）
    - 上传入口（相机拍照、相册选图、文件系统）
    - 上传进度条
    - 图片附件全屏预览（react-native-image-viewing）
    - 长按操作菜单（预览、下载、删除）
    - _需求：需求 9.27-9.31_

- [ ] 37. 任务详情页 — 活动日志与父任务
  - [x] 37.1 实现 ActivityLog 组件
    - 创建 `mobile/components/task/detail/ActivityLog.tsx`
    - 默认折叠，点击展开后加载
    - 时间线形式展示（操作类型、内容、时间戳）
    - _需求：需求 9.32-9.34_

  - [ ] 37.2 实现 ParentTaskLink 组件
    - 创建 `mobile/components/task/detail/ParentTaskLink.tsx`
    - 有父任务时显示标题和跳转链接
    - 支持设置/解除父任务关联
    - _需求：需求 9.35-9.37_

  - [x] 37.3 实现任务删除确认逻辑
    - ConfirmDialog 确认删除
    - 有子任务时二次确认提示
    - 确认后 DELETE + 返回上一页 + 刷新列表
    - 支持"已放弃"软删除
    - _需求：需求 9.38-9.40_

- [ ] 38. 检查点 — 核心任务管理验证
  - 验证任务创建、编辑、删除、详情页所有字段编辑、自动保存、子任务、附件功能正常

---

## Phase 2：项目与视图管理（🔴 P0）

- [ ] 40. 项目管理页
  - [x] 40.1 实现项目列表页
    - 完善 `mobile/app/(tabs)/projects/index.tsx`（替换占位页）
    - 调用 `/api/projects/` 获取项目列表，按 Group 分组展示
    - 每个项目显示名称、图标、颜色、任务统计
    - 支持创建项目（选择 Group、填写名称、选择图标/颜色）
    - 支持创建和管理 Group（创建、重命名、删除）
    - _需求：需求 11.1、11.3、11.6_

  - [x] 40.2 实现项目详情页
    - 完善 `mobile/app/(tabs)/projects/[uid].tsx`（替换占位页）
    - 展示项目下的任务列表（复用 ListView）
    - 支持编辑项目名称和描述
    - 删除项目时 ConfirmDialog 确认
    - _需求：需求 11.2、11.4、11.5_

  - [x] 40.3 实现 useGroups hook
    - 创建 `mobile/hooks/useGroups.ts`
    - 实现 Group CRUD（创建、更新、删除、列表）
    - _需求：需求 11.6_

  - [x] 40.4 实现 useTags hook
    - 创建 `mobile/hooks/useTags.ts`
    - 实现 Tag CRUD（创建、更新、删除、列表）
    - _需求：需求 14_

- [ ] 41. 视图管理页
  - [x] 41.1 实现视图列表页
    - 完善 `mobile/app/(tabs)/views/index.tsx`（替换占位页）
    - 展示所有 TaskView（名称、类型图标、导航栏显示状态）
    - 支持复制视图（POST `/api/views/{uid}/duplicate/`）
    - 删除视图时 ConfirmDialog 确认
    - 支持切换导航栏显示状态
    - _需求：需求 12.1、12.7、12.8_

  - [x] 41.2 实现视图创建/编辑页（基础版）
    - 完善 `mobile/app/(tabs)/views/create.tsx` 和 `[uid]/edit.tsx`
    - 选择视图类型（list/board/calendar/table/timeline/gallery）
    - 填写名称、关联项目、是否在导航栏显示
    - 配置筛选条件（FilterBuilder 移动端版本）
    - 配置排序规则
    - 选择 TaskCardConfig
    - 保存时调用 PATCH `/api/views/{uid}/`
    - _需求：需求 12.2-12.6_

  - [x] 41.3 实现移动端 FilterBuilder 组件
    - 创建 `mobile/components/views/FilterBuilder.tsx`
    - 支持筛选字段：状态、优先级、标签、截止日期、开始日期、项目、是否逾期
    - 支持操作符：等于、不等于、包含、is_today、is_overdue 等
    - 移动端友好的交互（ActionSheet 选择字段/操作符/值）
    - _需求：需求 12.3_

- [ ] 42. 检查点 — 项目与视图管理验证
  - 验证项目 CRUD、Group 管理、视图 CRUD、筛选/排序配置正常

---

## Phase 3：多视图类型（🟡 P1）

- [x] 50. 看板视图
  - [x] 50.1 实现 BoardView 组件
    - 创建 `mobile/components/views/BoardView.tsx`
    - 外层 ScrollView horizontal 包裹四列（待分配/待办/已完成/已放弃）
    - 每列内部 FlatList 渲染该状态的任务卡片
    - _需求：需求 4.1、4.2_

  - [ ] 50.2 实现看板拖拽排序
    - 使用 react-native-reanimated + react-native-gesture-handler 实现长按拖拽
    - 拖拽到目标列时乐观更新任务状态
    - API 失败时回滚并展示错误 Toast
    - _需求：需求 4.3、4.4_

- [x] 51. 日历视图
  - [x] 51.1 实现 CalendarView 组件
    - 创建 `mobile/components/views/CalendarView.tsx`
    - 使用 react-native-calendars 渲染月历网格
    - 有任务的日期显示标记点（markedDates）
    - 支持月份切换
    - 点击日期后在下方展示该日期任务列表
    - _需求：需求 5.1-5.4_

- [x] 52. 表格视图
  - [x] 52.1 实现 TableView 组件
    - 创建 `mobile/components/views/TableView.tsx`
    - 外层 ScrollView horizontal，内层 FlatList 渲染行
    - 固定列头（标题、状态、优先级、截止日期、项目、标签）
    - 点击行跳转任务详情
    - _需求：需求 6.1-6.3_

- [x] 53. 时间线视图
  - [x] 53.1 实现 TimelineView 组件
    - 创建 `mobile/components/views/TimelineView.tsx`
    - 按时间轴渲染有 start_date 或 due_date 的任务条目
    - 支持按周/月切换粒度
    - _需求：需求 7.1-7.3_

- [x] 54. 画廊视图
  - [x] 54.1 实现 GalleryView 组件
    - 创建 `mobile/components/views/GalleryView.tsx`
    - FlatList numColumns=2 双列网格
    - 每项使用 TaskCard
    - _需求：需求 8.1-8.3_

- [x] 55. 在主页集成所有视图类型
  - [x] 55.1 更新主页视图渲染逻辑
    - 在 `mobile/app/(tabs)/index.tsx` 中根据 view_type 动态渲染对应视图组件
    - list → ListView, board → BoardView, calendar → CalendarView, table → TableView, timeline → TimelineView, gallery → GalleryView
    - _需求：需求 2.2_

- [ ] 56. 检查点 — 六种视图验证
  - 验证六种视图渲染和交互正常

---

## Phase 4：卡片配置与标签管理（🟡 P1）

- [x] 60. 卡片配置编辑器
  - [x] 60.1 实现卡片配置列表与预览
    - 在视图编辑页或独立页面中获取 TaskCardConfig 列表
    - 展示每个配置的实时预览卡片（复用 TaskCard）
    - 支持从预设配置创建用户自定义副本
    - _需求：需求 13.1-13.3_

  - [x] 60.2 实现卡片配置编辑器
    - 编辑布局密度（compact/comfortable/spacious）
    - 编辑每个 CardField 的 visible、position、style
    - 实时更新预览卡片
    - 保存时调用 PATCH `/api/card-configs/{uid}/`
    - 应用到视图时更新 card_config_uid
    - _需求：需求 13.4-13.7_

- [x] 61. 标签管理
  - [x] 61.1 实现标签管理页
    - 在设置页提供标签管理入口
    - 展示所有 Tag 列表（名称 + 颜色圆点）
    - 支持创建标签（名称 + 颜色选择/随机生成）
    - 支持编辑标签名称和颜色
    - 删除时 ConfirmDialog 确认
    - _需求：需求 14.1-14.4_

- [x] 62. 任务搜索
  - [x] 62.1 实现搜索功能
    - 在主页顶部添加搜索入口（搜索图标 → 展开搜索栏）
    - 调用 `/api/tasks/?search=` 进行在线搜索，300ms 防抖
    - 展示搜索结果列表，点击跳转任务详情
    - 搜索为空时恢复当前视图
    - _需求：需求 17_

- [x] 63. 列表视图左滑操作
  - [x] 63.1 实现左滑快捷操作
    - 在 ListView 中集成 react-native-gesture-handler 的 Swipeable
    - 左滑展示"完成"和"删除"操作按钮
    - _需求：需求 3.6_

---

## Phase 5：主题、离线与设置（🟢 P2）

- [ ] 70. 深色模式
  - [ ] 70.1 实现深色模式支持
    - 创建 ThemeContext，管理 light/dark 模式状态
    - 更新 constants/theme.ts，定义 light/dark 两套颜色方案
    - 更新所有组件的样式，支持 dark: 前缀
    - 在设置页添加深色模式切换开关
    - 切换后立即应用到全局 UI
    - 持久化用户偏好到 AsyncStorage
    - _需求：需求 16.3_

- [x] 71. 离线支持完善
  - [x] 71.1 配置 QueryClient 持久化缓存
    - 在根布局中配置 persistQueryClient
    - 使用 @tanstack/query-async-storage-persister + AsyncStorage
    - 配置各查询的 staleTime（views: 5min, view-tasks: 1min, task: 30s, projects: 5min, tags: 10min）
    - _需求：需求 15.1_

  - [x] 71.2 实现离线写操作拦截
    - 在所有写操作前检查 isOnline
    - 离线时阻止操作，展示 Toast 提示
    - 恢复联网时自动 invalidateQueries 刷新缓存
    - _需求：需求 15.3、15.4_

- [ ] 72. 设置页完善
  - [x] 72.1 完善设置页
    - 展示当前登录用户的用户名和邮箱
    - 支持修改密码（调用 POST `/api/auth/change-password/`）
    - 集成深色模式切换
    - 集成标签管理入口
    - 显示 App 版本信息
    - _需求：需求 16.1-16.4_

- [x] 73. 用户初始化
  - [x] 73.1 实现用户初始化流程
    - 在根布局中检查用户是否已初始化
    - 未初始化时调用 `/api/auth/initialize/`
    - 初始化完成后刷新所有缓存
    - _需求：需求 19_

- [ ] 74. 视图模板与卡片样式市场
  - [ ] 74.1 实现视图模板选择
    - 在视图创建页提供"从模板创建"入口
    - 展示模板列表，选择后预填配置
    - _需求：需求 20.1-20.3_

  - [ ] 74.2 实现卡片样式预设
    - 在卡片配置页展示预设样式列表
    - 选择后创建用户自定义副本
    - _需求：需求 20.4-20.5_

---

## Phase 6：最终验证

- [ ] 80. 完整功能验证
  - 验证所有功能模块正常工作
  - 验证与 Web 端的功能对等性
  - 验证离线/在线切换的稳定性
  - 验证深色/浅色模式切换
  - 验证所有 CRUD 操作的正确性

## 备注

- Phase 1（核心任务管理）是最高优先级，用户目前无法在移动端创建或编辑任务
- Phase 2（项目与视图管理）紧随其后，项目页和视图页目前仅为占位页
- Phase 3（多视图类型）目前仅有 ListView，其余 5 种视图完全缺失
- Phase 4（卡片配置与标签）是 Web 端的差异化功能，需要完整适配
- Phase 5（主题与离线）是移动端体验的重要组成部分
- 标有 `*` 的子任务为可选测试任务，可在 MVP 阶段跳过
- attachmentApi 在 shared/services/api.ts 中完全缺失，需要新增
