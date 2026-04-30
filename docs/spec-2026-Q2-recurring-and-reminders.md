# 2026 Q2 迭代规格 — 重复任务 & 提醒系统

> Status: **Draft** · Owner: TBD · Target: 1 个迭代周期（~1.5 周）· Created: 2026-04-30
>
> 本文档定义 ChewyTodoList 下一次迭代的两项核心能力：**重复任务（Recurring Tasks）** 和 **提醒（Reminders）**。两者强耦合（重复任务天然需要提醒），故一并设计。

---

## 1. 背景与目标

### 1.1 当前缺口
- 现有 `Task` 模型只有单次 `start_date / due_date`，无循环任务语义。
- README 承诺"通知提醒"，但三端均未实现。
- 用户调研中，"每周例会""每月房租""每天喝水"这类场景只能手动复制。

### 1.2 成功指标
- **功能完整性**：可表达 RFC 5545 (iCal) 常见 RRULE（每日/每周/每月/每年 + BYDAY/BYMONTHDAY + COUNT/UNTIL + INTERVAL）。
- **体验一致性**：3 端（Web / iOS / Android）创建/编辑/完成重复任务行为完全一致。
- **可靠性**：重复任务生成的下一次实例误差 < 1 秒；通知触达率 ≥ 95%（本地通知）。
- **零迁移破坏**：现有任务/API 完全兼容，新字段默认空。

---

## 2. 功能范围

### 2.1 Phase A：重复任务

| 能力 | 必须 | 可选 |
|------|------|------|
| 每日 / 每周 / 每月 / 每年 | ✅ | |
| INTERVAL（每 N 天/周/…） | ✅ | |
| BYDAY（周几） | ✅ | |
| BYMONTHDAY（几号） | ✅ | |
| COUNT / UNTIL（终止条件） | ✅ | |
| 法定节假日跳过 | ❌ | v2 |
| 工作日规则 | ✅（BYDAY=MO,TU,WE,TH,FR） | |
| 自定义 RRULE 文本输入 | ❌ | v2 |
| 编辑单次 vs 编辑整个系列 | ✅ | |
| 跳过本次 | ✅ | |

### 2.2 Phase B：提醒
| 能力 | 必须 | 可选 |
|------|------|------|
| 本地通知（Mobile） | ✅ | |
| 浏览器 Notification API（Web） | ✅ | |
| 相对时间提醒（截止前 N 分钟） | ✅ | |
| 绝对时间提醒（指定时间点） | ✅ | |
| 多提醒（一个任务多个提醒） | ✅ | |
| 推送服务（APNs / FCM） | ❌ | v2，先做本地 |
| 邮件提醒 | ❌ | v2 |
| 重复任务自动继承提醒 | ✅ | |

---

## 3. 数据模型

### 3.1 Task 扩展

```python
# backend/apps/todolist/models.py
class Task(BaseModel):
    # ... 现有字段 ...

    # === 新增：重复任务 ===
    recurrence_rule = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name="重复规则",
        help_text="iCalendar RRULE 字符串，如 'FREQ=WEEKLY;BYDAY=MO,WE,FR'"
    )
    recurrence_parent = models.ForeignKey(
        "self", to_field="uid",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="recurrence_children",
        verbose_name="重复系列源任务",
        help_text="指向系列"模板"任务；模板任务本身此字段为 null"
    )
    recurrence_dtstart = models.DateTimeField(
        null=True, blank=True,
        verbose_name="重复起始时间",
        help_text="RRULE 的 DTSTART；通常等于 start_date 或 due_date"
    )
    recurrence_exdates = models.JSONField(
        default=list, blank=True,
        verbose_name="排除日期",
        help_text="被手动跳过的实例日期 ISO 列表"
    )
    is_recurrence_template = models.BooleanField(
        default=False, db_index=True,
        verbose_name="是否重复系列模板",
        help_text="True=模板（不显示于任务列表），False=具体实例"
    )

    class Meta:
        # ... 现有 Meta ...
        indexes = [
            # ... 现有 indexes ...
            models.Index(fields=['user', 'recurrence_parent'], name='task_user_recur_parent_idx'),
            models.Index(fields=['user', 'is_recurrence_template'], name='task_user_recur_tpl_idx'),
        ]
```

