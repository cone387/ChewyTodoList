import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

export interface DisplaySettings {
  show_completed: boolean;
  show_project: boolean;
  show_tags: boolean;
  show_due_date: boolean;
  show_priority: boolean;
  compact_mode: boolean;
}

const SORT_OPTIONS = [
  { value: '', label: '默认排序' },
  { value: 'created_at', label: '创建时间' },
  { value: 'updated_at', label: '更新时间' },
  { value: 'due_date', label: '截止日期' },
  { value: 'priority', label: '优先级' },
  { value: 'title', label: '标题' },
];

const GROUP_OPTIONS = [
  { value: '', label: '不分组' },
  { value: 'status', label: '按状态' },
  { value: 'priority', label: '按优先级' },
  { value: 'project', label: '按项目' },
  { value: 'due_date', label: '按截止日期' },
];

const DISPLAY_OPTIONS: Array<{ key: keyof DisplaySettings; label: string }> = [
  { key: 'show_completed', label: '显示已完成' },
  { key: 'show_project', label: '显示项目' },
  { key: 'show_tags', label: '显示标签' },
  { key: 'show_due_date', label: '显示截止日期' },
  { key: 'show_priority', label: '显示优先级' },
  { key: 'compact_mode', label: '紧凑模式' },
];

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  show_completed: false,
  show_project: true,
  show_tags: true,
  show_due_date: true,
  show_priority: true,
  compact_mode: false,
};

export function hasActiveFilterBarSettings(
  sortField: string,
  groupBy: string,
  displaySettings: DisplaySettings,
) {
  if (sortField || groupBy) return true;

  return DISPLAY_OPTIONS.some(({ key }) => displaySettings[key] !== DEFAULT_DISPLAY_SETTINGS[key]);
}

function getSortLabel(field: string) {
  return SORT_OPTIONS.find((option) => option.value === field)?.label || '默认排序';
}

function getGroupLabel(field: string) {
  return GROUP_OPTIONS.find((option) => option.value === field)?.label || '不分组';
}

interface HomeFilterBarProps {
  visible: boolean;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  groupBy: string;
  displaySettings: DisplaySettings;
  onSortChange: (field: string, direction: 'asc' | 'desc') => void;
  onGroupByChange: (field: string) => void;
  onDisplaySettingsChange: (settings: Partial<DisplaySettings>) => void;
}

export const HomeFilterBar: React.FC<HomeFilterBarProps> = ({
  visible,
  sortField,
  sortDirection,
  groupBy,
  displaySettings,
  onSortChange,
  onGroupByChange,
  onDisplaySettingsChange,
}) => {
  const [activePanel, setActivePanel] = useState<'sort' | 'group' | 'display' | null>(null);

  useEffect(() => {
    if (!visible) {
      setActivePanel(null);
    }
  }, [visible]);

  const displayCount = useMemo(
    () => DISPLAY_OPTIONS.filter(({ key }) => displaySettings[key] !== DEFAULT_DISPLAY_SETTINGS[key]).length,
    [displaySettings],
  );

  if (!visible) return null;

  return (
    <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6 }}>
        <TabButton
          label={`排序：${getSortLabel(sortField)}`}
          active={activePanel === 'sort'}
          onPress={() => setActivePanel(activePanel === 'sort' ? null : 'sort')}
        />
        <TabButton
          label={`分组：${getGroupLabel(groupBy)}`}
          active={activePanel === 'group'}
          onPress={() => setActivePanel(activePanel === 'group' ? null : 'group')}
        />
        <TabButton
          label={displayCount > 0 ? `显示：${displayCount}` : '显示'}
          active={activePanel === 'display'}
          onPress={() => setActivePanel(activePanel === 'display' ? null : 'display')}
        />
      </View>

      {activePanel === 'sort' && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingVertical: 4 }}>
          {SORT_OPTIONS.map((option) => {
            const selected = sortField === option.value;
            return (
              <View
                key={option.value || 'default'}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                }}
              >
                <TouchableOpacity
                  onPress={() => {
                    onSortChange(option.value, selected ? sortDirection : 'desc');
                    setActivePanel(null);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}
                >
                  {selected ? (
                    <MaterialCommunityIcons name="check" size={16} color={Colors.primary} />
                  ) : (
                    <View style={{ width: 16 }} />
                  )}
                  <Text style={{ fontSize: 14, color: selected ? Colors.primary : '#374151', fontWeight: selected ? '600' : '400' }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>

                {option.value ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <DirectionButton
                      label="正序"
                      selected={selected && sortDirection === 'asc'}
                      onPress={() => {
                        onSortChange(option.value, 'asc');
                        setActivePanel(null);
                      }}
                    />
                    <DirectionButton
                      label="倒序"
                      selected={selected && sortDirection === 'desc'}
                      onPress={() => {
                        onSortChange(option.value, 'desc');
                        setActivePanel(null);
                      }}
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {activePanel === 'group' && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingVertical: 4 }}>
          {GROUP_OPTIONS.map((option) => {
            const selected = groupBy === option.value;
            return (
              <TouchableOpacity
                key={option.value || 'default'}
                onPress={() => {
                  onGroupByChange(option.value);
                  setActivePanel(null);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                }}
              >
                <Text style={{ fontSize: 14, color: selected ? Colors.primary : '#374151', fontWeight: selected ? '600' : '400' }}>
                  {option.label}
                </Text>
                {selected && <MaterialCommunityIcons name="check" size={16} color={Colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {activePanel === 'display' && (
        <View style={{ borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingVertical: 4 }}>
          {DISPLAY_OPTIONS.map((option) => (
            <View
              key={option.key}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 10,
              }}
            >
              <Text style={{ fontSize: 14, color: '#374151' }}>{option.label}</Text>
              <Switch
                value={displaySettings[option.key]}
                onValueChange={(value) => onDisplaySettingsChange({ [option.key]: value })}
                trackColor={{ false: '#d1d5db', true: Colors.primary + '66' }}
                thumbColor={displaySettings[option.key] ? Colors.primary : '#fff'}
              />
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: active ? Colors.primary + '12' : 'transparent',
      }}
    >
      <Text style={{ fontSize: 13, color: active ? Colors.primary : '#6b7280', fontWeight: active ? '600' : '500' }} numberOfLines={1}>
        {label}
      </Text>
      <MaterialCommunityIcons
        name={active ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={active ? Colors.primary : '#9ca3af'}
      />
    </TouchableOpacity>
  );
}

function DirectionButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        backgroundColor: selected ? Colors.primary + '12' : '#f3f4f6',
      }}
    >
      <Text style={{ fontSize: 12, color: selected ? Colors.primary : '#6b7280', fontWeight: selected ? '600' : '500' }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
