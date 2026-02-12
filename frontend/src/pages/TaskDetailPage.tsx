import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTask, useUpdateTask, useDeleteTask } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useTags, useCreateTag } from '../hooks/useTags';
import { useActivityLogs } from '../hooks/useActivityLogs';
import { TaskStatus, TaskPriority } from '../types/index';
import { format, parseISO, isToday, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmDialog from '../components/ConfirmDialog';
import BottomSheet from '../components/BottomSheet';
import { attachmentApi } from '../services/api';

const TaskDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showActivitySheet, setShowActivitySheet] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: task, isLoading } = useTask(uid!);
  const { data: activityLogs, isLoading: isActivityLoading } = useActivityLogs({ task: uid });
  const { data: projectsResponse } = useProjects();
  const { data: tagsResponse } = useTags();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const createTag = useCreateTag();
  const { confirmState, confirm, handleCancel } = useConfirm();

  const projects = projectsResponse?.results || [];
  const allTags = tagsResponse?.results || [];

  const [editForm, setEditForm] = useState({ title: '', content: '' });

  useEffect(() => {
    if (task) {
      setEditForm({ title: task.title, content: task.content || '' });
    }
  }, [task]);

  // 点击空白区域关闭更多菜单（不包括 BottomSheet，它有自己的关闭逻辑）
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-dropdown]')) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 自动保存（防抖）
  const autoSave = (newTitle: string, newContent: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      if (task && newTitle.trim()) {
        updateTask.mutate({
          uid: task.uid,
          data: { title: newTitle.trim(), content: newContent.trim() || undefined }
        });
      }
    }, 1000);
  };

  const handleTitleChange = (value: string) => {
    setEditForm(prev => ({ ...prev, title: value }));
    autoSave(value, editForm.content);
  };

  const handleContentChange = (value: string) => {
    setEditForm(prev => ({ ...prev, content: value }));
    autoSave(editForm.title, value);
  };

  const handleToggleStatus = () => {
    if (!task) return;
    const newStatus = task.is_completed ? TaskStatus.TODO : TaskStatus.COMPLETED;
    updateTask.mutate({ uid: task.uid, data: { status: newStatus } });
  };

  const handleBack = () => {
    // 离开前保存
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (task && editForm.title.trim()) {
      updateTask.mutate({
        uid: task.uid,
        data: { title: editForm.title.trim(), content: editForm.content.trim() || undefined }
      });
    }
    navigate(-1);
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

  const handleUpdatePriority = (priority: number) => {
    if (!task) return;
    updateTask.mutate({ uid: task.uid, data: { priority } });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim() || !task) return;
    try {
      const result = await createTag.mutateAsync({ name: newTagName.trim() });
      const newTag = result.data.data;
      // 创建后自动添加到任务
      const currentTagUids = task.tags.map(t => t.uid);
      updateTask.mutate({ uid: task.uid, data: { tag_uids: [...currentTagUids, newTag.uid] } });
      setNewTagName('');
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  const handleUpdateStatus = (status: number) => {
    if (!task) return;
    updateTask.mutate({ uid: task.uid, data: { status } });
  };

  const handleUpdateProject = async (projectUid: string) => {
    if (!task) return;
    updateTask.mutate({ uid: task.uid, data: { project_uid: projectUid } });
    setShowProjectSelector(false);
  };

  const handleToggleTag = (tagUid: string) => {
    if (!task) return;
    const currentTagUids = task.tags.map(t => t.uid);
    const newTagUids = currentTagUids.includes(tagUid)
      ? currentTagUids.filter(id => id !== tagUid)
      : [...currentTagUids, tagUid];
    updateTask.mutate({ uid: task.uid, data: { tag_uids: newTagUids } });
  };

  const handleUpdateDate = (type: 'due' | 'start', dateValue: string) => {
    if (!task) return;
    const data: Record<string, string | null> = {};
    data[type === 'due' ? 'due_date' : 'start_date'] = dateValue ? new Date(dateValue).toISOString() : null;
    updateTask.mutate({ uid: task.uid, data });
  };

  const handleClearDate = (type: 'due' | 'start') => {
    if (!task) return;
    const data: Record<string, null> = {};
    data[type === 'due' ? 'due_date' : 'start_date'] = null;
    updateTask.mutate({ uid: task.uid, data });
  };


  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return format(parseISO(dateString), "yyyy-MM-dd'T'HH:mm");
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '未设置';
    return format(parseISO(dateString), 'M月d日 HH:mm', { locale: zhCN });
  };

  // 快捷时间选项
  const getQuickDateOptions = (type: 'due' | 'start') => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    if (type === 'due') {
      return [
        { label: '今天 18:00', value: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 18, 0).toISOString(), icon: 'today' },
        { label: '明天 18:00', value: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 18, 0).toISOString(), icon: 'event' },
        { label: '下周', value: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 18, 0).toISOString(), icon: 'date_range' },
        { label: '下个月', value: new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate(), 18, 0).toISOString(), icon: 'calendar_month' },
      ];
    } else {
      return [
        { label: '现在', value: now.toISOString(), icon: 'schedule' },
        { label: '今天 09:00', value: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString(), icon: 'today' },
        { label: '明天 09:00', value: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 9, 0).toISOString(), icon: 'event' },
        { label: '下周', value: new Date(nextWeek.getFullYear(), nextWeek.getMonth(), nextWeek.getDate(), 9, 0).toISOString(), icon: 'date_range' },
      ];
    }
  };

  const handleQuickDate = (type: 'due' | 'start', isoValue: string) => {
    if (!task) return;
    const data: Record<string, string> = {};
    data[type === 'due' ? 'due_date' : 'start_date'] = isoValue;
    updateTask.mutate({ uid: task.uid, data });
  };

  // 处理文件上传
  const handleFileUpload = async (file: File, isImage: boolean) => {
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const response = await attachmentApi.upload(file, true);
      const attachment = response.data;
      
      // 根据文件类型插入不同的Markdown格式
      let insertText = '';
      if (isImage) {
        insertText = `\n![${attachment.original_name}](${attachment.preview_url})\n`;
      } else {
        insertText = `\n[${attachment.original_name}](${attachment.preview_url})\n`;
      }
      
      setEditForm(prev => ({ ...prev, content: prev.content + insertText }));
      autoSave(editForm.title, editForm.content + insertText);
      contentInputRef.current?.focus();
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败，请重试');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, true);
    }
    // 清空input以便再次选择相同文件
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file, false);
    }
    e.target.value = '';
  };

  // 格式化时间显示
  const getTimeDisplayText = () => {
    if (!task) return '未设置';
    if (!task.start_date && !task.due_date) return '未设置';
    const parts: string[] = [];
    if (task.start_date) {
      parts.push(`开始: ${formatDisplayDate(task.start_date)}`);
    }
    if (task.due_date) {
      parts.push(`截止: ${formatDisplayDate(task.due_date)}`);
    }
    return parts.join(' → ');
  };

  const formatActivityTime = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (isToday(date)) return `今天 ${format(date, 'HH:mm')}`;
    if (isYesterday(date)) return `昨天 ${format(date, 'HH:mm')}`;
    return format(date, 'M月d日 HH:mm', { locale: zhCN });
  };

  const getActivityIcon = (action: string) => {
    const icons: Record<string, { icon: string; iconBg: string; iconColor: string }> = {
      created: { icon: 'add', iconBg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-500' },
      updated: { icon: 'edit', iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-500' },
      status_changed: { icon: 'swap_horiz', iconBg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-500' },
      completed: { icon: 'check_circle', iconBg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-500' },
      deleted: { icon: 'delete', iconBg: 'bg-red-50 dark:bg-red-900/20', iconColor: 'text-red-500' },
    };
    return icons[action] || { icon: 'info', iconBg: 'bg-gray-100 dark:bg-gray-800', iconColor: 'text-gray-500' };
  };

  const getPriorityLabel = (priority: number) => {
    const labels: Record<number, string> = { [TaskPriority.URGENT]: 'P0', [TaskPriority.HIGH]: 'P1', [TaskPriority.MEDIUM]: 'P2', [TaskPriority.LOW]: 'P3' };
    return labels[priority] || 'P3';
  };

  const getPriorityColor = (priority: number) => {
    const colors: Record<number, string> = {
      [TaskPriority.URGENT]: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      [TaskPriority.HIGH]: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      [TaskPriority.MEDIUM]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
      [TaskPriority.LOW]: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300',
    };
    return colors[priority] || 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <span className="material-symbols-outlined text-[48px] text-gray-300">search_off</span>
          <p className="text-gray-500">任务不存在</p>
          <button onClick={() => navigate(-1)} className="text-primary text-sm font-medium">返回</button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-screen w-full flex-col max-w-md mx-auto bg-gray-50 dark:bg-background-dark shadow-xl overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-2 justify-between">
          <button onClick={handleBack} className="text-[#5f6368] dark:text-white flex items-center justify-center size-9 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[22px]">arrow_back</span>
          </button>
          
          {/* 项目选择器 */}
          <div className="flex-1 flex justify-center mx-2">
            <button 
              onClick={() => setShowProjectSelector(true)} 
              className="px-3 py-1.5 rounded-full text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">folder</span>
              <span className="truncate max-w-[120px]">{task.project?.name || '收集箱'}</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* 动态按钮 */}
            <button 
              onClick={() => setShowActivitySheet(true)}
              className="text-[#5f6368] dark:text-white flex items-center justify-center size-9 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
            >
              <span className="material-symbols-outlined text-[22px]">history</span>
            </button>
            
            {/* 更多菜单 */}
            <div className="relative" ref={moreMenuRef} data-dropdown>
              <button onClick={() => setShowMoreMenu(!showMoreMenu)} className="text-[#5f6368] dark:text-white flex items-center justify-center size-9 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                <span className="material-symbols-outlined text-[22px]">more_horiz</span>
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-10 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                  {task.status !== TaskStatus.COMPLETED && (
                    <button onClick={() => { handleUpdateStatus(TaskStatus.COMPLETED); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>标记完成
                    </button>
                  )}
                  {task.status === TaskStatus.COMPLETED && (
                    <button onClick={() => { handleUpdateStatus(TaskStatus.TODO); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">radio_button_unchecked</span>取消完成
                    </button>
                  )}
                  {task.status !== TaskStatus.ABANDONED && (
                    <button onClick={() => { handleUpdateStatus(TaskStatus.ABANDONED); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">block</span>放弃任务
                    </button>
                  )}
                  {task.status === TaskStatus.ABANDONED && (
                    <button onClick={() => { handleUpdateStatus(TaskStatus.TODO); setShowMoreMenu(false); }} className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">undo</span>恢复任务
                    </button>
                  )}
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button onClick={handleDelete} className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">delete</span>删除任务
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-3 gap-3">
        {/* 标题卡片 */}
        <div className="flex-shrink-0 bg-white dark:bg-surface-dark rounded-2xl shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              <button onClick={handleToggleStatus} className={`flex-shrink-0 transition-all h-7 flex items-center ${task.is_completed ? 'text-green-500' : 'text-gray-300 hover:text-primary'}`}>
                <span className={`material-symbols-outlined text-[26px] ${task.is_completed ? 'fill-1' : ''}`}>
                  {task.is_completed ? 'check_circle' : 'radio_button_unchecked'}
                </span>
              </button>
              <textarea
                ref={titleInputRef}
                value={editForm.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                className={`flex-1 text-lg font-semibold bg-transparent border-none focus:ring-0 focus:outline-none resize-none placeholder-gray-300 leading-7 ${task.is_completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-white'}`}
                placeholder="任务标题"
                rows={1}
                style={{ minHeight: '28px' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            </div>
          </div>
        </div>

        {/* 属性卡片 */}
        <div className="flex-shrink-0 bg-white dark:bg-surface-dark rounded-2xl shadow-sm overflow-hidden">
          {/* 优先级 */}
          <div className="flex items-center px-4 py-3">
            <div className="flex items-center gap-2 w-20 flex-shrink-0">
              <span className="material-symbols-outlined text-[18px] text-gray-400">flag</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">优先级</span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              {[TaskPriority.URGENT, TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW].map((priority) => (
                <button 
                  key={priority} 
                  onClick={() => handleUpdatePriority(priority)} 
                  className={`w-10 h-8 rounded-lg text-xs font-bold transition-all ${
                    task.priority === priority 
                      ? getPriorityColor(priority) + ' shadow-sm scale-105'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {getPriorityLabel(priority)}
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

          {/* 时间 */}
          <button 
            onClick={() => setShowDateSheet(true)}
            className="flex items-center px-4 py-3 w-full hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div className="flex items-center gap-2 w-20 flex-shrink-0">
              <span className="material-symbols-outlined text-[18px] text-gray-400">schedule</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">时间</span>
            </div>
            <div className={`flex-1 text-sm text-right ${
              task.is_overdue && !task.is_completed 
                ? 'text-red-500 font-medium' 
                : (task.start_date || task.due_date) ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'
            }`}>
              {getTimeDisplayText()}
              {task.is_overdue && !task.is_completed && <span className="ml-1 text-xs bg-red-100 dark:bg-red-900/30 px-1.5 py-0.5 rounded">(已逾期)</span>}
            </div>
            <span className="material-symbols-outlined text-[18px] text-gray-300 ml-2">chevron_right</span>
          </button>

          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-4" />

          {/* 标签 */}
          <div className="flex items-start px-4 py-3">
            <div className="flex items-center gap-2 w-20 flex-shrink-0 pt-0.5">
              <span className="material-symbols-outlined text-[18px] text-gray-400">label</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">标签</span>
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-2 justify-end">
              {task.tags.map((tag) => (
                <span 
                  key={tag.uid} 
                  className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium shadow-sm" 
                  style={{ backgroundColor: `${tag.color}15`, color: tag.color, border: `1px solid ${tag.color}30` }}
                >
                  {tag.name}
                  <button 
                    onClick={() => handleToggleTag(tag.uid)}
                    className="size-4 flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[12px]">close</span>
                  </button>
                </span>
              ))}
              <button 
                onClick={() => setShowTagSelector(true)}
                className="size-7 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-600 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
            </div>
          </div>
        </div>

        {/* 描述卡片 */}
        <div className="flex-1 bg-white dark:bg-surface-dark rounded-2xl shadow-sm flex flex-col min-h-[120px]">
          <div className="flex-1 px-4 py-4">
            <textarea
              ref={contentInputRef}
              value={editForm.content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="w-full h-full text-base bg-transparent border-none focus:ring-0 focus:outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400 resize-none leading-relaxed"
              placeholder="添加任务内容..."
            />
          </div>
          {/* 内容编辑工具栏 */}
          <div className="flex-shrink-0 px-3 py-2 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1">
              <button 
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="清单"
                onClick={() => {
                  const checkbox = '\n- [ ] ';
                  setEditForm(prev => ({ ...prev, content: prev.content + checkbox }));
                  contentInputRef.current?.focus();
                }}
              >
                <span className="material-symbols-outlined text-[20px]">checklist</span>
              </button>
              <button 
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="无序列表"
                onClick={() => {
                  const bullet = '\n• ';
                  setEditForm(prev => ({ ...prev, content: prev.content + bullet }));
                  contentInputRef.current?.focus();
                }}
              >
                <span className="material-symbols-outlined text-[20px]">format_list_bulleted</span>
              </button>
              <button 
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="有序列表"
                onClick={() => {
                  const number = '\n1. ';
                  setEditForm(prev => ({ ...prev, content: prev.content + number }));
                  contentInputRef.current?.focus();
                }}
              >
                <span className="material-symbols-outlined text-[20px]">format_list_numbered</span>
              </button>
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1" />
              <button 
                className={`p-2 rounded-lg transition-colors ${uploadingFile ? 'text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="插入图片"
                onClick={() => imageInputRef.current?.click()}
                disabled={uploadingFile}
              >
                <span className="material-symbols-outlined text-[20px]">{uploadingFile ? 'hourglass_empty' : 'image'}</span>
              </button>
              <button 
                className={`p-2 rounded-lg transition-colors ${uploadingFile ? 'text-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                title="上传附件"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
              >
                <span className="material-symbols-outlined text-[20px]">{uploadingFile ? 'hourglass_empty' : 'attach_file'}</span>
              </button>
              <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
              <button 
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="插入链接"
                onClick={() => {
                  const link = '[链接文字](url)';
                  setEditForm(prev => ({ ...prev, content: prev.content + link }));
                  contentInputRef.current?.focus();
                }}
              >
                <span className="material-symbols-outlined text-[20px]">link</span>
              </button>
            </div>
          </div>
        </div>

        {/* 子任务进度卡片 */}
        {task.subtasks_count > 0 && (
          <div className="flex-shrink-0 bg-white dark:bg-surface-dark rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-gray-400">checklist</span>
                <span className="text-sm font-medium text-gray-500">子任务</span>
              </div>
              <span className="text-sm font-medium text-primary">{task.completed_subtasks_count}/{task.subtasks_count}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
              <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${(task.completed_subtasks_count / task.subtasks_count) * 100}%` }} />
            </div>
          </div>
        )}

        {/* 底部信息 */}
        <div className="flex-shrink-0 px-2 py-2">
          <div className="flex justify-center gap-4 text-xs text-gray-400">
            <span>创建于 {format(parseISO(task.created_at), 'M月d日 HH:mm', { locale: zhCN })}</span>
            <span>·</span>
            <span>更新于 {format(parseISO(task.updated_at), 'M月d日 HH:mm', { locale: zhCN })}</span>
          </div>
        </div>
      </main>
      
      {confirmState.isOpen && (
        <ConfirmDialog title={confirmState.title} message={confirmState.message} confirmText={confirmState.confirmText} cancelText={confirmState.cancelText} confirmColor={confirmState.confirmColor} onConfirm={confirmState.onConfirm} onCancel={handleCancel} />
      )}

      {/* 项目选择底部弹窗 */}
      {task && (
        <BottomSheet 
          isOpen={showProjectSelector} 
          onClose={() => setShowProjectSelector(false)}
          title="选择清单"
        >
          <div className="py-2">
            {projects.length === 0 && (
              <div className="px-4 py-2 text-sm text-gray-500">
                暂无清单，请先创建清单
              </div>
            )}
            {projects.map((project) => (
              <button 
                key={project.uid} 
                onClick={() => handleUpdateProject(project.uid)} 
                className={`w-full px-4 py-3 text-left text-base flex items-center justify-between active:bg-gray-100 dark:active:bg-gray-800 transition-colors ${task.project?.uid === project.uid ? 'text-primary' : 'text-gray-900 dark:text-white'}`}
              >
                <span>{project.name}</span>
                {task.project?.uid === project.uid && (
                  <span className="material-symbols-outlined text-[20px] text-primary fill-1">check_circle</span>
                )}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* 时间设置底部弹窗 */}
      <BottomSheet 
        isOpen={showDateSheet} 
        onClose={() => setShowDateSheet(false)}
        title="设置时间"
      >
        <div className="px-4 py-4 space-y-6">
          {/* 开始时间 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">play_arrow</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">开始时间</span>
              </div>
              {task?.start_date && (
                <button 
                  onClick={() => handleClearDate('start')}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  清除
                </button>
              )}
            </div>
            {/* 快捷选项 */}
            <div className="flex flex-wrap gap-1.5">
              {getQuickDateOptions('start').map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickDate('start', option.value)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs text-gray-700 dark:text-gray-300"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
            {/* 自定义时间 */}
            <input 
              type="datetime-local" 
              value={formatDateForInput(task?.start_date)} 
              onChange={(e) => handleUpdateDate('start', e.target.value)} 
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

          {/* 截止时间 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">event</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">截止时间</span>
              </div>
              {task?.due_date && (
                <button 
                  onClick={() => handleClearDate('due')}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  清除
                </button>
              )}
            </div>
            {/* 快捷选项 */}
            <div className="flex flex-wrap gap-1.5">
              {getQuickDateOptions('due').map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickDate('due', option.value)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs text-gray-700 dark:text-gray-300"
                >
                  <span className="material-symbols-outlined text-[14px] text-primary">{option.icon}</span>
                  {option.label}
                </button>
              ))}
            </div>
            {/* 自定义时间 */}
            <input 
              type="datetime-local" 
              value={formatDateForInput(task?.due_date)} 
              onChange={(e) => handleUpdateDate('due', e.target.value)} 
              className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none ${
                task?.is_overdue && !task?.is_completed 
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 text-red-600' 
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white'
              }`}
            />
          </div>

          {/* 完成按钮 */}
          <button 
            onClick={() => setShowDateSheet(false)}
            className="w-full py-3 text-center text-white bg-primary hover:bg-primary/90 rounded-xl font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </BottomSheet>

      {/* 标签选择底部弹窗 */}
      <BottomSheet 
        isOpen={showTagSelector} 
        onClose={() => { setShowTagSelector(false); setNewTagName(''); }}
        title="选择标签"
      >
        <div className="px-4 py-4 space-y-4">
          {/* 创建新标签 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">新建标签</span>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                placeholder="输入标签名称..."
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              />
              <button 
                onClick={handleCreateTag}
                disabled={!newTagName.trim() || createTag.isPending}
                className="px-4 py-2.5 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {createTag.isPending ? '创建中...' : '创建'}
              </button>
            </div>
          </div>

          {/* 现有标签列表 */}
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">选择标签</span>
            {allTags.length === 0 ? (
              <div className="py-4 text-center text-sm text-gray-400">
                暂无标签，请先创建
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allTags.map((tag) => {
                  const isSelected = task?.tags.some(t => t.uid === tag.uid);
                  return (
                    <button 
                      key={tag.uid} 
                      onClick={() => handleToggleTag(tag.uid)} 
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                        isSelected 
                          ? 'ring-2 ring-offset-2' 
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ 
                        backgroundColor: `${tag.color}20`, 
                        color: tag.color,
                        ...(isSelected ? { ringColor: tag.color } : {})
                      }}
                    >
                      {isSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 完成按钮 */}
          <button 
            onClick={() => { setShowTagSelector(false); setNewTagName(''); }}
            className="w-full py-3 text-center text-white bg-primary hover:bg-primary/90 rounded-xl font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </BottomSheet>

      {/* 动态记录底部弹窗 */}
      <BottomSheet 
        isOpen={showActivitySheet} 
        onClose={() => setShowActivitySheet(false)}
        title="动态记录"
      >
        <div className="px-4 py-4">
          {isActivityLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : activityLogs && activityLogs.results.length > 0 ? (
            <div className="border-l-2 border-gray-100 dark:border-gray-800 ml-3 space-y-4">
              {activityLogs.results.map((activity) => {
                const iconConfig = getActivityIcon(activity.action);
                return (
                  <div key={activity.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-0 bg-white dark:bg-surface-dark">
                      <div className={`${iconConfig.iconBg} rounded-full p-1 ${iconConfig.iconColor}`}>
                        <span className="material-symbols-outlined text-[10px] block">{iconConfig.icon}</span>
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
                      {activity.detail && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.detail}</p>}
                      <span className="text-xs text-gray-400 mt-0.5 block">{formatActivityTime(activity.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400">
              <span className="material-symbols-outlined text-[36px] mb-2 opacity-50">history</span>
              <p className="text-sm">暂无活动记录</p>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};

export default TaskDetailPage;
