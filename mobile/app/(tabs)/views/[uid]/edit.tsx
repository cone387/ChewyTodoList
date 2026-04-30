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
import { useTheme } from '../../../../hooks/useTheme';
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
const SF = [
  { k: 'created_at', l: '创建时间' }, { k: 'updated_at', l: '更新时间' },
  { k: 'due_date', l: '截止日期' }, { k: 'priority', l: '优先级' },
  { k: 'status', l: '状态' }, { k: 'title', l: '标题' }, { k: 'sort_order', l: '自定义' },
];
const GO = [
  { k: '', l: '不分组' }, { k: 'status', l: '状态' }, { k: 'priority', l: '优先级' },
  { k: 'project', l: '项目' }, { k: 'tags', l: '标签' }, { k: 'due_date', l: '截止日期' },
];
const DF = [
  { k: 'show_project' as const, l: '项目' }, { k: 'show_tags' as const, l: '标签' },
  { k: 'show_due_date' as const, l: '日期' }, { k: 'show_priority' as const, l: '优先级' },
  { k: 'show_status' as const, l: '状态' }, { k: 'show_completed' as const, l: '已完成' },
  { k: 'compact_mode' as const, l: '紧凑' },
];
// Label maps for read-only display
const FIELD_L: Record<string, string> = { status: '状态', priority: '优先级', due_date: '截止日期', start_date: '开始日期', is_overdue: '逾期', is_completed: '完成', title: '标题', content: '内容', tags__name: '标签', project__name: '项目', created_at: '创建时间', updated_at: '更新时间' };
const OP_L: Record<string, string> = { eq: '等于', neq: '不等于', gte: '≥', equals: '等于', not_equals: '不等于', in: '包含', is_today: '今天', is_tomorrow: '明天', is_this_week: '本周', is_next_week: '下周', is_overdue: '已逾期', has_no_date: '无日期', is_true: '是', is_false: '否', is_this_month: '本月', is_yesterday: '昨天' };
const VAL_L: Record<string, Record<string, string>> = {
  status: { '0': '待分配', '1': '待办', '2': '已完成', '3': '已放弃' },
  priority: { '0': '低', '1': '中', '2': '高', '3': '紧急' },
};

type DS = { show_project: boolean; show_tags: boolean; show_due_date: boolean; show_priority: boolean; show_status: boolean; compact_mode: boolean; show_completed: boolean };

function fmtVal(field: string, val: any): string {
  if (val === null || val === undefined) return '';
  if (Array.isArray(val)) return val.map((v) => fmtVal(field, v)).join(',');
  const m = VAL_L[field];
  if (m && m[String(val)]) return m[String(val)];
  return String(val);
}

