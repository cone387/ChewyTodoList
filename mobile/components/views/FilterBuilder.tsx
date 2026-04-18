import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ActionSheet } from '../ui/ActionSheet';
import { Colors } from '../../constants/theme';
import type { ViewFilter } from '../../shared/types/index';

const FILTER_FIELDS = [
  { key: 'status', label: '状态' },
  { key: 'priority', label: '优先级' },
  { key: 'due_date', label: '截止日期' },
  { key: 'start_date', label: '开始日期' },
  { key: 'is_overdue', label: '是否逾期' },
  { key: 'is_completed', label: '是否完成' },
];

const OPERATORS: Record<string, { key: string; label: string; needsValue: boolean }[]> = {
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

const STATUS_VALUES = [
  { key: '0', label: '待分配' },
  { key: '1', label: '待办' },
  { key: '2', label: '已完成' },
  { key: '3', label: '已放弃' },
];

const PRIORITY_VALUES = [
  { key: '0', label: '低' },
  { key: '1', label: '中' },
  { key: '2', label: '高' },
  { key: '3', label: '紧急' },
];

interface FilterBuilderProps {
  filters: ViewFilter[];
  onChange: (filters: ViewFilter[]) => void;
}

export const FilterBuilder: React.FC<FilterBuilderProps> = ({ filters, onChange }) => {
  const [showFieldPicker, setShowFieldPicker] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showOperatorPicker, setShowOperatorPicker] = useState(false);
  const [showValuePicker, setShowValuePicker] = useState(false);

  const addFilter = (fieldKey: string) => {
    const ops = OPERATORS[fieldKey] || [];
    const defaultOp = ops[0];
    const newFilter: ViewFilter = {
      id: `filter_${Date.now()}`,
      field: fieldKey,
      operator: defaultOp?.key || 'eq',
      value: null,
      logic: 'and',
    };
    onChange([...filters, newFilter]);
    setShowFieldPicker(false);
  };

  const updateFilter = (index: number, updates: Partial<ViewFilter>) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], ...updates };
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    onChange(filters.filter((_, i) => i !== index));
  };

  const getFieldLabel = (key: string) => FILTER_FIELDS.find((f) => f.key === key)?.label || key;
  const getOperatorLabel = (field: string, op: string) => {
    const ops = OPERATORS[field] || [];
    return ops.find((o) => o.key === op)?.label || op;
  };
  const getValueLabel = (field: string, value: any) => {
    if (value === null || value === undefined) return '';
    if (field === 'status') return STATUS_VALUES.find((v) => v.key === String(value))?.label || value;
    if (field === 'priority') return PRIORITY_VALUES.find((v) => v.key === String(value))?.label || value;
    return String(value);
  };

  const currentFilter = editingIndex !== null ? filters[editingIndex] : null;
  const currentOps = currentFilter ? (OPERATORS[currentFilter.field] || []) : [];
  const currentOpNeedsValue = currentFilter ? currentOps.find((o) => o.key === currentFilter.operator)?.needsValue : false;

  return (
    <View>
      {/* Filter list */}
      {filters.map((filter, idx) => (
        <View
          key={filter.id || idx}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f9fafb',
            borderRadius: 10,
            padding: 10,
            marginBottom: 8,
            gap: 6,
          }}
        >
          {idx > 0 && (
            <Text style={{ fontSize: 11, color: '#9ca3af', fontWeight: '600' }}>且</Text>
          )}
          <TouchableOpacity
            style={{ backgroundColor: '#e0e7ff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}
            onPress={() => { setEditingIndex(idx); setShowOperatorPicker(true); }}
          >
            <Text style={{ fontSize: 12, color: '#4338ca', fontWeight: '500' }}>{getFieldLabel(filter.field)}</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 12, color: '#6b7280' }}>{getOperatorLabel(filter.field, filter.operator)}</Text>
          {filter.value !== null && filter.value !== undefined && (
            <TouchableOpacity
              style={{ backgroundColor: '#fef3c7', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}
              onPress={() => { setEditingIndex(idx); setShowValuePicker(true); }}
            >
              <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '500' }}>{getValueLabel(filter.field, filter.value)}</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => removeFilter(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ color: '#d1d5db', fontSize: 16 }}>×</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Add filter button */}
      <TouchableOpacity
        style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 8 }}
        onPress={() => setShowFieldPicker(true)}
      >
        <Text style={{ color: Colors.primary, fontSize: 13, fontWeight: '600' }}>+ 添加筛选条件</Text>
      </TouchableOpacity>

      {/* Field picker */}
      <ActionSheet
        visible={showFieldPicker}
        title="选择筛选字段"
        options={FILTER_FIELDS.map((f) => ({ label: f.label, value: f.key }))}
        onSelect={(opt) => addFilter(opt.value as string)}
        onCancel={() => setShowFieldPicker(false)}
      />

      {/* Operator picker */}
      <ActionSheet
        visible={showOperatorPicker}
        title="选择条件"
        options={currentOps.map((o) => ({ label: o.label, value: o.key }))}
        onSelect={(opt) => {
          if (editingIndex !== null) {
            const needsValue = currentOps.find((o) => o.key === opt.value)?.needsValue;
            updateFilter(editingIndex, { operator: opt.value as string, value: needsValue ? filters[editingIndex].value : null });
            if (needsValue) {
              setShowOperatorPicker(false);
              setShowValuePicker(true);
            } else {
              setShowOperatorPicker(false);
              setEditingIndex(null);
            }
          }
        }}
        onCancel={() => { setShowOperatorPicker(false); setEditingIndex(null); }}
      />

      {/* Value picker */}
      <ActionSheet
        visible={showValuePicker}
        title="选择值"
        options={
          currentFilter?.field === 'status'
            ? STATUS_VALUES.map((v) => ({ label: v.label, value: v.key }))
            : currentFilter?.field === 'priority'
            ? PRIORITY_VALUES.map((v) => ({ label: v.label, value: v.key }))
            : []
        }
        onSelect={(opt) => {
          if (editingIndex !== null) {
            updateFilter(editingIndex, { value: opt.value });
          }
          setShowValuePicker(false);
          setEditingIndex(null);
        }}
        onCancel={() => { setShowValuePicker(false); setEditingIndex(null); }}
      />
    </View>
  );
};
