"""
AutoSeedMiddleware — 首次请求时自动初始化 demo 数据

self-hosted 场景：部署后第一次收到请求时检测数据库是否为空，
如果没有任何用户，自动运行 seed_demo 逻辑创建演示账户。
之后设置标记位，不再重复检测。
"""
from django.contrib.auth import get_user_model
from django.core.management import call_command

User = get_user_model()

_checked = False


class AutoSeedMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        global _checked
        if not _checked:
            _checked = True
            if not User.objects.exists():
                call_command('seed_demo')

        return self.get_response(request)
