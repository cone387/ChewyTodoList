import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ViewRenderer from '../components/ViewRenderer';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';
import TaskCardSelector from '../components/TaskCardSelector';
import { useViewTasks, useNavViews, useView, useUpdateView } from '../hooks/useViews';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';
import type { TaskCardTemplate } from '../types/taskCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);
  const [showTaskCardSelector, setShowTaskCardSelector] = useState<boolean>(false);
  const [selectedTaskCard, setSelectedTaskCard] = useState<string>('default');
  const projectFilter = searchParams.get('project');

  const { data: navViews, isLoading: isNavViewsLoading, error: navViewsError } = useNavViews();
  const { data: viewTasks, isLoading: isViewTasksLoading } = useViewTasks(currentView);
  const { data: viewData, isLoading: isViewDataLoading } = useView(currentView);
  const updateView = useUpdateView();

  // 计算加载状态
  const isLoading = isNavViewsLoading || (currentView && (isViewDataLoading || isViewTasksLoading));
  const hasNoViews = !isNavViewsLoading && (!navViews?.results || navViews.results.length === 0);

  useEffect(() => {
    // 设置默认视图
    if (navViews?.results && navViews.results.length > 0 && !currentView) {
      const defaultView = navViews.results.find(v => v.is_default) || navViews.results[0];
      setCurrentView(defaultView.uid);
    }
  }, [navViews, currentView]);

  useEffect(() => {
    // 如果有项目筛选参数，可以在这里处理
    if (projectFilter) {
      console.log('Filtering by project:', projectFilter);
    }
  }, [projectFilter]);

  const handleSearch = (query: string) => {
    // TODO: 实现搜索功能
    console.log('Search query:', query);
  };

  const handleFilter = () => {
    // TODO: 实现筛选功能
    console.log('Filter clicked');
  };

  const handleViewChange = (viewUid: string) => {
    setCurrentView(viewUid);
  };

  const handleTaskClick = (task: any) => {
    navigate(`/task/${task.uid}`);
  };

  const handleTaskUpdate = (task: any, updates: any) => {
    // TODO: 实现任务更新功能
    console.log('Update task:', task, updates);
  };

  const handleToggleCompleted = () => {
    setShowCompleted(!showCompleted);
  };

  const handleSelectTemplate = () => {
    setShowTemplateSelector(!showTemplateSelector);
  };

  const handleSelectTaskCard = () => {
    setShowTaskCardSelector(!showTaskCardSelector);
  };

  // 获取当前选择的卡片样式对象
  const currentCardStyle = TASK_CARD_TEMPLATES.find(template => template.id === selectedTaskCard);

  const viewTypes = [
    { value: 'list', label: '列表视图', icon: 'list' },
    { value: 'board', label: '看板视图', icon: 'view_kanban' },
    { value: 'calendar', label: '日历视图', icon: 'calendar_month' },
    { value: 'table', label: '表格视图', icon: 'table' },
    { value: 'timeline', label: '时间线视图', icon: 'timeline' },
    { value: 'gallery', label: '画廊视图', icon: 'grid_view' },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden min-h-screen">
      <Header 
        onSearch={handleSearch} 
        onFilter={handleFilter}
        onViewChange={handleViewChange}
        currentView={currentView}
        showCompleted={showCompleted}
        onToggleCompleted={handleToggleCompleted}
        onSelectTemplate={handleSelectTemplate}
        onSelectTaskCard={handleSelectTaskCard}
      />
      
      {/* 视图类型选择器 */}
      {showTemplateSelector && viewData && (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-black/50 flex items-end max-w-md mx-auto">
          <div className="w-full bg-white dark:bg-surface-dark rounded-t-2xl p-4 pb-safe">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">选择视图类型</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">定义任务的展示格局</p>
              </div>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
              {viewTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={async () => {
                    if (viewData && currentView) {
                      try {
                        await updateView.mutateAsync({
                          uid: currentView,
                          data: { view_type: type.value }
                        });
                        setShowTemplateSelector(false);
                      } catch (error) {
                        console.error('切换视图类型失败:', error);
                      }
                    }
                  }}
                  disabled={updateView.isPending}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    viewData.view_type === type.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  } ${updateView.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`material-symbols-outlined text-[32px] ${
                      viewData.view_type === type.value
                        ? 'text-primary'
                        : 'text-gray-400'
                    }`}>
                      {type.icon}
                    </span>
                    <span className={`text-sm font-medium ${
                      viewData.view_type === type.value
                        ? 'text-primary'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}>
                      {type.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 任务卡片样式选择器 */}
      {showTaskCardSelector && (
        <TaskCardSelector
          selectedId={selectedTaskCard}
          onSelect={(template: TaskCardTemplate) => {
            setSelectedTaskCard(template.id);
            setShowTaskCardSelector(false);
          }}
          onClose={() => setShowTaskCardSelector(false)}
          viewType={viewData?.view_type}
          isModal={true}
          title="选择任务卡片样式"
        />
      )}
      
      <main className={`pb-16 bg-white dark:bg-background-dark ${
        viewData?.view_type === 'board' ? '' : 'overflow-y-auto px-4 pt-4'
      }`}>
        {/* 加载中状态 */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* 加载失败状态 */}
        {!isLoading && navViewsError && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <span className="material-symbols-outlined text-[48px] text-red-400 mb-4">error</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">加载失败</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              无法加载数据，请检查网络连接或重新登录
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90"
            >
              重新加载
            </button>
          </div>
        )}

        {/* 没有视图的空状态 */}
        {!isLoading && !navViewsError && hasNoViews && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600 mb-4">view_list</span>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">还没有视图</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mb-4">
              创建您的第一个视图来开始管理任务
            </p>
            <button
              onClick={() => navigate('/views/create')}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              创建视图
            </button>
          </div>
        )}

        {/* 正常显示视图内容 */}
        {!isLoading && !navViewsError && !hasNoViews && viewData && (
          <div className={viewData.view_type === 'board' ? 'pt-4' : ''}>
            <ViewRenderer
              view={viewData}
              tasks={viewTasks?.results || []}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
              showCompleted={showCompleted}
              cardStyle={currentCardStyle}
            />
          </div>
        )}
      </main>
      <FloatingAddButton />
      <BottomNav />
    </div>
  );
};

export default HomePage;