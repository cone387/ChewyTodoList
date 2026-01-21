from django.db import models
from django.utils import timezone
from django.conf import settings
from datetime import timedelta
from uuid import uuid4
import base64
import random
import colorsys


# =========================
# 通用工具函数
# =========================

def generate_uid():
    """生成22位的URL安全的唯一标识符"""
    return base64.urlsafe_b64encode(uuid4().bytes).decode()[:22]


def get_timestamp_sortorder():
    """基于当前时间戳生成排序值（适合拖拽 / 前插 / 中插）"""
    return timezone.now().timestamp()


def generate_tag_color():
    """生成视觉友好的随机标签颜色"""
    h = random.random()  # 0~1 随机色相
    s = random.uniform(0.6, 0.9)  # 饱和度 60%-90%
    l = random.uniform(0.45, 0.7)  # 亮度 45%-70%
    r, g, b = colorsys.hls_to_rgb(h, l, s)
    return "#{:02x}{:02x}{:02x}".format(int(r*255), int(g*255), int(b*255))


# =========================
# 基础模型
# =========================

class BaseModel(models.Model):
    """基础模型，包含通用字段"""
    
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        db_index=True,
        verbose_name="用户"
    )
    created_at = models.DateTimeField(
        default=timezone.now, 
        db_index=True, 
        verbose_name="创建时间"
    )
    updated_at = models.DateTimeField(
        auto_now=True, 
        db_index=True, 
        verbose_name="更新时间"
    )

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        """重写保存方法，确保更新时间正确设置"""
        if not self.pk:
            self.created_at = timezone.now()
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


# =========================
# 标签模型
# =========================

class Tag(BaseModel):
    """标签模型"""
    
    uid = models.CharField(
        max_length=22, 
        unique=True, 
        verbose_name="uid", 
        default=generate_uid, 
        editable=False
    )
    name = models.CharField(
        max_length=50, 
        help_text="标签名称，如'生活''工作'", 
        verbose_name="名称"
    )
    color = models.CharField(
        max_length=7, 
        default=generate_tag_color, 
        help_text="十六进制，如#ff0000", 
        verbose_name="颜色"
    )
    sort_order = models.FloatField(default=0, verbose_name="排序")

    class Meta:
        unique_together = ["name", "user"]
        verbose_name = verbose_name_plural = "标签"
        ordering = ["sort_order", "-updated_at"]
        db_table = "todolist_tags"
        indexes = [
            models.Index(fields=['user', '-updated_at'], name='tag_user_updated_idx'),
            models.Index(fields=['user', 'name'], name='tag_user_name_idx'),
        ]

    def __str__(self):
        return self.name


# =========================
# 分组模型
# =========================

class Group(BaseModel):
    """项目分组模型"""
    
    uid = models.CharField(
        max_length=22,
        unique=True,
        default=generate_uid,
        editable=False,
        verbose_name="UID"
    )
    name = models.CharField(max_length=100, db_index=True, verbose_name="名称")
    sort_order = models.FloatField(default=get_timestamp_sortorder, verbose_name="排序")
    desc = models.TextField(blank=True, null=True, verbose_name="描述")
    settings = models.JSONField(default=dict, blank=True, verbose_name="设置")
    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text="附件列表，存储附件元信息的字典列表",
        verbose_name="附件"
    )

    @staticmethod
    def get_user_default(user):
        """获取用户默认分组"""
        group, _ = Group.objects.get_or_create(
            user=user,
            name="默认任务组",
            defaults={"desc": "系统自动创建的默认任务组"}
        )
        return group

    class Meta:
        db_table = "todolist_groups"
        ordering = ["sort_order", "-updated_at"]
        unique_together = ("name", "user")
        verbose_name = verbose_name_plural = "清单分组"
        indexes = [
            models.Index(fields=['user', '-updated_at'], name='group_user_updated_idx'),
            models.Index(fields=['user', 'name'], name='group_user_name_idx'),
        ]

    def __str__(self):
        return self.name


# =========================
# 项目模型
# =========================

