# 需求文档

## 简介

将现有 ChewyTodoList Web 应用完整适配为移动端 App，基于 React Native + Expo (SDK 52+) + Expo Router + NativeWind + TanStack React Query 技术栈构建。移动端 App 复用现有后端 Django REST API，与 Web 端共享同一套数据，核心目标是达到与 Web 端的**完整功能对等**，同时针对移动端交互特性进行原生化适配。

---

## 当前状态评估（2026-04-18）

### 已完成功能（~15% 完成度）

| 模块 | 状态 | 说明 |
|------|------|------|
| 用户认证（登录/注册） | ✅ 已完成 | SecureStore token 管理、路由守卫 |
| 底部 Tab 导航 | ✅ 已完成 | 主页/项目/视图/我的 四个 Tab |
| 主页视图切换 | ✅ 已完成 | 横向视图 Tab 栏 + 项目选择器 |
| 列表视图（ListView） | ✅ 已完成 | FlatList + TaskCard + 下拉刷新 |
| 任务卡片渲染（TaskCard） | ✅ 已完成 | 配置驱动的字段渲染引擎 |
| 基础 UI 组件 | ✅ 已完成 | FAB、ActionSheet、ConfirmDialog、OfflineBanner、ProgressBar |
| 离线状态检测 | ✅ 已完成 | useNetworkStatus hook |
| 共享类型定义 | ✅ 已完成 | shared/types/index.ts |
| 共享 API 层 | ✅ 已完成 | shared/services/api.ts（SecureStore 适配） |

### 未完成功能（~85% 缺失）

| 模块 | 状态 | 优先级 |
|------|------|--------|
| 任务创建/编辑/删除 | ❌ 完全缺失 | 🔴 P0 |
| 任务详情页 | ❌ 完全缺失 | 🔴 P0 |
| 项目管理（列表/创建/编辑/删除） | ❌ 仅占位页 | 🔴 P0 |
| 视图管理（列表/创建/编辑/删除） | ❌ 仅占位页 | 🔴 P0 |
| 看板视图（BoardView） | ❌ 完全缺失 | 🟡 P1 |
| 日历视图（CalendarView） | ❌ 完全缺失 | 🟡 P1 |
| 表格视图（TableView） | ❌ 完全缺失 | 🟡 P1 |
| 时间线视图（TimelineView） | ❌ 完全缺失 | 🟡 P1 |
| 画廊视图（GalleryView） | ❌ 完全缺失 | 🟡 P1 |
| 高级筛选器（FilterBuilder） | ❌ 完全缺失 | 🟡 P1 |
| 标签管理 | ❌ 完全缺失 | 🟡 P1 |
| 卡片配置编辑器 | ❌ 完全缺失 | 🟡 P1 |
| 任务搜索 | ❌ 完全缺失 | 🟡 P1 |
| 附件上传/管理 | ❌ 完全缺失（API 层也缺失） | 🟡 P1 |
| 活动日志 | ❌ 完全缺失 | 🟢 P2 |
| 深色模式 | ❌ 完全缺失 | 🟢 P2 |
| Toast 通知系统 | ❌ 完全缺失 | 🟢 P2 |
| 左滑快捷操作 | ❌ 完全缺失 | 🟢 P2 |
| 用户初始化流程 | ❌ 完全缺失 | 🟢 P2 |
| 修改密码 | ❌ 完全缺失 | 🟢 P2 |
| 视图模板市场 | ❌ 完全缺失 | 🟢 P2 |
| 卡片样式市场 | ❌ 完全缺失 | 🟢 P2 |
| 离线写操作拦截 | ❌ 完全缺失 | 🟢 P2 |
| QueryClient 持久化缓存 | ❌ 完全缺失 | 🟢 P2 |

---

## 词汇表

- **App**：ChewyTodoList 移动端应用（React Native + Expo）
- **API_Client**：移动端 HTTP 客户端，负责与后端 REST API 通信（复用 axios 逻辑，适配 Expo SecureStore）
- **Auth_Manager**：负责 JWT 令牌的存储、刷新和认证状态管理的模块
- **Task**：待办事项，包含标题、内容、状态、优先级、项目、父任务、标签、日期、附件等字段
- **Project**：项目（清单），任务的容器，属于某个 Group
- **Group**：项目分组，对多个 Project 进行归类
- **Tag**：颜色标签，可附加到 Task 上
- **TaskView**：视图，定义任务的展示方式（类型、筛选、排序、分组、卡片配置）
- **ViewType**：视图类型，枚举值：list（列表）、board（看板）、calendar（日历）、table（表格）、timeline（时间线）、gallery（画廊）
- **TaskCardConfig**：任务卡片配置，控制单张卡片的布局密度、字段显示和样式
- **CardField**：卡片字段，可配置的显示项（标题、状态、优先级、标签、截止日期等）
- **Navigator**：Expo Router 提供的导航系统
- **Query_Cache**：TanStack React Query 的本地缓存层
- **Subtask**：子任务，parent 字段指向父 Task 的 Task
- **TaskStatus**：任务状态枚举：0=待分配、1=待办、2=已完成、3=已放弃
- **TaskPriority**：任务优先级枚举：0=低、1=中、2=高、3=紧急

