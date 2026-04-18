import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import type { Task, TaskView } from '../../shared/types/index';
import { TaskPriority } from '../../shared/types/index';
import { Colors } from '../../constants/theme';

interface GalleryViewProps {
  tasks: Task[];
  view?: TaskView | null;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

const GRADIENT_COLORS = [
  ['#3b82f6', '#1d4ed8'],
  ['#22c55e', '#15803d'],
  ['#8b5cf6', '#6d28d9'],
  ['#ec4899', '#be185d'],
  ['#f59e0b', '#d97706'],
  ['#6366f1', '#4338ca'],
  ['#ef4444', '#dc2626'],
  ['#14b8a6', '#0d9488'],
];

const PRIORITY_LABELS: Record<number, string> = {
  [TaskPriority.LOW]: '低',
  [TaskPriority.MEDIUM]: '中',
  [TaskPriority.HIGH]: '高',
  [TaskPriority.URGENT]: '紧急',
};

function getTaskColor(title: string): string[] {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash = hash & hash;
  }
  return GRADIENT_COLORS[Math.abs(hash) % GRADIENT_COLORS.length];
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  tasks,
  view,
  onTaskPress,
  onRefresh,
  isRefreshing = false,
  emptyMessage = '暂无任务',
}) => {
  const renderCard = useCallback(({ item, index }: { item: Task; index: number }) => {
    const colors = getTaskColor(item.title);
    const isLeft = index % 2 === 0;

    return (
      <TouchableOpacity
        style={{
          flex: 1,
          marginLeft: isLeft ? 0 : 4,
          marginRight: isLeft ? 4 : 0,
          marginBottom: 8,
          borderRadius: 14,
          overflow: 'hidden',
          height: 160,
          opacity: item.is_completed ? 0.6 : 1,
        }}
        onPress={() => onTaskPress(item)}
        activeOpacity={0.8}
      >
        {/* Background gradient */}
        <View style={{ flex: 1, backgroundColor: colors[0], padding: 14, justifyContent: 'space-between' }}>
          {/* Top row: status + priority */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {item.is_completed && (
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>✓</Text>
                </View>
              )}
              {item.is_overdue && !item.is_completed && (
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.5)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 10 }}>!</Text>
                </View>
              )}
            </View>
            {item.priority > TaskPriority.LOW && (
              <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{PRIORITY_LABELS[item.priority]}</Text>
              </View>
            )}
          </View>

          {/* Bottom: title + meta */}
          <View>
            <Text
              style={{
                color: '#fff',
                fontSize: 14,
                fontWeight: '600',
                lineHeight: 20,
                textDecorationLine: item.is_completed ? 'line-through' : 'none',
              }}
              numberOfLines={3}
            >
              {item.title}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
              {item.project && (
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 10 }} numberOfLines={1}>
                  📁 {item.project.name}
                </Text>
              )}
              {item.due_date && (
                <Text style={{ color: item.is_overdue ? '#fca5a5' : 'rgba(255,255,255,0.8)', fontSize: 10 }}>
                  📅 {new Date(item.due_date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </Text>
              )}
            </View>

            {/* Tags */}
            {item.tags.length > 0 && (
              <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                {item.tags.slice(0, 2).map((tag) => (
                  <View key={tag.uid} style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 1 }}>
                    <Text style={{ color: '#fff', fontSize: 9 }}>{tag.name}</Text>
                  </View>
                ))}
                {item.tags.length > 2 && (
                  <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9 }}>+{item.tags.length - 2}</Text>
                )}
              </View>
            )}

            {/* Subtask progress */}
            {item.subtasks_count > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                <View style={{ flex: 1, height: 2, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 1 }}>
                  <View style={{ width: `${(item.completed_subtasks_count / item.subtasks_count) * 100}%`, height: 2, backgroundColor: '#fff', borderRadius: 1 }} />
                </View>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>
                  {item.completed_subtasks_count}/{item.subtasks_count}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [onTaskPress]);

  if (tasks.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
        <Text style={{ fontSize: 36, marginBottom: 8 }}>⊡</Text>
        <Text style={{ color: '#9ca3af', fontSize: 14 }}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.uid}
      renderItem={renderCard}
      numColumns={2}
      contentContainerStyle={{ padding: 12 }}
      refreshControl={onRefresh ? <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} /> : undefined}
      ListFooterComponent={
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 4, flexDirection: 'row', justifyContent: 'space-around' }}>
          <Text style={{ fontSize: 11, color: '#6b7280' }}>共 {tasks.length}</Text>
          <Text style={{ fontSize: 11, color: Colors.success }}>完成 {tasks.filter((t) => t.is_completed).length}</Text>
          <Text style={{ fontSize: 11, color: '#3b82f6' }}>进行 {tasks.filter((t) => !t.is_completed).length}</Text>
          <Text style={{ fontSize: 11, color: '#ef4444' }}>逾期 {tasks.filter((t) => t.is_overdue).length}</Text>
        </View>
      }
    />
  );
};
