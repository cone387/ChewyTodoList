import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useCreateView } from '../hooks/useViews';
import type { ViewTemplate } from '../types/templates';

const ViewTemplatePreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createView = useCreateView();
  
  const [template, setTemplate] = useState<ViewTemplate | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'preview'>('overview');

  useEffect(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      try {
        const templateData = JSON.parse(decodeURIComponent(templateParam));
        setTemplate(templateData);
      } catch (error) {
        console.error('Failed to parse template data:', error);
        navigate('/views/templates');
      }
    } else {
      navigate('/views/templates');
    }
  }, [searchParams, navigate]);

  const handleBack = () => {
    navigate('/views/templates');
  };

  const handleCreateFromTemplate = async () => {
    if (!template) return;

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
        is_visible_in_nav: true,
        project_uid: undefined,
      };

      await createView.mutateAsync(viewData);
      navigate('/views');
    } catch (error) {
      console.error('从模板创建视图失败:', error);
    }
  };

  const getViewTypeIcon = (viewType: string) => {
    switch (viewType) {
      case 'list': return 'list';
      case 'board': return 'view_kanban';
      case 'calendar': return 'calendar_month';
      case 'table': return 'table';
      case 'timeline': return 'timeline';
      case 'gallery': return 'photo_library';
      default: return 'list';
    }
  };

  const getViewTypeLabel = (viewType: string) => {
    switch (viewType) {
      case 'list': return '列表视图';
      case 'board': return '看板视图';
      case 'calendar': return '日历视图';
      case 'table': return '表格视图';
      case 'timeline': return '时间轴视图';
      case 'gallery': return '画廊视图';
      default: return viewType;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="material-symbols-outlined text-yellow-400 text-[16px]">star</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="material-symbols-outlined text-yellow-400 text-[16px]">star_half</span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="material-symbols-outlined text-gray-300 text-[16px]">star</span>
      );
    }

    return stars;
  };

  const getOperatorLabel = (operator: string) => {
    const operatorLabels: Record<string, string> = {
      'equals': '等于',
      'not_equals': '不等于',
      'contains': '包含',
      'not_contains': '不包含',
      'starts_with': '开始于',
      'ends_with': '结束于',
      'is_empty': '为空',
      'is_not_empty': '不为空',
      'greater_than': '大于',
      'greater_than_or_equal': '大于等于',
      'less_than': '小于',
      'less_than_or_equal': '小于等于',
      'in': '包含于',
      'not_in': '不包含于',
      'between': '介于',
      'not_between': '不介于',
      'is_today': '是今天',
      'is_yesterday': '是昨天',
      'is_tomorrow': '是明天',
      'is_this_week': '是本周',
      'is_last_week': '是上周',
      'is_next_week': '是下周',
      'is_this_month': '是本月',
      'is_last_month': '是上月',
      'is_next_month': '是下月',
      'is_overdue': '已逾期',
      'has_no_date': '无日期',
    };
    return operatorLabels[operator] || operator;
  };

  const getFieldLabel = (field: string) => {
    const fieldLabels: Record<string, string> = {
      'title': '标题',
      'status': '状态',
      'priority': '优先级',
      'due_date': '截止日期',
      'start_date': '开始日期',
      'created_at': '创建时间',
      'updated_at': '更新时间',
      'project': '项目',
      'tags': '标签',
      'assignee': '负责人',
      'completed_time': '完成时间',
    };
    return fieldLabels[field] || field;
  };

  if (!template) {
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
            <span className="text-base font-semibold">模板预览</span>
          </div>
          
          <button
            onClick={handleCreateFromTemplate}
            disabled={createView.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {createView.isPending ? '创建中...' : '使用模板'}
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-100 dark:border-gray-800">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            概览
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'config'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            配置
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-primary border-b-2 border-primary bg-primary/5'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            效果预览
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 120px)' }}>
        <div className="p-4 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Template Header */}
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-6">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`size-16 rounded-xl flex items-center justify-center ${template.color}`}>
                    <span className="material-symbols-outlined text-[32px]">
                      {template.icon}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                        {template.name}
                      </h1>
                      <div className={`size-8 rounded flex items-center justify-center ${
                        template.view_type === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                        template.view_type === 'board' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                        template.view_type === 'calendar' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                        template.view_type === 'table' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                        template.view_type === 'timeline' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                        'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
                      }`}>
                        <span className="material-symbols-outlined text-[18px]">
                          {getViewTypeIcon(template.view_type)}
                        </span>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      {template.description}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        {renderStars(template.rating || 0)}
                        <span className="text-gray-500 ml-1">{template.rating}</span>
                      </div>
                      <span className="text-gray-500">
                        {template.usage_count} 次使用
                      </span>
                      <span className="text-gray-500">
                        {getViewTypeLabel(template.view_type)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm rounded-full border border-gray-200 dark:border-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features Overview */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">功能特性</h2>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-blue-500 text-[20px]">filter_alt</span>
                      <span className="font-medium text-gray-900 dark:text-white">筛选条件</span>
                    </div>
                    <span className="text-2xl font-bold text-blue-500">{template.filters.length}</span>
                    <span className="text-sm text-gray-500 ml-1">个条件</span>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-green-500 text-[20px]">sort</span>
                      <span className="font-medium text-gray-900 dark:text-white">排序规则</span>
                    </div>
                    <span className="text-2xl font-bold text-green-500">{template.sorts.length}</span>
                    <span className="text-sm text-gray-500 ml-1">个规则</span>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-purple-500 text-[20px]">group_work</span>
                      <span className="font-medium text-gray-900 dark:text-white">分组方式</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {template.group_by ? getFieldLabel(template.group_by) : '无分组'}
                    </span>
                  </div>
                  
                  <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-orange-500 text-[20px]">visibility</span>
                      <span className="font-medium text-gray-900 dark:text-white">显示字段</span>
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {Object.values(template.display_settings).filter(Boolean).length} 个字段
                    </span>
                  </div>
                </div>
              </div>

              {/* Use Cases */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">适用场景</h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {template.category === 'productivity' && (
                      <>
                        <p>• 提升个人工作效率和专注度</p>
                        <p>• 优化任务优先级管理</p>
                        <p>• 减少任务切换和干扰</p>
                      </>
                    )}
                    {template.category === 'project' && (
                      <>
                        <p>• 项目进度跟踪和管理</p>
                        <p>• 团队协作和任务分配</p>
                        <p>• 里程碑和交付物管理</p>
                      </>
                    )}
                    {template.category === 'personal' && (
                      <>
                        <p>• 个人生活规划和管理</p>
                        <p>• 习惯养成和追踪</p>
                        <p>• 个人目标达成</p>
                      </>
                    )}
                    {template.category === 'team' && (
                      <>
                        <p>• 团队任务分配和协作</p>
                        <p>• 工作负载平衡</p>
                        <p>• 团队绩效跟踪</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6">
              {/* Filters Configuration */}
              {template.filters.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">筛选条件</h2>
                  <div className="space-y-3">
                    {template.filters.map((filter, index) => (
                      <div key={index} className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-blue-500 text-[16px]">filter_alt</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            筛选条件 {index + 1}
                          </span>
                          {filter.logic && index > 0 && (
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded uppercase">
                              {filter.logic}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{getFieldLabel(filter.field)}</span>
                          <span className="mx-2">{getOperatorLabel(filter.operator)}</span>
                          {filter.value !== null && filter.value !== undefined && (
                            <span className="font-medium">
                              {Array.isArray(filter.value) ? filter.value.join(', ') : String(filter.value)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sorts Configuration */}
              {template.sorts.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">排序规则</h2>
                  <div className="space-y-3">
                    {template.sorts.map((sort, index) => (
                      <div key={index} className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="material-symbols-outlined text-green-500 text-[16px]">sort</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            排序规则 {index + 1}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{getFieldLabel(sort.field)}</span>
                          <span className="mx-2">-</span>
                          <span className="font-medium">
                            {sort.direction === 'asc' ? '升序' : '降序'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Group By Configuration */}
              {template.group_by && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">分组设置</h2>
                  <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="material-symbols-outlined text-purple-500 text-[16px]">group_work</span>
                      <span className="font-medium text-gray-900 dark:text-white">分组方式</span>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      按 <span className="font-medium">{getFieldLabel(template.group_by)}</span> 分组
                    </div>
                  </div>
                </div>
              )}

              {/* Display Settings */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">显示设置</h2>
                <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(template.display_settings).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          {key === 'show_project' ? '显示项目' :
                           key === 'show_tags' ? '显示标签' :
                           key === 'show_due_date' ? '显示截止日期' :
                           key === 'show_priority' ? '显示优先级' :
                           key === 'show_status' ? '显示状态' :
                           key === 'show_assignee' ? '显示负责人' :
                           key === 'show_progress' ? '显示进度' :
                           key === 'show_attachments' ? '显示附件' :
                           key === 'compact_mode' ? '紧凑模式' :
                           key}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          value ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                                  'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}>
                          {value ? '开启' : '关闭'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-6">
              {/* Preview Placeholder */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">效果预览</h2>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 text-center">
                  <div className={`size-16 rounded-lg flex items-center justify-center mx-auto mb-4 ${template.color}`}>
                    <span className="material-symbols-outlined text-[32px]">
                      {getViewTypeIcon(template.view_type)}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {getViewTypeLabel(template.view_type)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    此模板将创建一个 {getViewTypeLabel(template.view_type).toLowerCase()}，
                    {template.filters.length > 0 && `包含 ${template.filters.length} 个筛选条件`}
                    {template.sorts.length > 0 && `，${template.sorts.length} 个排序规则`}
                    {template.group_by && `，按${getFieldLabel(template.group_by)}分组`}。
                  </p>
                  
                  <div className="bg-white dark:bg-surface-dark rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      预览功能即将推出
                    </div>
                    <div className="text-xs text-gray-400">
                      点击"使用模板"创建视图后可查看实际效果
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ViewTemplatePreviewPage;