**模型语义**：
- **模板任务（template）**：`is_recurrence_template=True`，只存 RRULE，不出现在普通列表；**不计入** `today/overdue/...` 等查询。
- **实例任务（instance）**：`is_recurrence_template=False`，`recurrence_parent` 指向模板；用户看到的就是实例。
- **首个实例**：创建重复任务时一次性生成第一个实例 + 对应模板。
- **下次生成时机**：当前实例被完成 / 被跳过时，后端按 RRULE 计算下一次时间并生成新实例。
- **惰性生成**：不提前生成多个实例，避免"未来 100 个每日任务"污染。

### 3.2 新模型：Reminder

```python
class Reminder(BaseModel):
    """任务提醒"""

    class ReminderType(models.TextChoices):
        ABSOLUTE = "absolute", "绝对时间"     # 2026-05-01 09:00
        RELATIVE = "relative", "相对截止时间"  # 截止前 N 分钟

    class ReminderStatus(models.TextChoices):
        PENDING = "pending", "待触发"
        TRIGGERED = "triggered", "已触发"
        DISMISSED = "dismissed", "已忽略"
        CANCELLED = "cancelled", "已取消"   # 任务删除/完成时

    uid = models.CharField(max_length=22, unique=True, default=generate_uid, editable=False)
    task = models.ForeignKey(
        Task, to_field="uid",
        on_delete=models.CASCADE,
        related_name="reminders"
    )
    type = models.CharField(max_length=16, choices=ReminderType.choices)
    # ABSOLUTE: 使用 trigger_at
    trigger_at = models.DateTimeField(null=True, blank=True, db_index=True)
    # RELATIVE: offset_minutes 分钟前提醒（0=到时提醒；正数=提前；负数=延后）
    offset_minutes = models.IntegerField(null=True, blank=True)
    # 相对基准字段：due_date（默认）或 start_date
    relative_to = models.CharField(max_length=16, default="due_date")

    status = models.CharField(
        max_length=16, choices=ReminderStatus.choices,
        default=ReminderStatus.PENDING, db_index=True
    )
    # 实际触发时间（审计用）
    triggered_at = models.DateTimeField(null=True, blank=True)

    # 客户端 ID（Expo Notifications ID / Web Notification tag），用于取消
    client_notification_id = models.CharField(max_length=128, blank=True)

    class Meta:
        db_table = "ct_reminders"
        indexes = [
            models.Index(fields=["user", "status", "trigger_at"], name="reminder_user_status_at_idx"),
            models.Index(fields=["task", "status"], name="reminder_task_status_idx"),
        ]

    @property
    def effective_trigger_at(self):
        """动态计算最终触发时间"""
        if self.type == self.ReminderType.ABSOLUTE:
            return self.trigger_at
        base = getattr(self.task, self.relative_to, None)
        if base is None or self.offset_minutes is None:
            return None
        return base - timedelta(minutes=self.offset_minutes)
```

### 3.3 迁移策略

1. 新增字段/表，全部默认空/零 → **向后兼容**。
2. 单独 migration `0005_recurring_and_reminders.py`。
3. 现有 `TaskQuerySet.today/overdue/...` 增加过滤：`.filter(is_recurrence_template=False)`。
4. 现有 API response schema 新增可选字段，旧客户端忽略。

---

## 4. API 设计

### 4.1 重复任务

**创建重复任务**（复用现有 `POST /api/v1/tasks/`）：
```json
{
  "title": "每周例会",
  "due_date": "2026-05-05T10:00:00Z",
  "recurrence": {
    "freq": "WEEKLY",
    "interval": 1,
    "byday": ["MO"],
    "until": null,
    "count": null
  },
  "reminders": [
    { "type": "relative", "offset_minutes": 15, "relative_to": "due_date" }
  ]
}
```
后端把 `recurrence` 编码为 RRULE 字符串，创建模板 + 首个实例。返回首个实例 Task（含 `recurrence_parent`）。

**编辑单次**（`PATCH /api/v1/tasks/{uid}/`）：
- 默认行为：仅修改当前实例（脱离系列）。
- 请求头 `X-Edit-Scope: instance | series | following`。
  - `instance`：把当前实例从系列断开（清空 `recurrence_parent`），加入模板 `recurrence_exdates`。
  - `series`：修改模板 + 所有未来实例（按模板重新生成）。
  - `following`：修改当前实例及以后（拆分系列）。

