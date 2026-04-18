import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useViews, useDeleteView, useDuplicateView } from '../../../hooks/useViews';
import { viewApi } from '../../../shared/services/api';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import type { TaskView } from '../../../shared/types/index';
import { useQueryClient } from '@tanstack/react-query';

const VIEW_TYPE_ICONS: Record<string, string> = {
  list: '☰', board: '⊞', calendar: '📅', table: '⊟', timeline: '⟶', gallery: '⊡',
};

const VIEW_TYPE_LABELS: Record<string, string> = {
  list: '列表', board: '看板', calendar: '日历', table: '表格', timeline: '时间线', gallery: '画廊',
};

export default function ViewsPage() {
  const { data: viewsData, isLoading } = useViews();
  const deleteView = useDeleteView();
  const duplicateView = useDuplicateView();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const views: TaskView[] = (viewsData as TaskView[]) || [];

  const [selectedView, setSelectedView] = useState<TaskView | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDuplicate = async () => {
    if (!selectedView) return;
    try {
      await duplicateView.mutateAsync(selectedView.uid);
      showToast('success', '视图已复制');
    } catch {
      showToast('error', '复制失败');
    }
  };

  const handleToggleNav = async (view: TaskView) => {
    try {
      await viewApi.updateView(view.uid, { is_visible_in_nav: !view.is_visible_in_nav });
      queryClient.invalidateQueries({ queryKey: ['views'] });
      showToast('success', view.is_visible_in_nav ? '已从导航栏隐藏' : '已显示在导航栏');
    } catch {
      showToast('error', '操作失败');
    }
  };

  const handleDelete = async () => {
    if (!selectedView) return;
    try {
      await deleteView.mutateAsync(selectedView.uid);
      showToast('success', '视图已删除');
    } catch {
      showToast('error', '删除失败');
    }
    setShowDeleteConfirm(false);
    setSelectedView(null);
  };

  // Separate system views and user views
  const systemViews = views.filter((v) => v.is_system);
  const userViews = views.filter((v) => !v.is_system);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#111418' }}>视图</Text>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/views/templates' as any)}>
            <Text style={{ color: Colors.primary, fontSize: 14 }}>🏪 广场</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/views/create' as any)}>
            <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>+ 新建</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* User views */}
          {userViews.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                自定义视图
              </Text>
              <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                {userViews.map((view, idx) => (
                  <TouchableOpacity
                    key={view.uid}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: idx < userViews.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                    }}
                    onPress={() => { setSelectedView(view); setShowActions(true); }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>{VIEW_TYPE_ICONS[view.view_type] || '☰'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '500', color: '#111418' }}>{view.name}</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {VIEW_TYPE_LABELS[view.view_type] || view.view_type}
                        {view.project ? ` · ${view.project.name}` : ''}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {view.is_visible_in_nav && (
                        <View style={{ backgroundColor: '#f3f0ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '600' }}>导航栏</Text>
                        </View>
                      )}
                      <Text style={{ color: '#d1d5db' }}>›</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* System views */}
          {systemViews.length > 0 && (
            <View style={{ marginTop: 16 }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#9ca3af', paddingHorizontal: 16, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                系统视图
              </Text>
              <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                {systemViews.map((view, idx) => (
                  <TouchableOpacity
                    key={view.uid}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      borderBottomWidth: idx < systemViews.length - 1 ? 1 : 0,
                      borderBottomColor: '#f3f4f6',
                    }}
                    onPress={() => { setSelectedView(view); setShowActions(true); }}
                  >
                    <Text style={{ fontSize: 20, marginRight: 12 }}>{VIEW_TYPE_ICONS[view.view_type] || '☰'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '500', color: '#111418' }}>{view.name}</Text>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                        {VIEW_TYPE_LABELS[view.view_type] || view.view_type}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {view.is_visible_in_nav && (
                        <View style={{ backgroundColor: '#f3f0ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                          <Text style={{ color: Colors.primary, fontSize: 10, fontWeight: '600' }}>导航栏</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {views.length === 0 && (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>👁</Text>
              <Text style={{ fontSize: 16, color: '#9ca3af' }}>暂无视图</Text>
              <Text style={{ fontSize: 13, color: '#d1d5db', marginTop: 4 }}>点击右上角创建自定义视图</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* View actions */}
      <ActionSheet
        visible={showActions}
        title={selectedView?.name || ''}
        options={[
          { label: selectedView?.is_visible_in_nav ? '从导航栏隐藏' : '显示在导航栏', value: 'toggle_nav', icon: selectedView?.is_visible_in_nav ? '👁‍🗨' : '👁' },
          { label: '复制视图', value: 'duplicate', icon: '📋' },
          ...(!selectedView?.is_system ? [{ label: '删除视图', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true }] : []),
        ]}
        onSelect={(opt) => {
          if (opt.value === 'toggle_nav' && selectedView) handleToggleNav(selectedView);
          else if (opt.value === 'duplicate') handleDuplicate();
          else if (opt.value === 'delete') setShowDeleteConfirm(true);
          setShowActions(false);
        }}
        onCancel={() => { setShowActions(false); setSelectedView(null); }}
      />

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="删除视图"
        message={`确认删除视图「${selectedView?.name}」？`}
        confirmText="删除"
        destructive
        onConfirm={handleDelete}
        onCancel={() => { setShowDeleteConfirm(false); setSelectedView(null); }}
      />
    </SafeAreaView>
  );
}
