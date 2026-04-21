import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  SectionList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Task, TaskView, TaskCardConfig, CardFieldConfig } from '../../shared/types/index';
import { DEFAULT_FIELD_CONFIGS, TaskCard } from '../task/TaskCard';
import { EmptyState } from '../ui/EmptyState';
import { useToggleTaskStatus, useDeleteTask } from '../../hooks/useTasks';
import { useToast } from '../../hooks/useToast';
import { Colors } from '../../constants/theme';

// Conditionally import Swipeable only on native
let Swipeable: any = null;
if (Platform.OS !== 'web') {
  try {
    Swipeable = require('react-native-gesture-handler').Swipeable;
  } catch {}
}

interface ListViewProps {
  tasks: Task[];
  view?: TaskView | null;
  groupBy?: string;
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
  groupBy,
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
  const swipeableRefs = useRef<Map<string, any>>(new Map());
  const displaySettings = view?.view_settings || {};

  const effectiveCardConfig = React.useMemo<TaskCardConfig | null | undefined>(() => {
    if (!view) return undefined;

    const baseConfig = view.card_config;
    const baseFieldConfigs = baseConfig?.field_configs?.length ? baseConfig.field_configs : DEFAULT_FIELD_CONFIGS;
    const visibilityMap: Partial<Record<string, boolean>> = {
      project: displaySettings.show_project,
      tags: displaySettings.show_tags,
      due_date: displaySettings.show_due_date,
      priority: displaySettings.show_priority,
      status: false,
    };

    const fieldConfigs: CardFieldConfig[] = baseFieldConfigs.map((fieldConfig) => {
      const controlledVisibility = visibilityMap[fieldConfig.field];
      return {
        ...fieldConfig,
        visible: controlledVisibility ?? fieldConfig.visible,
      };
    });

    return {
      uid: baseConfig?.uid || '__runtime__',
      name: baseConfig?.name || 'Runtime Card Config',
      desc: baseConfig?.desc,
      is_preset: baseConfig?.is_preset || false,
      layout: displaySettings.compact_mode ? 'compact' : (baseConfig?.layout || 'comfortable'),
      style: baseConfig?.style || {},
      field_configs: fieldConfigs,
      sort_order: baseConfig?.sort_order || 0,
      created_at: baseConfig?.created_at || '',
      updated_at: baseConfig?.updated_at || '',
    };
  }, [displaySettings, view]);

  const sections = React.useMemo(() => buildSections(tasks, groupBy), [tasks, groupBy]);
  const useSections = React.useMemo(() => sections.some((section) => section.title), [sections]);

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
          <MaterialCommunityIcons
            name={task.is_completed ? 'undo' : 'check'}
            size={20}
            color="#fff"
          />
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
          <MaterialCommunityIcons name="delete" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 10, marginTop: 2 }}>删除</Text>
        </TouchableOpacity>
      </View>
    );
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: Task }) => {
      const cardContent = (
        <View style={{ backgroundColor: '#fff' }}>
          <View style={{ position: 'relative' }}>
            <TaskCard
              task={item}
              cardConfig={effectiveCardConfig}
              onPress={() => onTaskPress(item)}
              style={{ paddingLeft: 44 }}
            />
            {/* Quick complete checkbox — inside card padding */}
            <TouchableOpacity
              style={{
                position: 'absolute',
                left: 28,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                width: 28,
                alignItems: 'center',
              }}
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
                  <MaterialCommunityIcons name="check" size={12} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          </View>
        </View>
      );

      // On web, skip Swipeable wrapper
      if (Platform.OS === 'web' || !Swipeable) {
        return cardContent;
      }

      return (
        <Swipeable
          ref={(ref: any) => { if (ref) swipeableRefs.current.set(item.uid, ref); }}
          renderRightActions={() => renderRightActions(item)}
          overshootRight={false}
          friction={2}
        >
          {cardContent}
        </Swipeable>
      );
    },
    [effectiveCardConfig, onTaskPress, toggleStatus, renderRightActions]
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
      <EmptyState
        icon="clipboard-text-outline"
        message={emptyMessage}
      />
    );
  }, [isLoading, emptyMessage]);

  const renderSectionHeader = useCallback(({ section }: { section: { title: string; data: Task[] } }) => {
    if (!section.title) return null;

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4, backgroundColor: '#f9fafb' }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#6b7280' }}>{section.title}</Text>
      </View>
    );
  }, []);

  if (useSections) {
    return (
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.uid}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onRefresh={onRefresh}
        refreshing={isRefreshing}
        contentContainerStyle={{ paddingVertical: 8, flexGrow: 1 }}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    );
  }

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

function buildSections(tasks: Task[], groupBy?: string) {
  const activeTasks = tasks.filter((task) => !task.is_completed);
  const completedTasks = tasks.filter((task) => task.is_completed);

  if (!groupBy) {
    const sections: Array<{ title: string; data: Task[] }> = [];
    if (activeTasks.length > 0) sections.push({ title: completedTasks.length > 0 ? '进行中' : '', data: activeTasks });
    if (completedTasks.length > 0) sections.push({ title: '已完成', data: completedTasks });
    return sections.length > 0 ? sections : [{ title: '', data: [] }];
  }

  const grouped = new Map<string, Task[]>();

  for (const task of activeTasks) {
    const title = getGroupTitle(task, groupBy);
    const existing = grouped.get(title) || [];
    existing.push(task);
    grouped.set(title, existing);
  }

  const sections = Array.from(grouped.entries()).map(([title, data]) => ({ title, data }));
  if (completedTasks.length > 0) {
    sections.push({ title: '已完成', data: completedTasks });
  }
  return sections;
}

function getGroupTitle(task: Task, groupBy: string) {
  switch (groupBy) {
    case 'status':
      return task.status_display;
    case 'priority':
      return task.priority_display;
    case 'project':
      return task.project?.name || '收集箱';
    case 'due_date': {
      if (!task.due_date) return '未设置截止日期';
      const date = new Date(task.due_date);
      return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    }
    default:
      return '未分组';
  }
}
