from django.test import TestCase
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from .models import Tag, Group, Project, Task

User = get_user_model()


class AuthenticationTestCase(APITestCase):
    """认证测试用例"""

    def setUp(self):
        self.register_url = reverse('user_register')
        self.login_url = reverse('token_obtain_pair')
        self.user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'testpass123',
            'password_confirm': 'testpass123',
            'first_name': 'Test',
            'last_name': 'User'
        }

    def test_user_registration(self):
        """测试用户注册"""
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(response.data['success'])
        self.assertIn('user', response.data['data'])
        self.assertIn('tokens', response.data['data'])

    def test_user_login(self):
        """测试用户登录"""
        # 先创建用户
        user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        login_data = {
            'username': 'testuser',
            'password': 'testpass123'
        }
        
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('access', response.data['data'])
        self.assertIn('refresh', response.data['data'])

    def test_invalid_login(self):
        """测试无效登录"""
        login_data = {
            'username': 'nonexistent',
            'password': 'wrongpass'
        }
        
        response = self.client.post(self.login_url, login_data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertFalse(response.data['success'])


class TaskModelTestCase(TestCase):
    """任务模型测试用例"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.group = Group.objects.create(
            user=self.user,
            name='测试分组'
        )
        self.project = Project.objects.create(
            user=self.user,
            group=self.group,
            name='测试项目'
        )

    def test_task_creation(self):
        """测试任务创建"""
        task = Task.objects.create(
            user=self.user,
            project=self.project,
            title='测试任务',
            content='这是一个测试任务'
        )
        
        self.assertEqual(task.user, self.user)
        self.assertEqual(task.project, self.project)
        self.assertEqual(task.title, '测试任务')
        self.assertEqual(task.status, Task.TaskStatus.TODO)
        self.assertIsNotNone(task.uid)
        self.assertIsNotNone(task.created_at)

    def test_task_completion(self):
        """测试任务完成"""
        task = Task.objects.create(
            user=self.user,
            project=self.project,
            title='测试任务'
        )
        
        # 设置任务为已完成
        task.set_status(Task.TaskStatus.COMPLETED)
        
        self.assertTrue(task.is_completed)
        self.assertIsNotNone(task.completed_time)

    def test_task_str_representation(self):
        """测试任务字符串表示"""
        task = Task.objects.create(
            user=self.user,
            project=self.project,
            title='测试任务'
        )
        
        expected_str = f"测试任务 ({task.get_status_display()})"
        self.assertEqual(str(task), expected_str)