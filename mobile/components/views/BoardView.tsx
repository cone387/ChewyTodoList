import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import type { Task, TaskView } from '../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../shared/types/index';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';

interface BoardViewProps {
  tasks: Task[];
  view?: TaskView | null;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

const STATUS_COLUMNS = [
  { status: TaskStatus.UNASSIGNED, label: '待分配', color: Colors.status.unassigned, bg: '#f8fafc' },
  { status: TaskStatus.TODO, label: '待办', color: Colors.status.todo, bg: '#eff6ff' },
  { status: TaskStatus.ABANDONED, label: '已放弃', color: Colors.status.abandoned, bg: '#fef2f2' },
];

const PRIORITY_COLUMNS = [
  { priority: TaskPriority.LOW, label: '低', color: '#94a3b8', bg: '#f8fafc' },
  { priority: TaskPriority.MEDIUM, label: '中', color: '#f59e0b', bg: '#fffbeb' },
  { priority: TaskPriority.HIGH, label: '高', color: '#f97316', bg: '#fff7ed' },
  { priority: TaskPriority.URGENT, label: '紧急', color: colors.error, bg: '#fef2f2' },
];

const PRIORITY_COLORS: Record<number, string> = {
  [TaskPriority.LOW]: '#94a3b8',
  [TaskPriority.MEDIUM]: '#f59e0b',
  [TaskPriority.HIGH]: '#f97316',
  [TaskPriority.URGENT]: '#ef4444',
};

export const BoardView: React.FC<BoardViewProps> = ({
  tasks,
  view,
  onTaskPress,
  onRefresh,
  isRefreshing = false,
  isLoading = false,
  emptyMessage = '暂无任务',
}) => {
  const { colors } = useTheme();
  const displaySettings = view?.view_settings || {};
  const showPriority = displaySettings.show_priority ?? true;
  const showDueDate = displaySettings.show_due_date ?? true;
  const showTags = displaySettings.show_tags ?? true;
  const showProject = displaySettings.show_project ?? true;

  const columns = useMemo(() => {
    const groupBy = view?.group_by || '';
    const activeTasks = tasks.filter((task) => !task.is_completed);
    const completedTasks = tasks.filter((task) => task.is_completed);
    const withCompletedColumn = (baseColumns: Array<{ key: string; label: string; color: string; bg: string; tasks: Task[] }>) => {
      if (completedTasks.length === 0) return baseColumns;
      return [
        ...baseColumns,
        {
          key: 'completed-group',
          label: '已完成',
          color: Colors.status.completed,
          bg: '#f0fdf4',
          tasks: completedTasks,
        },
      ];
    };

    if (!groupBy) {
      return withCompletedColumn([
        {
          key: 'all-active',
          label: '进行中',
          color: Colors.primary,
          bg: '#eff6ff',
          tasks: activeTasks,
        },
      ]);
    }

    if (groupBy === 'status') {
      return withCompletedColumn(STATUS_COLUMNS.map((column) => ({
        key: `status-${column.status}`,
        label: column.label,
        color: column.color,
        bg: column.bg,
        tasks: activeTasks.filter((task) => task.status === column.status),
      })));
    }

    if (groupBy === 'priority') {
      return withCompletedColumn(PRIORITY_COLUMNS.map((column) => ({
        key: `priority-${column.priority}`,
        label: column.label,
        color: column.color,
        bg: column.bg,
        tasks: activeTasks.filter((task) => task.priority === column.priority),
      })));
    }

    if (groupBy === 'project') {
      const grouped = new Map<string, { label: string; tasks: Task[] }>();

      for (const task of activeTasks) {
        const key = task.project?.uid || '__inbox__';
        const label = task.project?.name || '收集箱';
        const existing = grouped.get(key) || { label, tasks: [] };
        existing.tasks.push(task);
        grouped.set(key, existing);
      }

      return withCompletedColumn(Array.from(grouped.entries())
        .sort((left, right) => left[1].label.localeCompare(right[1].label, 'zh-CN'))
        .map(([key, value]) => ({
          key: `project-${key}`,
          label: value.label,
          color: Colors.primary,
          bg: '#f5f3ff',
          tasks: value.tasks,
        })));
    }

    if (groupBy === 'due_date') {
      const grouped = new Map<string, { label: string; order: number; tasks: Task[] }>();

      for (const task of activeTasks) {
        if (!task.due_date) {
          const existing = grouped.get('__none__') || { label: '未设置截止日期', order: Number.MAX_SAFE_INTEGER, tasks: [] };
          existing.tasks.push(task);
          grouped.set('__none__', existing);
          continue;
        }

        const dueDate = new Date(task.due_date);
        const dateKey = dueDate.toISOString().slice(0, 10);
        const existing = grouped.get(dateKey) || {
          label: dueDate.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
          order: dueDate.getTime(),
          tasks: [],
        };
        existing.tasks.push(task);
        grouped.set(dateKey, existing);
      }

      return withCompletedColumn(Array.from(grouped.entries())
        .sort((left, right) => left[1].order - right[1].order)
        .map(([key, value]) => ({
          key: `due-${key}`,
          label: value.label,
          color: '#0ea5e9',
          bg: '#f0f9ff',
          tasks: value.tasks,
        })));
    }

    return withCompletedColumn(STATUS_COLUMNS.map((column) => ({
      key: `status-${column.status}`,
      label: column.label,
      color: column.color,
      bg: column.bg,
      tasks: activeTasks.filter((task) => task.status === column.status),
    })));
  }, [tasks, view?.group_by]);

  const renderCard = useCallback((task: Task) => (
    <TouchableOpacity
      key={task.uid}
      style={{
        backgroundColor: colors.card,
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: task.is_completed ? 0.6 : 1,
      }}
      onPress={() => onTaskPress(task)}
      activeOpacity={0.7}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: colors.text.primary,
          textDecorationLine: task.is_completed ? 'line-through' : 'none',
          marginBottom: 6,
        }}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Priority + Due date row */}
      {(showPriority || showDueDate) && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {showPriority && task.priority > TaskPriority.LOW && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ color: PRIORITY_COLORS[task.priority], fontSize: 10 }}>⚑</Text>
              <Text style={{ color: PRIORITY_COLORS[task.priority], fontSize: 10, fontWeight: '600' }}>
                {task.priority_display}
              </Text>
            </View>
          )}
          {showDueDate && task.due_date && (
            <Text style={{ fontSize: 10, color: task.is_overdue ? '#ef4444' : colors.text.muted }}>
              📅 {new Date(task.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
            </Text>
          )}
        </View>
      )}

      {/* Tags */}
      {showTags && task.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {task.tags.slice(0, 2).map((tag) => (
            <View key={tag.uid} style={{ backgroundColor: tag.color + '20', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: tag.color, fontSize: 10 }}>{tag.name}</Text>
            </View>
          ))}
          {task.tags.length > 2 && (
            <Text style={{ fontSize: 10, color: colors.text.muted }}>+{task.tags.length - 2}</Text>
          )}
        </View>
      )}

      {/* Subtask progress */}
      {task.subtasks_count > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <View style={{ flex: 1, height: 3, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
            <View style={{ width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%`, height: 3, backgroundColor: Colors.primary, borderRadius: 2 }} />
          </View>
          <Text style={{ fontSize: 10, color: colors.text.muted }}>{task.completed_subtasks_count}/{task.subtasks_count}</Text>
        </View>
      )}

      {/* Project */}
      {showProject && task.project && (
        <Text style={{ fontSize: 10, color: colors.text.muted, marginTop: 4 }}>📁 {task.project.name}</Text>
      )}
    </TouchableOpacity>
  ), [onTaskPress]);

  if (tasks.length === 0 && !isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>⊞</Text>
        <Text style={{ color: colors.text.muted, fontSize: 14 }}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 12 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} /> : undefined}
    >
      {columns.map((col) => {
        const colTasks = col.tasks || [];
        return (
          <View key={col.key} style={{ width: 260, backgroundColor: col.bg, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb50' }}>
            {/* Column header */}
            <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb30' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col.color }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text.secondary }}>{col.label}</Text>
                </View>
                <View style={{ backgroundColor: col.color, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>{colTasks.length}</Text>
                </View>
              </View>
            </View>

            {/* Column tasks */}
            <ScrollView style={{ maxHeight: 500 }} contentContainerStyle={{ padding: 10 }} nestedScrollEnabled>
              {colTasks.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Text style={{ color: colors.text.muted, fontSize: 12 }}>暂无任务</Text>
                </View>
              ) : (
                colTasks.map(renderCard)
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
};
