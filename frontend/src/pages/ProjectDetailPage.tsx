import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useTasks, useUpdateTask, useSearchTasks } from '../hooks/useTasks';
import { useGroups } from '../hooks/useGroups';
import BottomSheet from '../components/BottomSheet';
import BottomNav from '../components/BottomNav';
import ViewRenderer from '../components/ViewRenderer';
import FloatingAddButton from '../components/FloatingAddButton';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';
import type { Group, Task, TaskView } from '../types/index';

const PRESET_ICONS = [
  { icon: 'work', label: '工作' },
  { icon: 'person', label: '个人' },
  { icon: 'shopping_cart', label: '购物' },
  { icon: 'flight', label: '旅行' },
  { icon: 'sports_esports', label: '娱乐' },
  { icon: 'book', label: '学习' },
  { icon: 'home', label: '家庭' },
  { icon: 'fitness_center', label: '健身' },
  { icon: 'restaurant', label: '美食' },
  { icon: 'code', label: '开发' },
  { icon: 'palette', label: '设计' },
  { icon: 'music_note', label: '音乐' },
];

const PRESET_COLORS = [
  { key: 'purple', bg: 'bg-purple-500' },
  { key: 'blue', bg: 'bg-blue-500' },
  { key: 'orange', bg: 'bg-orange-500' },
  { key: 'green', bg: 'bg-green-500' },
  { key: 'pink', bg: 'bg-pink-500' },
  { key: 'indigo', bg: 'bg-indigo-500' },
  { key: 'teal', bg: 'bg-teal-500' },
  { key: 'red', bg: 'bg-red-500' },
];

// 所有视图类型
const VIEW_TYPES = [
  { type: 'list' as const, icon: 'view_list', label: '列表' },
  { type: 'board' as const, icon: 'view_kanban', label: '看板' },
  { type: 'calendar' as const, icon: 'calendar_month', label: '日历' },
  { type: 'table' as const, icon: 'table_chart', label: '表格' },
  { type: 'timeline' as const, icon: 'view_timeline', label: '时间线' },
  { type: 'gallery' as const, icon: 'grid_view', label: '画廊' },
];

// 排序选项
const SORT_OPTIONS = [
  { field: '', label: '默认' },
  { field: 'created_at', label: '创建时间' },
  { field: 'updated_at', label: '更新时间' },
  { field: 'due_date', label: '截止日期' },
  { field: 'priority', label: '优先级' },
  { field: 'title', label: '标题' },
];

// 分组选项
const GROUP_BY_OPTIONS = [
  { field: '', label: '不分组' },
  { field: 'priority', label: '按优先级' },
  { field: 'status', label: '按状态' },
  { field: 'due_date', label: '按截止日期' },
];

const ProjectDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();

  // 数据
  const { data: project, isLoading: isProjectLoading } = useProject(uid || '');
  const { data: tasksData, isLoading: isTasksLoading } = useTasks({ project: uid });
  const { data: groupsData } = useGroups();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const updateTask = useUpdateTask();

  const groups = groupsData?.results || [];
  const tasks = tasksData?.results || [];

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { data: searchResults } = useSearchTasks(debouncedSearch);

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 视图类型（本地状态，不影响全局视图）
  const [viewType, setViewType] = useState<'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gallery'>('list');

  // 过滤栏
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [groupBy, setGroupBy] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);

  // 弹窗
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showSettingsSheet, setShowSettingsSheet] = useState(false);
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'sort' | 'group' | 'display' | null>(null);

  const projectIcon = project?.style?.icon || 'folder';
  const projectColor = project?.style?.color || 'blue';

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMoreMenu(false);
    };
    if (showMoreMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [showMoreMenu]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveDropdown(null);
    };
    if (activeDropdown) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeDropdown]);

  // 处理任务
  const processedTasks = useMemo(() => {
    // 搜索时使用搜索结果，再按当前project过滤
    let result = debouncedSearch
      ? (searchResults?.results || []).filter(t => t.project?.uid === uid)
      : [...tasks];

    if (!showCompleted) {
      result = result.filter(task => !task.is_completed);
    }

    if (sortField) {
      result.sort((a, b) => {
        let aValue: any;
        let bValue: any;
        switch (sortField) {
          case 'created_at': case 'updated_at': case 'due_date': case 'start_date':
            aValue = a[sortField as keyof Task] ? new Date(a[sortField as keyof Task] as string).getTime() : 0;
            bValue = b[sortField as keyof Task] ? new Date(b[sortField as keyof Task] as string).getTime() : 0;
            break;
          case 'priority':
            aValue = a.priority || 0; bValue = b.priority || 0; break;
          case 'title':
            aValue = a.title?.toLowerCase() || ''; bValue = b.title?.toLowerCase() || ''; break;
          default:
            aValue = a[sortField as keyof Task]; bValue = b[sortField as keyof Task];
        }
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [tasks, searchResults, debouncedSearch, uid, showCompleted, sortField, sortDirection]);

  // 统计
  const completedCount = tasks.filter(t => t.is_completed).length;
  const totalCount = tasks.length;

  // 构造视图对象
  const effectiveView: TaskView = useMemo(() => ({
    uid: `project-${uid}`,
    name: project?.name || '',
    view_type: viewType,
    sorts: sortField ? [{ field: sortField, direction: sortDirection }] : [],
    group_by: groupBy || null,
    display_settings: {
      show_completed: showCompleted,
      show_project: false,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      compact_mode: false,
    },
    filters: [],
    is_default: false,
    follow_selected_project: false,
    project: project || null,
    created_at: '',
    updated_at: '',
  }), [uid, project, viewType, sortField, sortDirection, groupBy, showCompleted]);

  const handleTaskClick = (task: Task) => navigate(`/task/${task.uid}`);
  const handleTaskUpdate = (task: Task, updates: Partial<Task>) => {
    updateTask.mutate({ uid: task.uid, data: updates });
  };

  const handleIconChange = (icon: string) => {
    updateProject.mutate({ uid: uid!, data: { style: { ...project?.style, icon } } });
  };
  const handleColorChange = (color: string) => {
    updateProject.mutate({ uid: uid!, data: { style: { ...project?.style, color } } });
  };
  const handleGroupChange = (group: Group) => {
    updateProject.mutate({ uid: uid!, data: { group_uid: group.uid } });
    setShowGroupSheet(false);
  };
  const handleDelete = () => {
    setDeleteError('');
    deleteProject.mutate(uid!, {
      onSuccess: () => navigate('/projects', { replace: true }),
      onError: (error: any) => setDeleteError(error?.response?.data?.error?.message || '删除失败'),
    });
  };

  if (isProjectLoading) {
    return (
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark min-h-screen flex flex-col items-center justify-center px-4">
        <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600 mb-4">error</span>
        <p className="text-gray-500 dark:text-gray-400 mb-4">清单不存在</p>
        <button onClick={() => navigate('/projects')} className="text-primary text-sm font-medium">返回清单列表</button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark min-h-screen overflow-hidden">
      {/* === 顶部导航 === */}
      <header className="sticky top-0 z-30 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800">
        {/* 第一行：返回按钮 + 清单名称(居中) + 菜单 */}
        <div className="flex items-center justify-between px-4 h-12">
          {/* 左侧 - 返回按钮 */}
          <div className="w-10">
            <button
              onClick={() => navigate('/projects')}
              className="text-gray-500 dark:text-gray-400 flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-[22px]">arrow_back</span>
            </button>
          </div>
          
          {/* 中间 - 清单名称居中 */}
          <div className="flex-1 flex justify-center px-2">
            <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
              {project.name}
            </h1>
          </div>
          
          {/* 右侧 - 菜单按钮 */}
          <div className="w-10 flex justify-end">
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMoreMenu(!showMoreMenu); }}
                className="size-9 flex items-center justify-center rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <span className="material-symbols-outlined text-[22px]">more_vert</span>
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                  <button
                    onClick={() => { setShowMoreMenu(false); setShowSettingsSheet(true); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">settings</span>
                    清单设置
                  </button>
                  <button
                    onClick={() => { setShowMoreMenu(false); setShowGroupSheet(true); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">drive_file_move</span>
                    移动分组
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                  <button
                    onClick={() => { setShowMoreMenu(false); setShowDeleteConfirm(true); }}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    删除清单
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 搜索栏（始终显示） */}
        <div className="px-4 pb-2">
          <div className="flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 h-9 px-3 gap-2">
            <span className="material-symbols-outlined text-gray-400 text-[18px]">search</span>
            <input
              className="flex-1 bg-transparent border-none text-sm text-gray-900 dark:text-white placeholder-gray-400 p-0 focus:outline-none focus:ring-0"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* === 视图类型栏 === */}
        <div className="flex items-center gap-1 px-4 pb-2 overflow-x-auto no-scrollbar">
          {VIEW_TYPES.map(vt => (
            <button
              key={vt.type}
              onClick={() => setViewType(vt.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                viewType === vt.type
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{vt.icon}</span>
              {vt.label}
            </button>
          ))}
        </div>

        {/* === 过滤栏 === */}
        <div className="border-t border-gray-100 dark:border-gray-700">
          {/* 过滤选项行 - 三栏平分 */}
          <div className="flex items-center text-xs">
            {/* 排序设置 */}
            <button
              onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'sort' ? null : 'sort'); }}
              className={`flex-1 flex items-center justify-center gap-0.5 py-2 ${
                activeDropdown === 'sort' ? 'text-primary' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <span>排序：{SORT_OPTIONS.find(o => o.field === sortField)?.label || '默认'}</span>
              {sortField && (
                <span className="material-symbols-outlined text-[14px]">
                  {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                </span>
              )}
              <span className="material-symbols-outlined text-[14px]">
                {activeDropdown === 'sort' ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* 分组设置 */}
            <button
              onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'group' ? null : 'group'); }}
              className={`flex-1 flex items-center justify-center gap-0.5 py-2 ${
                activeDropdown === 'group' ? 'text-primary' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <span>分组：{GROUP_BY_OPTIONS.find(o => o.field === groupBy)?.label || '不分组'}</span>
              <span className="material-symbols-outlined text-[14px]">
                {activeDropdown === 'group' ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* 显示设置 */}
            <button
              onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === 'display' ? null : 'display'); }}
              className={`flex-1 flex items-center justify-center gap-0.5 py-2 ${
                activeDropdown === 'display' ? 'text-primary' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <span>显示</span>
              <span className="material-symbols-outlined text-[14px]">
                {activeDropdown === 'display' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>

          {/* 排序下拉选项 */}
          {activeDropdown === 'sort' && (
            <div className="border-t border-gray-50 dark:border-gray-800">
              {SORT_OPTIONS.map((option) => (
                <div
                  key={option.field}
                  className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                >
                  {/* 点击选项名称：选中并关闭弹窗 */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSortField(option.field);
                      if (option.field) setSortDirection('desc');
                      setTimeout(() => setActiveDropdown(null), 0);
                    }}
                    className={`flex items-center gap-2 ${
                      sortField === option.field ? 'text-primary' : 'text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {sortField === option.field && (
                      <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                    )}
                    <span>{option.label}</span>
                  </button>
                  
                  {/* 排序方式按钮：点击选中排序字段和方式，然后关闭弹窗 */}
                  {option.field && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSortField(option.field);
                          setSortDirection('asc');
                          setTimeout(() => setActiveDropdown(null), 0);
                        }}
                        className={`px-2 py-1 rounded ${
                          sortField === option.field && sortDirection === 'asc'
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        正序
                      </button>
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSortField(option.field);
                          setSortDirection('desc');
                          setTimeout(() => setActiveDropdown(null), 0);
                        }}
                        className={`px-2 py-1 rounded ${
                          sortField === option.field && sortDirection === 'desc'
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        倒序
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 分组下拉选项 */}
          {activeDropdown === 'group' && (
            <div className="border-t border-gray-50 dark:border-gray-800">
              {GROUP_BY_OPTIONS.map((option) => (
                <button
                  key={option.field}
                  onClick={() => {
                    setGroupBy(option.field);
                    setActiveDropdown(null);
                  }}
                  className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                >
                  <span className={groupBy === option.field ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}>
                    {option.label}
                  </span>
                  {groupBy === option.field && (
                    <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* 显示设置下拉选项 */}
          {activeDropdown === 'display' && (
            <div className="border-t border-gray-50 dark:border-gray-800">
              <label className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 cursor-pointer">
                <span className="text-gray-700 dark:text-gray-200">已完成任务</span>
                <input
                  type="checkbox"
                  checked={showCompleted}
                  onChange={(e) => setShowCompleted(e.target.checked)}
                  className="size-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary cursor-pointer"
                />
              </label>
            </div>
          )}
        </div>
      </header>

      {/* === 待办事项 === */}
      <main className={`pb-20 bg-white dark:bg-background-dark ${
        viewType === 'board' ? '' : 'overflow-y-auto px-4 pt-3'
      }`}>
        {isTasksLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : processedTasks.length > 0 ? (
          <ViewRenderer
            view={effectiveView}
            tasks={processedTasks}
            onTaskClick={handleTaskClick}
            onTaskUpdate={handleTaskUpdate}
            showCompleted={showCompleted}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[32px] text-gray-300">
                {debouncedSearch ? 'search_off' : tasks.length === 0 ? 'task_alt' : 'check_circle'}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
              {debouncedSearch ? '未找到匹配的任务' : tasks.length === 0 ? '暂无任务' : '所有任务已完成'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {debouncedSearch ? '尝试其他关键词' : tasks.length === 0 ? '点击下方按钮创建任务' : ''}
            </p>
          </div>
        )}
      </main>

      <FloatingAddButton defaultProject={uid} />
      <BottomNav />

      {/* 清单设置 BottomSheet */}
      <BottomSheet isOpen={showSettingsSheet} onClose={() => setShowSettingsSheet(false)} title="清单设置">
        <div className="px-5 py-4 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">清单名称</label>
            <input
              type="text"
              defaultValue={project.name}
              onBlur={(e) => {
                if (e.target.value.trim() && e.target.value.trim() !== project.name) {
                  updateProject.mutate({ uid: uid!, data: { name: e.target.value.trim() } });
                }
              }}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">图标</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map(({ icon, label }) => (
                <button
                  key={icon}
                  onClick={() => handleIconChange(icon)}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                    projectIcon === icon
                      ? 'bg-primary/10 text-primary ring-1 ring-primary'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  <span className="text-[8px]">{label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">颜色</label>
            <div className="flex gap-2.5 flex-wrap">
              {PRESET_COLORS.map(({ key, bg }) => (
                <button
                  key={key}
                  onClick={() => handleColorChange(key)}
                  className={`size-8 rounded-full ${bg} transition-all ${
                    projectColor === key
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-gray-900 dark:ring-white scale-110'
                      : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">描述</label>
            <textarea
              defaultValue={project.desc || ''}
              onBlur={(e) => {
                if (e.target.value !== (project.desc || '')) {
                  updateProject.mutate({ uid: uid!, data: { desc: e.target.value } });
                }
              }}
              rows={3}
              placeholder="添加清单描述..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
      </BottomSheet>

      {/* 分组选择 BottomSheet */}
      <BottomSheet isOpen={showGroupSheet} onClose={() => setShowGroupSheet(false)} title="移动到分组">
        <div className="py-2">
          {groups.map(group => (
            <button
              key={group.uid}
              onClick={() => handleGroupChange(group)}
              className={`w-full px-5 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                project.group?.uid === group.uid ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">folder</span>
                <div>
                  <p className="text-sm font-medium">{group.name}</p>
                  <p className="text-xs text-gray-400">{group.projects_count} 个清单</p>
                </div>
              </div>
              {project.group?.uid === group.uid && (
                <span className="material-symbols-outlined text-primary text-[20px]">check</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl p-5 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-[22px]">warning</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">删除清单</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              确定要删除「{project.name}」吗？此操作无法撤销。
            </p>
            {deleteError && (
              <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">{deleteError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProject.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50"
              >
                {deleteProject.isPending ? '删除中...' : '确定删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
