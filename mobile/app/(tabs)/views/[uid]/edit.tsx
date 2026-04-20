import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useView, useUpdateView, useDeleteView } from '../../../../hooks/useViews';
import { useProjects } from '../../../../hooks/useProjects';
import { ActionSheet } from '../../../../components/ui/ActionSheet';
import { ConfirmDialog } from '../../../../components/ui/ConfirmDialog';
import { FilterBuilder } from '../../../../components/views/FilterBuilder';
import { useToast } from '../../../../hooks/useToast';
import { Colors } from '../../../../constants/theme';
import type { Project, ViewFilter, ViewSort } from '../../../../shared/types/index';

const VT = [
  { v: 'list', l: '列表', i: 'format-list-bulleted' },
  { v: 'board', l: '看板', i: 'view-column' },
  { v: 'calendar', l: '日历', i: 'calendar-month' },
  { v: 'table', l: '表格', i: 'table' },
  { v: 'timeline', l: '时间线', i: 'chart-timeline-variant' },
  { v: 'gallery', l: '画廊', i: 'view-grid' },
];
const SORT_FIELDS = [
  { k: 'created_at', l: '创建时间' }, { k: 'updated_at', l: '更新时间' },
  { k: 'due_date', l: '截止日期' }, { k: 'priority', l: '优先级' },
  { k: 'status', l: '状态' }, { k: 'title', l: '标题' }, { k: 'sort_order', l: '自定义' },
];
const GROUP_OPTS = [
  { k: '', l: '不分组' }, { k: 'status', l: '状态' }, { k: 'priority', l: '优先级' },
  { k: 'project', l: '项目' }, { k: 'tags', l: '标签' }, { k: 'due_date', l: '截止日期' },
];
const DISPLAY_FIELDS = [
  { k: 'show_project' as const, l: '项目' }, { k: 'show_tags' as const, l: '标签' },
  { k: 'show_due_date' as const, l: '日期' }, { k: 'show_priority' as const, l: '优先级' },
  { k: 'show_status' as const, l: '状态' }, { k: 'show_completed' as const, l: '已完成' },
  { k: 'compact_mode' as const, l: '紧凑' },
];

type DS = { show_project: boolean; show_tags: boolean; show_due_date: boolean; show_priority: boolean; show_status: boolean; compact_mode: boolean; show_completed: boolean };

