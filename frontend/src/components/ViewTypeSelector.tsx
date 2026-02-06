import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ViewTypeSelectorProps {
  selectedType: string;
  onSelect: (type: string) => void;
  onClose?: () => void;
  isModal?: boolean;
  title?: string;
  showPreview?: boolean;
}

const VIEW_TYPES = [
  { 
    value: 'list', 
    label: '列表视图', 
    icon: 'list',
    description: '经典的任务列表，适合线性浏览和快速操作',
    color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
  },
  { 
    value: 'board', 
    label: '看板视图', 
    icon: 'view_kanban',
    description: '按状态分列展示，适合项目管理和工作流',
    color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
  },
  { 
    value: 'calendar', 
    label: '日历视图', 
    icon: 'calendar_month',
    description: '按日期展示任务，适合时间规划和日程管理',
    color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
  },
  { 
    value: 'table', 
    label: '表格视图', 
    icon: 'table',
    description: '电子表格形式，适合批量编辑和数据分析',
    color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
  },
  { 
    value: 'timeline', 
    label: '时间线视图', 
    icon: 'timeline',
    description: '时间轴展示，适合项目进度和里程碑追踪',
    color: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400'
  },
  { 
    value: 'gallery', 
    label: '画廊视图', 
    icon: 'grid_view',
    description: '卡片网格展示，适合视觉化内容和创意项目',
    color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400'
  },
];

const ViewTypeSelector: React.FC<ViewTypeSelectorProps> = ({
  selectedType,
  onSelect,
  onClose,
  isModal = false,
  title = '选择视图类型',
  showPreview = true,
}) => {
  const navigate = useNavigate();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isModal) {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    }
  }, [isModal]);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const handleSelect = (type: string) => {
    onSelect(type);
    if (isModal) {
      handleClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handlePreview = (e: React.MouseEvent, viewType: string) => {
    e.stopPropagation();
    // 跳转到视图广场页面，并筛选对应的视图类型
    navigate(`/views/templates?type=${viewType}`);
    onClose?.();
  };

  const content = (
    <div className="grid grid-cols-1 gap-3">
      {VIEW_TYPES.map((type) => (
        <div
          key={type.value}
          onClick={() => handleSelect(type.value)}
          className={`cursor-pointer transition-all rounded-xl overflow-hidden border-2 ${
            selectedType === type.value
              ? 'border-primary ring-2 ring-primary/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <div className="p-4 flex items-start gap-4">
            {/* 图标 */}
            <div className={`size-12 rounded-xl flex items-center justify-center flex-shrink-0 ${type.color}`}>
              <span className="material-symbols-outlined text-[28px]">
                {type.icon}
              </span>
            </div>
            
            {/* 内容 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className={`font-semibold ${
                  selectedType === type.value
                    ? 'text-primary'
                    : 'text-gray-900 dark:text-white'
                }`}>
                  {type.label}
                </h4>
                {selectedType === type.value && (
                  <span className="material-symbols-outlined text-primary text-[18px] fill-1">
                    check_circle
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {type.description}
              </p>
              
              {/* 预览按钮 */}
              {showPreview && (
                <button
                  onClick={(e) => handlePreview(e, type.value)}
                  className="mt-2 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">visibility</span>
                  <span>查看示例</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (isModal) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${
          isAnimating && !isClosing ? 'bg-black/50' : 'bg-black/0'
        }`}
        onClick={handleBackdropClick}
      >
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

          {/* 头部 */}
          <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                选择适合你工作方式的视图类型
              </p>
            </div>
            <button
              onClick={handleClose}
              className="size-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-4 overscroll-contain">
            {content}
          </div>

          {/* 底部安全区域 */}
          <div className="pb-safe" />
        </div>
      </div>
    );
  }

  return content;
};

export default ViewTypeSelector;
