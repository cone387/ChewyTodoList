"""
全面的单元测试
"""
from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from datetime import timedelta

from .models import Tag, Group, Project, Task, ActivityLog

User = get_user_model()


# =========================
# 测试辅助函数
# =========================

def create_user(username="testuser", email="test@example.com", password="testpass123"):
    """创建测试用户"""
    return User.objects.create_user(username=username, email=email, password=password)


def create_tag(user, name="测试标签", color="#ff0000"):
    """创建测试标签"""
    return Tag.objects.create(user=user, name=name, color=color)


def create_group(user, name="测试分组", desc="测试描述"):
    """创建测试分组"""
    return Group.objects.create(user=user, name=name, desc=desc)


def create_project(user, group=None, name="测试项目", desc="测试项目描述"):
    """创建测试项目"""
    if group is None:
        group = create_group(user)
    return Project.objects.create(user=user, group=group, name=name, desc=desc)


def create_task(user, project=None, title="测试任务", content="测试内容", status=Task.TaskStatus.TODO):
    """创建测试任务"""
    if project is None:
        project = create_project(user)
    return Task.objects.create(
        user=user, 
        project=project, 
        title=title, 
        content=content, 
        status=status
    )


# =========================
# 模型测试
# =========================

class TagModelTestCase(TestCase):
    """标签模型测试"""

    def setUp(self):
        self.user = create_user()

    def test_tag_creation(self):
        """测试标签创建"""
        tag = create_tag(self.user, name="工作")
        
        self.assertEqual(tag.user, self.user)
        self.assertEqual(tag.name, "工作")
        self.assertIsNotNone(tag.uid)
        self.assertIsNotNone(tag.color)
        self.assertIsNotNone(tag.created_at)
        self.assertIsNotNone(tag.updated_at)

    def test_tag_unique_constraint(self):
        """测试标签唯一性约束"""
        create_tag(self.user, name="工作")
        
        with self.assertRaises(Exception):
            create_tag(self.user, name="工作")

    def test_tag_str_representation(self):
        """测试标签字符串表示"""
        tag = create_tag(self.user, name="生活")
        self.assertEqual(str(tag), "生活")

    def test_tag_color_generation(self):
        """测试标签颜色生成"""
        tag = Tag.objects.create(user=self.user, name="自动颜色")
        self.assertTrue(tag.color.startswith('#'))
        self.assertEqual(len(tag.color), 7)


class GroupModelTestCase(TestCase):
    """分组模型测试"""

    def setUp(self):
        self.user = create_user()

    def test_group_creation(self):
        """测试分组创建"""
        group = create_group(self.user, name="个人项目")
        
        self.assertEqual(group.user, self.user)
        self.assertEqual(group.name, "个人项目")
        self.assertIsNotNone(group.uid)
        self.assertIsInstance(group.settings, dict)

    def test_get_user_default(self):
        """测试获取用户默认分组"""
        group = Group.get_user_default(self.user)
        
        self.assertEqual(group.user, self.user)
        self.assertEqual(group.name, "默认任务组")
        
        # 再次调用应该返回同一个分组
        group2 = Group.get_user_default(self.user)
        self.assertEqual(group.id, group2.id)

    def test_group_unique_constraint(self):
        """测试分组唯一性约束"""
        create_group(self.user, name="工作")
        
        with self.assertRaises(Exception):
            create_group(self.user, name="工作")


class ProjectModelTestCase(TestCase):
    """项目模型测试"""

    def setUp(self):
        self.user = create_user()
        self.group = create_group(self.user)

    def test_project_creation(self):
        """测试项目创建"""
        project = create_project(self.user, self.group, name="网站重构")
        
        self.assertEqual(project.user, self.user)
        self.assertEqual(project.group, self.group)
        self.assertEqual(project.name, "网站重构")
        self.assertEqual(project.view_type, Project.ViewType.LIST)
        self.assertIsInstance(project.style, dict)
        self.assertIsInstance(project.settings, dict)

    def test_get_default_project(self):
        """测试获取默认项目"""
        project = Project.get_default_project(self.user)
        
        self.assertEqual(project.user, self.user)
        self.assertEqual(project.name, "默认项目")
        
        # 再次调用应该返回同一个项目
        project2 = Project.get_default_project(self.user)
        self.assertEqual(project.id, project2.id)

    def test_project_unique_constraint(self):
        """测试项目唯一性约束"""
        create_project(self.user, self.group, name="测试项目")
        
        with self.assertRaises(Exception):
            create_project(self.user, self.group, name="测试项目")


