import React from 'react';
import type { ViewTemplate } from '../types/templates';

interface TemplateCardProps {
  template: ViewTemplate;
  onPreview: (template: ViewTemplate) => void;
  onUse: (template: ViewTemplate) => void;
  loading?: boolean;
}

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onPreview,
  onUse,
  loading = false,
}) => {
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
    <div className="bg-white dark:bg-surface-dark border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
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
          onClick={() => onPreview(template)}
          className="flex-1 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          预览
        </button>
        <button
          onClick={() => onUse(template)}
          disabled={loading}
          className="flex-1 py-2 px-3 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {loading ? '创建中...' : '使用模板'}
        </button>
      </div>
    </div>
  );
};

export default TemplateCard;