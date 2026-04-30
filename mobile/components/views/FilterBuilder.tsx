import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActionSheet } from '../ui/ActionSheet';
import { useTheme } from '../../hooks/useTheme';
import { Colors } from '../../constants/theme';
import type { ViewFilter } from '../../shared/types/index';
import { TaskStatus, TaskPriority } from '../../shared/types/index';

// ===== Field definitions (matching web) =====
interface FieldDef {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'datetime' | 'boolean' | 'relation' | 'multiselect';
  options?: { value: any; label: string }[];
}

const FIELDS: FieldDef[] = [
  { key: 'status', label: '状态', type: 'select', options: [
    { value: TaskStatus.UNASSIGNED, label: '待分配' }, { value: TaskStatus.TODO, label: '待办' },
    { value: TaskStatus.COMPLETED, label: '已完成' }, { value: TaskStatus.ABANDONED, label: '已放弃' },
  ]},
  { key: 'priority', label: '优先级', type: 'select', options: [
    { value: TaskPriority.LOW, label: '低' }, { value: TaskPriority.MEDIUM, label: '中' },
    { value: TaskPriority.HIGH, label: '高' }, { value: TaskPriority.URGENT, label: '紧急' },
  ]},
  { key: 'title', label: '标题', type: 'text' },
  { key: 'content', label: '内容', type: 'text' },
  { key: 'due_date', label: '截止日期', type: 'date' },
  { key: 'start_date', label: '开始日期', type: 'date' },
  { key: 'created_at', label: '创建时间', type: 'datetime' },
  { key: 'updated_at', label: '更新时间', type: 'datetime' },
  { key: 'is_completed', label: '是否完成', type: 'boolean' },
  { key: 'is_overdue', label: '是否逾期', type: 'boolean' },
  { key: 'tags__name', label: '标签', type: 'multiselect' },
  { key: 'project__name', label: '项目', type: 'relation' },
];

// ===== Operator definitions by field type =====
interface OpDef { key: string; label: string; needsValue: boolean; }

const OPS_BY_TYPE: Record<string, OpDef[]> = {
  select: [
    { key: 'equals', label: '等于', needsValue: true },
    { key: 'not_equals', label: '不等于', needsValue: true },
    { key: 'in', label: '属于', needsValue: true },
    { key: 'not_in', label: '不属于', needsValue: true },
  ],
  text: [
    { key: 'equals', label: '等于', needsValue: true },
    { key: 'not_equals', label: '不等于', needsValue: true },
    { key: 'contains', label: '包含', needsValue: true },
    { key: 'not_contains', label: '不包含', needsValue: true },
    { key: 'starts_with', label: '开头是', needsValue: true },
    { key: 'is_empty', label: '为空', needsValue: false },
    { key: 'is_not_empty', label: '不为空', needsValue: false },
  ],
  date: [
    { key: 'is_today', label: '今天', needsValue: false },
    { key: 'is_yesterday', label: '昨天', needsValue: false },
    { key: 'is_tomorrow', label: '明天', needsValue: false },
    { key: 'is_this_week', label: '本周', needsValue: false },
    { key: 'is_last_week', label: '上周', needsValue: false },
    { key: 'is_next_week', label: '下周', needsValue: false },
    { key: 'is_this_month', label: '本月', needsValue: false },
    { key: 'is_overdue', label: '已逾期', needsValue: false },
    { key: 'has_no_date', label: '无日期', needsValue: false },
    { key: 'greater_than', label: '晚于', needsValue: true },
    { key: 'less_than', label: '早于', needsValue: true },
  ],
  datetime: [
    { key: 'is_today', label: '今天', needsValue: false },
    { key: 'is_this_week', label: '本周', needsValue: false },
    { key: 'is_this_month', label: '本月', needsValue: false },
    { key: 'is_empty', label: '为空', needsValue: false },
    { key: 'is_not_empty', label: '不为空', needsValue: false },
  ],
  boolean: [
    { key: 'is_true', label: '是', needsValue: false },
    { key: 'is_false', label: '否', needsValue: false },
  ],
  relation: [
    { key: 'equals', label: '等于', needsValue: true },
    { key: 'not_equals', label: '不等于', needsValue: true },
    { key: 'contains', label: '包含', needsValue: true },
    { key: 'is_empty', label: '为空', needsValue: false },
    { key: 'is_not_empty', label: '不为空', needsValue: false },
  ],
  multiselect: [
    { key: 'contains', label: '包含', needsValue: true },
    { key: 'not_contains', label: '不包含', needsValue: true },
    { key: 'is_empty', label: '为空', needsValue: false },
    { key: 'is_not_empty', label: '不为空', needsValue: false },
  ],
};

