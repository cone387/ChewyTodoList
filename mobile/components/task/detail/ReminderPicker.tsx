import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated,
  ScrollView, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import type { ReminderInput } from '../../../shared/types/index';

const QUICK_OPTIONS: { label: string; offset: number }[] = [
  { label: '5 分钟前', offset: 5 },
  { label: '15 分钟前', offset: 15 },
  { label: '30 分钟前', offset: 30 },
  { label: '1 小时前', offset: 60 },
  { label: '1 天前', offset: 1440 },
];

function formatReminder(r: ReminderInput): string {
  if (r.type === 'absolute' && r.trigger_at) {
    const d = new Date(r.trigger_at);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  }
  if (r.offset_minutes != null) {
    const m = r.offset_minutes;
    const ref = r.relative_to === 'start_date' ? '开始' : '截止';
    if (m >= 1440) return `${ref}前 ${Math.floor(m / 1440)} 天`;
    if (m >= 60) return `${ref}前 ${Math.floor(m / 60)} 小时`;
    return `${ref}前 ${m} 分钟`;
  }
  return '提醒';
}

interface ReminderPickerProps {
  visible: boolean;
  value: ReminderInput[];
  onConfirm: (reminders: ReminderInput[]) => void;
  onCancel: () => void;
}

export function ReminderPicker({ visible, value, onConfirm, onCancel }: ReminderPickerProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [reminders, setReminders] = useState<ReminderInput[]>(value || []);
  const [showCustom, setShowCustom] = useState(false);
  const [customDate, setCustomDate] = useState(new Date(Date.now() + 3600000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setReminders(value || []);
      setShowCustom(false);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  const addQuickReminder = (offset: number) => {
    // Check if already exists
    const exists = reminders.some(
      r => r.type === 'relative' && r.offset_minutes === offset && r.relative_to === 'due_date'
    );
    if (exists) return;
    setReminders(prev => [...prev, {
      type: 'relative',
      offset_minutes: offset,
      relative_to: 'due_date',
    }]);
  };

  const addCustomReminder = () => {
    setReminders(prev => [...prev, {
      type: 'absolute',
      trigger_at: customDate.toISOString(),
    }]);
    setShowCustom(false);
  };

  const removeReminder = (index: number) => {
    setReminders(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = () => {
    onConfirm(reminders);
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <TouchableOpacity style={{ flex: 1, backgroundColor: colors.overlay }} activeOpacity={1} onPress={onCancel}>
        <Animated.View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: colors.card, borderTopLeftRadius: 16, borderTopRightRadius: 16,
          paddingBottom: Platform.OS === 'ios' ? 34 : 16,
          transform: [{ translateY: slideAnim }],
        }}>
          <TouchableOpacity activeOpacity={1}>
            {/* Handle */}
            <View style={{ alignItems: 'center', paddingVertical: 8 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: colors.border }} />
            </View>

            {/* Title */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 12 }}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>提醒</Text>
              <TouchableOpacity onPress={handleConfirm} style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.primary, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>确定</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380, paddingHorizontal: 16 }}>
              {/* Quick chips */}
              <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>快捷选择（截止时间前）</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {QUICK_OPTIONS.map(opt => {
                  const active = reminders.some(
                    r => r.type === 'relative' && r.offset_minutes === opt.offset && r.relative_to === 'due_date'
                  );
                  return (
                    <TouchableOpacity key={opt.offset} onPress={() => addQuickReminder(opt.offset)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
                        backgroundColor: active ? Colors.primary + '18' : colors.background.tertiary }}>
                      <Text style={{ fontSize: 14, fontWeight: active ? '600' : '400',
                        color: active ? Colors.primary : colors.text.secondary }}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom absolute time */}
              {!showCustom ? (
                <TouchableOpacity onPress={() => setShowCustom(true)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <MaterialCommunityIcons name="plus-circle-outline" size={18} color={Colors.primary} />
                  <Text style={{ fontSize: 14, color: Colors.primary }}>自定义时间</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ marginBottom: 16, backgroundColor: colors.background.secondary, borderRadius: 10, padding: 12 }}>
                  <Text style={{ fontSize: 13, color: colors.text.muted, marginBottom: 8 }}>选择提醒时间</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                    <TouchableOpacity onPress={() => setShowDatePicker(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.background.tertiary }}>
                      <MaterialCommunityIcons name="calendar" size={16} color={Colors.primary} />
                      <Text style={{ fontSize: 14, color: colors.text.primary }}>
                        {customDate.toLocaleDateString('zh-CN')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowTimePicker(true)}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: colors.background.tertiary }}>
                      <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.primary} />
                      <Text style={{ fontSize: 14, color: colors.text.primary }}>
                        {customDate.getHours().toString().padStart(2, '0')}:{customDate.getMinutes().toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity onPress={addCustomReminder}
                      style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.primary, borderRadius: 8 }}>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>添加</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowCustom(false)}
                      style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: colors.background.tertiary, borderRadius: 8 }}>
                      <Text style={{ fontSize: 13, color: colors.text.secondary }}>取消</Text>
                    </TouchableOpacity>
                  </View>
                  {showDatePicker && (
                    <DateTimePicker
                      value={customDate}
                      mode="date"
                      minimumDate={new Date()}
                      onChange={(_, date) => {
                        setShowDatePicker(false);
                        if (date) {
                          const next = new Date(customDate);
                          next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                          setCustomDate(next);
                        }
                      }}
                    />
                  )}
                  {showTimePicker && (
                    <DateTimePicker
                      value={customDate}
                      mode="time"
                      onChange={(_, date) => {
                        setShowTimePicker(false);
                        if (date) {
                          const next = new Date(customDate);
                          next.setHours(date.getHours(), date.getMinutes());
                          setCustomDate(next);
                        }
                      }}
                    />
                  )}
                </View>
              )}

              {/* Added reminders list */}
              {reminders.length > 0 && (
                <View style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>已添加提醒</Text>
                  {reminders.map((r, idx) => (
                    <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
                      borderBottomWidth: idx < reminders.length - 1 ? 0.5 : 0, borderBottomColor: colors.borderLight }}>
                      <MaterialCommunityIcons name="bell-outline" size={16} color={Colors.primary} style={{ marginRight: 10 }} />
                      <Text style={{ flex: 1, fontSize: 14, color: colors.text.primary }}>{formatReminder(r)}</Text>
                      <TouchableOpacity onPress={() => removeReminder(idx)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                        <MaterialCommunityIcons name="close-circle" size={20} color={colors.text.muted} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {reminders.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                  <Text style={{ fontSize: 13, color: colors.text.muted }}>暂无提醒，选择上方选项添加</Text>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

export { formatReminder };
