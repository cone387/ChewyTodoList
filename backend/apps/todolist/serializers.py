from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from .models import Tag, Group, Project, Task, ActivityLog, TaskView, TaskCardConfig, Reminder

User = get_user_model()


# =========================
# 用户认证序列化器
# =========================

class UserRegistrationSerializer(serializers.ModelSerializer):
    """用户注册序列化器"""
    
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password_confirm',
            'first_name', 'last_name'
        ]

    def validate_email(self, value):
        """验证邮箱唯一性"""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("该邮箱已被注册")
        return value

    def validate(self, attrs):
        """验证密码确认"""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("两次输入的密码不一致")
        return attrs

    def create(self, validated_data):
        """创建用户"""
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserSerializer(serializers.ModelSerializer):
    """用户信息序列化器"""
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'date_joined', 'last_login', 'is_active'
        ]
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']


class ChangePasswordSerializer(serializers.Serializer):
    """修改密码序列化器"""
    
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate_old_password(self, value):
        """验证旧密码"""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("旧密码不正确")
        return value

    def validate(self, attrs):
        """验证新密码确认"""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("两次输入的新密码不一致")
        return attrs

    def save(self):
        """保存新密码"""
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """自定义JWT Token序列化器"""
    
    def validate(self, attrs):
        """验证并返回用户信息"""
        data = super().validate(attrs)
        
        # 添加用户信息到响应
        data['user'] = UserSerializer(self.user).data
        
        return data


# =========================
# 标签序列化器
# =========================

class TagSerializer(serializers.ModelSerializer):
    """标签序列化器"""
    
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Tag
        fields = [
            'uid', 'name', 'color', 'sort_order',
            'created_at', 'updated_at', 'tasks_count'
        ]
        read_only_fields = ['uid', 'created_at', 'updated_at']

    def get_tasks_count(self, obj):
        """获取使用该标签的任务数量"""
        return obj.tasks.count()

    def validate_name(self, value):
        """验证标签名称唯一性"""
        user = self.context['request'].user
        queryset = Tag.objects.filter(user=user, name=value)
        
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("该标签名称已存在")
        
        return value.strip()

    def validate_color(self, value):
        """验证颜色格式"""
        import re
        if not re.match(r'^#[0-9a-fA-F]{6}$', value):
            raise serializers.ValidationError("颜色格式不正确，请使用十六进制格式，如 #ff0000")
        return value

    def create(self, validated_data):
        """创建标签"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# =========================
# 分组序列化器
# =========================

class GroupSerializer(serializers.ModelSerializer):
    """分组序列化器"""
    
    projects_count = serializers.SerializerMethodField()

    class Meta:
        model = Group
        fields = [
            'uid', 'name', 'desc', 'sort_order', 'settings',
            'created_at', 'updated_at', 'projects_count'
        ]
        read_only_fields = ['uid', 'created_at', 'updated_at']

    def get_projects_count(self, obj):
        """获取分组下的项目数量"""
        return obj.projects.count()

    def validate_name(self, value):
        """验证分组名称唯一性"""
        user = self.context['request'].user
        queryset = Group.objects.filter(user=user, name=value)
        
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            raise serializers.ValidationError("该分组名称已存在")
        
        return value.strip()

    def create(self, validated_data):
        """创建分组"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


# =========================
# 项目序列化器
# =========================

class ProjectListSerializer(serializers.ModelSerializer):
    """项目列表序列化器"""
    
    group = GroupSerializer(read_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'uid', 'name', 'desc', 'group', 'view_type', 'style',
            'sort_order', 'created_at', 'updated_at',
            'tasks_count', 'completed_tasks_count'
        ]

    def get_tasks_count(self, obj):
        """获取项目下的任务总数"""
        return obj.tasks.count()

    def get_completed_tasks_count(self, obj):
        """获取项目下已完成的任务数"""
        return obj.tasks.filter(status=Task.TaskStatus.COMPLETED).count()