class Project(BaseModel):
    """项目模型"""
    
    class ViewType(models.TextChoices):
        LIST = "list", "列表视图"
        CARD = "card", "卡片视图"

    uid = models.CharField(
        max_length=22,
        unique=True,
        default=generate_uid,
        editable=False,
        verbose_name="UID"
    )
    group = models.ForeignKey(
        Group,
        to_field="uid",
        on_delete=models.CASCADE,
        related_name="projects",
        verbose_name="所属分组"
    )
    name = models.CharField(max_length=100, db_index=True, verbose_name="名称")
    desc = models.TextField(blank=True, null=True, verbose_name="描述")
    sort_order = models.FloatField(default=get_timestamp_sortorder, verbose_name="排序")
    style = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="样式",
        help_text="颜色、图标等样式信息"
    )
    view_type = models.CharField(
        max_length=16,
        choices=ViewType.choices,
        default=ViewType.LIST,
        verbose_name="视图类型"
    )
    settings = models.JSONField(default=dict, blank=True, verbose_name="设置")
    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text="附件列表，存储附件元信息的字典列表",
        verbose_name="附件"
    )

    @staticmethod
    def get_default_project(user):
        """获取用户默认项目"""
        group = Group.get_user_default(user)
        project, _ = Project.objects.get_or_create(
            user=user,
            group=group,
            name="默认项目",
            defaults={"desc": "系统自动创建的默认项目"}
        )
        return project

    class Meta:
        db_table = "todolist_projects"
        ordering = ["sort_order", "-updated_at"]
        unique_together = ("name", "group", "user")
        verbose_name = verbose_name_plural = "待办项目"
        indexes = [
            models.Index(fields=['user', '-updated_at'], name='project_user_updated_idx'),
            models.Index(fields=['user', 'group'], name='project_user_group_idx'),
        ]

    def __str__(self):
        return self.name


# =========================
# 任务查询集
# =========================

class TaskQuerySet(models.QuerySet):
    """任务查询集"""

    def today(self):
        """今日任务"""
        today = timezone.now().date()
        return self.filter(
            models.Q(start_date__date__lte=today) | models.Q(start_date__isnull=True),
            models.Q(due_date__date__gte=today) | models.Q(due_date__isnull=True)
        )

    def tomorrow(self):
        """明日任务"""
        tomorrow = timezone.now().date() + timedelta(days=1)
        return self.filter(
            models.Q(start_date__date__lte=tomorrow) | models.Q(start_date__isnull=True),
            models.Q(due_date__date__gte=tomorrow) | models.Q(due_date__isnull=True)
        )

    def this_week(self):
        """本周任务"""
        now = timezone.now()
        week_start = now.date() - timedelta(days=now.weekday())
        week_end = week_start + timedelta(days=6)
        return self.filter(
            models.Q(start_date__date__lte=week_end) | models.Q(start_date__isnull=True),
            models.Q(due_date__date__gte=week_start) | models.Q(due_date__isnull=True)
        )

    def overdue(self):
        """逾期任务"""
        return self.filter(
            due_date__lt=timezone.now(),
            status__in=[Task.TaskStatus.UNASSIGNED, Task.TaskStatus.TODO]
        )

    def uncompleted(self):
        """未完成任务"""
        return self.filter(
            status__in=[Task.TaskStatus.UNASSIGNED, Task.TaskStatus.TODO]
        )

    def completed(self):
        """已完成任务"""
        return self.filter(status=Task.TaskStatus.COMPLETED)


# =========================
# 任务模型
# =========================

