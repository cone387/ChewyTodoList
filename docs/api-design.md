# API 设计文档

## API 概述

### 基础信息
- **API 版本**: v1
- **基础 URL**: `http://localhost:8000/api/v1/`
- **认证方式**: JWT Token
- **数据格式**: JSON
- **字符编码**: UTF-8

### 通用响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    // 具体数据
  },
  "message": "操作成功",
  "timestamp": "2024-01-20T10:30:00Z"
}
```

#### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "输入数据验证失败",
    "details": {
      "title": ["此字段不能为空"]
    }
  },
  "timestamp": "2024-01-20T10:30:00Z"
}
```

#### 分页响应
```json
{
  "success": true,
  "data": {
    "results": [
      // 数据列表
    ],
    "pagination": {
      "count": 100,
      "page": 1,
      "page_size": 20,
      "total_pages": 5,
      "has_next": true,
      "has_previous": false
    }
  }
}
```

## 认证 API

### 用户注册
```http
POST /api/v1/auth/register/
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "securepassword123",
  "password_confirm": "securepassword123",
  "first_name": "Test",
  "last_name": "User"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "first_name": "Test",
      "last_name": "User",
      "date_joined": "2024-01-20T10:30:00Z"
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  },
  "message": "注册成功"
}
```

### 用户登录
```http
POST /api/v1/auth/login/
Content-Type: application/json

{
  "username": "testuser",
  "password": "securepassword123"
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "testuser",
      "email": "test@example.com",
      "first_name": "Test",
      "last_name": "User"
    },
    "tokens": {
      "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
      "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
    }
  },
  "message": "登录成功"
}
```

### 刷新 Token
```http
POST /api/v1/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 用户登出
```http
POST /api/v1/auth/logout/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 用户 API

### 获取当前用户信息
```http
GET /api/v1/users/me/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 更新用户信息
```http
PATCH /api/v1/users/me/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "first_name": "Updated",
  "last_name": "Name",
  "email": "updated@example.com"
}
```

### 修改密码
```http
POST /api/v1/users/change-password/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "old_password": "oldpassword123",
  "new_password": "newpassword123",
  "new_password_confirm": "newpassword123"
}
```

## 项目分组 API

### 获取分组列表
```http
GET /api/v1/groups/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "uid": "abc123def456",
        "name": "工作项目",
        "desc": "工作相关的项目分组",
        "sort_order": 1.0,
        "settings": {},
        "created_at": "2024-01-20T10:30:00Z",
        "updated_at": "2024-01-20T10:30:00Z",
        "projects_count": 5
      }
    ]
  }
}
```

### 创建分组
```http
POST /api/v1/groups/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "个人项目",
  "desc": "个人学习和兴趣项目",
  "settings": {
    "color": "#3498db",
    "icon": "folder"
  }
}
```

### 更新分组
```http
PATCH /api/v1/groups/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "更新后的分组名称",
  "desc": "更新后的描述"
}
```

### 删除分组
```http
DELETE /api/v1/groups/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 项目 API

### 获取项目列表
```http
GET /api/v1/projects/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**查询参数**:
- `group`: 按分组过滤
- `search`: 搜索项目名称
- `ordering`: 排序字段 (`name`, `-created_at`, `sort_order`)
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "uid": "proj123abc456",
        "name": "待办应用开发",
        "desc": "开发一个功能完整的待办事项管理应用",
        "group": {
          "uid": "group123",
          "name": "工作项目"
        },
        "view_type": "list",
        "style": {
          "color": "#e74c3c",
          "icon": "tasks"
        },
        "settings": {},
        "sort_order": 1.0,
        "created_at": "2024-01-20T10:30:00Z",
        "updated_at": "2024-01-20T10:30:00Z",
        "tasks_count": 15,
        "completed_tasks_count": 8
      }
    ],
    "pagination": {
      "count": 10,
      "page": 1,
      "page_size": 20,
      "total_pages": 1,
      "has_next": false,
      "has_previous": false
    }
  }
}
```

### 创建项目
```http
POST /api/v1/projects/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "新项目",
  "desc": "项目描述",
  "group_uid": "group123",
  "view_type": "list",
  "style": {
    "color": "#2ecc71",
    "icon": "project"
  }
}
```

