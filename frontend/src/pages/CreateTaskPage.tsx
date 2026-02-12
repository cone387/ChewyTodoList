import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTask } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useTags, useCreateTag } from '../hooks/useTags';
import { TaskPriority } from '../types/index';
import BottomSheet from '../components/BottomSheet';
import { attachmentApi } from '../services/api';

const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  const [showDateSheet, setShowDateSheet] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const titleInputRef = useRef<HTMLTextAreaElement>(null);
  const contentInputRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    project_uid: '',
    priority: TaskPriority.MEDIUM as TaskPriority,
    tag_uids: [] as string[],
    due_date: '',
    start_date: '',
  });

  const createTask = useCreateTask();
  const { data: projectsResponse } = useProjects();
  const { data: tagsResponse } = useTags();
  const createTag = useCreateTag();

  const projects = projectsResponse?.results || [];
  const allTags = tagsResponse?.results || [];

  // 自动聚焦标题输入框
  useEffect(() => {
    setTimeout(() => {
      titleInputRef.current?.focus();
    }, 100);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCreate = () => {
    if (!formData.title.trim()) {
      return;
    }

    const taskData: any = {
      title: formData.title.trim(),
      priority: formData.priority,
      tag_uids: formData.tag_uids,
    };

    if (formData.project_uid) {
      taskData.project_uid = formData.project_uid;
    }

    if (formData.content.trim()) {
      taskData.content = formData.content.trim();
    }

    if (formData.due_date) {
      const dueDate = new Date(formData.due_date);
      if (!isNaN(dueDate.getTime())) {
        taskData.due_date = dueDate.toISOString();
      }
    }

    if (formData.start_date) {
      const startDate = new Date(formData.start_date);
      if (!isNaN(startDate.getTime())) {
        taskData.start_date = startDate.toISOString();
      }
    }

    // 乐观更新：立即跳转
    navigate(-1);
    
    createTask.mutate(taskData, {
      onError: (error: any) => {
        console.error('创建任务失败:', error);
      }
    });
  };

  const handleUpdatePriority = (priority: TaskPriority) => {
    setFormData({ ...formData, priority });
  };

  const handleUpdateProject = (projectUid: string) => {
    setFormData({ ...formData, project_uid: projectUid });
    setShowProjectSelector(false);
  };

  const handleToggleTag = (tagUid: string) => {
    const newTagUids = formData.tag_uids.includes(tagUid)
      ? formData.tag_uids.filter(uid => uid !== tagUid)
      : [...formData.tag_uids, tagUid];
    setFormData({ ...formData, tag_uids: newTagUids });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const result = await createTag.mutateAsync({ name: newTagName.trim() });
      const newTag = result.data.data;
      setFormData({ ...formData, tag_uids: [...formData.tag_uids, newTag.uid] });
      setNewTagName('');
    } catch (error) {
      console.error('创建标签失败:', error);
    }
  };

  const handleUpdateDate = (type: 'due' | 'start', dateValue: string) => {
    if (type === 'due') {
      setFormData({ ...formData, due_date: dateValue ? new Date(dateValue).toISOString() : '' });
    } else {
      setFormData({ ...formData, start_date: dateValue ? new Date(dateValue).toISOString() : '' });
    }
  };

  const handleClearDate = (type: 'due' | 'start') => {
    if (type === 'due') {
      setFormData({ ...formData, due_date: '' });
    } else {
      setFormData({ ...formData, start_date: '' });
    }
  };

  const handleQuickDate = (type: 'due' | 'start', isoValue: string) => {
    if (type === 'due') {
      setFormData({ ...formData, due_date: isoValue });
    } else {
      setFormData({ ...formData, start_date: isoValue });
    }
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toISOString().slice(0, 16);
    } catch {
      return '';
    }
  };

  const formatDisplayDate = (dateString?: string) => {
    if (!dateString) return '未设置';
    try {
      const date = new Date(dateString);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    } catch {
      return '未设置';
    }
  };

  const getTimeDisplayText = () => {
    if (!formData.start_date && !formData.due_date) return '未设置';
    const parts: string[] = [];
    if (formData.start_date) {
      parts.push(`开始: ${formatDisplayDate(formData.start_date)}`);
    }
    if (formData.due_date) {
      parts.push(`截止: ${formatDisplayDate(formData.due_date)}`);
    }
    return parts.join(' → ');
  };

  // 处理文件上传
  const handleFileUpload = async (file: File, isImage: boolean) => {
    if (!file) return;
    
    setUploadingFile(true);
    try {
      const response = await attachmentApi.upload(file, true);
      const attachment = response.data;
      
      let insertText = '';
      if (isImage) {
        insertText = `\n![${attachment.original_name}](${attachment.preview_url})\n`;
      } else {
        insertText = `\n[${attachment.original_name}](${attachment.preview_url})\n`;
      }
      
      setFormData(prev => ({ ...prev, content: prev.content + insertText }));
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
    if (file) handleFileUpload(file, true);
    e.target.value = '';
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file, false);
    e.target.value = '';
  };

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

  const selectedProject = projects.find(p => p.uid === formData.project_uid);
  const selectedTags = allTags.filter(t => formData.tag_uids.includes(t.uid));

  return (
    <div className="relative flex h-screen w-full flex-col max-w-md mx-auto bg-gray-50 dark:bg-background-dark shadow-xl overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center p-2 justify-between">
          <button onClick={handleBack} className="text-[#5f6368] dark:text-white flex items-center justify-center size-9 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
          
          {/* 项目选择器 */}
          <div className="flex-1 flex justify-center mx-2">
            <button 
              onClick={() => setShowProjectSelector(true)} 
              className="px-3 py-1.5 rounded-full text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">folder</span>
              <span className="truncate max-w-[120px]">{selectedProject?.name || '收集箱'}</span>
              <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>
          </div>

          <button 
            onClick={handleCreate}
            disabled={!formData.title.trim()}
            className="text-primary font-medium text-sm px-3 py-1.5 hover:bg-primary/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar flex flex-col p-3 gap-3">
        {/* 标题卡片 */}
        <div className="flex-shrink-0 bg-white dark:bg-surface-dark rounded-2xl shadow-sm">
          <div className="px-4 py-4">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 text-gray-300 dark:text-gray-600 h-7 flex items-center">
                <span className="material-symbols-outlined text-[26px]">radio_button_unchecked</span>
              </span>
              <textarea
                ref={titleInputRef}
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="flex-1 text-lg font-semibold bg-transparent border-none focus:ring-0 focus:outline-none resize-none placeholder-gray-300 leading-7 text-gray-900 dark:text-white"
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
                    formData.priority === priority 
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
              (formData.start_date || formData.due_date) ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'
            }`}>
              {getTimeDisplayText()}
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
              {selectedTags.map((tag) => (
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
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
                  setFormData(prev => ({ ...prev, content: prev.content + checkbox }));
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
                  setFormData(prev => ({ ...prev, content: prev.content + bullet }));
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
                  setFormData(prev => ({ ...prev, content: prev.content + number }));
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
                  setFormData(prev => ({ ...prev, content: prev.content + link }));
                  contentInputRef.current?.focus();
                }}
              >
                <span className="material-symbols-outlined text-[20px]">link</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 项目选择底部弹窗 */}
      <BottomSheet 
        isOpen={showProjectSelector} 
        onClose={() => setShowProjectSelector(false)}
        title="选择清单"
      >
        <div className="py-2">
          {/* 收集箱选项 */}
          <button 
            onClick={() => handleUpdateProject('')} 
            className={`w-full px-4 py-3 text-left text-base flex items-center justify-between active:bg-gray-100 dark:active:bg-gray-800 transition-colors ${!formData.project_uid ? 'text-primary' : 'text-gray-900 dark:text-white'}`}
          >
            <span>收集箱</span>
            {!formData.project_uid && (
              <span className="material-symbols-outlined text-[20px] text-primary fill-1">check_circle</span>
            )}
          </button>
          {projects.length > 0 && (
            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
          )}
          {projects.map((project) => (
            <button 
              key={project.uid} 
              onClick={() => handleUpdateProject(project.uid)} 
              className={`w-full px-4 py-3 text-left text-base flex items-center justify-between active:bg-gray-100 dark:active:bg-gray-800 transition-colors ${formData.project_uid === project.uid ? 'text-primary' : 'text-gray-900 dark:text-white'}`}
            >
              <span>{project.name}</span>
              {formData.project_uid === project.uid && (
                <span className="material-symbols-outlined text-[20px] text-primary fill-1">check_circle</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

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
              {formData.start_date && (
                <button 
                  onClick={() => handleClearDate('start')}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  清除
                </button>
              )}
            </div>
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
            <input 
              type="datetime-local" 
              value={formatDateForInput(formData.start_date)} 
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
              {formData.due_date && (
                <button 
                  onClick={() => handleClearDate('due')}
                  className="text-xs text-red-500 hover:text-red-600"
                >
                  清除
                </button>
              )}
            </div>
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
            <input 
              type="datetime-local" 
              value={formatDateForInput(formData.due_date)} 
              onChange={(e) => handleUpdateDate('due', e.target.value)} 
              className="w-full px-3 py-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
            />
          </div>

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
                {createTag.isPending ? '...' : '创建'}
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
                  const isSelected = formData.tag_uids.includes(tag.uid);
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

          <button 
            onClick={() => { setShowTagSelector(false); setNewTagName(''); }}
            className="w-full py-3 text-center text-white bg-primary hover:bg-primary/90 rounded-xl font-medium transition-colors"
          >
            完成
          </button>
        </div>
      </BottomSheet>
    </div>
  );
};

export default CreateTaskPage;