class ProjectSerializer(serializers.ModelSerializer):
    """项目详情序列化器"""
    
    group = GroupSerializer(read_only=True)
    group_uid = serializers.CharField(write_only=True)
    tasks_count = serializers.SerializerMethodField()
    completed_tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Project
        fields = [
            'uid', 'name', 'desc', 'group', 'group_uid', 'view_type',
            'style', 'settings', 'sort_order', 'created_at', 'updated_at',
            'tasks_count', 'completed_tasks_count'
        ]
        read_only_fields = ['uid', 'created_at', 'updated_at']

    def get_tasks_count(self, obj):
        """获取项目下的任务总数"""
        return obj.tasks.count()

    def get_completed_tasks_count(self, obj):
        """获取项目下已完成的任务数"""
        return obj.tasks.filter(status=Task.TaskStatus.COMPLETED).count()

    def validate_group_uid(self, value):
        """验证分组UID"""
        user = self.context['request'].user
        try:
            group = Group.objects.get(uid=value, user=user)
            return group
        except Group.DoesNotExist:
            raise serializers.ValidationError("指定的分组不存在")

    def validate_name(self, value):
        """验证项目名称唯一性"""
        user = self.context['request'].user
        group_uid = self.initial_data.get('group_uid')
        
        if group_uid:
            try:
                group = Group.objects.get(uid=group_uid, user=user)
                queryset = Project.objects.filter(user=user, group=group, name=value)
                
                if self.instance:
                    queryset = queryset.exclude(pk=self.instance.pk)
                
                if queryset.exists():
                    raise serializers.ValidationError("该分组下已存在同名项目")
            except Group.DoesNotExist:
                pass
        
        return value.strip()

    def create(self, validated_data):
        """创建项目"""
        group = validated_data.pop('group_uid')
        validated_data['group'] = group
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """更新项目"""
        if 'group_uid' in validated_data:
            group = validated_data.pop('group_uid')
            validated_data['group'] = group
        return super().update(instance, validated_data)


# =========================
# 重复任务 & 提醒 序列化器 (M2)
# =========================

_RRULE_FREQ_LABEL = {
    'DAILY': '每天',
    'WEEKLY': '每周',
    'MONTHLY': '每月',
    'YEARLY': '每年',
}
_RRULE_BYDAY_LABEL = {'MO': '一', 'TU': '二', 'WE': '三', 'TH': '四', 'FR': '五', 'SA': '六', 'SU': '日'}


def _rrule_to_human(rule: str) -> str:
    """把 RRULE 字符串转成中文人类可读"""
    parts = {}
    for seg in (rule or '').split(';'):
        if '=' in seg:
            k, v = seg.split('=', 1)
            parts[k.upper()] = v.upper()
    freq = _RRULE_FREQ_LABEL.get(parts.get('FREQ', ''), parts.get('FREQ', '自定义'))
    interval = parts.get('INTERVAL')
    prefix = f"每 {interval} {freq[1:]}" if interval and interval != '1' else freq
    byday = parts.get('BYDAY')
    if byday:
        days = ', '.join(f"周{_RRULE_BYDAY_LABEL.get(d, d)}" for d in byday.split(','))
        prefix += f" {days}"
    bymonthday = parts.get('BYMONTHDAY')
    if bymonthday:
        prefix += f" {bymonthday} 号"
    count = parts.get('COUNT')
    until = parts.get('UNTIL')
    if count:
        prefix += f"，共 {count} 次"
    elif until:
        prefix += f"，截止 {until[:8]}"
    return prefix


