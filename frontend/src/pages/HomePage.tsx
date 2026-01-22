import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ViewRenderer from '../components/ViewRenderer';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';
import { useViewTasks, useNavViews, useView } from '../hooks/useViews';
import { TASK_CARD_TEMPLATES, type TaskCardTemplate } from '../types/taskCard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<string>('');
  const [showCompleted, setShowCompleted] = useState<boolean>(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState<boolean>(false);
  const [showTaskCardSelector, setShowTaskCardSelector] = useState<boolean>(false);
  const [selectedTaskCard, setSelectedTaskCard] = useState<string>('default');
  const projectFilter = searchParams.get('project');

  const { data: navViews } = useNavViews();
  const { data: viewTasks } = useViewTasks(currentView);
  const { data: viewData } = useView(currentView);

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

  const viewTypes = [
    { value: 'list', label: '列表视图', icon: 'list' },
    { value: 'board', label: '看板视图', icon: 'view_kanban' },
    { value: 'calendar', label: '日历视图', icon: 'calendar_month' },
    { value: 'table', label: '表格视图', icon: 'table' },
    { value: 'timeline', label: '时间线视图', icon: 'timeline' },
    { value: 'gallery', label: '画廊视图', icon: 'grid_view' },
  ];

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
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
                  onClick={() => {
                    // TODO: 实现切换视图类型的功能
                    console.log('Switch to view type:', type.value);
                    setShowTemplateSelector(false);
                  }}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    viewData.view_type === type.value
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
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
        <div className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-black/50 flex items-end max-w-md mx-auto">
          <div className="w-full bg-white dark:bg-surface-dark rounded-t-2xl p-4 pb-safe">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">选择任务卡片样式</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">定义单个任务的展示样式</p>
              </div>
              <button
                onClick={() => setShowTaskCardSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {TASK_CARD_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => {
                    setSelectedTaskCard(template.id);
                    setShowTaskCardSelector(false);
                  }}
                  className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                    selectedTaskCard === template.id
                      ? 'border-primary bg-primary/5 dark:bg-primary/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`size-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      selectedTaskCard === template.id
                        ? 'bg-primary/10 text-primary'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                    }`}>
                      <span className="material-symbols-outlined text-[24px]">
                        {template.icon}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className={`text-base font-semibold ${
                          selectedTaskCard === template.id
                            ? 'text-primary'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {template.name}
                        </h4>
                        {selectedTaskCard === template.id && (
                          <span className="material-symbols-outlined text-primary text-[18px] fill-1">
                            check_circle
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {template.description}
                      </p>
                      
                      {/* 样式特性标签 */}
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                          {template.style.layout === 'compact' ? '紧凑' : 
                           template.style.layout === 'comfortable' ? '舒适' : '宽松'}
                        </span>
                        {template.style.showDescription && (
                          <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                            显示描述
                          </span>
                        )}
                        {template.style.priorityIndicator !== 'none' && (
                          <span className="px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                            优先级
                          </span>
                        )}
                        {template.style.showTags && (
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                            标签
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {/* 底部提示 */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px] flex-shrink-0">
                  info
                </span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  任务卡片样式只影响单个任务的展示方式，不会改变任务的筛选和排序
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark px-4 pt-4">
        {viewData && viewTasks?.results ? (
          <ViewRenderer
            view={viewData}
            tasks={viewTasks.results}
            onTaskClick={handleTaskClick}
            onTaskUpdate={handleTaskUpdate}
            showCompleted={showCompleted}
          />
        ) : (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </main>
      <FloatingAddButton />
      <BottomNav />
    </div>
  );
};

export default HomePage;