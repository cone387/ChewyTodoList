import React, { useState, useMemo, useCallback } from 'react';
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
import DraggableFlatList, { ScaleDecorator, RenderItemParams } from 'react-native-draggable-flatlist';
import {
  useViews, useDeleteView, useDuplicateView, useToggleViewVisibility, useCreateView, useUpdateView,
} from '../../../hooks/useViews';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { useToast } from '../../../hooks/useToast';
import { Colors } from '../../../constants/theme';
import { ViewTypeIcons } from '../../../constants/icons';
import type { TaskView, ViewFilter, ViewSort } from '../../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../../shared/types/index';

const VTL: Record<string, string> = { list: '列表', board: '看板', calendar: '日历', table: '表格', timeline: '时间线', gallery: '画廊' };

interface ViewTemplate {
  id: string; name: string; description: string; icon: string;
  view_type: 'list' | 'board' | 'calendar' | 'table';
  filters: ViewFilter[]; sorts: ViewSort[]; group_by?: string;
}
const PRESETS: ViewTemplate[] = [
  { id: 'today', name: '今日任务', description: '今天需要处理的任务', icon: 'calendar-today', view_type: 'list',
    filters: [{ field: 'due_date', operator: 'is_today', value: null, logic: 'and' }], sorts: [{ field: 'priority', direction: 'desc' }] },
  { id: 'overdue', name: '逾期任务', description: '已逾期的未完成任务', icon: 'clock-alert-outline', view_type: 'list',
    filters: [{ field: 'due_date', operator: 'is_overdue', value: null, logic: 'and' }], sorts: [{ field: 'due_date', direction: 'asc' }] },
  { id: 'high', name: '高优先级', description: '高优先级和紧急任务', icon: 'flag', view_type: 'list',
    filters: [{ field: 'priority', operator: 'in', value: [TaskPriority.HIGH, TaskPriority.URGENT], logic: 'and' },
      { field: 'status', operator: 'not_equals', value: TaskStatus.COMPLETED, logic: 'and' }],
    sorts: [{ field: 'priority', direction: 'desc' }], group_by: 'priority' },
  { id: 'week', name: '本周任务', description: '本周内的所有任务', icon: 'calendar-week', view_type: 'list',
    filters: [{ field: 'due_date', operator: 'is_this_week', value: null, logic: 'and' }], sorts: [{ field: 'due_date', direction: 'asc' }] },
  { id: 'done', name: '已完成', description: '所有已完成的任务', icon: 'check-circle', view_type: 'list',
    filters: [{ field: 'status', operator: 'equals', value: TaskStatus.COMPLETED, logic: 'and' }], sorts: [{ field: 'updated_at', direction: 'desc' }] },
  { id: 'kanban', name: '看板视图', description: '按状态分组的看板', icon: 'view-column', view_type: 'board',
    filters: [], sorts: [{ field: 'priority', direction: 'desc' }], group_by: 'status' },
];

type Tab = 'nav' | 'my' | 'system';