---

## 需求

### 需求 1：用户认证 ✅ 已完成

**用户故事：** 作为用户，我希望在移动端安全地登录和退出账号，以便访问我的个人待办数据。

#### 验收标准

1. ✅ THE App SHALL 在用户未登录时展示登录界面，阻止访问受保护页面。
2. ✅ WHEN 用户提交有效的用户名和密码，THE Auth_Manager SHALL 调用 `/api/auth/login/` 接口，将返回的 access token 和 refresh token 存储到 Expo SecureStore。
3. ✅ WHEN 用户提交无效的凭据，THE App SHALL 在登录界面展示来自 API 的错误信息，不跳转页面。
4. ✅ WHEN access token 过期且 API 返回 401，THE Auth_Manager SHALL 自动使用 refresh token 调用 `/api/auth/refresh/` 刷新 access token，并重试原请求。
5. ✅ IF refresh token 也已失效，THEN THE Auth_Manager SHALL 清除 SecureStore 中的所有令牌，并将用户重定向到登录界面。
6. ✅ WHEN 用户点击退出登录，THE Auth_Manager SHALL 调用 `/api/auth/logout/`，清除 SecureStore 中的所有令牌，并跳转到登录界面。
7. ✅ THE App SHALL 支持用户注册，注册成功后自动登录并跳转到主界面。

---

### 需求 2：主界面与导航 ✅ 已完成

**用户故事：** 作为用户，我希望通过清晰的底部导航在各主要功能区之间切换，以便快速访问任务、项目和视图。

#### 验收标准

1. ✅ THE Navigator SHALL 提供底部标签栏，包含"主页"、"项目"、"视图"、"我的"四个入口。
2. ✅ WHEN 用户进入主界面，THE App SHALL 展示导航栏中已启用显示的 TaskView 列表，供用户快速切换。
3. ✅ THE App SHALL 在主界面顶部提供项目（清单）选择器，用于筛选当前显示的任务范围。
4. ✅ WHEN 用户切换项目选择器，THE App SHALL 刷新当前视图的任务列表，仅显示属于所选项目的任务。
5. ✅ WHERE 视图的 follow_selected_project 为 true，THE App SHALL 根据主界面所选项目动态过滤视图任务。

---

### 需求 3：任务列表展示（列表视图） 🟡 部分完成

**用户故事：** 作为用户，我希望以列表形式浏览任务，以便快速了解待办事项全貌。

#### 验收标准

1. ✅ WHEN 用户进入列表视图，THE App SHALL 调用 `/api/views/{uid}/tasks/` 获取任务列表并渲染。
2. ✅ THE App SHALL 根据当前 TaskView 的 TaskCardConfig 渲染每张任务卡片，显示配置中 visible=true 的字段。
3. ✅ WHEN 任务列表超过单屏，THE App SHALL 支持上拉加载更多（分页）。
4. ✅ WHEN 用户下拉刷新，THE App SHALL 重新请求任务列表并更新 Query_Cache。
5. ✅ WHEN 用户点击任务卡片，THE App SHALL 跳转到任务详情页。
6. ❌ WHEN 用户在任务卡片上滑动（左滑），THE App SHALL 展示快捷操作（完成、删除）。
7. ✅ WHEN 用户点击任务卡片上的完成复选框，THE App SHALL 乐观更新本地状态。

---

### 需求 4：看板视图 ❌ 未开始

**用户故事：** 作为用户，我希望以看板形式按状态分列展示任务，以便直观管理任务流转。

#### 验收标准

1. ❌ WHEN 用户进入看板视图，THE App SHALL 按 TaskStatus（待分配、待办、已完成、已放弃）渲染四列看板。
2. ❌ THE App SHALL 支持横向滚动以浏览所有看板列。
3. ❌ WHEN 用户长按任务卡片并拖拽到另一列，THE App SHALL 乐观更新任务状态，并调用 API 持久化变更。
4. ❌ IF 拖拽后 API 调用失败，THEN THE App SHALL 回滚任务到原列并展示错误提示。

