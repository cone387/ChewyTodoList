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
        """重写保存方法"""
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
        db_table = "ct_tags"
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
        db_table = "ct_groups"
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
        db_table = "ct_projects"
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
    """任务查询集 — 默认排除重复任务模板（is_recurrence_template=True）"""

    def _exclude_templates(self):
        """内部：排除模板任务"""
        return self.filter(is_recurrence_template=False)

    def today(self):
        """今日任务"""
        today = timezone.now().date()
        return self.filter(
            models.Q(start_date__date__lte=today) | models.Q(start_date__isnull=True),
            models.Q(due_date__date__gte=today) | models.Q(due_date__isnull=True),
            is_recurrence_template=False,
        )

    def tomorrow(self):
        """明日任务"""
        tomorrow = timezone.now().date() + timedelta(days=1)
        return self.filter(
            models.Q(start_date__date__lte=tomorrow) | models.Q(start_date__isnull=True),
            models.Q(due_date__date__gte=tomorrow) | models.Q(due_date__isnull=True),
            is_recurrence_template=False,
        )

    def this_week(self):
        """本周任务"""
        now = timezone.now()
        week_start = now.date() - timedelta(days=now.weekday())
        week_end = week_start + timedelta(days=6)
        return self.filter(
            models.Q(start_date__date__lte=week_end) | models.Q(start_date__isnull=True),
            models.Q(due_date__date__gte=week_start) | models.Q(due_date__isnull=True),
            is_recurrence_template=False,
        )

    def overdue(self):
        """逾期任务"""
        return self.filter(
            due_date__lt=timezone.now(),
            status__in=[Task.TaskStatus.UNASSIGNED, Task.TaskStatus.TODO],
            is_recurrence_template=False,
        )

    def uncompleted(self):
        """未完成任务"""
        return self.filter(
            status__in=[Task.TaskStatus.UNASSIGNED, Task.TaskStatus.TODO],
            is_recurrence_template=False,
        )

    def completed(self):
        """已完成任务"""
        return self.filter(status=Task.TaskStatus.COMPLETED, is_recurrence_template=False)

    def templates(self):
        """仅返回重复任务模板"""
        return self.filter(is_recurrence_template=True)


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
        null=True,
        blank=True,
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
        help_text="附件列表，存储附件ID的列表",
        verbose_name="附件"
    )

    # === 重复任务（M1 新增）===
    recurrence_rule = models.CharField(
        max_length=255, blank=True, null=True,
        verbose_name="重复规则",
        help_text="iCalendar RRULE 字符串，如 'FREQ=WEEKLY;BYDAY=MO,WE,FR'",
    )
    recurrence_parent = models.ForeignKey(
        "self", to_field="uid",
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name="recurrence_children",
        verbose_name="重复系列源",
        help_text="指向系列模板任务；模板任务本身此字段为 null",
    )
    recurrence_dtstart = models.DateTimeField(
        null=True, blank=True,
        verbose_name="重复起始时间",
        help_text="RRULE 的 DTSTART；通常等于 start_date 或 due_date",
    )
    recurrence_exdates = models.JSONField(
        default=list, blank=True,
        verbose_name="排除日期",
        help_text="被跳过的实例日期 ISO 列表",
    )
    is_recurrence_template = models.BooleanField(
        default=False, db_index=True,
        verbose_name="是否重复系列模板",
        help_text="True=模板（不出现在普通列表），False=具体实例",
    )

    objects = TaskQuerySet.as_manager()

    class Meta:
        db_table = "ct_tasks"
        ordering = ["sort_order", "-updated_at"]
        verbose_name = verbose_name_plural = "待办事项"
        indexes = [
            models.Index(fields=['user', 'status', '-updated_at'], name='task_user_status_updated_idx'),
            models.Index(fields=['user', 'project', '-updated_at'], name='task_user_project_updated_idx'),
            models.Index(fields=['user', 'due_date'], name='task_user_due_date_idx'),
            models.Index(fields=['user', 'start_date'], name='task_user_start_date_idx'),
            models.Index(fields=['user', 'recurrence_parent'], name='task_user_recur_parent_idx'),
            models.Index(fields=['user', 'is_recurrence_template'], name='task_user_recur_tpl_idx'),
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
        null=True,
        blank=True,
        verbose_name="项目"
    )
    action = models.CharField(max_length=64, choices=ActionType.choices, verbose_name="操作类型")
    detail = models.TextField(blank=True, verbose_name="详细信息")

    class Meta:
        db_table = "ct_activity_logs"
        ordering = ["-created_at"]
        verbose_name = verbose_name_plural = "活动日志"
        indexes = [
            models.Index(fields=['user', '-created_at'], name='activity_user_created_idx'),
            models.Index(fields=['task', '-created_at'], name='activity_task_created_idx'),
            models.Index(fields=['project', '-created_at'], name='activity_project_created_idx'),
        ]

    def __str__(self):
        return f"{self.get_action_display()} - {self.task.title}"