class TaskModelTestCase(TestCase):
    """任务模型测试"""

    def setUp(self):
        self.user = create_user()
        self.project = create_project(self.user)
        self.tag1 = create_tag(self.user, name="紧急")
        self.tag2 = create_tag(self.user, name="重要")

    def test_task_creation(self):
        """测试任务创建"""
        task = create_task(self.user, self.project, title="完成API文档")
        task.tags.add(self.tag1, self.tag2)
        
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.project, self.project)
        self.assertEqual(task.title, "完成API文档")
        self.assertEqual(task.status, Task.TaskStatus.TODO)
        self.assertEqual(task.priority, Task.TaskPriority.MEDIUM)
        self.assertTrue(task.is_all_day)
        self.assertEqual(task.tags.count(), 2)
        self.assertIsInstance(task.attachments, list)

    def test_task_completion(self):
        """测试任务完成"""
        task = create_task(self.user, self.project)
        
        # 设置为完成状态
        task.set_status(Task.TaskStatus.COMPLETED)
        
        self.assertTrue(task.is_completed)
        self.assertIsNotNone(task.completed_time)
        self.assertEqual(task.status, Task.TaskStatus.COMPLETED)

    def test_task_overdue_property(self):
        """测试任务逾期属性"""
        # 创建逾期任务
        overdue_task = create_task(self.user, self.project)
        overdue_task.due_date = timezone.now() - timedelta(days=1)
        overdue_task.save()
        self.assertTrue(overdue_task.is_overdue)
        
        # 创建未逾期任务
        future_task = create_task(self.user, self.project)
        future_task.due_date = timezone.now() + timedelta(days=1)
        future_task.save()
        self.assertFalse(future_task.is_overdue)
        
        # 已完成任务不算逾期
        completed_task = create_task(self.user, self.project, status=Task.TaskStatus.COMPLETED)
        completed_task.due_date = timezone.now() - timedelta(days=1)
        completed_task.completed_time = timezone.now()
        completed_task.save()
        self.assertFalse(completed_task.is_overdue)

    def test_task_completed_status_property(self):
        """测试任务完成状态属性"""
        # 未完成任务
        task = create_task(self.user, self.project)
        self.assertEqual(task.completed_status, "not")
        
        # 按时完成任务
        completed_task = create_task(self.user, self.project, status=Task.TaskStatus.COMPLETED)
        completed_task.due_date = timezone.now() + timedelta(days=1)
        completed_task.completed_time = timezone.now()
        completed_task.save()
        self.assertEqual(completed_task.completed_status, "ontime")

    def test_subtask_relationship(self):
        """测试子任务关系"""
        parent_task = create_task(self.user, self.project, title="父任务")
        child_task = create_task(self.user, self.project, title="子任务")
        child_task.parent = parent_task
        child_task.save()
        
        self.assertEqual(child_task.parent, parent_task)
        self.assertIn(child_task, parent_task.subtasks.all())

    def test_task_queryset_methods(self):
        """测试任务查询集方法"""
        # 创建不同状态的任务
        today_task = create_task(self.user, self.project)
        today_task.start_date = timezone.now()
        today_task.due_date = timezone.now() + timedelta(days=1)
        today_task.save()
        
        completed_task = create_task(self.user, self.project, status=Task.TaskStatus.COMPLETED)
        completed_task.completed_time = timezone.now()
        completed_task.save()
        
        overdue_task = create_task(self.user, self.project)
        overdue_task.due_date = timezone.now() - timedelta(days=1)
        overdue_task.save()
        
        # 测试查询方法
        self.assertIn(today_task, Task.objects.filter(user=self.user).today())
        self.assertIn(completed_task, Task.objects.filter(user=self.user).completed())
        self.assertIn(overdue_task, Task.objects.filter(user=self.user).overdue())
        self.assertNotIn(completed_task, Task.objects.filter(user=self.user).uncompleted())


