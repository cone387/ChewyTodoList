import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useTags } from '../hooks/useTags';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { TaskStatus, TaskPriority } from '../types/index';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import BottomNav from '../components/BottomNav';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';

const TaskDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'activity'>('details');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPrioritySelector, setShowPrioritySelector] = useState(false);
  const [showStatusSelector, setShowStatusSelector] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'due' | 'start' | null>(null);
  
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  const { data: task, isLoading } = useTask(uid!);
  const { data: activityLogs, isLoading: isActivityLoading } = useActivityLogs({ task: uid });
  const { data: projectsResponse } = useProjects();
  const { data: tagsResponse } = useTags();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { confirmState, confirm, handleCancel } = useConfirm();

  const projects = projectsResponse?.results || [];
  const allTags = tagsResponse?.results || [];

  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
  });

  useEffect(() => {
    if (task) {
      setEditForm({
        title: task.title,
        content: task.content || '',
      });
    }
  }, [task]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isEditing && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [isEditing]);

  const handleToggleStatus = () => {
    if (!task) return;
    const newStatus = task.is_completed ? TaskStatus.TODO : TaskStatus.COMPLETED;
    updateTask.mutate({
      uid: task.uid,
      data: { status: newStatus }
    });
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setShowMoreMenu(false);
  };

  const handleSaveEdit = async () => {
    if (!task || !editForm.title.trim()) return;
    
    try {
      await updateTask.mutateAsync({
        uid: task.uid,
        data: {
          title: editForm.title.trim(),
          content: editForm.content.trim() || undefined,
        }
      });
      setIsEditing(false);
    } catch (error) {
      console.error('更新任务失败:', error);
    }
  };

  const handleCancelEdit = () => {
    if (task) {
      setEditForm({
        title: task.title,
        content: task.content || '',
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setShowMoreMenu(false);
    const confirmed = await confirm({
      title: '删除任务',
      message: '确定要删除这个任务吗？此操作无法撤销。',
      confirmText: '删除',
      cancelText: '取消',
      confirmColor: 'danger',
    });

    if (confirmed && task) {
      try {
        await deleteTask.mutateAsync(task.uid);
        navigate(-1);
      } catch (error) {
        console.error('删除任务失败:', error);
      }
    }
  };

  const handleUpdatePriority = async (priority: number) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        uid: task.uid,
        data: { priority }
      });
      setShowPrioritySelector(false);
    } catch (error) {
      console.error('更新优先级失败:', error);
    }
  };

  const handleUpdateStatus = async (status: number) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        uid: task.uid,
        data: { status }
      });
      setShowStatusSelector(false);
    } catch (error) {
      console.error('更新状态失败:', error);
    }
  };

  const handleUpdateProject = async (projectUid: string) => {
    if (!task) return;
    try {
      await updateTask.mutateAsync({
        uid: task.uid,
        data: { project_uid: projectUid }
      });
      setShowProjectSelector(false);
    } catch (error) {
      console.error('更新项目失败:', error);
    }
  };

  const handleToggleTag = async (tagUid: string) => {
    if (!task) return;
    const currentTagUids = task.tags.map(t => t.uid);
    const newTagUids = currentTagUids.includes(tagUid)
      ? currentTagUids.filter(uid => uid !== tagUid)
      : [...currentTagUids, tagUid];
    
    try {
      await updateTask.mutateAsync({
        uid: task.uid,
        data: { tag_uids: newTagUids }
      });
    } catch (error) {
      console.error('更新标签失败:', error);
    }
  };

  const handleUpdateDate = async (type: 'due' | 'start', dateValue: string) => {
    if (!task) return;
    try {
      const data: Record<string, string | null> = {};
      if (type === 'due') {
        data.due_date = dateValue ? new Date(dateValue).toISOString() : null;
      } else {
        data.start_date = dateValue ? new Date(dateValue).toISOString() : null;
      }
      await updateTask.mutateAsync({
        uid: task.uid,
        data
      });
      setShowDatePicker(null);
    } catch (error) {
      console.error('更新日期失败:', error);
    }
  };

  const handleClearDate = async (type: 'due' | 'start') => {
    if (!task) return;
    try {
      const data: Record<string, null> = {};
      if (type === 'due') {
        data.due_date = null;
      } else {
        data.start_date = null;
      }
      await updateTask.mutateAsync({
        uid: task.uid,
        data
      });
      setShowDatePicker(null);
    } catch (error) {
      console.error('清除日期失败:', error);
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = parseISO(dateString);
    return format(date, 'M月d日 HH:mm', { locale: zhCN });
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    const date = parseISO(dateString);
    return format(date, "yyyy-MM-dd'T'HH:mm");
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
        return { icon: 'add', iconBg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-500' };
      case 'updated':
        return { icon: 'edit', iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-500' };
      case 'status_changed':
        return { icon: 'swap_horiz', iconBg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-500' };
      case 'completed':
        return { icon: 'check_circle', iconBg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-500' };
      case 'deleted':
        return { icon: 'delete', iconBg: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-500' };
      default:
        return { icon: 'info', iconBg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-500' };
    }
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case TaskPriority.URGENT: return 'P0 紧急';
      case TaskPriority.HIGH: return 'P1 高';
      case TaskPriority.MEDIUM: return 'P2 中';
      case TaskPriority.LOW: return 'P3 低';
      default: return 'P3 低';
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

  const getStatusLabel = (status: number) => {
    switch (status) {
      case TaskStatus.UNASSIGNED: return '待分配';
      case TaskStatus.TODO: return '待办';
      case TaskStatus.COMPLETED: return '已完成';
      case TaskStatus.ABANDONED: return '已放弃';
      default: return '待办';
    }
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case TaskStatus.UNASSIGNED: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
      case TaskStatus.TODO: return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300';
      case TaskStatus.COMPLETED: return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      case TaskStatus.ABANDONED: return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden pb-16">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden pb-16">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="material-symbols-outlined text-[48px] text-gray-300">search_off</span>
          <p className="text-gray-500">任务不存在</p>
          <button
            onClick={() => navigate(-1)}
            className="text-primary text-sm font-medium"
          >
            返回
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden pb-16">
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
              {isEditing ? '编辑任务' : '任务详情'}
            </span>
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-1">
              <button 
                onClick={handleCancelEdit}
                className="text-gray-500 dark:text-gray-400 px-3 py-1.5 text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                取消
              </button>
              <button 
                onClick={handleSaveEdit}
                disabled={!editForm.title.trim() || updateTask.isPending}
                className="text-primary px-3 py-1.5 text-sm font-medium hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50"
              >
                {updateTask.isPending ? '保存中...' : '保存'}
              </button>
            </div>
          ) : (
            <div className="relative" ref={moreMenuRef}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="text-[#5f6368] dark:text-white flex items-center justify-center size-10 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">more_horiz</span>
              </button>
              
              {showMoreMenu && (
                <div className="absolute right-0 top-12 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <button
                    onClick={handleEdit}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    编辑任务
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                    删除任务
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-4 bg-white dark:bg-background-dark" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}>
        {/* Task Title */}
        <div className="px-5 pt-6 pb-2">
          <div className="flex items-start gap-3">
            <button 
              onClick={handleToggleStatus}
              disabled={isEditing}
              className={`mt-1 flex-shrink-0 transition-colors ${
                task.is_completed 
                  ? 'text-green-500' 
                  : 'text-gray-400 hover:text-primary'
              } ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`material-symbols-outlined text-[24px] ${task.is_completed ? 'fill-1' : ''}`}>
                {task.is_completed ? 'check_circle' : 'radio_button_unchecked'}
              </span>
            </button>
            
            {isEditing ? (
              <input
                ref={titleInputRef}
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="flex-1 text-xl font-bold bg-transparent border-none focus:ring-0 focus:outline-none text-[#111418] dark:text-white placeholder-gray-400"
                placeholder="任务标题"
              />
            ) : (
              <h1 className={`text-xl font-bold leading-tight ${
                task.is_completed 
                  ? 'text-gray-400 dark:text-gray-500 line-through' 
                  : 'text-[#111418] dark:text-white'
              }`}>
                {task.title}
              </h1>
            )}
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
            className={`relative py-3 text-sm font-medium transition-colors ${
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
              {/* Description */}
              <div className="px-5 py-4">
                {isEditing ? (
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    className="w-full text-sm bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-primary focus:border-transparent text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none"
                    placeholder="添加任务描述..."
                    rows={4}
                  />
                ) : (
                  task.content && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-4">
                      {task.content}
                    </p>
                  )
                )}
                
                {!isEditing && (
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-1.5"></span>
                      {task.project.name}
                    </span>
                    
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      <span className="material-symbols-outlined text-[14px] mr-1">flag</span>
                      {getPriorityLabel(task.priority)}
                    </span>

                    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>

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
                )}
              </div>

              <hr className="border-gray-100 dark:border-gray-800 mx-5"/>

              {/* Task Details */}
              <div className="px-5 py-4 space-y-1">
                {/* Status */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusSelector(!showStatusSelector)}
                    className="w-full flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[20px]">check_circle</span>
                      <span className="text-sm">状态</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getStatusColor(task.status)}`}>
                        {getStatusLabel(task.status)}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  </button>
                  
                  {showStatusSelector && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {[TaskStatus.TODO, TaskStatus.COMPLETED, TaskStatus.UNASSIGNED, TaskStatus.ABANDONED].map((status) => (
                        <button
                          key={status}
                          onClick={() => handleUpdateStatus(status)}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between ${
                            task.status === status ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{getStatusLabel(status)}</span>
                          {task.status === status && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Priority */}
                <div className="relative">
                  <button
                    onClick={() => setShowPrioritySelector(!showPrioritySelector)}
                    className="w-full flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[20px]">flag</span>
                      <span className="text-sm">优先级</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {getPriorityLabel(task.priority)}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  </button>
                  
                  {showPrioritySelector && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      {[TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW].map((priority) => (
                        <button
                          key={priority}
                          onClick={() => handleUpdatePriority(priority)}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between ${
                            task.priority === priority ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{getPriorityLabel(priority)}</span>
                          {task.priority === priority && (
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div className="relative">
                  <button
                    onClick={() => setShowDatePicker(showDatePicker === 'due' ? null : 'due')}
                    className="w-full flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[20px]">event</span>
                      <span className="text-sm">截止日期</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        task.is_overdue && !task.is_completed ? 'text-red-500' : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {task.due_date ? formatDueDate(task.due_date) : '未设置'}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  </button>
                  
                  {showDatePicker === 'due' && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
                      <input
                        type="datetime-local"
                        value={formatDateForInput(task.due_date)}
                        onChange={(e) => handleUpdateDate('due', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      {task.due_date && (
                        <button
                          onClick={() => handleClearDate('due')}
                          className="w-full mt-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          清除日期
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Start Date */}
                <div className="relative">
                  <button
                    onClick={() => setShowDatePicker(showDatePicker === 'start' ? null : 'start')}
                    className="w-full flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[20px]">schedule</span>
                      <span className="text-sm">开始日期</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {task.start_date ? formatDueDate(task.start_date) : '未设置'}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  </button>
                  
                  {showDatePicker === 'start' && (
                    <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
                      <input
                        type="datetime-local"
                        value={formatDateForInput(task.start_date)}
                        onChange={(e) => handleUpdateDate('start', e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                      {task.start_date && (
                        <button
                          onClick={() => handleClearDate('start')}
                          className="w-full mt-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          清除日期
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Project */}
                <div className="relative">
                  <button
                    onClick={() => setShowProjectSelector(!showProjectSelector)}
                    className="w-full flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[20px]">folder</span>
                      <span className="text-sm">所属项目</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {task.project.name}
                      </span>
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  </button>
                  
                  {showProjectSelector && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-60 overflow-y-auto">
                      {projects.map((project) => (
                        <button
                          key={project.uid}
                          onClick={() => handleUpdateProject(project.uid)}
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between ${
                            task.project.uid === project.uid ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span className="truncate">{project.name}</span>
                          {task.project.uid === project.uid && (
                            <span className="material-symbols-outlined text-[16px] flex-shrink-0">check</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="relative">
                  <button
                    onClick={() => setShowTagSelector(!showTagSelector)}
                    className="w-full flex items-center justify-between py-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 -mx-2 transition-colors"
                  >
                    <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                      <span className="material-symbols-outlined text-[20px]">label</span>
                      <span className="text-sm">标签</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.tags.length > 0 ? (
                        <div className="flex gap-1">
                          {task.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag.uid}
                              className="px-2 py-0.5 rounded text-xs font-medium"
                              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                            >
                              {tag.name}
                            </span>
                          ))}
                          {task.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">未设置</span>
                      )}
                      <span className="material-symbols-outlined text-[18px] text-gray-400">chevron_right</span>
                    </div>
                  </button>
                  
                  {showTagSelector && (
                    <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 max-h-60 overflow-y-auto">
                      {allTags.length > 0 ? (
                        allTags.map((tag) => {
                          const isSelected = task.tags.some(t => t.uid === tag.uid);
                          return (
                            <button
                              key={tag.uid}
                              onClick={() => handleToggleTag(tag.uid)}
                              className="w-full px-4 py-2.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center justify-between"
                            >
                              <span className="flex items-center gap-2">
                                <span
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: tag.color }}
                                />
                                <span className="text-gray-700 dark:text-gray-300">{tag.name}</span>
                              </span>
                              {isSelected && (
                                <span className="material-symbols-outlined text-[16px] text-primary">check</span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                          暂无标签
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Group */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">workspaces</span>
                    <span className="text-sm">分组</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {task.project.group.name}
                  </span>
                </div>

                {/* Created Time */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">schedule</span>
                    <span className="text-sm">创建时间</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {format(parseISO(task.created_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </span>
                </div>

                {/* Updated Time */}
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
                    <span className="material-symbols-outlined text-[20px]">update</span>
                    <span className="text-sm">更新时间</span>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {format(parseISO(task.updated_at), 'yyyy-MM-dd HH:mm', { locale: zhCN })}
                  </span>
                </div>
              </div>

              {/* Subtasks */}
              {task.subtasks_count > 0 && (
                <>
                  <hr className="border-gray-100 dark:border-gray-800 mx-5"/>
                  <div className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-bold text-[#111418] dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-gray-400">checklist</span>
                        子任务 ({task.completed_subtasks_count}/{task.subtasks_count})
                      </h3>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all"
                        style={{ width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%` }}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="px-5 py-6">
              {isActivityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : activityLogs && activityLogs.results.length > 0 ? (
                <div className="border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-6">
                  {activityLogs.results.map((activity) => {
                    const iconConfig = getActivityIcon(activity.action);
                    
                    return (
                      <div key={activity.id} className="relative pl-8">
                        <div className="absolute -left-[11px] top-0 bg-white dark:bg-background-dark py-1">
                          <div className={`${iconConfig.iconBg} rounded-full p-1.5 ${iconConfig.iconColor}`}>
                            <span className="material-symbols-outlined text-[14px] block">{iconConfig.icon}</span>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-[#111418] dark:text-white">
                            {activity.action === 'created' && '任务创建'}
                            {activity.action === 'updated' && '任务更新'}
                            {activity.action === 'status_changed' && '状态变更'}
                            {activity.action === 'completed' && '任务完成'}
                            {activity.action === 'deleted' && '任务删除'}
                          </p>
                          {activity.detail && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {activity.detail}
                            </p>
                          )}
                          <span className="text-xs text-gray-400 mt-1 block">
                            {formatActivityTime(activity.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <span className="material-symbols-outlined text-[48px] mb-2 opacity-50">history</span>
                  <p className="text-sm">暂无活动记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <BottomNav />
      
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

export default TaskDetailPage;