# =========================
# 卡片配置模型
# =========================

class TaskCardConfig(BaseModel):
    """任务卡片配置 — 控制单个任务卡片的外观和字段显示"""

    # 覆盖 BaseModel 的 user 字段，允许为空（系统预设时 user=None）
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        db_index=True,
        verbose_name="用户",
    )

    uid = models.CharField(
        max_length=22, unique=True, default=generate_uid, editable=False, verbose_name="UID"
    )
    name = models.CharField(max_length=100, verbose_name="配置名称")
    desc = models.TextField(blank=True, null=True, verbose_name="描述")

    is_preset = models.BooleanField(default=False, verbose_name="系统预设")

    layout = models.CharField(
        max_length=20,
        choices=[
            ("compact", "紧凑"),
            ("comfortable", "舒适"),
            ("spacious", "宽松"),
        ],
        default="comfortable",
        verbose_name="布局密度",
    )
    style = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="卡片样式",
        help_text="borderRadius, shadow, padding, hoverEffect, checkboxStyle 等",
    )
    field_configs = models.JSONField(
        default=list,
        blank=True,
        verbose_name="字段配置",
        help_text="有序列表: [{field, visible, position, style}]",
    )
    sort_order = models.FloatField(default=get_timestamp_sortorder, verbose_name="排序")

    class Meta:
        db_table = "ct_card_configs"
        ordering = ["is_preset", "sort_order", "-updated_at"]
        verbose_name = verbose_name_plural = "卡片配置"
        indexes = [
            models.Index(fields=["user", "-updated_at"], name="cardcfg_user_updated_idx"),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "name"],
                condition=models.Q(user__isnull=False),
                name="unique_card_config_name_per_user",
            ),
            models.UniqueConstraint(
                fields=["name"],
                condition=models.Q(is_preset=True),
                name="unique_preset_card_config_name",
            ),
        ]

    def __str__(self):
        return f"{self.name} ({'预设' if self.is_preset else '自定义'})"

    # 可用字段注册表 — 前端配置编辑器由此驱动
    AVAILABLE_FIELDS = [
        {
            "field": "title",
            "label": "标题",
            "type": "text",
            "required": True,
            "positions": ["header"],
            "style_options": {
                "fontSize": ["small", "medium", "large"],
                "fontWeight": ["normal", "medium", "semibold", "bold"],
                "showStrikethrough": "boolean",
            },
        },
        {
            "field": "status",
            "label": "状态",
            "type": "enum",
            "required": False,
            "positions": ["header_left", "header_right", "body", "footer"],
            "style_options": {
                "variant": ["badge", "icon", "dot", "border"],
            },
        },
        {
            "field": "priority",
            "label": "优先级",
            "type": "enum",
            "required": False,
            "positions": ["header_left", "header_right", "body", "footer"],
            "style_options": {
                "variant": ["flag", "dot", "border", "background"],
            },
        },
        {
            "field": "tags",
            "label": "标签",
            "type": "relation",
            "required": False,
            "positions": ["body", "footer"],
            "style_options": {
                "variant": ["pill", "badge", "minimal"],
                "maxCount": "number",
            },
        },
        {
            "field": "due_date",
            "label": "截止日期",
            "type": "datetime",
            "required": False,
            "positions": ["header_right", "body", "footer"],
            "style_options": {
                "showRelative": "boolean",
                "showIcon": "boolean",
            },
        },
        {
            "field": "start_date",
            "label": "开始日期",
            "type": "datetime",
            "required": False,
            "positions": ["body", "footer"],
            "style_options": {
                "showRelative": "boolean",
                "showIcon": "boolean",
            },
        },
        {
            "field": "content",
            "label": "内容",
            "type": "text",
            "required": False,
            "positions": ["body"],
            "style_options": {
                "maxLines": "number",
            },
        },
        {
            "field": "project",
            "label": "项目",
            "type": "relation",
            "required": False,
            "positions": ["body", "footer"],
            "style_options": {},
        },
        {
            "field": "subtasks_count",
            "label": "子任务",
            "type": "computed",
            "required": False,
            "positions": ["body", "footer"],
            "style_options": {
                "showProgress": "boolean",
            },
        },
        {
            "field": "custom_group",
            "label": "自定义分组",
            "type": "text",
            "required": False,
            "positions": ["body", "footer"],
            "style_options": {},
        },
    ]

    @classmethod
    def get_default_field_configs(cls):
        """返回默认的字段配置"""
        return [
            {"field": "priority", "visible": True, "position": "header_left", "style": {"variant": "flag"}},
            {"field": "title", "visible": True, "position": "header", "style": {"fontSize": "medium", "fontWeight": "medium", "showStrikethrough": True}},
            {"field": "status", "visible": True, "position": "header_right", "style": {"variant": "badge"}},
            {"field": "tags", "visible": True, "position": "body", "style": {"variant": "pill", "maxCount": 3}},
            {"field": "project", "visible": True, "position": "footer", "style": {}},
            {"field": "due_date", "visible": True, "position": "footer", "style": {"showRelative": True}},
            {"field": "subtasks_count", "visible": True, "position": "footer", "style": {"showProgress": True}},
            {"field": "content", "visible": False, "position": "body", "style": {"maxLines": 2}},
            {"field": "start_date", "visible": False, "position": "footer", "style": {"showRelative": True}},
            {"field": "custom_group", "visible": False, "position": "footer", "style": {}},
        ]


