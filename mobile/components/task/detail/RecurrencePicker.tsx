import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Animated,
  ScrollView, TextInput, Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';
import type { RecurrenceInput, RecurrenceInfo } from '../../../shared/types/index';

const FREQ_OPTIONS = [
  { label: '不重复', value: null },
  { label: '每天', value: 'DAILY' as const },
  { label: '每周', value: 'WEEKLY' as const },
  { label: '每月', value: 'MONTHLY' as const },
  { label: '每年', value: 'YEARLY' as const },
];

const WEEKDAYS = [
  { label: '一', value: 'MO' },
  { label: '二', value: 'TU' },
  { label: '三', value: 'WE' },
  { label: '四', value: 'TH' },
  { label: '五', value: 'FR' },
  { label: '六', value: 'SA' },
  { label: '日', value: 'SU' },
];

const END_OPTIONS = [
  { label: '永不', value: 'never' },
  { label: '次数', value: 'count' },
  { label: '日期', value: 'until' },
];

interface RecurrencePickerProps {
  visible: boolean;
  value: RecurrenceInput | null;
  existingInfo?: RecurrenceInfo | null; // 用于显示已有规则
  onConfirm: (input: RecurrenceInput | null) => void;
  onCancel: () => void;
}

function buildHumanText(input: RecurrenceInput | null): string {
  if (!input) return '不重复';
  const freqLabel: Record<string, string> = {
    DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月', YEARLY: '每年',
  };
  let text = input.interval && input.interval > 1
    ? `每 ${input.interval} ${freqLabel[input.freq]?.slice(1) || ''}`
    : freqLabel[input.freq] || '';
  if (input.byday && input.byday.length > 0) {
    const dayLabel: Record<string, string> = { MO: '一', TU: '二', WE: '三', TH: '四', FR: '五', SA: '六', SU: '日' };
    text += ' ' + input.byday.map(d => `周${dayLabel[d] || d}`).join(', ');
  }
  if (input.bymonthday) text += ` ${input.bymonthday}号`;
  if (input.count) text += `，共 ${input.count} 次`;
  if (input.until) text += `，截止 ${input.until.slice(0, 10)}`;
  return text;
}