function getField(key: string): FieldDef | undefined { return FIELDS.find((f) => f.key === key); }
function getOps(fieldKey: string): OpDef[] {
  const f = getField(fieldKey);
  return f ? (OPS_BY_TYPE[f.type] || []) : [];
}
function getOpDef(fieldKey: string, opKey: string): OpDef | undefined {
  return getOps(fieldKey).find((o) => o.key === opKey);
}

function valLabel(fieldKey: string, val: any): string {
  if (val === null || val === undefined) return '';
  const f = getField(fieldKey);
  if (f?.options) {
    if (Array.isArray(val)) return val.map((v) => f.options!.find((o) => o.value === v)?.label || v).join(', ');
    return f.options.find((o) => String(o.value) === String(val))?.label || String(val);
  }
  return String(val);
}

interface Props { filters: ViewFilter[]; onChange: (f: ViewFilter[]) => void; }

export const FilterBuilder: React.FC<Props> = ({ filters, onChange }) => {
  const { colors } = useTheme();
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showOpPicker, setShowOpPicker] = useState(false);
  const [showValPicker, setShowValPicker] = useState(false);
  const [textInputVal, setTextInputVal] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);

  const addFilter = (fieldKey: string) => {
    const ops = getOps(fieldKey);
    const defaultOp = ops[0];
    const f = getField(fieldKey);
    // For select fields with equals, default to first option
    let defaultVal: any = null;
    if (defaultOp?.needsValue && f?.options?.length) {
      defaultVal = f.options[0].value;
    }
    onChange([...filters, { id: `f_${Date.now()}`, field: fieldKey, operator: defaultOp?.key || 'equals', value: defaultVal, logic: 'and' }]);
    setShowFieldPicker(false);
  };

  const update = (idx: number, u: Partial<ViewFilter>) => {
    const n = [...filters]; n[idx] = { ...n[idx], ...u }; onChange(n);
  };

  const openOpPicker = (idx: number) => { setEditIdx(idx); setShowOpPicker(true); };
  const openValPicker = (idx: number) => {
    const f = filters[idx];
    const field = getField(f.field);
    if (field?.options) {
      setEditIdx(idx); setShowValPicker(true);
    } else if (field?.type === 'text' || field?.type === 'relation' || field?.type === 'multiselect') {
      setEditIdx(idx); setTextInputVal(f.value || ''); setShowTextInput(true);
    } else if (field?.type === 'date' || field?.type === 'datetime') {
      setEditIdx(idx); setTextInputVal(f.value || ''); setShowTextInput(true);
    }
  };

  const curFilter = editIdx !== null ? filters[editIdx] : null;
  const curOps = curFilter ? getOps(curFilter.field) : [];
  const curField = curFilter ? getField(curFilter.field) : null;

  return (
    <View>
      {filters.map((f, idx) => {
        const field = getField(f.field);
        const opDef = getOpDef(f.field, f.operator);
        const needsVal = opDef?.needsValue ?? false;
        const hasVal = f.value !== null && f.value !== undefined && f.value !== '';

        return (
          <View key={f.id || idx} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', backgroundColor: colors.background.secondary, borderRadius: 10, padding: 8, marginBottom: 6, gap: 4 }}>
            {idx > 0 && <Text style={{ fontSize: 10, color: colors.text.muted, fontWeight: '600', marginRight: 2 }}>且</Text>}
            {/* Field */}
            <TouchableOpacity onPress={() => { setEditIdx(idx); setShowFieldPicker(true); }}
              style={{ backgroundColor: '#e0e7ff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 12, color: '#4338ca', fontWeight: '500' }}>{field?.label || f.field}</Text>
            </TouchableOpacity>
            {/* Operator */}
            <TouchableOpacity onPress={() => openOpPicker(idx)}
              style={{ backgroundColor: '#dbeafe', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 12, color: '#1d4ed8', fontWeight: '500' }}>{opDef?.label || f.operator}</Text>
            </TouchableOpacity>
            {/* Value — show if operator needs value */}
            {needsVal && (
              <TouchableOpacity onPress={() => openValPicker(idx)}
                style={{ backgroundColor: hasVal ? '#fef3c7' : '#fee2e2', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                <Text style={{ fontSize: 12, color: hasVal ? '#92400e' : '#dc2626', fontWeight: '500' }}>
                  {hasVal ? valLabel(f.field, f.value) : '选择值'}
                </Text>
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => onChange(filters.filter((_, i) => i !== idx))} style={{ padding: 4 }}>
              <MaterialCommunityIcons name="close-circle" size={16} color={colors.text.muted} />
            </TouchableOpacity>
          </View>
        );
      })}

      <TouchableOpacity onPress={() => { setEditIdx(null); setShowFieldPicker(true); }} style={{ paddingVertical: 6 }}>
        <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '600' }}>+ 添加筛选条件</Text>
      </TouchableOpacity>

      {/* Field picker */}
      <ActionSheet visible={showFieldPicker} title="选择字段"
        options={FIELDS.map((f) => ({ label: f.label, value: f.key }))}
        onSelect={(opt) => {
          if (editIdx !== null) {
            const ops = getOps(opt.value as string);
            const field = getField(opt.value as string);
            let defaultVal: any = null;
            if (ops[0]?.needsValue && field?.options?.length) defaultVal = field.options[0].value;
            update(editIdx, { field: opt.value as string, operator: ops[0]?.key || 'equals', value: defaultVal });
          } else {
            addFilter(opt.value as string);
          }
          setShowFieldPicker(false); setEditIdx(null);
        }}
        onCancel={() => { setShowFieldPicker(false); setEditIdx(null); }} />

      {/* Operator picker */}
      <ActionSheet visible={showOpPicker} title="选择条件"
        options={curOps.map((o) => ({ label: o.label, value: o.key }))}
        onSelect={(opt) => {
          if (editIdx !== null) {
            const opDef = curOps.find((o) => o.key === opt.value);
            if (opDef?.needsValue) {
              update(editIdx, { operator: opt.value as string });
              setShowOpPicker(false);
              // Auto-open value picker if no value set
              const f = filters[editIdx];
              if (f.value === null || f.value === undefined || f.value === '') {
                setTimeout(() => openValPicker(editIdx), 100);
              } else {
                setEditIdx(null);
              }
            } else {
              update(editIdx, { operator: opt.value as string, value: null });
              setShowOpPicker(false); setEditIdx(null);
            }
          }
        }}
        onCancel={() => { setShowOpPicker(false); setEditIdx(null); }} />

      {/* Value picker — for select fields */}
      <ActionSheet visible={showValPicker} title="选择值"
        options={curField?.options?.map((o) => ({ label: o.label, value: String(o.value) })) || []}
        onSelect={(opt) => {
          if (editIdx !== null) {
            // For 'in'/'not_in' operators, store as array
            const f = filters[editIdx];
            if (f.operator === 'in' || f.operator === 'not_in') {
              const current = Array.isArray(f.value) ? f.value : [];
              const numVal = Number(opt.value);
              const val = isNaN(numVal) ? opt.value : numVal;
              const newVal = current.includes(val) ? current.filter((v: any) => v !== val) : [...current, val];
              update(editIdx, { value: newVal.length > 0 ? newVal : null });
            } else {
              const numVal = Number(opt.value);
              update(editIdx, { value: isNaN(numVal) ? opt.value : numVal });
            }
          }
          setShowValPicker(false); setEditIdx(null);
        }}
        onCancel={() => { setShowValPicker(false); setEditIdx(null); }} />

      {/* Text input for text/relation/date fields */}
      {showTextInput && editIdx !== null && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 20, zIndex: 100 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 12 }}>输入值</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, color: colors.text.primary, backgroundColor: colors.background.secondary }}
              value={textInputVal}
              onChangeText={setTextInputVal}
              autoFocus
              placeholder="输入筛选值..."
              placeholderTextColor={colors.text.muted}
            />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
              <TouchableOpacity onPress={() => { setShowTextInput(false); setEditIdx(null); }}
                style={{ flex: 1, paddingVertical: 10, backgroundColor: colors.background.tertiary, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, color: colors.text.secondary }}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => {
                if (editIdx !== null) update(editIdx, { value: textInputVal || null });
                setShowTextInput(false); setEditIdx(null);
              }} style={{ flex: 1, paddingVertical: 10, backgroundColor: Colors.primary, borderRadius: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>确定</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};
