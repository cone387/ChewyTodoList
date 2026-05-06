from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.db import transaction
from django.http import JsonResponse
from copy import deepcopy

from .models import Tag, Group, Project, Task, ActivityLog, TaskView, TaskCardConfig, Reminder
from .serializers import (
    UserRegistrationSerializer,
    UserSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
    TagSerializer,
    GroupSerializer,
    ProjectSerializer,
    ProjectListSerializer,
    TaskSerializer,
    TaskListSerializer,
    BulkUpdateTaskSerializer,
    ActivityLogSerializer,
    TaskViewSerializer,
    TaskViewListSerializer,
    TaskCardConfigSerializer,
    TaskCardConfigListSerializer,
    ReminderSerializer,
)
from .filters import TagFilter, GroupFilter, ProjectFilter, TaskFilter, ActivityLogFilter, TaskViewFilter, TaskCardConfigFilter

User = get_user_model()


def _view_filters_include_parent_scope(view_filters):
    """Whether a saved view explicitly filters on parent/subtask scope."""
    if not view_filters:
        return False

    for filter_rule in view_filters:
        if not isinstance(filter_rule, dict):
            continue

        field = str(filter_rule.get('field', ''))
        if field.startswith('parent'):
            return True

    return False


def _should_limit_to_root_tasks(query_params, view_filters=None):
    """Default task collections to root tasks unless subtask scope is explicit."""
    if 'parent' in query_params or 'is_root_task' in query_params:
        return False

    if _view_filters_include_parent_scope(view_filters):
        return False

    return True


# =========================
# 健康检查
# =========================

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """系统健康检查"""
    from django.db import connection
    
    health_status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'services': {}
    }
    
    # 检查数据库连接
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['services']['database'] = 'healthy'
    except Exception as e:
        health_status['services']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # 检查文件系统
    try:
        from django.conf import settings
        import os
        
        # 检查媒体目录是否可写
        media_root = settings.MEDIA_ROOT
        os.makedirs(media_root, exist_ok=True)
        test_file = os.path.join(media_root, '.health_check')
        
        with open(test_file, 'w') as f:
            f.write('health_check')
        os.remove(test_file)
        
        health_status['services']['filesystem'] = 'healthy'
    except Exception as e:
        health_status['services']['filesystem'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    status_code = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response({
        'success': health_status['status'] == 'healthy',
        'data': health_status,
        'message': '健康检查完成',
        'timestamp': health_status['timestamp']
    }, status=status_code)


# =========================
# 用户认证视图
# =========================

class UserRegistrationView(generics.CreateAPIView):
    """用户注册"""
    
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # 为新用户创建默认视图
        TaskView.create_default_views_for_user(user)
        
        # 生成JWT Token
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'success': True,
            'data': {
                'user': UserSerializer(user).data,
                'tokens': {
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
            },
            'message': '注册成功'
        }, status=status.HTTP_201_CREATED)


