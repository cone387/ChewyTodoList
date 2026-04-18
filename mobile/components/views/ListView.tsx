import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { Task, TaskView } from '../../shared/types/index';
import { TaskCard } from '../task/TaskCard';
import { useToggleTaskStatus, useDeleteTask } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import { Colors } from '../../constants/theme';

interface ListViewProps {
  tasks: Task[];
  view?: TaskView | null;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

export const ListView: React.FC<ListViewProps> = ({
  tasks,
  view,
  onTaskPress,
  onRefresh,
  isRefreshing = false,
  onLoadMore,
  hasMore = false,
  isLoading = false,
  emptyMessage = '暂无任务',
}) => {
  const toggleStatus = useToggleTaskStatus();
  const deleteTask = useDeleteTask();
  const { showToast } = useToast();
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  const closeSwipeable = (uid: string) => {
    swipeableRefs.current.get(uid)?.close();
  };

  const handleComplete = (task: Task) => {
    closeSwipeable(task.uid);
    toggleStatus.mutate({ task });
    showToast('success', task.is_completed ? '已取消完成' : '已标记完成');
  };

  const handleDelete = async (task: Task) => {
    closeSwipeable(task.uid);
    try {
      await deleteTask.mutateAsync(task.uid);
      showToast('success', '任务已删除');
    } catch {
      showToast('error', '删除失败');
    }
  };

  const renderRightActions = useCallback((task: Task) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'stretch' }}>
        {/* Complete button */}
        <TouchableOpacity
          style={{
            backgroundColor: task.is_completed ? '#f59e0b' : Colors.success,
            justifyContent: 'center',
            alignItems: 'center',
            width: 72,
          }}
          onPress={() => handleComplete(task)}
        >
          <Text style={{ color: '#fff', fontSize: 18 }}>{task.is_completed ? '↩' : '✓'}</Text>
          <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>
            {task.is_completed ? '取消' : '完成'}
          </Text>
        </TouchableOpacity>

        {/* Delete button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#ef4444',
            justifyContent: 'center',
            alignItems: 'center',
            width: 72,
          }}
          onPress={() => handleDelete(task)}
        >
          <Text style={{ color: '#fff', fontSize: 18 }}>🗑</Text>
          <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>删除</Text>
        </TouchableOpacity>
      </View>
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Task }) => (
      <Swipeable
        ref={(ref) => { if (ref) swipeableRefs.current.set(item.uid, ref); }}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        friction={2}
      >
        <View style={{ backgroundColor: '#fff' }}>
          <View style={{ position: 'relative' }}>
            <TaskCard
              task={item}
              cardConfig={view?.card_config}
              onPress={() => onTaskPress(item)}
            />
            {/* Quick complete checkbox */}
            <TouchableOpacity
              style={{ position: 'absolute', left: 16, top: 0, bottom: 0, justifyContent: 'center', width: 24 }}
              onPress={() => toggleStatus.mutate({ task: item })}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: item.is_completed ? Colors.success : '#d1d5db',
                  backgroundColor: item.is_completed ? Colors.success : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.is_completed && (
                  <Text style={{ color: 'white', fontSize: 11, fontWeight: '700' }}>✓</Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Swipeable>
    ),
    [view, onTaskPress, toggleStatus, renderRightActions]
  );

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View style={{ paddingVertical: 16, alignItems: 'center' }}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }, [hasMore]);

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>📋</Text>
        <Text style={{ color: '#9ca3af', fontSize: 16 }}>{emptyMessage}</Text>
      </View>
    );
  }, [isLoading, emptyMessage]);

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.uid}
      renderItem={renderItem}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onRefresh={onRefresh}
      refreshing={isRefreshing}
      onEndReached={hasMore ? onLoadMore : undefined}
      onEndReachedThreshold={0.3}
      contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    />
  );
};