def _build_rrule(recurrence: dict) -> str:
    """把结构化 dict 转成 RRULE 字符串"""
    if not recurrence:
        return ''
    parts = []
    freq = (recurrence.get('freq') or '').upper()
    if freq not in ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'):
        raise serializers.ValidationError({'recurrence': "freq 必须是 DAILY/WEEKLY/MONTHLY/YEARLY 之一"})
    parts.append(f"FREQ={freq}")
    interval = recurrence.get('interval')
    if interval and int(interval) > 1:
        parts.append(f"INTERVAL={int(interval)}")
    byday = recurrence.get('byday')
    if byday:
        if not isinstance(byday, list):
            raise serializers.ValidationError({'recurrence': "byday 必须是数组"})
        parts.append("BYDAY=" + ",".join(d.upper() for d in byday))
    bymonthday = recurrence.get('bymonthday')
    if bymonthday:
        parts.append(f"BYMONTHDAY={int(bymonthday)}")
    count = recurrence.get('count')
    until = recurrence.get('until')
    if count and until:
        raise serializers.ValidationError({'recurrence': "count 和 until 不能同时指定"})
    if count:
        parts.append(f"COUNT={int(count)}")
    if until:
        # until 必须是 ISO 或 YYYYMMDDTHHMMSSZ 格式
        if isinstance(until, str) and 'T' not in until and len(until) == 10:
            # YYYY-MM-DD → 当天 23:59:59 UTC
            until = until.replace('-', '') + 'T235959Z'
        parts.append(f"UNTIL={until}")
    return ";".join(parts)


class ReminderSerializer(serializers.ModelSerializer):
    """提醒序列化器"""

    effective_trigger_at = serializers.SerializerMethodField()
    task_uid = serializers.CharField(source='task.uid', read_only=True)

    class Meta:
        model = Reminder
        fields = [
            'uid', 'task_uid',
            'type', 'trigger_at',
            'offset_minutes', 'relative_to',
            'status',
            'triggered_at', 'client_notification_id',
            'effective_trigger_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['uid', 'task_uid', 'triggered_at', 'created_at', 'updated_at']

    def get_effective_trigger_at(self, obj):
        v = obj.effective_trigger_at
        return v.isoformat() if v else None

    def validate(self, attrs):
        t = attrs.get('type') or getattr(self.instance, 'type', None)
        if t == Reminder.ReminderType.ABSOLUTE:
            if not attrs.get('trigger_at') and (not self.instance or not self.instance.trigger_at):
                raise serializers.ValidationError({'trigger_at': "absolute 类型必须提供 trigger_at"})
        elif t == Reminder.ReminderType.RELATIVE:
            if attrs.get('offset_minutes') is None and (not self.instance or self.instance.offset_minutes is None):
                raise serializers.ValidationError({'offset_minutes': "relative 类型必须提供 offset_minutes"})
        return attrs


# =========================
# 任务序列化器
# =========================

class TaskListSerializer(serializers.ModelSerializer):
    """任务列表序列化器"""

    project = ProjectListSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    subtasks_count = serializers.SerializerMethodField()
    completed_subtasks_count = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'uid', 'title', 'content', 'status', 'status_display',
            'priority', 'priority_display', 'project', 'parent',
            'tags', 'is_all_day', 'start_date', 'due_date',
            'completed_time', 'time_zone', 'sort_order', 'custom_group',
            'attachments', 'created_at', 'updated_at', 'is_completed', 'is_overdue',
            'subtasks_count', 'completed_subtasks_count'
        ]

    def get_subtasks_count(self, obj):
        """获取子任务数量"""
        return obj.subtasks.count()

    def get_completed_subtasks_count(self, obj):
        """获取已完成子任务数量"""
        return obj.subtasks.filter(status=Task.TaskStatus.COMPLETED).count()


