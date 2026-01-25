from rest_framework import serializers
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.utils import timezone
from .models import Tag, Group, Project, Task, ActivityLog, TaskView

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

    class Meta:
        model = Task
        fields = [
            'uid', 'title', 'content', 'status', 'status_display',
            'priority', 'priority_display', 'project', 'project_uid',
            'parent', 'parent_uid', 'tags', 'tag_uids', 'is_all_day',
            'start_date', 'due_date', 'completed_time', 'time_zone',
            'sort_order', 'custom_group', 'attachments', 'created_at', 'updated_at',
            'is_completed', 'is_overdue', 'subtasks_count', 'completed_subtasks_count'
        ]
        read_only_fields = ['uid', 'created_at', 'updated_at', 'completed_time']

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
        
        # 如果没有指定项目，使用默认项目
        if project is None:
            try:
                # 获取用户的默认项目（名为"默认项目"或第一个项目）
                project = Project.objects.filter(user=user, name="默认项目").first()
                if not project:
                    project = Project.objects.filter(user=user).first()
                if not project:
                    raise serializers.ValidationError("请先创建项目")
            except Exception as e:
                raise serializers.ValidationError(f"获取默认项目失败: {str(e)}")
        
        parent = validated_data.pop('parent_uid', None)
        tag_uids = validated_data.pop('tag_uids', [])
        
        validated_data['project'] = project
        validated_data['parent'] = parent
        validated_data['user'] = user
        
        task = super().create(validated_data)
        
        # 设置标签
        if tag_uids:
            task.tags.set(tag_uids)
        
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
        
        task = super().update(instance, validated_data)
        
        # 更新标签
        if tag_uids is not None:
            task.tags.set(tag_uids)
        
        return task


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
    project = serializers.CharField(source='project.name', read_only=True)
    project_uid = serializers.CharField(source='project.uid', read_only=True)
    action_display = serializers.CharField(source='get_action_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'task', 'task_uid', 'project', 'project_uid',
            'action', 'action_display', 'detail', 'created_at'
        ]


# =========================
# 视图序列化器
# =========================

class TaskViewSerializer(serializers.ModelSerializer):
    """任务视图序列化器"""
    
    project = ProjectListSerializer(read_only=True)
    project_uid = serializers.CharField(write_only=True, required=False, allow_null=True)
    view_type_display = serializers.CharField(source='get_view_type_display', read_only=True)

    class Meta:
        model = TaskView
        fields = [
            'uid', 'name', 'project', 'project_uid', 'view_type', 'view_type_display',
            'is_default', 'is_public', 'is_visible_in_nav', 'sort_order', 'filters', 'sorts', 'group_by',
            'display_settings', 'created_at', 'updated_at'
        ]
        read_only_fields = ['uid', 'created_at', 'updated_at']

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
        validated_data['project'] = project
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """更新视图"""
        if 'project_uid' in validated_data:
            project = validated_data.pop('project_uid')
            validated_data['project'] = project
        return super().update(instance, validated_data)


class TaskViewListSerializer(serializers.ModelSerializer):
    """任务视图列表序列化器"""
    
    project = ProjectListSerializer(read_only=True)
    view_type_display = serializers.CharField(source='get_view_type_display', read_only=True)
    tasks_count = serializers.SerializerMethodField()

    class Meta:
        model = TaskView
        fields = [
            'uid', 'name', 'project', 'view_type', 'view_type_display',
            'is_default', 'is_public', 'is_visible_in_nav', 'sort_order', 'tasks_count',
            'created_at', 'updated_at'
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