class CustomTokenObtainPairView(TokenObtainPairView):
    """自定义登录视图"""
    
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            return Response({
                'success': False,
                'error': {
                    'code': 'AUTH_002',
                    'message': '用户名或密码错误',
                    'details': {}
                }
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        return Response({
            'success': True,
            'data': serializer.validated_data,
            'message': '登录成功'
        }, status=status.HTTP_200_OK)


class CustomTokenRefreshView(TokenRefreshView):
    """自定义Token刷新视图"""
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        
        if response.status_code == 200:
            return Response({
                'success': True,
                'data': response.data,
                'message': 'Token刷新成功'
            })
        
        return Response({
            'success': False,
            'error': {
                'code': 'AUTH_001',
                'message': 'Token无效或已过期',
                'details': response.data
            }
        }, status=response.status_code)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """用户登出"""
    refresh_token = request.data.get('refresh')
    if refresh_token:
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            # 登出应幂等；refresh 无效或黑名单未启用时直接忽略
            pass

    return Response({
        'success': True,
        'data': {},
        'message': '登出成功'
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def initialize_user_view(request):
    """初始化用户 - 将系统视图复制到用户导航栏"""
    user = request.user
    
    try:
        # 检查用户是否已初始化（是否有任何导航栏视图）
        existing_views = TaskView.objects.filter(
            user=user,
            is_visible_in_nav=True
        ).exists()
        
        if existing_views:
            return Response({
                'success': True,
                'data': {'initialized': True, 'message': '用户已初始化'},
                'message': '用户已完成初始化'
            })
        
        # 获取所有系统视图
        system_views = TaskView.objects.filter(
            is_system=True,
            is_visible_in_nav=True
        ).order_by('sort_order')
        
        if not system_views.exists():
            # 如果没有系统视图，创建默认视图
            created_views = TaskView.create_default_views_for_user(user)
            # 将创建的默认视图标记为系统视图
            TaskView.objects.filter(
                uid__in=[view.uid for view in created_views]
            ).update(is_system=True)
        else:
            # 复制系统视图到用户
            created_views = []
            for system_view in system_views:
                user_view = TaskView.objects.create(
                    user=user,
                    name=system_view.name,
                    project=None,  # 系统视图都是全局视图
                    view_type=system_view.view_type,
                    is_default=system_view.is_default,
                    is_public=False,
                    is_system=False,  # 用户的视图不再是系统视图
                    is_visible_in_nav=True,
                    sort_order=system_view.sort_order,
                    filters=system_view.filters,
                    sorts=system_view.sorts,
                    group_by=system_view.group_by,
                    view_settings=system_view.view_settings,
                    card_config=system_view.card_config,
                )
                created_views.append(user_view)
        
        return Response({
            'success': True,
            'data': {
                'initialized': True,
                'views_count': len(created_views),
                'message': f'成功初始化 {len(created_views)} 个视图'
            },
            'message': '用户初始化成功'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'error': {
                'code': 'INIT_001',
                'message': '初始化失败',
                'details': str(e)
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_user_initialized(request):
    """检查用户是否已初始化"""
    user = request.user
    
    # 检查用户是否有导航栏视图
    has_nav_views = TaskView.objects.filter(
        user=user,
        is_visible_in_nav=True
    ).exists()
    
    return Response({
        'success': True,
        'data': {
            'initialized': has_nav_views
        },
        'message': '获取初始化状态成功'
    })



class UserProfileView(generics.RetrieveUpdateAPIView):
    """用户资料视图"""
    
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取用户信息成功'
        })

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': '更新用户信息成功'
        })


class ChangePasswordView(generics.UpdateAPIView):
    """修改密码视图"""
    
    serializer_class = ChangePasswordSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return Response({
            'success': True,
            'data': {},
            'message': '密码修改成功'
        }, status=status.HTTP_200_OK)


# =========================
# 标签视图
# =========================

class TagViewSet(viewsets.ModelViewSet):
    """标签视图集"""
    
    lookup_field = 'uid'
    
    serializer_class = TagSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TagFilter
    search_fields = ['name']
    ordering_fields = ['name', 'sort_order', 'created_at', 'updated_at']
    ordering = ['sort_order', '-updated_at']

    def get_queryset(self):
        """获取当前用户的标签"""
        return Tag.objects.filter(user=self.request.user).prefetch_related('tasks')

    def create(self, request, *args, **kwargs):
        """创建标签"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '标签创建成功'
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """获取标签详情"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取标签详情成功'
        })

    def update(self, request, *args, **kwargs):
        """更新标签"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': '标签更新成功'
        })

    def destroy(self, request, *args, **kwargs):
        """删除标签"""
        instance = self.get_object()
        
        # 检查标签是否被任务使用
        if instance.tasks.exists():
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_004',
                    'message': '标签正在被任务使用，无法删除',
                    'details': {
                        'tasks_count': instance.tasks.count()
                    }
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(instance)
        
        return Response({
            'success': True,
            'data': {},
            'message': '标签删除成功'
        }, status=status.HTTP_204_NO_CONTENT)


# =========================
# 分组视图
# =========================

class GroupViewSet(viewsets.ModelViewSet):
    """分组视图集"""
    
    lookup_field = 'uid'
    
    serializer_class = GroupSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = GroupFilter
    search_fields = ['name', 'desc']
    ordering_fields = ['name', 'sort_order', 'created_at', 'updated_at']
    ordering = ['sort_order', '-updated_at']

    def get_queryset(self):
        """获取当前用户的分组"""
        return Group.objects.filter(user=self.request.user).prefetch_related('projects')

    def create(self, request, *args, **kwargs):
        """创建分组"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '分组创建成功'
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """获取分组详情"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取分组详情成功'
        })

    def update(self, request, *args, **kwargs):
        """更新分组"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': '分组更新成功'
        })

    def destroy(self, request, *args, **kwargs):
        """删除分组"""
        instance = self.get_object()
        
        # 检查是否为默认分组
        if instance.name == "默认任务组":
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_002',
                    'message': '默认分组不能删除',
                    'details': {}
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查分组下是否有项目
        if instance.projects.exists():
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_004',
                    'message': '分组下还有项目，无法删除',
                    'details': {}
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(instance)
        
        return Response({
            'success': True,
            'data': {},
            'message': '分组删除成功'
        }, status=status.HTTP_204_NO_CONTENT)


