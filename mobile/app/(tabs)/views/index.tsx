import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useViews, useDeleteView, useDuplicateView, useToggleViewVisibility, useCreateView, useUpdateView,
} from '../../../hooks/useViews';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { ActionSheet } from '../../../components/ui/ActionSheet';
import { EmptyState } from '../../../components/ui/EmptyState';
import { SkeletonListItem } from '../../../components/ui/SkeletonLoader';
import { useToast } from '../../../hooks/useToast';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import { ViewTypeIcons } from '../../../constants/icons';
import type { TaskView, ViewFilter, ViewSort } from '../../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../../shared/types/index';

const isWeb = Platform.OS === 'web';

// Conditionally import DraggableFlatList (not supported on web)
let DraggableFlatList: any = null;
let ScaleDecorator: any = null;
if (!isWeb) {
  try {
    const mod = require('react-native-draggable-flatlist');
    DraggableFlatList = mod.default;
    ScaleDecorator = mod.ScaleDecorator;
  } catch {}
}

const VTL: Record<string, string> = { list: '列表', board: '看板', calendar: '日历', table: '表格', timeline: '时间线', gallery: '画廊' };
const SORT_LABELS: Record<string, string> = { created_at: '创建时间', updated_at: '更新时间', due_date: '截止日期', priority: '优先级', status: '状态', title: '标题', sort_order: '自定义' };
const FILTER_LABELS: Record<string, string> = { status: '状态', priority: '优先级', due_date: '截止日期', start_date: '开始日期', is_overdue: '逾期', is_completed: '完成' };
const OP_LABELS: Record<string, string> = { eq: '=', neq: '≠', gte: '≥', is_today: '今天', is_tomorrow: '明天', is_this_week: '本周', is_next_week: '下周', is_overdue: '已逾期', has_no_date: '无日期', is_true: '是', is_false: '否', equals: '=', not_equals: '≠', in: '包含' };

