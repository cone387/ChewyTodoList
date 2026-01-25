import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useCreateView, useUpdateView, useDeleteView, useView } from '../hooks/useViews';
import FilterBuilder from '../components/FilterBuilder';
import MobileSelect from '../components/MobileSelect';
import { VIEW_TEMPLATES } from '../data/viewTemplates';
import { TASK_CARD_TEMPLATES } from '../types/taskCard';
import type { ViewFilter, ViewSort } from '../types/index';
import type { ViewTemplate } from '../types/templates';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';

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
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    view_type: 'list' as 'list' | 'board' | 'calendar' | 'table' | 'timeline' | 'gallery',
    filters: [] as ViewFilter[],
    sorts: [] as ViewSort[],
    group_by: '',
    is_visible_in_nav: true, // 默认显示在导航栏
    card_template_id: 'default', // 默认卡片模板（会在视图类型改变时更新）
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
  const { confirmState, confirm, handleCancel } = useConfirm();

  useEffect(() => {
    if (view) {
      setFormData({
        name: view.name,
        view_type: view.view_type,
        filters: view.filters || [],
        sorts: view.sorts || [],
        group_by: view.group_by || '',
        is_visible_in_nav: view.is_visible_in_nav ?? true,
        card_template_id: (view.display_settings as any)?.card_template_id || 'default',
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
        project_uid: undefined, // 不再发送项目关联
        group_by: formData.group_by || undefined, // Convert empty string to undefined
        filters: sanitizeFilters(formData.filters), // Sanitize filter values
        display_settings: {
          ...formData.display_settings,
          card_template_id: formData.card_template_id, // 保存卡片模板ID
        },
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
    if (isEditing && uid) {
      const confirmed = await confirm({
        title: '删除视图',
        message: '确定要删除这个视图吗？此操作无法撤销。',
        confirmText: '删除',
        cancelText: '取消',
        confirmColor: 'danger',
      });
      
      if (confirmed) {
        try {
          await deleteView.mutateAsync(uid);
          navigate('/views');
        } catch (error) {
          console.error('删除视图失败:', error);
        }
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

  const handleApplyTemplate = (template: ViewTemplate) => {
    setFormData({
      ...formData,
      view_type: template.view_type,
      filters: template.filters,
      sorts: template.sorts,
      group_by: template.group_by || '',
      display_settings: {
        ...formData.display_settings,
        ...template.display_settings,
      },
    });
    setShowTemplateSelector(false);
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

  // 根据视图类型获取可用的卡片模板
  const getAvailableCardTemplates = () => {
    const viewType = formData.view_type;
    
    // 不同视图类型对应的卡片模板
    const templatesByViewType: Record<string, string[]> = {
      list: ['default', 'minimal', 'detailed', 'colorful', 'timeline'],
      board: ['kanban', 'default', 'minimal', 'colorful'],
      calendar: ['minimal', 'default', 'timeline'],
      table: ['minimal', 'default'],
      timeline: ['timeline', 'default', 'minimal'],
      gallery: ['detailed', 'colorful', 'default'],
    };

    const availableIds = templatesByViewType[viewType] || ['default'];
    
    // 只返回该视图类型可用的模板
    return TASK_CARD_TEMPLATES.filter(t => availableIds.includes(t.id));
  };

  // 获取视图类型的默认卡片模板
  const getDefaultCardTemplate = (viewType: string): string => {
    const defaultsByViewType: Record<string, string> = {
      list: 'default',
      board: 'kanban',
      calendar: 'minimal',
      table: 'minimal',
      timeline: 'timeline',
      gallery: 'detailed',
    };
    
    return defaultsByViewType[viewType] || 'default';
  };

  // 当视图类型改变时，自动选择推荐的卡片模板
  const handleViewTypeChange = (newViewType: string) => {
    const templatesByViewType: Record<string, string[]> = {
      list: ['default', 'minimal', 'detailed', 'colorful', 'timeline'],
      board: ['kanban', 'default', 'minimal', 'colorful'],
      calendar: ['minimal', 'default', 'timeline'],
      table: ['minimal', 'default'],
      timeline: ['timeline', 'default', 'minimal'],
      gallery: ['detailed', 'colorful', 'default'],
    };
    
    const availableIds = templatesByViewType[newViewType as keyof typeof templatesByViewType] || ['default'];
    
    // 如果当前卡片模板不在新视图类型的可用列表中，切换到默认模板
    if (!availableIds.includes(formData.card_template_id)) {
      setFormData({ 
        ...formData, 
        view_type: newViewType as any,
        card_template_id: getDefaultCardTemplate(newViewType)
      });
    } else {
      setFormData({ ...formData, view_type: newViewType as any });
    }
  };

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
      <header className="fixed top-0 left-0 right-0 z-20 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto">
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

      {/* 模板选择器弹窗 */}
      {showTemplateSelector && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-surface-dark rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* 弹窗头部 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">选择视图模板</h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
            </div>

            {/* 模板列表 */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 gap-3">
                {VIEW_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleApplyTemplate(template)}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`size-10 rounded-lg flex items-center justify-center flex-shrink-0 ${template.color}`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {template.icon}
                        </span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {template.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded">
                            {template.view_type === 'list' ? '列表' :
                             template.view_type === 'board' ? '看板' :
                             template.view_type === 'calendar' ? '日历' :
                             template.view_type === 'table' ? '表格' :
                             template.view_type === 'timeline' ? '时间轴' : '画廊'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {template.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          {template.filters.length > 0 && (
                            <span>{template.filters.length} 个筛选</span>
                          )}
                          {template.sorts.length > 0 && (
                            <span>{template.sorts.length} 个排序</span>
                          )}
                          {template.group_by && (
                            <span>按{template.group_by}分组</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 弹窗底部 */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="w-full py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}>
        <div className="p-4 space-y-4">
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
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">基本信息</h3>
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                <span>模板</span>
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  视图名称
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    setErrorMessage(''); // Clear error when user starts typing
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="输入视图名称"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  视图类型
                </label>
                <MobileSelect
                  value={formData.view_type}
                  onChange={(value) => handleViewTypeChange(value as string)}
                  options={[
                    { value: 'list', label: '列表' },
                    { value: 'board', label: '看板' },
                    { value: 'calendar', label: '日历' },
                    { value: 'table', label: '表格' },
                    { value: 'timeline', label: '时间轴' },
                    { value: 'gallery', label: '画廊' },
                  ]}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  卡片样式
                </label>
                <MobileSelect
                  value={formData.card_template_id}
                  onChange={(value) => setFormData({ ...formData, card_template_id: value as string })}
                  options={getAvailableCardTemplates().map(template => {
                    const isDefault = template.id === getDefaultCardTemplate(formData.view_type);
                    return {
                      value: template.id,
                      label: isDefault ? `${template.name}（默认）` : template.name
                    };
                  })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  分组方式
                </label>
                <MobileSelect
                  value={formData.group_by}
                  onChange={(value) => setFormData({ ...formData, group_by: value as string })}
                  options={groupByOptions}
                />
              </div>

              {/* 导航栏显示选项 - 移到基本信息区域 */}
              <label className="flex items-center text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_visible_in_nav}
                  onChange={(e) => setFormData({
                    ...formData,
                    is_visible_in_nav: e.target.checked,
                  })}
                  className="mr-2"
                />
                <span className="text-gray-700 dark:text-gray-300">在导航栏中显示</span>
              </label>
            </div>
          </div>

          {/* 筛选条件 */}
          <FilterBuilder
            filters={formData.filters}
            onChange={(filters) => setFormData({ ...formData, filters })}
          />

          {/* 排序规则 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">排序规则</h3>
              <button
                onClick={addSort}
                className="flex items-center gap-1 text-primary text-xs font-medium hover:opacity-70"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>添加</span>
              </button>
            </div>

            {formData.sorts.length === 0 ? (
              <div className="text-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                <span className="material-symbols-outlined text-[28px] mb-1 block opacity-50">sort</span>
                <p className="text-xs">暂无排序规则</p>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.sorts.map((sort, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                      {/* 拖动手柄 */}
                      <div className="flex-shrink-0 text-gray-400">
                        <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
                      </div>
                      
                      {/* 字段选择 */}
                      <div className="flex-1">
                        <MobileSelect
                          value={sort.field}
                          onChange={(value) => updateSort(index, { ...sort, field: value as string })}
                          options={sortFieldOptions}
                          className="text-xs py-1.5"
                        />
                      </div>
                      
                      {/* 方向选择 */}
                      <div className="w-24">
                        <MobileSelect
                          value={sort.direction}
                          onChange={(value) => updateSort(index, { ...sort, direction: value as 'asc' | 'desc' })}
                          options={[
                            { value: 'asc', label: '升序' },
                            { value: 'desc', label: '降序' },
                          ]}
                          className="text-xs py-1.5"
                        />
                      </div>
                      
                      {/* 删除按钮 */}
                      <button
                        onClick={() => removeSort(index)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 显示设置 */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">显示设置</h3>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <label className="flex items-center text-xs">
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
                <span className="text-gray-700 dark:text-gray-300">项目</span>
              </label>
              
              <label className="flex items-center text-xs">
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
                <span className="text-gray-700 dark:text-gray-300">标签</span>
              </label>
              
              <label className="flex items-center text-xs">
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
                <span className="text-gray-700 dark:text-gray-300">截止日期</span>
              </label>
              
              <label className="flex items-center text-xs">
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
                <span className="text-gray-700 dark:text-gray-300">优先级</span>
              </label>
              
              <label className="flex items-center text-xs">
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
                <span className="text-gray-700 dark:text-gray-300">状态</span>
              </label>
              
              <label className="flex items-center text-xs">
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
      
      {confirmState.isOpen && (
        <ConfirmDialog
          title={confirmState.title}
          message={confirmState.message}
          confirmText={confirmState.confirmText}
          cancelText={confirmState.cancelText}
          confirmColor={confirmState.confirmColor}
          onConfirm={confirmState.onConfirm}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default CreateViewPage;