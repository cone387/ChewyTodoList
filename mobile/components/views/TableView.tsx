import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import type { Task, TaskView } from '../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../shared/types/index';
import { Colors } from '../../constants/theme';

interface TableViewProps {
  tasks: Task[];
  view?: TaskView | null;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

const STATUS_LABELS: Record<number, { label: string; color: string }> = {
  [TaskStatus.UNASSIGNED]: { label: '待分配', color: '#94a3b8' },
  [TaskStatus.TODO]: { label: '待办', color: '#3b82f6' },
  [TaskStatus.COMPLETED]: { label: '已完成', color: '#22c55e' },
  [TaskStatus.ABANDONED]: { label: '已放弃', color: '#ef4444' },
};

const PRIORITY_LABELS: Record<number, { label: string; color: string }> = {
  [TaskPriority.LOW]: { label: '低', color: '#94a3b8' },
  [TaskPriority.MEDIUM]: { label: '中', color: '#f59e0b' },
  [TaskPriority.HIGH]: { label: '高', color: '#f97316' },
  [TaskPriority.URGENT]: { label: '紧急', color: '#ef4444' },
};

const COL_WIDTHS = { title: 180, status: 70, priority: 60, project: 100, dueDate: 90, tags: 120 };

export const TableView: React.FC<TableViewProps> = ({
  tasks,
  view,
  onTaskPress,
  onRefresh,
  isRefreshing = false,
  emptyMessage = '暂无任务',
}) => {
  const displaySettings = view?.view_settings || {};

  const columns = useMemo(() => {
    const next = [{ key: 'title', label: '标题', width: COL_WIDTHS.title }];

    if (displaySettings.show_status ?? true) next.push({ key: 'status', label: '状态', width: COL_WIDTHS.status });
    if (displaySettings.show_priority ?? true) next.push({ key: 'priority', label: '优先级', width: COL_WIDTHS.priority });
    if (displaySettings.show_project ?? true) next.push({ key: 'project', label: '项目', width: COL_WIDTHS.project });
    if (displaySettings.show_due_date ?? true) next.push({ key: 'dueDate', label: '截止', width: COL_WIDTHS.dueDate });
    if (displaySettings.show_tags ?? true) next.push({ key: 'tags', label: '标签', width: COL_WIDTHS.tags });

    return next;
  }, [displaySettings]);

  const renderRow = useCallback(({ item }: { item: Task }) => {
    const status = STATUS_LABELS[item.status] || STATUS_LABELS[TaskStatus.TODO];
    const priority = PRIORITY_LABELS[item.priority] || PRIORITY_LABELS[TaskPriority.MEDIUM];

    return (
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#f3f4f6',
          backgroundColor: '#fff',
          opacity: item.is_completed ? 0.6 : 1,
        }}
        onPress={() => onTaskPress(item)}
      >
        {columns.map((column) => {
          switch (column.key) {
            case 'title':
              return (
                <View key={column.key} style={{ width: column.width, paddingHorizontal: 12, paddingVertical: 12 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '500',
                      color: '#111418',
                      textDecorationLine: item.is_completed ? 'line-through' : 'none',
                    }}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                </View>
              );
            case 'status':
              return (
                <View key={column.key} style={{ width: column.width, alignItems: 'center', paddingVertical: 12 }}>
                  <View style={{ backgroundColor: status.color + '18', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                    <Text style={{ color: status.color, fontSize: 10, fontWeight: '600' }}>{status.label}</Text>
                  </View>
                </View>
              );
            case 'priority':
              return (
                <View key={column.key} style={{ width: column.width, alignItems: 'center', paddingVertical: 12 }}>
                  <Text style={{ color: priority.color, fontSize: 12, fontWeight: '600' }}>⚑ {priority.label}</Text>
                </View>
              );
            case 'project':
              return (
                <View key={column.key} style={{ width: column.width, paddingHorizontal: 8, paddingVertical: 12 }}>
                  <Text style={{ fontSize: 11, color: '#6b7280' }} numberOfLines={1}>
                    {item.project?.name || '收集箱'}
                  </Text>
                </View>
              );
            case 'dueDate':
              return (
                <View key={column.key} style={{ width: column.width, paddingHorizontal: 8, paddingVertical: 12 }}>
                  {item.due_date ? (
                    <Text style={{ fontSize: 11, color: item.is_overdue ? '#ef4444' : '#6b7280' }}>
                      {new Date(item.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                    </Text>
                  ) : (
                    <Text style={{ fontSize: 11, color: '#d1d5db' }}>-</Text>
                  )}
                </View>
              );
            case 'tags':
              return (
                <View key={column.key} style={{ width: column.width, paddingHorizontal: 8, paddingVertical: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 3 }}>
                  {item.tags.slice(0, 2).map((tag) => (
                    <View key={tag.uid} style={{ backgroundColor: tag.color + '20', borderRadius: 6, paddingHorizontal: 4, paddingVertical: 1 }}>
                      <Text style={{ color: tag.color, fontSize: 9 }}>{tag.name}</Text>
                    </View>
                  ))}
                  {item.tags.length > 2 && <Text style={{ fontSize: 9, color: '#9ca3af' }}>+{item.tags.length - 2}</Text>}
                </View>
              );
            default:
              return null;
          }
        })}
      </TouchableOpacity>
    );
  }, [columns, onTaskPress]);

  if (tasks.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>⊟</Text>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>{emptyMessage}</Text>
      </View>
    );
  }

  const totalWidth = columns.reduce((sum, column) => sum + column.width, 0);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
      <View style={{ width: totalWidth }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f9fafb', borderBottomWidth: 2, borderBottomColor: '#e5e7eb' }}>
          {columns.map((column) => (
            <View
              key={column.key}
              style={{
                width: column.width,
                alignItems: column.key === 'title' || column.key === 'project' || column.key === 'dueDate' || column.key === 'tags' ? 'flex-start' : 'center',
                paddingHorizontal: column.key === 'title' ? 12 : 8,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>{column.label}</Text>
            </View>
          ))}
        </View>

        {/* Rows */}
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.uid}
          renderItem={renderRow}
          refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} /> : undefined}
        />

        {/* Footer stats */}
        <View style={{ flexDirection: 'row', backgroundColor: '#f9fafb', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#e5e7eb' }}>
          <Text style={{ fontSize: 11, color: '#6b7280' }}>
            共 {tasks.length} 个任务 · 已完成 {tasks.filter((t) => t.is_completed).length} · 逾期 {tasks.filter((t) => t.is_overdue).length}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};
