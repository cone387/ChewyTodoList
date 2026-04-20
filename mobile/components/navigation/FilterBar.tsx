import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export interface FilterState {
  status?: number | null;
  priority?: number | null;
}

const STATUS_OPTIONS = [
  { value: null, label: '全部', icon: 'circle-outline' as const, color: '#6b7280' },
  { value: 0, label: '待分配', icon: 'circle-outline' as const, color: '#94a3b8' },
  { value: 1, label: '待办', icon: 'circle-half-full' as const, color: '#3b82f6' },
  { value: 2, label: '已完成', icon: 'check-circle' as const, color: '#22c55e' },
  { value: 3, label: '已放弃', icon: 'close-circle' as const, color: '#ef4444' },
];

const PRIORITY_OPTIONS = [
  { value: null, label: '全部', icon: 'flag-outline' as const, color: '#6b7280' },
  { value: 0, label: '低', icon: 'flag-outline' as const, color: '#94a3b8' },
  { value: 1, label: '中', icon: 'flag' as const, color: '#f59e0b' },
  { value: 2, label: '高', icon: 'flag' as const, color: '#f97316' },
  { value: 3, label: '紧急', icon: 'alert-decagram' as const, color: '#ef4444' },
];

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

/** Shows active filter chips with remove buttons */
export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange }) => {
  const statusLabel = STATUS_OPTIONS.find(o => o.value === filters.status)?.label;
  const priorityLabel = PRIORITY_OPTIONS.find(o => o.value === filters.priority)?.label;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ flexGrow: 0 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 6, gap: 8 }}
    >
      {filters.status != null && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: '#f3f4f6', borderRadius: 16,
          paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Text style={{ fontSize: 13, color: '#374151' }}>状态: {statusLabel}</Text>
          <TouchableOpacity onPress={() => onChange({ ...filters, status: null })}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      {filters.priority != null && (
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 4,
          backgroundColor: '#f3f4f6', borderRadius: 16,
          paddingHorizontal: 10, paddingVertical: 5,
        }}>
          <Text style={{ fontSize: 13, color: '#374151' }}>优先级: {priorityLabel}</Text>
          <TouchableOpacity onPress={() => onChange({ ...filters, priority: null })}>
            <MaterialCommunityIcons name="close-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={() => onChange({ status: null, priority: null })}
        style={{ paddingHorizontal: 8, paddingVertical: 5, justifyContent: 'center' }}
      >
        <Text style={{ fontSize: 13, color: '#ef4444' }}>清除</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

/** Full-screen filter modal — call from parent */
export const FilterModal: React.FC<{
  visible: boolean;
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onClose: () => void;
}> = ({ visible, filters, onChange, onClose }) => {
  const activeCount = (filters.status != null ? 1 : 0) + (filters.priority != null ? 1 : 0);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableWithoutFeedback>
            <View style={{
              backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
              paddingBottom: 34,
            }}>
              <View style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 4 }}>
                <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: '#d1d5db' }} />
              </View>

              <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <Text style={{ fontSize: 16, fontWeight: '600', color: '#111418' }}>筛选条件</Text>
                  {activeCount > 0 && (
                    <TouchableOpacity onPress={() => onChange({ status: null, priority: null })}>
                      <Text style={{ fontSize: 14, color: '#ef4444' }}>清除全部</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Status */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>状态</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {STATUS_OPTIONS.map((opt) => {
                    const active = filters.status === opt.value;
                    return (
                      <TouchableOpacity
                        key={String(opt.value)}
                        onPress={() => onChange({ ...filters, status: opt.value })}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          backgroundColor: active ? opt.color + '18' : '#f3f4f6',
                          borderWidth: 1,
                          borderColor: active ? opt.color + '40' : 'transparent',
                        }}
                      >
                        <MaterialCommunityIcons name={opt.icon} size={16} color={opt.color} />
                        <Text style={{ fontSize: 14, color: active ? opt.color : '#374151', fontWeight: active ? '600' : '400' }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Priority */}
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 }}>优先级</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                  {PRIORITY_OPTIONS.map((opt) => {
                    const active = filters.priority === opt.value;
                    return (
                      <TouchableOpacity
                        key={String(opt.value)}
                        onPress={() => onChange({ ...filters, priority: opt.value })}
                        style={{
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                          paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
                          backgroundColor: active ? opt.color + '18' : '#f3f4f6',
                          borderWidth: 1,
                          borderColor: active ? opt.color + '40' : 'transparent',
                        }}
                      >
                        <MaterialCommunityIcons name={opt.icon} size={16} color={opt.color} />
                        <Text style={{ fontSize: 14, color: active ? opt.color : '#374151', fontWeight: active ? '600' : '400' }}>
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={{
                  marginHorizontal: 16, paddingVertical: 14,
                  backgroundColor: Colors.primary, borderRadius: 12, alignItems: 'center',
                }}
                onPress={onClose}
              >
                <Text style={{ fontSize: 15, fontWeight: '600', color: '#fff' }}>确定</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
