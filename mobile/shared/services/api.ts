/**
 * 共享 API 层 — 基于 frontend/src/services/api.ts 适配移动端
 * 主要变更：
 *   - localStorage → expo-secure-store
 *   - window.location.replace → Expo Router router.replace
 *   - baseURL 从 config.json 读取
 */
import axios from 'axios';
import { router } from 'expo-router';
import { storage } from './storage';
import config from '../../config.json';
import type {
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  Task,
  Tag,
  Group,
  Project,
  ActivityLog,
  TaskView,
  TaskCardConfig,
  AvailableField,
  ViewFilter,
  ViewSort,
  Reminder,
  ReminderInput,
  RecurrenceInput,
  EditScope,
} from '../types/index';

const BASE_URL = config.apiUrl;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// 请求拦截器 — 添加 Bearer token
api.interceptors.request.use(async (config) => {
  const token = await storage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 防止重复刷新 token
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v?: any) => void; reject: (r?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    error ? reject(error) : resolve(token);
  });
  failedQueue = [];
};

// 响应拦截器 — 处理 401 自动刷新
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await storage.getItem('refresh_token');

      if (refreshToken) {
        try {
          const response = await axios.post(`${BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const newToken = response.data.data?.access || response.data.access;
          if (!newToken) throw new Error('No access token in refresh response');

          await storage.setItem('access_token', newToken);
          if (response.data.data?.refresh) {
            await storage.setItem('refresh_token', response.data.data.refresh);
          }

          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          await storage.removeItem('access_token');
          await storage.removeItem('refresh_token');
          router.replace('/(auth)/login');
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        await storage.removeItem('access_token');
        await storage.removeItem('refresh_token');
        router.replace('/(auth)/login');
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// ========================
// 认证 API
// ========================
export const authApi = {
  login: (data: { username: string; password: string }) =>
    api.post<AuthResponse>('/auth/login/', data),

  register: (data: {
    username: string;
    email: string;
    password: string;
    password_confirm: string;
  }) => api.post<AuthResponse>('/auth/register/', data),

  refresh: (refresh: string) =>
    api.post<{ access: string }>('/auth/refresh/', { refresh }),

  logout: (refresh?: string) => api.post('/auth/logout/', refresh ? { refresh } : {}),

  getProfile: () => api.get('/auth/me/'),

  changePassword: (data: {
    old_password: string;
    new_password: string;
    new_password_confirm: string;
  }) => api.post('/auth/change-password/', data),

  checkInitialized: () => api.get('/auth/check-initialized/'),
  initializeUser: () => api.post('/auth/initialize/'),
};

// ========================
// 任务 API
// ========================
export const taskApi = {
  getTasks: (params?: Record<string, any>) =>
    api.get<ApiResponse<PaginatedResponse<Task>>>('/tasks/', { params }),

  getTask: (uid: string) =>
    api.get<ApiResponse<Task>>(`/tasks/${uid}/`),

  createTask: (data: Partial<Task> & {
    project_uid?: string; tag_uids?: string[]; parent_uid?: string;
    recurrence_input?: RecurrenceInput; reminders_input?: ReminderInput[];
  }) =>
    api.post<ApiResponse<Task>>('/tasks/', data),

  updateTask: (uid: string, data: Partial<Task> & {
    project_uid?: string; tag_uids?: string[]; parent_uid?: string | null;
    reminders_input?: ReminderInput[];
  }, scope?: EditScope) =>
    api.patch<ApiResponse<Task>>(`/tasks/${uid}/`, data, {
      headers: scope ? { 'X-Edit-Scope': scope } : undefined,
    }),

  deleteTask: (uid: string, scope?: EditScope) =>
    api.delete(`/tasks/${uid}/${scope ? `?scope=${scope}` : ''}`),

  skipTask: (uid: string) =>
    api.post<ApiResponse<{ skipped: Task; next: Task | null }>>(`/tasks/${uid}/skip/`),

  bulkUpdate: (data: { task_uids: string[]; data: Record<string, any> }) =>
    api.patch('/tasks/bulk-update/', data),
};

// ========================
// 标签 API
// ========================
export const tagApi = {
  getTags: () =>
    api.get<ApiResponse<PaginatedResponse<Tag>>>('/tags/'),

  createTag: (data: { name: string; color?: string }) =>
    api.post<ApiResponse<Tag>>('/tags/', data),

  updateTag: (uid: string, data: { name?: string; color?: string }) =>
    api.patch<ApiResponse<Tag>>(`/tags/${uid}/`, data),

  deleteTag: (uid: string) =>
    api.delete(`/tags/${uid}/`),
};

// ========================
// 分组 API
// ========================
export const groupApi = {
  getGroups: () =>
    api.get<ApiResponse<PaginatedResponse<Group>>>('/groups/'),

  createGroup: (data: { name: string; desc?: string }) =>
    api.post<ApiResponse<Group>>('/groups/', data),

  updateGroup: (uid: string, data: { name?: string; desc?: string }) =>
    api.patch<ApiResponse<Group>>(`/groups/${uid}/`, data),

  deleteGroup: (uid: string) =>
    api.delete(`/groups/${uid}/`),
};

// ========================
// 项目 API
// ========================
export const projectApi = {
  getProjects: (params?: { group?: string; search?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Project>>>('/projects/', { params }),

  getProject: (uid: string) =>
    api.get<ApiResponse<Project>>(`/projects/${uid}/`),

  getProjectStats: (uid: string) =>
    api.get<ApiResponse<Record<string, number>>>(`/projects/${uid}/stats/`),

  createProject: (data: { group_uid: string; name: string; desc?: string; style?: Record<string, any> }) =>
    api.post<ApiResponse<Project>>('/projects/', data),

  updateProject: (uid: string, data: Partial<{ name: string; desc: string; style: Record<string, any>; group_uid: string }>) =>
    api.patch<ApiResponse<Project>>(`/projects/${uid}/`, data),

  deleteProject: (uid: string) =>
    api.delete(`/projects/${uid}/`),
};

// ========================
// 视图 API
// ========================
export const viewApi = {
  getViews: (params?: { project?: string; view_type?: string; is_visible_in_nav?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<TaskView>>>('/views/', { params }),

  getView: (uid: string) =>
    api.get<ApiResponse<TaskView>>(`/views/${uid}/`),

  createView: (data: Partial<TaskView> & { project_uid?: string; card_config_uid?: string }) =>
    api.post<ApiResponse<TaskView>>('/views/', data),

  updateView: (uid: string, data: Partial<TaskView> & { project_uid?: string; card_config_uid?: string }) =>
    api.patch<ApiResponse<TaskView>>(`/views/${uid}/`, data),

  deleteView: (uid: string) =>
    api.delete(`/views/${uid}/`),

  getViewTasks: (uid: string, params?: { page?: number; project?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Task>>>(`/views/${uid}/tasks/`, { params }),

  setDefaultView: (uid: string) =>
    api.post(`/views/${uid}/set_default/`),

  duplicateView: (uid: string) =>
    api.post<ApiResponse<TaskView>>(`/views/${uid}/duplicate/`),

  getDefaultViews: (params?: { project?: string }) =>
    api.get<ApiResponse<TaskView[]>>('/views/default_views/', { params }),
};

// ========================
// 卡片配置 API
// ========================
export const cardConfigApi = {
  getConfigs: (params?: { is_preset?: boolean }) =>
    api.get<ApiResponse<PaginatedResponse<TaskCardConfig>>>('/card-configs/', { params }),

  getConfig: (uid: string) =>
    api.get<ApiResponse<TaskCardConfig>>(`/card-configs/${uid}/`),

  createConfig: (data: Partial<TaskCardConfig>) =>
    api.post<ApiResponse<TaskCardConfig>>('/card-configs/', data),

  updateConfig: (uid: string, data: Partial<TaskCardConfig>) =>
    api.patch<ApiResponse<TaskCardConfig>>(`/card-configs/${uid}/`, data),

  deleteConfig: (uid: string) =>
    api.delete(`/card-configs/${uid}/`),

  duplicateConfig: (uid: string) =>
    api.post<ApiResponse<TaskCardConfig>>(`/card-configs/${uid}/duplicate/`),

  getAvailableFields: () =>
    api.get<ApiResponse<AvailableField[]>>('/card-configs/available_fields/'),
};

// ========================
// 活动日志 API
// ========================
export const activityApi = {
  getActivityLogs: (params?: { task?: string; project?: string; page?: number }) =>
    api.get<ApiResponse<PaginatedResponse<ActivityLog>>>('/activity-logs/', { params }),
};

// ========================
// 附件 API
// ========================
export interface Attachment {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
  owner_id: string;
  is_public: boolean;
  created_at: string;
  preview_url: string;
}

export const attachmentApi = {
  upload: (formData: FormData, onProgress?: (progress: number) => void) =>
    api.post<Attachment>('/attachments/files/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
        }
      },
    }),

  getAttachments: (params?: { page?: number; page_size?: number }) =>
    api.get<{ count: number; results: Attachment[] }>('/attachments/files/', { params }),

  deleteAttachment: (id: string) =>
    api.delete(`/attachments/files/${id}/`),
};

// ========================
// 提醒 API
// ========================
export const reminderApi = {
  getReminders: (params?: { task?: string }) =>
    api.get<ApiResponse<PaginatedResponse<Reminder>>>('/reminders/', { params }),

  getUpcoming: (withinMinutes = 60) =>
    api.get<ApiResponse<Reminder[]>>(`/reminders/upcoming/?within_minutes=${withinMinutes}`),

  createReminder: (data: ReminderInput & { task_uid: string }) =>
    api.post<ApiResponse<Reminder>>('/reminders/', data),

  updateReminder: (uid: string, data: Partial<ReminderInput>) =>
    api.patch<ApiResponse<Reminder>>(`/reminders/${uid}/`, data),

  deleteReminder: (uid: string) =>
    api.delete(`/reminders/${uid}/`),

  markTriggered: (uid: string) =>
    api.post<ApiResponse<Reminder>>(`/reminders/${uid}/mark-triggered/`),
};

export default api;
