import React, { useState } from 'react';
import MobileSelect from './MobileSelect';
import type { ViewFilter, FieldDefinition, OperatorDefinition } from '../types/index';
import { TaskStatus, TaskPriority } from '../types/index';

interface FilterBuilderProps {
  filters: ViewFilter[];
  onChange: (filters: ViewFilter[]) => void;
}

// 字段定义
const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    key: 'status',
    label: '状态',
    type: 'select',
    options: [
      { value: TaskStatus.UNASSIGNED, label: '待分配', color: '#6b7280' },
      { value: TaskStatus.TODO, label: '待办', color: '#3b82f6' },
      { value: TaskStatus.COMPLETED, label: '已完成', color: '#10b981' },
      { value: TaskStatus.ABANDONED, label: '已放弃', color: '#ef4444' },
    ],
  },
  {
    key: 'priority',
    label: '优先级',
    type: 'select',
    options: [
      { value: TaskPriority.LOW, label: '低', color: '#6b7280' },
      { value: TaskPriority.MEDIUM, label: '中', color: '#f59e0b' },
      { value: TaskPriority.HIGH, label: '高', color: '#ef4444' },
      { value: TaskPriority.URGENT, label: '紧急', color: '#dc2626' },
    ],
  },
  {
    key: 'title',
    label: '标题',
    type: 'text',
  },
  {
    key: 'content',
    label: '内容',
    type: 'text',
  },
  {
    key: 'project__name',
    label: '项目',
    type: 'relation',
  },
  {
    key: 'tags__name',
    label: '标签',
    type: 'multiselect',
  },
  {
    key: 'start_date',
    label: '开始日期',
    type: 'date',
  },
  {
    key: 'due_date',
    label: '截止日期',
    type: 'date',
  },
  {
    key: 'created_at',
    label: '创建时间',
    type: 'datetime',
  },
  {
    key: 'updated_at',
    label: '更新时间',
    type: 'datetime',
  },
  {
    key: 'is_completed',
    label: '是否完成',
    type: 'boolean',
  },
  {
    key: 'is_overdue',
    label: '是否逾期',
    type: 'boolean',
  },
];