class Task(BaseModel):
    """任务模型"""
    
    class TaskStatus(models.IntegerChoices):
        UNASSIGNED = 0, "待分配"
        TODO = 1, "待办"
        COMPLETED = 2, "已完成"
        ABANDONED = 3, "已放弃"

    class TaskPriority(models.IntegerChoices):
        LOW = 0, "低"
        MEDIUM = 1, "中"
        HIGH = 2, "高"
        URGENT = 3, "紧急"

    uid = models.CharField(
        max_length=22,
        unique=True,
        default=generate_uid,
        editable=False,
        verbose_name="UID"
    )
    project = models.ForeignKey(
        Project,
        to_field="uid",
        on_delete=models.CASCADE,
        related_name="tasks",
        verbose_name="所属项目"
    )
    parent = models.ForeignKey(
        "self",
        to_field="uid",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subtasks",
        db_index=True,
        verbose_name="父任务"
    )

    title = models.CharField(max_length=255, db_index=True, verbose_name="标题")
    content = models.TextField(blank=True, null=True, verbose_name="内容")

    status = models.IntegerField(
        choices=TaskStatus.choices,
        default=TaskStatus.TODO,
        db_index=True,
        verbose_name="状态"
    )
    priority = models.IntegerField(
        choices=TaskPriority.choices,
        default=TaskPriority.MEDIUM,
        verbose_name="优先级"
    )

    sort_order = models.FloatField(default=get_timestamp_sortorder, verbose_name="排序")
    custom_group = models.CharField(max_length=255, blank=True, null=True, verbose_name="自定义分组")

    is_all_day = models.BooleanField(default=True, verbose_name="全天任务")
    start_date = models.DateTimeField(null=True, blank=True, db_index=True, verbose_name="开始时间")
    due_date = models.DateTimeField(null=True, blank=True, db_index=True, verbose_name="截止时间")
    completed_time = models.DateTimeField(null=True, blank=True, db_index=True, verbose_name="完成时间")

    time_zone = models.CharField(max_length=64, default="Asia/Shanghai", verbose_name="时区")

    tags = models.ManyToManyField(
        Tag,
        related_name="tasks",
        blank=True,
        verbose_name="标签"
    )

    attachments = models.JSONField(
        default=list,
        blank=True,
        help_text="附件列表，存储附件元信息的字典列表",
        verbose_name="附件"
    )

    objects = TaskQuerySet.as_manager()

    class Meta:
        db_table = "todolist_tasks"
        ordering = ["sort_order", "-updated_at"]
        verbose_name = verbose_name_plural = "待办事项"
        indexes = [
            models.Index(fields=['user', 'status', '-updated_at'], name='task_user_status_updated_idx'),
            models.Index(fields=['user', 'project', '-updated_at'], name='task_user_project_updated_idx'),
            models.Index(fields=['user', 'due_date'], name='task_user_due_date_idx'),
            models.Index(fields=['user', 'start_date'], name='task_user_start_date_idx'),
        ]

    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

    @property
    def is_completed(self):
        """是否已完成"""
        return self.status == self.TaskStatus.COMPLETED

    @property
    def is_overdue(self):
        """是否逾期"""
        if not self.due_date or self.is_completed:
            return False
        return self.due_date < timezone.now()

    @property
    def completed_status(self):
        """完成状态"""
        if not self.is_completed:
            return "not"
        if not self.due_date:
            return "ontime"
        return "ontime" if self.completed_time <= self.due_date else "late"

    def set_status(self, status):
        """设置任务状态"""
        if status == self.TaskStatus.COMPLETED and not self.completed_time:
            self.completed_time = timezone.now()
        elif status != self.TaskStatus.COMPLETED:
            self.completed_time = None
        
        self.status = status
        self.save(update_fields=["status", "completed_time", "updated_at"])

    def save(self, *args, **kwargs):
        """重写保存方法"""
        # 自动设置完成时间
        if self.status == self.TaskStatus.COMPLETED and not self.completed_time:
            self.completed_time = timezone.now()
        elif self.status != self.TaskStatus.COMPLETED:
            self.completed_time = None
        
        super().save(*args, **kwargs)


# =========================
# 活动日志模型
# =========================

class ActivityLog(BaseModel):
    """活动日志模型"""
    
    class ActionType(models.TextChoices):
        CREATED = "created", "创建"
        UPDATED = "updated", "更新"
        STATUS_CHANGED = "status_changed", "状态变更"
        COMPLETED = "completed", "完成"
        DELETED = "deleted", "删除"

    task = models.ForeignKey(
        Task,
        to_field="uid",
        on_delete=models.CASCADE,
        related_name="activity_logs",
        verbose_name="任务"
    )
    project = models.ForeignKey(
        Project,
        to_field="uid",
        on_delete=models.CASCADE,
        related_name="activity_logs",
        verbose_name="项目"
    )
    action = models.CharField(max_length=64, choices=ActionType.choices, verbose_name="操作类型")
    detail = models.TextField(blank=True, verbose_name="详细信息")

    class Meta:
        db_table = "todolist_activity_logs"
        ordering = ["-created_at"]
        verbose_name = verbose_name_plural = "活动日志"
        indexes = [
            models.Index(fields=['user', '-created_at'], name='activity_user_created_idx'),
            models.Index(fields=['task', '-created_at'], name='activity_task_created_idx'),
            models.Index(fields=['project', '-created_at'], name='activity_project_created_idx'),
        ]

    def __str__(self):
        return f"{self.get_action_display()} - {self.task.title}"