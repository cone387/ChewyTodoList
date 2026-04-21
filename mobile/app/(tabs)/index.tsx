import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavViews, useUpdateView, useViewTasks } from '../../hooks/useViews';
import { useTasks } from '../../hooks/useTasks';
import { ListView } from '../../components/views/ListView';
import { BoardView } from '../../components/views/BoardView';
import { CalendarView } from '../../components/views/CalendarView';
import { TableView } from '../../components/views/TableView';
import { TimelineView } from '../../components/views/TimelineView';
import { GalleryView } from '../../components/views/GalleryView';
import { ProjectSelector } from '../../components/navigation/ProjectSelector';
import {
  DEFAULT_DISPLAY_SETTINGS,
  HomeFilterBar,
  hasActiveFilterBarSettings,
  type DisplaySettings,
} from '../../components/navigation/FilterBar';
import { FAB } from '../../components/ui/FAB';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { QuickCreateSheet } from '../../components/task/QuickCreateSheet';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { Task, TaskView, ViewSort } from '../../shared/types/index';
import { Colors } from '../../constants/theme';
import { ViewTypeIcons } from '../../constants/icons';

export default function HomePage() {
  const { isOnline } = useNetworkStatus();
  const { data: views = [], isLoading: viewsLoading } = useNavViews();
  const [selectedViewUid, setSelectedViewUid] = useState<string | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<string | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [localSorts, setLocalSorts] = useState<ViewSort[]>([]);
  const [localGroupBy, setLocalGroupBy] = useState('');
  const [displaySettings, setDisplaySettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);
  const updateView = useUpdateView();

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchData, isLoading: searchLoading } = useTasks(
    debouncedSearch ? { search: debouncedSearch } : undefined
  );
  const searchResults = debouncedSearch ? (searchData?.results || []) : [];

  const currentView: TaskView | undefined =
    views.find((v) => v.uid === selectedViewUid) || views[0];

  useEffect(() => {
    if (!currentView) return;

    setLocalSorts(currentView.sorts || []);
    setLocalGroupBy(currentView.group_by || '');
    setDisplaySettings({
      show_completed: currentView.view_settings?.show_completed ?? DEFAULT_DISPLAY_SETTINGS.show_completed,
      show_project: currentView.view_settings?.show_project ?? DEFAULT_DISPLAY_SETTINGS.show_project,
      show_tags: currentView.view_settings?.show_tags ?? DEFAULT_DISPLAY_SETTINGS.show_tags,
      show_due_date: currentView.view_settings?.show_due_date ?? DEFAULT_DISPLAY_SETTINGS.show_due_date,
      show_priority: currentView.view_settings?.show_priority ?? DEFAULT_DISPLAY_SETTINGS.show_priority,
      compact_mode: currentView.view_settings?.compact_mode ?? DEFAULT_DISPLAY_SETTINGS.compact_mode,
    });
  }, [currentView]);

  const projectParam =
    currentView?.follow_selected_project !== false ? selectedProjectUid : currentView?.project?.uid || null;

  // Build query params including project filter
  const viewQueryParams: Record<string, any> = {};
  if (projectParam) viewQueryParams.project = projectParam;

  const { data: taskData, isLoading: tasksLoading, refetch, isRefetching } = useViewTasks(
    currentView?.uid || '',
    Object.keys(viewQueryParams).length > 0 ? viewQueryParams : undefined
  );

  const sortField = localSorts[0]?.field || '';
  const sortDirection = localSorts[0]?.direction || 'desc';
  const hasActiveViewControls = hasActiveFilterBarSettings(sortField, localGroupBy, displaySettings);

  const applyClientSideTaskTransforms = useCallback((inputTasks: Task[]) => {
    let nextTasks = [...inputTasks];

    if (!displaySettings.show_completed) {
      nextTasks = nextTasks.filter((task) => !task.is_completed);
    }

    if (!sortField) {
      return nextTasks;
    }

    nextTasks.sort((left, right) => {
      const leftValue = getComparableTaskValue(left, sortField);
      const rightValue = getComparableTaskValue(right, sortField);

      if (leftValue < rightValue) return sortDirection === 'asc' ? -1 : 1;
      if (leftValue > rightValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return nextTasks;
  }, [displaySettings.show_completed, sortDirection, sortField]);

  const tasks = applyClientSideTaskTransforms(taskData?.results || []);

  const effectiveView = currentView ? {
    ...currentView,
    sorts: localSorts,
    group_by: localGroupBy || undefined,
    view_settings: {
      ...currentView.view_settings,
      ...displaySettings,
    },
  } : undefined;

  const handleTaskPress = useCallback((task: Task) => {
    router.push(`/task/${task.uid}`);
  }, []);

  const persistViewPatch = useCallback((patch: Partial<TaskView>) => {
    if (!currentView) return;
    updateView.mutate({ uid: currentView.uid, data: patch });
  }, [currentView, updateView]);

  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    const nextSorts = field ? [{ field, direction }] : [];
    setLocalSorts(nextSorts);
    persistViewPatch({ sorts: nextSorts });
  }, [persistViewPatch]);

  const handleGroupByChange = useCallback((field: string) => {
    setLocalGroupBy(field);
    persistViewPatch({ group_by: field || undefined });
  }, [persistViewPatch]);

  const handleDisplaySettingsChange = useCallback((patch: Partial<DisplaySettings>) => {
    setDisplaySettings((prev) => {
      const next = { ...prev, ...patch };
      persistViewPatch({ view_settings: { ...(currentView?.view_settings || {}), ...next } });
      return next;
    });
  }, [currentView, persistViewPatch]);

  const viewProps = {
    tasks,
    view: effectiveView,
    onTaskPress: handleTaskPress,
    onRefresh: () => refetch(),
    isRefreshing: isRefetching,
    isLoading: tasksLoading,
    emptyMessage: '这个视图暂无任务',
  };

  const renderViewContent = () => {
    if (!currentView) return null;
    switch (currentView.view_type) {
      case 'board':
        return <BoardView {...viewProps} />;
      case 'calendar':
        return <CalendarView {...viewProps} />;
      case 'table':
        return <TableView {...viewProps} />;
      case 'timeline':
        return <TimelineView {...viewProps} />;
      case 'gallery':
        return <GalleryView {...viewProps} />;
      case 'list':
      default:
        return <ListView {...viewProps} groupBy={localGroupBy} />;
    }
  };

  if (viewsLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        <View style={{ paddingTop: 60 }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <OfflineBanner visible={!isOnline} />

      <View style={{ backgroundColor: '#fff', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        {/* Row 1: Project dropdown centered */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 12, marginBottom: 10, position: 'relative' }}>
          <ProjectSelector selectedProjectUid={selectedProjectUid} onSelect={setSelectedProjectUid} />
          {/* Search toggle — absolute right */}
          <TouchableOpacity
            onPress={() => setShowSearch(!showSearch)}
            style={{ position: 'absolute', right: 16, padding: 6 }}
          >
            <MaterialCommunityIcons name={showSearch ? 'close' : 'magnify'} size={22} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Search bar — only when toggled */}
        {showSearch && (
          <View style={{
            flexDirection: 'row', alignItems: 'center',
            backgroundColor: '#f3f4f6', borderRadius: 10,
            paddingHorizontal: 12, height: 38,
            marginHorizontal: 16, marginBottom: 10,
          }}>
            <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" />
            <TextInput
              style={{ flex: 1, fontSize: 14, color: '#111418', paddingVertical: 0, marginLeft: 8 }}
              placeholder="搜索任务..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {/* View tabs + fixed right buttons */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 4 }}>
          {views.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }} contentContainerStyle={{ paddingLeft: 16, paddingRight: 4, paddingVertical: 2 }}>
              {views.map((view) => {
                const isActive = view.uid === currentView?.uid;
                const iconName = ViewTypeIcons[view.view_type] || 'format-list-bulleted';
                return (
                  <TouchableOpacity
                    key={view.uid}
                    style={{
                      marginRight: 8,
                      paddingHorizontal: 12, paddingVertical: 6,
                      borderRadius: 16,
                      flexDirection: 'row', alignItems: 'center', gap: 4,
                      backgroundColor: isActive ? Colors.primary : '#f3f4f6',
                    }}
                    onPress={() => setSelectedViewUid(view.uid)}
                  >
                    <MaterialCommunityIcons name={iconName} size={14} color={isActive ? '#fff' : '#6b7280'} />
                    <Text style={{
                      fontSize: 14,
                      fontWeight: isActive ? '700' : '500',
                      color: isActive ? '#fff' : '#4b5563',
                    }}>
                      {view.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={{ flex: 1 }} />
          )}
          {/* Fixed right: filter + manage views */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 }}>
            <TouchableOpacity
              onPress={() => setShowFilterBar((prev) => !prev)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
                backgroundColor: showFilterBar || hasActiveViewControls ? Colors.primary + '14' : '#f3f4f6',
              }}
            >
              <MaterialCommunityIcons name="filter-variant" size={16} color={showFilterBar || hasActiveViewControls ? Colors.primary : '#6b7280'} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/views' as any)}
              style={{
                paddingHorizontal: 8, paddingVertical: 6, borderRadius: 16,
                backgroundColor: '#f3f4f6',
              }}
            >
              <MaterialCommunityIcons name="cog-outline" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        <HomeFilterBar
          visible={showFilterBar}
          sortField={sortField}
          sortDirection={sortDirection}
          groupBy={localGroupBy}
          displaySettings={displaySettings}
          onSortChange={handleSortChange}
          onGroupByChange={handleGroupByChange}
          onDisplaySettingsChange={handleDisplaySettingsChange}
        />
      </View>

      <View style={{ flex: 1 }}>
        {debouncedSearch ? (
          <ListView
            tasks={applyClientSideTaskTransforms(searchResults)}
            view={effectiveView}
            groupBy={localGroupBy}
            onTaskPress={handleTaskPress}
            isLoading={searchLoading}
            emptyMessage={`未找到"${debouncedSearch}"相关任务`}
          />
        ) : currentView ? (
          renderViewContent()
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>暂无视图</Text>
          </View>
        )}
      </View>

      <FAB onPress={() => setShowCreateSheet(true)} />
      <QuickCreateSheet
        visible={showCreateSheet}
        onClose={() => setShowCreateSheet(false)}
        defaultProjectUid={selectedProjectUid}
      />
    </SafeAreaView>
  );
}

function getComparableTaskValue(task: Task, field: string) {
  switch (field) {
    case 'created_at':
    case 'updated_at':
    case 'due_date':
    case 'start_date':
      return task[field] ? new Date(task[field] as string).getTime() : 0;
    case 'priority':
    case 'status':
      return task[field] ?? 0;
    case 'title':
      return task.title?.toLowerCase() || '';
    case 'sort_order':
      return 0;
    default:
      return String(task[field as keyof Task] ?? '');
  }
}
