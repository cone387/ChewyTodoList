# 修复 "today" 日期格式错误

## 问题描述

**错误信息**：
```
ValidationError at /api/views/5tPYgOzOSUGoW4h2gdEVJA/tasks/
['"today"的值有一个错误的日期格式。它的格式应该是YYYY-MM-DD HH:MM[:ss[.uuuuuu]][TZ] ']
```

## 问题原因

某个视图的筛选器数据中，`is_today` 操作符的 `value` 字段被设置为字符串 `"today"`，而不是 `null`。

Django 在应用筛选器时，尝试将 `"today"` 解析为日期时间格式，导致验证错误。

## 正确的筛选器格式

对于 `is_today` 等不需要值的操作符，`value` 应该是 `null`：

```json
{
  "id": "filter_1",
  "field": "due_date",
  "operator": "is_today",
  "value": null,  // ✅ 正确：使用 null
  "logic": "and"
}
```

**错误示例**：
```json
{
  "id": "filter_1",
  "field": "due_date",
  "operator": "is_today",
  "value": "today",  // ❌ 错误：不应该是字符串
  "logic": "and"
}
```

## 解决方案

### 方案1：修复数据库中的视图数据（推荐）

运行以下 Django 管理命令来修复所有视图的筛选器数据：

```python
# backend/apps/todolist/management/commands/fix_view_filters.py

from django.core.management.base import BaseCommand
from apps.todolist.models import TaskView

class Command(BaseCommand):
    help = '修复视图筛选器中的日期操作符值'

    def handle(self, *args, **options):
        # 不需要值的操作符列表
        no_value_operators = [
            'is_empty', 'is_not_empty', 'is_today', 'is_yesterday', 'is_tomorrow',
            'is_this_week', 'is_last_week', 'is_next_week', 'is_this_month',
            'is_last_month', 'is_next_month', 'is_overdue', 'has_no_date',
            'is_true', 'is_false'
        ]
        
        fixed_count = 0
        
        for view in TaskView.objects.all():
            if not view.filters:
                continue
            
            modified = False
            for filter_rule in view.filters:
                operator = filter_rule.get('operator')
                if operator in no_value_operators:
                    if filter_rule.get('value') is not None:
                        filter_rule['value'] = None
                        modified = True
                        self.stdout.write(
                            f"修复视图 '{view.name}' 的筛选器: {operator}"
                        )
            
            if modified:
                view.save(update_fields=['filters'])
                fixed_count += 1
        
        self.stdout.write(
            self.style.SUCCESS(f'成功修复 {fixed_count} 个视图的筛选器')
        )
```

运行命令：
```bash
cd backend
python manage.py fix_view_filters
```

### 方案2：在序列化器中强制修复（已实现）

在 `TaskViewSerializer.validate_filters` 方法中，已经添加了强制修复逻辑：

```python
# 对于不需要值的操作符，强制设置value为None
if operator in no_value_operators:
    filter_rule['value'] = None
    filter_rule.pop('value2', None)
```

这会在保存视图时自动修复筛选器数据。

### 方案3：在模型的 apply_filters 方法中添加容错处理

在 `TaskView.apply_filters` 方法中添加容错逻辑：

```python
def apply_filters(self, queryset):
    """应用筛选条件到查询集"""
    if not self.filters:
        return queryset
    
    # ... 现有代码 ...
    
    for filter_rule in self.filters:
        field = filter_rule.get('field')
        op = filter_rule.get('operator')
        value = filter_rule.get('value')
        value2 = filter_rule.get('value2')
        
        # ... 现有代码 ...
        
        # 对于不需要值的操作符，强制设置value为None
        if op in no_value_operators:
            value = None
            value2 = None
        # ... 其余代码 ...
```

这个逻辑已经在代码中实现了（第582-591行）。

## 临时解决方案

如果需要立即修复特定视图，可以通过 Django Admin 或 API 更新视图：

1. **通过 API**：
```bash
curl -X PUT http://localhost:8000/api/views/5tPYgOzOSUGoW4h2gdEVJA/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "filters": [
      {
        "id": "filter_1",
        "field": "due_date",
        "operator": "is_today",
        "value": null,
        "logic": "and"
      }
    ]
  }'
```

2. **通过 Django Shell**：
```python
from apps.todolist.models import TaskView

view = TaskView.objects.get(uid='5tPYgOzOSUGoW4h2gdEVJA')
for filter_rule in view.filters:
    if filter_rule['operator'] == 'is_today':
        filter_rule['value'] = None
view.save()
```

## 预防措施

### 1. 前端验证

在 `CreateViewPage.tsx` 的 `sanitizeFilters` 函数中（已实现）：

```typescript
const sanitizeFilters = (filters: ViewFilter[]): ViewFilter[] => {
  return filters.map(filter => {
    const sanitized = { ...filter };
    
    // 对于不需要值的操作符，确保value为null
    if (filter.operator.startsWith('is_') && 
        ['is_today', 'is_yesterday', 'is_tomorrow', ...].includes(filter.operator)) {
      sanitized.value = null;
      delete sanitized.value2;
    }
    
    return sanitized;
  });
};
```

### 2. 后端验证

在 `TaskViewSerializer.validate_filters` 方法中（已实现）：

```python
# 对于不需要值的操作符，强制设置value为None
if operator in no_value_operators:
    filter_rule['value'] = None
    filter_rule.pop('value2', None)
```

### 3. 模型层容错

在 `TaskView.apply_filters` 方法中（已实现）：

```python
# 对于不需要值的操作符，强制设置value为None
if op in no_value_operators:
    value = None
    value2 = None
```

## 不需要值的操作符列表

以下操作符的 `value` 应该始终为 `null`：

### 日期操作符
- `is_today` - 是今天
- `is_yesterday` - 是昨天
- `is_tomorrow` - 是明天
- `is_this_week` - 是本周
- `is_last_week` - 是上周
- `is_next_week` - 是下周
- `is_this_month` - 是本月
- `is_last_month` - 是上月
- `is_next_month` - 是下月
- `is_overdue` - 已逾期
- `has_no_date` - 无日期

### 布尔操作符
- `is_true` - 为真
- `is_false` - 为假

### 空值操作符
- `is_empty` - 为空
- `is_not_empty` - 不为空

## 测试验证

修复后，测试以下场景：

1. **创建新视图**：
   - 使用 `is_today` 操作符
   - 验证 `value` 自动设置为 `null`

2. **更新现有视图**：
   - 修改筛选器
   - 验证不需要值的操作符的 `value` 被清空

3. **获取视图任务**：
   - 调用 `/api/views/{uid}/tasks/`
   - 验证不再报错

4. **视图列表**：
   - 获取所有视图
   - 验证筛选器数据格式正确

## 总结

这个问题的根本原因是数据不一致：某个视图的筛选器数据中包含了错误的 `value` 值。

通过三层防护：
1. **前端验证**：在提交前清理数据
2. **后端序列化器**：在保存前强制修复
3. **模型层容错**：在应用筛选器时忽略错误值

可以确保这个问题不会再次发生。

建议运行数据修复命令清理现有的错误数据。