export function RecurrencePicker({ visible, value, existingInfo, onConfirm, onCancel }: RecurrencePickerProps) {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(400)).current;

  const [freq, setFreq] = useState<RecurrenceInput['freq'] | null>(value?.freq || null);
  const [interval, setInterval] = useState(String(value?.interval || 1));
  const [byday, setByday] = useState<string[]>(value?.byday || []);
  const [bymonthday, setBymonthday] = useState(String(value?.bymonthday || ''));
  const [endType, setEndType] = useState<'never' | 'count' | 'until'>(
    value?.count ? 'count' : value?.until ? 'until' : 'never'
  );
  const [count, setCount] = useState(String(value?.count || 10));
  const [until, setUntil] = useState<Date>(value?.until ? new Date(value.until) : new Date(Date.now() + 30 * 86400000));
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setFreq(value?.freq || null);
      setInterval(String(value?.interval || 1));
      setByday(value?.byday || []);
      setBymonthday(String(value?.bymonthday || ''));
      setEndType(value?.count ? 'count' : value?.until ? 'until' : 'never');
      setCount(String(value?.count || 10));
      setUntil(value?.until ? new Date(value.until) : new Date(Date.now() + 30 * 86400000));
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 200, useNativeDriver: true }).start();
    }
  }, [visible]);

  const toggleDay = (day: string) => {
    setByday(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleConfirm = () => {
    if (!freq) { onConfirm(null); return; }
    const result: RecurrenceInput = { freq };
    const intVal = parseInt(interval);
    if (intVal > 1) result.interval = intVal;
    if (freq === 'WEEKLY' && byday.length > 0) result.byday = byday;
    if (freq === 'MONTHLY' && bymonthday) {
      const md = parseInt(bymonthday);
      if (md >= 1 && md <= 31) result.bymonthday = md;
    }
    if (endType === 'count') result.count = parseInt(count) || 10;
    if (endType === 'until') result.until = until.toISOString().slice(0, 10);
    onConfirm(result);
  };

  const currentInput: RecurrenceInput | null = freq ? { freq, interval: parseInt(interval) || 1, byday: freq === 'WEEKLY' ? byday : undefined } : null;

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
              <Text style={{ fontSize: 17, fontWeight: '600', color: colors.text.primary }}>重复</Text>
              <TouchableOpacity onPress={handleConfirm} style={{ paddingHorizontal: 14, paddingVertical: 6, backgroundColor: Colors.primary, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>确定</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420, paddingHorizontal: 16 }}>
              {/* Freq chips */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {FREQ_OPTIONS.map(opt => {
                  const active = freq === opt.value;
                  return (
                    <TouchableOpacity key={opt.label} onPress={() => setFreq(opt.value as any)}
                      style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16,
                        backgroundColor: active ? Colors.primary + '18' : colors.background.tertiary }}>
                      <Text style={{ fontSize: 14, fontWeight: active ? '600' : '400',
                        color: active ? Colors.primary : colors.text.secondary }}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {freq && (
                <>
                  {/* Interval */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                    <Text style={{ fontSize: 14, color: colors.text.secondary, width: 48 }}>间隔</Text>
                    <TextInput
                      style={{ width: 50, height: 36, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                        textAlign: 'center', fontSize: 14, color: colors.text.primary }}
                      value={interval} onChangeText={setInterval} keyboardType="number-pad" />
                    <Text style={{ fontSize: 14, color: colors.text.secondary, marginLeft: 8 }}>
                      {{ DAILY: '天', WEEKLY: '周', MONTHLY: '月', YEARLY: '年' }[freq]}
                    </Text>
                  </View>

                  {/* BYDAY grid (weekly only) */}
                  {freq === 'WEEKLY' && (
                    <View style={{ marginBottom: 14 }}>
                      <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>重复日</Text>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        {WEEKDAYS.map(d => {
                          const active = byday.includes(d.value);
                          return (
                            <TouchableOpacity key={d.value} onPress={() => toggleDay(d.value)}
                              style={{ width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
                                backgroundColor: active ? Colors.primary : colors.background.tertiary }}>
                              <Text style={{ fontSize: 13, fontWeight: '600', color: active ? '#fff' : colors.text.secondary }}>{d.label}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* BYMONTHDAY (monthly only) */}
                  {freq === 'MONTHLY' && (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                      <Text style={{ fontSize: 14, color: colors.text.secondary, width: 48 }}>每月</Text>
                      <TextInput
                        style={{ width: 50, height: 36, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                          textAlign: 'center', fontSize: 14, color: colors.text.primary }}
                        value={bymonthday} onChangeText={setBymonthday} keyboardType="number-pad" placeholder="日" placeholderTextColor={colors.text.muted} />
                      <Text style={{ fontSize: 14, color: colors.text.secondary, marginLeft: 8 }}>号</Text>
                    </View>
                  )}

                  {/* End condition */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={{ fontSize: 14, color: colors.text.secondary, marginBottom: 8 }}>结束条件</Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      {END_OPTIONS.map(opt => {
                        const active = endType === opt.value;
                        return (
                          <TouchableOpacity key={opt.value} onPress={() => setEndType(opt.value as any)}
                            style={{ paddingHorizontal: 14, paddingVertical: 7, borderRadius: 14,
                              backgroundColor: active ? Colors.primary + '18' : colors.background.tertiary }}>
                            <Text style={{ fontSize: 13, fontWeight: active ? '600' : '400',
                              color: active ? Colors.primary : colors.text.secondary }}>{opt.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    {endType === 'count' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, color: colors.text.secondary }}>重复</Text>
                        <TextInput
                          style={{ width: 50, height: 34, borderWidth: 1, borderColor: colors.border, borderRadius: 8,
                            textAlign: 'center', fontSize: 14, marginHorizontal: 8, color: colors.text.primary }}
                          value={count} onChangeText={setCount} keyboardType="number-pad" />
                        <Text style={{ fontSize: 14, color: colors.text.secondary }}>次后停止</Text>
                      </View>
                    )}
                    {endType === 'until' && (
                      <TouchableOpacity onPress={() => setShowDatePicker(true)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <MaterialCommunityIcons name="calendar" size={18} color={Colors.primary} />
                        <Text style={{ fontSize: 14, color: Colors.primary }}>{until.toLocaleDateString('zh-CN')}</Text>
                      </TouchableOpacity>
                    )}
                    {showDatePicker && (
                      <DateTimePicker
                        value={until}
                        mode="date"
                        minimumDate={new Date()}
                        onChange={(_, date) => { setShowDatePicker(false); if (date) setUntil(date); }}
                      />
                    )}
                  </View>

                  {/* Preview */}
                  <View style={{ backgroundColor: colors.background.secondary, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <Text style={{ fontSize: 13, color: colors.text.muted }}>预览</Text>
                    <Text style={{ fontSize: 14, color: colors.text.primary, marginTop: 4 }}>{buildHumanText(currentInput)}</Text>
                  </View>
                </>
              )}
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

export { buildHumanText };
