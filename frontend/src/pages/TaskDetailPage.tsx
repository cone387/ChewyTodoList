import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask, useUpdateTask } from '../hooks/useTasks';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { TaskStatus, TaskPriority } from '../types/index';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BottomNav from '../components/BottomNav';

const TaskDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [comment, setComment] = useState('');

  const { data: task, isLoading } = useTask(uid!);
  const { data: activityLogs, isLoading: isActivityLoading } = useActivityLogs({ task: uid });
  const updateTask = useUpdateTask();

  const handleToggleStatus = () => {
    if (!task) return;
    const newStatus = task.is_completed ? TaskStatus.TODO : TaskStatus.COMPLETED;
    updateTask.mutate({
      uid: task.uid,
      data: { status: newStatus }
    });
  };

  const handleBack = () => {
    navigate('/');
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return format(date, 'M月d日, HH:mm', { locale: zhCN });
  };

  const formatActivityTime = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    if (isToday(date)) {
      return `今天 ${format(date, 'HH:mm')}`;
    }
    if (isYesterday(date)) {
      return `昨天 ${format(date, 'HH:mm')}`;
    }
    
    return format(date, 'M月d日 HH:mm', { locale: zhCN });
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'created':
        return {
          icon: 'add',
          iconBg: 'bg-gray-100 dark:bg-gray-800',
          iconColor: 'text-gray-500'
        };
      case 'updated':
        return {
          icon: 'edit',
          iconBg: 'bg-blue-50 dark:bg-blue-900/20',
          iconColor: 'text-blue-500'
        };
      case 'status_changed':
        return {
          icon: 'swap_horiz',
          iconBg: 'bg-purple-50 dark:bg-purple-900/20',
          iconColor: 'text-purple-500'
        };
      case 'completed':
        return {
          icon: 'check_circle',
          iconBg: 'bg-green-50 dark:bg-green-900/20',
          iconColor: 'text-green-500'
        };
      case 'deleted':
        return {
          icon: 'delete',
          iconBg: 'bg-red-50 dark:bg-red-900/20',
          iconColor: 'text-red-500'
        };
      default:
        return {
          icon: 'info',
          iconBg: 'bg-gray-100 dark:bg-gray-800',
          iconColor: 'text-gray-500'
        };
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'P0 紧急';
      case TaskPriority.HIGH: return 'P1 高优先级';
      case TaskPriority.MEDIUM: return 'P2 中优先级';
      case TaskPriority.LOW: return 'P3 低优先级';
      default: return 'P3 低优先级';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case TaskPriority.HIGH: return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300';
      case TaskPriority.MEDIUM: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case TaskPriority.LOW: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden pb-16">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden pb-16">
        <div className="flex items-center justify-center py-8">
          <p className="text-gray-500">任务不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden pb-16">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-3 justify-between">
          <button 
            onClick={handleBack}
            className="text-[#5f6368] dark:text-white flex items-center justify-center size-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold">任务详情</span>
          </div>
          
          <button className="text-[#5f6368] dark:text-white flex items-center justify-center size-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[24px]">more_horiz</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 bg-white dark:bg-background-dark">
        {/* Task Title */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-start gap-3">
            <button 
              onClick={handleToggleStatus}
              className={`mt-1 flex-shrink-0 transition-colors ${
                task.is_completed 
                  ? 'text-green-500' 
                  : 'text-gray-400 hover:text-primary'
              }`}
            >
              <span className={`material-symbols-outlined text-[24px] ${task.is_completed ? 'fill-1' : ''}`}>
                {task.is_completed ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </button>
            <h1 className={`text-xl font-bold leading-tight ${
              task.is_completed 
                ? 'text-gray-400 dark:text-gray-500 line-through' 
                : 'text-[#111418] dark:text-white'
            }`}>
              {task.title}
            </h1>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-5 flex items-center gap-6 border-b border-gray-100 dark:border-gray-800">
          <button 
            onClick={() => setActiveTab('details')}
            className={`relative py-3 text-sm font-medium transition-colors ${
              activeTab === 'details'
                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary'
                : 'text-gray-500 hover:text-[#111418] dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            详情
          </button>
          <button 
            onClick={() => setActiveTab('activity')}
            className={`relative py-3 text-sm font-semibold transition-colors ${
              activeTab === 'activity'
                ? 'text-primary after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-primary'
                : 'text-gray-500 hover:text-[#111418] dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            动态
          </button>
        </div>

        {/* Tab Content */}
        <div className="block">
          {activeTab === 'details' ? (
            <>
              {/* Description and Tags */}
              <div className="px-5 py-4">
                {task.content && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
                    {task.content}
                  </p>
                )}
                
                <div className="flex flex-wrap gap-2">
                  {/* Project Tag */}
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
                    {task.project.name}
                  </span>
                  
                  {/* Priority Tag */}
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}>
                    <span className="material-symbols-outlined text-[14px] mr-1">flag</span>
                    {getPriorityLabel(task.priority)}
                  </span>

                  {/* Custom Tags */}
                  {task.tags.map((tag) => (
                    <span 
                      key={tag.uid}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        backgroundColor: `${tag.color}20`,
                        color: tag.color,
                      }}
                    >
                      #{tag.name}
                    </span>
                  ))}
                </div>
              </div>

              <hr className="border-gray-100 dark:border-gray-800 mx-5"/>

              {/* Task Details */}
              <div className="px-5 py-4 grid grid-cols-1 gap-4">
                {/* Due Date */}
                {task.due_date && (
                  <div className="flex items-center justify-between group">
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 w-1/3">
                      <span className="material-symbols-outlined text-[20px]">calendar_today</span>
                      <span className="text-sm">截止日期</span>
                    </div>
                    <div className="flex items-center gap-2 flex-1 justify-end">
                      <div className={`flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        task.is_overdue && !task.is_completed ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        <span className="text-sm font-medium">
                          {formatDueDate(task.due_date)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Project */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 w-1/3">
                    <span className="material-symbols-outlined text-[20px]">folder_open</span>
                    <span className="text-sm">所属项目</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-[#111418] dark:text-white">
                        {task.project.name}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Group */}
                <div className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 w-1/3">
                    <span className="material-symbols-outlined text-[20px]">workspaces</span>
                    <span className="text-sm">分组</span>
                  </div>
                  <div className="flex items-center gap-2 flex-1 justify-end">
                    <div className="flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">
                      <span className="text-sm font-medium text-[#111418] dark:text-white">
                        {task.project.group.name}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-800/10 dark:border-white/10 h-2 bg-surface-light dark:bg-black/20"/>

              {/* Subtasks */}
              {task.subtasks_count > 0 && (
                <>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-gray-400">checklist</span>
                        子任务 ({task.completed_subtasks_count}/{task.subtasks_count})
                      </h3>
                      <button className="text-primary text-xs font-medium">+ 添加</button>
                    </div>
                    <div className="space-y-1">
                      {/* 这里可以添加子任务列表 */}
                      <div className="text-sm text-gray-500 text-center py-4">
                        暂无子任务
                      </div>
                    </div>
                  </div>
                  <hr className="border-gray-100 dark:border-gray-800 mx-5"/>
                </>
              )}

              {/* Attachments */}
              {task.attachments && task.attachments.length > 0 && (
                <div className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-gray-400">attachment</span>
                      附件
                    </h3>
                    <button className="text-primary text-xs font-medium">上传</button>
                  </div>
                  <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {task.attachments.map((_, index) => (
                      <div key={index} className="flex-shrink-0 w-32 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 p-2">
                        <div className="aspect-video bg-gray-200 dark:bg-gray-700 rounded mb-2 flex items-center justify-center overflow-hidden">
                          <span className="material-symbols-outlined text-gray-400 text-[32px]">attachment</span>
                        </div>
                        <p className="text-xs font-medium truncate text-[#111418] dark:text-white">
                          附件 {index + 1}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            // Activity Tab
            <div className="px-5 py-6">
              {isActivityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : activityLogs && activityLogs.results.length > 0 ? (
                <div className="border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-8">
                  {activityLogs.results.map((activity) => {
                    const iconConfig = getActivityIcon(activity.action);
                    
                    return (
                      <div key={activity.id} className="relative pl-8 group">
                        <div className="absolute -left-[11px] top-0 bg-white dark:bg-background-dark py-1">
                          <div className={`${iconConfig.iconBg} rounded-full p-1 ${iconConfig.iconColor}`}>
                            <span className="material-symbols-outlined text-[16px] block">{iconConfig.icon}</span>
                          </div>
                        </div>
                        
                        <div>
                          {activity.action === 'created' && (
                            <>
                              <p className="text-sm text-[#111418] dark:text-white">任务创建</p>
                              <span className="text-xs text-gray-400 mt-1.5 block">
                                {formatActivityTime(activity.created_at)}
                              </span>
                            </>
                          )}
                          
                          {activity.action === 'updated' && (
                            <>
                              <p className="text-sm text-[#111418] dark:text-white">任务更新</p>
                              {activity.detail && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  {activity.detail}
                                </p>
                              )}
                              <span className="text-xs text-gray-400 mt-1.5 block">
                                {formatActivityTime(activity.created_at)}
                              </span>
                            </>
                          )}
                          
                          {activity.action === 'status_changed' && (
                            <>
                              <p className="text-sm text-[#111418] dark:text-white leading-snug">
                                状态变更为 
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 ml-1">
                                  {task.status_display}
                                </span>
                              </p>
                              <span className="text-xs text-gray-400 mt-1.5 block">
                                {formatActivityTime(activity.created_at)}
                              </span>
                            </>
                          )}
                          
                          {activity.action === 'completed' && (
                            <>
                              <p className="text-sm text-[#111418] dark:text-white leading-snug">
                                任务已完成
                              </p>
                              <span className="text-xs text-gray-400 mt-1.5 block">
                                {formatActivityTime(activity.created_at)}
                              </span>
                            </>
                          )}
                          
                          {activity.action === 'deleted' && (
                            <>
                              <p className="text-sm text-[#111418] dark:text-white leading-snug">
                                任务已删除
                              </p>
                              <span className="text-xs text-gray-400 mt-1.5 block">
                                {formatActivityTime(activity.created_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 text-center py-8">
                  暂无活动记录
                </div>
              )}
              <div className="h-8"></div>
            </div>
          )}
        </div>

        <div className="h-4"></div>
      </main>

      {/* Bottom Comment Bar */}
      <div className="bg-white dark:bg-surface-dark border-t border-[#e5e7eb] dark:border-[#2a3441] p-3 pb-safe absolute bottom-0 w-full z-20">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center px-4 py-2">
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm w-full p-0 text-[#111418] dark:text-white placeholder-gray-400 focus:outline-none"
              placeholder="添加评论..."
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>
          <button 
            className="size-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:shadow-xl transition-shadow"
            onClick={() => {
              // TODO: 实现评论功能
              console.log('Comment:', comment);
              setComment('');
            }}
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TaskDetailPage;