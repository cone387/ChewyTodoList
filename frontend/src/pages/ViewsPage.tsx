import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useViews, useSetDefaultView, useDuplicateView, useDeleteView, useToggleViewVisibility, useCreateView } from '../hooks/useViews';
import type { TaskView, ViewFilter, ViewSort } from '../types/index';
import { TaskStatus, TaskPriority } from '../types/index';

// 预设视图模板
interface ViewTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  view_type: 'list' | 'board' | 'calendar' | 'table';
  filters: ViewFilter[];
  sorts: ViewSort[];
  group_by?: string;
  display_settings: Record<string, any>;
}

const PRESET_TEMPLATES: ViewTemplate[] = [
  {
    id: 'today_tasks',
    name: '今日任务',
    description: '显示今天需要处理的所有任务',
    icon: 'today',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
    view_type: 'list',
    filters: [
      {
        id: 'filter_1',
        field: 'due_date',
        operator: 'is_today',
        value: null,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'priority', direction: 'desc' },
      { field: 'due_date', direction: 'asc' },
    ],
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      compact_mode: false,
    },
  },
  {
    id: 'overdue_tasks',
    name: '逾期任务',
    description: '显示所有已逾期的未完成任务',
    icon: 'schedule',
    color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
    view_type: 'list',
    filters: [
      {
        id: 'filter_1',
        field: 'due_date',
        operator: 'is_overdue',
        value: null,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'due_date', direction: 'asc' },
      { field: 'priority', direction: 'desc' },
    ],
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      compact_mode: false,
    },
  },
  {
    id: 'high_priority',
    name: '高优先级任务',
    description: '显示高优先级和紧急任务',
    icon: 'priority_high',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
    view_type: 'list',
    filters: [
      {
        id: 'filter_1',
        field: 'priority',
        operator: 'in',
        value: [TaskPriority.HIGH, TaskPriority.URGENT],
        logic: 'and',
      },
      {
        id: 'filter_2',
        field: 'status',
        operator: 'not_equals',
        value: TaskStatus.COMPLETED,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'priority', direction: 'desc' },
      { field: 'due_date', direction: 'asc' },
    ],
    group_by: 'priority',
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      compact_mode: false,
    },
  },
  {
    id: 'this_week',
    name: '本周任务',
    description: '显示本周内的所有任务',
    icon: 'date_range',
    color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    view_type: 'calendar',
    filters: [
      {
        id: 'filter_1',
        field: 'due_date',
        operator: 'is_this_week',
        value: null,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'due_date', direction: 'asc' },
      { field: 'priority', direction: 'desc' },
    ],
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      compact_mode: false,
    },
  },
  {
    id: 'completed_tasks',
    name: '已完成任务',
    description: '显示所有已完成的任务',
    icon: 'task_alt',
    color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
    view_type: 'list',
    filters: [
      {
        id: 'filter_1',
        field: 'status',
        operator: 'equals',
        value: TaskStatus.COMPLETED,
        logic: 'and',
      },
    ],
    sorts: [
      { field: 'updated_at', direction: 'desc' },
    ],
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: false,
      show_status: false,
      compact_mode: true,
    },
  },
  {
    id: 'kanban_board',
    name: '看板视图',
    description: '按状态分组的看板视图',
    icon: 'view_kanban',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
    view_type: 'board',
    filters: [],
    sorts: [
      { field: 'priority', direction: 'desc' },
      { field: 'sort_order', direction: 'asc' },
    ],
    group_by: 'status',
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: false,
      compact_mode: true,
    },
  },
];