class ActivityLogModelTestCase(TestCase):
    """活动日志模型测试"""

    def setUp(self):
        self.user = create_user()
        self.project = create_project(self.user)
        self.task = create_task(self.user, self.project)

    def test_activity_log_creation(self):
        """测试活动日志创建"""
        log = ActivityLog.objects.create(
            user=self.user,
            task=self.task,
            project=self.project,
            action=ActivityLog.ActionType.CREATED,
            detail="创建了新任务"
        )
        
        self.assertEqual(log.user, self.user)
        self.assertEqual(log.task, self.task)
        self.assertEqual(log.project, self.project)
        self.assertEqual(log.action, ActivityLog.ActionType.CREATED)
        self.assertEqual(log.detail, "创建了新任务")


# =========================
# API测试
# =========================

class BaseAPITestCase(APITestCase):
    """API测试基类"""

    def setUp(self):
        self.user = create_user()
        self.client = APIClient()
        self.authenticate()

    def authenticate(self):
        """认证用户"""
        refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')


class AuthenticationAPITestCase(APITestCase):
    """认证API测试"""

    def setUp(self):
        self.register_url = reverse('user_register')
        self.login_url = reverse('token_obtain_pair')
        self.refresh_url = reverse('token_refresh')
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }

    def test_user_registration_success(self):
        """测试用户注册成功"""
        response = self.client.post(self.register_url, self.user_data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('user', response.data['data'])
        self.assertIn('tokens', response.data['data'])
        
        # 验证用户已创建
        user = User.objects.get(username='testuser')
        self.assertEqual(user.email, 'test@example.com')

    def test_user_registration_password_mismatch(self):
        """测试密码不匹配"""
        data = self.user_data.copy()
        data['password_confirm'] = 'different_password'
        
        response = self.client.post(self.register_url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_user_login_success(self):
        """测试用户登录成功"""
        user = create_user(username='testuser')
        user.set_password('testpass123')
        user.save()
        
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])

    def test_user_login_invalid_credentials(self):
        """测试无效登录凭据"""
        login_data = {
            'username': 'nonexistent',
            'password': 'wrongpass'
        }
        
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])


class TagAPITestCase(BaseAPITestCase):
    """标签API测试"""

    def setUp(self):
        super().setUp()
        self.list_url = reverse('tag-list')

    def test_create_tag(self):
        """测试创建标签"""
        data = {
            'name': '工作',
            'color': '#ff0000'
        }
        
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        tag = Tag.objects.get(name='工作')
        self.assertEqual(tag.user, self.user)
        self.assertEqual(tag.color, '#ff0000')

    def test_list_tags(self):
        """测试获取标签列表"""
        for i in range(3):
            create_tag(self.user, name=f"标签{i}")
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']['results']), 3)

    def test_update_tag(self):
        """测试更新标签"""
        tag = create_tag(self.user, name='旧名称')
        url = reverse('tag-detail', kwargs={'uid': tag.uid})
        
        data = {'name': '新名称', 'color': '#00ff00'}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        tag.refresh_from_db()
        self.assertEqual(tag.name, '新名称')
        self.assertEqual(tag.color, '#00ff00')

    def test_delete_tag(self):
        """测试删除标签"""
        tag = create_tag(self.user)
        url = reverse('tag-detail', kwargs={'uid': tag.uid})
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Tag.objects.filter(id=tag.id).exists())


