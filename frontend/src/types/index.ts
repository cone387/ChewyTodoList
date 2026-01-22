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
  project: Project;
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
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// 活动日志类型
export interface ActivityLog {
  id: number;
  action: string;
  detail: string;
  created_at: string;
  task: {
    uid: string;
    title: string;
  };
  project: {
    uid: string;
    name: string;
  };
}

// 视图类型
export interface TaskView {
  uid: string;
  name: string;
  project?: Project;
  view_type: 'list' | 'board' | 'calendar' | 'table';
  view_type_display: string;
  is_default: boolean;
  is_public: boolean;
  is_visible_in_nav: boolean; // 是否在导航栏显示
  sort_order: number;
  filters: ViewFilter[];
  filter_groups?: ViewFilterGroup[]; // 高级筛选组
  sorts: ViewSort[];
  group_by?: string;
  display_settings: Record<string, any>;
  created_at: string;
  updated_at: string;
  tasks_count?: number;
}

// 视图筛选条件
export interface ViewFilter {
  id?: string; // 筛选条件唯一标识
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 
           'is_empty' | 'is_not_empty' | 'greater_than' | 'greater_than_or_equal' | 
           'less_than' | 'less_than_or_equal' | 'in' | 'not_in' | 'between' | 'not_between' |
           'is_today' | 'is_yesterday' | 'is_tomorrow' | 'is_this_week' | 'is_last_week' | 'is_next_week' |
           'is_this_month' | 'is_last_month' | 'is_next_month' | 'is_overdue' | 'has_no_date';
  value: any;
  value2?: any; // 用于between操作符的第二个值
  logic?: 'and' | 'or';
}

// 筛选条件组
export interface ViewFilterGroup {
  id: string;
  logic: 'and' | 'or';
  filters: (ViewFilter | ViewFilterGroup)[];
}

// 字段类型定义
export interface FieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'multiselect' | 'boolean' | 'user' | 'relation';
  options?: { value: any; label: string; color?: string }[];
  multiple?: boolean;
}

// 操作符定义
export interface OperatorDefinition {
  key: string;
  label: string;
  valueRequired: boolean;
  valueType?: 'text' | 'number' | 'date' | 'select' | 'multiselect';
  supportedFieldTypes: string[];
}

// 视图排序规则
export interface ViewSort {
  field: string;
  direction: 'asc' | 'desc';
}