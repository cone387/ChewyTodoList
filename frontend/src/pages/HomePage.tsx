import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ViewRenderer from '../components/ViewRenderer';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';
import { useViewTasks, useNavViews, useView, useUpdateView } from '../hooks/useViews';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';

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
  const updateView = useUpdateView();

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
        <div className="fixed top-0 left-0 right-0 bottom-0 z-40 bg-black/50 flex items-end max-w-md mx-auto">
          <div className="w-full bg-white dark:bg-surface-dark rounded-t-2xl pb-safe max-h-[90vh] flex flex-col">
            {/* 标题栏 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">选择任务卡片样式</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">点击选择，双击应用</p>
              </div>
              <button
                onClick={() => setShowTaskCardSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>
            
            {/* 样式列表 */}
            <div className="flex-1 overflow-y-auto p-3">
              <div className="grid grid-cols-1 gap-4">
                {TASK_CARD_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => setSelectedTaskCard(template.id)}
                    onDoubleClick={() => {
                      setSelectedTaskCard(template.id);
                      setShowTaskCardSelector(false);
                    }}
                    className={`rounded-lg border-2 transition-all cursor-pointer ${
                      selectedTaskCard === template.id
                        ? 'border-primary bg-primary/5 dark:bg-primary/10'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {/* 样式信息头部 */}
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`material-symbols-outlined text-[20px] ${
                          selectedTaskCard === template.id ? 'text-primary' : 'text-gray-400'
                        }`}>
                          {template.icon}
                        </span>
                        <h4 className={`text-sm font-semibold ${
                          selectedTaskCard === template.id
                            ? 'text-primary'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          {template.name}
                        </h4>
                        {selectedTaskCard === template.id && (
                          <span className="material-symbols-outlined text-primary text-[16px] fill-1 ml-auto">
                            check_circle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        {template.description}
                      </p>
                      
                      {/* 样式特性标签 */}
                      <div className="flex flex-wrap gap-1">
                        <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] rounded">
                          {template.style.layout === 'compact' ? '紧凑' : 
                           template.style.layout === 'comfortable' ? '舒适' : '宽松'}
                        </span>
                        {template.style.showDescription && (
                          <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-[10px] rounded">
                            描述
                          </span>
                        )}
                        {template.style.priorityIndicator !== 'none' && (
                          <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-[10px] rounded">
                            优先级
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* 预览示例 */}
                    <div className="p-3 bg-gray-50 dark:bg-gray-900">
                      <div className={`
                        bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 
                        ${template.style.borderRadius === 'none' ? 'rounded-none' :
                          template.style.borderRadius === 'small' ? 'rounded' :
                          template.style.borderRadius === 'medium' ? 'rounded-lg' : 'rounded-xl'}
                        ${template.style.shadow === 'none' ? 'shadow-none' :
                          template.style.shadow === 'small' ? 'shadow-sm' :
                          template.style.shadow === 'medium' ? 'shadow-md' : 'shadow-lg'}
                        ${template.style.padding === 'tight' ? 'p-2' :
                          template.style.padding === 'normal' ? 'p-3' : 'p-4'}
                        ${template.style.priorityIndicator === 'background' ? 'bg-orange-50 dark:bg-orange-900/20' : ''}
                        ${template.style.priorityIndicator === 'border' ? 'border-l-4 border-orange-500' : ''}
                      `}>
                        <div className="flex items-start gap-3">
                          {/* 复选框 */}
                          <div className={`
                            size-5 border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center flex-shrink-0
                            ${template.style.checkboxStyle === 'circle' ? 'rounded-full' :
                              template.style.checkboxStyle === 'square' ? 'rounded-none' : 'rounded'}
                          `} />
                          
                          <div className="flex-1 min-w-0">
                            {/* 标题 */}
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h5 className={`
                                text-gray-900 dark:text-white
                                ${template.style.titleSize === 'small' ? 'text-sm' :
                                  template.style.titleSize === 'medium' ? 'text-base' : 'text-lg'}
                                ${template.style.titleWeight === 'normal' ? 'font-normal' :
                                  template.style.titleWeight === 'medium' ? 'font-medium' :
                                  template.style.titleWeight === 'semibold' ? 'font-semibold' : 'font-bold'}
                              `}>
                                完成产品需求文档
                              </h5>
                              
                              {/* 优先级指示器 */}
                              {template.style.priorityIndicator === 'flag' && (
                                <span className="text-orange-500 flex-shrink-0">
                                  <span className={`material-symbols-outlined text-[16px] ${
                                    template.style.iconStyle === 'filled' ? 'fill-1' : ''
                                  }`}>
                                    flag
                                  </span>
                                </span>
                              )}
                              {template.style.priorityIndicator === 'dot' && (
                                <span className="size-2 rounded-full bg-orange-500 flex-shrink-0 mt-2" />
                              )}
                            </div>
                            
                            {/* 描述 */}
                            {template.style.showDescription && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-1">
                                整理用户反馈，更新PRD文档
                              </p>
                            )}
                            
                            {/* 元数据 */}
                            <div className={`
                              text-xs text-gray-500 dark:text-gray-400
                              ${template.style.metadataLayout === 'stacked' ? 'flex flex-col gap-1' :
                                template.style.metadataLayout === 'grid' ? 'grid grid-cols-2 gap-2' :
                                'flex items-center gap-3'}
                            `}>
                              {template.style.showProject && (
                                <span className="flex items-center gap-1">
                                  <span className={`material-symbols-outlined text-[12px] ${
                                    template.style.iconStyle === 'filled' ? 'fill-1' : ''
                                  }`}>folder</span>
                                  产品开发
                                </span>
                              )}
                              
                              {template.style.showDueDate && (
                                <span className="flex items-center gap-1">
                                  <span className={`material-symbols-outlined text-[12px] ${
                                    template.style.iconStyle === 'filled' ? 'fill-1' : ''
                                  }`}>event</span>
                                  明天
                                </span>
                              )}
                              
                              {template.style.showStatus && template.style.statusIndicator === 'badge' && (
                                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                  进行中
                                </span>
                              )}
                            </div>
                            
                            {/* 标签 */}
                            {template.style.showTags && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                <span className={`
                                  ${template.style.tagStyle === 'badge' ? 'px-2 py-1 rounded font-medium' :
                                    template.style.tagStyle === 'minimal' ? 'px-1.5 py-0.5 rounded-sm text-xs' :
                                    'px-2 py-0.5 rounded-full text-xs'}
                                `} style={{
                                  backgroundColor: '#8b5cf620',
                                  color: '#8b5cf6',
                                  border: '1px solid #8b5cf640'
                                }}>
                                  紧急
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 底部操作栏 */}
            <div className="border-t border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
              <div className="flex flex-col gap-3">
                {/* 浏览更多按钮 */}
                <button
                  onClick={() => {
                    setShowTaskCardSelector(false);
                    navigate('/task-cards');
                  }}
                  className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">store</span>
                  浏览更多卡片样式
                </button>
                
                {/* 提示和应用按钮 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2 flex-1">
                    <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[18px] flex-shrink-0">
                      info
                    </span>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      双击样式或点击应用按钮来使用该样式
                    </p>
                  </div>
                  <button
                    onClick={() => setShowTaskCardSelector(false)}
                    className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    应用
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className={`pb-16 bg-white dark:bg-background-dark ${
        viewData?.view_type === 'board' ? '' : 'overflow-y-auto px-4 pt-4'
      }`}>
        {viewData && viewTasks?.results ? (
          <div className={viewData.view_type === 'board' ? 'pt-4' : ''}>
            <ViewRenderer
              view={viewData}
              tasks={viewTasks.results}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
              showCompleted={showCompleted}
              cardStyle={currentCardStyle}
            />
          </div>
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