class TaskSerializer(serializers.ModelSerializer):
    """任务详情序列化器"""

    project = ProjectListSerializer(read_only=True)
    project_uid = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    parent = serializers.CharField(source='parent.uid', read_only=True)
    parent_uid = serializers.CharField(write_only=True, required=False, allow_null=True)
    tags = TagSerializer(many=True, read_only=True)
    tag_uids = serializers.ListField(
        child=serializers.CharField(),
        write_only=True,
        required=False,
        allow_empty=True
    )
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    subtasks_count = serializers.SerializerMethodField()
    completed_subtasks_count = serializers.SerializerMethodField()

    # === M2: 重复任务 + 提醒 ===
    reminders = ReminderSerializer(many=True, read_only=True)
    reminders_input = serializers.ListField(
        child=serializers.DictField(), write_only=True, required=False, allow_empty=True,
        help_text="创建/更新时的 reminders 列表（会替换现有 pending 提醒）",
    )
    recurrence = serializers.SerializerMethodField(read_only=True)
    recurrence_input = serializers.DictField(
        write_only=True, required=False, allow_null=True,
        help_text="{ freq, interval, byday, bymonthday, count, until }",
    )
    recurrence_parent = serializers.CharField(source='recurrence_parent.uid', read_only=True)
    is_recurrence_template = serializers.BooleanField(read_only=True)

    class Meta:
        model = Task
        fields = [
            'uid', 'title', 'content', 'status', 'status_display',
            'priority', 'priority_display', 'project', 'project_uid',
            'parent', 'parent_uid', 'tags', 'tag_uids', 'is_all_day',
            'start_date', 'due_date', 'completed_time', 'time_zone',
            'sort_order', 'custom_group', 'attachments', 'created_at', 'updated_at',
            'is_completed', 'is_overdue', 'subtasks_count', 'completed_subtasks_count',
            # M2 new
            'reminders', 'reminders_input',
            'recurrence', 'recurrence_input',
            'recurrence_parent', 'is_recurrence_template',
        ]
        read_only_fields = ['uid', 'created_at', 'updated_at', 'completed_time']

    def get_recurrence(self, obj):
        """读取时渲染 recurrence_rule 为结构化 dict"""
        if not obj.recurrence_rule and not obj.recurrence_parent_id:
            return None
        # 对实例任务，读取模板的 rule
        source = obj if obj.recurrence_rule else obj.recurrence_parent
        if source is None or not source.recurrence_rule:
            return None
        return {
            'rule': source.recurrence_rule,
            'dtstart': source.recurrence_dtstart.isoformat() if source.recurrence_dtstart else None,
            'human': _rrule_to_human(source.recurrence_rule),
        }

    def get_subtasks_count(self, obj):
        """获取子任务数量"""
        return obj.subtasks.count()

    def get_completed_subtasks_count(self, obj):
        """获取已完成子任务数量"""
        return obj.subtasks.filter(status=Task.TaskStatus.COMPLETED).count()

    def validate_project_uid(self, value):
        """验证项目UID"""
        # 如果没有提供项目，返回 None（后续会使用默认项目）
        if not value or value == 'null' or value == '':
            return None
            
        user = self.context['request'].user
        try:
            project = Project.objects.get(uid=value, user=user)
            return project
        except Project.DoesNotExist:
            raise serializers.ValidationError("指定的项目不存在")

    def validate_parent_uid(self, value):
        """验证父任务UID"""
        if not value:
            return None
        
        user = self.context['request'].user
        try:
            parent_task = Task.objects.get(uid=value, user=user)
            
            # 检查是否会形成循环引用
            if self.instance and self.instance.uid == value:
                raise serializers.ValidationError("任务不能设置自己为父任务")
            
            return parent_task
        except Task.DoesNotExist:
            raise serializers.ValidationError("指定的父任务不存在")

    def validate_tag_uids(self, value):
        """验证标签UID列表"""
        if not value:
            return []
        
        user = self.context['request'].user
        tags = Tag.objects.filter(uid__in=value, user=user)
        
        if len(tags) != len(value):
            found_uids = set(tag.uid for tag in tags)
            missing_uids = set(value) - found_uids
            raise serializers.ValidationError(f"以下标签不存在: {', '.join(missing_uids)}")
        
        return tags

    def validate_title(self, value):
        """验证标题"""
        if not value or not value.strip():
            raise serializers.ValidationError("标题不能为空")
        return value.strip()

    def validate(self, attrs):
        """整体验证"""
        # 验证时间范围
        start_date = attrs.get('start_date')
        due_date = attrs.get('due_date')
        
        if start_date and due_date and start_date > due_date:
            raise serializers.ValidationError("开始时间不能晚于截止时间")
        
        return attrs

    def create(self, validated_data):
        """创建任务"""
        user = self.context['request'].user
        project = validated_data.pop('project_uid', None)

        # 项目是可选的，允许为 None（收集箱模式）
        # 不再强制要求用户必须有项目才能创建任务

        parent = validated_data.pop('parent_uid', None)
        tag_uids = validated_data.pop('tag_uids', [])
        reminders_input = validated_data.pop('reminders_input', None)
        recurrence_input = validated_data.pop('recurrence_input', None)

        validated_data['project'] = project
        validated_data['parent'] = parent
        validated_data['user'] = user

        # 若指定 recurrence_input，走 create_recurring_task 生成模板 + 首实例；
        # 否则走常规创建流程
        if recurrence_input:
            from .services.recurrence import create_recurring_task
            rule = _build_rrule(recurrence_input)
            dtstart = validated_data.get('due_date') or validated_data.get('start_date')
            if not dtstart:
                raise serializers.ValidationError(
                    {'recurrence': "创建重复任务必须同时提供 start_date 或 due_date 作为 DTSTART"}
                )
            # 剥离无法传给 create_recurring_task 的字段
            extra = {k: v for k, v in validated_data.items() if k not in (
                'user', 'project', 'title', 'is_all_day', 'start_date', 'due_date',
            )}
            template, first = create_recurring_task(
                user,
                title=validated_data['title'],
                recurrence_rule=rule,
                dtstart=dtstart,
                project=project,
                is_all_day=validated_data.get('is_all_day', True),
                start_date=validated_data.get('start_date'),
                due_date=validated_data.get('due_date'),
                **extra,
            )
            # tags 绑定到 template，新实例已在 create_recurring_task 中继承
            if tag_uids:
                template.tags.set(tag_uids)
                first.tags.set(tag_uids)
            # reminders 绑定到 template（未来实例会继承 pending）
            if reminders_input:
                self._sync_reminders(template, reminders_input, user)
                # 首个实例也立即同步一份，防止用户此刻就想收到
                self._sync_reminders(first, reminders_input, user)
            return first

        task = super().create(validated_data)
        if tag_uids:
            task.tags.set(tag_uids)
        if reminders_input:
            self._sync_reminders(task, reminders_input, user)
        return task

    def update(self, instance, validated_data):
        """更新任务"""
        if 'project_uid' in validated_data:
            project = validated_data.pop('project_uid')
            validated_data['project'] = project

        if 'parent_uid' in validated_data:
            parent = validated_data.pop('parent_uid')
            validated_data['parent'] = parent

        tag_uids = validated_data.pop('tag_uids', None)
        reminders_input = validated_data.pop('reminders_input', None)
        # recurrence_input 在 update 时忽略（应通过 /tasks/{uid}/ + scope 头处理，见 viewset）
        validated_data.pop('recurrence_input', None)

        task = super().update(instance, validated_data)

        # 更新标签
        if tag_uids is not None:
            task.tags.set(tag_uids)

        if reminders_input is not None:
            user = self.context['request'].user
            self._sync_reminders(task, reminders_input, user)

        return task

    def _sync_reminders(self, task, reminders_input, user):
        """替换任务当前 pending 的 reminders；保留已触发/已取消的"""
        task.reminders.filter(status=Reminder.ReminderStatus.PENDING).delete()
        for item in reminders_input:
            Reminder.objects.create(
                user=user,
                task=task,
                type=item.get('type', Reminder.ReminderType.RELATIVE),
                trigger_at=item.get('trigger_at'),
                offset_minutes=item.get('offset_minutes'),
                relative_to=item.get('relative_to', Reminder.RelativeTo.DUE_DATE),
                client_notification_id=item.get('client_notification_id', ''),
            )