export default function EditViewPage() {
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { data: view, isLoading } = useView(uid);
  const updateView = useUpdateView();
  const deleteView = useDeleteView();
  const { data: pd } = useProjects();
  const { showToast } = useToast();
  const projects: Project[] = (pd as Project[]) || [];
  const ro = !!view?.is_system; // read-only

  const [name, setName] = useState('');
  const [vt, setVt] = useState('list');
  const [pUid, setPUid] = useState<string | null>(null);
  const [nav, setNav] = useState(true);
  const [follow, setFollow] = useState(true);
  const [filters, setFilters] = useState<ViewFilter[]>([]);
  const [sorts, setSorts] = useState<ViewSort[]>([]);
  const [gb, setGb] = useState('');
  const [ds, setDs] = useState<DS>({ show_project: true, show_tags: true, show_due_date: true, show_priority: true, show_status: true, compact_mode: false, show_completed: false });
  const [showPP, setShowPP] = useState(false);
  const [showDel, setShowDel] = useState(false);
  const [showSF, setShowSF] = useState(false);
  const [showGB, setShowGB] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!view) return;
    setName(view.name); setVt(view.view_type); setPUid(view.project?.uid || null);
    setNav(view.is_visible_in_nav); setFollow(view.follow_selected_project ?? true);
    setFilters(view.filters || []); setSorts(view.sorts || []); setGb(view.group_by || '');
    const s = view.view_settings || {};
    setDs({ show_project: s.show_project ?? true, show_tags: s.show_tags ?? true, show_due_date: s.show_due_date ?? true,
      show_priority: s.show_priority ?? true, show_status: s.show_status ?? true, compact_mode: s.compact_mode ?? false, show_completed: s.show_completed ?? false });
  }, [view]);

  const save = async () => {
    if (!name.trim()) { showToast('error', '请输入名称'); return; }
    setSaving(true);
    try {
      await updateView.mutateAsync({ uid, data: { name: name.trim(), view_type: vt as any, is_visible_in_nav: nav, follow_selected_project: follow,
        filters, sorts, group_by: gb || undefined, view_settings: ds, ...(pUid ? { project_uid: pUid } : {}) } });
      showToast('success', '已保存'); router.back();
    } catch { showToast('error', '保存失败'); }
    finally { setSaving(false); }
  };

  if (isLoading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  const proj = projects.find((p) => p.uid === pUid);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      {/* Header */}
      <View style={{ backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6', flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}><Text style={{ color: Colors.primary, fontSize: 15 }}>返回</Text></TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 16, fontWeight: '600', color: '#111418' }}>{ro ? '查看视图' : '编辑视图'}</Text></View>
        {!ro && <TouchableOpacity onPress={save} disabled={saving} style={{ paddingHorizontal: 12, paddingVertical: 5, backgroundColor: Colors.primary, borderRadius: 8, opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>保存</Text>}
        </TouchableOpacity>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        {/* Name */}
        <TextInput style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: '#111418', borderWidth: 1, borderColor: '#e5e7eb', marginTop: 14 }}
          placeholder="视图名称" placeholderTextColor="#9ca3af" value={name} onChangeText={setName} editable={!ro} />

        {/* View type — compact horizontal chips */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginTop: 14, marginBottom: 6 }}>类型</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {VT.map((t) => (
            <TouchableOpacity key={t.v} disabled={ro} onPress={() => setVt(t.v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8,
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                backgroundColor: vt === t.v ? Colors.primary : '#f3f4f6' }}>
              <MaterialCommunityIcons name={t.i as any} size={14} color={vt === t.v ? '#fff' : '#6b7280'} />
              <Text style={{ fontSize: 13, fontWeight: vt === t.v ? '600' : '400', color: vt === t.v ? '#fff' : '#6b7280' }}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Project + Group by — side by side */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 6 }}>项目</Text>
            <TouchableOpacity onPress={() => !ro && setShowPP(true)} disabled={ro}
              style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, fontSize: 13, color: proj ? '#374151' : '#9ca3af' }} numberOfLines={1}>{proj?.name || '无'}</Text>
              {!ro && <MaterialCommunityIcons name="chevron-down" size={16} color="#9ca3af" />}
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginBottom: 6 }}>分组</Text>
            <TouchableOpacity onPress={() => !ro && setShowGB(true)} disabled={ro}
              style={{ backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#e5e7eb', flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ flex: 1, fontSize: 13, color: gb ? '#374151' : '#9ca3af' }} numberOfLines={1}>{GROUP_OPTS.find((o) => o.k === gb)?.l || '不分组'}</Text>
              {!ro && <MaterialCommunityIcons name="chevron-down" size={16} color="#9ca3af" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Display — compact toggle chips */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginTop: 14, marginBottom: 6 }}>显示字段</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {DISPLAY_FIELDS.map((f) => {
            const on = ds[f.k];
            return (
              <TouchableOpacity key={f.k} disabled={ro} onPress={() => setDs({ ...ds, [f.k]: !on })}
                style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                  backgroundColor: on ? Colors.primary + '14' : '#f3f4f6',
                  borderWidth: 1, borderColor: on ? Colors.primary + '30' : 'transparent' }}>
                <Text style={{ fontSize: 13, color: on ? Colors.primary : '#9ca3af', fontWeight: on ? '600' : '400' }}>{f.l}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Filters */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginTop: 14, marginBottom: 6 }}>筛选条件</Text>
        <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#e5e7eb' }}>
          {ro ? (
            filters.length > 0 ? filters.map((f, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 }}>
                {i > 0 && <Text style={{ fontSize: 10, color: '#9ca3af' }}>且</Text>}
                <View style={{ backgroundColor: '#e0e7ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 11, color: '#4338ca' }}>{f.field}</Text></View>
                <Text style={{ fontSize: 11, color: '#6b7280' }}>{f.operator}</Text>
                {f.value !== null && <Text style={{ fontSize: 11, color: '#92400e' }}>{JSON.stringify(f.value)}</Text>}
              </View>
            )) : <Text style={{ fontSize: 12, color: '#9ca3af' }}>无</Text>
          ) : <FilterBuilder filters={filters} onChange={setFilters} />}
        </View>

        {/* Sorts */}
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#9ca3af', marginTop: 14, marginBottom: 6 }}>排序</Text>
        {sorts.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f9fafb', borderRadius: 8, padding: 8, marginBottom: 6, gap: 6 }}>
            <View style={{ backgroundColor: '#e0e7ff', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}><Text style={{ fontSize: 11, color: '#4338ca' }}>{SORT_FIELDS.find((f) => f.k === s.field)?.l || s.field}</Text></View>
            <TouchableOpacity onPress={() => { if (ro) return; const n = [...sorts]; n[i] = { ...n[i], direction: n[i].direction === 'asc' ? 'desc' : 'asc' }; setSorts(n); }} disabled={ro}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fef3c7', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                <MaterialCommunityIcons name={s.direction === 'asc' ? 'arrow-up' : 'arrow-down'} size={12} color="#92400e" />
                <Text style={{ fontSize: 11, color: '#92400e' }}>{s.direction === 'asc' ? '升' : '降'}</Text>
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
            {!ro && <TouchableOpacity onPress={() => setSorts(sorts.filter((_, j) => j !== i))}><Text style={{ color: '#d1d5db', fontSize: 14 }}>×</Text></TouchableOpacity>}
          </View>
        ))}
        {!ro && <TouchableOpacity onPress={() => setShowSF(true)} style={{ paddingVertical: 6 }}><Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '600' }}>+ 添加排序</Text></TouchableOpacity>}
        {sorts.length === 0 && ro && <Text style={{ fontSize: 12, color: '#9ca3af' }}>无</Text>}

        {/* Toggles — compact row */}
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>导航栏</Text>
            <Switch value={nav} onValueChange={(v) => !ro && setNav(v)} disabled={ro}
              trackColor={{ false: '#e5e7eb', true: Colors.primary + '60' }} thumbColor={nav ? Colors.primary : '#f4f3f4'} />
          </View>
          <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#e5e7eb' }}>
            <Text style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>跟随项目</Text>
            <Switch value={follow} onValueChange={(v) => !ro && setFollow(v)} disabled={ro}
              trackColor={{ false: '#e5e7eb', true: Colors.primary + '60' }} thumbColor={follow ? Colors.primary : '#f4f3f4'} />
          </View>
        </View>

        {/* Delete */}
        {!ro && (
          <TouchableOpacity onPress={() => setShowDel(true)} style={{ marginTop: 24, paddingVertical: 12, backgroundColor: '#fef2f2', borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#ef4444' }}>删除视图</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ActionSheet visible={showPP} title="选择项目" options={[{ label: '不关联', value: '__none__', icon: '📥' }, ...projects.map((p) => ({ label: p.name, value: p.uid, icon: '📁' }))]}
        onSelect={(o) => { setPUid(o.value === '__none__' ? null : o.value as string); setShowPP(false); }} onCancel={() => setShowPP(false)} />
      <ActionSheet visible={showSF} title="排序字段" options={SORT_FIELDS.map((f) => ({ label: f.l, value: f.k }))}
        onSelect={(o) => { setSorts([...sorts, { field: o.value as string, direction: 'asc' }]); setShowSF(false); }} onCancel={() => setShowSF(false)} />
      <ActionSheet visible={showGB} title="分组方式" options={GROUP_OPTS.map((o) => ({ label: o.l, value: o.k }))}
        onSelect={(o) => { setGb(o.value as string); setShowGB(false); }} onCancel={() => setShowGB(false)} />
      <ConfirmDialog visible={showDel} title="删除视图" message={`确认删除「${view?.name}」？`}
        confirmText="删除" destructive onConfirm={async () => { try { await deleteView.mutateAsync(uid); showToast('success', '已删除'); router.back(); } catch { showToast('error', '失败'); } }}
        onCancel={() => setShowDel(false)} />
    </SafeAreaView>
  );
}
