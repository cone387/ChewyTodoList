import React, { useMemo } from 'react';
import type { Task, TaskView } from '../types/index';
import { TaskPriority } from '../types/index';

interface TimelineViewProps {
  tasks: Task[];
  view: TaskView;
  onTaskClick?: (task: Task) => void;
}

const TimelineView: React.FC<TimelineViewProps> = ({
  tasks,
  view,
  onTaskClick,
}) => {
  const displaySettings = view.display_settings || {
    show_project: true,
    show_tags: true,
    show_due_date: true,
    show_priority: true,
    show_status: true,
    compact_mode: false,
  };

  // 按日期分组任务
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    // 只显示有日期的任务
    const tasksWithDates = tasks.filter(task => task.due_date || task.start_date);
    
    tasksWithDates.forEach(task => {
      const date = task.due_date || task.start_date;
      if (date) {
        const dateKey = new Date(date).toDateString();
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(task);
      }
    });
    
    // 按日期排序
    const sortedGroups: Array<[string, Task[]]> = Object.entries(groups).sort(([a], [b]) => {
      return new Date(a).getTime() - new Date(b).getTime();
    });
    
    return sortedGroups;
  }, [tasks]);

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'border-gray-300 bg-gray-50';
      case TaskPriority.MEDIUM:
        return 'border-yellow-300 bg-yellow-50';
      case TaskPriority.HIGH:
        return 'border-orange-300 bg-orange-50';
      case TaskPriority.URGENT:
        return 'border-red-300 bg-red-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  const getPriorityDotColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-400';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-400';
      case TaskPriority.HIGH:
        return 'bg-orange-400';
      case TaskPriority.URGENT:
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let relativeText = '';
    if (diffDays === 0) relativeText = '今天';
    else if (diffDays === 1) relativeText = '明天';
    else if (diffDays === -1) relativeText = '昨天';
    else if (diffDays > 0 && diffDays <= 7) relativeText = `${diffDays}天后`;
    else if (diffDays < 0 && diffDays >= -7) relativeText = `${Math.abs(diffDays)}天前`;
    
    const dateText = date.toLocaleDateString('zh-CN', { 
      month: 'long', 
      day: 'numeric',
      weekday: 'long'
    });
    
    return relativeText ? `${dateText} (${relativeText})` : dateText;
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.is_completed) return false;
    return new Date(task.due_date) < new Date();
  };

  const isPastDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">timeline</span>
        <p className="text-sm">没有找到匹配的任务</p>
      </div>
    );
  }

  if (groupedTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">event_busy</span>
        <p className="text-sm">没有设置日期的任务</p>
        <p className="text-xs mt-2">时间轴视图只显示有开始日期或截止日期的任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 时间轴说明 */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <span className="material-symbols-outlined text-[16px]">info</span>
          <span>时间轴按任务的截止日期或开始日期进行排序显示</span>
        </div>
      </div>

      {/* 时间轴内容 */}
      <div className="relative">
        {/* 时间轴主线 */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
        
        <div className="space-y-8">
          {groupedTasks.map(([dateKey, dateTasks]) => {
            const isPast = isPastDate(dateKey);
            
            return (
              <div key={dateKey} className="relative">
                {/* 日期标题 */}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`
                    relative z-10 size-12 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-900
                    ${isPast ? 'bg-gray-400' : 'bg-primary'}
                  `}>
                    <span className="material-symbols-outlined text-white text-[20px]">
                      {isPast ? 'history' : 'schedule'}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className={`
                      text-lg font-semibold
                      ${isPast ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}
                    `}>
                      {formatDateHeader(dateKey)}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {dateTasks.length} 个任务
                    </p>
                  </div>
                </div>

                {/* 任务列表 */}
                <div className="ml-16 space-y-3">
                  {dateTasks.map((task) => (
                    <div
                      key={task.uid}
                      onClick={() => onTaskClick?.(task)}
                      className={`
                        relative p-4 border-l-4 rounded-lg cursor-pointer hover:shadow-md transition-all
                        ${getPriorityColor(task.priority)}
                        ${task.is_completed ? 'opacity-60' : ''}
                        ${isOverdue(task) && !task.is_completed ? 'border-l-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                      `}
                    >
                      {/* 优先级指示点 */}
                      <div className={`
                        absolute -left-2 top-6 size-4 rounded-full border-2 border-white dark:border-gray-900
                        ${getPriorityDotColor(task.priority)}
                      `}></div>

                      {/* 任务内容 */}
                      <div className="space-y-2">
                        {/* 标题行 */}
                        <div className="flex items-start justify-between gap-2">
                          <h4 className={`
                            font-medium text-gray-900 dark:text-white flex-1
                            ${task.is_completed ? 'line-through text-gray-500' : ''}
                            ${displaySettings.compact_mode ? 'text-sm' : 'text-base'}
                          `}>
                            {task.title}
                          </h4>
                          
                          {/* 状态指示器 */}
                          {task.is_completed && (
                            <span className="material-symbols-outlined text-green-500 text-[20px]">
                              check_circle
                            </span>
                          )}
                          {isOverdue(task) && !task.is_completed && (
                            <span className="material-symbols-outlined text-red-500 text-[20px]">
                              schedule
                            </span>
                          )}
                        </div>

                        {/* 任务描述 */}
                        {task.content && !displaySettings.compact_mode && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {task.content}
                          </p>
                        )}

                        {/* 元数据 */}
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          {/* 项目 */}
                          {displaySettings.show_project && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">folder</span>
                              {task.project.name}
                            </span>
                          )}
                          
                          {/* 优先级 */}
                          {displaySettings.show_priority && (
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">flag</span>
                              {task.priority_display}
                            </span>
                          )}
                          
                          {/* 时间信息 */}
                          <div className="flex items-center gap-3">
                            {task.start_date && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">play_arrow</span>
                                开始: {new Date(task.start_date).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                            {task.due_date && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">flag</span>
                                截止: {new Date(task.due_date).toLocaleDateString('zh-CN')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 标签 */}
                        {displaySettings.show_tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.map((tag) => (
                              <span
                                key={tag.uid}
                                className="px-2 py-0.5 text-xs rounded-full"
                                style={{
                                  backgroundColor: `${tag.color}20`,
                                  color: tag.color,
                                  border: `1px solid ${tag.color}40`,
                                }}
                              >
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 子任务进度 */}
                        {task.subtasks_count > 0 && (
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 max-w-32">
                              <div
                                className="bg-primary h-1.5 rounded-full transition-all"
                                style={{
                                  width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {task.completed_subtasks_count}/{task.subtasks_count} 子任务
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 统计信息 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{groupedTasks.length}</div>
            <div className="text-gray-600 dark:text-gray-400">时间节点</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {tasks.filter(t => t.is_completed).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">已完成</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimelineView;