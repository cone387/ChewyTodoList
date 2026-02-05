import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { TaskCardTemplate } from '../types/taskCard';
import TaskCardSelector from '../components/TaskCardSelector';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const TaskCardMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const { toasts, removeToast, success } = useToast();
  const [selectedId, setSelectedId] = useState<string>('default');

  const handleBack = () => {
    navigate(-1);
  };

  const handleSelect = (template: TaskCardTemplate) => {
    setSelectedId(template.id);
    success(`已选择"${template.name}"样式`);
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
            选择适合你的任务卡片显示样式，点击即可预览效果
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto pb-4 bg-gray-50 dark:bg-background-dark" 
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 100px)' }}
      >
        <div className="p-4">
          <TaskCardSelector
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>
      </main>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default TaskCardMarketPage;