# =========================
# 项目视图
# =========================

class ProjectViewSet(viewsets.ModelViewSet):
    """项目视图集"""
    
    lookup_field = 'uid'
    
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = ProjectFilter
    search_fields = ['name', 'desc']
    ordering_fields = ['name', 'sort_order', 'created_at', 'updated_at']
    ordering = ['sort_order', '-updated_at']

    def get_queryset(self):
        """获取当前用户的项目"""
        return Project.objects.filter(user=self.request.user).select_related('group')

    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def create(self, request, *args, **kwargs):
        """创建项目"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '项目创建成功'
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """获取项目详情"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取项目详情成功'
        })

    def update(self, request, *args, **kwargs):
        """更新项目"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': '项目更新成功'
        })

    def destroy(self, request, *args, **kwargs):
        """删除项目"""
        instance = self.get_object()
        
        # 检查是否为默认项目
        if instance.name == "默认项目":
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_002',
                    'message': '默认项目不能删除',
                    'details': {}
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 检查项目下是否有任务
        if instance.tasks.exists():
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_004',
                    'message': '项目下还有任务，无法删除',
                    'details': {}
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(instance)
        
        return Response({
            'success': True,
            'data': {},
            'message': '项目删除成功'
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """获取项目统计信息"""
        project = self.get_object()
        
        tasks = project.tasks.all()
        stats = {
            'total_tasks': tasks.count(),
            'pending_tasks': tasks.filter(status=Task.TaskStatus.TODO).count(),
            'completed_tasks': tasks.filter(status=Task.TaskStatus.COMPLETED).count(),
            'abandoned_tasks': tasks.filter(status=Task.TaskStatus.ABANDONED).count(),
            'overdue_tasks': tasks.filter(
                status__in=[Task.TaskStatus.TODO, Task.TaskStatus.UNASSIGNED],
                due_date__lt=timezone.now()
            ).count(),
        }
        
        return Response({
            'success': True,
            'data': stats,
            'message': '获取项目统计成功'
        })


# =========================
# 任务视图
# =========================

class TaskViewSet(viewsets.ModelViewSet):
    """任务视图集"""
    
    lookup_field = 'uid'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'content']
    ordering_fields = ['title', 'priority', 'status', 'sort_order', 'created_at', 'updated_at', 'due_date']
    ordering = ['sort_order', '-updated_at']

    def get_queryset(self):
        """获取当前用户的任务"""
        return Task.objects.filter(user=self.request.user).select_related(
            'project', 'project__group', 'parent'
        ).prefetch_related('tags', 'subtasks')

    def filter_queryset(self, queryset):
        """默认只返回根任务，除非显式查询子任务。"""
        queryset = super().filter_queryset(queryset)

        if _should_limit_to_root_tasks(self.request.query_params):
            queryset = queryset.filter(parent__isnull=True)

        return queryset

    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return TaskListSerializer
        return TaskSerializer

    def create(self, request, *args, **kwargs):
        """创建任务"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        # 记录活动日志
        self._log_activity(task, ActivityLog.ActionType.CREATED, "任务已创建")
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '任务创建成功'
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """获取任务详情"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取任务详情成功'
        })

    def update(self, request, *args, **kwargs):
        """更新任务（支持 X-Edit-Scope: instance | series | following）"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        scope = (request.headers.get('X-Edit-Scope') or 'instance').lower()
        if scope not in ('instance', 'series', 'following'):
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_002',
                    'message': "X-Edit-Scope 必须是 instance | series | following",
                    'details': {},
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 判断是否为"纯状态改动"（避免完成时意外脱离系列）
        data_keys = set(request.data.keys())
        non_status_keys = data_keys - {'status', 'completed_time'}
        is_status_only = not non_status_keys
        is_recurring_instance = bool(instance.recurrence_parent_id)

        from .services.recurrence import (
            detach_instance as _detach_instance,
            update_series as _update_series,
            split_series_from as _split_series_from,
            handle_instance_completed,
        )

        # series / following scope 必须作用于重复任务（模板或实例）
        if scope in ('series', 'following') and not (
            instance.is_recurrence_template or is_recurring_instance
        ):
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_010',
                    'message': "非重复任务不支持 series / following scope",
                    'details': {},
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 非纯状态改动才触发 scope 特殊流程
        if not is_status_only and (instance.is_recurrence_template or is_recurring_instance):
            if scope == 'series':
                target = instance.recurrence_parent if is_recurring_instance else instance
                serializer = self.get_serializer(target, data=request.data, partial=partial)
                serializer.is_valid(raise_exception=True)
                validated = dict(serializer.validated_data)
                tag_uids = validated.pop('tag_uids', None)
                reminders_input = validated.pop('reminders_input', None)
                validated.pop('recurrence_input', None)
                validated.pop('parent_uid', None)
                _update_series(target, validated, tag_uids=tag_uids)
                if reminders_input is not None:
                    serializer._sync_reminders(target, reminders_input, request.user)
                target.refresh_from_db()
                out = TaskSerializer(target, context={'request': request}).data
                self._log_activity(target, ActivityLog.ActionType.UPDATED, "系列任务已更新 (series)")
                return Response({'success': True, 'data': out, 'message': '任务更新成功'})

            if scope == 'following':
                if not is_recurring_instance:
                    return Response({
                        'success': False,
                        'error': {
                            'code': 'BUSINESS_011',
                            'message': "following scope 需要作用于重复实例",
                            'details': {},
                        }
                    }, status=status.HTTP_400_BAD_REQUEST)
                serializer = self.get_serializer(instance, data=request.data, partial=partial)
                serializer.is_valid(raise_exception=True)
                validated = dict(serializer.validated_data)
                tag_uids = validated.pop('tag_uids', None)
                reminders_input = validated.pop('reminders_input', None)
                validated.pop('recurrence_input', None)
                validated.pop('parent_uid', None)
                new_tpl = _split_series_from(instance, validated, tag_uids=tag_uids)
                if reminders_input is not None:
                    serializer._sync_reminders(new_tpl, reminders_input, request.user)
                instance.refresh_from_db()
                out = TaskSerializer(instance, context={'request': request}).data
                self._log_activity(instance, ActivityLog.ActionType.UPDATED, "系列已拆分 (following)")
                return Response({'success': True, 'data': out, 'message': '任务更新成功'})

            if scope == 'instance' and is_recurring_instance:
                instance = _detach_instance(instance)

        # 常规 update（也适用于 status-only 的完成路径）
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()

        # 重复实例：完成时自动生成下一实例
        if (task.status == Task.TaskStatus.COMPLETED and
                old_status != Task.TaskStatus.COMPLETED and
                task.recurrence_parent_id):
            handle_instance_completed(task)

        if 'status' in request.data and task.status != old_status:
            self._log_activity(
                task,
                ActivityLog.ActionType.STATUS_CHANGED,
                f"任务状态从 '{Task.TaskStatus(old_status).label}' 变更为 '{task.get_status_display()}'"
            )
        else:
            self._log_activity(task, ActivityLog.ActionType.UPDATED, "任务信息已更新")

        return Response({
            'success': True,
            'data': serializer.data,
            'message': '任务更新成功'
        })

    def destroy(self, request, *args, **kwargs):
        """删除任务（支持 ?scope=instance|series|following）"""
        instance = self.get_object()
        scope = (request.query_params.get('scope') or 'instance').lower()
        if scope not in ('instance', 'series', 'following'):
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_002',
                    'message': "scope 必须是 instance | series | following",
                    'details': {},
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        # 检查是否有子任务
        if instance.subtasks.exists():
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_004',
                    'message': '任务下还有子任务，无法删除',
                    'details': {
                        'subtasks_count': instance.subtasks.count()
                    }
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        is_recurring_instance = bool(instance.recurrence_parent_id)
        is_recurring_template = instance.is_recurrence_template

        # series：删除模板 + 所有未完成实例（已完成保留作历史）
        if scope == 'series' and (is_recurring_instance or is_recurring_template):
            template = instance.recurrence_parent if is_recurring_instance else instance
            open_statuses = [Task.TaskStatus.TODO, Task.TaskStatus.UNASSIGNED]
            with transaction.atomic():
                Task.objects.filter(
                    recurrence_parent=template, status__in=open_statuses,
                ).delete()
                self._log_activity(template, ActivityLog.ActionType.DELETED, "系列已删除 (series)")
                template.delete()
            return Response({
                'success': True,
                'data': {},
                'message': '任务删除成功'
            }, status=status.HTTP_204_NO_CONTENT)

        # following：从当前实例开始往后删除
        if scope == 'following' and is_recurring_instance:
            template = instance.recurrence_parent
            pivot = instance.due_date or instance.start_date
            open_statuses = [Task.TaskStatus.TODO, Task.TaskStatus.UNASSIGNED]
            with transaction.atomic():
                qs = Task.objects.filter(
                    recurrence_parent=template, status__in=open_statuses,
                )
                if pivot is not None:
                    qs = qs.filter(due_date__gte=pivot)
                qs.delete()
                # 在模板 RRULE 上追加 UNTIL=pivot-1us，让系列截止
                if pivot is not None and template.recurrence_rule:
                    from .services.recurrence import _apply_rule_until
                    from datetime import timedelta
                    template.recurrence_rule = _apply_rule_until(
                        template.recurrence_rule, pivot - timedelta(microseconds=1),
                    )
                    template.save(update_fields=['recurrence_rule', 'updated_at'])
                self._log_activity(template, ActivityLog.ActionType.DELETED, "本次及后续已删除 (following)")
            return Response({
                'success': True,
                'data': {},
                'message': '任务删除成功'
            }, status=status.HTTP_204_NO_CONTENT)

        # instance（默认）：仅删当前
        self._log_activity(instance, ActivityLog.ActionType.DELETED, "任务已删除")
        self.perform_destroy(instance)

        return Response({
            'success': True,
            'data': {},
            'message': '任务删除成功'
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def skip(self, request, uid=None):
        """跳过重复任务实例的本次：标记 ABANDONED、加入 exdates、生成下一实例"""
        instance = self.get_object()
        if not instance.recurrence_parent_id:
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_012',
                    'message': "非重复任务实例不支持 skip",
                    'details': {},
                }
            }, status=status.HTTP_400_BAD_REQUEST)

        from .services.recurrence import skip_instance
        nxt = skip_instance(instance)
        instance.refresh_from_db()

        self._log_activity(instance, ActivityLog.ActionType.UPDATED, "已跳过本次重复")

        return Response({
            'success': True,
            'data': {
                'skipped': TaskSerializer(instance, context={'request': request}).data,
                'next': TaskSerializer(nxt, context={'request': request}).data if nxt else None,
            },
            'message': '已跳过本次',
        })

    @action(detail=False, methods=['get'])
    def today(self, request):
        """今日任务"""
        tasks = self.get_queryset().today()
        tasks = self.filter_queryset(tasks)
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取今日任务成功'
        })

    @action(detail=False, methods=['get'])
    def tomorrow(self, request):
        """明日任务"""
        tasks = self.get_queryset().tomorrow()
        tasks = self.filter_queryset(tasks)
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取明日任务成功'
        })

    @action(detail=False, methods=['get'])
    def this_week(self, request):
        """本周任务"""
        tasks = self.get_queryset().this_week()
        tasks = self.filter_queryset(tasks)
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取本周任务成功'
        })

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """逾期任务"""
        tasks = self.get_queryset().overdue()
        tasks = self.filter_queryset(tasks)
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取逾期任务成功'
        })

    @action(detail=False, methods=['get'])
    def completed(self, request):
        """已完成任务"""
        tasks = self.get_queryset().completed()
        tasks = self.filter_queryset(tasks)
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(tasks, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取已完成任务成功'
        })

    @action(detail=False, methods=['patch'])
    def bulk_update(self, request):
        """批量更新任务"""
        serializer = BulkUpdateTaskSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        tasks = serializer.validated_data['task_uids']
        update_data = serializer.validated_data['data']
        
        with transaction.atomic():
            updated_count = 0
            for task in tasks:
                # 记录旧状态
                old_status = task.status
                
                # 更新任务
                for field, value in update_data.items():
                    if field == 'project_uid':
                        try:
                            project = Project.objects.get(uid=value, user=request.user)
                            task.project = project
                        except Project.DoesNotExist:
                            continue
                    elif field == 'tag_uids':
                        tags = Tag.objects.filter(uid__in=value, user=request.user)
                        task.tags.set(tags)
                        continue
                    else:
                        setattr(task, field, value)
                
                task.save()
                updated_count += 1
                
                # 记录活动日志
                if 'status' in update_data and task.status != old_status:
                    self._log_activity(
                        task,
                        ActivityLog.ActionType.STATUS_CHANGED,
                        f"批量更新：任务状态从 '{Task.TaskStatus(old_status).label}' 变更为 '{task.get_status_display()}'"
                    )
                else:
                    self._log_activity(task, ActivityLog.ActionType.UPDATED, "批量更新任务信息")
        
        return Response({
            'success': True,
            'data': {
                'updated_count': updated_count
            },
            'message': f'成功更新 {updated_count} 个任务'
        })

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """任务排序"""
        task_uid = request.data.get('task_uid')
        new_position = request.data.get('new_position')
        project_uid = request.data.get('project_uid')
        
        if not all([task_uid, new_position is not None]):
            return Response({
                'success': False,
                'error': {
                    'code': 'VALIDATION_001',
                    'message': '缺少必要参数',
                    'details': {}
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            task = Task.objects.get(uid=task_uid, user=request.user)
            
            # 获取同项目的任务列表
            queryset = Task.objects.filter(user=request.user)
            if project_uid:
                queryset = queryset.filter(project__uid=project_uid)
            else:
                queryset = queryset.filter(project=task.project)
            
            tasks = list(queryset.order_by('sort_order'))
            
            # 移除当前任务
            tasks.remove(task)
            
            # 插入到新位置
            tasks.insert(new_position, task)
            
            # 重新设置排序值
            with transaction.atomic():
                for i, t in enumerate(tasks):
                    t.sort_order = i
                    t.save(update_fields=['sort_order'])
            
            return Response({
                'success': True,
                'data': {},
                'message': '任务排序成功'
            })
            
        except Task.DoesNotExist:
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_001',
                    'message': '任务不存在',
                    'details': {}
                }
            }, status=status.HTTP_404_NOT_FOUND)

    def _log_activity(self, task, action, detail=""):
        """记录活动日志"""
        ActivityLog.objects.create(
            user=self.request.user,
            task=task,
            project=task.project,
            action=action,
            detail=detail
        )


