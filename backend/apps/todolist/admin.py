from django.contrib import admin
from .models import Tag, Group, Project, Task, ActivityLog


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """标签管理"""
    
    list_display = ['name', 'color', 'user', 'sort_order', 'created_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'user__username']
    readonly_fields = ['uid', 'created_at', 'updated_at']
    ordering = ['user', 'sort_order', '-updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('uid', 'name', 'color', 'user')
        }),
        ('设置', {
            'fields': ('sort_order',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    """分组管理"""
    
    list_display = ['name', 'user', 'sort_order', 'created_at', 'updated_at']
    list_filter = ['created_at', 'updated_at']
    search_fields = ['name', 'desc', 'user__username']
    readonly_fields = ['uid', 'created_at', 'updated_at']
    ordering = ['user', 'sort_order', '-updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('uid', 'name', 'desc', 'user')
        }),
        ('设置', {
            'fields': ('sort_order', 'settings')
        }),
        ('附件', {
            'fields': ('attachments',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """项目管理"""
    
    list_display = ['name', 'group', 'user', 'view_type', 'sort_order', 'created_at']
    list_filter = ['view_type', 'created_at', 'updated_at', 'group']
    search_fields = ['name', 'desc', 'user__username', 'group__name']
    readonly_fields = ['uid', 'created_at', 'updated_at']
    ordering = ['user', 'group', 'sort_order', '-updated_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('uid', 'name', 'desc', 'user', 'group')
        }),
        ('显示设置', {
            'fields': ('view_type', 'style', 'sort_order')
        }),
        ('其他设置', {
            'fields': ('settings',)
        }),
        ('附件', {
            'fields': ('attachments',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """任务管理"""
    
    list_display = [
        'title', 'status', 'priority', 'project', 'user', 
        'due_date', 'is_completed', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'is_all_day', 'created_at', 
        'updated_at', 'project', 'project__group'
    ]
    search_fields = ['title', 'content', 'user__username', 'project__name']
    readonly_fields = ['uid', 'created_at', 'updated_at', 'completed_time']
    ordering = ['user', 'project', 'sort_order', '-updated_at']
    filter_horizontal = ['tags']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('uid', 'title', 'content', 'user', 'project', 'parent')
        }),
        ('状态和优先级', {
            'fields': ('status', 'priority', 'completed_time')
        }),
        ('时间设置', {
            'fields': ('is_all_day', 'start_date', 'due_date', 'time_zone')
        }),
        ('分类和标签', {
            'fields': ('tags', 'custom_group')
        }),
        ('排序', {
            'fields': ('sort_order',)
        }),
        ('附件', {
            'fields': ('attachments',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    
    def is_completed(self, obj):
        """是否已完成"""
        return obj.is_completed
    is_completed.boolean = True
    is_completed.short_description = '已完成'


@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    """活动日志管理"""
    
    list_display = ['task', 'action', 'user', 'project', 'created_at']
    list_filter = ['action', 'created_at', 'project']
    search_fields = ['task__title', 'user__username', 'project__name', 'detail']
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['-created_at']
    
    fieldsets = (
        ('基本信息', {
            'fields': ('task', 'project', 'user', 'action')
        }),
        ('详细信息', {
            'fields': ('detail',)
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )