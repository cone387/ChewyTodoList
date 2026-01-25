# Bug修复：不支持的查找操作符 'ne'

## 问题描述

**错误信息**：
```
FieldError at /api/views/feoaCmzBQVytZk71rTesVA/tasks/
Unsupported lookup 'ne' for IntegerField or join on the field not permitted.
```

**错误原因**：
Django ORM 不支持 `__ne`（不等于）查找操作符。

## 问题定位

在 `backend/apps/todolist/models.py` 的 `_build_lookup` 方法中，第679行：

```python
if operator == 'not_equals':
    return {f"{field}__ne": value}  # ❌ 错误：Django不支持__ne
```

## 解决方案

Django 中实现"不等于"查询需要使用 `exclude()` 方法，而不是使用 `__ne` 查找操作符。

### 修复代码

将第679行改为：

```python
if operator == 'not_equals':
    return {f"{field}": value}  # ✅ 正确：使用exclude处理，所以这里用正常的等于
```

### 工作原理

在 `apply_filters` 方法中（第560行），代码已经正确地将 `not_equals` 操作符放入 `exclude_conditions` 列表：

```python
# 需要使用exclude的操作符
if op in ['not_equals', 'not_contains', 'not_in', 'not_between']:
    exclude_conditions.append(Q(**lookup))
else:
    conditions.append(Q(**lookup))
```

然后使用 `queryset.exclude()` 来应用这些条件：

```python
# 应用exclude条件
if exclude_conditions:
    for exclude_condition in exclude_conditions:
        queryset = queryset.exclude(exclude_condition)
```

所以 `_build_lookup` 方法只需要返回正常的等于查询 `{field: value}`，然后由 `exclude()` 方法来实现"不等于"的逻辑。

## 相关操作符

以下操作符都使用 `exclude()` 方法实现：

1. **not_equals**：不等于
   - 返回：`{field: value}`
   - 应用：`queryset.exclude(field=value)`

2. **not_contains**：不包含
   - 返回：`{field__icontains: value}`
   - 应用：`queryset.exclude(field__icontains=value)`

3. **not_in**：不在列表中
   - 返回：`{field__in: value}`
   - 应用：`queryset.exclude(field__in=value)`

4. **not_between**：不在范围内
   - 返回：`{field__range: [value, value2]}`
   - 应用：`queryset.exclude(field__range=[value, value2])`

## Django ORM 查找操作符

Django 支持的查找操作符包括：

- `__exact` 或 空：精确匹配
- `__iexact`：不区分大小写的精确匹配
- `__contains`：包含（区分大小写）
- `__icontains`：包含（不区分大小写）
- `__in`：在列表中
- `__gt`：大于
- `__gte`：大于等于
- `__lt`：小于
- `__lte`：小于等于
- `__startswith`：以...开始
- `__istartswith`：以...开始（不区分大小写）
- `__endswith`：以...结束
- `__iendswith`：以...结束（不区分大小写）
- `__range`：在范围内
- `__isnull`：是否为空
- `__regex`：正则表达式匹配
- `__iregex`：正则表达式匹配（不区分大小写）

**注意**：Django **不支持** `__ne`（不等于）操作符！

## 测试验证

修复后，以下查询应该正常工作：

```python
# 筛选状态不等于"已完成"的任务
view.filters = [
    {
        'field': 'status',
        'operator': 'not_equals',
        'value': TaskStatus.COMPLETED
    }
]
tasks = view.apply_filters(Task.objects.all())
```

这将生成类似以下的SQL：

```sql
SELECT * FROM tasks 
WHERE NOT (status = 2)
```

而不是错误的：

```sql
SELECT * FROM tasks 
WHERE status != 2  -- Django不支持这种语法
```

## 修改文件

- `backend/apps/todolist/models.py` - 第679行

## 影响范围

此修复影响所有使用 `not_equals` 操作符的视图筛选功能。

## 相关问题

如果遇到类似的 `Unsupported lookup` 错误，请检查：

1. 是否使用了Django不支持的查找操作符
2. 是否应该使用 `exclude()` 方法代替
3. 查看Django官方文档确认支持的查找操作符

## 参考资料

- [Django QuerySet API - Field lookups](https://docs.djangoproject.com/en/stable/ref/models/querysets/#field-lookups)
- [Django QuerySet API - exclude()](https://docs.djangoproject.com/en/stable/ref/models/querysets/#exclude)
