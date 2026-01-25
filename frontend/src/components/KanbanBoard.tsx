import React, { useMemo } from 'react';
import type { Task, TaskView } from '../types/index';
import { TaskPriority } from '../types/index';

interface KanbanBoardProps {
  tasks: Task[];
  view: TaskView;
  onTaskClick?: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
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

  // 根据分组字段对任务进行分组
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    tasks.forEach(task => {
      let groupKey = '';
      
      switch (view.group_by) {
        case 'status':
          groupKey = task.status_display;
          break;
        case 'priority':
          groupKey = task.priority_display;
          break;
        case 'project':
          groupKey = task.project.name;
          break;
        case 'assignee':
          groupKey = '未分配'; // 暂时使用固定值，后续可以扩展
          break;
        default:
          groupKey = task.status_display; // 默认按状态分组
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [tasks, view.group_by]);

  const getColumnColor = (groupName: string) => {
    // 根据分组名称返回不同的颜色
    if (groupName.includes('未开始') || groupName.includes('待办')) {
      return 'border-t-blue-500 bg-blue-50/50 dark:bg-blue-900/10';
    }
    if (groupName.includes('进行中') || groupName.includes('处理中')) {
      return 'border-t-yellow-500 bg-yellow-50/50 dark:bg-yellow-900/10';
    }
    if (groupName.includes('已完成') || groupName.includes('完成')) {
      return 'border-t-green-500 bg-green-50/50 dark:bg-green-900/10';
    }
    if (groupName.includes('已放弃') || groupName.includes('取消')) {
      return 'border-t-red-500 bg-red-50/50 dark:bg-red-900/10';
    }
    return 'border-t-gray-500 bg-gray-50/50 dark:bg-gray-900/10';
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'text-gray-500';
      case TaskPriority.MEDIUM:
        return 'text-yellow-500';
      case TaskPriority.HIGH:
        return 'text-orange-500';
      case TaskPriority.URGENT:
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getPriorityIcon = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'keyboard_arrow_down';
      case TaskPriority.MEDIUM:
        return 'remove';
      case TaskPriority.HIGH:
        return 'keyboard_arrow_up';
      case TaskPriority.URGENT:
        return 'priority_high';
      default:
        return 'remove';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '明天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 0 && diffDays <= 7) return `${diffDays}天后`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}天前`;
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.is_completed) return false;
    return new Date(task.due_date) < new Date();
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">view_kanban</span>
        <p className="text-sm">没有找到匹配的任务</p>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
      {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
        <div
          key={groupName}
          className={`flex-shrink-0 w-80 border-t-4 rounded-lg flex flex-col ${getColumnColor(groupName)}`}
        >
          {/* 列标题 */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {groupName}
              </h3>
              <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                {groupTasks.length}
              </span>
            </div>
          </div>

          {/* 任务卡片 - 自适应高度 */}
          <div className="p-3 space-y-3">
            {groupTasks.map((task) => (
              <div
                key={task.uid}
                onClick={() => onTaskClick?.(task)}
                className={`
                  p-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 
                  rounded-lg hover:shadow-md transition-all cursor-pointer
                  ${task.is_completed ? 'opacity-60' : ''}
                  ${displaySettings.compact_mode ? 'p-2' : 'p-3'}
                `}
              >
                {/* 任务标题 */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className={`
                    font-medium text-gray-900 dark:text-white flex-1
                    ${task.is_completed ? 'line-through text-gray-500' : ''}
                    ${displaySettings.compact_mode ? 'text-sm' : 'text-base'}
                  `}>
                    {task.title}
                  </h4>
                  
                  {/* 优先级指示器 */}
                  {displaySettings.show_priority && task.priority > TaskPriority.LOW && (
                    <span className={`${getPriorityColor(task.priority)} flex-shrink-0`}>
                      <span className="material-symbols-outlined text-[16px]">
                        {getPriorityIcon(task.priority)}
                      </span>
                    </span>
                  )}
                </div>

                {/* 任务描述 */}
                {task.content && !displaySettings.compact_mode && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                    {task.content}
                  </p>
                )}

                {/* 元数据 */}
                <div className="space-y-2">
                  {/* 项目和截止日期 */}
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    {displaySettings.show_project && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">folder</span>
                        {task.project.name}
                      </span>
                    )}
                    
                    {displaySettings.show_due_date && task.due_date && (
                      <span className={`
                        flex items-center gap-1
                        ${isOverdue(task) ? 'text-red-500' : ''}
                      `}>
                        <span className="material-symbols-outlined text-[12px]">
                          {isOverdue(task) ? 'schedule' : 'event'}
                        </span>
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>

                  {/* 标签 */}
                  {displaySettings.show_tags && task.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {task.tags.slice(0, 2).map((tag) => (
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
                      {task.tags.length > 2 && (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                          +{task.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 子任务进度 */}
                  {task.subtasks_count > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all"
                          style={{
                            width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {task.completed_subtasks_count}/{task.subtasks_count}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* 空状态 */}
            {groupTasks.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <span className="material-symbols-outlined text-[32px] mb-2 block">inbox</span>
                <p className="text-sm">暂无任务</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;