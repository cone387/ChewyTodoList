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

const COLUMNS = [
  { status: TaskStatus.UNASSIGNED, label: '待分配', color: Colors.status.unassigned, bg: '#f8fafc' },
  { status: TaskStatus.TODO, label: '待办', color: Colors.status.todo, bg: '#eff6ff' },
  { status: TaskStatus.COMPLETED, label: '已完成', color: Colors.status.completed, bg: '#f0fdf4' },
  { status: TaskStatus.ABANDONED, label: '已放弃', color: Colors.status.abandoned, bg: '#fef2f2' },
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
  const groupedTasks = useMemo(() => {
    const groups: Record<number, Task[]> = {};
    COLUMNS.forEach((col) => { groups[col.status] = []; });
    tasks.forEach((task) => {
      if (groups[task.status]) groups[task.status].push(task);
    });
    return groups;
  }, [tasks]);

  const renderCard = useCallback((task: Task) => (
    <TouchableOpacity
      key={task.uid}
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        opacity: task.is_completed ? 0.6 : 1,
      }}
      onPress={() => onTaskPress(task)}
      activeOpacity={0.7}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: '500',
          color: '#111418',
          textDecorationLine: task.is_completed ? 'line-through' : 'none',
          marginBottom: 6,
        }}
        numberOfLines={2}
      >
        {task.title}
      </Text>

      {/* Priority + Due date row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {task.priority > TaskPriority.LOW && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ color: PRIORITY_COLORS[task.priority], fontSize: 10 }}>⚑</Text>
            <Text style={{ color: PRIORITY_COLORS[task.priority], fontSize: 10, fontWeight: '600' }}>
              {task.priority_display}
            </Text>
          </View>
        )}
        {task.due_date && (
          <Text style={{ fontSize: 10, color: task.is_overdue ? '#ef4444' : '#9ca3af' }}>
            📅 {new Date(task.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </Text>
        )}
      </View>

      {/* Tags */}
      {task.tags.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
          {task.tags.slice(0, 2).map((tag) => (
            <View key={tag.uid} style={{ backgroundColor: tag.color + '20', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
              <Text style={{ color: tag.color, fontSize: 10 }}>{tag.name}</Text>
            </View>
          ))}
          {task.tags.length > 2 && (
            <Text style={{ fontSize: 10, color: '#9ca3af' }}>+{task.tags.length - 2}</Text>
          )}
        </View>
      )}

      {/* Subtask progress */}
      {task.subtasks_count > 0 && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
          <View style={{ flex: 1, height: 3, backgroundColor: '#e5e7eb', borderRadius: 2 }}>
            <View style={{ width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%`, height: 3, backgroundColor: Colors.primary, borderRadius: 2 }} />
          </View>
          <Text style={{ fontSize: 10, color: '#9ca3af' }}>{task.completed_subtasks_count}/{task.subtasks_count}</Text>
        </View>
      )}

      {/* Project */}
      {task.project && (
        <Text style={{ fontSize: 10, color: '#9ca3af', marginTop: 4 }}>📁 {task.project.name}</Text>
      )}
    </TouchableOpacity>
  ), [onTaskPress]);

  if (tasks.length === 0 && !isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>⊞</Text>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>{emptyMessage}</Text>
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
      {COLUMNS.map((col) => {
        const colTasks = groupedTasks[col.status] || [];
        return (
          <View key={col.status} style={{ width: 260, backgroundColor: col.bg, borderRadius: 14, borderWidth: 1, borderColor: '#e5e7eb50' }}>
            {/* Column header */}
            <View style={{ paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb30' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: col.color }} />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>{col.label}</Text>
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
                  <Text style={{ color: '#d1d5db', fontSize: 12 }}>暂无任务</Text>
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