# =========================
# 批量更新序列化器
# =========================

class BulkUpdateTaskSerializer(serializers.Serializer):
    """批量更新任务序列化器"""
    
    task_uids = serializers.ListField(
        child=serializers.CharField(),
        min_length=1,
        max_length=100
    )
    data = serializers.DictField()

    def validate_task_uids(self, value):
        """验证任务UID列表"""
        user = self.context['request'].user
        tasks = Task.objects.filter(uid__in=value, user=user)
        
        if len(tasks) != len(value):
            found_uids = set(task.uid for task in tasks)
            missing_uids = set(value) - found_uids
            raise serializers.ValidationError(f"以下任务不存在: {', '.join(missing_uids)}")
        
        return tasks

    def validate_data(self, value):
        """验证更新数据"""
        allowed_fields = ['status', 'priority', 'project_uid', 'tag_uids']
        
        for field in value.keys():
            if field not in allowed_fields:
                raise serializers.ValidationError(f"不允许批量更新字段: {field}")
        
        # 验证状态
        if 'status' in value:
            if value['status'] not in [choice[0] for choice in Task.TaskStatus.choices]:
                raise serializers.ValidationError("无效的任务状态")
        
        # 验证优先级
        if 'priority' in value:
            if value['priority'] not in [choice[0] for choice in Task.TaskPriority.choices]:
                raise serializers.ValidationError("无效的任务优先级")
        
        return value