/** Render compact filter/sort/group info tags */
function ViewMeta({ view }: { view: TaskView }) {
  const { colors } = useTheme();
  const tags: { label: string; color: string; bg: string }[] = [];
  // Filters
  if (view.filters?.length) {
    view.filters.forEach((f) => {
      const field = FILTER_LABELS[f.field] || f.field;
      const op = OP_LABELS[f.operator] || f.operator;
      tags.push({ label: `${field} ${op}`, color: '#4338ca', bg: '#e0e7ff' });
    });
  }
  // Sorts
  if (view.sorts?.length) {
    view.sorts.forEach((s) => {
      const field = SORT_LABELS[s.field] || s.field;
      const dir = s.direction === 'asc' ? '↑' : '↓';
      tags.push({ label: `${field}${dir}`, color: '#92400e', bg: '#fef3c7' });
    });
  }
  // Group
  if (view.group_by) {
    tags.push({ label: `按${SORT_LABELS[view.group_by] || view.group_by}分组`, color: '#065f46', bg: '#d1fae5' });
  }
  if (tags.length === 0) return null;
  const visibleTags = tags.slice(0, 3);
  const hiddenCount = tags.length - visibleTags.length;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {visibleTags.map((t, i) => (
        <View key={i} style={{ backgroundColor: t.bg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
          <Text style={{ fontSize: 10, color: t.color, fontWeight: '500' }}>{t.label}</Text>
        </View>
      ))}
      {hiddenCount > 0 && (
        <View style={{ backgroundColor: colors.background.tertiary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
          <Text style={{ fontSize: 10, color: colors.text.secondary, fontWeight: '500' }}>+{hiddenCount} 条规则</Text>
        </View>
      )}
    </View>
  );
}

function TemplateMeta({ filters, sorts, group_by }: { filters: ViewFilter[]; sorts: ViewSort[]; group_by?: string }) {
  const { colors } = useTheme();
  const tags: { label: string; color: string; bg: string }[] = [];
  filters.forEach((f) => {
    const field = FILTER_LABELS[f.field] || f.field;
    const op = OP_LABELS[f.operator] || f.operator;
    tags.push({ label: `${field} ${op}`, color: '#4338ca', bg: '#e0e7ff' });
  });
  sorts.forEach((s) => {
    const field = SORT_LABELS[s.field] || s.field;
    tags.push({ label: `${field}${s.direction === 'asc' ? '↑' : '↓'}`, color: '#92400e', bg: '#fef3c7' });
  });
  if (group_by) tags.push({ label: `按${SORT_LABELS[group_by] || group_by}分组`, color: '#065f46', bg: '#d1fae5' });
  if (tags.length === 0) return null;
  const visibleTags = tags.slice(0, 3);
  const hiddenCount = tags.length - visibleTags.length;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
      {visibleTags.map((t, i) => <View key={i} style={{ backgroundColor: t.bg, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}><Text style={{ fontSize: 10, color: t.color, fontWeight: '500' }}>{t.label}</Text></View>)}
      {hiddenCount > 0 && (
        <View style={{ backgroundColor: colors.background.tertiary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1 }}>
          <Text style={{ fontSize: 10, color: colors.text.secondary, fontWeight: '500' }}>+{hiddenCount} 条规则</Text>
        </View>
      )}
    </View>
  );
}

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
  const { colors } = useTheme();
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
  const myFiltered = useMemo(() => { if (!search) return views; const q = search.toLowerCase(); return views.filter((v) => v.name.toLowerCase().includes(q)); }, [views, search]);
  const sysFiltered = useMemo(() => { if (!search) return PRESETS; const q = search.toLowerCase(); return PRESETS.filter((t) => t.name.includes(q) || t.description.includes(q)); }, [search]);

  const handleDragEnd = useCallback(async ({ data }: { data: TaskView[] }) => {
    try { await Promise.all(data.map((v, i) => updateView.mutateAsync({ uid: v.uid, data: { sort_order: i * 10 } }))); } catch {}
  }, [updateView]);

  // Move for web fallback
  const handleMove = async (idx: number, dir: 'up' | 'down') => {
    const si = dir === 'up' ? idx - 1 : idx + 1;
    if (si < 0 || si >= navViews.length) return;
    try {
      const a = navViews[idx], b = navViews[si];
      await Promise.all([
        updateView.mutateAsync({ uid: a.uid, data: { sort_order: b.sort_order } }),
        updateView.mutateAsync({ uid: b.uid, data: { sort_order: a.sort_order } }),
      ]);
    } catch {}
  };

  const handleRemove = async (v: TaskView) => { try { await toggleVis.mutateAsync({ uid: v.uid, isVisible: false }); } catch {} };
  const handleAdd = async (v: TaskView) => { try { await toggleVis.mutateAsync({ uid: v.uid, isVisible: true }); } catch {} };
  const handleDup = async () => { if (!selView) return; try { await duplicateView.mutateAsync(selView.uid); } catch {} };
  const handleDel = async () => { if (!selView) return; try { await deleteView.mutateAsync(selView.uid); } catch {} setShowDel(false); setSelView(null); };
  const handleCreate = async (t: ViewTemplate, nav: boolean) => {
    try {
      const names = views.map((v) => v.name);
      let n = t.name;
      if (names.includes(n)) n = `${t.name} ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
      await createView.mutateAsync({ name: n, view_type: t.view_type, filters: t.filters, sorts: t.sorts, group_by: t.group_by, is_visible_in_nav: nav,
        view_settings: { show_project: true, show_tags: true, show_due_date: true, show_priority: true, show_status: true, compact_mode: false } });
      setTab(nav ? 'nav' : 'my');
    } catch { showToast('error', '创建失败'); }
  };

  const TABS: { key: Tab; label: string; n: number }[] = [
    { key: 'nav', label: '导航栏', n: navViews.length },
    { key: 'my', label: '我的', n: views.length },
    { key: 'system', label: '系统', n: PRESETS.length },
  ];

  // Nav card content (shared between native drag and web)
  const NavCard = ({ item, idx, dragHandle }: { item: TaskView; idx?: number; dragHandle?: React.ReactNode }) => {
    const icon = ViewTypeIcons[item.view_type] || 'format-list-bulleted';
    return (
      <TouchableOpacity onPress={() => router.push(`/(tabs)/views/${item.uid}/edit` as any)} activeOpacity={0.7}
        style={{ paddingHorizontal: 14, paddingVertical: 12, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          {dragHandle}
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primary + '14', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 2 }}>
            <MaterialCommunityIcons name={icon} size={18} color={Colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }} numberOfLines={1}>{item.name}</Text>
              {item.is_default && <View style={{ backgroundColor: Colors.primary + '18', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}><Text style={{ fontSize: 9, fontWeight: '700', color: Colors.primary }}>默认</Text></View>}
            </View>
            <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 2 }}>
              {VTL[item.view_type]}{item.project ? ` · ${item.project.name}` : ' · 全局'}{item.follow_selected_project ? ' · 跟随项目' : ''}
            </Text>
            <ViewMeta view={item} />
          </View>
          <TouchableOpacity onPress={() => handleRemove(item)}
            style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.error + '14', marginTop: 2 }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: colors.error }}>移除</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Nav item renderer for DraggableFlatList (native only)
  const renderNavItem = useCallback(({ item, drag, isActive }: any) => {
    const Wrapper = ScaleDecorator || View;
    return (
      <Wrapper>
        <View style={{ backgroundColor: isActive ? '#f3f0ff' : '#fff' }}>
          <NavCard item={item} dragHandle={
            <TouchableOpacity onLongPress={drag} delayLongPress={150} style={{ paddingRight: 8, paddingTop: 4 }}>
              <MaterialCommunityIcons name="drag" size={18} color={isActive ? Colors.primary : colors.text.muted} />
            </TouchableOpacity>
          } />
        </View>
      </Wrapper>
    );
  }, []);

  // Nav item for web (with up/down arrows)
  const renderNavItemWeb = (item: TaskView, idx: number) => {
    return (
      <View key={item.uid}>
        <NavCard item={item} idx={idx} dragHandle={
          <View style={{ marginRight: 8, gap: 0, paddingTop: 2 }}>
            <TouchableOpacity onPress={() => handleMove(idx, 'up')} disabled={idx === 0} style={{ padding: 2, opacity: idx === 0 ? 0.2 : 1 }}>
              <MaterialCommunityIcons name="chevron-up" size={14} color={colors.text.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleMove(idx, 'down')} disabled={idx === navViews.length - 1} style={{ padding: 2, opacity: idx === navViews.length - 1 ? 0.2 : 1 }}>
              <MaterialCommunityIcons name="chevron-down" size={14} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        } />
      </View>
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
          <View style={{ width: 32 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '600', color: colors.text.primary }}>视图管理</Text>
          </View>
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
                <Text style={{ fontSize: 14, fontWeight: tab === t.key ? '600' : '400', color: tab === t.key ? Colors.primary : colors.text.secondary }}>{t.label}</Text>
                <View style={{ backgroundColor: colors.background.tertiary, borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1 }}><Text style={{ fontSize: 10, color: colors.text.secondary }}>{t.n}</Text></View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {tab !== 'nav' && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.tertiary, borderRadius: 10, paddingHorizontal: 12, height: 36 }}>
              <MaterialCommunityIcons name="magnify" size={16} color={colors.text.muted} />
              <TextInput style={{ flex: 1, fontSize: 14, color: colors.text.primary, paddingVertical: 0, marginLeft: 6 }}
                placeholder="搜索..." placeholderTextColor={colors.text.muted} value={search} onChangeText={setSearch} />
              {search ? <TouchableOpacity onPress={() => setSearch('')}><MaterialCommunityIcons name="close" size={14} color={colors.text.muted} /></TouchableOpacity> : null}
            </View>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={{ paddingTop: 16, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12 }}><SkeletonListItem /><SkeletonListItem /><SkeletonListItem /></View>
      ) : tab === 'nav' ? (
        navViews.length > 0 ? (
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 11, color: colors.text.muted, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 4 }}>
              {isWeb ? '点击上下箭头排序 · 点击编辑' : '长按拖动排序 · 点击编辑'}
            </Text>
            {!isWeb && DraggableFlatList ? (
              <DraggableFlatList data={navViews} keyExtractor={(item: TaskView) => item.uid} renderItem={renderNavItem} onDragEnd={handleDragEnd}
                containerStyle={{ marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }} />
            ) : (
              <ScrollView style={{ marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
                {navViews.map((v, i) => renderNavItemWeb(v, i))}
              </ScrollView>
            )}
          </View>
        ) : <EmptyState icon="tab" message="导航栏中还没有视图" description="去「我的」或「系统」添加" />
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {tab === 'my' && (myFiltered.length > 0 ? (
            <View style={{ marginTop: 10, marginHorizontal: 16, backgroundColor: colors.card, borderRadius: 12, overflow: 'hidden' }}>
              {myFiltered.map((v, i) => {
                const ic = ViewTypeIcons[v.view_type] || 'format-list-bulleted';
                return (
                  <TouchableOpacity key={v.uid} onPress={() => router.push(`/(tabs)/views/${v.uid}/edit` as any)}
                    onLongPress={() => { setSelView(v); setShowAct(true); }} activeOpacity={0.7}
                    style={{ paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: i < myFiltered.length - 1 ? 1 : 0, borderBottomColor: colors.borderLight }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name={ic} size={18} color={Colors.primary} style={{ marginRight: 10 }} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text.primary }}>{v.name}</Text>
                          {v.is_visible_in_nav && <View style={{ backgroundColor: Colors.primary + '14', borderRadius: 3, paddingHorizontal: 4, paddingVertical: 1 }}><Text style={{ fontSize: 9, fontWeight: '600', color: Colors.primary }}>导航栏</Text></View>}
                        </View>
                        <Text style={{ fontSize: 11, color: colors.text.muted, marginTop: 1 }}>{VTL[v.view_type]}{v.project ? ` · ${v.project.name}` : ''}</Text>
                        <ViewMeta view={v} />
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={16} color={colors.text.muted} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : search ? <EmptyState icon="magnify" message="未找到匹配视图" /> : <EmptyState icon="view-dashboard-outline" message="暂无视图" description="点击右上角新建" />)}

          {tab === 'system' && (
            <View style={{ marginTop: 10, paddingHorizontal: 16, gap: 10 }}>
              {sysFiltered.map((t) => (
                <View key={t.id} style={{ backgroundColor: colors.card, borderRadius: 12, padding: 14 }}>
                  <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: Colors.primary + '14', alignItems: 'center', justifyContent: 'center' }}>
                      <MaterialCommunityIcons name={t.icon as any} size={20} color={Colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>{t.name}</Text>
                        <View style={{ backgroundColor: '#eff6ff', borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 }}><Text style={{ fontSize: 9, fontWeight: '600', color: '#3b82f6' }}>系统</Text></View>
                      </View>
                      <Text style={{ fontSize: 12, color: colors.text.muted, marginTop: 2 }}>{t.description}</Text>
                      <TemplateMeta filters={t.filters} sorts={t.sorts} group_by={t.group_by} />
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={() => handleCreate(t, false)} disabled={createView.isPending}
                      style={{ flex: 1, paddingVertical: 8, backgroundColor: colors.background.tertiary, borderRadius: 8, alignItems: 'center' }}>
                      <Text style={{ fontSize: 13, fontWeight: '500', color: colors.text.secondary }}>创建副本</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleCreate(t, true)} disabled={createView.isPending}
                      style={{ flex: 1, paddingVertical: 8, backgroundColor: colors.success, borderRadius: 8, alignItems: 'center' }}>
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
        ...(!selView?.is_system ? [{ label: '删除', value: 'del', icon: '🗑', color: colors.error, destructive: true }] : []),
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
