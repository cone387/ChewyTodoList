import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateView } from '../hooks/useViews';
import { VIEW_TEMPLATES, TEMPLATE_CATEGORIES, getRecommendedTemplates } from '../data/viewTemplates';
import type { ViewTemplate } from '../types/templates';
import { useToast } from '../hooks/useToast';
import ToastContainer from '../components/ToastContainer';

const ViewTemplateMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const createView = useCreateView();
  const { toasts, removeToast } = useToast();
  
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
            <span className="text-base font-semibold">视图广场</span>
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
              placeholder="搜索视图..."
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
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-2">
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
        <div className="flex overflow-x-auto hide-scrollbar px-4 pb-3">
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
                    onClick={() => handlePreviewTemplate(template)}
                    className="bg-white dark:bg-surface-dark border-2 border-primary/30 rounded-xl overflow-hidden shadow-md hover:shadow-xl hover:border-primary/50 transition-all cursor-pointer"
                  >
                    {/* 预览缩略图 - 推荐样式，显示视图类型的视觉效果 */}
                    <div className={`h-44 relative bg-gradient-to-br from-primary/20 to-primary/5 p-3`}>
                      {/* 根据视图类型显示不同的预览效果 */}
                      {template.view_type === 'list' && (
                        <div className="space-y-2">
                          {['完成产品需求文档', '修复登录页Bug', '优化数据库查询'].map((title, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-2.5 flex items-center gap-2 shadow-md text-[10px]">
                              <div className="size-4 rounded border-2 border-primary/50 flex-shrink-0"></div>
                              <span className="flex-1 text-gray-700 dark:text-gray-300 font-medium truncate">{title}</span>
                              <span className="text-[9px] px-2 py-0.5 bg-orange-100 text-orange-600 rounded font-medium">高</span>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {template.view_type === 'board' && (
                        <div className="flex gap-2 h-full text-[9px]">
                          {[
                            { name: '待办', tasks: ['需求分析', '设计评审'] },
                            { name: '进行中', tasks: ['开发功能', '编写文档'] },
                            { name: '已完成', tasks: ['测试通过'] }
                          ].map((col, i) => (
                            <div key={i} className="flex-1 bg-white dark:bg-gray-800 rounded-lg p-2 space-y-2 shadow-md">
                              <div className="font-bold text-gray-700 dark:text-gray-300">{col.name}</div>
                              {col.tasks.map((task, j) => (
                                <div key={j} className="bg-gray-50 dark:bg-gray-700 rounded p-2">
                                  <div className="text-gray-700 dark:text-gray-300 font-medium leading-tight">{task}</div>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {template.view_type === 'calendar' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 h-full shadow-md text-[8px]">
                          <div className="grid grid-cols-7 gap-1.5 mb-2">
                            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                              <div key={day} className="text-center font-bold text-gray-600 dark:text-gray-400">{day}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-1.5">
                            {Array.from({ length: 21 }).map((_, i) => (
                              <div key={i} className={`aspect-square rounded flex items-center justify-center font-medium ${
                                i === 10 ? 'bg-primary text-white' :
                                i === 12 || i === 15 ? 'bg-primary/30 text-primary' : 
                                'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {template.view_type === 'table' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-2 h-full shadow-md text-[9px]">
                          <div className="grid grid-cols-4 gap-1.5 mb-2 font-bold text-gray-700 dark:text-gray-300">
                            <div>任务</div>
                            <div>状态</div>
                            <div>优先级</div>
                            <div>截止</div>
                          </div>
                          {[
                            ['需求文档', '进行中', '高', '今天'],
                            ['Bug修复', '待办', '紧急', '明天'],
                            ['代码审查', '已完成', '中', '昨天'],
                            ['性能优化', '待办', '低', '本周']
                          ].map((row, i) => (
                            <div key={i} className="grid grid-cols-4 gap-1.5 mb-1.5 text-gray-600 dark:text-gray-400">
                              {row.map((cell, j) => (
                                <div key={j} className="truncate">{cell}</div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {template.view_type === 'timeline' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 h-full flex items-center shadow-md text-[9px]">
                          <div className="w-full space-y-3">
                            {[
                              { name: '需求分析', width: 40 },
                              { name: '开发实现', width: 60 },
                              { name: '测试上线', width: 80 }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-14 text-gray-600 dark:text-gray-400 font-bold truncate">{item.name}</div>
                                <div className="flex-1 h-5 bg-primary/40 rounded flex items-center px-2 text-primary font-bold" style={{ width: `${item.width}%` }}>
                                  {item.width}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {template.view_type === 'gallery' && (
                        <div className="grid grid-cols-3 gap-2 h-full text-[8px]">
                          {['UI设计', 'API文档', '测试报告', '部署指南', '用户手册', '技术方案'].map((title, i) => (
                            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg p-2 space-y-1 shadow-md">
                              <div className="aspect-square bg-gradient-to-br from-primary/30 to-primary/10 rounded flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-[18px]">description</span>
                              </div>
                              <div className="text-gray-700 dark:text-gray-300 font-bold truncate leading-tight">{title}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 推荐标签 */}
                      <div className="absolute top-2 left-2">
                        <span className="px-2.5 py-1 bg-primary text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          推荐
                        </span>
                      </div>
                      
                      {/* 视图类型标签 */}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">
                            {getViewTypeIcon(template.view_type)}
                          </span>
                          {getViewTypeLabel(template.view_type)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {template.description}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1">
                          {renderStars(template.rating || 0)}
                          <span className="text-gray-500 ml-1 font-medium">{template.rating}</span>
                        </div>
                        <span className="text-gray-500">
                          {template.usage_count} 次使用
                        </span>
                      </div>
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
                    className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-lg hover:border-primary/50 transition-all group relative"
                  >
                    {/* 预览缩略图 - 显示视图类型的视觉效果 */}
                    <div 
                      onClick={() => handlePreviewTemplate(template)}
                      className={`h-40 relative ${template.color} bg-gradient-to-br from-current/10 to-current/5 p-3 cursor-pointer`}
                    >
                      {/* 根据视图类型显示不同的预览效果 - 使用真实的任务卡片样式 */}
                      {template.view_type === 'list' && (
                        <div className="space-y-1.5">
                          {[
                            { title: '完成产品需求文档', priority: '高', status: '进行中' },
                            { title: '修复登录页Bug', priority: '紧急', status: '待办' },
                            { title: '优化数据库查询', priority: '中', status: '已完成' }
                          ].map((task, i) => (
                            <div key={i} className="bg-white/95 dark:bg-gray-800/95 rounded-md p-2 shadow-sm text-[9px] border border-gray-100 dark:border-gray-700">
                              <div className="flex items-start gap-1.5 mb-1">
                                <div className="size-3 rounded border border-gray-400 flex-shrink-0 mt-0.5"></div>
                                <span className="flex-1 text-gray-800 dark:text-gray-200 font-medium leading-tight">{task.title}</span>
                              </div>
                              <div className="flex items-center gap-1.5 ml-4">
                                <span className={`text-[7px] px-1.5 py-0.5 rounded font-medium ${
                                  task.priority === '紧急' ? 'bg-red-100 text-red-600' :
                                  task.priority === '高' ? 'bg-orange-100 text-orange-600' :
                                  'bg-blue-100 text-blue-600'
                                }`}>{task.priority}</span>
                                <span className="text-[7px] text-gray-500">•</span>
                                <span className="text-[7px] text-gray-500">{task.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {template.view_type === 'board' && (
                        <div className="flex gap-1.5 h-full text-[8px]">
                          {[
                            { name: '待办', color: 'bg-blue-50', tasks: [{ title: '需求分析', tag: '设计' }, { title: '设计评审', tag: '评审' }] },
                            { name: '进行中', color: 'bg-yellow-50', tasks: [{ title: '开发功能', tag: '开发' }, { title: '编写文档', tag: '文档' }] },
                            { name: '已完成', color: 'bg-green-50', tasks: [{ title: '测试通过', tag: '测试' }] }
                          ].map((col, i) => (
                            <div key={i} className="flex-1 bg-white/95 dark:bg-gray-800/95 rounded-md p-1.5 space-y-1 border border-gray-100 dark:border-gray-700">
                              <div className="font-semibold text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                                <div className={`size-1.5 rounded-full ${col.color}`}></div>
                                {col.name}
                              </div>
                              {col.tasks.map((task, j) => (
                                <div key={j} className="bg-gray-50 dark:bg-gray-700 rounded p-1.5 border border-gray-200 dark:border-gray-600">
                                  <div className="text-gray-800 dark:text-gray-200 font-medium leading-tight mb-0.5">{task.title}</div>
                                  <span className="text-[6px] px-1 py-0.5 bg-primary/20 text-primary rounded">{task.tag}</span>
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {template.view_type === 'calendar' && (
                        <div className="bg-white/95 dark:bg-gray-800/95 rounded-md p-2 h-full text-[7px] border border-gray-100 dark:border-gray-700">
                          <div className="grid grid-cols-7 gap-0.5 mb-1">
                            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
                              <div key={day} className="text-center text-gray-500 font-medium">{day}</div>
                            ))}
                          </div>
                          <div className="grid grid-cols-7 gap-0.5">
                            {Array.from({ length: 21 }).map((_, i) => (
                              <div key={i} className={`aspect-square rounded flex items-center justify-center text-[6px] ${
                                i === 10 ? 'bg-primary text-white font-bold' :
                                i === 12 ? 'bg-orange-100 text-orange-600 font-medium' :
                                i === 15 ? 'bg-blue-100 text-blue-600 font-medium' : 
                                'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}>
                                {i + 1}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {template.view_type === 'table' && (
                        <div className="bg-white/95 dark:bg-gray-800/95 rounded-md p-1.5 h-full text-[8px] border border-gray-100 dark:border-gray-700">
                          <div className="grid grid-cols-4 gap-1 mb-1 font-semibold text-gray-700 dark:text-gray-300 pb-1 border-b border-gray-200 dark:border-gray-600">
                            <div>任务</div>
                            <div>状态</div>
                            <div>优先级</div>
                            <div>截止</div>
                          </div>
                          {[
                            { task: '需求文档', status: '进行中', priority: '高', due: '今天' },
                            { task: 'Bug修复', status: '待办', priority: '紧急', due: '明天' },
                            { task: '代码审查', status: '已完成', priority: '中', due: '昨天' }
                          ].map((row, i) => (
                            <div key={i} className="grid grid-cols-4 gap-1 mb-0.5 text-gray-600 dark:text-gray-400 py-0.5">
                              <div className="truncate font-medium text-gray-800 dark:text-gray-200">{row.task}</div>
                              <div className="truncate">
                                <span className={`text-[6px] px-1 py-0.5 rounded ${
                                  row.status === '已完成' ? 'bg-green-100 text-green-600' :
                                  row.status === '进行中' ? 'bg-blue-100 text-blue-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{row.status}</span>
                              </div>
                              <div className="truncate">
                                <span className={`text-[6px] px-1 py-0.5 rounded ${
                                  row.priority === '紧急' ? 'bg-red-100 text-red-600' :
                                  row.priority === '高' ? 'bg-orange-100 text-orange-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>{row.priority}</span>
                              </div>
                              <div className="truncate text-[7px]">{row.due}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {template.view_type === 'timeline' && (
                        <div className="bg-white/95 dark:bg-gray-800/95 rounded-md p-2 h-full flex items-center text-[8px] border border-gray-100 dark:border-gray-700">
                          <div className="w-full space-y-2">
                            {[
                              { name: '需求分析', width: 40, color: 'bg-blue-500' },
                              { name: '开发实现', width: 60, color: 'bg-green-500' },
                              { name: '测试上线', width: 80, color: 'bg-purple-500' }
                            ].map((item, i) => (
                              <div key={i} className="flex items-center gap-1.5">
                                <div className="w-12 text-gray-700 dark:text-gray-300 font-medium truncate">{item.name}</div>
                                <div className={`h-4 ${item.color} rounded flex items-center px-1.5 text-white text-[7px] font-medium shadow-sm`} style={{ width: `${item.width}%` }}>
                                  {item.width}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {template.view_type === 'gallery' && (
                        <div className="grid grid-cols-3 gap-1.5 h-full text-[7px]">
                          {[
                            { title: 'UI设计', icon: 'palette', color: 'from-purple-400 to-purple-200' },
                            { title: 'API文档', icon: 'code', color: 'from-blue-400 to-blue-200' },
                            { title: '测试报告', icon: 'bug_report', color: 'from-green-400 to-green-200' },
                            { title: '部署指南', icon: 'rocket_launch', color: 'from-orange-400 to-orange-200' },
                            { title: '用户手册', icon: 'menu_book', color: 'from-pink-400 to-pink-200' },
                            { title: '技术方案', icon: 'engineering', color: 'from-cyan-400 to-cyan-200' }
                          ].map((item, i) => (
                            <div key={i} className="bg-white/95 dark:bg-gray-800/95 rounded-md p-1 space-y-0.5 border border-gray-100 dark:border-gray-700">
                              <div className={`aspect-square bg-gradient-to-br ${item.color} rounded flex items-center justify-center`}>
                                <span className="material-symbols-outlined text-white text-[16px]">{item.icon}</span>
                              </div>
                              <div className="text-gray-800 dark:text-gray-200 font-medium truncate leading-tight px-0.5">{item.title}</div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* 视图类型标签 */}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm text-xs font-medium rounded-full shadow-sm flex items-center gap-1">
                          <span className="material-symbols-outlined text-[12px]">
                            {getViewTypeIcon(template.view_type)}
                          </span>
                          {getViewTypeLabel(template.view_type)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                            {template.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {template.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs">
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
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        {template.filters.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">filter_alt</span>
                            <span>{template.filters.length} 筛选</span>
                          </div>
                        )}
                        {template.sorts.length > 0 && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">sort</span>
                            <span>{template.sorts.length} 排序</span>
                          </div>
                        )}
                        {template.group_by && (
                          <div className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">group_work</span>
                            <span>分组</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* 使用按钮 - 右下角 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFromTemplate(template);
                      }}
                      disabled={createView.isPending}
                      className="absolute bottom-4 right-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg flex items-center gap-1.5 opacity-0 group-hover:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      {createView.isPending ? '创建中...' : '使用'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ViewTemplateMarketPage;