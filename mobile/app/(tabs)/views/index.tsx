import React, { useState, useMemo } from 'react';
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
import {
  useViews,
  useDeleteView,
  useDuplicateView,
  useToggleViewVisibility,
  useCreateView,
} from '../../../hooks/useViews';
import { viewApi } from '../../../shared/services/api';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import { ViewTypeIcons } from '../../../constants/icons';
import type { TaskView, ViewFilter, ViewSort } from '../../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../../shared/types/index';
import { useQueryClient } from '@tanstack/react-query';

const VIEW_TYPE_LABELS: Record<string, string> = {
  list: '列表', board: '看板', calendar: '日历', table: '表格', timeline: '时间线', gallery: '画廊',
};

// System preset templates (same as web)
interface ViewTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  view_type: 'list' | 'board' | 'calendar' | 'table';
  filters: ViewFilter[];
  sorts: ViewSort[];
  group_by?: string;
}

const PRESET_TEMPLATES: ViewTemplate[] = [
  {
    id: 'today_tasks', name: '今日任务', description: '显示今天需要处理的所有任务',
    icon: 'calendar-today', view_type: 'list',
    filters: [{ field: 'due_date', operator: 'is_today', value: null, logic: 'and' }],
    sorts: [{ field: 'priority', direction: 'desc' }],
  },
  {
    id: 'overdue_tasks', name: '逾期任务', description: '显示所有已逾期的未完成任务',
    icon: 'clock-alert-outline', view_type: 'list',
    filters: [{ field: 'due_date', operator: 'is_overdue', value: null, logic: 'and' }],
    sorts: [{ field: 'due_date', direction: 'asc' }],
  },
  {
    id: 'high_priority', name: '高优先级任务', description: '显示高优先级和紧急任务',
    icon: 'flag', view_type: 'list',
    filters: [
      { field: 'priority', operator: 'in', value: [TaskPriority.HIGH, TaskPriority.URGENT], logic: 'and' },
      { field: 'status', operator: 'not_equals', value: TaskStatus.COMPLETED, logic: 'and' },
    ],
    sorts: [{ field: 'priority', direction: 'desc' }],
    group_by: 'priority',
  },
  {
    id: 'this_week', name: '本周任务', description: '显示本周内的所有任务',
    icon: 'calendar-week', view_type: 'list',
    filters: [{ field: 'due_date', operator: 'is_this_week', value: null, logic: 'and' }],
    sorts: [{ field: 'due_date', direction: 'asc' }],
  },
  {
    id: 'completed_tasks', name: '已完成任务', description: '显示所有已完成的任务',
    icon: 'check-circle', view_type: 'list',
    filters: [{ field: 'status', operator: 'equals', value: TaskStatus.COMPLETED, logic: 'and' }],
    sorts: [{ field: 'updated_at', direction: 'desc' }],
  },
  {
    id: 'kanban_board', name: '看板视图', description: '按状态分组的看板视图',
    icon: 'view-column', view_type: 'board',
    filters: [],
    sorts: [{ field: 'priority', direction: 'desc' }],
    group_by: 'status',
  },
];

type TabKey = 'nav' | 'my' | 'system';

