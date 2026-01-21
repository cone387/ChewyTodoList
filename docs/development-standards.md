# 开发规范文档

## 项目结构规范

### 整体项目结构
```
todo-app/
├── backend/                    # Django 后端
│   ├── config/                # Django 配置
│   │   ├── __init__.py
│   │   ├── settings/          # 分环境配置
│   │   │   ├── __init__.py
│   │   │   ├── base.py        # 基础配置
│   │   │   ├── development.py # 开发环境
│   │   │   ├── production.py  # 生产环境
│   │   │   └── testing.py     # 测试环境
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── apps/                  # 应用模块
│   │   ├── __init__.py
│   │   ├── authentication/    # 用户认证
│   │   ├── todos/            # 待办事项
│   │   ├── projects/         # 项目管理
│   │   ├── tags/             # 标签系统
│   │   └── common/           # 公共模块
│   ├── requirements/          # 依赖管理
│   │   ├── base.txt
│   │   ├── development.txt
│   │   └── production.txt
│   ├── static/               # 静态文件
│   ├── media/                # 媒体文件
│   ├── locale/               # 国际化
│   ├── tests/                # 测试文件
│   ├── scripts/              # 脚本文件
│   ├── manage.py
│   └── pyproject.toml        # uv 配置
├── frontend/                  # React 前端
│   ├── public/
│   ├── src/
│   │   ├── components/       # 组件
│   │   │   ├── common/       # 通用组件
│   │   │   ├── layout/       # 布局组件
│   │   │   └── features/     # 功能组件
│   │   ├── pages/            # 页面
│   │   ├── hooks/            # 自定义 Hooks
│   │   ├── services/         # API 服务
│   │   ├── store/            # 状态管理
│   │   ├── utils/            # 工具函数
│   │   ├── types/            # TypeScript 类型
│   │   ├── styles/           # 样式文件
│   │   ├── assets/           # 静态资源
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── tailwind.config.js
├── docs/                     # 文档
├── docker/                   # Docker 配置
├── scripts/                  # 项目脚本
├── .env.example             # 环境变量示例
├── docker-compose.yml       # Docker Compose
├── README.md
└── .gitignore
```

## Python/Django 开发规范

### 1. 代码风格

#### 1.1 基础规范
- 严格遵循 PEP 8 代码风格
- 使用 Black 进行代码格式化
- 使用 isort 进行导入排序
- 使用 flake8 进行代码检查

#### 1.2 命名规范
```python
# 类名：大驼峰命名
class TaskManager:
    pass

# 函数名和变量名：小写下划线
def get_user_tasks():
    user_id = 1
    return tasks

# 常量：大写下划线
MAX_TASK_COUNT = 100
DEFAULT_PAGE_SIZE = 20

# 私有方法：单下划线开头
def _internal_method(self):
    pass
```

#### 1.3 文档字符串
```python
def create_task(title: str, user_id: int, **kwargs) -> Task:
    """
    创建新的待办任务
    
    Args:
        title: 任务标题
        user_id: 用户ID
        **kwargs: 其他可选参数
        
    Returns:
        Task: 创建的任务对象
        
    Raises:
        ValidationError: 当输入参数无效时
    """
    pass
```

### 2. Django 应用结构

#### 2.1 应用内部结构
```
apps/todos/
├── __init__.py
├── admin.py              # 管理后台
├── apps.py               # 应用配置
├── models.py             # 数据模型
├── views.py              # 视图（简单应用）
├── viewsets.py           # DRF ViewSets
├── serializers.py        # DRF 序列化器
├── urls.py               # URL 配置
├── permissions.py        # 权限控制
├── filters.py            # 过滤器
├── managers.py           # 模型管理器
├── signals.py            # 信号处理
├── tasks.py              # 异步任务
├── utils.py              # 工具函数
├── exceptions.py         # 自定义异常
├── constants.py          # 常量定义
├── validators.py         # 验证器
├── migrations/           # 数据库迁移
└── tests/                # 测试文件
    ├── __init__.py
    ├── test_models.py
    ├── test_views.py
    ├── test_serializers.py
    └── factories.py      # 测试工厂
```

#### 2.2 模型设计规范
```python
class Task(BaseModel):
    """任务模型"""
    
    class TaskStatus(models.IntegerChoices):
        """任务状态枚举"""
        PENDING = 0, "待办"
        COMPLETED = 1, "已完成"
    
    # 字段定义
    title = models.CharField(
        max_length=255,
        verbose_name="标题",
        help_text="任务标题，最多255个字符"
    )
    
    class Meta:
        db_table = "todos_task"
        verbose_name = "任务"
        verbose_name_plural = "任务"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "status"]),
        ]
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        """重写保存方法"""
        # 自定义保存逻辑
        super().save(*args, **kwargs)
```

