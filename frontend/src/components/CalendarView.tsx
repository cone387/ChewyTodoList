import React, { useState, useMemo } from 'react';
import type { Task, TaskView } from '../types/index';
import { TaskPriority } from '../types/index';

interface CalendarViewProps {
  tasks: Task[];
  view: TaskView;
  onTaskClick?: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({
  tasks,
  view,
  onTaskClick,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const displaySettings = view.display_settings || {
    show_project: true,
    show_tags: true,
    show_due_date: true,
    show_priority: true,
    show_status: true,
    compact_mode: false,
  };

  // 获取当前月份的日期范围
  const monthDates = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 获取第一周的开始日期（周一）
    const startDate = new Date(firstDay);
    const dayOfWeek = firstDay.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startDate.setDate(firstDay.getDate() - daysToSubtract);
    
    // 获取最后一周的结束日期（周日）
    const endDate = new Date(lastDay);
    const lastDayOfWeek = lastDay.getDay();
    const daysToAdd = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
    endDate.setDate(lastDay.getDate() + daysToAdd);
    
    const dates = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }, [currentDate]);

  // 按日期分组任务
  const tasksByDate = useMemo(() => {
    const grouped: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      if (task.due_date) {
        const dateKey = new Date(task.due_date).toDateString();
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(task);
      }
    });
    
    return grouped;
  }, [tasks]);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-600 border-gray-200';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">calendar_month</span>
        <p className="text-sm">没有找到匹配的任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 日历头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
          </h2>
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:opacity-80 transition-opacity"
          >
            今天
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_left</span>
          </button>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">chevron_right</span>
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1">
        {['周一', '周二', '周三', '周四', '周五', '周六', '周日'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500 dark:text-gray-400">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1">
        {monthDates.map((date) => {
          const dateKey = date.toDateString();
          const dayTasks = tasksByDate[dateKey] || [];
          const isCurrentMonthDate = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          
          return (
            <div
              key={dateKey}
              className={`
                min-h-24 p-1 border border-gray-200 dark:border-gray-700 rounded-lg
                ${isCurrentMonthDate ? 'bg-white dark:bg-surface-dark' : 'bg-gray-50 dark:bg-gray-800'}
                ${isTodayDate ? 'ring-2 ring-primary ring-opacity-50' : ''}
              `}
            >
              {/* 日期数字 */}
              <div className={`
                text-sm font-medium mb-1
                ${isCurrentMonthDate ? 'text-gray-900 dark:text-white' : 'text-gray-400'}
                ${isTodayDate ? 'text-primary font-bold' : ''}
              `}>
                {date.getDate()}
              </div>

              {/* 任务列表 */}
              <div className="space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.uid}
                    onClick={() => onTaskClick?.(task)}
                    className={`
                      px-1.5 py-0.5 text-xs rounded border cursor-pointer hover:opacity-80 transition-opacity
                      ${getPriorityColor(task.priority)}
                      ${task.is_completed ? 'opacity-60 line-through' : ''}
                    `}
                    title={task.title}
                  >
                    <div className="truncate">
                      {task.title}
                    </div>
                    {displaySettings.show_project && (
                      <div className="text-xs opacity-75 truncate">
                        {task.project.name}
                      </div>
                    )}
                  </div>
                ))}
                
                {/* 更多任务指示器 */}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 px-1.5">
                    +{dayTasks.length - 3} 更多
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 任务统计 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            本月任务统计
          </span>
          <div className="flex items-center gap-4">
            <span className="text-gray-900 dark:text-white">
              总计: {tasks.length}
            </span>
            <span className="text-green-600">
              已完成: {tasks.filter(t => t.is_completed).length}
            </span>
            <span className="text-red-600">
              逾期: {tasks.filter(t => t.is_overdue).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;