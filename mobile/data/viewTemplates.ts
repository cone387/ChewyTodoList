import { TaskStatus } from '../shared/types/index';
import type { ViewFilter, ViewSort } from '../shared/types/index';

export interface ViewTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'project' | 'personal' | 'team' | 'custom';
  icon: string;
  view_type: 'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gallery';
  filters: ViewFilter[];
  sorts: ViewSort[];
  group_by?: string;
  view_settings: Record<string, any>;
  tags: string[];
  rating: number;
  usage_count: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  icon: string;
}

export const VIEW_TEMPLATES: ViewTemplate[] = [
  {
    id: 'today_focus',
    name: '今日专注',
    description: '专注今天最重要的任务，按优先级排序',
    category: 'productivity',
    icon: '☀️',
    view_type: 'list',
    filters: [
      { id: 'f1', field: 'due_date', operator: 'is_today', value: null, logic: 'and' },
      { id: 'f2', field: 'status', operator: 'not_equals', value: TaskStatus.COMPLETED, logic: 'and' },
    ],
    sorts: [{ field: 'priority', direction: 'desc' }, { field: 'created_at', direction: 'asc' }],
    view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true },
    tags: ['今日', '专注', '优先级'],
    rating: 4.8,
    usage_count: 1250,
  },
  {
    id: 'getting_things_done',
    name: 'GTD 工作流',
    description: '基于 Getting Things Done 方法论的任务管理',
    category: 'productivity',
    icon: '✅',
    view_type: 'board',
    filters: [
      { id: 'f1', field: 'status', operator: 'not_equals', value: TaskStatus.COMPLETED, logic: 'and' },
    ],
    sorts: [{ field: 'priority', direction: 'desc' }, { field: 'due_date', direction: 'asc' }],
    group_by: 'status',
    view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true, compact_mode: true },
    tags: ['GTD', '工作流', '看板'],
    rating: 4.9,
    usage_count: 890,
  },
  {
    id: 'eisenhower_matrix',
    name: '四象限法则',
    description: '按重要性和紧急性分类任务',
    category: 'productivity',
    icon: '📊',
    view_type: 'board',
    filters: [
      { id: 'f1', field: 'status', operator: 'not_equals', value: TaskStatus.COMPLETED, logic: 'and' },
    ],
    sorts: [{ field: 'due_date', direction: 'asc' }],
    group_by: 'priority',
    view_settings: { show_project: true, show_due_date: true, show_status: true, compact_mode: true },
    tags: ['四象限', '优先级', '时间管理'],
    rating: 4.7,
    usage_count: 650,
  },
  {
    id: 'project_timeline',
    name: '项目时间轴',
    description: '以时间轴形式展示项目进度和里程碑',
    category: 'project',
    icon: '📅',
    view_type: 'timeline',
    filters: [
      { id: 'f1', field: 'due_date', operator: 'is_not_empty', value: null, logic: 'and' },
    ],
    sorts: [{ field: 'due_date', direction: 'asc' }, { field: 'priority', direction: 'desc' }],
    group_by: 'project',
    view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true, show_progress: true },
    tags: ['时间轴', '项目', '里程碑'],
    rating: 4.6,
    usage_count: 420,
  },
  {
    id: 'sprint_board',
    name: '敏捷冲刺看板',
    description: '敏捷开发团队的冲刺任务管理',
    category: 'project',
    icon: '🏃',
    view_type: 'board',
    filters: [
      { id: 'f1', field: 'status', operator: 'not_equals', value: TaskStatus.COMPLETED, logic: 'and' },
    ],
    sorts: [{ field: 'priority', direction: 'desc' }],
    group_by: 'status',
    view_settings: { show_tags: true, show_due_date: true, show_priority: true, show_progress: true, compact_mode: true },
    tags: ['敏捷', '冲刺', '团队'],
    rating: 4.8,
    usage_count: 780,
  },
  {
    id: 'weekly_review',
    name: '周回顾',
    description: '回顾本周完成的任务和下周计划',
    category: 'personal',
    icon: '📆',
    view_type: 'calendar',
    filters: [
      { id: 'f1', field: 'due_date', operator: 'is_this_week', value: null, logic: 'and' },
    ],
    sorts: [{ field: 'due_date', direction: 'asc' }],
    view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true },
    tags: ['周回顾', '日历', '个人'],
    rating: 4.5,
    usage_count: 340,
  },
  {
    id: 'habit_tracker',
    name: '习惯追踪',
    description: '追踪日常习惯和重复任务的完成情况',
    category: 'personal',
    icon: '🎯',
    view_type: 'table',
    filters: [],
    sorts: [{ field: 'created_at', direction: 'desc' }],
    view_settings: { show_tags: true, show_due_date: true, show_status: true, show_progress: true, compact_mode: true },
    tags: ['习惯', '追踪', '表格'],
    rating: 4.4,
    usage_count: 290,
  },
  {
    id: 'team_dashboard',
    name: '团队仪表板',
    description: '团队任务分配和进度概览',
    category: 'team',
    icon: '👥',
    view_type: 'board',
    filters: [
      { id: 'f1', field: 'status', operator: 'not_equals', value: TaskStatus.COMPLETED, logic: 'and' },
    ],
    sorts: [{ field: 'priority', direction: 'desc' }, { field: 'due_date', direction: 'asc' }],
    view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true, show_progress: true },
    tags: ['团队', '仪表板', '分配'],
    rating: 4.7,
    usage_count: 560,
  },
  {
    id: 'creative_gallery',
    name: '创意画廊',
    description: '以画廊形式展示创意任务和作品',
    category: 'custom',
    icon: '🎨',
    view_type: 'gallery',
    filters: [],
    sorts: [{ field: 'updated_at', direction: 'desc' }],
    view_settings: { show_project: true, show_tags: true, show_status: true, card_size: 'large' },
    tags: ['创意', '画廊', '作品'],
    rating: 4.3,
    usage_count: 180,
  },
  {
    id: 'milestone_tracker',
    name: '里程碑追踪',
    description: '追踪项目重要里程碑和交付物',
    category: 'project',
    icon: '🚩',
    view_type: 'timeline',
    filters: [],
    sorts: [{ field: 'due_date', direction: 'asc' }],
    group_by: 'project',
    view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true, show_progress: true },
    tags: ['里程碑', '交付物', '时间轴'],
    rating: 4.6,
    usage_count: 380,
  },
];

export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  { id: 'productivity', name: '生产力', icon: '⚡' },
  { id: 'project', name: '项目管理', icon: '📋' },
  { id: 'personal', name: '个人管理', icon: '👤' },
  { id: 'team', name: '团队协作', icon: '👥' },
  { id: 'custom', name: '创意定制', icon: '🎨' },
];

export function getRecommendedTemplates(limit: number = 6): ViewTemplate[] {
  return [...VIEW_TEMPLATES]
    .sort((a, b) => (b.rating * b.usage_count) - (a.rating * a.usage_count))
    .slice(0, limit);
}

const VIEW_TYPE_ICONS: Record<string, string> = {
  list: '☰', board: '⊞', calendar: '📅', table: '⊟', timeline: '⟶', gallery: '⊡',
};

const VIEW_TYPE_LABELS: Record<string, string> = {
  list: '列表', board: '看板', calendar: '日历', table: '表格', timeline: '时间线', gallery: '画廊',
};

export function getViewTypeIcon(type: string): string {
  return VIEW_TYPE_ICONS[type] || '☰';
}

export function getViewTypeLabel(type: string): string {
  return VIEW_TYPE_LABELS[type] || type;
}