---

### 需求 5：日历视图 ❌ 未开始

**用户故事：** 作为用户，我希望在日历上查看任务的时间分布，以便合理安排日程。

#### 验收标准

1. ❌ WHEN 用户进入日历视图，THE App SHALL 展示月历网格，在有任务的日期上显示标记点。
2. ❌ WHEN 用户点击某一天，THE App SHALL 在日历下方展示该日期的任务列表。
3. ❌ THE App SHALL 支持月份切换（左右滑动或点击箭头）。
4. ❌ WHEN 用户点击日历中的任务，THE App SHALL 跳转到任务详情页。

---

### 需求 6：表格视图 ❌ 未开始

**用户故事：** 作为用户，我希望以表格形式查看任务的多个字段，以便进行批量信息对比。

#### 验收标准

1. ❌ WHEN 用户进入表格视图，THE App SHALL 渲染包含标题、状态、优先级、截止日期、项目、标签列的横向可滚动表格。
2. ❌ THE App SHALL 支持横向滚动以查看所有列。
3. ❌ WHEN 用户点击表格中的任务行，THE App SHALL 跳转到任务详情页。

---

### 需求 7：时间线视图 ❌ 未开始

**用户故事：** 作为用户，我希望在时间线上查看任务的起止时间，以便了解任务的时间跨度。

#### 验收标准

1. ❌ WHEN 用户进入时间线视图，THE App SHALL 按时间轴渲染有 start_date 或 due_date 的任务条目。
2. ❌ THE App SHALL 支持按周/月切换时间线粒度。
3. ❌ WHEN 用户点击时间线上的任务，THE App SHALL 跳转到任务详情页。

---

### 需求 8：画廊视图 ❌ 未开始

**用户故事：** 作为用户，我希望以卡片网格形式浏览任务，以便获得更直观的视觉体验。

#### 验收标准

1. ❌ WHEN 用户进入画廊视图，THE App SHALL 以两列网格渲染任务卡片。
2. ❌ THE App SHALL 根据当前 TaskView 的 TaskCardConfig 渲染每张卡片的字段和样式。
3. ❌ WHEN 用户点击卡片，THE App SHALL 跳转到任务详情页。

---

### 需求 9：任务详情与编辑 ❌ 未开始

**用户故事：** 作为用户，我希望在移动端拥有一个功能完整、交互流畅的任务编辑页面，能够管理任务的所有细节。

#### 验收标准

**基础信息编辑**

1. ❌ WHEN 用户进入任务详情页，THE App SHALL 调用 `/api/tasks/{uid}/` 获取任务完整数据并展示所有字段。
2. ❌ THE App SHALL 支持内联编辑任务标题。
3. ❌ THE App SHALL 提供富文本内容编辑区，支持 Markdown 语法。
4. ❌ WHEN 用户修改任意字段，THE App SHALL 在用户停止输入 1 秒后自动保存（auto-save）。
5. ❌ THE App SHALL 在页面顶部显示任务的完成状态复选框。

**状态与优先级**

6. ❌ THE App SHALL 提供状态选择器（ActionSheet 形式）。
7. ❌ THE App SHALL 提供优先级选择器（ActionSheet 形式）。
8. ❌ WHEN 任务状态变更为"已完成"，THE App SHALL 自动记录完成时间。

**时间管理**

9. ❌ THE App SHALL 提供开始日期选择器，支持日期+时间精确选择。
10. ❌ THE App SHALL 提供截止日期选择器。
11. ❌ WHEN 截止日期早于开始日期，THE App SHALL 展示内联错误提示，阻止保存。
12. ❌ THE App SHALL 在截止日期旁显示相对时间，逾期任务以红色高亮显示。
13. ❌ THE App SHALL 提供时区选择器。
14. ❌ THE App SHALL 提供快捷日期选项：今天、明天、本周末、下周一。

**项目与分组**

15. ❌ THE App SHALL 提供项目选择器（搜索+列表形式）。
16. ❌ THE App SHALL 支持将任务移动到不同项目。
17. ❌ THE App SHALL 提供自定义分组字段（custom_group）的编辑入口。

**标签**

18. ❌ THE App SHALL 提供标签选择器，支持多选和搜索过滤。
19. ❌ THE App SHALL 在标签选择器底部提供"创建新标签"入口。
20. ❌ THE App SHALL 在任务详情页以彩色 Pill 形式展示已选标签。

**子任务**

