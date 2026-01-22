import React from 'react';
import type { Task, TaskView } from '../types/index';
import { TaskStatus, TaskPriority } from '../types/index';
import type { TaskCardTemplate } from '../types/taskCard';

interface EnhancedTaskListProps {
  tasks: Task[];
  view?: TaskView;
  onTaskClick?: (task: Task) => void;
  onTaskUpdate?: (task: Task, updates: Partial<Task>) => void;
  showCompleted?: boolean;
  cardStyle?: TaskCardTemplate;
}

const EnhancedTaskList: React.FC<EnhancedTaskListProps> = ({
  tasks,
  view,
  onTaskClick,
  onTaskUpdate,
  showCompleted = false,
  cardStyle,
}) => {
  const [isCompletedExpanded, setIsCompletedExpanded] = React.useState(false);
  
  // 使用卡片样式配置，如果没有提供则使用视图的显示设置
  const displaySettings = cardStyle ? {
    show_project: cardStyle.style.showProject,
    show_tags: cardStyle.style.showTags,
    show_due_date: cardStyle.style.showDueDate,
    show_priority: cardStyle.style.showPriority,
    show_status: cardStyle.style.showStatus,
    compact_mode: cardStyle.style.layout === 'compact',
  } : (view?.display_settings || {
    show_project: true,
    show_tags: true,
    show_due_date: true,
    show_priority: true,
    show_status: true,
    compact_mode: false,
  });

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
    if (diffDays > 0 && diffDays <= 7) return `${diffDays}天后`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}天前`;
    
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

  // 根据卡片样式获取CSS类
  const getCardClasses = () => {
    if (!cardStyle) return '';
    
    const classes = [];
    
    // 边框圆角
    const radiusMap = {
      none: 'rounded-none',
      small: 'rounded',
      medium: 'rounded-lg',
      large: 'rounded-xl',
    };
    classes.push(radiusMap[cardStyle.style.borderRadius]);
    
    // 阴影
    const shadowMap = {
      none: 'shadow-none',
      small: 'shadow-sm',
      medium: 'shadow-md',
      large: 'shadow-lg',
    };
    classes.push(shadowMap[cardStyle.style.shadow]);
    
    // 内边距
    const paddingMap = {
      tight: 'p-2',
      normal: 'p-3',
      loose: 'p-4',
    };
    classes.push(paddingMap[cardStyle.style.padding]);
    
    // 悬停效果
    const hoverMap = {
      lift: 'hover:shadow-lg hover:-translate-y-0.5 transition-all',
      glow: 'hover:shadow-xl hover:shadow-primary/20 transition-shadow',
      border: 'hover:border-primary transition-colors',
      none: '',
    };
    classes.push(hoverMap[cardStyle.style.hoverEffect]);
    
    return classes.join(' ');
  };

  // 根据卡片样式获取标题CSS类
  const getTitleClasses = (isCompleted: boolean) => {
    if (!cardStyle) {
      return `font-medium text-gray-900 dark:text-white ${isCompleted ? 'line-through text-gray-500' : ''}`;
    }
    
    const classes = [];
    
    // 字体大小
    const sizeMap = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };
    classes.push(sizeMap[cardStyle.style.titleSize]);
    
    // 字体粗细
    const weightMap = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    };
    classes.push(weightMap[cardStyle.style.titleWeight]);
    
    // 颜色和删除线
    if (isCompleted && cardStyle.style.showStrikethrough) {
      classes.push('line-through text-gray-500');
    } else if (isCompleted) {
      classes.push('text-gray-500');
    } else {
      classes.push('text-gray-900 dark:text-white');
    }
    
    return classes.join(' ');
  };

  // 根据卡片样式获取复选框样式
  const getCheckboxClasses = () => {
    if (!cardStyle) return 'rounded';
    
    const styleMap = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded',
    };
    return styleMap[cardStyle.style.checkboxStyle];
  };

  // 根据优先级指示器样式获取类
  const getPriorityIndicatorClasses = (priority: number) => {
    if (!cardStyle || cardStyle.style.priorityIndicator === 'none') return '';
    
    const colorMap: Record<number, string> = {
      [TaskPriority.LOW]: 'gray',
      [TaskPriority.MEDIUM]: 'yellow',
      [TaskPriority.HIGH]: 'orange',
      [TaskPriority.URGENT]: 'red',
    };
    const color = colorMap[priority] || 'gray';
    
    switch (cardStyle.style.priorityIndicator) {
      case 'background':
        return `bg-${color}-50 dark:bg-${color}-900/20`;
      case 'border':
        return `border-l-4 border-${color}-500`;
      case 'dot':
        return '';
      default:
        return '';
    }
  };

  // 分离已完成和未完成的任务
  const incompleteTasks = tasks.filter(task => !task.is_completed);
  const completedTasks = tasks.filter(task => task.is_completed);

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">task_alt</span>
        <p className="text-sm">没有找到匹配的任务</p>
      </div>
    );
  }

  // 根据视图分组设置对任务进行分组（只对未完成任务分组）
  const groupedTasks = React.useMemo(() => {
    if (!view?.group_by) {
      return { '': incompleteTasks };
    }

    const groups: Record<string, Task[]> = {};
    
    incompleteTasks.forEach(task => {
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
        case 'due_date':
          if (task.due_date) {
            const date = new Date(task.due_date);
            const today = new Date();
            const diffTime = date.getTime() - today.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays < 0) groupKey = '已逾期';
            else if (diffDays === 0) groupKey = '今天';
            else if (diffDays === 1) groupKey = '明天';
            else if (diffDays <= 7) groupKey = '本周';
            else if (diffDays <= 30) groupKey = '本月';
            else groupKey = '未来';
          } else {
            groupKey = '无截止日期';
          }
          break;
        default:
          groupKey = '未分组';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });
    
    return groups;
  }, [incompleteTasks, view?.group_by]);

  return (
    <div className="space-y-4">
      {/* 未完成任务分组 */}
      {Object.entries(groupedTasks).map(([groupName, groupTasks]) => (
        <div key={groupName} className="space-y-2">
          {/* 分组标题 - 只在有分组设置且分组名称不为空时显示 */}
          {view?.group_by && groupName && (
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {groupName}
              </h3>
              <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                {groupTasks.length}
              </span>
            </div>
          )}
          
          {/* 任务列表 */}
          <div className="space-y-2">
            {groupTasks.map((task) => (
              <div
                key={task.uid}
                onClick={() => onTaskClick?.(task)}
                className={`
                  bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 
                  cursor-pointer
                  ${getCardClasses()}
                  ${getPriorityIndicatorClasses(task.priority)}
                  ${displaySettings.compact_mode ? 'py-2' : ''}
                `}
              >
                <div className="flex items-start gap-3">
                  {/* 状态复选框 */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusToggle(task);
                    }}
                    className={`
                      size-5 border-2 flex items-center justify-center transition-colors flex-shrink-0
                      ${getCheckboxClasses()}
                      ${task.is_completed 
                        ? 'bg-green-500 border-green-500 text-white' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-green-500'
                      }
                    `}
                  >
                    {task.is_completed && (
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    )}
                  </button>

                  {/* 任务内容 */}
                  <div className="flex-1 min-w-0">
                    {/* 标题行 */}
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className={getTitleClasses(false)}>
                        {task.title}
                      </h3>
                      
                      {/* 优先级指示器 */}
                      {displaySettings.show_priority && task.priority > TaskPriority.LOW && 
                       cardStyle?.style.priorityIndicator === 'flag' && (
                        <span className={`${getPriorityColor(task.priority)} flex-shrink-0`}>
                          <span className={`material-symbols-outlined text-[16px] ${
                            cardStyle?.style.iconStyle === 'filled' ? 'fill-1' : ''
                          }`}>
                            {getPriorityIcon(task.priority)}
                          </span>
                        </span>
                      )}
                      
                      {/* 优先级点指示器 */}
                      {displaySettings.show_priority && task.priority > TaskPriority.LOW && 
                       cardStyle?.style.priorityIndicator === 'dot' && (
                        <span className={`size-2 rounded-full flex-shrink-0 ${
                          task.priority === TaskPriority.URGENT ? 'bg-red-500' :
                          task.priority === TaskPriority.HIGH ? 'bg-orange-500' :
                          'bg-yellow-500'
                        }`} />
                      )}
                    </div>

                    {/* 描述 */}
                    {cardStyle?.style.showDescription && task.content && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                        {task.content}
                      </p>
                    )}

                    {/* 元数据行 */}
                    <div className={`flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 ${
                      cardStyle?.style.metadataLayout === 'stacked' ? 'flex-col items-start' : 
                      cardStyle?.style.metadataLayout === 'grid' ? 'grid grid-cols-2' : ''
                    }`}>
                      {/* 项目 */}
                      {displaySettings.show_project && (
                        <span className="flex items-center gap-1">
                          <span className={`material-symbols-outlined text-[12px] ${
                            cardStyle?.style.iconStyle === 'filled' ? 'fill-1' : ''
                          }`}>folder</span>
                          {task.project.name}
                        </span>
                      )}
                      
                      {/* 状态 */}
                      {displaySettings.show_status && cardStyle?.style.statusIndicator === 'badge' && (
                        <span className={`
                          px-2 py-0.5 rounded-full text-xs font-medium
                          ${getStatusColor(task.status)}
                        `}>
                          {task.status_display}
                        </span>
                      )}
                      
                      {/* 截止日期 */}
                      {displaySettings.show_due_date && task.due_date && (
                        <span className={`
                          flex items-center gap-1
                          ${isOverdue(task) ? 'text-red-500' : ''}
                        `}>
                          <span className={`material-symbols-outlined text-[12px] ${
                            cardStyle?.style.iconStyle === 'filled' ? 'fill-1' : ''
                          }`}>
                            {isOverdue(task) ? 'schedule' : 'event'}
                          </span>
                          {formatDate(task.due_date)}
                        </span>
                      )}
                      
                      {/* 子任务计数 */}
                      {cardStyle?.style.showSubtasks && task.subtasks_count > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">subdirectory_arrow_right</span>
                          {task.completed_subtasks_count}/{task.subtasks_count}
                        </span>
                      )}
                    </div>

                    {/* 标签 */}
                    {displaySettings.show_tags && task.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {task.tags.map((tag) => {
                          const tagStyleClass = cardStyle?.style.tagStyle === 'badge' ? 'px-2 py-1 rounded font-medium' :
                                               cardStyle?.style.tagStyle === 'minimal' ? 'px-1.5 py-0.5 rounded-sm text-xs' :
                                               'px-2 py-0.5 rounded-full text-xs';
                          
                          return (
                            <span
                              key={tag.uid}
                              className={tagStyleClass}
                              style={{
                                backgroundColor: `${tag.color}20`,
                                color: tag.color,
                                border: `1px solid ${tag.color}40`,
                              }}
                            >
                              {tag.name}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* 已完成任务分组 - 可折叠 */}
      {showCompleted && completedTasks.length > 0 && (
        <div className="mt-6">
          <button
            onClick={() => setIsCompletedExpanded(!isCompletedExpanded)}
            className="w-full flex items-center justify-between px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[20px] fill-1">
                check_circle
              </span>
              <h3 className="text-sm font-medium text-green-700 dark:text-green-300">
                已完成
              </h3>
              <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                {completedTasks.length}
              </span>
            </div>
            <span className={`material-symbols-outlined text-green-600 dark:text-green-400 text-[20px] transition-transform ${
              isCompletedExpanded ? 'rotate-180' : ''
            }`}>
              expand_more
            </span>
          </button>

          {/* 已完成任务列表 */}
          {isCompletedExpanded && (
            <div className="space-y-2 mt-2">
              {completedTasks.map((task) => (
                <div
                  key={task.uid}
                  onClick={() => onTaskClick?.(task)}
                  className={`
                    p-3 bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 
                    rounded-lg hover:shadow-sm transition-all cursor-pointer opacity-60
                    ${displaySettings.compact_mode ? 'py-2' : 'py-3'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    {/* 状态复选框 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStatusToggle(task);
                      }}
                      className="size-5 rounded border-2 bg-green-500 border-green-500 text-white flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">check</span>
                    </button>

                    {/* 任务内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 标题行 */}
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`
                          font-medium text-gray-500 line-through
                          ${displaySettings.compact_mode ? 'text-sm' : 'text-base'}
                        `}>
                          {task.title}
                        </h3>
                      </div>

                      {/* 元数据行 */}
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        {/* 项目 */}
                        {displaySettings.show_project && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">folder</span>
                            {task.project.name}
                          </span>
                        )}
                        
                        {/* 完成时间 */}
                        {task.updated_at && (
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">schedule</span>
                            {new Date(task.updated_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* 标签 */}
                      {displaySettings.show_tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {task.tags.map((tag) => (
                            <span
                              key={tag.uid}
                              className="px-2 py-0.5 text-xs rounded-full opacity-60"
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedTaskList;