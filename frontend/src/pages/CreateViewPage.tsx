import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCreateView, useUpdateView, useDeleteView, useView } from '../hooks/useViews';
import { useProjects } from '../hooks/useProjects';
import FilterBuilder from '../components/FilterBuilder';
import type { ViewFilter, ViewSort } from '../types/index';

// Import operator definitions for filter sanitization
const OPERATOR_DEFINITIONS = [
  { key: 'is_today', valueRequired: false },
  { key: 'is_yesterday', valueRequired: false },
  { key: 'is_tomorrow', valueRequired: false },
  { key: 'is_this_week', valueRequired: false },
  { key: 'is_last_week', valueRequired: false },
  { key: 'is_next_week', valueRequired: false },
  { key: 'is_this_month', valueRequired: false },
  { key: 'is_last_month', valueRequired: false },
  { key: 'is_next_month', valueRequired: false },
  { key: 'is_overdue', valueRequired: false },
  { key: 'has_no_date', valueRequired: false },
  { key: 'is_empty', valueRequired: false },
  { key: 'is_not_empty', valueRequired: false },
  { key: 'is_true', valueRequired: false },
  { key: 'is_false', valueRequired: false },
  // All other operators require values
];

const CreateViewPage: React.FC = () => {
  const navigate = useNavigate();
  const { uid } = useParams<{ uid?: string }>();
  const [searchParams] = useSearchParams();
  const isEditing = !!uid;
  
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const [formData, setFormData] = useState({
    name: '',
    project_uid: '',
    view_type: 'list' as 'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gallery',
    filters: [] as ViewFilter[],
    sorts: [] as ViewSort[],
    group_by: '',
    is_visible_in_nav: true, // 默认显示在导航栏
    display_settings: {
      show_project: true,
      show_tags: true,
      show_due_date: true,
      show_priority: true,
      show_status: true,
      compact_mode: false,
    },
  });

  const createView = useCreateView();
  const updateView = useUpdateView();
  const deleteView = useDeleteView();
  const { data: view, isLoading: viewLoading } = useView(uid!);
  const { data: projectsResponse } = useProjects();

  const projects = projectsResponse?.results || [];

  useEffect(() => {
    if (view) {
      setFormData({
        name: view.name,
        project_uid: view.project?.uid || '',
        view_type: view.view_type,
        filters: view.filters || [],
        sorts: view.sorts || [],
        group_by: view.group_by || '',
        is_visible_in_nav: view.is_visible_in_nav ?? true,
        display_settings: {
          show_project: view.display_settings?.show_project ?? true,
          show_tags: view.display_settings?.show_tags ?? true,
          show_due_date: view.display_settings?.show_due_date ?? true,
          show_priority: view.display_settings?.show_priority ?? true,
          show_status: view.display_settings?.show_status ?? true,
          compact_mode: view.display_settings?.compact_mode ?? false,
        },
      });
    }
  }, [view]);

  // Handle template parameter from URL
  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam && !isEditing) {
      try {
        const templateData = JSON.parse(decodeURIComponent(templateParam));
        const timestamp = new Date().toLocaleString('zh-CN', { 
          month: '2-digit', 
          day: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        setFormData(prevData => ({
          ...prevData,
          name: `${templateData.name} ${timestamp}`, // Add timestamp to avoid name conflicts
          view_type: templateData.view_type || 'list',
          filters: templateData.filters || [],
          sorts: templateData.sorts || [],
          group_by: templateData.group_by || '',
          display_settings: {
            ...prevData.display_settings,
            ...templateData.display_settings,
          },
        }));
      } catch (error) {
        console.error('Failed to parse template data:', error);
      }
    }
  }, [searchParams, isEditing]);

  const handleBack = () => {
    navigate('/views');
  };

  const sanitizeFilters = (filters: ViewFilter[]): ViewFilter[] => {
    return filters.map(filter => {
      const operatorDef = OPERATOR_DEFINITIONS.find(op => op.key === filter.operator);
      
      // If operator doesn't require a value, set value to null
      if (!operatorDef?.valueRequired) {
        return {
          ...filter,
          value: null,
          value2: undefined,
        };
      }
      
      // Ensure value is not a string for date operators that should have null values
      if (filter.operator.startsWith('is_') && 
          ['is_today', 'is_yesterday', 'is_tomorrow', 'is_this_week', 'is_last_week', 
           'is_next_week', 'is_this_month', 'is_last_month', 'is_next_month', 
           'is_overdue', 'has_no_date', 'is_true', 'is_false', 'is_empty', 'is_not_empty'].includes(filter.operator)) {
        return {
          ...filter,
          value: null,
          value2: undefined,
        };
      }
      
      return filter;
    });
  };

  const handleSave = async () => {
    try {
      setErrorMessage(''); // Clear any previous errors
      
      // Prepare data for backend - convert empty strings to undefined for optional fields
      const dataToSend = {
        ...formData,
        project_uid: formData.project_uid || undefined, // Convert empty string to undefined
        group_by: formData.group_by || undefined, // Convert empty string to undefined
        filters: sanitizeFilters(formData.filters), // Sanitize filter values
      };

      if (isEditing && uid) {
        await updateView.mutateAsync({
          uid,
          data: dataToSend,
        });
      } else {
        await createView.mutateAsync(dataToSend);
      }
      navigate('/views');
    } catch (error: any) {
      console.error('保存视图失败:', error);
      
      // Extract error message from the response
      if (error?.response?.data?.error?.message) {
        setErrorMessage(error.response.data.error.message);
      } else if (error?.message) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('保存视图时发生未知错误');
      }
    }
  };

  const handleDelete = async () => {
    if (isEditing && uid && window.confirm('确定要删除这个视图吗？')) {
      try {
        await deleteView.mutateAsync(uid);
        navigate('/views');
      } catch (error) {
        console.error('删除视图失败:', error);
      }
    }
  };

  const addSort = () => {
    setFormData({
      ...formData,
      sorts: [
        ...formData.sorts,
        {
          field: 'updated_at',
          direction: 'desc',
        },
      ],
    });
  };

  const updateSort = (index: number, sort: ViewSort) => {
    const newSorts = [...formData.sorts];
    newSorts[index] = sort;
    setFormData({ ...formData, sorts: newSorts });
  };

  const removeSort = (index: number) => {
    const newSorts = formData.sorts.filter((_, i) => i !== index);
    setFormData({ ...formData, sorts: newSorts });
  };

  const sortFieldOptions = [
    { value: 'status', label: '状态' },
    { value: 'priority', label: '优先级' },
    { value: 'title', label: '标题' },
    { value: 'start_date', label: '开始日期' },
    { value: 'due_date', label: '截止日期' },
    { value: 'created_at', label: '创建时间' },
    { value: 'updated_at', label: '更新时间' },
    { value: 'sort_order', label: '自定义排序' },
  ];

  const groupByOptions = [
    { value: '', label: '不分组' },
    { value: 'status', label: '按状态分组' },
    { value: 'priority', label: '按优先级分组' },
    { value: 'project', label: '按项目分组' },
    { value: 'tags', label: '按标签分组' },
    { value: 'due_date', label: '按截止日期分组' },
  ];

  if (viewLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
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
          
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold">
              {isEditing ? '编辑视图' : '创建视图'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!formData.name.trim() || createView.isPending || updateView.isPending}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createView.isPending || updateView.isPending ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}>
        <div className="p-4 space-y-6">
          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-red-500 text-[16px]">error</span>
                <span className="text-sm text-red-700 dark:text-red-300">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">基本信息</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  视图名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrorMessage(''); // Clear error when user starts typing
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="输入视图名称"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  关联项目
                </label>
                <select
                  value={formData.project_uid}
                  onChange={(e) => setFormData({ ...formData, project_uid: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="">全局视图</option>
                  {projects.map((project) => (
                    <option key={project.uid} value={project.uid}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  视图类型
                </label>
                <select
                  value={formData.view_type}
                  onChange={(e) => setFormData({ ...formData, view_type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="list">列表视图</option>
                  <option value="board">看板视图</option>
                  <option value="calendar">日历视图</option>
                  <option value="table">表格视图</option>
                  <option value="timeline">时间轴视图</option>
                  <option value="gallery">画廊视图</option>
                </select>
              </div>
            </div>
          </div>

          {/* 筛选条件 */}
          <FilterBuilder
            filters={formData.filters}
            onChange={(filters) => setFormData({ ...formData, filters })}
          />

          {/* 排序规则 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">排序规则</h3>
              <button
                onClick={addSort}
                className="text-primary text-sm font-medium hover:opacity-70"
              >
                + 添加排序
              </button>
            </div>

            {formData.sorts.map((sort, index) => (
              <div key={index} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">排序规则 {index + 1}</span>
                  <button
                    onClick={() => removeSort(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={sort.field}
                    onChange={(e) => updateSort(index, { ...sort, field: e.target.value })}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.25rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1em 1em',
                      paddingRight: '1.5rem'
                    }}
                  >
                    {sortFieldOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={sort.direction}
                    onChange={(e) => updateSort(index, { ...sort, direction: e.target.value as 'asc' | 'desc' })}
                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.25rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1em 1em',
                      paddingRight: '1.5rem'
                    }}
                  >
                    <option value="asc">升序</option>
                    <option value="desc">降序</option>
                  </select>
                </div>
              </div>
            ))}
          </div>

          {/* 分组设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">分组设置</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                分组方式
              </label>
              <select
                value={formData.group_by}
                onChange={(e) => setFormData({ ...formData, group_by: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 0.5rem center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '1.5em 1.5em',
                  paddingRight: '2.5rem'
                }}
              >
                {groupByOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 显示设置 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">显示设置</h3>
            
            <div className="space-y-3">
              {/* 导航栏显示选项 */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">视图可见性</h4>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={formData.is_visible_in_nav}
                    onChange={(e) => setFormData({
                      ...formData,
                      is_visible_in_nav: e.target.checked,
                    })}
                    className="mr-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">在导航栏中显示此视图</span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  勾选后，此视图会出现在任务页面的顶部导航栏中，方便快速切换
                </p>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">显示字段</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.display_settings.show_project}
                      onChange={(e) => setFormData({
                        ...formData,
                        display_settings: {
                          ...formData.display_settings,
                          show_project: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">显示项目</span>
                  </label>
                  
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.display_settings.show_tags}
                      onChange={(e) => setFormData({
                        ...formData,
                        display_settings: {
                          ...formData.display_settings,
                          show_tags: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">显示标签</span>
                  </label>
                  
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.display_settings.show_due_date}
                      onChange={(e) => setFormData({
                        ...formData,
                        display_settings: {
                          ...formData.display_settings,
                          show_due_date: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">显示截止日期</span>
                  </label>
                  
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.display_settings.show_priority}
                      onChange={(e) => setFormData({
                        ...formData,
                        display_settings: {
                          ...formData.display_settings,
                          show_priority: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">显示优先级</span>
                  </label>
                  
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={formData.display_settings.show_status}
                      onChange={(e) => setFormData({
                        ...formData,
                        display_settings: {
                          ...formData.display_settings,
                          show_status: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">显示状态</span>
                  </label>
                  
                  <label className="flex items-center text-sm col-span-2">
                    <input
                      type="checkbox"
                      checked={formData.display_settings.compact_mode}
                      onChange={(e) => setFormData({
                        ...formData,
                        display_settings: {
                          ...formData.display_settings,
                          compact_mode: e.target.checked,
                        },
                      })}
                      className="mr-2"
                    />
                    <span className="text-gray-700 dark:text-gray-300">紧凑模式</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* 删除按钮 */}
          {isEditing && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleDelete}
                className="w-full py-3 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors"
              >
                删除视图
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CreateViewPage;