**跳过**：`POST /api/v1/tasks/{uid}/skip/` → 将当前实例 `status=ABANDONED` + 加入模板 `exdates` + 生成下一实例。

**删除**：`DELETE /api/v1/tasks/{uid}/?scope=instance|series|following`。

### 4.2 提醒

**嵌套式**：作为 Task 的 `reminders` 数组一并读写（简化客户端）：
```
GET  /api/v1/tasks/{uid}/           → 返回 task.reminders[]
POST /api/v1/tasks/{uid}/reminders/  → 创建
DELETE /api/v1/reminders/{uid}/      → 删除
```

**即将到来**：`GET /api/v1/reminders/upcoming/?within_minutes=60` → 未来 60 分钟内要触发的 reminders（供客户端轮询/调度）。

**标记已触发**：`POST /api/v1/reminders/{uid}/mark-triggered/`。

### 4.3 响应示例（Task 详情）

```json
{
  "uid": "abc...",
  "title": "每周例会",
  "due_date": "2026-05-05T10:00:00Z",
  "recurrence_parent": "xyz...",
  "recurrence_rule": null,
  "recurrence": {
    "freq": "WEEKLY", "interval": 1, "byday": ["MO"],
    "human": "每周一"
  },
  "reminders": [
    {
      "uid": "r1...",
      "type": "relative", "offset_minutes": 15,
      "relative_to": "due_date",
      "effective_trigger_at": "2026-05-05T09:45:00Z",
      "status": "pending"
    }
  ]
}
```

---

## 5. 调度与通知

### 5.1 后端调度

**方案（P0）**：不起独立调度进程，客户端负责调度。
- Mobile：Expo Notifications 本地调度，`effective_trigger_at` 下发到设备。
- Web：`setTimeout` + Notification API（浏览器开启时触发；不开启则错过，由后端 `upcoming` 端点查询追赶）。
- 优点：零运维；缺点：关闭设备/浏览器的提醒会错过。

**方案（v2）**：引入 Celery + Redis，服务端推送。
- APNs / FCM 各平台适配。
- 本规格不覆盖，留白。

### 5.2 重复任务生成时机

**触发点**：
1. `Task.set_status(COMPLETED)` → 若是重复实例 → 异步生成下一实例。
2. `POST /tasks/{uid}/skip/` → 生成下一实例。
3. 登录时 / 用户发起请求时 → 调用 `TaskViewSet.backfill_recurrences()` 补齐过去遗漏的实例（上限 30 天）。

**实现位置**：`apps/todolist/services/recurrence.py`（新文件）
```python
def generate_next_instance(template: Task, after: datetime) -> Task | None:
    """按 template.recurrence_rule 计算 after 之后的下一次时间，生成实例任务"""
    # 使用 dateutil.rrule 解析 RRULE
    # 拷贝 template 字段 → 新 Task（清零 status、清空 completed_time）
    # recurrence_parent=template
    # 为新实例复制 template.reminders
```

**依赖**：`python-dateutil`（Django 项目通常已有）。

---

## 6. 前端设计（Web）

### 6.1 任务详情页新增模块

在 `TaskDetailPage.tsx` 的属性区，在"截止日期"下方新增：

```
┌─ 重复 ─────────────────────────────┐
│ [不重复 ▾]                          │
└───────────────────────────────────────┘
```

点击展开：
```
不重复 · 每天 · 每周 · 每月 · 每年 · 自定义…
```

选择后显示详情 Chip：
```
┌ 🔁 每周一 ✕ ┐   （点击再次编辑）
```

自定义打开 `<RecurrenceEditor />` 弹窗：
- FREQ 下拉（天/周/月/年）
- INTERVAL 数字（每 N）
- BYDAY 多选（周一至周日，仅 FREQ=WEEKLY 显示）
- BYMONTHDAY 数字（1-31，仅 FREQ=MONTHLY 显示）
- 结束条件单选（永不 / N 次后 / 指定日期）
- 底部实时预览："每周 周一、周三 · 共 10 次 · 下次 2026-05-05"

### 6.2 提醒模块

截止日期下方同列位置新增：
```
┌─ 提醒 ─────────────────────────────┐
│ [+ 添加提醒]                        │
└───────────────────────────────────────┘
```

