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

from .models import Tag, Group, Project, Task, ActivityLog, TaskView
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
)
from .filters import TagFilter, GroupFilter, ProjectFilter, TaskFilter, ActivityLogFilter, TaskViewFilter

User = get_user_model()


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
    try:
        refresh_token = request.data.get('refresh')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        
        return Response({
            'success': True,
            'data': {},
            'message': '登出成功'
        }, status=status.HTTP_200_OK)
    
    except Exception:
        return Response({
            'success': False,
            'error': {
                'code': 'AUTH_001',
                'message': 'Token无效',
                'details': {}
            }
        }, status=status.HTTP_400_BAD_REQUEST)


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
        """更新任务"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_status = instance.status
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        task = serializer.save()
        
        # 记录活动日志
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
        """删除任务"""
        instance = self.get_object()
        
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
        
        # 记录活动日志
        self._log_activity(instance, ActivityLog.ActionType.DELETED, "任务已删除")
        
        self.perform_destroy(instance)
        
        return Response({
            'success': True,
            'data': {},
            'message': '任务删除成功'
        }, status=status.HTTP_204_NO_CONTENT)

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
            display_settings=view.display_settings.copy()
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