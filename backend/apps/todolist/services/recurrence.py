"""
重复任务生成服务

核心概念：
- 模板任务（template）：is_recurrence_template=True，只携带 RRULE 字符串，
  不会出现在 today / overdue 等普通列表中。
- 实例任务（instance）：is_recurrence_template=False，recurrence_parent 指向模板，
  具体的一次待办。
- 惰性生成：一个系列一次只存在一个"当前实例"；当该实例被完成或跳过时，
  按 RRULE 计算下一次时间，生成新实例。

参考：docs/spec-2026-Q2-recurring-and-reminders.md §5
"""
from __future__ import annotations

from datetime import datetime, timedelta
from typing import Optional

from django.db import transaction
from django.utils import timezone

try:
    from dateutil.rrule import rrulestr
except ImportError:  # pragma: no cover
    rrulestr = None  # 未安装 python-dateutil 时，相关功能会抛错

from ..models import Reminder, Task


def compute_next_occurrence(rule: str, dtstart: datetime, after: datetime,
                            exdates: Optional[list[str]] = None) -> Optional[datetime]:
    """
    按 RRULE 计算 `after` 之后、不在 exdates 列表中的下一次时间。

    Args:
        rule: iCalendar RRULE 字符串，如 "FREQ=WEEKLY;BYDAY=MO,WE,FR"
        dtstart: 系列起始时间（DTSTART）
        after: 从此时间点之后查找下一次
        exdates: 被跳过的日期（ISO 字符串列表），这些时间点将被略过

    Returns:
        下一次时间（aware datetime），若 RRULE 已结束则返回 None
    """
    if rrulestr is None:
        raise RuntimeError(
            "python-dateutil is required for recurrence. "
            "Install via: uv pip install python-dateutil"
        )

    rr = rrulestr(rule, dtstart=dtstart)
    excluded = set()
    if exdates:
        for iso in exdates:
            try:
                excluded.add(datetime.fromisoformat(iso))
            except ValueError:
                continue

    # dateutil.rrule.after() 含等号控制：inc=False 表示严格 >after
    nxt = rr.after(after, inc=False)
    while nxt is not None and nxt in excluded:
        nxt = rr.after(nxt, inc=False)
    return nxt


@transaction.atomic
def generate_next_instance(template: Task, after: Optional[datetime] = None) -> Optional[Task]:
    """
    按 template.recurrence_rule 计算 after 之后的下一次时间，创建实例任务。

    - 复制 template 的主要字段（title/content/priority/project/tags/reminders 等）
    - 将新实例的 due_date / start_date 移动到下一次时间
    - 实例的 recurrence_parent 指向模板，is_recurrence_template=False
    - 若模板无更多次（例如 COUNT/UNTIL 已到期），返回 None 且不创建

    Args:
        template: 模板任务（必须 is_recurrence_template=True）
        after: 从此时间点之后查找；默认取模板的 recurrence_dtstart 或 now

    Returns:
        新实例 Task，或 None（无下一次）
    """
    if not template.is_recurrence_template:
        raise ValueError("generate_next_instance 只能作用于模板任务")
    if not template.recurrence_rule:
        raise ValueError("模板任务缺失 recurrence_rule")

    dtstart = template.recurrence_dtstart or template.due_date or template.start_date
    if dtstart is None:
        raise ValueError("模板任务缺失 DTSTART（需要 recurrence_dtstart/due_date/start_date 之一）")

    base = after or dtstart
    if timezone.is_naive(base):
        base = timezone.make_aware(base)
    if timezone.is_naive(dtstart):
        dtstart = timezone.make_aware(dtstart)

    next_at = compute_next_occurrence(
        template.recurrence_rule, dtstart, base, template.recurrence_exdates
    )
    if next_at is None:
        return None

    # 计算新实例的 start_date / due_date 偏移
    # 策略：保持 due_date - start_date 的间距
    new_due = next_at if template.due_date else None
    new_start = None
    if template.start_date and template.due_date:
        delta = template.due_date - template.start_date
        new_start = next_at - delta
    elif template.start_date and not template.due_date:
        new_start = next_at

    # 创建新实例（与模板解耦关键字段）
    instance = Task.objects.create(
        user=template.user,
        project=template.project,
        parent=None,                       # 重复实例不继承父子关系
        title=template.title,
        content=template.content,
        status=Task.TaskStatus.TODO,
        priority=template.priority,
        custom_group=template.custom_group,
        is_all_day=template.is_all_day,
        start_date=new_start,
        due_date=new_due,
        time_zone=template.time_zone,
        attachments=[],                    # 附件不复制（避免文件引用混乱）
        recurrence_rule=None,              # 实例不持有规则
        recurrence_parent=template,
        recurrence_dtstart=None,
        recurrence_exdates=[],
        is_recurrence_template=False,
    )
    instance.tags.set(template.tags.all())

    # 复制提醒（仍为 pending，effective_trigger_at 会跟随新 due_date）
    for r in template.reminders.filter(status=Reminder.ReminderStatus.PENDING):
        Reminder.objects.create(
            user=r.user,
            task=instance,
            type=r.type,
            trigger_at=r.trigger_at,
            offset_minutes=r.offset_minutes,
            relative_to=r.relative_to,
            status=Reminder.ReminderStatus.PENDING,
        )

    return instance