### 获取项目详情
```http
GET /api/v1/projects/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 更新项目
```http
PATCH /api/v1/projects/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "更新后的项目名称",
  "view_type": "card"
}
```

### 删除项目
```http
DELETE /api/v1/projects/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 任务 API

### 获取任务列表
```http
GET /api/v1/tasks/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**查询参数**:
- `project`: 按项目过滤
- `status`: 按状态过滤 (0=待分配, 1=待办, 2=已完成, 3=已放弃)
- `priority`: 按优先级过滤 (0=低, 1=中, 2=高, 3=紧急)
- `tags`: 按标签过滤 (多个标签用逗号分隔)
- `search`: 搜索任务标题和内容
- `due_date_from`: 截止时间起始日期
- `due_date_to`: 截止时间结束日期
- `ordering`: 排序字段
- `page`: 页码
- `page_size`: 每页数量

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "uid": "task123abc456",
        "title": "完成用户认证功能",
        "content": "实现用户注册、登录、JWT认证等功能",
        "status": 1,
        "status_display": "待办",
        "priority": 2,
        "priority_display": "高",
        "project": {
          "uid": "proj123",
          "name": "待办应用开发"
        },
        "parent": null,
        "tags": [
          {
            "uid": "tag123",
            "name": "后端",
            "color": "#3498db"
          }
        ],
        "is_all_day": true,
        "start_date": "2024-01-20T00:00:00Z",
        "due_date": "2024-01-25T23:59:59Z",
        "completed_time": null,
        "time_zone": "Asia/Shanghai",
        "sort_order": 1.0,
        "custom_group": null,
        "created_at": "2024-01-20T10:30:00Z",
        "updated_at": "2024-01-20T10:30:00Z",
        "is_completed": false,
        "is_overdue": false,
        "subtasks_count": 3,
        "completed_subtasks_count": 1
      }
    ],
    "pagination": {
      "count": 50,
      "page": 1,
      "page_size": 20,
      "total_pages": 3,
      "has_next": true,
      "has_previous": false
    }
  }
}
```

### 创建任务
```http
POST /api/v1/tasks/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "title": "新任务",
  "content": "任务详细描述",
  "project_uid": "proj123",
  "priority": 1,
  "is_all_day": false,
  "start_date": "2024-01-20T09:00:00Z",
  "due_date": "2024-01-20T17:00:00Z",
  "tag_uids": ["tag123", "tag456"],
  "parent_uid": null
}
```

### 获取任务详情
```http
GET /api/v1/tasks/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 更新任务
```http
PATCH /api/v1/tasks/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "title": "更新后的任务标题",
  "status": 2,
  "priority": 3
}
```

### 删除任务
```http
DELETE /api/v1/tasks/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 批量更新任务
```http
PATCH /api/v1/tasks/bulk-update/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "task_uids": ["task1", "task2", "task3"],
  "data": {
    "status": 2,
    "priority": 1
  }
}
```

### 任务快捷视图

#### 今日任务
```http
GET /api/v1/tasks/today/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### 明日任务
```http
GET /api/v1/tasks/tomorrow/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### 本周任务
```http
GET /api/v1/tasks/this-week/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### 逾期任务
```http
GET /api/v1/tasks/overdue/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

#### 已完成任务
```http
GET /api/v1/tasks/completed/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 任务排序
```http
POST /api/v1/tasks/reorder/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "task_uid": "task123",
  "new_position": 2,
  "project_uid": "proj123"
}
```

## 标签 API

### 获取标签列表
```http
GET /api/v1/tags/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "uid": "tag123abc456",
        "name": "前端",
        "color": "#e74c3c",
        "sort_order": 1.0,
        "created_at": "2024-01-20T10:30:00Z",
        "updated_at": "2024-01-20T10:30:00Z",
        "tasks_count": 12
      }
    ]
  }
}
```

### 创建标签
```http
POST /api/v1/tags/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "新标签",
  "color": "#9b59b6"
}
```

### 更新标签
```http
PATCH /api/v1/tags/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "name": "更新后的标签名",
  "color": "#f39c12"
}
```

### 删除标签
```http
DELETE /api/v1/tags/{uid}/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 活动日志 API