export default function ViewsPage() {
  const { data: viewsData, isLoading } = useViews();
  const deleteView = useDeleteView();
  const duplicateView = useDuplicateView();
  const toggleVisibility = useToggleViewVisibility();
  const createView = useCreateView();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const views: TaskView[] = (viewsData as TaskView[]) || [];

  const [activeTab, setActiveTab] = useState<TabKey>('nav');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<TaskView | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const navViews = useMemo(
    () => views.filter((v) => v.is_visible_in_nav).sort((a, b) => a.sort_order - b.sort_order),
    [views]
  );
  const myViews = views;

  const filteredMyViews = useMemo(() => {
    if (!searchQuery) return myViews;
    const q = searchQuery.toLowerCase();
    return myViews.filter((v) => v.name.toLowerCase().includes(q));
  }, [myViews, searchQuery]);

  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return PRESET_TEMPLATES;
    const q = searchQuery.toLowerCase();
    return PRESET_TEMPLATES.filter((t) => t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q));
  }, [searchQuery]);

  // Actions
  const handleRemoveFromNav = async (view: TaskView) => {
    try {
      await toggleVisibility.mutateAsync({ uid: view.uid, isVisible: false });
      showToast('success', '已从导航栏移除');
    } catch { showToast('error', '操作失败'); }
  };

  const handleAddToNav = async (view: TaskView) => {
    try {
      await toggleVisibility.mutateAsync({ uid: view.uid, isVisible: true });
      showToast('success', '已添加到导航栏');
    } catch { showToast('error', '操作失败'); }
  };

  const handleDuplicate = async () => {
    if (!selectedView) return;
    try {
      await duplicateView.mutateAsync(selectedView.uid);
      showToast('success', '视图已复制');
    } catch { showToast('error', '复制失败'); }
  };

  const handleDelete = async () => {
    if (!selectedView) return;
    try {
      await deleteView.mutateAsync(selectedView.uid);
      showToast('success', '视图已删除');
    } catch { showToast('error', '删除失败'); }
    setShowDeleteConfirm(false);
    setSelectedView(null);
  };

  const handleCreateFromTemplate = async (template: ViewTemplate, addToNav: boolean) => {
    try {
      const existingNames = views.map((v) => v.name);
      let name = template.name;
      if (existingNames.includes(name)) {
        const ts = new Date().toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        name = `${template.name} ${ts}`;
      }
      await createView.mutateAsync({
        name,
        view_type: template.view_type,
        filters: template.filters,
        sorts: template.sorts,
        group_by: template.group_by || undefined,
        is_visible_in_nav: addToNav,
        view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true, show_status: true, compact_mode: false },
      });
      showToast('success', addToNav ? '已创建并加入导航栏' : '视图已创建');
      if (addToNav) setActiveTab('nav');
      else setActiveTab('my');
    } catch { showToast('error', '创建失败'); }
  };

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: 'nav', label: '导航栏', count: navViews.length },
    { key: 'my', label: '我的', count: myViews.length },
    { key: 'system', label: '系统', count: PRESET_TEMPLATES.length },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#111418' }}>视图管理</Text>
          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity onPress={() => router.push('/(tabs)/views/templates' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MaterialCommunityIcons name="store" size={16} color={Colors.primary} />
              <Text style={{ color: Colors.primary, fontSize: 14 }}>广场</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/(tabs)/views/create' as any)}>
              <Text style={{ color: Colors.primary, fontSize: 14, fontWeight: '600' }}>+ 新建</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
          {TABS.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={{
                flex: 1, alignItems: 'center', paddingVertical: 12,
                borderBottomWidth: 2,
                borderBottomColor: activeTab === tab.key ? Colors.primary : 'transparent',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{
                  fontSize: 14, fontWeight: activeTab === tab.key ? '600' : '400',
                  color: activeTab === tab.key ? Colors.primary : '#6b7280',
                }}>
                  {tab.label}
                </Text>
                <View style={{ backgroundColor: '#f3f4f6', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 11, color: '#6b7280' }}>{tab.count}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Search — only for my/system tabs */}
        {activeTab !== 'nav' && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, height: 38 }}>
              <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" />
              <TextInput
                style={{ flex: 1, fontSize: 14, color: '#111418', paddingVertical: 0, marginLeft: 8 }}
                placeholder="搜索视图..."
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, paddingTop: 16 }}>
          <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
            <SkeletonListItem /><SkeletonListItem /><SkeletonListItem />
          </View>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* ===== NAV TAB ===== */}
          {activeTab === 'nav' && (
            <>
              {navViews.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <Text style={{ fontSize: 12, color: '#9ca3af', paddingHorizontal: 16, marginBottom: 8 }}>
                    长按视图可拖拽排序（暂不支持移动端拖拽，请使用操作菜单）
                  </Text>
                  <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                    {navViews.map((view, idx) => (
                      <NavViewCard
                        key={view.uid}
                        view={view}
                        isLast={idx === navViews.length - 1}
                        onRemove={() => handleRemoveFromNav(view)}
                        onEdit={() => router.push(`/(tabs)/views/${view.uid}/edit` as any)}
                        onMore={() => { setSelectedView(view); setShowActions(true); }}
                      />
                    ))}
                  </View>
                </View>
              ) : (
                <EmptyState icon="tab" message="导航栏中还没有视图" description="去「我的」或「系统」标签页添加" />
              )}
            </>
          )}

          {/* ===== MY TAB ===== */}
          {activeTab === 'my' && (
            <>
              {filteredMyViews.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <View style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
                    {filteredMyViews.map((view, idx) => (
                      <MyViewCard
                        key={view.uid}
                        view={view}
                        isLast={idx === filteredMyViews.length - 1}
                        onToggleNav={() => view.is_visible_in_nav ? handleRemoveFromNav(view) : handleAddToNav(view)}
                        onMore={() => { setSelectedView(view); setShowActions(true); }}
                      />
                    ))}
                  </View>
                </View>
              ) : searchQuery ? (
                <EmptyState icon="magnify" message={`未找到"${searchQuery}"相关视图`} />
              ) : (
                <EmptyState icon="view-dashboard-outline" message="还没有创建任何视图" description="点击右上角新建" />
              )}
            </>
          )}

          {/* ===== SYSTEM TAB ===== */}
          {activeTab === 'system' && (
            <View style={{ marginTop: 12, paddingHorizontal: 16, gap: 12 }}>
              {filteredTemplates.map((tpl) => (
                <SystemTemplateCard
                  key={tpl.id}
                  template={tpl}
                  isCreating={createView.isPending}
                  onCreateCopy={() => handleCreateFromTemplate(tpl, false)}
                  onAddToNav={() => handleCreateFromTemplate(tpl, true)}
                />
              ))}
              {filteredTemplates.length === 0 && searchQuery && (
                <EmptyState icon="magnify" message={`未找到"${searchQuery}"相关模板`} />
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Action sheet for selected view */}
      <ActionSheet
        visible={showActions}
        title={selectedView?.name || ''}
        options={[
          ...(selectedView?.is_visible_in_nav
            ? [{ label: '从导航栏移除', value: 'remove_nav', icon: '👁‍🗨' }]
            : [{ label: '加入导航栏', value: 'add_nav', icon: '👁' }]),
          { label: '复制视图', value: 'duplicate', icon: '📋' },
          ...(!selectedView?.is_system ? [{ label: '删除视图', value: 'delete', icon: '🗑', color: '#ef4444', destructive: true }] : []),
        ]}
        onSelect={(opt) => {
          if (opt.value === 'remove_nav' && selectedView) handleRemoveFromNav(selectedView);
          else if (opt.value === 'add_nav' && selectedView) handleAddToNav(selectedView);
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

// ===== Sub-components =====

function NavViewCard({ view, isLast, onRemove, onEdit, onMore }: {
  view: TaskView; isLast: boolean;
  onRemove: () => void; onEdit: () => void; onMore: () => void;
}) {
  const iconName = ViewTypeIcons[view.view_type] || 'format-list-bulleted';
  return (
    <View style={{ borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#f3f4f6' }}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.primary + '14', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <MaterialCommunityIcons name={iconName} size={20} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111418' }}>{view.name}</Text>
              {view.is_default && (
                <View style={{ backgroundColor: Colors.primary + '18', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: Colors.primary }}>默认</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              {VIEW_TYPE_LABELS[view.view_type]}{view.project ? ` · ${view.project.name}` : ' · 全局视图'}
              {view.filters?.length ? ` · ${view.filters.length}个筛选` : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={onMore} style={{ padding: 6 }}>
            <MaterialCommunityIcons name="dots-vertical" size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>
        {/* Action buttons */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={onEdit}
            style={{ flex: 1, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>编辑</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onRemove}
            style={{ paddingVertical: 8, paddingHorizontal: 16, backgroundColor: '#fef2f2', borderRadius: 8, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 13, fontWeight: '500', color: '#ef4444' }}>移除</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

function MyViewCard({ view, isLast, onToggleNav, onMore }: {
  view: TaskView; isLast: boolean;
  onToggleNav: () => void; onMore: () => void;
}) {
  const iconName = ViewTypeIcons[view.view_type] || 'format-list-bulleted';
  return (
    <TouchableOpacity
      style={{
        flexDirection: 'row', alignItems: 'center',
        paddingHorizontal: 16, paddingVertical: 14,
        borderBottomWidth: isLast ? 0 : 1, borderBottomColor: '#f3f4f6',
      }}
      onPress={onMore}
    >
      <MaterialCommunityIcons name={iconName} size={22} color={Colors.primary} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '500', color: '#111418' }}>{view.name}</Text>
        <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
          {VIEW_TYPE_LABELS[view.view_type]}{view.project ? ` · ${view.project.name}` : ''}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <TouchableOpacity
          onPress={onToggleNav}
          style={{
            paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
            backgroundColor: view.is_visible_in_nav ? '#f3f0ff' : '#f3f4f6',
          }}
        >
          <Text style={{
            fontSize: 11, fontWeight: '600',
            color: view.is_visible_in_nav ? Colors.primary : '#9ca3af',
          }}>
            {view.is_visible_in_nav ? '导航栏' : '+ 导航'}
          </Text>
        </TouchableOpacity>
        <MaterialCommunityIcons name="chevron-right" size={18} color="#d1d5db" />
      </View>
    </TouchableOpacity>
  );
}

function SystemTemplateCard({ template, isCreating, onCreateCopy, onAddToNav }: {
  template: ViewTemplate; isCreating: boolean;
  onCreateCopy: () => void; onAddToNav: () => void;
}) {
  const iconName = (ViewTypeIcons as any)[template.view_type] || 'format-list-bulleted';
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
      <View style={{ padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: Colors.primary + '14', alignItems: 'center', justifyContent: 'center' }}>
            <MaterialCommunityIcons name={template.icon as any} size={22} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#111418' }}>{template.name}</Text>
              <View style={{ backgroundColor: '#eff6ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '600', color: '#3b82f6' }}>系统</Text>
              </View>
            </View>
            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>{template.description}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Text style={{ fontSize: 12, color: '#9ca3af' }}>
                {VIEW_TYPE_LABELS[template.view_type]}
              </Text>
              {template.filters.length > 0 && (
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>{template.filters.length}个筛选</Text>
              )}
              {template.group_by && (
                <Text style={{ fontSize: 12, color: '#9ca3af' }}>有分组</Text>
              )}
            </View>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 14, paddingTop: 4 }}>
        <TouchableOpacity
          onPress={onCreateCopy}
          disabled={isCreating}
          style={{ flex: 1, paddingVertical: 10, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center', opacity: isCreating ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>
            {isCreating ? '创建中...' : '创建副本'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onAddToNav}
          disabled={isCreating}
          style={{ flex: 1, paddingVertical: 10, backgroundColor: '#22c55e', borderRadius: 8, alignItems: 'center', opacity: isCreating ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>
            {isCreating ? '添加中...' : '加入导航栏'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
