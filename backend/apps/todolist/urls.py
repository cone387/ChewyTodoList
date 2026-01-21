from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # 认证视图
    UserRegistrationView,
    CustomTokenObtainPairView,
    CustomTokenRefreshView,
    logout_view,
    UserProfileView,
    ChangePasswordView,
    # 业务视图
    TagViewSet,
    GroupViewSet,
    ProjectViewSet,
    TaskViewSet,
    ActivityLogViewSet,
)

# 创建路由器
router = DefaultRouter()
router.register(r'tags', TagViewSet, basename='tag')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'projects', ProjectViewSet, basename='project')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'activity-logs', ActivityLogViewSet, basename='activity-log')

urlpatterns = [
    # 认证相关URL
    path('auth/register/', UserRegistrationView.as_view(), name='user_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),
    path('auth/logout/', logout_view, name='user_logout'),
    path('auth/me/', UserProfileView.as_view(), name='user_profile'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='change_password'),
    
    # 业务相关URL
    path('', include(router.urls)),
]