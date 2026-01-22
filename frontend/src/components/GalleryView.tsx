import React from 'react';
import type { Task, TaskView } from '../types/index';
import { TaskPriority } from '../types/index';

interface GalleryViewProps {
  tasks: Task[];
  view: TaskView;
  onTaskClick?: (task: Task) => void;
}

const GalleryView: React.FC<GalleryViewProps> = ({
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
    card_size: 'medium',
  };

  const getCardSize = () => {
    switch (displaySettings.card_size) {
      case 'small':
        return 'h-32';
      case 'large':
        return 'h-48';
      default:
        return 'h-40';
    }
  };

  const getGridCols = () => {
    switch (displaySettings.card_size) {
      case 'small':
        return 'grid-cols-3';
      case 'large':
        return 'grid-cols-1';
      default:
        return 'grid-cols-2';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'border-gray-300';
      case TaskPriority.MEDIUM:
        return 'border-yellow-300';
      case TaskPriority.HIGH:
        return 'border-orange-300';
      case TaskPriority.URGENT:
        return 'border-red-300';
      default:
        return 'border-gray-300';
    }
  };

  const getPriorityBadgeColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.LOW:
        return 'bg-gray-100 text-gray-600';
      case TaskPriority.MEDIUM:
        return 'bg-yellow-100 text-yellow-700';
      case TaskPriority.HIGH:
        return 'bg-orange-100 text-orange-700';
      case TaskPriority.URGENT:
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
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

  const getTaskImage = (task: Task) => {
    // 这里可以根据任务类型、标签或附件生成不同的背景图案
    const colors = [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-pink-400 to-pink-600',
      'from-yellow-400 to-yellow-600',
      'from-indigo-400 to-indigo-600',
      'from-red-400 to-red-600',
      'from-teal-400 to-teal-600',
    ];
    
    // 根据任务标题的哈希值选择颜色
    const hash = task.title.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    const colorIndex = Math.abs(hash) % colors.length;
    return colors[colorIndex];
  };

  const getTaskIcon = (task: Task) => {
    // 根据任务内容或标签返回合适的图标
    if (task.tags.some(tag => tag.name.includes('设计'))) return 'palette';
    if (task.tags.some(tag => tag.name.includes('开发'))) return 'code';
    if (task.tags.some(tag => tag.name.includes('会议'))) return 'groups';
    if (task.tags.some(tag => tag.name.includes('文档'))) return 'description';
    if (task.tags.some(tag => tag.name.includes('测试'))) return 'bug_report';
    if (task.content?.includes('创意')) return 'lightbulb';
    if (task.content?.includes('计划')) return 'event_note';
    return 'task_alt';
  };

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">photo_library</span>
        <p className="text-sm">没有找到匹配的任务</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 视图控制 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {tasks.length} 个任务
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">卡片大小:</span>
          <div className="flex items-center gap-1">
            {['small', 'medium', 'large'].map((size) => (
              <button
                key={size}
                className={`
                  px-2 py-1 text-xs rounded transition-colors
                  ${displaySettings.card_size === size
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }
                `}
              >
                {size === 'small' ? '小' : size === 'large' ? '大' : '中'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 画廊网格 */}
      <div className={`grid ${getGridCols()} gap-4`}>
        {tasks.map((task) => (
          <div
            key={task.uid}
            onClick={() => onTaskClick?.(task)}
            className={`
              relative overflow-hidden rounded-xl border-2 cursor-pointer hover:shadow-lg transition-all
              ${getCardSize()}
              ${getPriorityColor(task.priority)}
              ${task.is_completed ? 'opacity-60' : ''}
            `}
          >
            {/* 背景图案 */}
            <div className={`
              absolute inset-0 bg-gradient-to-br ${getTaskImage(task)} opacity-80
            `}>
              {/* 图案装饰 */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-4 right-4">
                  <span className="material-symbols-outlined text-white text-[32px]">
                    {getTaskIcon(task)}
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 opacity-30">
                  <div className="grid grid-cols-3 gap-1">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-white rounded-full"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 内容覆盖层 */}
            <div className="absolute inset-0 bg-black bg-opacity-40 p-4 flex flex-col justify-between">
              {/* 顶部信息 */}
              <div className="flex items-start justify-between">
                {/* 状态指示器 */}
                <div className="flex items-center gap-2">
                  {task.is_completed && (
                    <div className="size-6 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[14px]">check</span>
                    </div>
                  )}
                  {isOverdue(task) && !task.is_completed && (
                    <div className="size-6 bg-red-500 rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[14px]">schedule</span>
                    </div>
                  )}
                </div>

                {/* 优先级徽章 */}
                {displaySettings.show_priority && task.priority > TaskPriority.LOW && (
                  <div className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${getPriorityBadgeColor(task.priority)}
                  `}>
                    {task.priority_display}
                  </div>
                )}
              </div>

              {/* 底部信息 */}
              <div className="space-y-2">
                {/* 任务标题 */}
                <h3 className={`
                  text-white font-semibold leading-tight
                  ${task.is_completed ? 'line-through opacity-75' : ''}
                  ${displaySettings.card_size === 'small' ? 'text-sm' : 
                    displaySettings.card_size === 'large' ? 'text-lg' : 'text-base'}
                `}>
                  {task.title}
                </h3>

                {/* 任务描述 */}
                {task.content && displaySettings.card_size !== 'small' && (
                  <p className="text-white text-sm opacity-90 line-clamp-2">
                    {task.content}
                  </p>
                )}

                {/* 元数据 */}
                <div className="flex items-center justify-between text-xs text-white opacity-90">
                  <div className="flex items-center gap-3">
                    {/* 项目 */}
                    {displaySettings.show_project && (
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">folder</span>
                        {task.project.name}
                      </span>
                    )}
                    
                    {/* 截止日期 */}
                    {displaySettings.show_due_date && task.due_date && (
                      <span className={`
                        flex items-center gap-1
                        ${isOverdue(task) ? 'text-red-300' : ''}
                      `}>
                        <span className="material-symbols-outlined text-[12px]">
                          {isOverdue(task) ? 'schedule' : 'event'}
                        </span>
                        {formatDate(task.due_date)}
                      </span>
                    )}
                  </div>

                  {/* 子任务进度 */}
                  {task.subtasks_count > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">checklist</span>
                      {task.completed_subtasks_count}/{task.subtasks_count}
                    </span>
                  )}
                </div>

                {/* 标签 */}
                {displaySettings.show_tags && task.tags.length > 0 && displaySettings.card_size !== 'small' && (
                  <div className="flex flex-wrap gap-1">
                    {task.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag.uid}
                        className="px-2 py-0.5 text-xs rounded-full bg-white bg-opacity-20 text-white"
                      >
                        {tag.name}
                      </span>
                    ))}
                    {task.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-white bg-opacity-20 text-white">
                        +{task.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}

                {/* 进度条 */}
                {task.subtasks_count > 0 && displaySettings.card_size === 'large' && (
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-1.5">
                    <div
                      className="bg-white h-1.5 rounded-full transition-all"
                      style={{
                        width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 悬停效果 */}
            <div className="absolute inset-0 bg-primary bg-opacity-0 hover:bg-opacity-10 transition-all"></div>
          </div>
        ))}
      </div>

      {/* 统计信息 */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <div className="grid grid-cols-4 gap-4 text-center text-sm">
          <div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{tasks.length}</div>
            <div className="text-gray-600 dark:text-gray-400">总任务</div>
          </div>
          <div>
            <div className="text-lg font-bold text-green-500">
              {tasks.filter(t => t.is_completed).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">已完成</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-500">
              {tasks.filter(t => !t.is_completed).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">进行中</div>
          </div>
          <div>
            <div className="text-lg font-bold text-red-500">
              {tasks.filter(t => t.is_overdue).length}
            </div>
            <div className="text-gray-600 dark:text-gray-400">逾期</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GalleryView;