// 操作符定义
const OPERATOR_DEFINITIONS: OperatorDefinition[] = [
  // 文本操作符
  { key: 'equals', label: '等于', valueRequired: true, valueType: 'text', supportedFieldTypes: ['text', 'select', 'relation'] },
  { key: 'not_equals', label: '不等于', valueRequired: true, valueType: 'text', supportedFieldTypes: ['text', 'select', 'relation'] },
  { key: 'contains', label: '包含', valueRequired: true, valueType: 'text', supportedFieldTypes: ['text'] },
  { key: 'not_contains', label: '不包含', valueRequired: true, valueType: 'text', supportedFieldTypes: ['text'] },
  { key: 'starts_with', label: '开头是', valueRequired: true, valueType: 'text', supportedFieldTypes: ['text'] },
  { key: 'ends_with', label: '结尾是', valueRequired: true, valueType: 'text', supportedFieldTypes: ['text'] },
  { key: 'is_empty', label: '为空', valueRequired: false, supportedFieldTypes: ['text', 'date', 'datetime'] },
  { key: 'is_not_empty', label: '不为空', valueRequired: false, supportedFieldTypes: ['text', 'date', 'datetime'] },
  
  // 数值和日期操作符
  { key: 'greater_than', label: '大于', valueRequired: true, valueType: 'number', supportedFieldTypes: ['number', 'date', 'datetime'] },
  { key: 'greater_than_or_equal', label: '大于等于', valueRequired: true, valueType: 'number', supportedFieldTypes: ['number', 'date', 'datetime'] },
  { key: 'less_than', label: '小于', valueRequired: true, valueType: 'number', supportedFieldTypes: ['number', 'date', 'datetime'] },
  { key: 'less_than_or_equal', label: '小于等于', valueRequired: true, valueType: 'number', supportedFieldTypes: ['number', 'date', 'datetime'] },
  { key: 'between', label: '介于', valueRequired: true, valueType: 'number', supportedFieldTypes: ['number', 'date', 'datetime'] },
  { key: 'not_between', label: '不在范围', valueRequired: true, valueType: 'number', supportedFieldTypes: ['number', 'date', 'datetime'] },
  
  // 列表操作符
  { key: 'in', label: '属于', valueRequired: true, valueType: 'multiselect', supportedFieldTypes: ['select', 'multiselect'] },
  { key: 'not_in', label: '不属于', valueRequired: true, valueType: 'multiselect', supportedFieldTypes: ['select', 'multiselect'] },
  
  // 日期特殊操作符
  { key: 'is_today', label: '是今天', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_yesterday', label: '是昨天', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_tomorrow', label: '是明天', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_this_week', label: '是本周', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_last_week', label: '是上周', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_next_week', label: '是下周', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_this_month', label: '是本月', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_last_month', label: '是上月', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_next_month', label: '是下月', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'is_overdue', label: '已逾期', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  { key: 'has_no_date', label: '无日期', valueRequired: false, supportedFieldTypes: ['date', 'datetime'] },
  
  // 布尔操作符
  { key: 'is_true', label: '为真', valueRequired: false, supportedFieldTypes: ['boolean'] },
  { key: 'is_false', label: '为假', valueRequired: false, supportedFieldTypes: ['boolean'] },
];

const FilterBuilder: React.FC<FilterBuilderProps> = ({ filters, onChange }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addFilter = () => {
    const newFilter: ViewFilter = {
      id: `filter_${Date.now()}`,
      field: 'status',
      operator: 'equals',
      value: TaskStatus.TODO,
      logic: 'and',
    };
    onChange([...filters, newFilter]);
  };

  const updateFilter = (index: number, updatedFilter: ViewFilter) => {
    const newFilters = [...filters];
    newFilters[index] = updatedFilter;
    onChange(newFilters);
  };

  const removeFilter = (index: number) => {
    const newFilters = filters.filter((_, i) => i !== index);
    onChange(newFilters);
  };

  const getFieldDefinition = (fieldKey: string): FieldDefinition | undefined => {
    return FIELD_DEFINITIONS.find(field => field.key === fieldKey);
  };

  const getAvailableOperators = (fieldKey: string): OperatorDefinition[] => {
    const fieldDef = getFieldDefinition(fieldKey);
    if (!fieldDef) return [];
    
    return OPERATOR_DEFINITIONS.filter(op => 
      op.supportedFieldTypes.includes(fieldDef.type)
    );
  };

  const renderValueInput = (filter: ViewFilter, index: number) => {
    const fieldDef = getFieldDefinition(filter.field);
    const operatorDef = OPERATOR_DEFINITIONS.find(op => op.key === filter.operator);
    
    if (!operatorDef?.valueRequired) {
      return null;
    }

    const updateValue = (value: any, isSecondValue = false) => {
      const updatedFilter = { ...filter };
      if (isSecondValue) {
        updatedFilter.value2 = value;
      } else {
        updatedFilter.value = value;
      }
      updateFilter(index, updatedFilter);
    };

    // 根据字段类型和操作符类型渲染不同的输入组件
    if (fieldDef?.type === 'select' && fieldDef.options) {
      if (operatorDef.valueType === 'multiselect' || filter.operator === 'in' || filter.operator === 'not_in') {
        // 多选 - 使用下拉框样式
        return (
          <select
            multiple
            value={Array.isArray(filter.value) ? filter.value : []}
            onChange={(e) => {
              const values = Array.from(e.target.selectedOptions, option => 
                isNaN(Number(option.value)) ? option.value : Number(option.value)
              );
              updateValue(values);
            }}
            className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            size={Math.min(fieldDef.options.length, 3)}
          >
            {fieldDef.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      } else {
        // 单选
        return (
          <MobileSelect
            value={filter.value}
            onChange={(value) => {
              const convertedValue = isNaN(Number(value)) ? value : Number(value);
              updateValue(convertedValue);
            }}
            options={fieldDef.options.map(opt => ({
              value: opt.value,
              label: opt.label
            }))}
            className="text-xs py-1.5"
          />
        );
      }
    }

    if (fieldDef?.type === 'date' || fieldDef?.type === 'datetime') {
      const inputType = fieldDef.type === 'datetime' ? 'datetime-local' : 'date';
      
      if (filter.operator === 'between' || filter.operator === 'not_between') {
        return (
          <div className="flex gap-1">
            <input
              type={inputType}
              value={filter.value || ''}
              onChange={(e) => updateValue(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type={inputType}
              value={filter.value2 || ''}
              onChange={(e) => updateValue(e.target.value, true)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        );
      } else {
        return (
          <input
            type={inputType}
            value={filter.value || ''}
            onChange={(e) => updateValue(e.target.value)}
            className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );
      }
    }

    if (fieldDef?.type === 'number') {
      if (filter.operator === 'between' || filter.operator === 'not_between') {
        return (
          <div className="flex gap-1">
            <input
              type="number"
              value={filter.value || ''}
              onChange={(e) => updateValue(Number(e.target.value))}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <input
              type="number"
              value={filter.value2 || ''}
              onChange={(e) => updateValue(Number(e.target.value), true)}
              className="flex-1 px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        );
      } else {
        return (
          <input
            type="number"
            value={filter.value || ''}
            onChange={(e) => updateValue(Number(e.target.value))}
            className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        );
      }
    }

    // 默认文本输入
    return (
      <input
        type="text"
        value={filter.value || ''}
        onChange={(e) => updateValue(e.target.value)}
        className="w-full px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent"
        placeholder="输入值"
      />
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">筛选条件</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {showAdvanced ? '简单模式' : '高级模式'}
          </button>
          <button
            onClick={addFilter}
            className="flex items-center gap-1 text-primary text-xs font-medium hover:opacity-70"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>添加筛选</span>
          </button>
        </div>
      </div>

      {filters.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <span className="material-symbols-outlined text-[32px] mb-2 block opacity-50">filter_alt</span>
          <p className="text-sm mb-3">暂无筛选条件</p>
          <button
            onClick={addFilter}
            className="text-primary text-sm font-medium hover:opacity-70 inline-flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>添加第一个筛选条件</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => {
            const availableOperators = getAvailableOperators(filter.field);
            const operatorDef = OPERATOR_DEFINITIONS.find(op => op.key === filter.operator);
            
            return (
              <div key={filter.id || index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {/* 逻辑连接符 - 只在第一个筛选条件之后显示 */}
                {index > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-500 dark:text-gray-400">逻辑关系:</span>
                    <MobileSelect
                      value={filter.logic || 'and'}
                      onChange={(value) => updateFilter(index, { ...filter, logic: value as 'and' | 'or' })}
                      options={[
                        { value: 'and', label: '并且 (AND)' },
                        { value: 'or', label: '或者 (OR)' },
                      ]}
                      className="text-xs py-1"
                    />
                  </div>
                )}

                {/* 筛选条件主体 */}
                <div className="p-3">
                  <div className="flex items-start gap-2">
                    {/* 字段选择 */}
                    <div className="flex-shrink-0 w-24">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 px-1">字段</div>
                      <MobileSelect
                        value={filter.field}
                        onChange={(value) => {
                          const newField = value as string;
                          const newFieldDef = getFieldDefinition(newField);
                          const newAvailableOperators = getAvailableOperators(newField);
                          const newOperator = newAvailableOperators.length > 0 ? newAvailableOperators[0].key : 'equals';
                          const newOperatorDef = OPERATOR_DEFINITIONS.find(op => op.key === newOperator);
                          
                          // Set appropriate default value based on field type and operator
                          let defaultValue;
                          if (!newOperatorDef?.valueRequired) {
                            defaultValue = null;
                          } else if (newFieldDef?.type === 'select' && newFieldDef.options) {
                            defaultValue = newFieldDef.options[0].value;
                          } else {
                            defaultValue = '';
                          }
                          
                          updateFilter(index, {
                            ...filter,
                            field: newField,
                            operator: newOperator as any,
                            value: defaultValue,
                            value2: undefined,
                          });
                        }}
                        options={FIELD_DEFINITIONS.map(field => ({
                          value: field.key,
                          label: field.label
                        }))}
                        className="text-xs py-1.5"
                      />
                    </div>
                    
                    {/* 操作符选择 */}
                    <div className="flex-shrink-0 w-24">
                      <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 px-1">条件</div>
                      <MobileSelect
                        value={filter.operator}
                        onChange={(value) => {
                          const newOperator = value as string;
                          const newOperatorDef = OPERATOR_DEFINITIONS.find(op => op.key === newOperator);
                          
                          updateFilter(index, {
                            ...filter,
                            operator: newOperator as any,
                            value: newOperatorDef?.valueRequired ? filter.value : null,
                            value2: undefined,
                          });
                        }}
                        options={availableOperators.map(op => ({
                          value: op.key,
                          label: op.label
                        }))}
                        className="text-xs py-1.5"
                      />
                    </div>
                    
                    {/* 值输入 - 占据剩余空间 */}
                    {operatorDef?.valueRequired && (
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 px-1">值</div>
                        {renderValueInput(filter, index)}
                      </div>
                    )}
                    
                    {/* 删除按钮 */}
                    <div className={operatorDef?.valueRequired ? 'mt-5' : ''}>
                      <button
                        onClick={() => removeFilter(index)}
                        className="flex-shrink-0 text-red-500 hover:text-red-700 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 预设筛选模板 */}
      {filters.length === 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-3 px-1">快速筛选模板</h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const todayFilter: ViewFilter = {
                  id: `filter_${Date.now()}`,
                  field: 'due_date',
                  operator: 'is_today',
                  value: null,
                  logic: 'and',
                };
                onChange([todayFilter]);
              }}
              className="p-3 text-xs text-left bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-blue-600 dark:text-blue-400 text-[16px]">today</span>
                <span className="font-medium text-blue-900 dark:text-blue-100">今日到期</span>
              </div>
              <div className="text-blue-700 dark:text-blue-300 text-[10px]">截止日期是今天</div>
            </button>
            
            <button
              onClick={() => {
                const overdueFilter: ViewFilter = {
                  id: `filter_${Date.now()}`,
                  field: 'due_date',
                  operator: 'is_overdue',
                  value: null,
                  logic: 'and',
                };
                onChange([overdueFilter]);
              }}
              className="p-3 text-xs text-left bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-700 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-red-600 dark:text-red-400 text-[16px]">event_busy</span>
                <span className="font-medium text-red-900 dark:text-red-100">逾期任务</span>
              </div>
              <div className="text-red-700 dark:text-red-300 text-[10px]">已经过期的任务</div>
            </button>
            
            <button
              onClick={() => {
                const highPriorityFilter: ViewFilter = {
                  id: `filter_${Date.now()}`,
                  field: 'priority',
                  operator: 'in',
                  value: [TaskPriority.HIGH, TaskPriority.URGENT],
                  logic: 'and',
                };
                onChange([highPriorityFilter]);
              }}
              className="p-3 text-xs text-left bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-700 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-orange-600 dark:text-orange-400 text-[16px]">priority_high</span>
                <span className="font-medium text-orange-900 dark:text-orange-100">高优先级</span>
              </div>
              <div className="text-orange-700 dark:text-orange-300 text-[10px]">高优先级和紧急任务</div>
            </button>
            
            <button
              onClick={() => {
                const completedFilter: ViewFilter = {
                  id: `filter_${Date.now()}`,
                  field: 'status',
                  operator: 'equals',
                  value: TaskStatus.COMPLETED,
                  logic: 'and',
                };
                onChange([completedFilter]);
              }}
              className="p-3 text-xs text-left bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-xl hover:shadow-md transition-all"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-[16px]">check_circle</span>
                <span className="font-medium text-green-900 dark:text-green-100">已完成</span>
              </div>
              <div className="text-green-700 dark:text-green-300 text-[10px]">已完成的任务</div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;