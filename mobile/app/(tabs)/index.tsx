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

      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        {/* Row 1: Title + Project Selector */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111418' }}>我的任务</Text>
          <ProjectSelector selectedProjectUid={selectedProjectUid} onSelect={setSelectedProjectUid} />
        </View>

        {/* Row 2: Search bar (always visible, compact) */}
        <TouchableOpacity
          onPress={() => setShowSearch(!showSearch)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f3f4f6',
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginBottom: 10,
            gap: 8,
          }}
        >
          <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" />
          {showSearch ? (
            <TextInput
              style={{ flex: 1, fontSize: 14, color: '#111418', paddingVertical: 0 }}
              placeholder="搜索任务..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
          ) : (
            <Text style={{ flex: 1, fontSize: 14, color: '#9ca3af' }}>搜索任务...</Text>
          )}
          {showSearch && searchQuery ? (
            <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSearch(false); }}>
              <MaterialCommunityIcons name="close" size={16} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </TouchableOpacity>

        {views.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {views.map((view) => {
              const isActive = view.uid === currentView?.uid;
              const iconName = ViewTypeIcons[view.view_type] || 'format-list-bulleted';
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
                    backgroundColor: isActive ? Colors.primary : '#f3f4f6',
                  }}
                  onPress={() => setSelectedViewUid(view.uid)}
                >
                  <MaterialCommunityIcons
                    name={iconName}
                    size={14}
                    color={isActive ? '#fff' : '#6b7280'}
                  />
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