# =========================
# 活动日志视图
# =========================

class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    """活动日志视图集"""
    
    serializer_class = ActivityLogSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ActivityLogFilter
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        """获取当前用户的活动日志"""
        return ActivityLog.objects.filter(user=self.request.user).select_related(
            'task', 'project'
        )

    def list(self, request, *args, **kwargs):
        """获取活动日志列表"""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取活动日志成功'
        })


# =========================
# 任务视图管理
# =========================

class TaskViewViewSet(viewsets.ModelViewSet):
    """任务视图管理视图集"""
    
    lookup_field = 'uid'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskViewFilter
    search_fields = ['name']
    ordering_fields = ['name', 'sort_order', 'created_at', 'updated_at']
    ordering = ['sort_order', 'name']

    def get_queryset(self):
        """获取当前用户的视图"""
        return TaskView.objects.filter(user=self.request.user).select_related('project')

    def get_serializer_class(self):
        """根据动作选择序列化器"""
        if self.action == 'list':
            return TaskViewListSerializer
        return TaskViewSerializer

    def create(self, request, *args, **kwargs):
        """创建视图"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '视图创建成功'
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        """获取视图详情"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取视图详情成功'
        })

    def update(self, request, *args, **kwargs):
        """更新视图"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        return Response({
            'success': True,
            'data': serializer.data,
            'message': '视图更新成功'
        })

    def destroy(self, request, *args, **kwargs):
        """删除视图"""
        instance = self.get_object()
        
        # 检查是否为默认视图
        if instance.is_default:
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_002',
                    'message': '默认视图不能删除',
                    'details': {}
                }
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(instance)
        
        return Response({
            'success': True,
            'data': {},
            'message': '视图删除成功'
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['get'])
    def tasks(self, request, uid=None):
        """获取视图下的任务"""
        view = self.get_object()
        
        # 获取基础查询集
        queryset = Task.objects.filter(user=request.user).select_related(
            'project', 'project__group', 'parent'
        ).prefetch_related('tags', 'subtasks')
        
        # 如果视图绑定了项目，则筛选项目
        if view.project:
            queryset = queryset.filter(project=view.project)
        
        # 应用筛选条件
        queryset = view.apply_filters(queryset)

        # 应用请求中的额外筛选参数（项目、状态、优先级等）
        queryset = TaskFilter(data=request.query_params, queryset=queryset).qs

        # 视图页默认只展示根任务，显式查询子任务时放开限制
        if _should_limit_to_root_tasks(request.query_params, view.filters):
            queryset = queryset.filter(parent__isnull=True)
        
        # 应用排序规则
        queryset = view.apply_sorts(queryset)
        
        # 分页
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = TaskListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = TaskListSerializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取视图任务成功'
        })

    @action(detail=True, methods=['post'])
    def set_default(self, request, uid=None):
        """设置为默认视图"""
        view = self.get_object()
        
        with transaction.atomic():
            # 取消其他默认视图
            TaskView.objects.filter(
                user=request.user,
                project=view.project,
                is_default=True
            ).update(is_default=False)
            
            # 设置当前视图为默认
            view.is_default = True
            view.save(update_fields=['is_default'])
        
        return Response({
            'success': True,
            'data': {},
            'message': '设置默认视图成功'
        })

    @action(detail=True, methods=['post'])
    def duplicate(self, request, uid=None):
        """复制视图"""
        view = self.get_object()
        
        # 创建副本
        new_view = TaskView.objects.create(
            user=request.user,
            name=f"{view.name} 副本",
            project=view.project,
            view_type=view.view_type,
            is_default=False,
            is_public=False,
            filters=view.filters.copy(),
            sorts=view.sorts.copy(),
            group_by=view.group_by,
            view_settings=view.view_settings.copy(),
            card_config=view.card_config,
        )
        
        serializer = self.get_serializer(new_view)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '视图复制成功'
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def default_views(self, request):
        """获取默认视图"""
        project_uid = request.query_params.get('project')
        
        queryset = self.get_queryset().filter(is_default=True)
        
        if project_uid:
            queryset = queryset.filter(project__uid=project_uid)
        else:
            queryset = queryset.filter(project__isnull=True)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取默认视图成功'
        })


# =========================
# 卡片配置视图
# =========================

class TaskCardConfigViewSet(viewsets.ModelViewSet):
    """卡片配置视图集"""

    lookup_field = 'uid'
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskCardConfigFilter
    search_fields = ['name', 'desc']
    ordering_fields = ['name', 'sort_order', 'created_at', 'updated_at']
    ordering = ['is_preset', 'sort_order', '-updated_at']

    def get_queryset(self):
        """返回用户自己的 + 系统预设"""
        from django.db.models import Q
        return TaskCardConfig.objects.filter(
            Q(user=self.request.user) | Q(is_preset=True)
        ).order_by('is_preset', 'sort_order')

    def get_serializer_class(self):
        if self.action == 'list':
            return TaskCardConfigListSerializer
        return TaskCardConfigSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '卡片配置创建成功',
        }, status=status.HTTP_201_CREATED)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取卡片配置成功',
        })

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()

        if instance.is_preset:
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_005',
                    'message': '系统预设不可编辑，请先复制',
                    'details': {},
                },
            }, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '卡片配置更新成功',
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()

        if instance.is_preset:
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_005',
                    'message': '系统预设不可删除',
                    'details': {},
                },
            }, status=status.HTTP_400_BAD_REQUEST)

        # 检查是否有视图在使用
        if instance.views.exists():
            return Response({
                'success': False,
                'error': {
                    'code': 'BUSINESS_006',
                    'message': '该卡片配置正在被视图使用，无法删除',
                    'details': {'views_count': instance.views.count()},
                },
            }, status=status.HTTP_400_BAD_REQUEST)

        self.perform_destroy(instance)
        return Response({
            'success': True,
            'data': {},
            'message': '卡片配置删除成功',
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, uid=None):
        """复制配置（通常用于从预设创建自定义版本）"""
        source = self.get_object()
        source_style = source.style if isinstance(source.style, dict) else {}
        source_fields = source.field_configs if isinstance(source.field_configs, list) else []
        normalized_fields = [fc for fc in source_fields if isinstance(fc, dict)]
        if not normalized_fields:
            normalized_fields = TaskCardConfig.get_default_field_configs()
        base_name = f"{source.name} 副本"
        new_name = base_name
        suffix = 2
        while TaskCardConfig.objects.filter(user=request.user, name=new_name).exists():
            new_name = f"{base_name} {suffix}"
            suffix += 1

        new_config = TaskCardConfig.objects.create(
            user=request.user,
            name=new_name,
            desc=source.desc,
            is_preset=False,
            layout=source.layout,
            style=deepcopy(source_style),
            field_configs=deepcopy(normalized_fields),
        )
        serializer = self.get_serializer(new_config)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '卡片配置复制成功',
        }, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def available_fields(self, request):
        """返回可用字段注册表，前端配置编辑器由此驱动"""
        return Response({
            'success': True,
            'data': TaskCardConfig.AVAILABLE_FIELDS,
            'message': '获取可用字段成功',
        })


# =========================
# 提醒视图（M2）
# =========================

class ReminderViewSet(viewsets.ModelViewSet):
    """提醒 CRUD + 触发管理

    独立端点主要用于客户端调度：
    - GET  /reminders/upcoming/?within_minutes=60
    - POST /reminders/{uid}/mark-triggered/
    常规 reminders 的创建 / 读取推荐嵌套在 Task.reminders_input 字段一起完成。
    """

    lookup_field = 'uid'
    serializer_class = ReminderSerializer
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['trigger_at', 'created_at']
    ordering = ['trigger_at', '-created_at']

    def get_queryset(self):
        return Reminder.objects.filter(user=self.request.user).select_related('task')

    def create(self, request, *args, **kwargs):
        task_uid = request.data.get('task_uid') or request.data.get('task')
        if not task_uid:
            return Response({
                'success': False,
                'error': {'code': 'VALIDATION_001', 'message': "缺少 task_uid", 'details': {}},
            }, status=status.HTTP_400_BAD_REQUEST)
        try:
            task = Task.objects.get(uid=task_uid, user=request.user)
        except Task.DoesNotExist:
            return Response({
                'success': False,
                'error': {'code': 'BUSINESS_001', 'message': "任务不存在", 'details': {}},
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reminder = Reminder.objects.create(
            user=request.user,
            task=task,
            type=serializer.validated_data.get('type', Reminder.ReminderType.RELATIVE),
            trigger_at=serializer.validated_data.get('trigger_at'),
            offset_minutes=serializer.validated_data.get('offset_minutes'),
            relative_to=serializer.validated_data.get('relative_to', Reminder.RelativeTo.DUE_DATE),
            client_notification_id=serializer.validated_data.get('client_notification_id', ''),
        )
        return Response({
            'success': True,
            'data': self.get_serializer(reminder).data,
            'message': '提醒创建成功',
        }, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '提醒更新成功',
        })

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response({
            'success': True, 'data': {}, 'message': '提醒已删除',
        }, status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """未来 within_minutes 分钟内将要触发的 pending 提醒（供客户端调度 / 追赶）"""
        try:
            within = int(request.query_params.get('within_minutes', 60))
        except (TypeError, ValueError):
            within = 60
        within = max(1, min(within, 60 * 24 * 7))  # 上限 7 天
        from datetime import timedelta as _td
        now = timezone.now()
        horizon = now + _td(minutes=within)

        # PENDING + task 未完成 + effective_trigger_at 落在 [now, horizon]
        pending = self.get_queryset().filter(
            status=Reminder.ReminderStatus.PENDING,
        ).exclude(task__status=Task.TaskStatus.COMPLETED)

        # 绝对提醒直接用 trigger_at；相对提醒需动态计算 — 在内存过滤以保持简单
        results = []
        for r in pending:
            eff = r.effective_trigger_at
            if eff is None:
                continue
            if now - _td(minutes=5) <= eff <= horizon:
                results.append(r)
        results.sort(key=lambda x: x.effective_trigger_at or now)

        serializer = self.get_serializer(results, many=True)
        return Response({
            'success': True,
            'data': serializer.data,
            'message': '获取即将到来的提醒成功',
        })

    @action(detail=True, methods=['post'], url_path='mark-triggered')
    def mark_triggered(self, request, uid=None):
        """客户端上报：此提醒已在本地触发（幂等）"""
        reminder = self.get_object()
        if reminder.status == Reminder.ReminderStatus.PENDING:
            reminder.mark_triggered()
        return Response({
            'success': True,
            'data': self.get_serializer(reminder).data,
            'message': '已标记触发',
        })
