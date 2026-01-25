import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';
import type { TaskCardTemplate } from '../types/taskCard';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const TaskCardMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, info } = useToast();

  const handleBack = () => {
    navigate(-1);
  };

  const handlePreview = (template: TaskCardTemplate) => {
    const templateData = encodeURIComponent(JSON.stringify(template));
    navigate(`/task-card-preview?template=${templateData}`);
  };

  const handleApply = (template: TaskCardTemplate) => {
    // TODO: 实现应用卡片样式到视图的功能
    info(`即将应用"${template.name}"样式`);
  };

  const getLayoutIcon = (layout: string) => {
    switch (layout) {
      case 'compact': return 'view_compact';
      case 'comfortable': return 'view_comfortable';
      case 'spacious': return 'view_agenda';
      default: return 'view_list';
    }
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto">
        <div className="flex items-center p-3 justify-between">
          <button 
            onClick={handleBack}
            className="text-[#5f6368] dark:text-white flex items-center justify-center size-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">style</span>
            <span className="text-base font-semibold">任务卡片样式</span>
          </div>
          
          <div className="size-10" />
        </div>

        <div className="px-4 pb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            选择适合你的任务卡片显示样式
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto pb-4 bg-gray-50 dark:bg-background-dark" 
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 100px)' }}
      >
        <div className="p-4 space-y-4">
          {TASK_CARD_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                {/* 卡片头部 */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-primary text-[28px]">
                      {template.icon}
                    </span>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                      {template.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {template.description}
                    </p>
                  </div>
                </div>

                {/* 样式特性 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[16px]">
                      {getLayoutIcon(template.style.layout)}
                    </span>
                    <span>
                      {template.style.layout === 'compact' ? '紧凑布局' :
                       template.style.layout === 'comfortable' ? '舒适布局' : '宽松布局'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {template.style.showDescription && (
                      <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                        显示描述
                      </span>
                    )}
                    {template.style.showProject && (
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                        显示项目
                      </span>
                    )}
                    {template.style.showTags && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                        显示标签
                      </span>
                    )}
                    {template.style.showDueDate && (
                      <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                        显示日期
                      </span>
                    )}
                    {template.style.showPriority && (
                      <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded">
                        显示优先级
                      </span>
                    )}
                    {template.style.showSubtasks && (
                      <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs rounded">
                        子任务进度
                      </span>
                    )}
                  </div>

                  {/* 样式详情 */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">rounded_corner</span>
                      <span>
                        {template.style.borderRadius === 'none' ? '无圆角' :
                         template.style.borderRadius === 'small' ? '小圆角' :
                         template.style.borderRadius === 'medium' ? '中圆角' : '大圆角'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">shadow</span>
                      <span>
                        {template.style.shadow === 'none' ? '无阴影' :
                         template.style.shadow === 'small' ? '小阴影' :
                         template.style.shadow === 'medium' ? '中阴影' : '大阴影'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">format_size</span>
                      <span>
                        {template.style.titleSize === 'small' ? '小标题' :
                         template.style.titleSize === 'medium' ? '中标题' : '大标题'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">check_box</span>
                      <span>
                        {template.style.checkboxStyle === 'circle' ? '圆形复选框' :
                         template.style.checkboxStyle === 'square' ? '方形复选框' : '圆角复选框'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 预览提示 */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {template.preview}
                  </p>
                </div>
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-2 p-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => handlePreview(template)}
                  className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  预览效果
                </button>
                <button
                  onClick={() => handleApply(template)}
                  className="flex-1 py-2 px-3 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-80 transition-opacity"
                >
                  使用样式
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default TaskCardMarketPage;