### 获取活动日志
```http
GET /api/v1/activity-logs/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**查询参数**:
- `task`: 按任务过滤
- `project`: 按项目过滤
- `action`: 按操作类型过滤
- `date_from`: 起始日期
- `date_to`: 结束日期

**响应**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 1,
        "task": {
          "uid": "task123",
          "title": "完成用户认证功能"
        },
        "project": {
          "uid": "proj123",
          "name": "待办应用开发"
        },
        "action": "status_changed",
        "action_display": "状态变更",
        "detail": "任务状态从 '待办' 变更为 '已完成'",
        "created_at": "2024-01-20T15:30:00Z"
      }
    ]
  }
}
```

## 统计 API

### 获取仪表板统计
```http
GET /api/v1/dashboard/stats/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**响应**:
```json
{
  "success": true,
  "data": {
    "tasks": {
      "total": 100,
      "pending": 25,
      "completed": 70,
      "abandoned": 5,
      "overdue": 8
    },
    "projects": {
      "total": 5,
      "active": 4
    },
    "today": {
      "tasks": 12,
      "completed": 8
    },
    "this_week": {
      "tasks": 45,
      "completed": 32
    },
    "productivity": {
      "completion_rate": 0.75,
      "average_completion_time": 2.5
    }
  }
}
```

### 获取项目统计
```http
GET /api/v1/projects/{uid}/stats/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

### 获取任务完成趋势
```http
GET /api/v1/stats/completion-trend/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

**查询参数**:
- `period`: 时间周期 (`week`, `month`, `quarter`, `year`)
- `project`: 按项目过滤

## 数据导入导出 API

### 导出数据
```http
POST /api/v1/export/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: application/json

{
  "format": "json",
  "include": ["tasks", "projects", "tags"],
  "filters": {
    "date_from": "2024-01-01",
    "date_to": "2024-12-31"
  }
}
```

### 导入数据
```http
POST /api/v1/import/
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
Content-Type: multipart/form-data

file: [导入文件]
format: json
merge_strategy: update
```

## 错误代码说明

### 认证错误 (4xx)
- `AUTH_001`: Token 无效或已过期
- `AUTH_002`: 用户名或密码错误
- `AUTH_003`: 账户已被禁用
- `AUTH_004`: 权限不足

### 验证错误 (4xx)
- `VALIDATION_001`: 必填字段缺失
- `VALIDATION_002`: 字段格式错误
- `VALIDATION_003`: 字段长度超限
- `VALIDATION_004`: 唯一性约束冲突

### 业务错误 (4xx)
- `BUSINESS_001`: 资源不存在
- `BUSINESS_002`: 操作不被允许
- `BUSINESS_003`: 状态冲突
- `BUSINESS_004`: 依赖关系错误

### 系统错误 (5xx)
- `SYSTEM_001`: 数据库连接错误
- `SYSTEM_002`: 外部服务不可用
- `SYSTEM_003`: 内部服务器错误

## API 版本控制

### URL 版本控制
```
/api/v1/tasks/          # 版本 1
/api/v2/tasks/          # 版本 2 (未来)
```

### 请求头版本控制
```http
GET /api/tasks/
Accept: application/vnd.todoapp.v1+json
```

### 向后兼容策略
- 新增字段：向后兼容
- 修改字段类型：新版本
- 删除字段：新版本
- 修改行为：新版本

## 限流和配额

### 请求限制
- 认证用户：1000 请求/小时
- 未认证用户：100 请求/小时
- 批量操作：50 请求/小时

### 响应头
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
```

## WebSocket API (可选)

### 实时更新连接
```javascript
const ws = new WebSocket('ws://localhost:8000/ws/tasks/');

ws.onmessage = function(event) {
  const data = JSON.parse(event.data);
  // 处理实时更新
};
```

### 消息格式
```json
{
  "type": "task.updated",
  "data": {
    "task_uid": "task123",
    "changes": {
      "status": 2
    }
  },
  "timestamp": "2024-01-20T15:30:00Z"
}
```