21. ❌ THE App SHALL 在任务详情页展示子任务列表。
22. ❌ THE App SHALL 在子任务列表顶部显示完成进度和进度条。
23. ❌ WHEN 用户点击"添加子任务"，THE App SHALL 展示内联输入框快速创建。
24. ❌ WHEN 用户点击子任务的完成复选框，THE App SHALL 乐观更新子任务状态。
25. ❌ WHEN 用户长按子任务，THE App SHALL 展示操作菜单。
26. ❌ WHEN 用户点击子任务标题，THE App SHALL 跳转到该子任务的详情页。

**附件**

27. ❌ THE App SHALL 在任务详情页展示附件列表。
28. ❌ THE App SHALL 提供附件上传入口（相机拍照、相册选图、文件系统选择）。
29. ❌ WHEN 用户上传附件，THE App SHALL 显示上传进度条。
30. ❌ WHEN 用户点击图片附件，THE App SHALL 以全屏预览模式展示。
31. ❌ WHEN 用户长按附件，THE App SHALL 展示操作菜单。

**活动日志**

32. ❌ THE App SHALL 在任务详情页底部展示活动日志。
33. ❌ THE App SHALL 以时间线形式展示活动日志。
34. ❌ THE App SHALL 默认折叠活动日志区域。

**父任务关联**

35. ❌ IF 当前任务有父任务，THEN THE App SHALL 显示父任务标题和跳转链接。
36. ❌ THE App SHALL 支持为任务设置父任务。
37. ❌ THE App SHALL 支持解除父任务关联。

**删除与归档**

38. ❌ WHEN 用户点击删除任务，THE App SHALL 弹出确认对话框。
39. ❌ IF 任务有子任务，THEN THE App SHALL 提示二次确认。
40. ❌ THE App SHALL 支持将任务状态设为"已放弃"作为软删除替代方案。

---

### 需求 10：快速创建任务 ❌ 未开始

**用户故事：** 作为用户，我希望能快速创建任务，以便在灵感出现时立即记录。

#### 验收标准

1. ❌ THE App SHALL 在主界面和任务列表页提供悬浮创建按钮（FAB）。（FAB 组件已有，但未连接创建逻辑）
2. ❌ WHEN 用户点击 FAB，THE App SHALL 展示底部弹出的快速创建表单。
3. ❌ WHEN 用户提交快速创建表单，THE App SHALL 调用 POST `/api/tasks/` 创建任务。
4. ❌ IF 标题为空，THEN THE App SHALL 阻止提交并提示用户填写标题。

---

### 需求 11：项目管理 ❌ 未开始

**用户故事：** 作为用户，我希望管理我的项目（清单），以便对任务进行分类组织。

#### 验收标准

1. ❌ WHEN 用户进入项目页，THE App SHALL 调用 `/api/projects/` 获取项目列表，按 Group 分组展示。
2. ❌ WHEN 用户点击某个项目，THE App SHALL 跳转到项目详情页。
3. ❌ THE App SHALL 支持创建项目。
4. ❌ THE App SHALL 支持编辑项目名称和描述。
5. ❌ WHEN 用户删除项目，THE App SHALL 弹出确认对话框。
6. ❌ THE App SHALL 支持创建和管理 Group（分组）。

---

### 需求 12：视图管理 ❌ 未开始

**用户故事：** 作为用户，我希望创建和管理自定义视图，以便以不同方式查看任务。

#### 验收标准

1. ❌ WHEN 用户进入视图管理页，THE App SHALL 展示所有 TaskView 列表。
2. ❌ THE App SHALL 支持创建视图。
3. ❌ THE App SHALL 支持为视图配置筛选条件。
4. ❌ THE App SHALL 支持为视图配置排序规则。
5. ❌ THE App SHALL 支持为视图选择 TaskCardConfig。
6. ❌ WHEN 用户保存视图配置，THE App SHALL 调用 PATCH `/api/views/{uid}/`。
7. ❌ WHEN 用户删除视图，THE App SHALL 弹出确认对话框。
8. ❌ THE App SHALL 支持复制视图。

---

### 需求 13：任务卡片配置 ❌ 未开始

**用户故事：** 作为用户，我希望自定义任务卡片的字段显示和样式。

#### 验收标准

