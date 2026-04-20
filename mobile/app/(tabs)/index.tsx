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
import { useNavViews, useViewTasks } from '../../hooks/useViews';
import { useTasks } from '../../hooks/useTasks';
import { ListView } from '../../components/views/ListView';
import { BoardView } from '../../components/views/BoardView';
import { CalendarView } from '../../components/views/CalendarView';
import { TableView } from '../../components/views/TableView';
import { TimelineView } from '../../components/views/TimelineView';
import { GalleryView } from '../../components/views/GalleryView';
import { ProjectSelector } from '../../components/navigation/ProjectSelector';
import { FilterBar, FilterModal, type FilterState } from '../../components/navigation/FilterBar';
import { FAB } from '../../components/ui/FAB';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { QuickCreateSheet } from '../../components/task/QuickCreateSheet';
import { SkeletonCard } from '../../components/ui/SkeletonLoader';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { Task, TaskView } from '../../shared/types/index';
import { Colors } from '../../constants/theme';
import { ViewTypeIcons } from '../../constants/icons';

export default function HomePage() {
  const { isOnline } = useNetworkStatus();
  const { data: views = [], isLoading: viewsLoading } = useNavViews();
  const [selectedViewUid, setSelectedViewUid] = useState<string | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<string | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filters, setFilters] = useState<FilterState>({ status: null, priority: null });
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const activeFilterCount = (filters.status != null ? 1 : 0) + (filters.priority != null ? 1 : 0);

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

  const projectParam =
    currentView?.follow_selected_project !== false ? selectedProjectUid : currentView?.project?.uid || null;

  // Build query params including filters
  const viewQueryParams: Record<string, any> = {};
  if (projectParam) viewQueryParams.project = projectParam;
  if (filters.status != null) viewQueryParams.status = filters.status;
  if (filters.priority != null) viewQueryParams.priority = filters.priority;

  const { data: taskData, isLoading: tasksLoading, refetch, isRefetching } = useViewTasks(
    currentView?.uid || '',
    Object.keys(viewQueryParams).length > 0 ? viewQueryParams : undefined
  );

  const tasks = taskData?.results || [];

  const handleTaskPress = useCallback((task: Task) => {
    router.push(`/task/${task.uid}`);
  }, []);

  const viewProps = {
    tasks,
    view: currentView,
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
        return <ListView {...viewProps} />;
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
              onPress={() => setShowFilterSheet(true)}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 4,
                paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16,
                backgroundColor: activeFilterCount > 0 ? Colors.primary + '14' : '#f3f4f6',
              }}
            >
              <MaterialCommunityIcons name="filter-variant" size={16} color={activeFilterCount > 0 ? Colors.primary : '#6b7280'} />
              {activeFilterCount > 0 && (
                <Text style={{ fontSize: 12, fontWeight: '600', color: Colors.primary }}>{activeFilterCount}</Text>
              )}
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
      </View>

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <FilterBar filters={filters} onChange={setFilters} />
      )}

      <View style={{ flex: 1 }}>
        {debouncedSearch ? (
          <ListView
            tasks={searchResults}
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
      <FilterModal
        visible={showFilterSheet}
        filters={filters}
        onChange={setFilters}
        onClose={() => setShowFilterSheet(false)}
      />
    </SafeAreaView>
  );
}