# =========================
# 视图模型
# =========================

class TaskView(BaseModel):
    """任务视图模型 - 类似Notion的视图功能"""
    
    class ViewType(models.TextChoices):
        LIST = "list", "列表视图"
        BOARD = "board", "看板视图"
        CALENDAR = "calendar", "日历视图"
        TABLE = "table", "表格视图"
        TIMELINE = "timeline", "时间线视图"
        GALLERY = "gallery", "画廊视图"

    uid = models.CharField(
        max_length=22,
        unique=True,
        default=generate_uid,
        editable=False,
        verbose_name="UID"
    )
    name = models.CharField(max_length=100, db_index=True, verbose_name="视图名称")
    project = models.ForeignKey(
        Project,
        to_field="uid",
        on_delete=models.CASCADE,
        related_name="views",
        null=True,
        blank=True,
        verbose_name="所属项目"
    )
    view_type = models.CharField(
        max_length=16,
        choices=ViewType.choices,
        default=ViewType.LIST,
        verbose_name="视图类型"
    )
    is_default = models.BooleanField(default=False, verbose_name="是否默认视图")
    is_public = models.BooleanField(default=False, verbose_name="是否公开")
    is_system = models.BooleanField(default=False, verbose_name="是否系统视图", help_text="系统视图用于初始化新用户")
    is_visible_in_nav = models.BooleanField(default=True, verbose_name="是否在导航栏显示")
    sort_order = models.FloatField(default=get_timestamp_sortorder, verbose_name="排序")

    # 关联卡片配置
    card_config = models.ForeignKey(
        TaskCardConfig,
        to_field="uid",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="views",
        verbose_name="卡片配置",
    )
    
    # 筛选条件
    filters = models.JSONField(
        default=list,
        blank=True,
        verbose_name="筛选条件",
        help_text="筛选规则列表，格式：[{field, operator, value, logic}]"
    )
    
    # 排序规则
    sorts = models.JSONField(
        default=list,
        blank=True,
        verbose_name="排序规则",
        help_text="排序规则列表，格式：[{field, direction}]"
    )
    
    # 分组规则
    group_by = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        verbose_name="分组字段",
        help_text="按哪个字段分组显示"
    )
    
    # 显示设置（视图级别：看板列设置、日历起始日、表格列宽等）
    view_settings = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="视图设置",
        help_text="视图级别配置，非卡片级别",
    )
    
    # 清单跟随设置
    follow_selected_project = models.BooleanField(
        default=True,
        verbose_name="跟随所选清单",
        help_text="True: 跟随主界面所选清单过滤; False: 使用视图固定的所属清单"
    )

    class Meta:
        db_table = "ct_task_views"
        ordering = ["sort_order", "name"]
        verbose_name = verbose_name_plural = "任务视图"
        indexes = [
            models.Index(fields=['user', 'project', 'sort_order'], name='view_user_project_sort_idx'),
            models.Index(fields=['user', 'is_default'], name='view_user_default_idx'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'project', 'name'],
                name='unique_view_name_per_project'
            ),
        ]

    def __str__(self):
        return f"{self.name} ({self.get_view_type_display()})"

    @classmethod
    def get_default_views(cls, user, project=None):
        """获取默认视图"""
        return cls.objects.filter(
            user=user,
            project=project,
            is_default=True
        ).first()

    @classmethod
    def create_default_views_for_user(cls, user):
        """为新用户创建默认视图"""
        default_views = [
            {
                'name': '今日',
                'view_type': cls.ViewType.LIST,
                'is_default': True,
                'is_visible_in_nav': True,
                'sort_order': 1,
                'filters': [
                    {'field': 'due_date', 'operator': 'is_today', 'value': None, 'logic': 'and'}
                ],
                'sorts': [{'field': 'priority', 'direction': 'desc'}],
            },
            {
                'name': '紧急',
                'view_type': cls.ViewType.LIST,
                'is_default': False,
                'is_visible_in_nav': True,
                'sort_order': 2,
                'filters': [
                    {'field': 'priority', 'operator': 'equals', 'value': 4, 'logic': 'and'}  # URGENT = 4
                ],
                'sorts': [{'field': 'due_date', 'direction': 'asc'}],
            },
            {
                'name': '明日',
                'view_type': cls.ViewType.LIST,
                'is_default': False,
                'is_visible_in_nav': True,
                'sort_order': 3,
                'filters': [
                    {'field': 'due_date', 'operator': 'is_tomorrow', 'value': None, 'logic': 'and'}
                ],
                'sorts': [{'field': 'priority', 'direction': 'desc'}],
            },
            {
                'name': '本周',
                'view_type': cls.ViewType.LIST,
                'is_default': False,
                'is_visible_in_nav': True,
                'sort_order': 4,
                'filters': [
                    {'field': 'due_date', 'operator': 'is_this_week', 'value': None, 'logic': 'and'}
                ],
                'sorts': [{'field': 'due_date', 'direction': 'asc'}, {'field': 'priority', 'direction': 'desc'}],
            },
            {
                'name': '待规划',
                'view_type': cls.ViewType.LIST,
                'is_default': False,
                'is_visible_in_nav': True,
                'sort_order': 5,
                'filters': [
                    {'field': 'due_date', 'operator': 'is_empty', 'value': None, 'logic': 'and'}
                ],
                'sorts': [{'field': 'created_at', 'direction': 'desc'}],
            },
            {
                'name': '全部',
                'view_type': cls.ViewType.LIST,
                'is_default': False,
                'is_visible_in_nav': True,
                'sort_order': 6,
                'filters': [],
                'sorts': [{'field': 'updated_at', 'direction': 'desc'}],
            },
        ]
        
        created_views = []
        for view_data in default_views:
            view, created = cls.objects.get_or_create(
                user=user,
                name=view_data['name'],
                project=None,
                defaults=view_data
            )
            if created:
                created_views.append(view)
        
        return created_views

    def apply_filters(self, queryset):
        """应用筛选条件到查询集"""
        if not self.filters:
            return queryset
        
        from django.db.models import Q
        import operator
        from functools import reduce
        
        conditions = []
        exclude_conditions = []
        
        for filter_rule in self.filters:
            field = filter_rule.get('field')
            op = filter_rule.get('operator')
            value = filter_rule.get('value')
            value2 = filter_rule.get('value2')
            
            if not all([field, op]):
                continue
            
            # 对于不需要值的操作符，强制设置value为None
            no_value_operators = [
                'is_empty', 'is_not_empty', 'is_today', 'is_yesterday', 'is_tomorrow',
                'is_this_week', 'is_last_week', 'is_next_week', 'is_this_month',
                'is_last_month', 'is_next_month', 'is_overdue', 'has_no_date',
                'is_true', 'is_false'
            ]
            
            if op in no_value_operators:
                value = None
                value2 = None
            elif op not in no_value_operators and value is None:
                # 需要值但值为None的情况，跳过此筛选条件
                continue
                
            # 构建查询条件
            lookup = self._build_lookup(field, op, value, value2)
            if lookup:
                # 需要使用exclude的操作符
                if op in ['not_equals', 'not_contains', 'not_in', 'not_between']:
                    exclude_conditions.append(Q(**lookup))
                else:
                    conditions.append(Q(**lookup))
        
        # 应用include条件（AND逻辑）
        if conditions:
            combined_condition = reduce(operator.and_, conditions)
            queryset = queryset.filter(combined_condition)
        
        # 应用exclude条件
        if exclude_conditions:
            for exclude_condition in exclude_conditions:
                queryset = queryset.exclude(exclude_condition)
        
        return queryset

    def apply_sorts(self, queryset):
        """应用排序规则到查询集"""
        if not self.sorts:
            return queryset
        
        order_fields = []
        for sort_rule in self.sorts:
            field = sort_rule.get('field')
            direction = sort_rule.get('direction', 'asc')
            
            if field:
                prefix = '-' if direction == 'desc' else ''
                order_fields.append(f"{prefix}{field}")
        
        if order_fields:
            queryset = queryset.order_by(*order_fields)
        
        return queryset

    def _build_lookup(self, field, operator, value, value2=None):
        """构建Django查询lookup"""
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        # 基础lookup映射
        lookup_map = {
            'equals': '',
            'not_equals': '',
            'contains': '__icontains',
            'not_contains': '__icontains',
            'starts_with': '__istartswith',
            'ends_with': '__iendswith',
            'is_empty': '__isnull',
            'is_not_empty': '__isnull',
            'greater_than': '__gt',
            'greater_than_or_equal': '__gte',
            'less_than': '__lt',
            'less_than_or_equal': '__lte',
            'in': '__in',
            'not_in': '__in',
            'between': '__range',
            'not_between': '__range',
        }
        
        # 处理日期特殊操作符
        if operator in ['is_today', 'is_yesterday', 'is_tomorrow', 'is_this_week', 
                       'is_last_week', 'is_next_week', 'is_this_month', 
                       'is_last_month', 'is_next_month', 'is_overdue', 'has_no_date']:
            return self._build_date_lookup(field, operator)
        
        # 处理布尔操作符
        if operator in ['is_true', 'is_false']:
            return {field: operator == 'is_true'}
        
        if operator not in lookup_map:
            return None
        
        lookup_suffix = lookup_map[operator]
        lookup_key = f"{field}{lookup_suffix}"
        
        # 特殊处理
        if operator == 'not_equals':
            return {f"{field}": value}  # 使用exclude处理，所以这里用正常的等于
        elif operator == 'not_contains':
            return {f"{field}__icontains": value}  # 需要在外层用exclude
        elif operator == 'is_empty':
            return {lookup_key: True}
        elif operator == 'is_not_empty':
            return {lookup_key: False}
        elif operator == 'not_in':
            return {lookup_key: value}  # 需要在外层用exclude
        elif operator == 'between':
            if value2 is not None:
                return {lookup_key: [value, value2]}
            return None
        elif operator == 'not_between':
            if value2 is not None:
                return {lookup_key: [value, value2]}  # 需要在外层用exclude
            return None
        else:
            return {lookup_key: value}

    def _build_date_lookup(self, field, operator):
        """构建日期相关的查询lookup"""
        from django.utils import timezone
        from datetime import datetime, timedelta
        
        now = timezone.now()
        today = now.date()
        
        if operator == 'is_today':
            return {
                f"{field}__date": today
            }
        elif operator == 'is_yesterday':
            yesterday = today - timedelta(days=1)
            return {
                f"{field}__date": yesterday
            }
        elif operator == 'is_tomorrow':
            tomorrow = today + timedelta(days=1)
            return {
                f"{field}__date": tomorrow
            }
        elif operator == 'is_this_week':
            week_start = today - timedelta(days=today.weekday())
            week_end = week_start + timedelta(days=6)
            return {
                f"{field}__date__range": [week_start, week_end]
            }
        elif operator == 'is_last_week':
            week_start = today - timedelta(days=today.weekday() + 7)
            week_end = week_start + timedelta(days=6)
            return {
                f"{field}__date__range": [week_start, week_end]
            }
        elif operator == 'is_next_week':
            week_start = today + timedelta(days=7 - today.weekday())
            week_end = week_start + timedelta(days=6)
            return {
                f"{field}__date__range": [week_start, week_end]
            }
        elif operator == 'is_this_month':
            month_start = today.replace(day=1)
            if today.month == 12:
                month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
            else:
                month_end = today.replace(month=today.month + 1, day=1) - timedelta(days=1)
            return {
                f"{field}__date__range": [month_start, month_end]
            }
        elif operator == 'is_last_month':
            if today.month == 1:
                month_start = today.replace(year=today.year - 1, month=12, day=1)
                month_end = today.replace(day=1) - timedelta(days=1)
            else:
                month_start = today.replace(month=today.month - 1, day=1)
                month_end = today.replace(day=1) - timedelta(days=1)
            return {
                f"{field}__date__range": [month_start, month_end]
            }
        elif operator == 'is_next_month':
            if today.month == 12:
                month_start = today.replace(year=today.year + 1, month=1, day=1)
                month_end = today.replace(year=today.year + 1, month=2, day=1) - timedelta(days=1)
            else:
                month_start = today.replace(month=today.month + 1, day=1)
                if today.month == 11:
                    month_end = today.replace(year=today.year + 1, month=1, day=1) - timedelta(days=1)
                else:
                    month_end = today.replace(month=today.month + 2, day=1) - timedelta(days=1)
            return {
                f"{field}__date__range": [month_start, month_end]
            }
        elif operator == 'is_overdue':
            return {
                f"{field}__lt": now,
                'status__in': [Task.TaskStatus.UNASSIGNED, Task.TaskStatus.TODO]
            }
        elif operator == 'has_no_date':
            return {
                f"{field}__isnull": True
            }

        return None


