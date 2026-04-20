import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ActionSheet } from '../ui/ActionSheet';
import { Colors } from '../../constants/theme';
import type { ViewFilter } from '../../shared/types/index';

const FIELDS = [
  { key: 'status', label: '状态' },
  { key: 'priority', label: '优先级' },
  { key: 'due_date', label: '截止日期' },
  { key: 'start_date', label: '开始日期' },
  { key: 'is_overdue', label: '是否逾期' },
  { key: 'is_completed', label: '是否完成' },
];

const OPS: Record<string, { key: string; label: string; needsValue: boolean }[]> = {
  status: [
    { key: 'eq', label: '等于', needsValue: true },
    { key: 'neq', label: '不等于', needsValue: true },
  ],
  priority: [
    { key: 'eq', label: '等于', needsValue: true },
    { key: 'neq', label: '不等于', needsValue: true },
    { key: 'gte', label: '大于等于', needsValue: true },
  ],
  due_date: [
    { key: 'is_today', label: '今天', needsValue: false },
    { key: 'is_tomorrow', label: '明天', needsValue: false },
    { key: 'is_this_week', label: '本周', needsValue: false },
    { key: 'is_next_week', label: '下周', needsValue: false },
    { key: 'is_overdue', label: '已逾期', needsValue: false },
    { key: 'has_no_date', label: '无日期', needsValue: false },
  ],
  start_date: [
    { key: 'is_today', label: '今天', needsValue: false },
    { key: 'is_this_week', label: '本周', needsValue: false },
    { key: 'has_no_date', label: '无日期', needsValue: false },
  ],
  is_overdue: [
    { key: 'is_true', label: '是', needsValue: false },
    { key: 'is_false', label: '否', needsValue: false },
  ],
  is_completed: [
    { key: 'is_true', label: '是', needsValue: false },
    { key: 'is_false', label: '否', needsValue: false },
  ],
};

const STATUS_VALS = [
  { key: '0', label: '待分配' }, { key: '1', label: '待办' },
  { key: '2', label: '已完成' }, { key: '3', label: '已放弃' },
];
const PRIORITY_VALS = [
  { key: '0', label: '低' }, { key: '1', label: '中' },
  { key: '2', label: '高' }, { key: '3', label: '紧急' },
];

interface Props { filters: ViewFilter[]; onChange: (f: ViewFilter[]) => void; }

export const FilterBuilder: React.FC<Props> = ({ filters, onChange }) => {
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showOpPicker, setShowOpPicker] = useState(false);
  const [showValPicker, setShowValPicker] = useState(false);

  const fieldLabel = (k: string) => FIELDS.find((f) => f.key === k)?.label || k;
  const opLabel = (field: string, op: string) => (OPS[field] || []).find((o) => o.key === op)?.label || op;
  const valLabel = (field: string, val: any) => {
    if (val === null || val === undefined) return '';
    if (field === 'status') return STATUS_VALS.find((v) => v.key === String(val))?.label || val;
    if (field === 'priority') return PRIORITY_VALS.find((v) => v.key === String(val))?.label || val;
    return String(val);
  };

  const addFilter = (fieldKey: string) => {
    const ops = OPS[fieldKey] || [];
    onChange([...filters, { id: `f_${Date.now()}`, field: fieldKey, operator: ops[0]?.key || 'eq', value: null, logic: 'and' }]);
    setShowFieldPicker(false);
  };

  const update = (idx: number, u: Partial<ViewFilter>) => {
    const n = [...filters]; n[idx] = { ...n[idx], ...u }; onChange(n);
  };

  const curFilter = editIdx !== null ? filters[editIdx] : null;
  const curOps = curFilter ? (OPS[curFilter.field] || []) : [];
  const curNeedsVal = curFilter ? curOps.find((o) => o.key === curFilter.operator)?.needsValue : false;

  return (
    <View>
      {filters.map((f, idx) => (
        <View key={f.id || idx} style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', backgroundColor: '#f9fafb', borderRadius: 10, padding: 8, marginBottom: 6, gap: 4 }}>
          {idx > 0 && <Text style={{ fontSize: 10, color: '#9ca3af', fontWeight: '600', marginRight: 2 }}>且</Text>}
          {/* Field chip */}
          <TouchableOpacity onPress={() => { setEditIdx(idx); setShowFieldPicker(true); }}
            style={{ backgroundColor: '#e0e7ff', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 12, color: '#4338ca', fontWeight: '500' }}>{fieldLabel(f.field)}</Text>
          </TouchableOpacity>
          {/* Operator chip */}
          <TouchableOpacity onPress={() => { setEditIdx(idx); setShowOpPicker(true); }}
            style={{ backgroundColor: '#dbeafe', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
            <Text style={{ fontSize: 12, color: '#1d4ed8', fontWeight: '500' }}>{opLabel(f.field, f.operator)}</Text>
          </TouchableOpacity>
          {/* Value chip */}
          {f.value !== null && f.value !== undefined && (
            <TouchableOpacity onPress={() => { setEditIdx(idx); setShowValPicker(true); }}
              style={{ backgroundColor: '#fef3c7', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
              <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '500' }}>{valLabel(f.field, f.value)}</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => onChange(filters.filter((_, i) => i !== idx))} style={{ padding: 4 }}>
            <Text style={{ color: '#d1d5db', fontSize: 14, fontWeight: '700' }}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity onPress={() => { setEditIdx(null); setShowFieldPicker(true); }} style={{ paddingVertical: 6 }}>
        <Text style={{ color: Colors.primary, fontSize: 12, fontWeight: '600' }}>+ 添加筛选条件</Text>
      </TouchableOpacity>

      {/* Field picker — for adding new or changing existing */}
      <ActionSheet visible={showFieldPicker} title="选择字段"
        options={FIELDS.map((f) => ({ label: f.label, value: f.key }))}
        onSelect={(opt) => {
          if (editIdx !== null) {
            // Changing field of existing filter
            const ops = OPS[opt.value as string] || [];
            update(editIdx, { field: opt.value as string, operator: ops[0]?.key || 'eq', value: null });
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
            const needsVal = curOps.find((o) => o.key === opt.value)?.needsValue;
            update(editIdx, { operator: opt.value as string, value: needsVal ? filters[editIdx].value : null });
            if (needsVal && (filters[editIdx].value === null || filters[editIdx].value === undefined)) {
              setShowOpPicker(false); setShowValPicker(true);
            } else {
              setShowOpPicker(false); setEditIdx(null);
            }
          }
        }}
        onCancel={() => { setShowOpPicker(false); setEditIdx(null); }} />

      {/* Value picker */}
      <ActionSheet visible={showValPicker} title="选择值"
        options={
          curFilter?.field === 'status' ? STATUS_VALS.map((v) => ({ label: v.label, value: v.key }))
          : curFilter?.field === 'priority' ? PRIORITY_VALS.map((v) => ({ label: v.label, value: v.key }))
          : []
        }
        onSelect={(opt) => {
          if (editIdx !== null) update(editIdx, { value: opt.value });
          setShowValPicker(false); setEditIdx(null);
        }}
        onCancel={() => { setShowValPicker(false); setEditIdx(null); }} />
    </View>
  );
};
