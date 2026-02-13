import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import ViewRenderer from '../components/ViewRenderer';
import BottomNav from '../components/BottomNav';
import FloatingAddButton from '../components/FloatingAddButton';
import DrawerMenu from '../components/DrawerMenu';
import { useViewTasks, useNavViews, useView, useUpdateView } from '../hooks/useViews';
import { useCheckInitialized, useInitializeUser } from '../hooks/useAuth';
import { useUpdateTask, useSearchTasks } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';
import type { Task } from '../types/index';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentView, setCurrentView] = useState<string>('');
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  // 清单选择状态（null: 全部任务, 'inbox': 收集箱, 其他: 具体项目uid）
  const [selectedProjectUid, setSelectedProjectUid] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const projectFilter = searchParams.get('project');

  const { data: navViews, isLoading: isNavViewsLoading, error: navViewsError } = useNavViews();
  const { data: viewTasks, isLoading: isViewTasksLoading } = useViewTasks(currentView);
  const { data: viewData, isLoading: isViewDataLoading } = useView(currentView);
  const { data: isInitialized, isLoading: isCheckingInit } = useCheckInitialized();
  const initializeUser = useInitializeUser();
  const updateTask = useUpdateTask();
  const updateView = useUpdateView();
  
  // 搜索任务（在线搜索）
  const { data: searchResults, isLoading: isSearching } = useSearchTasks(debouncedSearch);
  
  // 获取项目列表
  const { data: projectsData } = useProjects();
  const projects = projectsData?.results || [];

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 用户初始化检查
  useEffect(() => {
    // 只在登录且检查完初始化状态后执行
    if (isCheckingInit) return;
    
    // 如果用户未初始化，自动触发初始化
    if (isInitialized === false && !initializeUser.isPending) {
      console.log('检测到新用户，开始初始化...');
      initializeUser.mutate();
    }
  }, [isInitialized, isCheckingInit, initializeUser]);

  // 计算加载状态
  const isLoading = isNavViewsLoading || isCheckingInit || (currentView && (isViewDataLoading || isViewTasksLoading)) || (debouncedSearch && isSearching);
  const hasNoViews = !isNavViewsLoading && !isCheckingInit && (!navViews?.results || navViews.results.length === 0);

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
    setSearchQuery(query);
  };

  const handleFilter = () => {
    // 点击过滤按钮时切换过滤栏显示
    setShowFilterBar(!showFilterBar);
  };

  const handleViewChange = (viewUid: string) => {
    setCurrentView(viewUid);
  };

  const handleTaskClick = (task: any) => {
    navigate(`/task/${task.uid}`);
  };

  const handleTaskUpdate = (task: any, updates: any) => {
    // 乐观更新：立即更新任务
    updateTask.mutate(
      {
        uid: task.uid,
        data: updates,
      },
      {
        onError: (error: any) => {
          console.error('更新任务失败:', error);
        },
      }
    );
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

  // 直接更新视图的排序设置
  const handleSortChange = (field: string, direction: 'asc' | 'desc') => {
    if (!currentView || !viewData) return;
    updateView.mutate({
      uid: currentView,
      data: { sorts: [{ field, direction }] }
    });
  };

  // 直接更新视图的分组设置
  const handleGroupByChange = (field: string) => {
    if (!currentView || !viewData) return;
    updateView.mutate({
      uid: currentView,
      data: { group_by: field || null }
    });
  };

  // 直接更新视图的显示设置
  const handleDisplaySettingsChange = (settings: Partial<Record<string, boolean>>) => {
    if (!currentView || !viewData) return;
    updateView.mutate({
      uid: currentView,
      data: { 
        display_settings: { 
          ...viewData.display_settings, 
          ...settings 
        } 
      }
    });
  };

  // 获取当前视图的显示设置
  const viewDisplaySettings = viewData?.display_settings as any;
  const selectedCardId = viewDisplaySettings?.card_template_id || 'default';
  const currentCardStyle = TASK_CARD_TEMPLATES.find(template => template.id === selectedCardId);
  
  // 直接使用视图的显示设置（已通过乐观更新即时响应）
  const displaySettings = {
    show_completed: viewDisplaySettings?.show_completed ?? false,
    show_project: viewDisplaySettings?.show_project ?? true,
    show_tags: viewDisplaySettings?.show_tags ?? true,
    show_due_date: viewDisplaySettings?.show_due_date ?? true,
    show_priority: viewDisplaySettings?.show_priority ?? true,
    show_status: viewDisplaySettings?.show_status ?? true,
    compact_mode: viewDisplaySettings?.compact_mode ?? false,
  };
  
  // 从视图获取排序和分组设置
  const sorts = viewData?.sorts || [];
  const sortField = sorts.length > 0 ? sorts[0].field : '';
  const sortDirection = sorts.length > 0 ? sorts[0].direction : 'desc';
  const groupBy = viewData?.group_by || '';

  // 实时排序和过滤任务
  const processedTasks = useMemo(() => {
    // 如果有搜索词，使用搜索结果；否则使用视图任务
    let tasks = debouncedSearch 
      ? (searchResults?.results || [])
      : (viewTasks?.results || []);
    
    // 根据视图的 follow_selected_project 设置决定项目过滤逻辑
    const shouldFollowSelected = viewData?.follow_selected_project !== false;
    
    if (shouldFollowSelected) {
      // 跟随所选清单过滤
      if (selectedProjectUid === 'inbox') {
        // 收集箱：显示无项目的任务
        tasks = tasks.filter(task => !task.project);
      } else if (selectedProjectUid !== null) {
        // 特定项目：按项目uid过滤
        tasks = tasks.filter(task => task.project?.uid === selectedProjectUid);
      }
      // selectedProjectUid === null 时显示全部任务，不过滤
    } else {
      // 使用视图固定的所属清单过滤
      if (viewData?.project) {
        tasks = tasks.filter(task => task.project?.uid === viewData.project?.uid);
      }
    }
    
    // 过滤已完成任务
    if (!displaySettings.show_completed) {
      tasks = tasks.filter(task => !task.is_completed);
    }
    
    // 排序（前端二次排序，后端已排序但本地可能需要即时响应）
    if (sortField) {
      tasks = [...tasks].sort((a, b) => {
        let aValue: any;
        let bValue: any;
        
        switch (sortField) {
          case 'created_at':
          case 'updated_at':
          case 'due_date':
          case 'start_date':
            aValue = a[sortField as keyof Task] ? new Date(a[sortField as keyof Task] as string).getTime() : 0;
            bValue = b[sortField as keyof Task] ? new Date(b[sortField as keyof Task] as string).getTime() : 0;
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
            aValue = a[sortField as keyof Task];
            bValue = b[sortField as keyof Task];
        }
        
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return tasks;
  }, [viewTasks?.results, searchResults?.results, debouncedSearch, displaySettings.show_completed, sortField, sortDirection, viewData?.follow_selected_project, viewData?.project, selectedProjectUid]);

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden min-h-screen">
      <Header 
        onSearch={handleSearch} 
        onFilter={handleFilter}
        onViewChange={handleViewChange}
        currentView={currentView}
        onOpenViewSettings={handleOpenViewSettings}
        onMenuClick={() => setIsDrawerOpen(true)}
        selectedProjectUid={selectedProjectUid}
        onProjectChange={setSelectedProjectUid}
        projects={projects}
        showFilterBar={showFilterBar}
        onToggleFilterBar={handleToggleFilterBar}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={handleSortChange}
        groupBy={groupBy}
        onGroupByChange={handleGroupByChange}
        displaySettings={displaySettings}
        onDisplaySettingsChange={handleDisplaySettingsChange}
      />
      
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        selectedProjectUid={selectedProjectUid}
        onProjectChange={setSelectedProjectUid}
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
              tasks={processedTasks}
              onTaskClick={handleTaskClick}
              onTaskUpdate={handleTaskUpdate}
              showCompleted={displaySettings.show_completed}
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