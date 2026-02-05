import React, { useMemo, useState, useEffect } from 'react';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';
import type { TaskCardTemplate } from '../types/taskCard';
import type { Task } from '../types/index';
import { TaskStatus, TaskPriority } from '../types/index';

interface TaskCardSelectorProps {
  selectedId: string;
  onSelect: (template: TaskCardTemplate) => void;
  onClose?: () => void;
  viewType?: string;
  isModal?: boolean;
  title?: string;
}

const TaskCardSelector: React.FC<TaskCardSelectorProps> = ({
  selectedId,
  onSelect,
  onClose,
  viewType,
  isModal = false,
  title = '选择任务卡片样式',
}) => {
  // iOS 风格动画状态
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isModal) {
      // 延迟触发进入动画
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    }
  }, [isModal]);

  // 处理关闭动画
  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  // 处理选择并关闭
  const handleSelect = (template: TaskCardTemplate) => {
    onSelect(template);
    if (isModal) {
      handleClose();
    }
  };

  // 点击背景关闭
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };
  // 根据视图类型筛选可用的卡片模板
  const availableTemplates = useMemo(() => {
    if (!viewType) return TASK_CARD_TEMPLATES;

    const templatesByViewType: Record<string, string[]> = {
      list: ['default', 'minimal', 'detailed', 'colorful', 'timeline'],
      board: ['kanban', 'default', 'minimal', 'colorful'],
      calendar: ['minimal', 'default', 'timeline'],
      table: ['minimal', 'default'],
      timeline: ['timeline', 'default', 'minimal'],
      gallery: ['detailed', 'colorful', 'default'],
    };

    const availableIds = templatesByViewType[viewType] || TASK_CARD_TEMPLATES.map(t => t.id);
    return TASK_CARD_TEMPLATES.filter(t => availableIds.includes(t.id));
  }, [viewType]);

  // 示例任务数据用于预览
  const sampleTask: Task = useMemo(() => {
    const mockGroup: any = {
      uid: 'g1',
      name: '默认分组',
      sort_order: 0,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      projects_count: 1,
    };

    const mockProject: any = {
      uid: 'p1',
      name: '产品开发',
      group: mockGroup,
      view_type: 'list',
      style: {},
      settings: {},
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks_count: 0,
      completed_tasks_count: 0,
    };

    return {
      uid: 'sample-1',
      title: '完成项目文档',
      content: '编写项目的技术文档和用户手册',
      status: TaskStatus.TODO,
      status_display: '待办',
      priority: TaskPriority.HIGH,
      priority_display: '高优先级',
      due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      is_completed: false,
      is_all_day: false,
      time_zone: 'Asia/Shanghai',
      sort_order: 0,
      attachments: [],
      is_overdue: false,
      project: mockProject,
      tags: [
        { uid: 't1', name: '文档', color: '#3B82F6', sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { uid: 't2', name: '重要', color: '#EF4444', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      ],
      subtasks_count: 5,
      completed_subtasks_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as Task;
  }, []);

  // 渲染单个任务卡片预览
  const renderTaskCardPreview = (template: TaskCardTemplate) => {
    const style = template.style;
    
    // 边框圆角
    const radiusClass = {
      none: 'rounded-none',
      small: 'rounded',
      medium: 'rounded-lg',
      large: 'rounded-xl',
    }[style.borderRadius];
    
    // 阴影
    const shadowClass = {
      none: '',
      small: 'shadow-sm',
      medium: 'shadow-md',
      large: 'shadow-lg',
    }[style.shadow];
    
    // 内边距
    const paddingClass = {
      tight: 'p-2',
      normal: 'p-3',
      loose: 'p-4',
    }[style.padding];

    // 标题大小
    const titleSizeClass = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    }[style.titleSize];

    // 标题粗细
    const titleWeightClass = {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    }[style.titleWeight];

    // 复选框样式
    const checkboxClass = {
      circle: 'rounded-full',
      square: 'rounded-none',
      rounded: 'rounded',
    }[style.checkboxStyle];

    // 优先级边框
    const priorityBorderClass = style.priorityIndicator === 'border' ? 'border-l-4 border-orange-500' : '';
    const priorityBgClass = style.priorityIndicator === 'background' ? 'bg-orange-50 dark:bg-orange-900/20' : '';

    return (
      <div className={`bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 ${radiusClass} ${shadowClass} ${paddingClass} ${priorityBorderClass} ${priorityBgClass}`}>
        <div className="flex items-start gap-3">
          {/* 复选框 */}
          <div className={`size-5 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0 mt-0.5 ${checkboxClass}`} />
          
          <div className="flex-1 min-w-0">
            {/* 标题行 */}
            <div className="flex items-start justify-between gap-2">
              <h5 className={`text-gray-900 dark:text-white ${titleSizeClass} ${titleWeightClass} line-clamp-1`}>
                {sampleTask.title}
              </h5>
              
              {/* 优先级指示器 */}
              {style.priorityIndicator === 'flag' && style.showPriority && (
                <span className="text-orange-500 flex-shrink-0">
                  <span className={`material-symbols-outlined text-[16px] ${style.iconStyle === 'filled' ? 'fill-1' : ''}`}>
                    flag
                  </span>
                </span>
              )}
              {style.priorityIndicator === 'dot' && style.showPriority && (
                <span className="size-2 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
              )}
            </div>
            
            {/* 描述 */}
            {style.showDescription && sampleTask.content && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                {sampleTask.content}
              </p>
            )}
            
            {/* 元数据 */}
            <div className={`mt-2 text-xs text-gray-500 dark:text-gray-400 ${
              style.metadataLayout === 'stacked' ? 'flex flex-col gap-1' :
              style.metadataLayout === 'grid' ? 'grid grid-cols-2 gap-2' :
              'flex items-center gap-3 flex-wrap'
            }`}>
              {style.showProject && sampleTask.project && (
                <span className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[12px] ${style.iconStyle === 'filled' ? 'fill-1' : ''}`}>folder</span>
                  {sampleTask.project.name}
                </span>
              )}
              
              {style.showDueDate && sampleTask.due_date && (
                <span className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[12px] ${style.iconStyle === 'filled' ? 'fill-1' : ''}`}>event</span>
                  2天后
                </span>
              )}
              
              {style.showSubtasks && sampleTask.subtasks_count > 0 && (
                <span className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-[12px] ${style.iconStyle === 'filled' ? 'fill-1' : ''}`}>checklist</span>
                  {sampleTask.completed_subtasks_count}/{sampleTask.subtasks_count}
                </span>
              )}
              
              {style.showStatus && style.statusIndicator === 'badge' && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  待办
                </span>
              )}
            </div>
            
            {/* 标签 */}
            {style.showTags && sampleTask.tags && sampleTask.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {sampleTask.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag.uid}
                    className={`text-xs ${
                      style.tagStyle === 'badge' ? 'px-2 py-1 rounded font-medium' :
                      style.tagStyle === 'minimal' ? 'px-1.5 py-0.5 rounded-sm' :
                      'px-2 py-0.5 rounded-full'
                    }`}
                    style={{
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      border: `1px solid ${tag.color}40`
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
    );
  };

  const content = (
    <div className="space-y-4">
      {availableTemplates.map((template) => (
        <div
          key={template.id}
          onClick={() => handleSelect(template)}
          className={`cursor-pointer transition-all ${
            selectedId === template.id
              ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900'
              : 'hover:ring-2 hover:ring-gray-300 dark:hover:ring-gray-600 hover:ring-offset-2 dark:hover:ring-offset-gray-900'
          } rounded-xl overflow-hidden`}
        >
          {/* 模板信息头部 */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="material-symbols-outlined text-primary text-[24px]">
                  {template.icon}
                </span>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h4>
                  {selectedId === template.id && (
                    <span className="material-symbols-outlined text-primary text-[18px] fill-1">
                      check_circle
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  {template.description}
                </p>
              </div>
            </div>
            
            {/* 样式特性标签 */}
            <div className="flex flex-wrap gap-1 mt-2">
              <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] rounded">
                {template.style.layout === 'compact' ? '紧凑' : 
                 template.style.layout === 'comfortable' ? '舒适' : '宽松'}
              </span>
              {template.style.showDescription && (
                <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] rounded">
                  描述
                </span>
              )}
              {template.style.showTags && (
                <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] rounded">
                  标签
                </span>
              )}
              {template.style.priorityIndicator !== 'none' && (
                <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] rounded">
                  优先级
                </span>
              )}
            </div>
          </div>
          
          {/* 卡片效果预览 */}
          <div className="p-3 bg-gray-100 dark:bg-gray-900">
            {renderTaskCardPreview(template)}
          </div>
        </div>
      ))}
    </div>
  );

  // 如果是弹窗模式
  if (isModal) {
    return (
      <div 
        className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${
          isAnimating && !isClosing ? 'bg-black/50' : 'bg-black/0'
        }`}
        onClick={handleBackdropClick}
      >
        {/* iOS 风格底部弹出面板 */}
        <div 
          className={`w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl flex flex-col overflow-hidden transform transition-transform duration-300 ease-out ${
            isAnimating && !isClosing ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ maxHeight: '85vh' }}
        >
          {/* iOS 风格拖动指示器 */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
          </div>
          
          {/* 弹窗头部 */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {viewType ? `适用于${viewType === 'list' ? '列表' : viewType === 'board' ? '看板' : viewType === 'calendar' ? '日历' : viewType === 'table' ? '表格' : viewType === 'timeline' ? '时间轴' : '画廊'}视图` : '点击选择卡片样式'}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="size-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          
          {/* 卡片列表 */}
          <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
            {content}
          </div>
          
          {/* 底部安全区域 */}
          <div className="pb-safe" />
        </div>
      </div>
    );
  }

  // 非弹窗模式，直接返回内容
  return content;
};

export default TaskCardSelector;