export default function EditViewPage() {
  const { colors } = useTheme();
  const boxStyle = {
    backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: colors.border, flexDirection: 'row' as const, alignItems: 'center' as const,
  };
  const { uid } = useLocalSearchParams<{ uid: string }>();
  const { data: view, isLoading } = useView(uid);
  const updateView = useUpdateView();
  const deleteView = useDeleteView();
  const { data: pd } = useProjects();
  const { showToast } = useToast();
  const projects: Project[] = (pd as Project[]) || [];
  const ro = !!view?.is_system;

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

  if (isLoading) return <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  const proj = projects.find((p) => p.uid === pUid);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background.secondary }}>
      {/* Header */}
      <View style={{ backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderLight, flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}><Text style={{ color: Colors.primary, fontSize: 15 }}>返回</Text></TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}><Text style={{ fontSize: 16, fontWeight: '600', color: colors.text.primary }}>{ro ? '查看视图' : '编辑视图'}</Text></View>
        {!ro && <TouchableOpacity onPress={save} disabled={saving} style={{ paddingHorizontal: 12, paddingVertical: 5, backgroundColor: Colors.primary, borderRadius: 8, opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#fff" size="small" /> : <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>保存</Text>}
        </TouchableOpacity>}
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 16 }}>
        {/* Row 1: Name + Nav toggle on same line */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 }}>
          <TextInput style={{ flex: 1, backgroundColor: colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16, color: colors.text.primary, borderWidth: 1, borderColor: colors.border }}
            placeholder="视图名称" placeholderTextColor={colors.text.muted} value={name} onChangeText={setName} editable={!ro} />
          <TouchableOpacity onPress={() => !ro && setNav(!nav)} disabled={ro}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10,
              backgroundColor: nav ? Colors.primary + '14' : '#f3f4f6', borderWidth: 1, borderColor: nav ? Colors.primary + '30' : '#e5e7eb' }}>
            <MaterialCommunityIcons name={nav ? 'eye' : 'eye-off'} size={16} color={nav ? Colors.primary : colors.text.muted} />
            <Text style={{ fontSize: 12, fontWeight: '600', color: nav ? Colors.primary : colors.text.muted }}>导航栏</Text>
          </TouchableOpacity>
        </View>

        {/* View type — compact horizontal chips */}
        <Lbl text="类型" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {VT.map((t) => (
            <TouchableOpacity key={t.v} disabled={ro} onPress={() => setVt(t.v)}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 8,
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16,
                backgroundColor: vt === t.v ? Colors.primary : '#f3f4f6' }}>
              <MaterialCommunityIcons name={t.i as any} size={14} color={vt === t.v ? '#fff' : colors.text.secondary} />
              <Text style={{ fontSize: 13, fontWeight: vt === t.v ? '600' : '400', color: vt === t.v ? '#fff' : colors.text.secondary }}>{t.l}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Project + Group — two columns */}
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
          <View style={{ flex: 1 }}>
            <Lbl text="项目" />
            <TouchableOpacity onPress={() => !ro && setShowPP(true)} disabled={ro}
              style={boxStyle}>
              <Text style={{ flex: 1, fontSize: 13, color: follow ? Colors.primary : (proj ? '#374151' : colors.text.muted) }} numberOfLines={1}>
                {follow ? '跟随主页选择' : (proj?.name || '不关联')}
              </Text>
              {!ro && <MaterialCommunityIcons name="chevron-down" size={14} color="#9ca3af" />}
            </TouchableOpacity>
          </View>
          <View style={{ flex: 1 }}>
            <Lbl text="分组" />
            <TouchableOpacity onPress={() => !ro && setShowGB(true)} disabled={ro} style={boxStyle}>
              <Text style={{ flex: 1, fontSize: 13, color: gb ? '#374151' : colors.text.muted }} numberOfLines={1}>{GO.find((o) => o.k === gb)?.l || '不分组'}</Text>
              {!ro && <MaterialCommunityIcons name="chevron-down" size={14} color="#9ca3af" />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Display fields — toggle chips */}
        <Lbl text="显示字段" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {DF.map((f) => {
            const on = ds[f.k];
            return (
              <TouchableOpacity key={f.k} disabled={ro} onPress={() => setDs({ ...ds, [f.k]: !on })}
                style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14,
                  backgroundColor: on ? Colors.primary + '14' : '#f3f4f6',
                  borderWidth: 1, borderColor: on ? Colors.primary + '30' : 'transparent' }}>
                <Text style={{ fontSize: 12, color: on ? Colors.primary : colors.text.muted, fontWeight: on ? '600' : '400' }}>{f.l}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Sorts — horizontal chips */}
        <Lbl text="排序" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {sorts.map((s, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', borderRadius: 14, paddingLeft: 8, paddingRight: ro ? 8 : 2, paddingVertical: 3, gap: 4 }}>
              <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '500' }}>{SF.find((f) => f.k === s.field)?.l || s.field}</Text>
              <TouchableOpacity onPress={() => { if (ro) return; const n = [...sorts]; n[i] = { ...n[i], direction: n[i].direction === 'asc' ? 'desc' : 'asc' }; setSorts(n); }} disabled={ro}>
                <MaterialCommunityIcons name={s.direction === 'asc' ? 'arrow-up' : 'arrow-down'} size={14} color="#92400e" />
              </TouchableOpacity>
              {!ro && <TouchableOpacity onPress={() => setSorts(sorts.filter((_, j) => j !== i))} style={{ padding: 2 }}>
                <MaterialCommunityIcons name="close-circle" size={14} color="#d4a574" />
              </TouchableOpacity>}
            </View>
          ))}
          {!ro && <TouchableOpacity onPress={() => setShowSF(true)} style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 14, backgroundColor: colors.background.tertiary }}>
            <Text style={{ fontSize: 12, color: Colors.primary, fontWeight: '600' }}>+ 排序</Text>
          </TouchableOpacity>}
          {sorts.length === 0 && ro && <Text style={{ fontSize: 12, color: colors.text.muted }}>无</Text>}
        </View>

        {/* Filters */}
        <Lbl text="筛选条件" />
        <View style={{ backgroundColor: colors.card, borderRadius: 10, padding: 10, borderWidth: 1, borderColor: colors.border }}>
          {ro ? (
            filters.length > 0 ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {filters.map((f, i) => (
                  <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#e0e7ff', borderRadius: 14, paddingHorizontal: 8, paddingVertical: 3 }}>
                    {i > 0 && <Text style={{ fontSize: 10, color: colors.text.secondary }}>且</Text>}
                    <Text style={{ fontSize: 11, color: '#4338ca', fontWeight: '500' }}>{FIELD_L[f.field] || f.field}</Text>
                    <Text style={{ fontSize: 11, color: colors.text.secondary }}>{OP_L[f.operator] || f.operator}</Text>
                    {f.value !== null && f.value !== undefined && <Text style={{ fontSize: 11, color: '#92400e', fontWeight: '500' }}>{fmtVal(f.field, f.value)}</Text>}
                  </View>
                ))}
              </View>
            ) : <Text style={{ fontSize: 12, color: colors.text.muted }}>无</Text>
          ) : <FilterBuilder filters={filters} onChange={setFilters} />}
        </View>

        {/* Delete */}
        {!ro && (
          <TouchableOpacity onPress={() => setShowDel(true)} style={{ marginTop: 24, paddingVertical: 12, backgroundColor: '#fef2f2', borderRadius: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.error }}>删除视图</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <ActionSheet visible={showPP} title="选择项目" options={[
        { label: '跟随主页选择（默认）', value: '__follow__', icon: '🔄' },
        { label: '不关联项目', value: '__none__', icon: '📥' },
        ...projects.map((p) => ({ label: p.name, value: p.uid, icon: '📁' })),
      ]}
        onSelect={(o) => {
          if (o.value === '__follow__') { setFollow(true); setPUid(null); }
          else if (o.value === '__none__') { setFollow(false); setPUid(null); }
          else { setFollow(false); setPUid(o.value as string); }
          setShowPP(false);
        }} onCancel={() => setShowPP(false)} />
      <ActionSheet visible={showSF} title="排序字段" options={SF.map((f) => ({ label: f.l, value: f.k }))}
        onSelect={(o) => { setSorts([...sorts, { field: o.value as string, direction: 'asc' }]); setShowSF(false); }} onCancel={() => setShowSF(false)} />
      <ActionSheet visible={showGB} title="分组方式" options={GO.map((o) => ({ label: o.l, value: o.k }))}
        onSelect={(o) => { setGb(o.value as string); setShowGB(false); }} onCancel={() => setShowGB(false)} />
      <ConfirmDialog visible={showDel} title="删除视图" message={`确认删除「${view?.name}」？`}
        confirmText="删除" destructive onConfirm={async () => { try { await deleteView.mutateAsync(uid); showToast('success', '已删除'); router.back(); } catch { showToast('error', '失败'); } }}
        onCancel={() => setShowDel(false)} />
    </SafeAreaView>
  );
}

function Lbl({ text }: { text: string }) {
  const { colors } = useTheme();
  return <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.muted, marginTop: 14, marginBottom: 6 }}>{text}</Text>;
}