const ViewsPage: React.FC = () => {
  const navigate = useNavigate();
  const { data: viewsResponse } = useViews();
  const setDefaultView = useSetDefaultView();
  const duplicateView = useDuplicateView();
  const deleteView = useDeleteView();
  const toggleViewVisibility = useToggleViewVisibility();
  const createView = useCreateView();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedViews, setSelectedViews] = React.useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'market' | 'nav' | 'templates'>('market');

  const views = viewsResponse?.results || [];
  
  // 分离不同类型的视图
  const marketViews = views; // 用户创建的视图
  const navViews = views.filter(view => view.is_visible_in_nav);
  const templateViews = PRESET_TEMPLATES; // 预设模板
  
  // 根据当前标签页筛选视图
  const getCurrentViews = () => {
    switch (activeTab) {
      case 'market':
        return marketViews;
      case 'nav':
        return navViews;
      case 'templates':
        return templateViews;
      default:
        return marketViews;
    }
  };
  
  const currentViews = getCurrentViews();
  
  // Filter views based on search query
  const filteredViews = currentViews.filter(view => 
    view.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (activeTab !== 'templates' && (view as TaskView).project?.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (activeTab === 'templates' && (view as ViewTemplate).description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBack = () => {
    navigate('/');
  };

  const handleCreateView = () => {
    navigate('/views/create');
  };

  const handleCreateFromTemplate = async (template: ViewTemplate) => {
    try {
      const timestamp = new Date().toLocaleString('zh-CN', { 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const viewData = {
        name: `${template.name} ${timestamp}`,
        view_type: template.view_type,
        filters: template.filters,
        sorts: template.sorts,
        group_by: template.group_by || undefined,
        display_settings: template.display_settings,
        is_visible_in_nav: true, // 从模板创建的视图默认显示在导航栏
      };
      
      await createView.mutateAsync(viewData);
      
      // 创建成功后切换到市场标签页
      setActiveTab('market');
    } catch (error) {
      console.error('从模板创建视图失败:', error);
    }
  };

  const handleEditView = (view: TaskView) => {
    navigate(`/views/edit/${view.uid}`);
  };

  const handleSetDefault = async (view: TaskView) => {
    try {
      await setDefaultView.mutateAsync(view.uid);
    } catch (error) {
      console.error('设置默认视图失败:', error);
    }
  };

  const handleDuplicate = async (view: TaskView) => {
    try {
      await duplicateView.mutateAsync(view.uid);
    } catch (error) {
      console.error('复制视图失败:', error);
    }
  };

  const handleDelete = async (view: TaskView) => {
    if (window.confirm(`确定要删除视图"${view.name}"吗？此操作无法撤销。`)) {
      try {
        await deleteView.mutateAsync(view.uid);
      } catch (error) {
        console.error('删除视图失败:', error);
      }
    }
  };

  const handleToggleVisibility = async (view: TaskView) => {
    try {
      await toggleViewVisibility.mutateAsync({
        uid: view.uid,
        isVisible: !view.is_visible_in_nav
      });
    } catch (error) {
      console.error('切换视图显示状态失败:', error);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedViews.length === 0) return;
    
    const viewNames = selectedViews.map(uid => 
      views.find(v => v.uid === uid)?.name
    ).filter(Boolean).join('、');
    
    if (window.confirm(`确定要删除选中的 ${selectedViews.length} 个视图吗？\n\n${viewNames}\n\n此操作无法撤销。`)) {
      try {
        await Promise.all(selectedViews.map(uid => deleteView.mutateAsync(uid)));
        setSelectedViews([]);
        setIsSelectionMode(false);
      } catch (error) {
        console.error('批量删除视图失败:', error);
      }
    }
  };

  const handleBatchToggleVisibility = async (isVisible: boolean) => {
    if (selectedViews.length === 0) return;
    
    try {
      await Promise.all(selectedViews.map(uid => 
        toggleViewVisibility.mutateAsync({ uid, isVisible })
      ));
      setSelectedViews([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('批量切换视图显示状态失败:', error);
    }
  };

  const toggleViewSelection = (viewUid: string) => {
    setSelectedViews(prev => 
      prev.includes(viewUid) 
        ? prev.filter(uid => uid !== viewUid)
        : [...prev, viewUid]
    );
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedViews([]);
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
          
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold">
              {isSelectionMode ? `已选择 ${selectedViews.length} 个` : '视图管理'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {views.length > 1 && (
              <button 
                onClick={toggleSelectionMode}
                className="text-gray-500 dark:text-gray-400 flex items-center justify-center size-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {isSelectionMode ? 'close' : 'checklist'}
                </span>
              </button>
            )}
            
            {isSelectionMode && selectedViews.length > 0 ? (
              <div className="flex items-center gap-1">
                {activeTab === 'market' && (
                  <>
                    <button 
                      onClick={() => handleBatchToggleVisibility(true)}
                      disabled={toggleViewVisibility.isPending}
                      className="text-green-500 flex items-center justify-center size-10 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors disabled:opacity-50"
                      title="显示在导航栏"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </button>
                    <button 
                      onClick={() => handleBatchToggleVisibility(false)}
                      disabled={toggleViewVisibility.isPending}
                      className="text-orange-500 flex items-center justify-center size-10 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-full transition-colors disabled:opacity-50"
                      title="从导航栏隐藏"
                    >
                      <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                    </button>
                  </>
                )}
                <button 
                  onClick={handleBatchDelete}
                  disabled={deleteView.isPending}
                  className="text-red-500 flex items-center justify-center size-10 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            ) : !isSelectionMode ? (
              <button 
                onClick={handleCreateView}
                className="text-primary flex items-center justify-center size-10 hover:bg-primary/10 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">add</span>
              </button>
            ) : null}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'market'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">folder</span>
              <span>我的视图</span>
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                {marketViews.length}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('templates')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'templates'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">library_add</span>
              <span>预设模板</span>
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                {templateViews.length}
              </span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('nav')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'nav'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px]">tab</span>
              <span>导航栏</span>
              <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded">
                {navViews.length}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 120px)' }}>
        <div className="p-4 space-y-4">
          {/* Tab Description */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-500 text-[16px] mt-0.5">info</span>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                {activeTab === 'market' ? (
                  <>
                    <strong>我的视图</strong>：管理你创建的所有视图。你可以在这里编辑、删除视图，以及控制哪些视图显示在导航栏中。
                  </>
                ) : activeTab === 'templates' ? (
                  <>
                    <strong>预设模板</strong>：快速创建常用的视图配置。选择一个模板即可立即创建对应的视图，无需手动配置筛选和排序规则。
                  </>
                ) : (
                  <>
                    <strong>导航栏</strong>：这些视图会显示在任务页面的顶部导航栏中，方便快速切换。你可以从我的视图中选择需要的视图添加到这里。
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Search Bar */}
          {currentViews.length > 0 && (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
              </div>
              <input
                type="text"
                placeholder={`搜索${activeTab === 'market' ? '我的视图' : activeTab === 'templates' ? '预设模板' : '导航栏视图'}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          )}

          {/* Views Count */}
          {currentViews.length > 0 && (
            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
              <span>
                {searchQuery ? `找到 ${filteredViews.length} 个视图` : `共 ${currentViews.length} 个视图`}
              </span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-primary hover:opacity-70"
                >
                  清除搜索
                </button>
              )}
            </div>
          )}

          {filteredViews.length === 0 && searchQuery ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="material-symbols-outlined text-[48px] mb-4">search_off</span>
              <p className="text-sm mb-4">没有找到匹配的{activeTab === 'templates' ? '模板' : '视图'}</p>
              <button 
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                清除搜索
              </button>
            </div>
          ) : currentViews.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <span className="material-symbols-outlined text-[48px] mb-4">
                {activeTab === 'market' ? 'folder' : activeTab === 'templates' ? 'library_add' : 'tab'}
              </span>
              <p className="text-sm mb-4">
                {activeTab === 'market' ? '还没有创建任何视图' : 
                 activeTab === 'templates' ? '暂无预设模板' : 
                 '导航栏中还没有视图'}
              </p>
              <button 
                onClick={activeTab === 'market' ? handleCreateView : 
                         activeTab === 'templates' ? () => {} : 
                         () => setActiveTab('market')}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                disabled={activeTab === 'templates'}
              >
                {activeTab === 'market' ? '创建第一个视图' : 
                 activeTab === 'templates' ? '敬请期待' : 
                 '去我的视图选择'}
              </button>
            </div>
          ) : activeTab === 'templates' ? (
            // 渲染预设模板
            filteredViews.map((template) => {
              const viewTemplate = template as ViewTemplate;
              return (
                <div
                  key={viewTemplate.id}
                  className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`size-10 rounded-lg flex items-center justify-center ${viewTemplate.color}`}>
                          <span className="material-symbols-outlined text-[24px]">
                            {viewTemplate.icon}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            {viewTemplate.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {viewTemplate.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px]">
                                {getViewTypeIcon(viewTemplate.view_type)}
                              </span>
                              {viewTemplate.view_type === 'list' ? '列表' :
                               viewTemplate.view_type === 'board' ? '看板' :
                               viewTemplate.view_type === 'calendar' ? '日历' : '表格'}
                            </span>
                            
                            {viewTemplate.filters.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                                {viewTemplate.filters.length} 个筛选
                              </span>
                            )}
                            
                            {viewTemplate.sorts.length > 0 && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">sort</span>
                                {viewTemplate.sorts.length} 个排序
                              </span>
                            )}
                            
                            {viewTemplate.group_by && (
                              <span className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">group_work</span>
                                分组
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 p-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={() => handleCreateFromTemplate(viewTemplate)}
                      disabled={createView.isPending}
                      className="flex-1 py-2 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                    >
                      {createView.isPending ? '创建中...' : '使用此模板'}
                    </button>
                    
                    <button
                      onClick={() => navigate(`/views/preview?template=${encodeURIComponent(JSON.stringify(viewTemplate))}`)}
                      className="py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">visibility</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            // 渲染用户视图
            filteredViews.map((view) => {
              const taskView = view as TaskView;
              return (
              <div
                key={taskView.uid}
                className={`bg-white dark:bg-surface-dark border rounded-xl overflow-hidden transition-colors ${
                  isSelectionMode && selectedViews.includes(taskView.uid)
                    ? 'border-primary bg-primary/5 dark:bg-primary/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* 视图基本信息 - 可点击区域 */}
                <div
                  onClick={() => {
                    if (isSelectionMode) {
                      toggleViewSelection(taskView.uid);
                    } else {
                      navigate(`/views/${taskView.uid}`);
                    }
                  }}
                  className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {/* Selection checkbox */}
                      {isSelectionMode && (
                        <div className="mt-1">
                          <div className={`size-5 rounded border-2 flex items-center justify-center transition-colors ${
                            selectedViews.includes(taskView.uid)
                              ? 'bg-primary border-primary'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}>
                            {selectedViews.includes(taskView.uid) && (
                              <span className="material-symbols-outlined text-white text-[14px]">check</span>
                            )}
                          </div>
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`size-8 rounded-lg flex items-center justify-center ${getViewTypeColor(taskView.view_type)}`}>
                            <span className="material-symbols-outlined text-[20px]">
                              {getViewTypeIcon(taskView.view_type)}
                            </span>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {taskView.name}
                          </h3>
                          {taskView.is_default && (
                            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                              默认
                            </span>
                          )}
                          {taskView.is_visible_in_nav && (
                            <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                              导航栏
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>{taskView.view_type_display}</span>
                          {taskView.project && (
                            <span>• {taskView.project.name}</span>
                          )}
                          {!taskView.project && (
                            <span>• 全局视图</span>
                          )}
                          {taskView.tasks_count !== undefined && (
                            <span>• {taskView.tasks_count} 个任务</span>
                          )}
                        </div>
                        
                        {/* 创建时间 */}
                        <div className="text-xs text-gray-400 mt-1">
                          创建于 {new Date(taskView.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>

                    {!isSelectionMode && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          // TODO: 显示更多操作菜单
                        }}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        <span className="material-symbols-outlined text-[20px]">more_vert</span>
                      </button>
                    )}
                  </div>

                  {/* 视图配置摘要 */}
                  <div className="space-y-2">
                    {taskView.filters && taskView.filters.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">filter_alt</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {taskView.filters.length} 个筛选条件
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {taskView.filters.slice(0, 2).map((filter, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-xs rounded"
                            >
                              {filter.field}
                            </span>
                          ))}
                          {taskView.filters.length > 2 && (
                            <span className="text-xs text-gray-400">
                              +{taskView.filters.length - 2}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {taskView.sorts && taskView.sorts.length > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">sort</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          按 {taskView.sorts.map(s => s.field).join(', ')} 排序
                        </span>
                      </div>
                    )}
                    
                    {taskView.group_by && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">group_work</span>
                        <span className="text-gray-600 dark:text-gray-300">
                          按 {taskView.group_by} 分组
                        </span>
                      </div>
                    )}

                    {/* 显示设置摘要 */}
                    {taskView.display_settings && (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="material-symbols-outlined text-[16px] text-gray-400">visibility</span>
                        <div className="flex flex-wrap gap-1">
                          {taskView.display_settings.show_project && (
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                              项目
                            </span>
                          )}
                          {taskView.display_settings.show_tags && (
                            <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded">
                              标签
                            </span>
                          )}
                          {taskView.display_settings.show_due_date && (
                            <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded">
                              日期
                            </span>
                          )}
                          {taskView.display_settings.show_priority && (
                            <span className="px-1.5 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded">
                              优先级
                            </span>
                          )}
                          {taskView.display_settings.compact_mode && (
                            <span className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs rounded">
                              紧凑
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                {!isSelectionMode && (
                  <div className="flex items-center gap-2 p-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditView(taskView);
                      }}
                      className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    >
                      编辑
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(taskView);
                      }}
                      disabled={duplicateView.isPending}
                      className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      复制
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleVisibility(taskView);
                      }}
                      disabled={toggleViewVisibility.isPending}
                      className={`py-2 px-3 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                        taskView.is_visible_in_nav
                          ? 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
                          : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {taskView.is_visible_in_nav ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                    
                    {!taskView.is_default && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSetDefault(taskView);
                        }}
                        disabled={setDefaultView.isPending}
                        className="py-2 px-3 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-[16px]">star</span>
                      </button>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(taskView);
                      }}
                      disabled={deleteView.isPending}
                      className="py-2 px-3 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                )}
              </div>
            );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewsPage;