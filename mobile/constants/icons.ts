import { MaterialCommunityIcons } from '@expo/vector-icons';

// Type for icon names
type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

// Tab bar icons
export const TabIcons: Record<string, IconName> = {
  home: 'home',
  projects: 'folder-multiple',
  views: 'view-dashboard',
  settings: 'account-circle',
};

// View type icons
export const ViewTypeIcons: Record<string, IconName> = {
  list: 'format-list-bulleted',
  board: 'view-column',
  calendar: 'calendar-month',
  table: 'table',
  timeline: 'chart-timeline-variant',
  gallery: 'view-grid',
};

// Task status icons
export const StatusIcons: Record<number, IconName> = {
  0: 'circle-outline',        // unassigned
  1: 'circle-half-full',      // todo
  2: 'check-circle',          // completed
  3: 'close-circle',          // abandoned
};

// Task priority icons
export const PriorityIcons: Record<number, IconName> = {
  0: 'flag-outline',          // low
  1: 'flag',                  // medium
  2: 'flag',                  // high
  3: 'alert-decagram',        // urgent
};

// Settings menu icons
export const SettingsIcons: Record<string, IconName> = {
  tags: 'tag-multiple',
  cardConfig: 'card-text',
  darkMode: 'weather-night',
  lightMode: 'white-balance-sunny',
  password: 'lock',
  version: 'information',
};

// Common action icons
export const ActionIcons: Record<string, IconName> = {
  back: 'arrow-left',
  close: 'close',
  more: 'dots-horizontal',
  search: 'magnify',
  add: 'plus',
  delete: 'delete',
  complete: 'check',
  undo: 'undo',
  chevronDown: 'chevron-down',
  chevronUp: 'chevron-up',
  chevronRight: 'chevron-right',
  store: 'store',
  folder: 'folder',
  clipboard: 'clipboard-text',
  subtask: 'file-tree',
  attachment: 'paperclip',
  calendar: 'calendar',
  user: 'account',
  lock: 'lock',
  eye: 'eye',
  eyeOff: 'eye-off',
  lightning: 'lightning-bolt',
};
