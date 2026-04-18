import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useNavViews, useViewTasks } from '../../hooks/useViews';
import { useTasks } from '../../hooks/useTasks';
import { ListView } from '../../components/views/ListView';
import { BoardView } from '../../components/views/BoardView';
import { CalendarView } from '../../components/views/CalendarView';
import { TableView } from '../../components/views/TableView';
import { TimelineView } from '../../components/views/TimelineView';
import { GalleryView } from '../../components/views/GalleryView';
import { ProjectSelector } from '../../components/navigation/ProjectSelector';
import { FAB } from '../../components/ui/FAB';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { QuickCreateSheet } from '../../components/task/QuickCreateSheet';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { Task, TaskView } from '../../shared/types/index';
import { Colors } from '../../constants/theme';

const VIEW_TYPE_ICONS: Record<string, string> = {
  list: '☰', board: '⊞', calendar: '📅', table: '⊟', timeline: '⟶', gallery: '⊡',
};

export default function HomePage() {
  const { isOnline } = useNetworkStatus();
  const { data: views = [], isLoading: viewsLoading } = useNavViews();
  const [selectedViewUid, setSelectedViewUid] = useState<string | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<string | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  const { data: taskData, isLoading: tasksLoading, refetch, isRefetching } = useViewTasks(
    currentView?.uid || '',
    projectParam ? { project: projectParam } : undefined
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <OfflineBanner visible={!isOnline} />

      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111418' }}>我的任务</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <TouchableOpacity onPress={() => setShowSearch(!showSearch)}>
              <Text style={{ fontSize: 18, color: showSearch ? Colors.primary : '#6b7280' }}>🔍</Text>
            </TouchableOpacity>
            <ProjectSelector selectedProjectUid={selectedProjectUid} onSelect={setSelectedProjectUid} />
          </View>
        </View>

        {/* Search bar */}
        {showSearch && (
          <View style={{ marginBottom: 8 }}>
            <TextInput
              style={{
                backgroundColor: '#f3f4f6',
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 8,
                fontSize: 14,
                color: '#111418',
              }}
              placeholder="搜索任务..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
          </View>
        )}

        {views.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {views.map((view) => {
              const isActive = view.uid === currentView?.uid;
              return (
                <TouchableOpacity
                  key={view.uid}
                  style={{
                    marginRight: 8,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 16,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 4,
                    backgroundColor: isActive ? '#8b5cf6' : '#f3f4f6',
                  }}
                  onPress={() => setSelectedViewUid(view.uid)}
                >
                  <Text style={{ fontSize: 12, color: isActive ? '#fff' : '#6b7280' }}>
                    {VIEW_TYPE_ICONS[view.view_type] || '☰'}
                  </Text>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: isActive ? '#fff' : '#4b5563' }}>
                    {view.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {debouncedSearch ? (
          /* Search results */
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
    </SafeAreaView>
  );
}