@transaction.atomic
def skip_instance(instance: Task) -> Optional[Task]:
    """
    跳过当前重复实例：
    1. 当前实例标记 ABANDONED
    2. 把当前实例的 due_date 加入模板 exdates
    3. 生成下一实例

    Returns:
        新生成的下一实例（若系列已结束则 None）
    """
    if instance.recurrence_parent is None:
        raise ValueError("skip_instance 只能用于重复实例")

    template = instance.recurrence_parent
    pivot = instance.due_date or instance.start_date
    if pivot is not None:
        exdates = list(template.recurrence_exdates or [])
        iso = pivot.isoformat()
        if iso not in exdates:
            exdates.append(iso)
            template.recurrence_exdates = exdates
            template.save(update_fields=["recurrence_exdates", "updated_at"])

    # 当前实例置为 ABANDONED（保留历史可见）
    instance.status = Task.TaskStatus.ABANDONED
    instance.completed_time = None
    instance.save(update_fields=["status", "completed_time", "updated_at"])

    # 取消该实例尚未触发的提醒
    instance.reminders.filter(status=Reminder.ReminderStatus.PENDING).update(
        status=Reminder.ReminderStatus.CANCELLED,
    )

    return generate_next_instance(template, after=pivot or timezone.now())


@transaction.atomic
def handle_instance_completed(instance: Task) -> Optional[Task]:
    """
    当重复实例被完成时调用：
    - 若该任务是重复实例（recurrence_parent 非空），生成下一实例
    - 该实例本身的 COMPLETED 状态由调用方在外部保存完成
    - 取消该实例上尚未触发的提醒

    Returns:
        新生成的下一实例（若系列已结束则 None）
    """
    if instance.recurrence_parent is None:
        return None  # 非重复任务，什么都不做

    template = instance.recurrence_parent
    pivot = instance.completed_time or timezone.now()

    # 取消该实例尚未触发的提醒
    instance.reminders.filter(status=Reminder.ReminderStatus.PENDING).update(
        status=Reminder.ReminderStatus.CANCELLED,
    )

    # 基于实例的 due_date / start_date 定位下次时间，而非 completed_time
    # 避免提前完成时把下一次也一起"吃掉"
    anchor = instance.due_date or instance.start_date or pivot
    return generate_next_instance(template, after=anchor)


@transaction.atomic
def create_recurring_task(user, *, title: str, recurrence_rule: str,
                          dtstart: datetime,
                          project=None,
                          is_all_day: bool = True,
                          start_date: Optional[datetime] = None,
                          due_date: Optional[datetime] = None,
                          **extra_fields) -> tuple[Task, Task]:
    """
    创建重复任务：一次性生成模板 + 首个实例。

    Returns:
        (template, first_instance)
    """
    if rrulestr is None:
        raise RuntimeError("python-dateutil is required for recurrence.")

    # 验证 RRULE 能解析
    rrulestr(recurrence_rule, dtstart=dtstart)

    # 创建模板任务
    template = Task.objects.create(
        user=user,
        project=project,
        title=title,
        is_all_day=is_all_day,
        start_date=start_date,
        due_date=due_date,
        recurrence_rule=recurrence_rule,
        recurrence_dtstart=dtstart,
        recurrence_exdates=[],
        is_recurrence_template=True,
        status=Task.TaskStatus.TODO,
        **{k: v for k, v in extra_fields.items() if k not in (
            'recurrence_rule', 'recurrence_dtstart', 'recurrence_exdates',
            'is_recurrence_template', 'recurrence_parent',
        )},
    )

    # 生成首个实例（after=dtstart - 1ms 使首次 DTSTART 也被 after() 认为合法）
    first = generate_next_instance(template, after=dtstart - timedelta(microseconds=1))
    return template, first
