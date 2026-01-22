import type { ViewTemplate, TemplateCategory } from '../types/templates';
import { TaskStatus } from '../types/index';

// 预设视图模板数据
export const VIEW_TEMPLATES: ViewTemplate[] = [
  // 生产力模板
  {
    id: 'today_focus',
    name: '今日专注',
    description: '专注今天最重要的任务，按优先级排序',
    category: 'productivity',
    icon: 'today',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    view_type: 'list',
    filters: [
      {
        id: 'filter_1',
        field: 'due_date',
        operator: 'is_today',
        value: null,
        logic: 'and',
      },
      {
        id: 'filter_2',
        field: 'status',
        operator: 'not_equals',
        value: TaskStatus.COMPLETED,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'priority', direction: 'desc' },
      { field: 'created_at', direction: 'asc' },
    ],
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      show_progress: true,
      compact_mode: false,
      card_size: 'medium',
    },
    tags: ['今日', '专注', '优先级'],
    rating: 4.8,
    usage_count: 1250,
  },
  
  {
    id: 'getting_things_done',
    name: 'GTD 工作流',
    description: '基于 Getting Things Done 方法论的任务管理',
    category: 'productivity',
    icon: 'checklist',
    color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    view_type: 'board',
    filters: [
      {
        id: 'filter_1',
        field: 'status',
        operator: 'not_equals',
        value: TaskStatus.COMPLETED,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'priority', direction: 'desc' },
      { field: 'due_date', direction: 'asc' },
    ],
    group_by: 'status',
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: false,
      show_assignee: true,
      compact_mode: true,
      show_empty_groups: true,
    },
    layout_settings: {
      board_columns: ['收集箱', '下一步行动', '等待中', '项目'],
      board_swim_lanes: 'priority',
    },
    tags: ['GTD', '工作流', '看板'],
    rating: 4.9,
    usage_count: 890,
  },

  {
    id: 'eisenhower_matrix',
    name: '四象限法则',
    description: '按重要性和紧急性分类任务',
    category: 'productivity',
    icon: 'grid_view',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    view_type: 'board',
    filters: [
      {
        id: 'filter_1',
        field: 'status',
        operator: 'not_equals',
        value: TaskStatus.COMPLETED,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'due_date', direction: 'asc' },
    ],
    group_by: 'priority',
    display_settings: {
      show_project: true,
      show_tags: false,
      show_due_date: true,
      show_priority: false,
      show_status: true,
      compact_mode: true,
      show_empty_groups: true,
    },
    layout_settings: {
      board_columns: ['重要紧急', '重要不紧急', '不重要紧急', '不重要不紧急'],
    },
    tags: ['四象限', '优先级', '时间管理'],
    rating: 4.7,
    usage_count: 650,
  },

  // 项目管理模板
  {
    id: 'project_timeline',
    name: '项目时间轴',
    description: '以时间轴形式展示项目进度和里程碑',
    category: 'project',
    icon: 'timeline',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    view_type: 'timeline',
    filters: [
      {
        id: 'filter_1',
        field: 'due_date',
        operator: 'is_not_empty',
        value: null,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'due_date', direction: 'asc' },
      { field: 'priority', direction: 'desc' },
    ],
    group_by: 'project',
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      show_progress: true,
      show_assignee: true,
      compact_mode: false,
    },
    layout_settings: {
      timeline_scale: 'week',
      timeline_start_date: new Date().toISOString().split('T')[0],
    },
    tags: ['时间轴', '项目', '里程碑'],
    rating: 4.6,
    usage_count: 420,
  },

  {
    id: 'sprint_board',
    name: '敏捷冲刺看板',
    description: '敏捷开发团队的冲刺任务管理',
    category: 'project',
    icon: 'sprint',
    color: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/20',
    view_type: 'board',
    filters: [
      {
        id: 'filter_1',
        field: 'status',
        operator: 'in',
        value: [TaskStatus.TODO, TaskStatus.UNASSIGNED],
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'priority', direction: 'desc' },
      { field: 'sort_order', direction: 'asc' },
    ],
    group_by: 'status',
    display_settings: {
      show_project: false,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: false,
      show_assignee: true,
      show_progress: true,
      compact_mode: true,
    },
    layout_settings: {
      board_columns: ['待办', '进行中', '测试中', '已完成'],
      board_swim_lanes: 'assignee',
    },
    tags: ['敏捷', '冲刺', '团队'],
    rating: 4.8,
    usage_count: 780,
  },

  // 个人管理模板
  {
    id: 'weekly_review',
    name: '周回顾',
    description: '回顾本周完成的任务和下周计划',
    category: 'personal',
    icon: 'calendar_view_week',
    color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20',
    view_type: 'calendar',
    filters: [
      {
        id: 'filter_1',
        field: 'due_date',
        operator: 'is_this_week',
        value: null,
        logic: 'or',
      },
      {
        id: 'filter_2',
        field: 'completed_time',
        operator: 'is_this_week',
        value: null,
        logic: 'or',
      },
    ],
    sorts: [
      { field: 'due_date', direction: 'asc' },
      { field: 'completed_time', direction: 'desc' },
    ],
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      compact_mode: false,
    },
    layout_settings: {
      calendar_view: 'week',
      calendar_start_hour: 8,
      calendar_end_hour: 22,
    },
    tags: ['周回顾', '日历', '个人'],
    rating: 4.5,
    usage_count: 340,
  },

  {
    id: 'habit_tracker',
    name: '习惯追踪',
    description: '追踪日常习惯和重复任务的完成情况',
    category: 'personal',
    icon: 'track_changes',
    color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20',
    view_type: 'table',
    filters: [
      {
        id: 'filter_1',
        field: 'tags',
        operator: 'contains',
        value: '习惯',
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'created_at', direction: 'desc' },
    ],
    display_settings: {
      show_project: false,
      show_tags: true,
      show_due_date: true,
      show_priority: false,
      show_status: true,
      show_progress: true,
      compact_mode: true,
    },
    layout_settings: {
      table_columns: ['title', 'status', 'due_date', 'tags', 'progress'],
      table_frozen_columns: 1,
    },
    tags: ['习惯', '追踪', '表格'],
    rating: 4.4,
    usage_count: 290,
  },

  // 团队协作模板
  {
    id: 'team_dashboard',
    name: '团队仪表板',
    description: '团队任务分配和进度概览',
    category: 'team',
    icon: 'groups',
    color: 'text-teal-500 bg-teal-50 dark:bg-teal-900/20',
    view_type: 'board',
    filters: [
      {
        id: 'filter_1',
        field: 'status',
        operator: 'not_equals',
        value: TaskStatus.COMPLETED,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'priority', direction: 'desc' },
      { field: 'due_date', direction: 'asc' },
    ],
    group_by: 'assignee',
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      show_assignee: false,
      show_progress: true,
      compact_mode: false,
      show_empty_groups: false,
    },
    tags: ['团队', '仪表板', '分配'],
    rating: 4.7,
    usage_count: 560,
  },

  {
    id: 'milestone_tracker',
    name: '里程碑追踪',
    description: '追踪项目重要里程碑和交付物',
    category: 'project',
    icon: 'flag',
    color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    view_type: 'timeline',
    filters: [
      {
        id: 'filter_1',
        field: 'tags',
        operator: 'contains',
        value: '里程碑',
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'due_date', direction: 'asc' },
    ],
    group_by: 'project',
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      show_progress: true,
      compact_mode: false,
    },
    layout_settings: {
      timeline_scale: 'month',
    },
    tags: ['里程碑', '交付物', '时间轴'],
    rating: 4.6,
    usage_count: 380,
  },

  // 创意和设计模板
  {
    id: 'creative_gallery',
    name: '创意画廊',
    description: '以画廊形式展示创意任务和作品',
    category: 'custom',
    icon: 'photo_library',
    color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
    view_type: 'gallery',
    filters: [
      {
        id: 'filter_1',
        field: 'tags',
        operator: 'contains',
        value: '创意',
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'updated_at', direction: 'desc' },
    ],
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: false,
      show_priority: false,
      show_status: true,
      show_attachments: true,
      compact_mode: false,
      card_size: 'large',
    },
    layout_settings: {
      gallery_columns: 3,
      gallery_aspect_ratio: '16:9',
    },
    tags: ['创意', '画廊', '作品'],
    rating: 4.3,
    usage_count: 180,
  },
];

