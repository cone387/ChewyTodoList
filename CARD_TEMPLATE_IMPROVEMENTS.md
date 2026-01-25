# 卡片模板选择改进

## 改进内容

### 1. 视图类型与卡片样式的严格对应关系

现在卡片样式选择器只显示当前视图类型支持的卡片模板，而不是显示所有模板。

**视图类型与可用卡片模板的对应关系：**

- **列表视图 (list)**
  - 默认卡片
  - 极简卡片
  - 详细卡片
  - 彩色卡片
  - 时间线卡片

- **看板视图 (board)**
  - 看板卡片（默认）
  - 默认卡片
  - 极简卡片
  - 彩色卡片

- **日历视图 (calendar)**
  - 极简卡片（默认）
  - 默认卡片
  - 时间线卡片

- **表格视图 (table)**
  - 极简卡片（默认）
  - 默认卡片

- **时间轴视图 (timeline)**
  - 时间线卡片（默认）
  - 默认卡片
  - 极简卡片

- **画廊视图 (gallery)**
  - 详细卡片（默认）
  - 彩色卡片
  - 默认卡片

### 2. 默认卡片样式标注

每个视图类型都有一个默认的卡片样式，在选择器中会显示"（默认）"标记。

**默认卡片样式：**
- 列表视图 → 默认卡片
- 看板视图 → 看板卡片
- 日历视图 → 极简卡片
- 表格视图 → 极简卡片
- 时间轴视图 → 时间线卡片
- 画廊视图 → 详细卡片

### 3. 智能切换逻辑

当用户切换视图类型时：
- 如果当前选择的卡片样式在新视图类型的可用列表中，保持不变
- 如果当前卡片样式不可用，自动切换到新视图类型的默认卡片样式

**示例：**
1. 用户在列表视图中选择了"详细卡片"
2. 切换到看板视图
3. 因为"详细卡片"不在看板视图的可用列表中
4. 自动切换到"看板卡片"（看板视图的默认样式）

### 4. UI改进

- **移除了卡片预览提示框** - 简化界面，减少视觉干扰
- **提高了MobileSelect的z-index** - 确保弹窗不被其他元素遮挡
- **优化了点击外部关闭逻辑** - 更准确地判断点击位置

## 技术实现

### 核心函数

```typescript
// 获取当前视图类型可用的卡片模板
getAvailableCardTemplates(): TaskCardTemplate[]

// 获取视图类型的默认卡片模板ID
getDefaultCardTemplate(viewType: string): string

// 处理视图类型变化，智能切换卡片模板
handleViewTypeChange(newViewType: string): void
```

### 数据结构

```typescript
// 视图类型与卡片模板的映射
const templatesByViewType: Record<string, string[]> = {
  list: ['default', 'minimal', 'detailed', 'colorful', 'timeline'],
  board: ['kanban', 'default', 'minimal', 'colorful'],
  calendar: ['minimal', 'default', 'timeline'],
  table: ['minimal', 'default'],
  timeline: ['timeline', 'default', 'minimal'],
  gallery: ['detailed', 'colorful', 'default'],
};

// 视图类型的默认卡片模板
const defaultsByViewType: Record<string, string> = {
  list: 'default',
  board: 'kanban',
  calendar: 'minimal',
  table: 'minimal',
  timeline: 'timeline',
  gallery: 'detailed',
};
```

## 用户体验改进

1. **更清晰的选择** - 只显示相关的卡片样式，避免混淆
2. **明确的默认值** - 用户可以清楚地看到哪个是推荐的默认样式
3. **智能的自动调整** - 切换视图类型时自动选择合适的卡片样式
4. **更好的视觉层次** - 移除不必要的提示框，界面更简洁

## 测试场景

### 场景1：创建新视图
1. 选择"列表"视图类型
2. 卡片样式显示5个选项，"默认卡片（默认）"排在第一位
3. 切换到"看板"视图类型
4. 卡片样式自动切换到"看板卡片（默认）"
5. 选项列表更新为4个看板可用的卡片样式

### 场景2：编辑现有视图
1. 打开一个列表视图，当前使用"详细卡片"
2. 切换到"看板"视图类型
3. 因为"详细卡片"不可用，自动切换到"看板卡片（默认）"
4. 切换回"列表"视图类型
5. 保持"看板卡片"（因为它在列表视图的可用列表中）

### 场景3：保持当前选择
1. 打开一个列表视图，当前使用"默认卡片"
2. 切换到"看板"视图类型
3. 保持"默认卡片"（因为它在看板视图的可用列表中）
4. 不会自动切换到"看板卡片"

## 相关文件

- `frontend/src/pages/CreateViewPage.tsx` - 主要逻辑实现
- `frontend/src/types/taskCard.ts` - 卡片模板定义
- `frontend/src/components/MobileSelect.tsx` - 选择器组件
- `CARD_TEMPLATE_SELECTION.md` - 原始功能文档
