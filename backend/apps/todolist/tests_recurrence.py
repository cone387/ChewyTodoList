"""
重复任务 + 提醒 单元测试（M1）

覆盖：
- RRULE 生成（DAILY / WEEKLY / MONTHLY / COUNT / UNTIL）
- 完成一个实例 → 自动生成下一实例
- 跳过一个实例 → exdates 记录 + 下一实例
- 已完成的实例上的 pending 提醒被取消
- 新实例继承模板的提醒
- 重复模板不出现在普通查询集中
- Reminder.effective_trigger_at 随 task.due_date 变化
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from .models import Reminder, Task
from .services.recurrence import (
    compute_next_occurrence,
    create_recurring_task,
    generate_next_instance,
    handle_instance_completed,
    skip_instance,
)


User = get_user_model()


def _make_user(username="recur_user"):
    return User.objects.create_user(
        username=username, email=f"{username}@test.local", password="pw123456",
    )


class RRuleOccurrenceTests(TestCase):
    """测试 compute_next_occurrence"""

    def test_daily_next(self):
        dtstart = timezone.make_aware(timezone.datetime(2026, 5, 1, 9, 0))
        nxt = compute_next_occurrence("FREQ=DAILY", dtstart, dtstart)
        self.assertEqual(nxt, dtstart + timedelta(days=1))

    def test_weekly_mon_wed_fri(self):
        # 2026-05-01 是周五
        dtstart = timezone.make_aware(timezone.datetime(2026, 5, 1, 9, 0))  # Fri
        # 下一次 = 下周一 5/4
        nxt = compute_next_occurrence("FREQ=WEEKLY;BYDAY=MO,WE,FR", dtstart, dtstart)
        self.assertEqual(nxt.date(), timezone.datetime(2026, 5, 4).date())

        # 再下一次 = 5/6（周三）
        nxt2 = compute_next_occurrence("FREQ=WEEKLY;BYDAY=MO,WE,FR", dtstart, nxt)
        self.assertEqual(nxt2.date(), timezone.datetime(2026, 5, 6).date())

    def test_count_limit(self):
        dtstart = timezone.make_aware(timezone.datetime(2026, 5, 1, 9, 0))
        # COUNT=3 表示共 3 次（含首次），所以第 3 次之后不再生成
        rule = "FREQ=DAILY;COUNT=3"
        occs = [dtstart]
        while True:
            nxt = compute_next_occurrence(rule, dtstart, occs[-1])
            if nxt is None:
                break
            occs.append(nxt)
        self.assertEqual(len(occs), 3)

    def test_until_limit(self):
        dtstart = timezone.make_aware(timezone.datetime(2026, 5, 1, 9, 0))
        # UNTIL 必须是 UTC+Z 格式
        rule = "FREQ=DAILY;UNTIL=20260503T000000Z"
        nxts = []
        cur = dtstart
        while True:
            nxt = compute_next_occurrence(rule, dtstart, cur)
            if nxt is None:
                break
            nxts.append(nxt)
            cur = nxt
        # 5/1 首次、5/2 第二次 — 5/3 00:00 UNTIL 之后不再生成
        self.assertEqual(len(nxts), 1)  # compute_next 是 after()，不含 dtstart 自身

    def test_exdates_skipped(self):
        dtstart = timezone.make_aware(timezone.datetime(2026, 5, 1, 9, 0))
        # 跳过 5/2（下一次），期望直接返回 5/3
        nxt = compute_next_occurrence(
            "FREQ=DAILY", dtstart, dtstart,
            exdates=[(dtstart + timedelta(days=1)).isoformat()],
        )
        self.assertEqual(nxt.date(), (dtstart + timedelta(days=2)).date())


class CreateRecurringTaskTests(TestCase):
    """测试 create_recurring_task"""

    def setUp(self):
        self.user = _make_user()

    def test_creates_template_and_first_instance(self):
        dtstart = timezone.now().replace(microsecond=0) + timedelta(days=1)
        template, first = create_recurring_task(
            self.user,
            title="每日喝水",
            recurrence_rule="FREQ=DAILY",
            dtstart=dtstart,
            due_date=dtstart,
        )
        self.assertTrue(template.is_recurrence_template)
        self.assertFalse(first.is_recurrence_template)
        self.assertEqual(first.recurrence_parent, template)
        self.assertEqual(first.due_date, dtstart)
        # 模板不出现在 today / uncompleted
        self.assertNotIn(template, list(Task.objects.uncompleted()))

    def test_template_hidden_from_common_querysets(self):
        dtstart = timezone.now().replace(microsecond=0)
        template, first = create_recurring_task(
            self.user,
            title="每日",
            recurrence_rule="FREQ=DAILY",
            dtstart=dtstart,
            due_date=dtstart,
        )
        self.assertNotIn(template, list(Task.objects.today()))
        self.assertNotIn(template, list(Task.objects.this_week()))
        self.assertIn(template, list(Task.objects.templates()))


class CompletionAndSkipTests(TestCase):
    """测试 handle_instance_completed / skip_instance"""

    def setUp(self):
        self.user = _make_user()
        self.dtstart = timezone.now().replace(microsecond=0) + timedelta(days=1)
        self.template, self.first = create_recurring_task(
            self.user,
            title="每日任务",
            recurrence_rule="FREQ=DAILY",
            dtstart=self.dtstart,
            due_date=self.dtstart,
        )

    def test_complete_generates_next_instance(self):
        self.first.completed_time = timezone.now()
        self.first.status = Task.TaskStatus.COMPLETED
        self.first.save()

        nxt = handle_instance_completed(self.first)
        self.assertIsNotNone(nxt)
        self.assertEqual(nxt.recurrence_parent, self.template)
        self.assertEqual(nxt.due_date.date(), (self.dtstart + timedelta(days=1)).date())

    def test_complete_non_recurring_returns_none(self):
        plain = Task.objects.create(user=self.user, title="普通任务")
        self.assertIsNone(handle_instance_completed(plain))

    def test_skip_records_exdate_and_generates_next(self):
        nxt = skip_instance(self.first)
        self.template.refresh_from_db()
        self.assertEqual(len(self.template.recurrence_exdates), 1)
        self.assertEqual(self.template.recurrence_exdates[0], self.dtstart.isoformat())
        self.assertIsNotNone(nxt)
        # 下一实例跳过了 dtstart 本身，= dtstart + 1 day
        self.assertEqual(nxt.due_date.date(), (self.dtstart + timedelta(days=1)).date())
        self.first.refresh_from_db()
        self.assertEqual(self.first.status, Task.TaskStatus.ABANDONED)

    def test_skip_requires_recurring_instance(self):
        plain = Task.objects.create(user=self.user, title="普通任务")
        with self.assertRaises(ValueError):
            skip_instance(plain)

    def test_count_3_terminates_after_3_instances(self):
        """COUNT=3 的系列 — 完成 3 次后不再生成"""
        # 重建一个带 COUNT 的模板
        dtstart = timezone.now().replace(microsecond=0) + timedelta(days=2)
        tpl, first = create_recurring_task(
            self.user,
            title="3 次任务",
            recurrence_rule="FREQ=DAILY;COUNT=3",
            dtstart=dtstart,
            due_date=dtstart,
        )
        # 完成第 1 次
        first.status = Task.TaskStatus.COMPLETED
        first.completed_time = timezone.now()
        first.save()
        second = handle_instance_completed(first)
        self.assertIsNotNone(second)

        # 完成第 2 次
        second.status = Task.TaskStatus.COMPLETED
        second.completed_time = timezone.now()
        second.save()
        third = handle_instance_completed(second)
        self.assertIsNotNone(third)

        # 完成第 3 次 — 应无下一次
        third.status = Task.TaskStatus.COMPLETED
        third.completed_time = timezone.now()
        third.save()
        fourth = handle_instance_completed(third)
        self.assertIsNone(fourth)


class RemindersOnRecurringTests(TestCase):
    """测试提醒在重复任务中的行为"""

    def setUp(self):
        self.user = _make_user()
        self.dtstart = timezone.now().replace(microsecond=0) + timedelta(days=1)
        self.template, self.first = create_recurring_task(
            self.user,
            title="需要提醒的任务",
            recurrence_rule="FREQ=DAILY",
            dtstart=self.dtstart,
            due_date=self.dtstart,
        )
        # 给模板绑定一条提醒（截止前 15 分钟）
        self.template_reminder = Reminder.objects.create(
            user=self.user,
            task=self.template,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=15,
            relative_to=Reminder.RelativeTo.DUE_DATE,
        )

    def test_new_instance_inherits_reminders(self):
        # setUp 里 first 在 template_reminder 之前已创建，first 没有 reminder
        # 但完成 first 后 → generate_next_instance 会从 template 复制 pending reminder 给 nxt
        self.first.status = Task.TaskStatus.COMPLETED
        self.first.completed_time = timezone.now()
        self.first.save()
        nxt = handle_instance_completed(self.first)
        self.assertEqual(
            nxt.reminders.filter(status=Reminder.ReminderStatus.PENDING).count(), 1,
            "下一实例应继承 template 上的 pending reminder",
        )
        # 再生成一次仍然继承
        nxt2 = generate_next_instance(self.template, after=nxt.due_date)
        self.assertEqual(nxt2.reminders.filter(
            status=Reminder.ReminderStatus.PENDING,
        ).count(), 1)

    def test_completed_instance_pending_reminders_cancelled(self):
        # 给 first 实例额外加一条提醒
        r = Reminder.objects.create(
            user=self.user,
            task=self.first,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=30,
        )
        self.assertEqual(r.status, Reminder.ReminderStatus.PENDING)

        self.first.status = Task.TaskStatus.COMPLETED
        self.first.completed_time = timezone.now()
        self.first.save()
        handle_instance_completed(self.first)

        r.refresh_from_db()
        self.assertEqual(r.status, Reminder.ReminderStatus.CANCELLED)

    def test_relative_effective_trigger_follows_due_date(self):
        task = Task.objects.create(
            user=self.user, title="普通任务",
            due_date=timezone.now() + timedelta(hours=2),
        )
        r = Reminder.objects.create(
            user=self.user, task=task,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=15,
        )
        self.assertAlmostEqual(
            (task.due_date - r.effective_trigger_at).total_seconds(),
            15 * 60,
            delta=1,
        )

        # 改 due_date，effective_trigger_at 跟随
        task.due_date = task.due_date + timedelta(days=1)
        task.save()
        r.refresh_from_db()
        self.assertAlmostEqual(
            (task.due_date - r.effective_trigger_at).total_seconds(),
            15 * 60,
            delta=1,
        )

    def test_absolute_reminder_uses_trigger_at(self):
        trigger = timezone.now() + timedelta(hours=3)
        task = Task.objects.create(user=self.user, title="T")
        r = Reminder.objects.create(
            user=self.user, task=task,
            type=Reminder.ReminderType.ABSOLUTE,
            trigger_at=trigger,
        )
        self.assertEqual(r.effective_trigger_at, trigger)

    def test_reminder_cancel_method(self):
        task = Task.objects.create(user=self.user, title="T")
        r = Reminder.objects.create(
            user=self.user, task=task,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=0,
        )
        r.cancel()
        r.refresh_from_db()
        self.assertEqual(r.status, Reminder.ReminderStatus.CANCELLED)

        # 再次 cancel 是幂等的（已 CANCELLED 不会变 PENDING）
        r.cancel()
        r.refresh_from_db()
        self.assertEqual(r.status, Reminder.ReminderStatus.CANCELLED)

    def test_reminder_mark_triggered(self):
        task = Task.objects.create(user=self.user, title="T")
        r = Reminder.objects.create(
            user=self.user, task=task,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=0,
        )
        self.assertIsNone(r.triggered_at)
        r.mark_triggered()
        r.refresh_from_db()
        self.assertEqual(r.status, Reminder.ReminderStatus.TRIGGERED)
        self.assertIsNotNone(r.triggered_at)


class TimezoneEdgeCasesTests(TestCase):
    """时区边界测试"""

    def setUp(self):
        self.user = _make_user()

    def test_aware_dtstart_accepted(self):
        dtstart = timezone.now() + timedelta(days=1)
        self.assertTrue(timezone.is_aware(dtstart))
        template, first = create_recurring_task(
            self.user, title="tz",
            recurrence_rule="FREQ=DAILY",
            dtstart=dtstart,
            due_date=dtstart,
        )
        self.assertTrue(timezone.is_aware(first.due_date))

    def test_dst_crossing_not_regressing(self):
        """简单健康检查：两次生成后时间不会回退"""
        dtstart = timezone.now().replace(microsecond=0)
        tpl, first = create_recurring_task(
            self.user, title="dst",
            recurrence_rule="FREQ=DAILY",
            dtstart=dtstart,
            due_date=dtstart,
        )
        second = generate_next_instance(tpl, after=first.due_date)
        third = generate_next_instance(tpl, after=second.due_date)
        self.assertLess(first.due_date, second.due_date)
        self.assertLess(second.due_date, third.due_date)


# =========================
# API-Level Tests（M2）
# =========================

from rest_framework.test import APITestCase, APIClient
from rest_framework_simplejwt.tokens import RefreshToken


def _api_client(user):
    client = APIClient()
    token = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {token.access_token}")
    return client


class RecurrenceAPITests(APITestCase):
    """通过 HTTP 接口测试重复任务 scope 编辑、skip、完成生成下一实例"""

    def setUp(self):
        self.user = _make_user("api_recur")
        self.client = _api_client(self.user)
        self.dtstart = timezone.now().replace(microsecond=0) + timedelta(days=1)
        self.template, self.first = create_recurring_task(
            self.user,
            title="API 每日",
            recurrence_rule="FREQ=DAILY",
            dtstart=self.dtstart,
            due_date=self.dtstart,
        )

    def _url(self, uid):
        return f"/api/tasks/{uid}/"

    # --- complete generates next ---
    def test_complete_instance_generates_next(self):
        resp = self.client.patch(
            self._url(self.first.uid),
            {'status': Task.TaskStatus.COMPLETED},
            format='json',
        )
        self.assertEqual(resp.status_code, 200)
        # 应该多出一个实例
        instances = Task.objects.filter(
            recurrence_parent=self.template,
            is_recurrence_template=False,
        )
        self.assertEqual(instances.count(), 2)

    # --- skip ---
    def test_skip_via_action(self):
        resp = self.client.post(f"/api/tasks/{self.first.uid}/skip/")
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertEqual(data['skipped']['status'], Task.TaskStatus.ABANDONED)
        self.assertIsNotNone(data['next'])

    def test_skip_non_recurring_returns_400(self):
        plain = Task.objects.create(user=self.user, title="普通")
        resp = self.client.post(f"/api/tasks/{plain.uid}/skip/")
        self.assertEqual(resp.status_code, 400)

    # --- X-Edit-Scope: series ---
    def test_update_series_propagates_title(self):
        resp = self.client.patch(
            self._url(self.first.uid),
            {'title': '改名系列'},
            format='json',
            HTTP_X_EDIT_SCOPE='series',
        )
        self.assertEqual(resp.status_code, 200)
        self.template.refresh_from_db()
        self.first.refresh_from_db()
        self.assertEqual(self.template.title, '改名系列')
        self.assertEqual(self.first.title, '改名系列')

    # --- X-Edit-Scope: instance (detach) ---
    def test_update_instance_scope_detaches(self):
        resp = self.client.patch(
            self._url(self.first.uid),
            {'title': '独立'},
            format='json',
            HTTP_X_EDIT_SCOPE='instance',
        )
        self.assertEqual(resp.status_code, 200)
        self.first.refresh_from_db()
        self.assertIsNone(self.first.recurrence_parent)
        self.assertEqual(self.first.title, '独立')

    # --- X-Edit-Scope: following (split) ---
    def test_update_following_splits_series(self):
        # 先生成多个实例
        from .services.recurrence import generate_next_instance
        second = generate_next_instance(self.template, after=self.first.due_date)
        third = generate_next_instance(self.template, after=second.due_date)

        resp = self.client.patch(
            self._url(second.uid),
            {'title': '新系列'},
            format='json',
            HTTP_X_EDIT_SCOPE='following',
        )
        self.assertEqual(resp.status_code, 200)
        # 新模板应被创建
        new_tpl = Task.objects.filter(
            is_recurrence_template=True, title='新系列',
        ).first()
        self.assertIsNotNone(new_tpl)

    # --- scope: series 非重复任务 → 400 ---
    def test_scope_series_on_non_recurring_returns_400(self):
        plain = Task.objects.create(user=self.user, title="普通")
        resp = self.client.patch(
            self._url(plain.uid),
            {'title': 'X'},
            format='json',
            HTTP_X_EDIT_SCOPE='series',
        )
        self.assertEqual(resp.status_code, 400)

    # --- destroy scope=series ---
    def test_destroy_series(self):
        resp = self.client.delete(f"/api/tasks/{self.first.uid}/?scope=series")
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Task.objects.filter(pk=self.template.pk).exists())

    # --- destroy scope=following ---
    def test_destroy_following(self):
        from .services.recurrence import generate_next_instance
        second = generate_next_instance(self.template, after=self.first.due_date)
        resp = self.client.delete(f"/api/tasks/{second.uid}/?scope=following")
        self.assertEqual(resp.status_code, 204)
        # second 被删
        self.assertFalse(Task.objects.filter(pk=second.pk).exists())
        # first 仍在
        self.assertTrue(Task.objects.filter(pk=self.first.pk).exists())

    # --- 创建重复任务 via API (recurrence_input) ---
    def test_create_recurring_via_api(self):
        due = (timezone.now() + timedelta(days=3)).isoformat()
        resp = self.client.post(
            '/api/tasks/',
            {
                'title': 'API重复',
                'due_date': due,
                'recurrence_input': {'freq': 'weekly', 'byday': ['MO', 'WE', 'FR']},
            },
            format='json',
        )
        self.assertEqual(resp.status_code, 201)
        data = resp.json()['data']
        self.assertFalse(data.get('is_recurrence_template', True))
        self.assertIsNotNone(data.get('recurrence'))


class ReminderAPITests(APITestCase):
    """测试 /api/reminders/ CRUD + /upcoming/ + /mark-triggered/"""

    def setUp(self):
        self.user = _make_user("api_reminder")
        self.client = _api_client(self.user)
        self.task = Task.objects.create(
            user=self.user, title="提醒任务",
            due_date=timezone.now() + timedelta(hours=1),
        )

    def test_create_reminder(self):
        resp = self.client.post('/api/reminders/', {
            'task_uid': str(self.task.uid),
            'type': Reminder.ReminderType.RELATIVE,
            'offset_minutes': 15,
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        data = resp.json()['data']
        self.assertEqual(data['offset_minutes'], 15)
        self.assertEqual(data['task_uid'], str(self.task.uid))

    def test_create_absolute_reminder(self):
        trigger = (timezone.now() + timedelta(minutes=30)).isoformat()
        resp = self.client.post('/api/reminders/', {
            'task_uid': str(self.task.uid),
            'type': Reminder.ReminderType.ABSOLUTE,
            'trigger_at': trigger,
        }, format='json')
        self.assertEqual(resp.status_code, 201)

    def test_create_reminder_missing_task_uid(self):
        resp = self.client.post('/api/reminders/', {
            'type': Reminder.ReminderType.RELATIVE,
            'offset_minutes': 10,
        }, format='json')
        self.assertEqual(resp.status_code, 400)

    def test_list_reminders(self):
        Reminder.objects.create(
            user=self.user, task=self.task,
            type=Reminder.ReminderType.RELATIVE, offset_minutes=5,
        )
        resp = self.client.get('/api/reminders/')
        self.assertEqual(resp.status_code, 200)
        self.assertGreaterEqual(len(resp.json()['data']), 1)

    def test_update_reminder(self):
        r = Reminder.objects.create(
            user=self.user, task=self.task,
            type=Reminder.ReminderType.RELATIVE, offset_minutes=5,
        )
        resp = self.client.patch(f'/api/reminders/{r.uid}/', {
            'offset_minutes': 30,
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        r.refresh_from_db()
        self.assertEqual(r.offset_minutes, 30)

    def test_delete_reminder(self):
        r = Reminder.objects.create(
            user=self.user, task=self.task,
            type=Reminder.ReminderType.RELATIVE, offset_minutes=5,
        )
        resp = self.client.delete(f'/api/reminders/{r.uid}/')
        self.assertEqual(resp.status_code, 204)
        self.assertFalse(Reminder.objects.filter(pk=r.pk).exists())

    def test_upcoming(self):
        Reminder.objects.create(
            user=self.user, task=self.task,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=15,
        )
        resp = self.client.get('/api/reminders/upcoming/?within_minutes=120')
        self.assertEqual(resp.status_code, 200)
        data = resp.json()['data']
        self.assertGreaterEqual(len(data), 1)

    def test_mark_triggered(self):
        r = Reminder.objects.create(
            user=self.user, task=self.task,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=15,
        )
        resp = self.client.post(f'/api/reminders/{r.uid}/mark-triggered/')
        self.assertEqual(resp.status_code, 200)
        r.refresh_from_db()
        self.assertEqual(r.status, Reminder.ReminderStatus.TRIGGERED)
        self.assertIsNotNone(r.triggered_at)

    def test_mark_triggered_idempotent(self):
        r = Reminder.objects.create(
            user=self.user, task=self.task,
            type=Reminder.ReminderType.RELATIVE,
            offset_minutes=5,
        )
        r.mark_triggered()
        first_triggered = r.triggered_at
        resp = self.client.post(f'/api/reminders/{r.uid}/mark-triggered/')
        self.assertEqual(resp.status_code, 200)
        r.refresh_from_db()
        self.assertEqual(r.triggered_at, first_triggered)

    def test_reminder_via_task_create(self):
        """通过 task reminders_input 创建提醒"""
        due = (timezone.now() + timedelta(hours=2)).isoformat()
        resp = self.client.post('/api/tasks/', {
            'title': '带提醒的任务',
            'due_date': due,
            'reminders_input': [
                {'type': 'relative', 'offset_minutes': 10},
                {'type': 'relative', 'offset_minutes': 30},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, 201)
        task_uid = resp.json()['data']['uid']
        task = Task.objects.get(uid=task_uid)
        self.assertEqual(task.reminders.count(), 2)

    def test_reminder_via_task_update(self):
        """通过 task reminders_input 替换提醒"""
        Reminder.objects.create(
            user=self.user, task=self.task,
            type=Reminder.ReminderType.RELATIVE, offset_minutes=5,
        )
        resp = self.client.patch(f'/api/tasks/{self.task.uid}/', {
            'reminders_input': [
                {'type': 'relative', 'offset_minutes': 60},
            ],
        }, format='json')
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(
            self.task.reminders.filter(status=Reminder.ReminderStatus.PENDING).count(), 1,
        )
        self.assertEqual(
            self.task.reminders.filter(
                status=Reminder.ReminderStatus.PENDING,
            ).first().offset_minutes, 60,
        )
