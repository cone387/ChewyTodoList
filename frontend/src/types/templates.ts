// 视图模板相关类型定义

export interface ViewTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'project' | 'personal' | 'team' | 'custom';
  icon: string;
  color: string;
  preview_image?: string;
  view_type: 'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gallery';
  filters: ViewFilter[];
  sorts: ViewSort[];
  group_by?: string;
  display_settings: ViewDisplaySettings;
  layout_settings?: ViewLayoutSettings;
  is_premium?: boolean;
  tags: string[];
  author?: string;
  rating?: number;
  usage_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ViewDisplaySettings {
  show_project: boolean;
  show_tags: boolean;
  show_due_date: boolean;
  show_priority: boolean;
  show_status: boolean;
  show_assignee?: boolean;
  show_progress?: boolean;
  show_attachments?: boolean;
  show_subtasks?: boolean;
  compact_mode: boolean;
  card_size?: 'small' | 'medium' | 'large';
  columns_count?: number;
  show_empty_groups?: boolean;
  group_collapse?: boolean;
}

export interface ViewLayoutSettings {
  // 时间轴视图设置
  timeline_scale?: 'day' | 'week' | 'month' | 'quarter';
  timeline_start_date?: string;
  timeline_end_date?: string;
  
  // 看板视图设置
  board_columns?: string[];
  board_swim_lanes?: string;
  
  // 日历视图设置
  calendar_view?: 'month' | 'week' | 'day' | 'agenda';
  calendar_start_hour?: number;
  calendar_end_hour?: number;
  
  // 表格视图设置
  table_columns?: string[];
  table_column_widths?: Record<string, number>;
  table_frozen_columns?: number;
  
  // 画廊视图设置
  gallery_columns?: number;
  gallery_aspect_ratio?: string;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  templates: ViewTemplate[];
}

// 导入现有类型
import type { ViewFilter, ViewSort } from './index';