// 模板分类
export const TEMPLATE_CATEGORIES: TemplateCategory[] = [
  {
    id: 'productivity',
    name: '生产力',
    description: '提升个人工作效率的模板',
    icon: 'productivity',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    templates: VIEW_TEMPLATES.filter(t => t.category === 'productivity'),
  },
  {
    id: 'project',
    name: '项目管理',
    description: '项目规划和进度跟踪模板',
    icon: 'assignment',
    color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    templates: VIEW_TEMPLATES.filter(t => t.category === 'project'),
  },
  {
    id: 'personal',
    name: '个人管理',
    description: '个人生活和习惯管理模板',
    icon: 'person',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    templates: VIEW_TEMPLATES.filter(t => t.category === 'personal'),
  },
  {
    id: 'team',
    name: '团队协作',
    description: '团队协作和任务分配模板',
    icon: 'groups',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    templates: VIEW_TEMPLATES.filter(t => t.category === 'team'),
  },
  {
    id: 'custom',
    name: '创意定制',
    description: '特殊用途和创意展示模板',
    icon: 'palette',
    color: 'text-pink-500 bg-pink-50 dark:bg-pink-900/20',
    templates: VIEW_TEMPLATES.filter(t => t.category === 'custom'),
  },
];

// 获取推荐模板
export const getRecommendedTemplates = (limit: number = 6): ViewTemplate[] => {
  return VIEW_TEMPLATES
    .sort((a, b) => (b.rating || 0) * (b.usage_count || 0) - (a.rating || 0) * (a.usage_count || 0))
    .slice(0, limit);
};

// 根据标签搜索模板
export const searchTemplatesByTag = (tag: string): ViewTemplate[] => {
  return VIEW_TEMPLATES.filter(template => 
    template.tags.some(t => t.toLowerCase().includes(tag.toLowerCase()))
  );
};

// 根据视图类型筛选模板
export const getTemplatesByViewType = (viewType: string): ViewTemplate[] => {
  return VIEW_TEMPLATES.filter(template => template.view_type === viewType);
};