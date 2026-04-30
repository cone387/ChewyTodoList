import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../../hooks/useTheme';
import { Colors } from '../../../constants/theme';

interface DatePickerProps {
  label: string;
  value: string | null | undefined;
  onChange: (isoValue: string | null) => void;
  isOverdue?: boolean;
  compact?: boolean;
}

function getRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '明天';
  if (diffDays === -1) return '昨天';
  if (diffDays > 1 && diffDays <= 7) return `${diffDays}天后`;
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)}天前`;
  return '';
}

function getQuickDates() {
  const today = new Date();
  today.setHours(18, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekend = new Date(today);
  weekend.setDate(weekend.getDate() + (6 - weekend.getDay()));
  weekend.setHours(18, 0, 0, 0);
  const nextMonday = new Date(today);
  nextMonday.setDate(nextMonday.getDate() + ((8 - nextMonday.getDay()) % 7 || 7));
  nextMonday.setHours(9, 0, 0, 0);
  return [
    { label: '今天', value: today.toISOString(), icon: '☀️' },
    { label: '明天', value: tomorrow.toISOString(), icon: '🌅' },
    { label: '周末', value: weekend.toISOString(), icon: '🏖' },
    { label: '下周一', value: nextMonday.toISOString(), icon: '📅' },
  ];
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  isOverdue = false,
  compact = false,
}) => {
  const { colors } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(value ? new Date(value) : new Date());
  const webInputRef = useRef<any>(null);

  const handleQuickDate = (isoValue: string) => {
    onChange(isoValue);
  };

  const handlePickerChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) onChange(selectedDate.toISOString());
    } else {
      if (selectedDate) setPickerDate(selectedDate);
    }
  };

  const handleIOSConfirm = () => {
    onChange(pickerDate.toISOString());
    setShowPicker(false);
  };

  const relative = value ? getRelativeDate(value) : '';

  const renderPicker = () => (
    <>
      {Platform.OS === 'web' && (
        // @ts-ignore — web-only input
        <input
          ref={webInputRef}
          type="datetime-local"
          value={pickerDate.toISOString().slice(0, 16)}
          onChange={(e: any) => {
            if (!e?.target?.value) return;
            const next = new Date(e.target.value);
            setPickerDate(next);
            onChange(next.toISOString());
          }}
          style={{ position: 'absolute', width: 0, height: 0, opacity: 0, pointerEvents: 'none' }}
        />
      )}
      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
          <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
              <TouchableWithoutFeedback>
                <View style={{ backgroundColor: colors.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
                    <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={{ color: colors.text.secondary, fontSize: 15 }}>取消</Text></TouchableOpacity>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: colors.text.primary }}>选择日期时间</Text>
                    <TouchableOpacity onPress={handleIOSConfirm}><Text style={{ color: Colors.primary, fontSize: 15, fontWeight: '600' }}>确定</Text></TouchableOpacity>
                  </View>
                  <DateTimePicker value={pickerDate} mode="datetime" display="spinner" onChange={handlePickerChange} locale="zh-CN" style={{ height: 200 }} />
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker value={pickerDate} mode="datetime" display="default" onChange={handlePickerChange} />
      )}
    </>
  );

  // Compact mode — inline chip
  if (compact) {
    return (
      <>
        <TouchableOpacity
          onPress={() => {
            const base = value ? new Date(value) : new Date();
            setPickerDate(base);
            if (Platform.OS === 'web') {
              if (webInputRef.current?.showPicker) webInputRef.current.showPicker();
              else webInputRef.current?.click?.();
              return;
            }
            setShowPicker(true);
          }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: value ? (isOverdue ? '#fef2f2' : '#f3f4f6') : '#f3f4f6',
            borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' }}
        >
          <MaterialCommunityIcons name="calendar" size={12} color={isOverdue ? '#ef4444' : colors.text.muted} />
          <Text style={{ fontSize: 12, color: value ? (isOverdue ? '#ef4444' : colors.text.secondary) : colors.text.muted }} numberOfLines={1}>
            {value ? `${label} ${new Date(value).toLocaleDateString('zh-CN')}` : label}
          </Text>
        </TouchableOpacity>
        {renderPicker()}
      </>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: colors.text.muted, fontSize: 14, width: 70 }}>{label}</Text>

        {value ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <TouchableOpacity onPress={() => { setPickerDate(new Date(value)); setShowPicker(true); }}>
              <Text style={{ fontSize: 14, color: isOverdue ? '#ef4444' : colors.text.secondary }}>
                {new Date(value).toLocaleDateString('zh-CN')}
                {' '}
                {new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {relative ? (
              <Text style={{ fontSize: 12, color: isOverdue ? '#ef4444' : colors.text.muted }}>{relative}</Text>
            ) : null}
            {isOverdue && (
              <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: colors.error, fontSize: 11, fontWeight: '600' }}>逾期</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => onChange(null)}>
              <Text style={{ color: colors.text.muted, fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
            {getQuickDates().map((qd) => (
              <TouchableOpacity
                key={qd.label}
                style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: colors.background.tertiary, borderRadius: 6 }}
                onPress={() => handleQuickDate(qd.value)}
              >
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>{qd.icon} {qd.label}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f3f0ff', borderRadius: 6 }}
              onPress={() => { setPickerDate(new Date()); setShowPicker(true); }}
            >
              <Text style={{ fontSize: 12, color: Colors.primary }}>选择</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {renderPicker()}
    </View>
  );
};
