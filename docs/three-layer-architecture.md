# 三层模板架构系统

## 架构概述

任务管理系统采用三层模板架构，提供灵活的自定义能力：

```
┌─────────────────────────────────────────────────────────┐
│                    1. 视图（View）                        │
│              定义获取哪些任务（筛选、排序、分组）            │
│                   视图广场 / 视图市场                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                 2. 视图类型（View Type）                   │
│              定义任务展示格局（列表、看板、日历等）           │
│                   类型广场 / 布局市场                      │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                3. 任务卡片（Task Card）                    │
│              定义单个任务的展示样式（紧凑、详细等）           │
│                  卡片广场 / 样式市场                       │
└─────────────────────────────────────────────────────────┘
```

## 第一层：视图（View）

### 功能
- 定义筛选条件（哪些任务）
- 定义排序规则（任务顺序）
- 定义分组方式（任务分组）
- 定义显示设置（显示哪些字段）

### 示例
- 今日任务：筛选今天到期的任务
- 高优先级任务：筛选高优先级和紧急任务
- 本周任务：筛选本周内的任务
- 项目A任务：筛选特定项目的任务

### 入口
- 视图管理页面：`/views`
- 视图市场：`/views/templates`（已实现）
- 创建视图：`/views/create`

## 第二层：视图类型（View Type）

### 功能
- 定义任务的整体布局结构
- 决定任务如何组织和排列
- 提供不同的视觉呈现方式

### 可用类型
1. **列表视图（List）**：传统的垂直列表
2. **看板视图（Board）**：按列分组的卡片
3. **日历视图（Calendar）**：按日期展示
4. **表格视图（Table）**：表格形式展示
5. **时间线视图（Timeline）**：时间轴展示
6. **画廊视图（Gallery）**：网格卡片展示

### 切换方式
- 顶部导航栏"视图类型"按钮（view_module 图标）
- 弹出底部抽屉选择器
- 实时切换，不影响视图的筛选和排序

## 第三层：任务卡片（Task Card）

### 功能
- 定义单个任务的展示样式
- 控制任务信息的显示密度
- 自定义视觉风格和交互效果

### 预设卡片样式

#### 1. 默认卡片（Default）
- 简洁实用的标准样式
- 显示所有关键信息
- 适合日常使用

#### 2. 极简卡片（Minimal）
- 最小化信息展示
- 只显示任务标题和完成状态
- 适合专注模式

#### 3. 详细卡片（Detailed）
- 显示完整的任务信息
- 包含描述、标签、项目等
- 适合需要详细信息的场景

#### 4. 看板卡片（Kanban）
- 紧凑布局
- 适合看板视图
- 优化垂直空间利用

#### 5. 彩色卡片（Colorful）
- 使用颜色突出优先级和状态
- 彩色边框和背景
- 视觉冲击力强

#### 6. 时间线卡片（Timeline）
- 强调时间信息
- 突出显示截止日期
- 适合时间敏感的任务

### 卡片样式配置

每个卡片模板包含以下配置：

```typescript
{
  // 整体样式
  layout: 'compact' | 'comfortable' | 'spacious',
  borderRadius: 'none' | 'small' | 'medium' | 'large',
  shadow: 'none' | 'small' | 'medium' | 'large',
  padding: 'tight' | 'normal' | 'loose',
  
  // 标题样式
  titleSize: 'small' | 'medium' | 'large',
  titleWeight: 'normal' | 'medium' | 'semibold' | 'bold',
  showStrikethrough: boolean,
  
  // 元数据显示
  showProject: boolean,
  showTags: boolean,
  showDueDate: boolean,
  showPriority: boolean,
  showStatus: boolean,
  showSubtasks: boolean,
  showDescription: boolean,
  
  // 元数据样式
  metadataLayout: 'inline' | 'stacked' | 'grid',
  tagStyle: 'pill' | 'badge' | 'minimal',
  iconStyle: 'outlined' | 'filled' | 'rounded',
  
  // 颜色和主题
  priorityIndicator: 'flag' | 'border' | 'background' | 'dot' | 'none',
  statusIndicator: 'badge' | 'border' | 'icon' | 'none',
  
  // 交互
  hoverEffect: 'lift' | 'glow' | 'border' | 'none',
  checkboxStyle: 'circle' | 'square' | 'rounded',
}
```

