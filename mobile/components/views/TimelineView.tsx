import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import type { Task, TaskView } from '../../shared/types/index';
import { TaskPriority } from '../../shared/types/index';
import { Colors } from '../../constants/theme';

interface TimelineViewProps {
  tasks: Task[];
  view?: TaskView | null;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

const PRIORITY_COLORS: Record<number, string> = {
  [TaskPriority.LOW]: '#94a3b8',
  [TaskPriority.MEDIUM]: '#f59e0b',
  [TaskPriority.HIGH]: '#f97316',
  [TaskPriority.URGENT]: '#ef4444',
};

function formatDateHeader(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.ceil((taskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let relative = '';
  if (diffDays === 0) relative = '今天';
  else if (diffDays === 1) relative = '明天';
  else if (diffDays === -1) relative = '昨天';
  else if (diffDays > 1 && diffDays <= 7) relative = `${diffDays}天后`;
  else if (diffDays < -1 && diffDays >= -7) relative = `${Math.abs(diffDays)}天前`;

  const dateText = date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
  return relative ? `${dateText}（${relative}）` : dateText;
}

function isPastDate(dateString: string): boolean {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  view,
  onTaskPress,
  onRefresh,
  isRefreshing = false,
  emptyMessage = '暂无任务',
}) => {
  const displaySettings = view?.view_settings || {};
  const showProject = displaySettings.show_project ?? true;
  const showPriority = displaySettings.show_priority ?? true;
  const showTags = displaySettings.show_tags ?? true;

  // Group tasks by date, sorted chronologically
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    const tasksWithDates = tasks.filter((t) => t.due_date || t.start_date);

    tasksWithDates.forEach((task) => {
      const date = task.due_date || task.start_date;
      if (date) {
        const dateKey = new Date(date).toDateString();
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(task);
      }
    });

    return Object.entries(groups).sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime());
  }, [tasks]);

  const noDateTasks = useMemo(() => tasks.filter((t) => !t.due_date && !t.start_date), [tasks]);

  if (tasks.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>⟶</Text>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>{emptyMessage}</Text>
      </View>
    );
  }

  if (groupedTasks.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>📅</Text>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>没有设置日期的任务</Text>
        <Text style={{ color: '#d1d5db', fontSize: 12, marginTop: 4 }}>时间线只显示有日期的任务</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 40 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} /> : undefined}
    >
      {/* Timeline */}
      <View style={{ position: 'relative' }}>
        {/* Vertical line */}
        <View style={{ position: 'absolute', left: 15, top: 0, bottom: 0, width: 2, backgroundColor: '#e5e7eb' }} />

        {groupedTasks.map(([dateKey, dateTasks], groupIdx) => {
          const isPast = isPastDate(dateKey);
          return (
            <View key={dateKey} style={{ marginBottom: 24 }}>
              {/* Date header */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                <View style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: isPast ? '#94a3b8' : Colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                }}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>
                    {new Date(dateKey).getDate()}
                  </Text>
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: isPast ? '#9ca3af' : '#111418' }}>
                    {formatDateHeader(dateKey)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#9ca3af' }}>{dateTasks.length} 个任务</Text>
                </View>
              </View>

              {/* Tasks */}
              <View style={{ marginLeft: 44 }}>
                {dateTasks.map((task) => (
                  <TouchableOpacity
                    key={task.uid}
                    style={{
                      backgroundColor: '#fff',
                      borderRadius: 10,
                      padding: 12,
                      marginBottom: 8,
                      borderLeftWidth: 3,
                      borderLeftColor: task.is_overdue && !task.is_completed ? '#ef4444' : PRIORITY_COLORS[task.priority] || '#94a3b8',
                      opacity: task.is_completed ? 0.6 : 1,
                    }}
                    onPress={() => onTaskPress(task)}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                      <Text
                        style={{
                          flex: 1,
                          fontSize: 14,
                          fontWeight: '500',
                          color: '#111418',
                          textDecorationLine: task.is_completed ? 'line-through' : 'none',
                        }}
                        numberOfLines={2}
                      >
                        {task.title}
                      </Text>
                      {task.is_completed && <Text style={{ color: Colors.success, fontSize: 14 }}>✓</Text>}
                      {task.is_overdue && !task.is_completed && (
                        <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}>
                          <Text style={{ color: '#ef4444', fontSize: 9, fontWeight: '600' }}>逾期</Text>
                        </View>
                      )}
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
                      {showProject && task.project && <Text style={{ fontSize: 11, color: '#9ca3af' }}>📁 {task.project.name}</Text>}
                      {showPriority && <Text style={{ fontSize: 11, color: PRIORITY_COLORS[task.priority] }}>⚑ {task.priority_display}</Text>}
                      {task.start_date && (
                        <Text style={{ fontSize: 11, color: '#9ca3af' }}>
                          开始: {new Date(task.start_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                        </Text>
                      )}
                    </View>

                    {showTags && task.tags.length > 0 && (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                        {task.tags.slice(0, 3).map((tag) => (
                          <View key={tag.uid} style={{ backgroundColor: tag.color + '20', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                            <Text style={{ color: tag.color, fontSize: 10 }}>{tag.name}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Stats */}
      <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginTop: 8, flexDirection: 'row', justifyContent: 'space-around' }}>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.primary }}>{groupedTasks.length}</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>时间节点</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: Colors.success }}>{tasks.filter((t) => t.is_completed).length}</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>已完成</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#ef4444' }}>{tasks.filter((t) => t.is_overdue).length}</Text>
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>逾期</Text>
        </View>
      </View>
    </ScrollView>
  );
};