# =========================
# 提醒模型（M1 新增）
# =========================

class Reminder(BaseModel):
    """任务提醒 — 支持绝对时间和相对截止时间两种类型"""

    class ReminderType(models.TextChoices):
        ABSOLUTE = "absolute", "绝对时间"      # 指定具体时间点
        RELATIVE = "relative", "相对截止时间"  # 相对于 due_date / start_date 偏移

    class ReminderStatus(models.TextChoices):
        PENDING = "pending", "待触发"
        TRIGGERED = "triggered", "已触发"
        DISMISSED = "dismissed", "已忽略"
        CANCELLED = "cancelled", "已取消"

    class RelativeTo(models.TextChoices):
        DUE_DATE = "due_date", "截止时间"
        START_DATE = "start_date", "开始时间"

    uid = models.CharField(
        max_length=22, unique=True, default=generate_uid, editable=False,
        verbose_name="UID",
    )
    task = models.ForeignKey(
        Task, to_field="uid",
        on_delete=models.CASCADE,
        related_name="reminders",
        verbose_name="任务",
    )
    type = models.CharField(
        max_length=16, choices=ReminderType.choices,
        default=ReminderType.RELATIVE,
        verbose_name="提醒类型",
    )
    # ABSOLUTE 类型使用 trigger_at
    trigger_at = models.DateTimeField(
        null=True, blank=True, db_index=True,
        verbose_name="触发时间（绝对）",
    )
    # RELATIVE 类型使用 offset_minutes + relative_to
    # offset_minutes: 正数 = 提前 N 分钟提醒；0 = 到时提醒；负数 = 延后
    offset_minutes = models.IntegerField(
        null=True, blank=True,
        verbose_name="偏移分钟",
        help_text="正数=提前 N 分钟，0=到时，负数=延后",
    )
    relative_to = models.CharField(
        max_length=16, choices=RelativeTo.choices,
        default=RelativeTo.DUE_DATE,
        verbose_name="相对基准字段",
    )

    status = models.CharField(
        max_length=16, choices=ReminderStatus.choices,
        default=ReminderStatus.PENDING, db_index=True,
        verbose_name="状态",
    )
    triggered_at = models.DateTimeField(null=True, blank=True, verbose_name="实际触发时间")

    # 客户端调度 ID（Expo Notifications / Web Notification tag），便于取消
    client_notification_id = models.CharField(
        max_length=128, blank=True, default="",
        verbose_name="客户端通知 ID",
    )

    class Meta:
        db_table = "ct_reminders"
        ordering = ["trigger_at", "-created_at"]
        verbose_name = verbose_name_plural = "任务提醒"
        indexes = [
            models.Index(fields=["user", "status", "trigger_at"], name="reminder_user_status_at_idx"),
            models.Index(fields=["task", "status"], name="reminder_task_status_idx"),
        ]

    def __str__(self):
        return f"Reminder({self.get_type_display()}) for {self.task_id}"

    @property
    def effective_trigger_at(self):
        """动态计算最终触发时间"""
        if self.type == self.ReminderType.ABSOLUTE:
            return self.trigger_at
        # RELATIVE
        base = getattr(self.task, self.relative_to, None)
        if base is None or self.offset_minutes is None:
            return None
        return base - timedelta(minutes=self.offset_minutes)

    def mark_triggered(self):
        """标记为已触发"""
        self.status = self.ReminderStatus.TRIGGERED
        self.triggered_at = timezone.now()
        self.save(update_fields=["status", "triggered_at", "updated_at"])

    def cancel(self):
        """取消提醒（任务完成/删除时调用）"""
        if self.status == self.ReminderStatus.PENDING:
            self.status = self.ReminderStatus.CANCELLED
            self.save(update_fields=["status", "updated_at"])