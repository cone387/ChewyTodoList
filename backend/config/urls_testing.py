"""
URL configuration for testing (excludes chewy_attachment which requires libmagic).
"""
from django.contrib import admin
from django.urls import path, include
from apps.todolist.views import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check, name='health_check'),
    path('api/', include('apps.todolist.urls')),
]