添加提醒弹窗：
- 单选：在截止前 / 指定时间
- 相对：快捷 Chip（5 分钟 / 15 分钟 / 1 小时 / 1 天 / 自定义数字 + 单位）
- 绝对：DateTimePicker
- 可添加多条，展示为 Chip 列表

### 6.3 任务卡片可视化

- 重复任务卡片右上角加 🔁 图标（`TaskCardRenderer` 增字段 `recurrence_icon`）。
- 有提醒加 🔔 图标。
- 用户可通过卡片配置开关显隐。

### 6.4 完成 / 跳过交互

重复实例点击完成时：
- 直接完成 → 当前实例进已完成 → 自动生成下一实例并加入列表（顶部 Toast："已完成本次，下次 5 月 12 日 10:00"）。
- 长按/菜单 → 选项 "跳过本次"。

重复实例编辑/删除时弹出确认：
```
┌─────────────────────┐
│ 这是重复任务         │
│ ○ 仅本次             │
│ ● 本次及后续所有     │
│ ○ 所有重复任务       │
│ [取消] [确定]        │
└─────────────────────┘
```

---

## 7. 前端设计（Mobile）

与 Web 同构，复用组件思路：
- **RecurrencePicker**（底部 ActionSheet，分段控制器 FREQ + BYDAY 网格 + 预览）。
- **ReminderSheet**（底部 ActionSheet，快捷时长 Chip + 自定义）。
- 进入任务详情 Modal 时，属性区最后增 "🔁 重复" + "🔔 提醒" 两行。

### 7.1 本地通知（Expo Notifications）

```ts
// mobile/hooks/useReminderScheduler.ts
import * as Notifications from 'expo-notifications';

export function useReminderScheduler() {
  const scheduleReminder = async (reminder: Reminder, task: Task) => {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: task.title,
        body: task.content ?? '任务提醒',
        data: { taskUid: task.uid, reminderUid: reminder.uid },
      },
      trigger: new Date(reminder.effective_trigger_at),
    });
    // 回传 id 到后端，便于取消
    await api.reminders.update(reminder.uid, { client_notification_id: id });
  };

  const cancelReminder = async (reminder: Reminder) => {
    if (reminder.client_notification_id) {
      await Notifications.cancelScheduledNotificationAsync(reminder.client_notification_id);
    }
  };
  return { scheduleReminder, cancelReminder };
}
```

**触发入口**：
- Reminder 创建 / 修改 → `scheduleReminder`
- Reminder 删除 / 任务完成 / 任务删除 → `cancelReminder`
- App 启动 → 拉取 `upcoming`，对缺失的本地调度重新补齐

**权限**：首次进入任务详情时请求通知权限（`Notifications.requestPermissionsAsync`），拒绝则显示提示横幅。

### 7.2 点击通知跳转

`app/_layout.tsx` 监听：
```ts
Notifications.addNotificationResponseReceivedListener(response => {
  const taskUid = response.notification.request.content.data.taskUid;
  router.push(`/task/${taskUid}`);
});
```

---

## 8. 测试策略

### 8.1 后端单测（`apps/todolist/tests_recurrence.py`）

- ✅ 创建 `FREQ=DAILY` 任务 → 完成 → 下次实例 `due_date += 1 day`
- ✅ `FREQ=WEEKLY;BYDAY=MO,WE,FR` → 按序生成周一、周三、周五
- ✅ `COUNT=3` → 完成 3 次后不再生成
- ✅ `UNTIL=2026-06-01` → 超过后不再生成
- ✅ 跳过本次 → exdate 加入 + 下次实例正确
- ✅ 编辑单次不影响模板
- ✅ 编辑 series 更新所有未完成实例
- ✅ 删除 series 级联删除模板 + 所有未完成实例
- ✅ 时区边界（23:59 完成 + DAILY 不生成重复实例）

### 8.2 提醒单测

- ✅ 相对提醒：task.due_date 变 → effective_trigger_at 跟随变化
- ✅ 绝对提醒：trigger_at 到点 status=triggered
- ✅ 任务完成 → 所有 pending reminders 变 cancelled
- ✅ 重复实例生成时继承模板 reminders

### 8.3 E2E（Mobile，Maestro）

- ✅ 创建"每日喝水" → 设置截止 21:00 → 断开网络 → 等到 21:00 收到通知 → 点击回到任务
- ✅ 完成重复任务 → 列表自动显示明日新实例

