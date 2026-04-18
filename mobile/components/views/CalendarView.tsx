import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import type { Task, TaskView } from '../../shared/types/index';
import { TaskPriority } from '../../shared/types/index';
import { Colors } from '../../constants/theme';

interface CalendarViewProps {
  tasks: Task[];
  view?: TaskView | null;
  onTaskPress: (task: Task) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  isLoading?: boolean;
  emptyMessage?: string;
}

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

const PRIORITY_COLORS: Record<number, string> = {
  [TaskPriority.LOW]: '#94a3b8',
  [TaskPriority.MEDIUM]: '#f59e0b',
  [TaskPriority.HIGH]: '#f97316',
  [TaskPriority.URGENT]: '#ef4444',
};

export const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  view,
  onTaskPress,
  emptyMessage = '暂无任务',
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Generate month dates
  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);

    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    endDate.setDate(lastDay.getDate() + daysToAdd);

    const dates: Date[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }, [currentDate]);

  // Group tasks by date
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const dateStr = task.due_date || task.start_date;
      if (dateStr) {
        const dateKey = new Date(dateStr).toDateString();
        if (!grouped[dateKey]) grouped[dateKey] = [];
        grouped[dateKey].push(task);
      }
    });
    return grouped;
  }, [tasks]);

  // Tasks for selected date
  const selectedTasks = useMemo(() => {
    if (!selectedDate) return [];
    return tasksByDate[selectedDate] || [];
  }, [selectedDate, tasksByDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + (direction === 'next' ? 1 : -1));
      return d;
    });
    setSelectedDate(null);
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();
  const isSelected = (date: Date) => selectedDate === date.toDateString();

  const renderTaskItem = useCallback(({ item }: { item: Task }) => (
    <TouchableOpacity
      style={{
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
        borderLeftColor: PRIORITY_COLORS[item.priority] || '#94a3b8',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
      onPress={() => onTaskPress(item)}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '500',
            color: item.is_completed ? '#9ca3af' : '#111418',
            textDecorationLine: item.is_completed ? 'line-through' : 'none',
          }}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
          {item.project && <Text style={{ fontSize: 11, color: '#9ca3af' }}>📁 {item.project.name}</Text>}
          <Text style={{ fontSize: 11, color: '#9ca3af' }}>{item.priority_display}</Text>
        </View>
      </View>
      {item.is_overdue && !item.is_completed && (
        <View style={{ backgroundColor: '#fef2f2', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: '#ef4444', fontSize: 10, fontWeight: '600' }}>逾期</Text>
        </View>
      )}
    </TouchableOpacity>
  ), [onTaskPress]);

  return (
    <View style={{ flex: 1 }}>
      {/* Month navigation */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#fff' }}>
        <TouchableOpacity onPress={() => navigateMonth('prev')} style={{ padding: 8 }}>
          <Text style={{ fontSize: 18, color: '#6b7280' }}>‹</Text>
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#111418' }}>
            {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
          </Text>
          <TouchableOpacity
            onPress={() => { setCurrentDate(new Date()); setSelectedDate(new Date().toDateString()); }}
            style={{ backgroundColor: Colors.primary, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 }}
          >
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '600' }}>今天</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity onPress={() => navigateMonth('next')} style={{ padding: 8 }}>
          <Text style={{ fontSize: 18, color: '#6b7280' }}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Weekday headers */}
      <View style={{ flexDirection: 'row', backgroundColor: '#fff', paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, color: '#9ca3af', fontWeight: '500' }}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff' }}>
        {monthDates.map((date) => {
          const dateKey = date.toDateString();
          const dayTasks = tasksByDate[dateKey] || [];
          const isTodayDate = isToday(date);
          const isCurrentMonthDate = isCurrentMonth(date);
          const isSelectedDate = isSelected(date);

          return (
            <TouchableOpacity
              key={dateKey}
              style={{
                width: '14.28%',
                aspectRatio: 1,
                alignItems: 'center',
                justifyContent: 'center',
                borderBottomWidth: 0.5,
                borderRightWidth: 0.5,
                borderColor: '#f3f4f6',
                backgroundColor: isSelectedDate ? '#f3f0ff' : '#fff',
              }}
              onPress={() => setSelectedDate(dateKey)}
            >
              <View style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isTodayDate ? Colors.primary : 'transparent',
              }}>
                <Text style={{
                  fontSize: 13,
                  fontWeight: isTodayDate ? '700' : '400',
                  color: isTodayDate ? '#fff' : isCurrentMonthDate ? '#111418' : '#d1d5db',
                }}>
                  {date.getDate()}
                </Text>
              </View>
              {/* Task dots */}
              {dayTasks.length > 0 && (
                <View style={{ flexDirection: 'row', gap: 2, marginTop: 2 }}>
                  {dayTasks.slice(0, 3).map((t, i) => (
                    <View key={i} style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: PRIORITY_COLORS[t.priority] || Colors.primary }} />
                  ))}
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected date tasks */}
      <View style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {selectedDate ? (
          <View style={{ flex: 1 }}>
            <View style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#374151' }}>
                {new Date(selectedDate).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                {' · '}{selectedTasks.length} 个任务
              </Text>
            </View>
            {selectedTasks.length > 0 ? (
              <FlatList
                data={selectedTasks}
                keyExtractor={(item) => item.uid}
                renderItem={renderTaskItem}
                contentContainerStyle={{ padding: 12 }}
              />
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Text style={{ color: '#d1d5db', fontSize: 13 }}>该日期暂无任务</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 24 }}>
            <Text style={{ color: '#9ca3af', fontSize: 13 }}>点击日期查看任务</Text>
          </View>
        )}
      </View>
    </View>
  );
};