export default function ViewsPage() {
  const { data: viewsData, isLoading } = useViews();
  const deleteView = useDeleteView();
  const duplicateView = useDuplicateView();
  const toggleVis = useToggleViewVisibility();
  const createView = useCreateView();
  const updateView = useUpdateView();
  const { showToast } = useToast();

  const views: TaskView[] = (viewsData as TaskView[]) || [];
  const [tab, setTab] = useState<Tab>('nav');
  const [search, setSearch] = useState('');
  const [selView, setSelView] = useState<TaskView | null>(null);
  const [showAct, setShowAct] = useState(false);
  const [showDel, setShowDel] = useState(false);

  const navViews = useMemo(() => views.filter((v) => v.is_visible_in_nav).sort((a, b) => a.sort_order - b.sort_order), [views]);
  const myFiltered = useMemo(() => {
    if (!search) return views;
    const q = search.toLowerCase();
    return views.filter((v) => v.name.toLowerCase().includes(q));
  }, [views, search]);
  const sysFiltered = useMemo(() => {
    if (!search) return PRESETS;
    const q = search.toLowerCase();
    return PRESETS.filter((t) => t.name.includes(q) || t.description.includes(q));
  }, [search]);

  // Drag reorder handler
  const handleDragEnd = useCallback(async ({ data }: { data: TaskView[] }) => {
    // Update sort_order for each view based on new position
    const updates = data.map((v, i) => updateView.mutateAsync({ uid: v.uid, data: { sort_order: i * 10 } }));
    try { await Promise.all(updates); } catch { showToast('error', '排序保存失败'); }
  }, [updateView, showToast]);

  const handleRemove = async (v: TaskView) => { try { await toggleVis.mutateAsync({ uid: v.uid, isVisible: false }); showToast('success', '已移除'); } catch { showToast('error', '失败'); } };
  const handleAdd = async (v: TaskView) => { try { await toggleVis.mutateAsync({ uid: v.uid, isVisible: true }); showToast('success', '已添加'); } catch { showToast('error', '失败'); } };
  const handleDup = async () => { if (!selView) return; try { await duplicateView.mutateAsync(selView.uid); showToast('success', '已复制'); } catch { showToast('error', '失败'); } };
  const handleDel = async () => { if (!selView) return; try { await deleteView.mutateAsync(selView.uid); showToast('success', '已删除'); } catch { showToast('error', '失败'); } setShowDel(false); setSelView(null); };
  const handleCreate = async (t: ViewTemplate, nav: boolean) => {
    try {
      const names = views.map((v) => v.name);
      let n = t.name;
      if (names.includes(n)) n = `${t.name} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
      await createView.mutateAsync({ name: n, view_type: t.view_type, filters: t.filters, sorts: t.sorts, group_by: t.group_by, is_visible_in_nav: nav,
        view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true, show_status: true, compact_mode: false } });
      showToast('success', nav ? '已加入导航栏' : '已创建');
      setTab(nav ? 'nav' : 'my');
    } catch { showToast('error', '创建失败'); }
  };

  const TABS: { key: Tab; label: string; n: number }[] = [
    { key: 'nav', label: '导航栏', n: navViews.length },
    { key: 'my', label: '我的', n: views.length },
    { key: 'system', label: '系统', n: PRESETS.length },
  ];

  const renderNavItem = useCallback(({ item, drag, isActive }: RenderItemParams<TaskView>) => {
    const icon = ViewTypeIcons[item.view_type] || 'format-list-bulleted';
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/views/${item.uid}/edit` as any)}
          onLongPress={drag}
          delayLongPress={200}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
            backgroundColor: isActive ? '#f3f0ff' : '#fff',
            borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
          }}
        >
          <MaterialCommunityIcons name="drag" size={18} color="#d1d5db" style={{ marginRight: 8 }} />
          <MaterialCommunityIcons name={icon} size={20} color={Colors.primary} style={{ marginRight: 10 }} />
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '500', color: '#111418' }} numberOfLines={1}>{item.name}</Text>
              {item.is_default && <View style={{ backgroundColor: Colors.primary + '18', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}><Text style={{ fontSize: 9, fontWeight: '700', color: Colors.primary }}>默认</Text></View>}
            </View>
            <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{VTL[item.view_type]}{item.filters?.length ? ` · ${item.filters.length}筛选` : ''}</Text>
          </View>
          <TouchableOpacity onPress={() => handleRemove(item)} style={{ padding: 6 }} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="close" size={16} color="#d1d5db" />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  }, []);

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
        <View style={{ flexDirection: 'row' }}>
          {TABS.map((t) => (
            <TouchableOpacity key={t.key} onPress={() => { setTab(t.key); setSearch(''); }}
              style={{ flex: 1, alignItems: 'center', paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: tab === t.key ? Colors.primary : 'transparent' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: tab === t.key ? '600' : '400', color: tab === t.key ? Colors.primary : '#6b7280' }}>{t.label}</Text>
                <View style={{ backgroundColor: '#f3f4f6', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}><Text style={{ fontSize: 10, color: '#6b7280' }}>{t.n}</Text></View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {tab !== 'nav' && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f3f4f6', borderRadius: 10, paddingHorizontal: 12, height: 36 }}>
              <MaterialCommunityIcons name="magnify" size={16} color="#9ca3af" />
              <TextInput style={{ flex: 1, fontSize: 14, color: '#111418', paddingVertical: 0, marginLeft: 6 }}
                placeholder="搜索..." placeholderTextColor="#9ca3af" value={search} onChangeText={setSearch} />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><MaterialCommunityIcons name="close" size={14} color="#9ca3af" /></TouchableOpacity> : null}
            </View>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ paddingTop: 16, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12 }}><SkeletonListItem /><SkeletonListItem /><SkeletonListItem /></View>
      ) : tab === 'nav' ? (
        /* NAV — draggable list */
        navViews.length > 0 ? (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: '#9ca3af', paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>长按拖动排序 · 点击编辑 · 右侧×移除</Text>
            <DraggableFlatList
              data={navViews}
              keyExtractor={(item) => item.uid}
              renderItem={renderNavItem}
              onDragEnd={handleDragEnd}
              containerStyle={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}
            />
          </View>
        ) : <EmptyState icon="tab" message="导航栏中还没有视图" description="去「我的」或「系统」添加" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {/* MY */}
          {tab === 'my' && (myFiltered.length > 0 ? (
            <View style={{ marginTop: 10, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' }}>
              {myFiltered.map((v, i) => {
                const ic = ViewTypeIcons[v.view_type] || 'format-list-bulleted';
                return (
                  <TouchableOpacity key={v.uid} onPress={() => router.push(`/(tabs)/views/${v.uid}/edit` as any)}
                    onLongPress={() => { setSelView(v); setShowAct(true); }} activeOpacity={0.7}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12,
                      borderBottomWidth: i < myFiltered.length - 1 ? 1 : 0, borderBottomColor: '#f3f4f6' }}>
                    <MaterialCommunityIcons name={ic} size={20} color={Colors.primary} style={{ marginRight: 10 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '500', color: '#111418' }}>{v.name}</Text>
                      <Text style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>{VTL[v.view_type]}{v.project ? ` · ${v.project.name}` : ''}</Text>
                    </View>
                    <TouchableOpacity onPress={() => v.is_visible_in_nav ? handleRemove(v) : handleAdd(v)}
                      style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: v.is_visible_in_nav ? '#f3f0ff' : '#f3f4f6' }}>
                      <Text style={{ fontSize: 11, fontWeight: '600', color: v.is_visible_in_nav ? Colors.primary : '#9ca3af' }}>{v.is_visible_in_nav ? '导航栏' : '+ 导航'}</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : search ? <EmptyState icon="magnify" message="未找到匹配视图" /> : <EmptyState icon="view-dashboard-outline" message="暂无视图" description="点击右上角新建" />)}

          {/* SYSTEM */}
          {tab === 'system' && (
            <View style={{ marginTop: 10, paddingHorizontal: 16, gap: 10 }}>
              {sysFiltered.map((t) => (
                <View key={t.id} style={{ backgroundColor: '#fff', borderRadius: 12, padding: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.primary + '14', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name={t.icon as any} size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111418' }}>{t.name}</Text>
                        <View style={{ backgroundColor: '#eff6ff', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 }}><Text style={{ fontSize: 9, fontWeight: '600', color: '#3b82f6' }}>系统</Text></View>
                      </View>
                      <Text style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{t.description}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleCreate(t, false)} disabled={createView.isPending}
                      style={{ flex: 1, paddingVertical: 8, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: '#374151' }}>创建副本</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCreate(t, true)} disabled={createView.isPending}
                      style={{ flex: 1, paddingVertical: 8, backgroundColor: '#22c55e', borderRadius: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>加入导航栏</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <ActionSheet visible={showAct} title={selView?.name || ''} options={[
        ...(selView?.is_visible_in_nav ? [{ label: '从导航栏移除', value: 'rm', icon: '👁‍🗨' }] : [{ label: '加入导航栏', value: 'add', icon: '👁' }]),
        { label: '复制', value: 'dup', icon: '📋' },
        ...(!selView?.is_system ? [{ label: '删除', value: 'del', icon: '🗑', color: '#ef4444', destructive: true }] : []),
      ]} onSelect={(o) => {
        if (o.value === 'rm' && selView) handleRemove(selView);
        else if (o.value === 'add' && selView) handleAdd(selView);
        else if (o.value === 'dup') handleDup();
        else if (o.value === 'del') setShowDel(true);
        setShowAct(false);
      }} onCancel={() => { setShowAct(false); setSelView(null); }} />

      <ConfirmDialog visible={showDel} title="删除视图" message={`确认删除「${selView?.name}」？`}
        confirmText="删除" destructive onConfirm={handleDel} onCancel={() => { setShowDel(false); setSelView(null); }} />
    </SafeAreaView>
  );
}