class TaskAPITestCase(BaseAPITestCase):
    """任务API测试"""

    def setUp(self):
        super().setUp()
        self.project = create_project(self.user)
        self.tag = create_tag(self.user)
        self.list_url = reverse('task-list')

    def test_create_task(self):
        """测试创建任务"""
        data = {
            'project_uid': self.project.uid,
            'title': '完成API文档',
            'content': '编写详细的API文档',
            'priority': Task.TaskPriority.HIGH,
            'tag_uids': [self.tag.uid]
        }
        
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        
        task = Task.objects.get(title='完成API文档')
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.project, self.project)
        self.assertEqual(task.priority, Task.TaskPriority.HIGH)
        self.assertIn(self.tag, task.tags.all())

    def test_list_tasks(self):
        """测试获取任务列表"""
        for i in range(5):
            create_task(self.user, self.project, title=f"任务{i}")
        
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['data']['results']), 5)

    def test_filter_tasks_by_status(self):
        """测试按状态过滤任务"""
        create_task(self.user, self.project, title="待办1", status=Task.TaskStatus.TODO)
        create_task(self.user, self.project, title="待办2", status=Task.TaskStatus.TODO)
        create_task(self.user, self.project, title="已完成", status=Task.TaskStatus.COMPLETED)
        
        response = self.client.get(self.list_url, {'status': Task.TaskStatus.TODO})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']['results']), 2)

    def test_update_task_status(self):
        """测试更新任务状态"""
        task = create_task(self.user, self.project)
        url = reverse('task-detail', kwargs={'uid': task.uid})
        
        data = {'status': Task.TaskStatus.COMPLETED}
        response = self.client.patch(url, data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        task.refresh_from_db()
        self.assertEqual(task.status, Task.TaskStatus.COMPLETED)
        self.assertIsNotNone(task.completed_time)

    def test_create_subtask(self):
        """测试创建子任务"""
        parent_task = create_task(self.user, self.project, title="父任务")
        
        data = {
            'project_uid': self.project.uid,
            'parent_uid': parent_task.uid,
            'title': '子任务',
            'content': '这是一个子任务'
        }
        
        response = self.client.post(self.list_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        subtask = Task.objects.get(title='子任务')
        self.assertEqual(subtask.parent, parent_task)


# =========================
# 集成测试
# =========================

class TaskWorkflowIntegrationTestCase(BaseAPITestCase):
    """任务工作流集成测试"""

    def setUp(self):
        super().setUp()
        self.group = create_group(self.user, name="工作")
        self.project = create_project(self.user, self.group, name="网站项目")
        self.tag = create_tag(self.user, name="紧急")

    def test_complete_task_workflow(self):
        """测试完整的任务工作流"""
        # 1. 创建任务
        task_data = {
            'project_uid': self.project.uid,
            'title': '设计首页',
            'content': '设计网站首页布局',
            'priority': Task.TaskPriority.HIGH,
            'tag_uids': [self.tag.uid],
            'due_date': (timezone.now() + timedelta(days=7)).isoformat()
        }
        
        response = self.client.post(reverse('task-list'), task_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        task_uid = response.data['data']['uid']
        
        # 2. 获取任务详情
        response = self.client.get(reverse('task-detail', kwargs={'uid': task_uid}))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['data']['title'], '设计首页')
        
        # 3. 更新任务
        update_data = {
            'title': '设计首页 - 已更新',
            'content': '设计网站首页布局，包含导航栏'
        }
        response = self.client.patch(reverse('task-detail', kwargs={'uid': task_uid}), update_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 4. 完成任务
        response = self.client.patch(
            reverse('task-detail', kwargs={'uid': task_uid}),
            {'status': Task.TaskStatus.COMPLETED}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # 5. 验证任务状态
        task = Task.objects.get(uid=task_uid)
        self.assertTrue(task.is_completed)
        self.assertIsNotNone(task.completed_time)


# =========================
# 安全测试
# =========================

class SecurityTestCase(APITestCase):
    """安全测试"""

    def test_unauthenticated_access(self):
        """测试未认证访问"""
        response = self.client.get(reverse('task-list'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cross_user_data_access(self):
        """测试跨用户数据访问"""
        user1 = create_user(username="user1")
        user2 = create_user(username="user2")
        
        # 用户1创建任务
        task = create_task(user1)
        
        # 用户2尝试访问用户1的任务
        refresh = RefreshToken.for_user(user2)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        
        response = self.client.get(reverse('task-detail', kwargs={'uid': task.uid}))
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)