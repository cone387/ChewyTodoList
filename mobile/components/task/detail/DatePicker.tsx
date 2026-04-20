import React, { useState } from 'react';
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
  const [showPicker, setShowPicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(value ? new Date(value) : new Date());
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const handleQuickDate = (isoValue: string) => {
    onChange(isoValue);
  };

  const handlePickerChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        if (pickerMode === 'date') {
          setPickerDate(selectedDate);
          setPickerMode('time');
          setShowPicker(true);
        } else {
          onChange(selectedDate.toISOString());
          setPickerMode('date');
        }
      }
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
      {Platform.OS === 'ios' && showPicker && (
        <Modal transparent animationType="slide" onRequestClose={() => setShowPicker(false)}>
          <TouchableWithoutFeedback onPress={() => setShowPicker(false)}>
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
              <TouchableWithoutFeedback>
                <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 34 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                    <TouchableOpacity onPress={() => setShowPicker(false)}><Text style={{ color: '#6b7280', fontSize: 15 }}>取消</Text></TouchableOpacity>
                    <Text style={{ fontSize: 15, fontWeight: '600', color: '#111418' }}>选择日期时间</Text>
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
        <DateTimePicker value={pickerDate} mode={pickerMode} display="default" onChange={handlePickerChange} />
      )}
    </>
  );

  // Compact mode — inline chip
  if (compact) {
    return (
      <>
        <TouchableOpacity
          onPress={() => { setPickerDate(value ? new Date(value) : new Date()); setShowPicker(true); }}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: value ? (isOverdue ? '#fef2f2' : '#f3f4f6') : '#f3f4f6',
            borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5, flex: 1 }}
        >
          <MaterialCommunityIcons name="calendar" size={12} color={isOverdue ? '#ef4444' : '#9ca3af'} />
          <Text style={{ fontSize: 12, color: value ? (isOverdue ? '#ef4444' : '#374151') : '#9ca3af' }} numberOfLines={1}>
            {value ? `${label} ${new Date(value).toLocaleDateString('zh-CN')}` : label}
          </Text>
          {value && (
            <TouchableOpacity onPress={() => onChange(null)} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <MaterialCommunityIcons name="close-circle" size={14} color="#d1d5db" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>
        {renderPicker()}
      </>
    );
  }

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: '#9ca3af', fontSize: 14, width: 70 }}>{label}</Text>

        {value ? (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 }}>
            <TouchableOpacity onPress={() => { setPickerDate(new Date(value)); setShowPicker(true); }}>
              <Text style={{ fontSize: 14, color: isOverdue ? '#ef4444' : '#374151' }}>
                {new Date(value).toLocaleDateString('zh-CN')}
                {' '}
                {new Date(value).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
            {relative ? (
              <Text style={{ fontSize: 12, color: isOverdue ? '#ef4444' : '#9ca3af' }}>{relative}</Text>
            ) : null}
            {isOverdue && (
              <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>逾期</Text>
              </View>
            )}
            <TouchableOpacity onPress={() => onChange(null)}>
              <Text style={{ color: '#d1d5db', fontSize: 16 }}>×</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'flex-end', gap: 6 }}>
            {getQuickDates().map((qd) => (
              <TouchableOpacity
                key={qd.label}
                style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#f3f4f6', borderRadius: 6 }}
                onPress={() => handleQuickDate(qd.value)}
              >
                <Text style={{ fontSize: 12, color: '#6b7280' }}>{qd.icon} {qd.label}</Text>
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