# =========================
# 活动日志序列化器
# =========================

class ActivityLogSerializer(serializers.ModelSerializer):
    """活动日志序列化器"""
    
    task = serializers.CharField(source='task.title', read_only=True)
    task_uid = serializers.CharField(source='task.uid', read_only=True)
    project = serializers.SerializerMethodField(read_only=True)
    project_uid = serializers.SerializerMethodField(read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'task', 'task_uid', 'project', 'project_uid',
            'action', 'action_display', 'detail', 'created_at'
        ]
    
    def get_project(self, obj):
        """获取项目名称，如果项目为空返回'收集箱'"""
        return obj.project.name if obj.project else '收集箱'
    
    def get_project_uid(self, obj):
        """获取项目UID，如果项目为空返回None"""
        return obj.project.uid if obj.project else None


# =========================
# 卡片配置序列化器
# =========================

class TaskCardConfigSerializer(serializers.ModelSerializer):
    """卡片配置序列化器"""

    class Meta:
        model = TaskCardConfig
        fields = [
            'uid', 'name', 'desc', 'is_preset', 'layout',
            'style', 'field_configs', 'sort_order',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['uid', 'is_preset', 'created_at', 'updated_at']

    def validate_name(self, value):
        """验证名称唯一性"""
        user = self.context['request'].user
        queryset = TaskCardConfig.objects.filter(user=user, name=value)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        if queryset.exists():
            raise serializers.ValidationError("该卡片配置名称已存在")
        return value.strip()

    def validate_layout(self, value):
        allowed = ['compact', 'comfortable', 'spacious']
        if value not in allowed:
            raise serializers.ValidationError(f"布局必须是 {', '.join(allowed)} 之一")
        return value

    def validate_field_configs(self, value):
        """验证字段配置"""
        if not isinstance(value, list):
            raise serializers.ValidationError("字段配置必须是数组格式")

        known_fields = {f['field'] for f in TaskCardConfig.AVAILABLE_FIELDS}
        allowed_positions = {'header', 'header_left', 'header_right', 'body', 'footer'}

        for i, fc in enumerate(value):
            if not isinstance(fc, dict):
                raise serializers.ValidationError(f"field_configs[{i}] 必须是对象")
            field = fc.get('field')
            if field not in known_fields:
                raise serializers.ValidationError(f"不支持的字段: {field}")
            if 'position' in fc and fc['position'] not in allowed_positions:
                raise serializers.ValidationError(
                    f"field_configs[{i}].position 必须是 {', '.join(allowed_positions)} 之一"
                )
        return value

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskCardConfigListSerializer(serializers.ModelSerializer):
    """卡片配置列表序列化器"""

    class Meta:
        model = TaskCardConfig
        fields = [
            'uid', 'name', 'desc', 'is_preset', 'layout',
            'sort_order', 'created_at', 'updated_at',
        ]


# =========================
# 视图序列化器
# =========================

class TaskViewSerializer(serializers.ModelSerializer):
    """任务视图序列化器"""
    
    project = ProjectListSerializer(read_only=True)
    project_uid = serializers.CharField(write_only=True, required=False, allow_null=True)
    card_config = TaskCardConfigSerializer(read_only=True)
    card_config_uid = serializers.CharField(write_only=True, required=False, allow_null=True)
    view_type_display = serializers.CharField(source='get_view_type_display', read_only=True)

    class Meta:
        model = TaskView
        fields = [
            'uid', 'name', 'project', 'project_uid', 'view_type', 'view_type_display',
            'is_default', 'is_public', 'is_system', 'is_visible_in_nav', 'sort_order', 
            'card_config', 'card_config_uid',
            'filters', 'sorts', 'group_by', 'view_settings', 'follow_selected_project',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['uid', 'is_system', 'created_at', 'updated_at']

    def validate_project_uid(self, value):
        """验证项目UID"""
        if not value or value == 'null' or value == '':
            return None
        
        user = self.context['request'].user
        try:
            project = Project.objects.get(uid=value, user=user)
            return project
        except Project.DoesNotExist:
            raise serializers.ValidationError("指定的项目不存在")

    def validate_card_config_uid(self, value):
        """验证卡片配置UID"""
        if not value or value == 'null' or value == '':
            return None

        from django.db.models import Q
        user = self.context['request'].user
        try:
            return TaskCardConfig.objects.get(
                Q(uid=value),
                Q(user=user) | Q(is_preset=True),
            )
        except TaskCardConfig.DoesNotExist:
            raise serializers.ValidationError("卡片配置不存在")

    def validate_name(self, value):
        """验证视图名称唯一性"""
        user = self.context['request'].user
        project_uid = self.initial_data.get('project_uid')
        
        # 获取项目对象
        project = None
        if project_uid and project_uid != 'null':  # 处理前端发送的字符串'null'
            try:
                project = Project.objects.get(uid=project_uid, user=user)
            except Project.DoesNotExist:
                pass
        
        # 检查同一项目下的视图名称唯一性
        queryset = TaskView.objects.filter(user=user, project=project, name=value)
        
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)
        
        if queryset.exists():
            project_name = project.name if project else "全局"
            raise serializers.ValidationError(f"在{project_name}下已存在同名视图")
        
        return value.strip()

    def validate_filters(self, value):
        """验证筛选条件"""
        if not isinstance(value, list):
            raise serializers.ValidationError("筛选条件必须是数组格式")
        
        allowed_fields = [
            'status', 'priority', 'title', 'content', 'project__name',
            'tags__name', 'start_date', 'due_date', 'created_at', 'updated_at',
            'is_completed', 'is_overdue'
        ]
        
        allowed_operators = [
            'equals', 'not_equals', 'contains', 'not_contains',
            'starts_with', 'ends_with', 'is_empty', 'is_not_empty',
            'greater_than', 'greater_than_or_equal', 'less_than', 'less_than_or_equal',
            'in', 'not_in', 'between', 'not_between',
            'is_today', 'is_yesterday', 'is_tomorrow', 'is_this_week', 
            'is_last_week', 'is_next_week', 'is_this_month', 
            'is_last_month', 'is_next_month', 'is_overdue', 'has_no_date',
            'is_true', 'is_false'
        ]
        
        # 不需要值的操作符
        no_value_operators = [
            'is_empty', 'is_not_empty', 'is_today', 'is_yesterday', 'is_tomorrow',
            'is_this_week', 'is_last_week', 'is_next_week', 'is_this_month',
            'is_last_month', 'is_next_month', 'is_overdue', 'has_no_date',
            'is_true', 'is_false'
        ]
        
        for i, filter_rule in enumerate(value):
            if not isinstance(filter_rule, dict):
                raise serializers.ValidationError(f"筛选条件[{i}]必须是对象格式")
            
            field = filter_rule.get('field')
            operator = filter_rule.get('operator')
            
            if field not in allowed_fields:
                raise serializers.ValidationError(f"不支持的筛选字段: {field}")
            
            if operator not in allowed_operators:
                raise serializers.ValidationError(f"不支持的筛选操作符: {operator}")
            
            # 验证逻辑操作符
            logic = filter_rule.get('logic', 'and')
            if logic not in ['and', 'or']:
                raise serializers.ValidationError(f"筛选条件[{i}]的逻辑操作符必须是 and 或 or")
            
            # 对于不需要值的操作符，强制设置value为None
            if operator in no_value_operators:
                filter_rule['value'] = None
                filter_rule.pop('value2', None)
        
        return value

    def validate_sorts(self, value):
        """验证排序规则"""
        if not isinstance(value, list):
            raise serializers.ValidationError("排序规则必须是数组格式")
        
        allowed_fields = [
            'status', 'priority', 'title', 'start_date', 'due_date',
            'created_at', 'updated_at', 'sort_order'
        ]
        
        for i, sort_rule in enumerate(value):
            if not isinstance(sort_rule, dict):
                raise serializers.ValidationError(f"排序规则[{i}]必须是对象格式")
            
            field = sort_rule.get('field')
            direction = sort_rule.get('direction', 'asc')
            
            if field not in allowed_fields:
                raise serializers.ValidationError(f"不支持的排序字段: {field}")
            
            if direction not in ['asc', 'desc']:
                raise serializers.ValidationError(f"排序方向必须是 asc 或 desc")
        
        return value

    def validate_group_by(self, value):
        """验证分组字段"""
        if not value:
            return value
        
        allowed_fields = ['status', 'priority', 'project', 'tags', 'due_date']
        
        if value not in allowed_fields:
            raise serializers.ValidationError(f"不支持的分组字段: {value}")
        
        return value

    def create(self, validated_data):
        """创建视图"""
        project = validated_data.pop('project_uid', None)
        card_config = validated_data.pop('card_config_uid', None)
        validated_data['project'] = project
        validated_data['card_config'] = card_config
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """更新视图"""
        if 'project_uid' in validated_data:
            project = validated_data.pop('project_uid')
            validated_data['project'] = project
        if 'card_config_uid' in validated_data:
            card_config = validated_data.pop('card_config_uid')
            validated_data['card_config'] = card_config
        return super().update(instance, validated_data)


class TaskViewListSerializer(serializers.ModelSerializer):
    """任务视图列表序列化器"""
    
    project = ProjectListSerializer(read_only=True)
    card_config = TaskCardConfigListSerializer(read_only=True)
    view_type_display = serializers.CharField(source='get_view_type_display', read_only=True)
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = TaskView
        fields = [
            'uid', 'name', 'project', 'view_type', 'view_type_display',
            'is_default', 'is_public', 'is_system', 'is_visible_in_nav', 'sort_order', 
            'card_config',
            'filters', 'sorts', 'group_by', 'view_settings', 'follow_selected_project',
            'tasks_count', 'created_at', 'updated_at'
        ]

    def get_tasks_count(self, obj):
        """获取视图下的任务数量"""
        from .models import Task
        
        try:
            # 获取基础查询集
            queryset = Task.objects.filter(user=obj.user)
            
            # 如果视图绑定了项目，则筛选项目
            if obj.project:
                queryset = queryset.filter(project=obj.project)
            
            # 应用筛选条件
            queryset = obj.apply_filters(queryset)
            
            return queryset.count()
        except Exception as e:
            # 如果筛选条件有问题，返回0
            return 0