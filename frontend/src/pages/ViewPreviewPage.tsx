import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useView, useViewTasks } from '../hooks/useViews';
import { useUpdateTask } from '../hooks/useTasks';
import EnhancedTaskList from '../components/EnhancedTaskList';
import type { Task } from '../types/index';

const ViewPreviewPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data: view, isLoading: viewLoading } = useView(uid!);
  const { data: tasksResponse, isLoading: tasksLoading } = useViewTasks(uid!, { page });
  const updateTask = useUpdateTask();

  const tasks = tasksResponse?.results || [];
  const hasMore = !!tasksResponse?.next;

  const handleBack = () => {
    navigate('/views');
  };

  const handleTaskClick = (task: Task) => {
    navigate(`/tasks/${task.uid}`);
  };

  const handleTaskUpdate = async (task: Task, updates: Partial<Task>) => {
    try {
      await updateTask.mutateAsync({
        uid: task.uid,
        data: updates,
      });
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
  };

  const getViewTypeIcon = (viewType: string) => {
    switch (viewType) {
      case 'list':
        return 'list';
      case 'board':
        return 'view_kanban';
      case 'calendar':
        return 'calendar_month';
      case 'table':
        return 'table';
      default:
        return 'list';
    }
  };

  const getViewTypeColor = (viewType: string) => {
    switch (viewType) {
      case 'list':
        return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
      case 'board':
        return 'text-green-500 bg-green-50 dark:bg-green-900/20';
      case 'calendar':
        return 'text-purple-500 bg-purple-50 dark:bg-purple-900/20';
      case 'table':
        return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
      default:
        return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  if (viewLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!view) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-gray-400">
        <span className="material-symbols-outlined text-[48px] mb-4">error</span>
        <p className="text-sm">视图不存在</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
        >
          返回视图列表
        </button>
      </div>
    );
  }

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
          
          <div className="flex items-center gap-2 flex-1 min-w-0 mx-3">
            <div className={`size-8 rounded-lg flex items-center justify-center ${getViewTypeColor(view.view_type)}`}>
              <span className="material-symbols-outlined text-[20px]">
                {getViewTypeIcon(view.view_type)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-base font-semibold truncate">{view.name}</h1>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <span>{view.view_type_display}</span>
                {view.project && (
                  <span>• {view.project.name}</span>
                )}
                {view.is_default && (
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded">默认</span>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => navigate(`/views/edit/${uid}`)}
            className="text-[#5f6368] dark:text-white flex items-center justify-center size-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">edit</span>
          </button>
        </div>

        {/* 视图统计信息 */}
        <div className="px-3 pb-3">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[16px]">task</span>
              {tasksResponse?.count || 0} 个任务
            </span>
            
            {view.filters && view.filters.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                {view.filters.length} 个筛选
              </span>
            )}
            
            {view.sorts && view.sorts.length > 0 && (
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">sort</span>
                {view.sorts.length} 个排序
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 120px)' }}>
        <div className="p-4">
          {tasksLoading && page === 1 ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              <EnhancedTaskList
                tasks={tasks}
                view={view}
                onTaskClick={handleTaskClick}
                onTaskUpdate={handleTaskUpdate}
              />
              
              {/* 加载更多 */}
              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={tasksLoading}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {tasksLoading ? '加载中...' : '加载更多'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewPreviewPage;