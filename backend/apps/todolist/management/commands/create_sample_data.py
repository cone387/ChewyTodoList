from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.todolist.models import Group, Project, Tag, Task
import random

User = get_user_model()


class Command(BaseCommand):
    help = '创建示例数据'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='demo',
            help='用户名 (默认: demo)'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='demo@example.com',
            help='邮箱 (默认: demo@example.com)'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='demo123456',
            help='密码 (默认: demo123456)'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        # 创建用户
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': '演示',
                'last_name': '用户'
            }
        )
        
        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(f'创建用户: {username}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'用户已存在: {username}')
            )

        # 创建分组
        work_group, _ = Group.objects.get_or_create(
            user=user,
            name='工作项目',
            defaults={
                'desc': '工作相关的项目',
                'settings': {'color': '#3498db', 'icon': 'briefcase'}
            }
        )

        personal_group, _ = Group.objects.get_or_create(
            user=user,
            name='个人项目',
            defaults={
                'desc': '个人学习和生活项目',
                'settings': {'color': '#e74c3c', 'icon': 'user'}
            }
        )

        # 创建项目
        projects_data = [
            {
                'name': '待办应用开发',
                'desc': '开发一个功能完整的待办事项管理应用',
                'group': work_group,
                'style': {'color': '#2ecc71', 'icon': 'code'}
            },
            {
                'name': '学习计划',
                'desc': '个人技能提升和学习计划',
                'group': personal_group,
                'style': {'color': '#f39c12', 'icon': 'book'}
            },
            {
                'name': '健身计划',
                'desc': '保持健康的运动计划',
                'group': personal_group,
                'style': {'color': '#e67e22', 'icon': 'directions_run'}
            }
        ]

        projects = []
        for project_data in projects_data:
            project, _ = Project.objects.get_or_create(
                user=user,
                name=project_data['name'],
                group=project_data['group'],
                defaults={
                    'desc': project_data['desc'],
                    'style': project_data['style']
                }
            )
            projects.append(project)

        # 创建标签
        tags_data = [
            {'name': '紧急', 'color': '#e74c3c'},
            {'name': '重要', 'color': '#f39c12'},
            {'name': '学习', 'color': '#3498db'},
            {'name': '工作', 'color': '#2ecc71'},
            {'name': '生活', 'color': '#9b59b6'},
            {'name': '健康', 'color': '#1abc9c'},
        ]

        tags = []
        for tag_data in tags_data:
            tag, _ = Tag.objects.get_or_create(
                user=user,
                name=tag_data['name'],
                defaults={'color': tag_data['color']}
            )
            tags.append(tag)

        # 创建任务
        tasks_data = [
            {
                'title': '设计数据库模型',
                'content': '设计用户、项目、任务等核心数据模型',
                'project': projects[0],
                'priority': Task.TaskPriority.HIGH,
                'status': Task.TaskStatus.COMPLETED,
                'tags': [tags[1], tags[3]],  # 重要, 工作
                'attachments': []
            },
            {
                'title': '实现用户认证',
                'content': '实现用户注册、登录、JWT认证等功能',
                'project': projects[0],
                'priority': Task.TaskPriority.HIGH,
                'status': Task.TaskStatus.TODO,
                'tags': [tags[3]],  # 工作
                'attachments': []
            },
            {
                'title': '开发任务管理API',
                'content': '实现任务的增删改查、状态管理等API',
                'project': projects[0],
                'priority': Task.TaskPriority.MEDIUM,
                'status': Task.TaskStatus.TODO,
                'tags': [tags[3]],  # 工作
                'attachments': []
            },
            {
                'title': '学习React Hooks',
                'content': '深入学习React Hooks的使用方法和最佳实践',
                'project': projects[1],
                'priority': Task.TaskPriority.MEDIUM,
                'status': Task.TaskStatus.TODO,
                'tags': [tags[2]],  # 学习
                'attachments': []
            },
            {
                'title': '阅读《Clean Code》',
                'content': '阅读并实践书中的代码整洁之道',
                'project': projects[1],
                'priority': Task.TaskPriority.LOW,
                'status': Task.TaskStatus.TODO,
                'tags': [tags[2]],  # 学习
                'attachments': []
            },
            {
                'title': '晨跑30分钟',
                'content': '每天早上跑步30分钟，保持身体健康',
                'project': projects[2],
                'priority': Task.TaskPriority.MEDIUM,
                'status': Task.TaskStatus.TODO,
                'tags': [tags[5]],  # 健康
                'attachments': []
            },
        ]

        for task_data in tasks_data:
            task, created = Task.objects.get_or_create(
                user=user,
                title=task_data['title'],
                project=task_data['project'],
                defaults={
                    'content': task_data['content'],
                    'priority': task_data['priority'],
                    'status': task_data['status'],
                    'attachments': task_data['attachments']
                }
            )
            
            if created:
                task.tags.set(task_data['tags'])

        self.stdout.write(
            self.style.SUCCESS('示例数据创建完成!')
        )
        self.stdout.write(
            self.style.SUCCESS(f'用户名: {username}')
        )
        self.stdout.write(
            self.style.SUCCESS(f'密码: {password}')
        )