#### 2.3 序列化器规范
```python
class TaskSerializer(serializers.ModelSerializer):
    """任务序列化器"""
    
    # 自定义字段
    tags = TagSerializer(many=True, read_only=True)
    is_overdue = serializers.SerializerMethodField()
    
    class Meta:
        model = Task
        fields = [
            'id', 'title', 'content', 'status', 
            'priority', 'due_date', 'tags', 'is_overdue'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_is_overdue(self, obj):
        """计算是否逾期"""
        return obj.is_overdue
    
    def validate_title(self, value):
        """验证标题"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError("标题至少需要2个字符")
        return value.strip()
    
    def create(self, validated_data):
        """创建任务"""
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)
```

#### 2.4 视图集规范
```python
class TaskViewSet(viewsets.ModelViewSet):
    """任务视图集"""
    
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'due_date', 'priority']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """获取查询集"""
        return Task.objects.filter(
            user=self.request.user
        ).select_related('project').prefetch_related('tags')
    
    @action(detail=False, methods=['get'])
    def today(self, request):
        """今日任务"""
        tasks = self.get_queryset().today()
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    def perform_create(self, serializer):
        """执行创建"""
        serializer.save(user=self.request.user)
```

### 3. 环境管理

#### 3.1 uv 配置
```toml
# pyproject.toml
[project]
name = "todo-app"
version = "0.1.0"
description = "Self-hosted Todo Application"
requires-python = ">=3.13"
dependencies = [
    "django>=5.0,<6.0",
    "djangorestframework>=3.14",
    "django-cors-headers>=4.0",
    "django-filter>=23.0",
    "psycopg2-binary>=2.9",
    "python-decouple>=3.8",
    "celery>=5.3",
    "redis>=5.0",
]

[project.optional-dependencies]
dev = [
    "black>=23.0",
    "isort>=5.12",
    "flake8>=6.0",
    "pytest>=7.4",
    "pytest-django>=4.5",
    "factory-boy>=3.3",
    "coverage>=7.3",
    "pre-commit>=3.4",
]

[tool.black]
line-length = 88
target-version = ['py313']
include = '\.pyi?$'
extend-exclude = '''
/(
  migrations
)/
'''

[tool.isort]
profile = "black"
multi_line_output = 3
line_length = 88
skip = ["migrations"]

[tool.coverage.run]
source = "."
omit = [
    "*/migrations/*",
    "*/venv/*",
    "*/tests/*",
    "manage.py",
    "*/settings/*",
]
```

#### 3.2 环境变量管理
```python
# config/settings/base.py
from decouple import config, Csv

# 基础配置
SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost', cast=Csv())

# 数据库配置
DATABASES = {
    'default': {
        'ENGINE': config('DB_ENGINE', default='django.db.backends.sqlite3'),
        'NAME': config('DB_NAME', default='db.sqlite3'),
        'USER': config('DB_USER', default=''),
        'PASSWORD': config('DB_PASSWORD', default=''),
        'HOST': config('DB_HOST', default=''),
        'PORT': config('DB_PORT', default=''),
    }
}
```

### 4. 测试规范

#### 4.1 测试结构
```python
# tests/test_models.py
import pytest
from django.test import TestCase
from django.contrib.auth import get_user_model
from apps.todos.models import Task
from apps.todos.tests.factories import TaskFactory, UserFactory

User = get_user_model()

class TaskModelTest(TestCase):
    """任务模型测试"""
    
    def setUp(self):
        """测试准备"""
        self.user = UserFactory()
        self.task = TaskFactory(user=self.user)
    
    def test_task_creation(self):
        """测试任务创建"""
        self.assertEqual(self.task.user, self.user)
        self.assertIsNotNone(self.task.created_at)
    
    def test_task_str_representation(self):
        """测试字符串表示"""
        self.assertEqual(str(self.task), self.task.title)
    
    @pytest.mark.django_db
    def test_task_completion(self):
        """测试任务完成"""
        self.task.mark_completed()
        self.assertTrue(self.task.is_completed)
        self.assertIsNotNone(self.task.completed_at)
```