1. ❌ WHEN 用户进入卡片配置页，THE App SHALL 获取 TaskCardConfig 列表。
2. ❌ THE App SHALL 展示每个 TaskCardConfig 的实时预览卡片。
3. ❌ WHEN 用户选择一个预设配置，THE App SHALL 创建用户自定义副本。
4. ❌ THE App SHALL 支持编辑自定义 TaskCardConfig。
5. ❌ WHEN 用户修改卡片配置，THE App SHALL 实时更新预览卡片。
6. ❌ WHEN 用户保存卡片配置，THE App SHALL 调用 PATCH `/api/card-configs/{uid}/`。
7. ❌ WHEN 用户将某个 TaskCardConfig 应用到视图，THE App SHALL 更新 card_config_uid 字段。

---

### 需求 14：标签管理 ❌ 未开始

**用户故事：** 作为用户，我希望管理颜色标签，以便对任务进行快速分类和视觉标记。

#### 验收标准

1. ❌ THE App SHALL 在设置或项目页提供标签管理入口。
2. ❌ THE App SHALL 支持创建标签。
3. ❌ THE App SHALL 支持编辑标签名称和颜色。
4. ❌ WHEN 用户删除标签，THE App SHALL 弹出确认对话框。

---

### 需求 15：离线与数据同步 🟡 部分完成

**用户故事：** 作为用户，我希望在网络不稳定时仍能查看已缓存的数据。

#### 验收标准

1. ❌ THE Query_Cache SHALL 缓存最近一次成功获取的数据（persistQueryClient 未配置）。
2. ✅ WHILE 设备处于离线状态，THE App SHALL 在界面顶部显示"离线模式"提示。
3. ❌ WHEN 设备恢复网络连接，THE App SHALL 自动触发后台数据刷新。
4. ❌ IF 离线状态下用户尝试写操作，THEN THE App SHALL 提示用户当前处于离线状态。

---

### 需求 16：用户设置 🟡 部分完成

**用户故事：** 作为用户，我希望在设置页管理账号信息和应用偏好。

#### 验收标准

1. ❌ THE App SHALL 提供设置页，展示当前登录用户的用户名和邮箱。
2. ❌ THE App SHALL 支持修改密码。
3. ❌ THE App SHALL 支持深色模式切换。
4. ✅ THE App SHALL 在设置页提供退出登录入口。

---

### 需求 17：任务搜索 ❌ 未开始（Web 端已有）

**用户故事：** 作为用户，我希望在移动端快速搜索任务，以便找到特定的待办事项。

#### 验收标准

1. ❌ THE App SHALL 在主页顶部提供搜索入口。
2. ❌ WHEN 用户输入搜索关键词，THE App SHALL 调用 `/api/tasks/?search=` 进行在线搜索，支持 300ms 防抖。
3. ❌ THE App SHALL 展示搜索结果列表，点击可跳转到任务详情页。
4. ❌ WHEN 搜索关键词为空，THE App SHALL 恢复显示当前视图的任务列表。

---

### 需求 18：Toast 通知系统 ❌ 未开始（Web 端已有）

**用户故事：** 作为用户，我希望在操作成功或失败时获得即时反馈。

#### 验收标准

1. ❌ THE App SHALL 提供全局 Toast 通知组件，支持 success/error/info/warning 四种类型。
2. ❌ WHEN 任务创建/更新/删除成功，THE App SHALL 展示成功 Toast。
3. ❌ WHEN API 调用失败，THE App SHALL 展示错误 Toast，显示具体错误信息。
4. ❌ Toast SHALL 在 3 秒后自动消失，支持手动关闭。

---

### 需求 19：用户初始化 ❌ 未开始（Web 端已有）

**用户故事：** 作为新注册用户，我希望系统自动为我创建初始数据（默认项目、默认视图），以便快速上手。

#### 验收标准

1. ❌ WHEN 新用户首次登录，THE App SHALL 检查用户是否已初始化（调用 `/api/auth/check-initialized/`）。
2. ❌ IF 用户未初始化，THEN THE App SHALL 调用 `/api/auth/initialize/` 创建默认数据。
3. ❌ 初始化完成后，THE App SHALL 刷新所有缓存并展示主界面。

---

### 需求 20：视图模板与卡片样式市场 ❌ 未开始（Web 端已有）

**用户故事：** 作为用户，我希望从预设模板快速创建视图和卡片样式。

#### 验收标准

1. ❌ THE App SHALL 在视图创建页提供"从模板创建"入口。
2. ❌ THE App SHALL 展示视图模板列表，每个模板包含名称、描述、预览。
3. ❌ WHEN 用户选择模板，THE App SHALL 基于模板预填视图配置。
4. ❌ THE App SHALL 在卡片配置页提供预设卡片样式列表。
5. ❌ WHEN 用户选择预设样式，THE App SHALL 创建用户自定义副本。

