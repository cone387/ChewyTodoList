/**
 * TaskCardRenderer — 配置驱动的任务卡片字段渲染引擎
 * 每个 FieldRenderer 对应一种字段类型，支持 style variant 配置
 */
import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow, isPast, isToday, isTomorrow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Task, CardFieldConfig } from '../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../shared/types/index';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';
import { PriorityIcons, StatusIcons } from '../../constants/icons';

// ========================
// 优先级字段
// ========================
export const PriorityField: React.FC<{ task: Task; style: Record<string, any> }> = ({ task, style }) => {
  const variant = style.variant || 'flag';
  const colors: Record<number, string> = {
    [TaskPriority.LOW]: Colors.priority.low,
    [TaskPriority.MEDIUM]: Colors.priority.medium,
    [TaskPriority.HIGH]: Colors.priority.high,
    [TaskPriority.URGENT]: Colors.priority.urgent,
  };
  const labels: Record<number, string> = { 0: '低', 1: '中', 2: '高', 3: '紧急' };
  const color = colors[task.priority] || Colors.priority.low;

  if (variant === 'dot') {
    return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
  }
  if (variant === 'badge') {
    return (
      <View style={{ backgroundColor: color + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
        <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[task.priority]}</Text>
      </View>
    );
  }
  // flag (default)
  return <MaterialCommunityIcons name={PriorityIcons[task.priority] || 'flag-outline'} size={14} color={color} />;
};

// ========================
// 状态字段
// ========================
export const StatusField: React.FC<{ task: Task; style: Record<string, any> }> = ({ task, style }) => {
  const variant = style.variant || 'badge';
  const colors: Record<number, string> = {
    [TaskStatus.UNASSIGNED]: Colors.status.unassigned,
    [TaskStatus.TODO]: Colors.status.todo,
    [TaskStatus.COMPLETED]: Colors.status.completed,
    [TaskStatus.ABANDONED]: Colors.status.abandoned,
  };
  const labels: Record<number, string> = { 0: '待分配', 1: '待办', 2: '已完成', 3: '已放弃' };
  const color = colors[task.status] || Colors.status.todo;

  if (variant === 'icon') {
    return <MaterialCommunityIcons name={StatusIcons[task.status] || 'circle-outline'} size={14} color={color} />;
  }
  if (variant === 'dot') {
    return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />;
  }
  // badge (default)
  return (
    <View style={{ backgroundColor: color + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
      <Text style={{ color, fontSize: 11, fontWeight: '600' }}>{labels[task.status]}</Text>
    </View>
  );
};

// ========================
// 标题字段
// ========================
export const TitleField: React.FC<{ task: Task; style: Record<string, any> }> = ({ task, style }) => {
  const fontSizes: Record<string, number> = { small: 13, medium: 15, large: 17 };
  const fontWeights: Record<string, any> = {
    normal: '400', medium: '500', semibold: '600', bold: '700',
  };
  const isCompleted = task.status === TaskStatus.COMPLETED;
  const isAbandoned = task.status === TaskStatus.ABANDONED;

  return (
    <Text
      numberOfLines={2}
      style={{
        fontSize: fontSizes[style.fontSize || 'medium'] || 15,
        fontWeight: fontWeights[style.fontWeight || 'medium'] || '500',
        color: isCompleted || isAbandoned ? '#9ca3af' : colors.text.primary,
        textDecorationLine: (isCompleted || isAbandoned) && style.showStrikethrough ? 'line-through' : 'none',
        flex: 1,
      }}
    >
      {task.title}
    </Text>
  );
};

// ========================
// 截止日期字段
// ========================
export const DueDateField: React.FC<{ task: Task; style: Record<string, any> }> = ({ task, style }) => {
  if (!task.due_date) return null;
  const date = new Date(task.due_date);
  const isOverdue = isPast(date) && task.status !== TaskStatus.COMPLETED;
  const color = isOverdue ? '#ef4444' : '#6b7280';

  let label = '';
  if (style.showRelative) {
    if (isToday(date)) label = '今天';
    else if (isTomorrow(date)) label = '明天';
    else if (isOverdue) label = formatDistanceToNow(date, { locale: zhCN, addSuffix: true });
    else label = formatDistanceToNow(date, { locale: zhCN, addSuffix: true });
  } else {
    label = `${date.getMonth() + 1}/${date.getDate()}`;
  }

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {style.showIcon && <MaterialCommunityIcons name="calendar" size={11} color={color} style={{ marginRight: 2 }} />}
      <Text style={{ color, fontSize: 11 }}>{label}</Text>
    </View>
  );
};

// ========================
// 标签字段
// ========================
export const TagsField: React.FC<{ task: Task; style: Record<string, any> }> = ({ task, style }) => {
  if (!task.tags || task.tags.length === 0) return null;
  const maxCount = style.maxCount || 3;
  const variant = style.variant || 'pill';
  const visibleTags = task.tags.slice(0, maxCount);

  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
      {visibleTags.map((tag) => {
        if (variant === 'minimal') {
          return (
            <View key={tag.uid} style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: tag.color }} />
          );
        }
        return (
          <View
            key={tag.uid}
            style={{
              backgroundColor: variant === 'badge' ? tag.color + '25' : tag.color + '15',
              borderRadius: variant === 'pill' ? 10 : 4,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderWidth: variant === 'badge' ? 1 : 0,
              borderColor: variant === 'badge' ? tag.color + '60' : 'transparent',
            }}
          >
            <Text style={{ color: tag.color, fontSize: 10, fontWeight: '500' }}>{tag.name}</Text>
          </View>
        );
      })}
      {task.tags.length > maxCount && (
        <Text style={{ color: colors.text.muted, fontSize: 10 }}>+{task.tags.length - maxCount}</Text>
      )}
    </View>
  );
};