#### 4.2 工厂模式
```python
# tests/factories.py
import factory
from django.contrib.auth import get_user_model
from apps.todos.models import Task

User = get_user_model()

class UserFactory(factory.django.DjangoModelFactory):
    """用户工厂"""
    
    class Meta:
        model = User
    
    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.LazyAttribute(lambda obj: f"{obj.username}@example.com")
    first_name = factory.Faker("first_name")
    last_name = factory.Faker("last_name")

class TaskFactory(factory.django.DjangoModelFactory):
    """任务工厂"""
    
    class Meta:
        model = Task
    
    title = factory.Faker("sentence", nb_words=4)
    content = factory.Faker("text")
    user = factory.SubFactory(UserFactory)
    status = Task.TaskStatus.PENDING
    priority = Task.TaskPriority.MEDIUM
```

## React/TypeScript 开发规范

### 1. 代码风格

#### 1.1 TypeScript 配置
```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@/components/*": ["src/components/*"],
      "@/pages/*": ["src/pages/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/services/*": ["src/services/*"],
      "@/types/*": ["src/types/*"],
      "@/utils/*": ["src/utils/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

#### 1.2 ESLint 配置
```json
// .eslintrc.json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": "latest",
    "sourceType": "module",
    "ecmaFeatures": {
      "jsx": true
    }
  },
  "plugins": ["@typescript-eslint", "react", "react-hooks", "jsx-a11y"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
```

### 2. 组件规范

#### 2.1 函数组件结构
```typescript
// components/TaskItem.tsx
import React from 'react';
import { Task, TaskStatus } from '@/types/task';
import { formatDate } from '@/utils/date';
import './TaskItem.css';

interface TaskItemProps {
  task: Task;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
  className?: string;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onStatusChange,
  onEdit,
  onDelete,
  className = '',
}) => {
  const handleStatusToggle = (): void => {
    const newStatus = task.status === TaskStatus.COMPLETED 
      ? TaskStatus.PENDING 
      : TaskStatus.COMPLETED;
    onStatusChange(task.id, newStatus);
  };

  const handleEdit = (): void => {
    onEdit?.(task);
  };

  const handleDelete = (): void => {
    if (window.confirm('确定要删除这个任务吗？')) {
      onDelete?.(task.id);
    }
  };

  return (
    <div className={`task-item ${className}`}>
      <div className="task-content">
        <input
          type="checkbox"
          checked={task.status === TaskStatus.COMPLETED}
          onChange={handleStatusToggle}
          aria-label={`标记任务 "${task.title}" 为${task.status === TaskStatus.COMPLETED ? '未完成' : '已完成'}`}
        />
        <div className="task-details">
          <h3 className="task-title">{task.title}</h3>
          {task.content && (
            <p className="task-description">{task.content}</p>
          )}
          {task.dueDate && (
            <span className="task-due-date">
              截止时间: {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
      <div className="task-actions">
        {onEdit && (
          <button
            type="button"
            onClick={handleEdit}
            className="btn btn-secondary"
            aria-label={`编辑任务 "${task.title}"`}
          >
            编辑
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="btn btn-danger"
            aria-label={`删除任务 "${task.title}"`}
          >
            删除
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskItem;
```

#### 2.2 自定义 Hook 规范
```typescript
// hooks/useTasks.ts
import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus, CreateTaskData } from '@/types/task';
import { taskService } from '@/services/taskService';
import { useAuth } from '@/hooks/useAuth';

interface UseTasksReturn {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  createTask: (data: CreateTaskData) => Promise<void>;
  updateTask: (id: string, data: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskStatus: (id: string, status: TaskStatus) => Promise<void>;
  refetch: () => Promise<void>;
}

export const useTasks = (): UseTasksReturn => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchTasks = useCallback(async (): Promise<void> => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const fetchedTasks = await taskService.getTasks();
      setTasks(fetchedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取任务失败');
    } finally {
      setLoading(false);
    }
  }, [user]);

  const createTask = useCallback(async (data: CreateTaskData): Promise<void> => {
    try {
      const newTask = await taskService.createTask(data);
      setTasks(prev => [newTask, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建任务失败');
      throw err;
    }
  }, []);

  const updateTask = useCallback(async (id: string, data: Partial<Task>): Promise<void> => {
    try {
      const updatedTask = await taskService.updateTask(id, data);
      setTasks(prev => prev.map(task => 
        task.id === id ? updatedTask : task
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新任务失败');
      throw err;
    }
  }, []);

  const deleteTask = useCallback(async (id: string): Promise<void> => {
    try {
      await taskService.deleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除任务失败');
      throw err;
    }
  }, []);

  const toggleTaskStatus = useCallback(async (id: string, status: TaskStatus): Promise<void> => {
    await updateTask(id, { status });
  }, [updateTask]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    refetch: fetchTasks,
  };
};
```

### 3. 类型定义规范

```typescript
// types/task.ts
export enum TaskStatus {
  PENDING = 0,
  COMPLETED = 1,
  ABANDONED = 2,
}

export enum TaskPriority {
  LOW = 0,
  MEDIUM = 1,
  HIGH = 2,
  URGENT = 3,
}

export interface Task {
  id: string;
  title: string;
  content?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  projectId: string;
  tags: Tag[];
}

export interface CreateTaskData {
  title: string;
  content?: string;
  priority?: TaskPriority;
  dueDate?: string;
  projectId: string;
  tagIds?: string[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  status?: TaskStatus;
}

// API 响应类型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  results: T[];
  count: number;
  next?: string;
  previous?: string;
}
```

## Git 工作流规范

### 1. 分支策略

#### 1.1 分支命名规范
```
main                    # 主分支，生产环境代码
develop                 # 开发分支，集成最新功能
feature/task-management # 功能分支
bugfix/login-error      # 修复分支
hotfix/security-patch   # 热修复分支
release/v1.0.0         # 发布分支
```

#### 1.2 提交信息规范
```
feat: 添加任务创建功能
fix: 修复登录验证错误
docs: 更新 API 文档
style: 代码格式化
refactor: 重构任务查询逻辑
test: 添加任务模型测试
chore: 更新依赖包版本
```

### 2. 代码审查规范

#### 2.1 Pull Request 模板
```markdown
## 变更描述
简要描述本次变更的内容和目的

## 变更类型
- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 性能优化
- [ ] 其他

## 测试
- [ ] 单元测试通过
- [ ] 集成测试通过
- [ ] 手动测试完成

## 检查清单
- [ ] 代码符合项目规范
- [ ] 添加了必要的测试
- [ ] 更新了相关文档
- [ ] 没有引入新的安全风险
```

## 部署规范

### 1. Docker 配置

#### 1.1 后端 Dockerfile
```dockerfile
# backend/Dockerfile
FROM python:3.13-slim

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 安装 uv
RUN pip install uv

# 复制依赖文件
COPY pyproject.toml uv.lock ./

# 安装 Python 依赖
RUN uv sync --frozen

# 复制应用代码
COPY . .

# 收集静态文件
RUN uv run python manage.py collectstatic --noinput

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uv", "run", "gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

#### 1.2 前端 Dockerfile
```dockerfile
# frontend/Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产环境
FROM nginx:alpine

# 复制构建结果
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### 2. Docker Compose 配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: todoapp
      POSTGRES_USER: todouser
      POSTGRES_PASSWORD: todopass
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    environment:
      - DEBUG=False
      - DB_ENGINE=django.db.backends.postgresql
      - DB_NAME=todoapp
      - DB_USER=todouser
      - DB_PASSWORD=todopass
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    ports:
      - "8000:8000"
    volumes:
      - ./backend:/app
      - media_volume:/app/media

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

  celery:
    build: ./backend
    command: uv run celery -A config worker -l info
    environment:
      - DEBUG=False
      - DB_ENGINE=django.db.backends.postgresql
      - DB_NAME=todoapp
      - DB_USER=todouser
      - DB_PASSWORD=todopass
      - DB_HOST=db
      - DB_PORT=5432
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - db
      - redis
    volumes:
      - ./backend:/app

volumes:
  postgres_data:
  media_volume:
```

## 质量保证

### 1. 代码质量工具

#### 1.1 Pre-commit 配置
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.7.0
    hooks:
      - id: black
        language_version: python3.13

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.44.0
    hooks:
      - id: eslint
        files: \.(js|jsx|ts|tsx)$
        types: [file]
```

### 2. CI/CD 配置

#### 2.1 GitHub Actions
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.13'
    
    - name: Install uv
      run: pip install uv
    
    - name: Install dependencies
      run: |
        cd backend
        uv sync
    
    - name: Run tests
      run: |
        cd backend
        uv run pytest --cov=. --cov-report=xml
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3

  frontend-test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run tests
      run: |
        cd frontend
        npm run test:coverage
    
    - name: Build
      run: |
        cd frontend
        npm run build
```

这个开发规范文档涵盖了项目的各个方面，包括代码风格、项目结构、测试规范、部署配置等，确保项目能够按照最佳实践进行开发和维护。