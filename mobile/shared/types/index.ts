// 共享类型定义 — 与 frontend/src/types/index.ts 保持同步

// 用户类型
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

// 认证响应类型
export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    access: string;
    refresh: string;
  };
  message: string;
}

// 标签类型
export interface Tag {
  uid: string;
  name: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 分组类型
export interface Group {
  uid: string;
  name: string;
  desc?: string;
  sort_order: number;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  projects_count: number;
}

// 项目类型
export interface Project {
  uid: string;
  name: string;
  desc?: string;
  group: Group;
  view_type: 'list' | 'card';
  style: Record<string, any>;
  settings: Record<string, any>;
  sort_order: number;
  created_at: string;
  updated_at: string;
  tasks_count: number;
  completed_tasks_count: number;
}

// 任务状态枚举
export const TaskStatus = {
  UNASSIGNED: 0,
  TODO: 1,
  COMPLETED: 2,
  ABANDONED: 3,
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

// 任务优先级枚举
export const TaskPriority = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
  URGENT: 3,
} as const;

export type TaskPriority = typeof TaskPriority[keyof typeof TaskPriority];

// 任务类型
export interface Task {
  uid: string;
  title: string;
  content?: string;
  status: TaskStatus;
  status_display: string;
  priority: TaskPriority;
  priority_display: string;
  project?: Project | null;
  parent?: string;
  tags: Tag[];
  is_all_day: boolean;
  start_date?: string;
  due_date?: string;
  completed_time?: string;
  time_zone: string;
  sort_order: number;
  custom_group?: string;
  attachments: any[];
  created_at: string;
  updated_at: string;
  is_completed: boolean;
  is_overdue: boolean;
  subtasks_count: number;
  completed_subtasks_count: number;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details: any;
  };
  timestamp?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  results: T[];
  pagination: {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
    next: string | null;
    previous: string | null;
  };
}

// 活动日志类型
export interface ActivityLog {
  id: number;
  action: string;
  action_display: string;
  detail: string;
  created_at: string;
  task: string;
  task_uid: string;
  project?: string | null;
  project_uid?: string | null;
}

// 卡片配置类型
export interface TaskCardConfig {
  uid: string;
  name: string;
  desc?: string;
  is_preset: boolean;
  layout: 'compact' | 'comfortable' | 'spacious';
  style: Record<string, any>;
  field_configs: CardFieldConfig[];
  sort_order: number;
  created_at: string;
  updated_at: string;
}

// 卡片字段配置
export interface CardFieldConfig {
  field: string;
  visible: boolean;
  position: 'header' | 'header_left' | 'header_right' | 'body' | 'footer';
  style: Record<string, any>;
}

// 可用字段定义（由后端 available_fields 接口返回）
export interface AvailableField {
  field: string;
  label: string;
  type: string;
  required: boolean;
  positions: string[];
  style_options: Record<string, any>;
}

// 视图类型
export interface TaskView {
  uid: string;
  name: string;
  project?: Project;
  view_type: 'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gallery';
  view_type_display: string;
  is_default: boolean;
  is_public: boolean;
  is_system?: boolean;
  is_visible_in_nav: boolean;
  follow_selected_project: boolean;
  sort_order: number;
  card_config?: TaskCardConfig | null;
  filters: ViewFilter[];
  sorts: ViewSort[];
  group_by?: string;
  view_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  tasks_count?: number;
}

// 视图筛选条件
export interface ViewFilter {
  id?: string;
  field: string;
  operator: string;
  value: any;
  value2?: any;
  logic?: 'and' | 'or';
}

// 视图排序规则
export interface ViewSort {
  field: string;
  direction: 'asc' | 'desc';
}
