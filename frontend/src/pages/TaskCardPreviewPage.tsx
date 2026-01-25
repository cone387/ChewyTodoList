import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import EnhancedTaskList from '../components/EnhancedTaskList';
import type { TaskCardTemplate } from '../types/taskCard';
import type { Task } from '../types/index';
import { TaskStatus, TaskPriority } from '../types/index';

const TaskCardPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // 从URL参数获取卡片模板数据
  const cardTemplate = useMemo(() => {
    const templateParam = searchParams.get('template');
    if (templateParam) {
      try {
        return JSON.parse(decodeURIComponent(templateParam)) as TaskCardTemplate;
      } catch (error) {
        console.error('解析卡片模板失败:', error);
        return null;
      }
    }
    return null;
  }, [searchParams]);

  // 生成预览用的示例任务数据
  const previewTasks: Task[] = useMemo(() => {
    const mockGroup: any = {
      uid: 'g1',
      name: '默认分组',
      sort_order: 0,
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      projects_count: 1,
    };

    const createMockProject = (uid: string, name: string): any => ({
      uid,
      name,
      group: mockGroup,
      view_type: 'list' as const,
      style: {},
      settings: {},
      sort_order: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tasks_count: 0,
      completed_tasks_count: 0,
    });

    return [
      {
        uid: 'preview-1',
        title: '完成项目文档',
        content: '编写项目的技术文档和用户手册，包括架构设计、API文档和使用说明',
        status: TaskStatus.TODO,
        status_display: '待办',
        priority: TaskPriority.HIGH,
        priority_display: '高优先级',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        is_completed: false,
        is_all_day: false,
        time_zone: 'Asia/Shanghai',
        sort_order: 0,
        attachments: [],
        is_overdue: false,
        project: createMockProject('p1', '产品开发'),
        tags: [
          { uid: 't1', name: '文档', color: '#3B82F6', sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { uid: 't2', name: '重要', color: '#EF4444', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        subtasks_count: 5,
        completed_subtasks_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        uid: 'preview-2',
        title: '修复登录页面bug',
        content: '用户反馈登录页面在移动端显示异常，需要修复响应式布局问题',
        status: TaskStatus.TODO,
        status_display: '进行中',
        priority: TaskPriority.URGENT,
        priority_display: '紧急',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        is_completed: false,
        is_all_day: false,
        time_zone: 'Asia/Shanghai',
        sort_order: 1,
        attachments: [],
        is_overdue: true,
        project: createMockProject('p2', 'Bug修复'),
        tags: [
          { uid: 't3', name: 'Bug', color: '#EF4444', sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { uid: 't4', name: '前端', color: '#8B5CF6', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        subtasks_count: 3,
        completed_subtasks_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        uid: 'preview-3',
        title: '设计新功能原型',
        content: '为即将上线的新功能设计交互原型和视觉稿',
        status: TaskStatus.TODO,
        status_display: '待办',
        priority: TaskPriority.MEDIUM,
        priority_display: '中优先级',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        is_completed: false,
        is_all_day: false,
        time_zone: 'Asia/Shanghai',
        sort_order: 2,
        attachments: [],
        is_overdue: false,
        project: createMockProject('p3', '设计'),
        tags: [
          { uid: 't5', name: '设计', color: '#EC4899', sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          { uid: 't6', name: '原型', color: '#F59E0B', sort_order: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        subtasks_count: 0,
        completed_subtasks_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        uid: 'preview-4',
        title: '团队周会准备',
        content: '',
        status: TaskStatus.COMPLETED,
        status_display: '已完成',
        priority: TaskPriority.LOW,
        priority_display: '低优先级',
        due_date: new Date(Date.now()).toISOString(),
        is_completed: true,
        is_all_day: false,
        time_zone: 'Asia/Shanghai',
        sort_order: 3,
        attachments: [],
        is_overdue: false,
        project: createMockProject('p4', '团队管理'),
        tags: [
          { uid: 't7', name: '会议', color: '#10B981', sort_order: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        ],
        subtasks_count: 4,
        completed_subtasks_count: 4,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ] as Task[];
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  if (!cardTemplate) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-white dark:bg-background-dark">
        <span className="material-symbols-outlined text-[48px] text-gray-400 mb-4">error</span>
        <p className="text-gray-600 dark:text-gray-400 mb-4">无法加载卡片模板</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-80 transition-opacity"
        >
          返回
        </button>
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
          
          <div className="flex items-center gap-2">
            <span className={`material-symbols-outlined text-[20px]`}>
              {cardTemplate.icon}
            </span>
            <span className="text-base font-semibold">{cardTemplate.name}</span>
          </div>
          
          <div className="size-10" />
        </div>

        {/* 模板信息 */}
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {cardTemplate.description}
          </p>
          
          {/* 样式特性标签 */}
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full">
              {cardTemplate.style.layout === 'compact' ? '紧凑布局' :
               cardTemplate.style.layout === 'comfortable' ? '舒适布局' : '宽松布局'}
            </span>
            {cardTemplate.style.showDescription && (
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full">
                显示描述
              </span>
            )}
            {cardTemplate.style.priorityIndicator !== 'none' && (
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-xs rounded-full">
                优先级指示
              </span>
            )}
            {cardTemplate.style.showSubtasks && (
              <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full">
                子任务进度
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto pb-20 bg-gray-50 dark:bg-background-dark" 
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 160px)' }}
      >
        <div className="p-4">
          <div className="mb-4">
            <h2 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              预览效果
            </h2>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              以下是使用此卡片样式的任务示例
            </p>
          </div>

          <EnhancedTaskList
            tasks={previewTasks}
            cardStyle={cardTemplate}
            showCompleted={true}
            onTaskClick={() => {}}
            onTaskUpdate={() => {}}
          />
        </div>
      </main>

      {/* Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 pb-safe max-w-md mx-auto">
        <div className="p-4 flex gap-3">
          <button
            onClick={handleBack}
            className="flex-1 py-3 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            返回
          </button>
          <button
            onClick={() => {
              // TODO: 实现应用卡片样式的功能
              alert('应用卡片样式功能即将推出');
            }}
            className="flex-1 py-3 px-4 text-sm font-medium text-white bg-primary rounded-lg hover:opacity-80 transition-opacity"
          >
            使用此样式
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCardPreviewPage;
