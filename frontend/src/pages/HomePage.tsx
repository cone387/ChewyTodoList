import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ViewRenderer from '../components/ViewRenderer';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';
import { useViewTasks, useNavViews, useView } from '../hooks/useViews';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';
import type { Task, TaskView } from '../types/index';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  // 本地过滤状态（临时覆盖视图设置）
  const [localSortField, setLocalSortField] = useState<string>('');
  const [localSortDirection, setLocalSortDirection] = useState<'asc' | 'desc'>('desc');
  const [localGroupBy, setLocalGroupBy] = useState<string>('');
  // 本地显示设置（null 表示使用视图默认设置）
  const [localDisplaySettings, setLocalDisplaySettings] = useState<{
    show_completed: boolean | null;
    show_project: boolean | null;
    show_tags: boolean | null;
    show_due_date: boolean | null;
    show_priority: boolean | null;
    show_status: boolean | null;
    compact_mode: boolean | null;
  }>({
    show_completed: null,
    show_project: null,
    show_tags: null,
    show_due_date: null,
    show_priority: null,
    show_status: null,
    compact_mode: null,
  });
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

  const handleToggleFilterBar = () => {
    setShowFilterBar(!showFilterBar);
  };

  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    setLocalSortField(field);
    setLocalSortDirection(direction);
  };

  const handleGroupByChange = (field: string) => {
    setLocalGroupBy(field);
  };

  const handleDisplaySettingsChange = (settings: Partial<typeof localDisplaySettings>) => {
    setLocalDisplaySettings(prev => ({ ...prev, ...settings }));
  };

  // 当视图切换时，重置本地过滤状态
  useEffect(() => {
    if (viewData) {
      // 从视图数据初始化本地状态
      const sorts = viewData.sorts || [];
      if (sorts.length > 0) {
        setLocalSortField(sorts[0].field || '');
        setLocalSortDirection(sorts[0].direction || 'desc');
      } else {
        setLocalSortField('');
        setLocalSortDirection('desc');
      }
      setLocalGroupBy(viewData.group_by || '');
      // 重置显示设置为 null（使用视图默认设置）
      setLocalDisplaySettings({
        show_completed: null,
        show_project: null,
        show_tags: null,
        show_due_date: null,
        show_priority: null,
        show_status: null,
        compact_mode: null,
      });
    }
  }, [viewData?.uid]);

  // 获取当前视图的显示设置
  const viewDisplaySettings = viewData?.display_settings as any;
  const selectedCardId = viewDisplaySettings?.card_template_id || 'default';
  const currentCardStyle = TASK_CARD_TEMPLATES.find(template => template.id === selectedCardId);
  
  // 合并本地设置和视图设置（本地设置优先）
  const effectiveDisplaySettings = {
    show_completed: localDisplaySettings.show_completed !== null 
      ? localDisplaySettings.show_completed 
      : (viewDisplaySettings?.show_completed ?? false),
    show_project: localDisplaySettings.show_project !== null 
      ? localDisplaySettings.show_project 
      : (viewDisplaySettings?.show_project ?? true),
    show_tags: localDisplaySettings.show_tags !== null 
      ? localDisplaySettings.show_tags 
      : (viewDisplaySettings?.show_tags ?? true),
    show_due_date: localDisplaySettings.show_due_date !== null 
      ? localDisplaySettings.show_due_date 
      : (viewDisplaySettings?.show_due_date ?? true),
    show_priority: localDisplaySettings.show_priority !== null 
      ? localDisplaySettings.show_priority 
      : (viewDisplaySettings?.show_priority ?? true),
    show_status: localDisplaySettings.show_status !== null 
      ? localDisplaySettings.show_status 
      : (viewDisplaySettings?.show_status ?? true),
    compact_mode: localDisplaySettings.compact_mode !== null 
      ? localDisplaySettings.compact_mode 
      : (viewDisplaySettings?.compact_mode ?? false),
  };
  
  const effectiveSortField = localSortField;
  const effectiveSortDirection = localSortDirection;
  const effectiveGroupBy = localGroupBy;

  // 实时排序和过滤任务
  const processedTasks = useMemo(() => {
    let tasks = viewTasks?.results || [];
    
    // 过滤已完成任务
    if (!effectiveDisplaySettings.show_completed) {
      tasks = tasks.filter(task => !task.is_completed);
    }
    
    // 排序
    if (effectiveSortField) {
      tasks = [...tasks].sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (effectiveSortField) {
          case 'created_at':
          case 'updated_at':
          case 'due_date':
          case 'start_date':
            aValue = a[effectiveSortField as keyof Task] ? new Date(a[effectiveSortField as keyof Task] as string).getTime() : 0;
            bValue = b[effectiveSortField as keyof Task] ? new Date(b[effectiveSortField as keyof Task] as string).getTime() : 0;
            break;
          case 'priority':
            aValue = a.priority || 0;
            bValue = b.priority || 0;
            break;
          case 'title':
            aValue = a.title?.toLowerCase() || '';
            bValue = b.title?.toLowerCase() || '';
            break;
          default:
            aValue = a[effectiveSortField as keyof Task];
            bValue = b[effectiveSortField as keyof Task];
        }
        
        if (aValue < bValue) return effectiveSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return effectiveSortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return tasks;
  }, [viewTasks?.results, effectiveDisplaySettings.show_completed, effectiveSortField, effectiveSortDirection]);

  // 创建一个带有本地过滤设置的视图对象
  const effectiveView = useMemo((): TaskView | undefined => {
    if (!viewData) return undefined;
    return {
      ...viewData,
      group_by: effectiveGroupBy || viewData.group_by,
      sorts: effectiveSortField 
        ? [{ field: effectiveSortField, direction: effectiveSortDirection }]
        : viewData.sorts,
      display_settings: {
        ...viewData.display_settings,
        ...effectiveDisplaySettings,
      },
    };
  }, [viewData, effectiveGroupBy, effectiveSortField, effectiveSortDirection, effectiveDisplaySettings]);

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden min-h-screen">
      <Header 
        onSearch={handleSearch} 
        onFilter={handleFilter}
        onViewChange={handleViewChange}
        currentView={currentView}
        onOpenViewSettings={handleOpenViewSettings}
        showFilterBar={showFilterBar}
        onToggleFilterBar={handleToggleFilterBar}
        sortField={effectiveSortField}
        sortDirection={effectiveSortDirection}
        onSortChange={handleSortChange}
        groupBy={effectiveGroupBy}
        onGroupByChange={handleGroupByChange}
        displaySettings={effectiveDisplaySettings}
        onDisplaySettingsChange={handleDisplaySettingsChange}
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
        {!isLoading && !navViewsError && !hasNoViews && effectiveView && (
          <div className={effectiveView.view_type === 'board' ? 'pt-4' : ''}>
            <ViewRenderer
              view={effectiveView}
              tasks={processedTasks}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
              showCompleted={effectiveDisplaySettings.show_completed}
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