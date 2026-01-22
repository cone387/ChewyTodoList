import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateView } from '../hooks/useViews';
import { VIEW_TEMPLATES, TEMPLATE_CATEGORIES, getRecommendedTemplates } from '../data/viewTemplates';
import type { ViewTemplate } from '../types/templates';

const ViewTemplateMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const createView = useCreateView();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedViewType, setSelectedViewType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'newest'>('popular');

  // 筛选和排序模板
  const filteredTemplates = useMemo(() => {
    let templates = VIEW_TEMPLATES;

    // 按分类筛选
    if (selectedCategory !== 'all') {
      templates = templates.filter(t => t.category === selectedCategory);
    }

    // 按视图类型筛选
    if (selectedViewType !== 'all') {
      templates = templates.filter(t => t.view_type === selectedViewType);
    }

    // 按搜索词筛选
    if (searchQuery) {
      templates = templates.filter(t => 
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    // 排序
    switch (sortBy) {
      case 'popular':
        templates.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
        break;
      case 'rating':
        templates.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        templates.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
    }

    return templates;
  }, [searchQuery, selectedCategory, selectedViewType, sortBy]);

  const handleBack = () => {
    navigate('/views');
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
        is_visible_in_nav: true,
        project_uid: undefined,
      };

      await createView.mutateAsync(viewData);
      navigate('/views');
    } catch (error) {
      console.error('从模板创建视图失败:', error);
    }
  };

  const handlePreviewTemplate = (template: ViewTemplate) => {
    // 跳转到预览页面，传递模板数据
    const templateData = encodeURIComponent(JSON.stringify(template));
    navigate(`/views/template-preview?template=${templateData}`);
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
      case 'list': return '列表';
      case 'board': return '看板';
      case 'calendar': return '日历';
      case 'table': return '表格';
      case 'timeline': return '时间轴';
      case 'gallery': return '画廊';
      default: return viewType;
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <span key={i} className="material-symbols-outlined text-yellow-400 text-[14px]">star</span>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <span key="half" className="material-symbols-outlined text-yellow-400 text-[14px]">star_half</span>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className="material-symbols-outlined text-gray-300 text-[14px]">star</span>
      );
    }

    return stars;
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
            <span className="text-base font-semibold">视图模板市场</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate('/views/create')}
              className="text-primary flex items-center justify-center size-10 hover:bg-primary/10 rounded-full transition-colors"
              title="创建自定义视图"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 pt-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            </div>
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-2">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              全部
            </button>
            {TEMPLATE_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* View Type Filter */}
        <div className="flex overflow-x-auto scrollbar-hide px-4 pb-3">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setSelectedViewType('all')}
              className={`px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                selectedViewType === 'all'
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              全部类型
            </button>
            {['list', 'board', 'calendar', 'table', 'timeline', 'gallery'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedViewType(type)}
                className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full whitespace-nowrap transition-colors ${
                  selectedViewType === type
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">
                  {getViewTypeIcon(type)}
                </span>
                {getViewTypeLabel(type)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-16 bg-white dark:bg-background-dark" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 200px)' }}>
        <div className="p-4 space-y-6">
          {/* Sort Options */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              找到 {filteredTemplates.length} 个模板
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1"
            >
              <option value="popular">最受欢迎</option>
              <option value="rating">评分最高</option>
              <option value="newest">最新发布</option>
            </select>
          </div>

          {/* Recommended Templates */}
          {selectedCategory === 'all' && !searchQuery && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">推荐模板</h2>
              <div className="grid grid-cols-1 gap-4">
                {getRecommendedTemplates(3).map((template) => (
                  <div
                    key={template.id}
                    className="bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`size-12 rounded-lg flex items-center justify-center ${template.color}`}>
                          <span className="material-symbols-outlined text-[28px]">
                            {template.icon}
                          </span>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {template.name}
                            </h3>
                            <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                              推荐
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePreviewTemplate(template)}
                        className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        预览
                      </button>
                      <button
                        onClick={() => handleCreateFromTemplate(template)}
                        disabled={createView.isPending}
                        className="flex-1 py-2 px-3 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        {createView.isPending ? '创建中...' : '使用模板'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Template Grid */}
          <div className="space-y-4">
            {selectedCategory !== 'all' && (
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {TEMPLATE_CATEGORIES.find(c => c.id === selectedCategory)?.name} 模板
              </h2>
            )}
            
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-[48px] mb-4">search_off</span>
                <p className="text-sm mb-4">没有找到匹配的模板</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                    setSelectedViewType('all');
                  }}
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  清除筛选
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`size-10 rounded-lg flex items-center justify-center ${template.color}`}>
                            <span className="material-symbols-outlined text-[24px]">
                              {template.icon}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                                {template.name}
                              </h3>
                              <div className={`size-6 rounded flex items-center justify-center ${
                                template.view_type === 'list' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' :
                                template.view_type === 'board' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' :
                                template.view_type === 'calendar' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600' :
                                template.view_type === 'table' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600' :
                                template.view_type === 'timeline' ? 'bg-red-100 dark:bg-red-900/30 text-red-600' :
                                'bg-pink-100 dark:bg-pink-900/30 text-pink-600'
                              }`}>
                                <span className="material-symbols-outlined text-[14px]">
                                  {getViewTypeIcon(template.view_type)}
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
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
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {template.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {template.tags.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                            +{template.tags.length - 3}
                          </span>
                        )}
                      </div>

                      {/* Template Features */}
                      <div className="space-y-1 mb-3 text-xs text-gray-500 dark:text-gray-400">
                        {template.filters.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">filter_alt</span>
                            <span>{template.filters.length} 个筛选条件</span>
                          </div>
                        )}
                        {template.sorts.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">sort</span>
                            <span>{template.sorts.length} 个排序规则</span>
                          </div>
                        )}
                        {template.group_by && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">group_work</span>
                            <span>按 {template.group_by} 分组</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 p-4 pt-0 border-t border-gray-100 dark:border-gray-700">
                      <button
                        onClick={() => handlePreviewTemplate(template)}
                        className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                      >
                        预览
                      </button>
                      <button
                        onClick={() => handleCreateFromTemplate(template)}
                        disabled={createView.isPending}
                        className="flex-1 py-2 px-3 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
                      >
                        {createView.isPending ? '创建中...' : '使用模板'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ViewTemplateMarketPage;