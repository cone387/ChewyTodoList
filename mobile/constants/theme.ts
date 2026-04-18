// 全局主题常量
export const Colors = {
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  primaryLight: '#ede9fe',

  // 任务状态颜色
  status: {
    unassigned: '#94a3b8',
    todo: '#3b82f6',
    completed: '#22c55e',
    abandoned: '#ef4444',
  },

  // 优先级颜色
  priority: {
    low: '#94a3b8',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
  },

  // 通用颜色
  text: {
    primary: '#111418',
    secondary: '#6b7280',
    muted: '#9ca3af',
    inverse: '#ffffff',
  },
  background: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    tertiary: '#f3f4f6',
  },
  border: '#e5e7eb',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// 卡片布局密度对应的间距
export const CardLayout = {
  compact: { padding: Spacing.sm, gap: Spacing.xs },
  comfortable: { padding: Spacing.md, gap: Spacing.sm },
  spacious: { padding: Spacing.lg, gap: Spacing.md },
};
