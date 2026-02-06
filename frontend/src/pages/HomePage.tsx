import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ViewRenderer from '../components/ViewRenderer';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';
import { useViewTasks, useNavViews, useView } from '../hooks/useViews';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<string>('');
  const projectFilter = searchParams.get('project');

  const { data: navViews, isLoading: isNavViewsLoading, error: navViewsError } = useNavViews();
  const { data: viewTasks, isLoading: isViewTasksLoading } = useViewTasks(currentView);
  const { data: viewData, isLoading: isViewDataLoading } = useView(currentView);

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

  const handleOpenViewSettings = () => {
    // 直接跳转到当前视图的编辑页面
    if (currentView) {
      navigate(`/views/edit/${currentView}`);
    }
  };

  // 获取当前视图的显示设置
  const displaySettings = viewData?.display_settings as any;
  const selectedCardId = displaySettings?.card_template_id || 'default';
  const currentCardStyle = TASK_CARD_TEMPLATES.find(template => template.id === selectedCardId);
  const showCompleted = displaySettings?.show_completed ?? false;

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden min-h-screen">
      <Header 
        onSearch={handleSearch} 
        onFilter={handleFilter}
        onViewChange={handleViewChange}
        currentView={currentView}
        onOpenViewSettings={handleOpenViewSettings}
      />
      
      
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