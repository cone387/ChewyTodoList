"""
seed_demo — 初始化演示账户和数据

首次部署 self-hosted 实例时使用，创建 demo 用户并填充示例数据。
幂等：如果已有用户则跳过。

用法：uv run python manage.py seed_demo
"""
from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.todolist.models import Group, Project, Tag, Task, TaskView

User = get_user_model()

DEMO_USERNAME = 'demo'
DEMO_PASSWORD = 'demo123456'
DEMO_EMAIL = 'demo@chewytodo.app'


class Command(BaseCommand):
    help = '创建演示账户和预置数据（幂等，已有用户时跳过）'

    def handle(self, *args, **options):
        if User.objects.exists():
            self.stdout.write(self.style.WARNING('数据库已有用户，跳过 seed_demo'))
            return

        user = User.objects.create_user(
            username=DEMO_USERNAME,
            password=DEMO_PASSWORD,
            email=DEMO_EMAIL,
        )
        self.stdout.write(f'创建用户: {DEMO_USERNAME}')

        # 分组
        g_work = Group.objects.create(user=user, name='工作', sort_order=1)
        g_life = Group.objects.create(user=user, name='生活', sort_order=2)

        # 项目
        p_dev = Project.objects.create(user=user, group=g_work, name='产品开发', sort_order=1)
        p_marketing = Project.objects.create(user=user, group=g_work, name='市场推广', sort_order=2)
        p_fitness = Project.objects.create(user=user, group=g_life, name='健身计划', sort_order=1)
        p_reading = Project.objects.create(user=user, group=g_life, name='阅读清单', sort_order=2)

        # 标签
        tag_important = Tag.objects.create(user=user, name='重要', color='#ef4444', sort_order=1)
        tag_work = Tag.objects.create(user=user, name='工作', color='#3b82f6', sort_order=2)
        tag_study = Tag.objects.create(user=user, name='学习', color='#8b5cf6', sort_order=3)
        tag_idea = Tag.objects.create(user=user, name='灵感', color='#f97316', sort_order=4)
        tag_habit = Tag.objects.create(user=user, name='习惯', color='#22c55e', sort_order=5)

        now = timezone.now()
        tomorrow = now + timedelta(days=1)
        day_after = now + timedelta(days=2)

        # === 产品开发 ===
        t1 = Task.objects.create(
            user=user, project=p_dev, title='完成用户认证模块',
            status=Task.TaskStatus.COMPLETED, priority=Task.TaskPriority.HIGH,
            completed_time=now - timedelta(days=2), sort_order=1,
        )
        t1.tags.add(tag_work)

        t2 = Task.objects.create(
            user=user, project=p_dev, title='设计数据库 schema',
            status=Task.TaskStatus.COMPLETED, priority=Task.TaskPriority.MEDIUM,
            completed_time=now - timedelta(days=1), sort_order=2,
        )
        t2.tags.add(tag_work)

        t3 = Task.objects.create(
            user=user, project=p_dev, title='实现 API 接口',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.HIGH,
            due_date=tomorrow, sort_order=3,
        )
        t3.tags.add(tag_work, tag_important)

        t4 = Task.objects.create(
            user=user, project=p_dev, title='编写单元测试',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.MEDIUM,
            sort_order=4,
        )
        t4.tags.add(tag_work)
        # 子任务
        Task.objects.create(user=user, project=p_dev, title='测试用户模块', parent=t4, status=Task.TaskStatus.COMPLETED, priority=Task.TaskPriority.LOW, sort_order=1, completed_time=now)
        Task.objects.create(user=user, project=p_dev, title='测试任务模块', parent=t4, status=Task.TaskStatus.TODO, priority=Task.TaskPriority.LOW, sort_order=2)
        Task.objects.create(user=user, project=p_dev, title='测试项目模块', parent=t4, status=Task.TaskStatus.TODO, priority=Task.TaskPriority.LOW, sort_order=3)

        # === 市场推广 ===
        t5 = Task.objects.create(
            user=user, project=p_marketing, title='撰写产品介绍文案',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.MEDIUM,
            sort_order=1,
        )
        t5.tags.add(tag_work)

        Task.objects.create(
            user=user, project=p_marketing, title='竞品分析报告',
            status=Task.TaskStatus.ABANDONED, priority=Task.TaskPriority.LOW,
            sort_order=2,
        )

        # === 健身计划 ===
        t7 = Task.objects.create(
            user=user, project=p_fitness, title='晨跑 30 分钟',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.MEDIUM,
            sort_order=1,
            recurrence_rule='FREQ=DAILY',
            recurrence_dtstart=now,
            is_recurrence_template=True,
        )
        t7.tags.add(tag_habit)

        t8 = Task.objects.create(
            user=user, project=p_fitness, title='做 HIIT 训练',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.LOW,
            sort_order=2,
        )
        t8.tags.add(tag_habit)

        # === 阅读清单 ===
        t9 = Task.objects.create(
            user=user, project=p_reading, title='读完《原子习惯》',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.LOW,
            sort_order=1,
        )
        t9.tags.add(tag_study, tag_idea)

        t10 = Task.objects.create(
            user=user, project=p_reading, title='整理读书笔记',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.LOW,
            sort_order=2,
        )
        t10.tags.add(tag_study)

        # === 收集箱（无项目） ===
        t11 = Task.objects.create(
            user=user, project=None, title='购买生日礼物',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.URGENT,
            due_date=day_after, sort_order=1,
        )
        t11.tags.add(tag_important)

        Task.objects.create(
            user=user, project=None, title='预约牙医',
            status=Task.TaskStatus.TODO, priority=Task.TaskPriority.MEDIUM,
            sort_order=2,
        )

        # 初始化默认视图
        TaskView.create_default_views_for_user(user)

        self.stdout.write(self.style.SUCCESS(
            f'seed_demo 完成: 用户={DEMO_USERNAME}, '
            f'分组={Group.objects.filter(user=user).count()}, '
            f'项目={Project.objects.filter(user=user).count()}, '
            f'标签={Tag.objects.filter(user=user).count()}, '
            f'任务={Task.objects.filter(user=user).count()}'
        ))