// ========================
// 项目字段
// ========================
export const ProjectField: React.FC<{ task: Task; style: Record<string, any> }> = ({ task }) => {
  if (!task.project) return null;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <MaterialCommunityIcons name="folder" size={11} color={colors.text.muted} style={{ marginRight: 3 }} />
      <Text style={{ color: colors.text.muted, fontSize: 11 }}>{task.project.name}</Text>
    </View>
  );
};

// ========================
// 子任务进度字段
// ========================
export const SubtasksProgressField: React.FC<{ task: Task; style: Record<string, any> }> = ({ task, style }) => {
  if (!task.subtasks_count || task.subtasks_count === 0) return null;
  const ratio = task.completed_subtasks_count / task.subtasks_count;

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {style.showProgress && (
        <View style={{ width: 32, height: 3, backgroundColor: '#e5e7eb', borderRadius: 2, overflow: 'hidden' }}>
          <View style={{ width: `${ratio * 100}%` as any, height: 3, backgroundColor: Colors.primary, borderRadius: 2 }} />
        </View>
      )}
      <Text style={{ color: colors.text.muted, fontSize: 11 }}>
        {task.completed_subtasks_count}/{task.subtasks_count}
      </Text>
    </View>
  );
};

// ========================
// 字段渲染分发器
// ========================
export const FieldRenderer: React.FC<{ field: string; task: Task; fieldStyle: Record<string, any> }> = ({
  field,
  task,
  fieldStyle,
}) => {
  switch (field) {
    case 'priority': return <PriorityField task={task} style={fieldStyle} />;
    case 'status': return <StatusField task={task} style={fieldStyle} />;
    case 'title': return <TitleField task={task} style={fieldStyle} />;
    case 'due_date': return <DueDateField task={task} style={fieldStyle} />;
    case 'tags': return <TagsField task={task} style={fieldStyle} />;
    case 'project': return <ProjectField task={task} style={fieldStyle} />;
    case 'subtasks_count': return <SubtasksProgressField task={task} style={fieldStyle} />;
    default: return null;
  }
};

// ========================
// 按 position 分组渲染
// ========================
export function groupFieldsByPosition(fieldConfigs: CardFieldConfig[]) {
  const { colors } = useTheme();
  const groups: Record<string, CardFieldConfig[]> = {
    header_left: [],
    header: [],
    header_right: [],
    body: [],
    footer: [],
  };
  for (const fc of fieldConfigs) {
    if (fc.visible && groups[fc.position]) {
      groups[fc.position].push(fc);
    }
  }
  return groups;
}
