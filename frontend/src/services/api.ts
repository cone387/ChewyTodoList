import axios from 'axios';
import type { 
  AuthResponse, 
  ApiResponse, 
  PaginatedResponse, 
  Task, 
  Tag, 
  Group, 
  Project,
  ActivityLog 
} from '../types/index';

// 创建axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 用于防止重复刷新token的标志
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

// 响应拦截器 - 处理token过期
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 如果正在刷新token，将请求加入队列
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post('http://localhost:8000/api/auth/refresh/', {
            refresh: refreshToken,
          });
          const newToken = response.data.access;
          localStorage.setItem('access_token', newToken);
          
          processQueue(null, newToken);
          
          // 重试原请求
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          
          // 刷新失败，清除token并跳转到登录页
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          
          // 只在不是登录页面时才跳转
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // 没有refresh token，清除所有token并跳转到登录页
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// 认证API
export const authApi = {
  // 用户注册
  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
    first_name?: string;
    last_name?: string;
  }) => api.post<AuthResponse>('/auth/register/', data),

  // 用户登录
  login: (data: { username: string; password: string }) =>
    api.post<AuthResponse>('/auth/login/', data),

  // 刷新token
  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh }),

  // 登出
  logout: () => api.post('/auth/logout/'),

  // 获取用户信息
  getProfile: () => api.get('/auth/me/'),

  // 修改密码
  changePassword: (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => api.post('/auth/change-password/', data),
};

// 任务API
export const taskApi = {
  // 获取任务列表
  getTasks: (params?: {
    status?: number;
    project?: string;
    search?: string;
    page?: number;
  }) => api.get<ApiResponse<PaginatedResponse<Task>>>('/tasks/', { params }),

  // 获取任务详情
  getTask: (uid: string) => api.get<ApiResponse<Task>>(`/tasks/${uid}/`),

  // 创建任务
  createTask: (data: {
    project_uid: string;
    title: string;
    content?: string;
    priority?: number;
    tag_uids?: string[];
    parent_uid?: string;
    due_date?: string;
    start_date?: string;
    is_all_day?: boolean;
  }) => api.post<ApiResponse<Task>>('/tasks/', data),

  // 更新任务
  updateTask: (uid: string, data: Partial<{
    title: string;
    content: string;
    status: number;
    priority: number;
    tag_uids: string[];
    due_date: string;
    start_date: string;
    is_all_day: boolean;
  }>) => api.patch<ApiResponse<Task>>(`/tasks/${uid}/`, data),

  // 删除任务
  deleteTask: (uid: string) => api.delete(`/tasks/${uid}/`),
};

// 标签API
export const tagApi = {
  // 获取标签列表
  getTags: () => api.get<ApiResponse<PaginatedResponse<Tag>>>('/tags/'),

  // 创建标签
  createTag: (data: { name: string; color?: string }) =>
    api.post<ApiResponse<Tag>>('/tags/', data),

  // 更新标签
  updateTag: (uid: string, data: { name?: string; color?: string }) =>
    api.patch<ApiResponse<Tag>>(`/tags/${uid}/`, data),

  // 删除标签
  deleteTag: (uid: string) => api.delete(`/tags/${uid}/`),
};

// 分组API
export const groupApi = {
  // 获取分组列表
  getGroups: () => api.get<ApiResponse<PaginatedResponse<Group>>>('/groups/'),

  // 创建分组
  createGroup: (data: { name: string; desc?: string }) =>
    api.post<ApiResponse<Group>>('/groups/', data),

  // 更新分组
  updateGroup: (uid: string, data: { name?: string; desc?: string }) =>
    api.patch<ApiResponse<Group>>(`/groups/${uid}/`, data),

  // 删除分组
  deleteGroup: (uid: string) => api.delete(`/groups/${uid}/`),
};

// 项目API
export const projectApi = {
  // 获取项目列表
  getProjects: (params?: { group?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Project>>>('/projects/', { params }),

  // 创建项目
  createProject: (data: {
    group_uid: string;
    name: string;
    desc?: string;
    view_type?: 'list' | 'card';
  }) => api.post<ApiResponse<Project>>('/projects/', data),

  // 更新项目
  updateProject: (uid: string, data: {
    name?: string;
    desc?: string;
    view_type?: 'list' | 'card';
  }) => api.patch<ApiResponse<Project>>(`/projects/${uid}/`, data),

  // 删除项目
  deleteProject: (uid: string) => api.delete(`/projects/${uid}/`),
};

// 活动日志API
export const activityApi = {
  // 获取活动日志
  getActivityLogs: (params?: {
    task?: string;
    project?: string;
    page?: number;
  }) => api.get<ApiResponse<PaginatedResponse<ActivityLog>>>('/activity-logs/', { params }),
};

export default api;