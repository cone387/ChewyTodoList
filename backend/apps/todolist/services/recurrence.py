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

from datetime import datetime, timedelta, timezone as dt_timezone
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


# =========================
# M2: scope 编辑工具
# =========================

@transaction.atomic
def detach_instance(instance: Task) -> Task:
    """把实例从系列断开：清空 recurrence_parent，并把其 due_date 加入模板 exdates。

    用于 PATCH X-Edit-Scope=instance 语义。
    """
    if instance.recurrence_parent_id is None:
        return instance  # 已是普通任务

    template = instance.recurrence_parent
    pivot = instance.due_date or instance.start_date
    if pivot is not None and template is not None:
        exdates = list(template.recurrence_exdates or [])
        iso = pivot.isoformat()
        if iso not in exdates:
            exdates.append(iso)
            template.recurrence_exdates = exdates
            template.save(update_fields=["recurrence_exdates", "updated_at"])

    instance.recurrence_parent = None
    instance.save(update_fields=["recurrence_parent", "updated_at"])
    return instance


@transaction.atomic
def update_series(template: Task, field_patch: dict,
                  tag_uids: Optional[list] = None) -> Task:
    """series scope：把 patch 应用到模板 + 所有未完成 / 未放弃的实例。

    不处理 reminders 输入（调用方自己同步到模板）。
    """
    if not template.is_recurrence_template:
        raise ValueError("update_series 只能作用于模板任务")

    allowed = {
        "title", "content", "priority", "is_all_day",
        "start_date", "due_date", "time_zone",
        "custom_group", "project", "attachments",
    }
    changes = {k: v for k, v in (field_patch or {}).items() if k in allowed}

    for k, v in changes.items():
        setattr(template, k, v)
    if changes:
        template.save()
    if tag_uids is not None:
        template.tags.set(tag_uids)

    # 将同字段应用到所有未完成 / 未放弃的实例
    open_statuses = [Task.TaskStatus.TODO, Task.TaskStatus.UNASSIGNED]
    instances = Task.objects.filter(
        recurrence_parent=template, status__in=open_statuses,
    )
    for inst in instances:
        dirty = False
        for k, v in changes.items():
            # start/due_date 对实例不覆盖（各实例时间由 RRULE 决定），只同步非时间字段
            if k in ("start_date", "due_date"):
                continue
            if getattr(inst, k, None) != v:
                setattr(inst, k, v)
                dirty = True
        if dirty:
            inst.save()
        if tag_uids is not None:
            inst.tags.set(tag_uids)

    return template


@transaction.atomic
def split_series_from(instance: Task, field_patch: dict,
                      tag_uids: Optional[list] = None) -> Task:
    """following scope：从 `instance` 开始拆分系列。

    - 老模板 RRULE 追加 UNTIL=pivot-1us（老系列在 pivot 前结束）
    - 基于老模板拷贝一个新模板（应用 field_patch），DTSTART=pivot
    - `instance` 及其后（recurrence_parent=老模板 且 due_date>=pivot）改挂到新模板下
    - 返回新模板

    注意：已完成 / 放弃的实例保持不动。
    """
    if instance.recurrence_parent_id is None:
        raise ValueError("split_series_from 只能用于重复实例")
    old_template = instance.recurrence_parent
    pivot = instance.due_date or instance.start_date
    if pivot is None:
        raise ValueError("实例缺失 due_date / start_date，无法拆分")

    # 备份老模板原 RRULE（去掉 UNTIL）作为新模板用
    base_rule = _strip_rule_until(old_template.recurrence_rule or "")

    # 老模板 UNTIL 截断 — 把 pivot 之前作为结束
    until_bound = pivot - timedelta(microseconds=1)
    new_old_rule = _apply_rule_until(old_template.recurrence_rule or "", until_bound)
    old_template.recurrence_rule = new_old_rule
    old_template.save(update_fields=["recurrence_rule", "updated_at"])

    # 新模板：拷贝老模板字段并应用 patch
    new_template = Task.objects.create(
        user=old_template.user,
        project=field_patch.get("project", old_template.project),
        title=field_patch.get("title", old_template.title),
        content=field_patch.get("content", old_template.content),
        status=Task.TaskStatus.TODO,
        priority=field_patch.get("priority", old_template.priority),
        custom_group=field_patch.get("custom_group", old_template.custom_group),
        is_all_day=field_patch.get("is_all_day", old_template.is_all_day),
        start_date=field_patch.get("start_date", old_template.start_date),
        due_date=field_patch.get("due_date", old_template.due_date),
        time_zone=field_patch.get("time_zone", old_template.time_zone),
        attachments=field_patch.get("attachments", []),
        recurrence_rule=base_rule,
        recurrence_dtstart=pivot,
        recurrence_exdates=[],
        is_recurrence_template=True,
    )
    # tags
    if tag_uids is not None:
        new_template.tags.set(tag_uids)
    else:
        new_template.tags.set(old_template.tags.all())

    # 复制模板上 pending 的提醒到新模板
    for r in old_template.reminders.filter(status=Reminder.ReminderStatus.PENDING):
        Reminder.objects.create(
            user=r.user, task=new_template,
            type=r.type, trigger_at=r.trigger_at,
            offset_minutes=r.offset_minutes,
            relative_to=r.relative_to,
            status=Reminder.ReminderStatus.PENDING,
        )

    # 把 instance 及以后（open）改挂到新模板
    open_statuses = [Task.TaskStatus.TODO, Task.TaskStatus.UNASSIGNED]
    Task.objects.filter(
        recurrence_parent=old_template, status__in=open_statuses,
        due_date__gte=pivot,
    ).update(recurrence_parent=new_template)

    return new_template


def _apply_rule_until(rule: str, until: datetime) -> str:
    """在 RRULE 字符串上覆盖 / 追加 UNTIL；保持其他字段不变"""
    if not rule:
        return rule
    parts = [seg for seg in rule.split(";") if seg and not seg.upper().startswith("UNTIL=")]
    # dateutil 要求 UNTIL 是 UTC+Z 格式
    until_utc = until.astimezone(dt_timezone.utc) if timezone.is_aware(until) else until
    parts.append(f"UNTIL={until_utc.strftime('%Y%m%dT%H%M%SZ')}")
    # 移除 COUNT（UNTIL 与 COUNT 互斥）
    parts = [p for p in parts if not p.upper().startswith("COUNT=")]
    return ";".join(parts)


def _strip_rule_until(rule: str) -> str:
    """剥离 RRULE 上的 UNTIL（用于拆分时重建新模板）"""
    if not rule:
        return rule
    return ";".join(
        seg for seg in rule.split(";")
        if seg and not seg.upper().startswith("UNTIL=")
    )
