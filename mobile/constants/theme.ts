// 全局主题常量

export type ThemeMode = 'light' | 'dark';

// Light theme colors
const LightColors = {
  primary: '#8b5cf6',
  primaryDark: '#7c3aed',
  primaryLight: '#ede9fe',

  status: {
    unassigned: '#94a3b8',
    todo: '#3b82f6',
    completed: '#22c55e',
    abandoned: '#ef4444',
  },

  priority: {
    low: '#94a3b8',
    medium: '#f59e0b',
    high: '#f97316',
    urgent: '#ef4444',
  },

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
  card: '#ffffff',
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  error: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  overlay: 'rgba(0,0,0,0.4)',
};

// Dark theme colors
const DarkColors: typeof LightColors = {
  primary: '#a78bfa',
  primaryDark: '#8b5cf6',
  primaryLight: '#2e1065',

  status: {
    unassigned: '#64748b',
    todo: '#60a5fa',
    completed: '#4ade80',
    abandoned: '#f87171',
  },

  priority: {
    low: '#64748b',
    medium: '#fbbf24',
    high: '#fb923c',
    urgent: '#f87171',
  },

  text: {
    primary: '#f1f5f9',
    secondary: '#94a3b8',
    muted: '#64748b',
    inverse: '#0f172a',
  },
  background: {
    primary: '#0f172a',
    secondary: '#1e293b',
    tertiary: '#334155',
  },
  card: '#1e293b',
  border: '#334155',
  borderLight: '#1e293b',
  error: '#f87171',
  success: '#4ade80',
  warning: '#fbbf24',
  overlay: 'rgba(0,0,0,0.6)',
};

// Default export for backward compatibility
export const Colors = LightColors;

export function getThemeColors(mode: ThemeMode) {
  return mode === 'dark' ? DarkColors : LightColors;
}

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

export const CardLayout = {
  compact: { padding: Spacing.sm, gap: Spacing.xs },
  comfortable: { padding: Spacing.md, gap: Spacing.sm },
  spacious: { padding: Spacing.lg, gap: Spacing.md },
};