### 切换方式
- 顶部导航栏"任务卡片"按钮（style 图标）
- 弹出底部抽屉选择器
- 显示卡片预览和特性标签
- 实时切换，不影响视图和类型

## 三层架构的优势

### 1. 灵活性
- 每一层独立配置
- 可以自由组合
- 满足不同场景需求

### 2. 可扩展性
- 每一层都可以添加新模板
- 支持用户自定义
- 支持模板市场

### 3. 用户体验
- 渐进式自定义
- 从简单到复杂
- 满足不同用户需求

### 4. 维护性
- 关注点分离
- 代码结构清晰
- 易于维护和扩展

## 使用场景示例

### 场景1：项目管理
- **视图**：项目A任务（筛选项目A）
- **类型**：看板视图（按状态分列）
- **卡片**：看板卡片（紧凑布局）

### 场景2：每日计划
- **视图**：今日任务（筛选今天到期）
- **类型**：列表视图（按优先级排序）
- **卡片**：详细卡片（显示完整信息）

### 场景3：时间管理
- **视图**：本周任务（筛选本周）
- **类型**：时间线视图（按时间展示）
- **卡片**：时间线卡片（强调时间）

### 场景4：专注模式
- **视图**：高优先级任务（筛选重要任务）
- **类型**：列表视图（简单直接）
- **卡片**：极简卡片（减少干扰）

## 未来扩展

### 视图广场
- 社区分享的视图模板
- 预设的常用视图
- 导入/导出视图配置

### 类型广场
- 更多视图类型（思维导图、甘特图等）
- 自定义布局编辑器
- 响应式布局配置

### 卡片广场
- 更多卡片样式
- 自定义卡片编辑器
- 主题和配色方案
- 动画和过渡效果

## 技术实现

### 文件结构
```
frontend/src/
├── types/
│   ├── index.ts              # 视图类型定义
│   ├── templates.ts          # 视图模板类型
│   └── taskCard.ts           # 任务卡片类型（新增）
├── data/
│   ├── viewTemplates.ts      # 视图模板数据
│   └── taskCardTemplates.ts  # 任务卡片模板数据（待创建）
├── components/
│   ├── ViewRenderer.tsx      # 视图类型渲染器
│   ├── EnhancedTaskList.tsx  # 列表视图
│   ├── KanbanBoard.tsx       # 看板视图
│   ├── CalendarView.tsx      # 日历视图
│   ├── TableView.tsx         # 表格视图
│   ├── TimelineView.tsx      # 时间线视图
│   ├── GalleryView.tsx       # 画廊视图
│   └── TaskCard.tsx          # 任务卡片组件（待创建）
└── pages/
    ├── ViewsPage.tsx         # 视图管理
    ├── ViewTemplateMarketPage.tsx  # 视图市场
    └── HomePage.tsx          # 主页（集成三层架构）
```

### 状态管理
- 当前视图：存储在 URL 参数或本地状态
- 视图类型：存储在视图配置中
- 任务卡片：存储在用户偏好设置中

### API 设计
```typescript
// 视图 API
GET    /api/views/              # 获取视图列表
POST   /api/views/              # 创建视图
GET    /api/views/:uid/         # 获取视图详情
PUT    /api/views/:uid/         # 更新视图
DELETE /api/views/:uid/         # 删除视图

// 视图类型（前端配置，无需 API）

// 任务卡片偏好（用户设置）
GET    /api/user/preferences/   # 获取用户偏好
PUT    /api/user/preferences/   # 更新用户偏好
```

## 总结

三层模板架构提供了强大而灵活的自定义能力：
- **视图**控制"看什么"
- **类型**控制"怎么看"
- **卡片**控制"看多细"

这种设计让用户可以根据不同的工作场景和个人偏好，自由组合出最适合自己的任务管理界面。
