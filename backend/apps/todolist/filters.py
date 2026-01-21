import django_filters
from django.utils import timezone
from .models import Tag, Group, Project, Task, ActivityLog


class TagFilter(django_filters.FilterSet):
    """标签过滤器"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    color = django_filters.CharFilter(lookup_expr='iexact')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Tag
        fields = ['name', 'color', 'created_after', 'created_before']


class GroupFilter(django_filters.FilterSet):
    """分组过滤器"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Group
        fields = ['name', 'created_after', 'created_before']


class ProjectFilter(django_filters.FilterSet):
    """项目过滤器"""
    
    name = django_filters.CharFilter(lookup_expr='icontains')
    group = django_filters.CharFilter(field_name='group__uid')
    view_type = django_filters.ChoiceFilter(choices=Project.ViewType.choices)
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Project
        fields = ['name', 'group', 'view_type', 'created_after', 'created_before']


class TaskFilter(django_filters.FilterSet):
    """任务过滤器"""
    
    title = django_filters.CharFilter(lookup_expr='icontains')
    content = django_filters.CharFilter(lookup_expr='icontains')
    project = django_filters.CharFilter(field_name='project__uid')
    parent = django_filters.CharFilter(field_name='parent__uid')
    status = django_filters.MultipleChoiceFilter(choices=Task.TaskStatus.choices)
    priority = django_filters.MultipleChoiceFilter(choices=Task.TaskPriority.choices)
    tags = django_filters.CharFilter(method='filter_tags')
    is_all_day = django_filters.BooleanFilter()
    
    # 时间过滤
    start_date_from = django_filters.DateTimeFilter(field_name='start_date', lookup_expr='gte')
    start_date_to = django_filters.DateTimeFilter(field_name='start_date', lookup_expr='lte')
    due_date_from = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='gte')
    due_date_to = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='lte')
    
    # 创建时间过滤
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    
    # 特殊过滤
    is_overdue = django_filters.BooleanFilter(method='filter_overdue')
    has_subtasks = django_filters.BooleanFilter(method='filter_has_subtasks')
    is_root_task = django_filters.BooleanFilter(method='filter_root_task')

    class Meta:
        model = Task
        fields = [
            'title', 'content', 'project', 'parent', 'status', 'priority',
            'tags', 'is_all_day', 'start_date_from', 'start_date_to',
            'due_date_from', 'due_date_to', 'created_after', 'created_before',
            'is_overdue', 'has_subtasks', 'is_root_task'
        ]

    def filter_tags(self, queryset, name, value):
        """按标签过滤"""
        if not value:
            return queryset
        
        # 支持多个标签，用逗号分隔
        tag_uids = [uid.strip() for uid in value.split(',') if uid.strip()]
        if tag_uids:
            return queryset.filter(tags__uid__in=tag_uids).distinct()
        
        return queryset

    def filter_overdue(self, queryset, name, value):
        """过滤逾期任务"""
        if value is True:
            return queryset.filter(
                due_date__lt=timezone.now(),
                status__in=[Task.TaskStatus.UNASSIGNED, Task.TaskStatus.TODO]
            )
        elif value is False:
            return queryset.exclude(
                due_date__lt=timezone.now(),
                status__in=[Task.TaskStatus.UNASSIGNED, Task.TaskStatus.TODO]
            )
        return queryset

    def filter_has_subtasks(self, queryset, name, value):
        """过滤有子任务的任务"""
        if value is True:
            return queryset.filter(subtasks__isnull=False).distinct()
        elif value is False:
            return queryset.filter(subtasks__isnull=True)
        return queryset

    def filter_root_task(self, queryset, name, value):
        """过滤根任务（没有父任务的任务）"""
        if value is True:
            return queryset.filter(parent__isnull=True)
        elif value is False:
            return queryset.filter(parent__isnull=False)
        return queryset


class ActivityLogFilter(django_filters.FilterSet):
    """活动日志过滤器"""
    
    task = django_filters.CharFilter(field_name='task__uid')
    project = django_filters.CharFilter(field_name='project__uid')
    action = django_filters.MultipleChoiceFilter(choices=ActivityLog.ActionType.choices)
    date_from = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = ActivityLog
        fields = ['task', 'project', 'action', 'date_from', 'date_to']