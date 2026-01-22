import React, { useState, useMemo } from 'react';
import type { Task, TaskView } from '../types/index';
import { TaskStatus, TaskPriority } from '../types/index';

interface TableViewProps {
  tasks: Task[];
  view: TaskView;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (task: Task, updates: Partial<Task>) => void;
}

const TableView: React.FC<TableViewProps> = ({
  tasks,
  view,
  onTaskClick,
  onTaskUpdate,
}) => {
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const displaySettings = view.display_settings || {
    show_project: true,
    show_tags: true,
    show_due_date: true,
    show_priority: true,
    show_status: true,
    compact_mode: false,
  };

  // 定义表格列
  const columns = useMemo(() => {
    const cols = [
      { key: 'title', label: '任务标题', sortable: true, width: 'flex-1' },
    ];

    if (displaySettings.show_status) {
      cols.push({ key: 'status', label: '状态', sortable: true, width: 'w-24' });
    }

    if (displaySettings.show_priority) {
      cols.push({ key: 'priority', label: '优先级', sortable: true, width: 'w-20' });
    }

    if (displaySettings.show_project) {
      cols.push({ key: 'project', label: '项目', sortable: true, width: 'w-32' });
    }

    if (displaySettings.show_due_date) {
      cols.push({ key: 'due_date', label: '截止日期', sortable: true, width: 'w-28' });
    }

    if (displaySettings.show_tags) {
      cols.push({ key: 'tags', label: '标签', sortable: false, width: 'w-40' });
    }

    cols.push({ key: 'actions', label: '操作', sortable: false, width: 'w-20' });

    return cols;
  }, [displaySettings]);

  // 排序任务
  const sortedTasks = useMemo(() => {
    if (!sortField) return tasks;

    return [...tasks].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'priority':
          aValue = a.priority;
          bValue = b.priority;
          break;
        case 'project':
          aValue = a.project.name.toLowerCase();
          bValue = b.project.name.toLowerCase();
          break;
        case 'due_date':
          aValue = a.due_date ? new Date(a.due_date).getTime() : 0;
          bValue = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case TaskStatus.UNASSIGNED:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
      case TaskStatus.TODO:
        return 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
      case TaskStatus.COMPLETED:
        return 'text-green-500 bg-green-100 dark:bg-green-900/30';
      case TaskStatus.ABANDONED:
        return 'text-red-500 bg-red-100 dark:bg-red-900/30';
      default:
        return 'text-gray-500 bg-gray-100 dark:bg-gray-800';
    }
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
    
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const isOverdue = (task: Task) => {
    if (!task.due_date || task.is_completed) return false;
    return new Date(task.due_date) < new Date();
  };

  const handleStatusToggle = (task: Task) => {
    const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
    onTaskUpdate?.(task, { status: newStatus });
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">table</span>
        <p className="text-sm">没有找到匹配的任务</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        {/* 表格头部 */}
        <div className={`
          flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700
          ${displaySettings.compact_mode ? 'py-2' : 'py-3'}
        `}>
          {columns.map((column) => (
            <div
              key={column.key}
              className={`
                px-3 text-left text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider
                ${column.width}
                ${column.sortable ? 'cursor-pointer hover:text-gray-700 dark:hover:text-gray-200' : ''}
              `}
              onClick={() => column.sortable && handleSort(column.key)}
            >
              <div className="flex items-center gap-1">
                {column.label}
                {column.sortable && sortField === column.key && (
                  <span className="material-symbols-outlined text-[16px]">
                    {sortDirection === 'asc' ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 表格内容 */}
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {sortedTasks.map((task) => (
            <div
              key={task.uid}
              className={`
                flex items-center hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors
                ${displaySettings.compact_mode ? 'py-2' : 'py-3'}
                ${task.is_completed ? 'opacity-60' : ''}
              `}
            >
              {/* 任务标题 */}
              <div className="flex-1 px-3">
                <div
                  onClick={() => onTaskClick?.(task)}
                  className="cursor-pointer"
                >
                  <div className={`
                    font-medium text-gray-900 dark:text-white
                    ${task.is_completed ? 'line-through text-gray-500' : ''}
                    ${displaySettings.compact_mode ? 'text-sm' : 'text-base'}
                  `}>
                    {task.title}
                  </div>
                  {task.content && !displaySettings.compact_mode && (
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                      {task.content}
                    </div>
                  )}
                </div>
              </div>

              {/* 状态 */}
              {displaySettings.show_status && (
                <div className="w-24 px-3">
                  <button
                    onClick={() => handleStatusToggle(task)}
                    className={`
                      px-2 py-1 text-xs font-medium rounded-full transition-colors
                      ${getStatusColor(task.status)}
                    `}
                  >
                    {task.status_display}
                  </button>
                </div>
              )}

              {/* 优先级 */}
              {displaySettings.show_priority && (
                <div className="w-20 px-3">
                  <div className="flex items-center justify-center">
                    <span className={`${getPriorityColor(task.priority)}`}>
                      <span className="material-symbols-outlined text-[18px]">
                        {getPriorityIcon(task.priority)}
                      </span>
                    </span>
                  </div>
                </div>
              )}

              {/* 项目 */}
              {displaySettings.show_project && (
                <div className="w-32 px-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {task.project.name}
                  </div>
                </div>
              )}

              {/* 截止日期 */}
              {displaySettings.show_due_date && (
                <div className="w-28 px-3">
                  {task.due_date ? (
                    <div className={`
                      text-sm flex items-center gap-1
                      ${isOverdue(task) ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}
                    `}>
                      <span className="material-symbols-outlined text-[14px]">
                        {isOverdue(task) ? 'schedule' : 'event'}
                      </span>
                      {formatDate(task.due_date)}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">-</div>
                  )}
                </div>
              )}

              {/* 标签 */}
              {displaySettings.show_tags && (
                <div className="w-40 px-3">
                  <div className="flex flex-wrap gap-1">
                    {task.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag.uid}
                        className="px-1.5 py-0.5 text-xs rounded"
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
                      <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        +{task.tags.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* 操作 */}
              <div className="w-20 px-3">
                <button
                  onClick={() => onTaskClick?.(task)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">more_vert</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 表格底部统计 */}
      <div className="mt-4 bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>共 {tasks.length} 个任务</span>
          <div className="flex items-center gap-4">
            <span>已完成: {tasks.filter(t => t.is_completed).length}</span>
            <span>进行中: {tasks.filter(t => !t.is_completed).length}</span>
            {tasks.some(t => t.is_overdue) && (
              <span className="text-red-500">逾期: {tasks.filter(t => t.is_overdue).length}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableView;