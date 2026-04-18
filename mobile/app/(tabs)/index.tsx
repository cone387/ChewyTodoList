import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useNavViews, useViewTasks } from '../../hooks/useViews';
import { ListView } from '../../components/views/ListView';
import { ProjectSelector } from '../../components/navigation/ProjectSelector';
import { FAB } from '../../components/ui/FAB';
import { OfflineBanner } from '../../components/ui/OfflineBanner';
import { QuickCreateSheet } from '../../components/task/QuickCreateSheet';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import type { Task, TaskView } from '../../shared/types/index';

const VIEW_TYPE_ICONS: Record<string, string> = {
  list: '☰', board: '⊞', calendar: '📅', table: '⊟', timeline: '⟶', gallery: '⊡',
};

export default function HomePage() {
  const { isOnline } = useNetworkStatus();
  const { data: views = [], isLoading: viewsLoading } = useNavViews();
  const [selectedViewUid, setSelectedViewUid] = useState<string | null>(null);
  const [selectedProjectUid, setSelectedProjectUid] = useState<string | null>(null);
  const [showCreateSheet, setShowCreateSheet] = useState(false);

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
          <ProjectSelector selectedProjectUid={selectedProjectUid} onSelect={setSelectedProjectUid} />
        </View>

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
        {currentView ? (
          <ListView
            tasks={tasks}
            view={currentView}
            onTaskPress={handleTaskPress}
            onRefresh={() => refetch()}
            isRefreshing={isRefetching}
            isLoading={tasksLoading}
            emptyMessage="这个视图暂无任务"
          />
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