---

## 9. 推进计划

### 里程碑

| 阶段 | 工作量 | 交付物 |
|------|--------|--------|
| M1 后端模型 + 迁移 + 单测 | 2 d | Task/Reminder migration + RRULE 生成服务 + 覆盖 ≥ 85% |
| M2 后端 API + 编辑 scope | 1 d | PATCH/DELETE with scope + /skip/ + /reminders/upcoming/ |
| M3 Web UI（重复 + 提醒） | 2 d | RecurrenceEditor + ReminderSheet + 卡片图标 |
| M4 Mobile UI + 本地通知 | 2 d | Picker + Scheduler + 通知跳转 |
| M5 联调 + 回归 + 验收 | 1-1.5 d | 3 端 feature parity |

**总工期**：约 8-9 工作日。

### 依赖

- 后端：`python-dateutil`（通常已在）
- Mobile：`expo-notifications`（已装，见 package.json）
- Web：无新依赖，使用浏览器原生 Notification API

### 风险

| 风险 | 缓解 |
|------|------|
| RRULE 边界 bug（闰年 / 月末 / DST） | 用 `dateutil.rrule` 而非自研；单测覆盖 |
| 本地通知触达率受系统省电策略影响 | 文档中声明"本地方案的可靠性限制"，v2 引入推送 |
| 用户期待"邮件提醒"但未做 | UI 中"提醒方式"先只展示"系统通知"，预留扩展点 |
| Web 关页后错过 | 登录后调用 /upcoming/ 显示"错过的提醒" Banner |

---

## 10. 验收清单（QA Checklist）

### 10.1 重复任务
- [ ] 所有 FREQ（D/W/M/Y）至少各有一个预设可创建
- [ ] BYDAY 支持多选，不同 FREQ 下显示对应字段
- [ ] 结束条件（永不 / N 次 / 指定日期）生效
- [ ] 模板任务不出现在"今日/逾期/本周"视图
- [ ] 完成实例自动生成下一个，且新实例的 reminders 被重新调度
- [ ] 编辑单次不污染系列；编辑系列全量生效；编辑"及以后"正确断链
- [ ] 删除确认弹窗在 3 端文案一致
- [ ] 跨时区：用户切换时区后展示时间正确

### 10.2 提醒
- [ ] 新建任务设 1 条相对提醒 → 到时 Mobile 弹本地通知
- [ ] 新建任务设 2 条提醒（15 分钟前 + 截止时）→ 两次都收到
- [ ] 编辑 due_date → 相对提醒 trigger_at 自动变化
- [ ] 任务完成 → pending 提醒变 cancelled，不再弹出
- [ ] 任务删除 → 本地调度同步取消
- [ ] Web 点击通知跳转任务详情
- [ ] Mobile 系统关通知权限 → UI 显示引导横幅

### 10.3 跨端一致
- [ ] iOS / Android / Web 同一任务显示同一 RRULE 文案
- [ ] 编辑 scope 语义 3 端一致
- [ ] API 响应 schema 对旧客户端不破坏

---

## 11. 开放问题（待决策）

1. **重复任务未完成会堆积吗？** —— 建议：**堆积**（不偷偷跳过，用户决定）。但需加 UI"清理所有逾期"按钮。
2. **一个任务最多几条提醒？** —— 建议上限 5 条。
3. **Mobile 通知权限拒绝后的降级** —— 建议：展示横幅 + 设置页可跳转系统设置。
4. **重复任务模板也能独立编辑吗？** —— 建议：**否**。所有编辑都通过任一实例（附 scope 头）。
5. **Web 无独立调度进程，下次登录时应该补弹过去的提醒吗？** —— 建议：**登录后 5 分钟窗口内的 pending reminders 补弹一次**，更早的只在"错过的提醒"列表中显示。

---

## 12. 不在本次范围

- 推送服务（APNs / FCM） → v2
- 邮件 / Slack / webhook 提醒 → v2
- 日历订阅（CalDAV 导出重复任务） → v3
- 法定节假日自动跳过 → v2
- 番茄钟 / 专注模式 → 独立 feature
- 对重复任务的统计（连续天数等） → 独立 feature

---

> **下一步**：本文档确认后，对照 §9 里程碑开 issue，按 M1 → M5 顺序推进；M1 完成后进行一次代码评审再继续。
