import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateTask } from '../hooks/useTasks';
import { useProjects } from '../hooks/useProjects';
import { useTags } from '../hooks/useTags';
import { TaskPriority } from '../types/index';
import BottomNav from '../components/BottomNav';

const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    project_uid: '',
    priority: TaskPriority.MEDIUM as TaskPriority,
    tag_uids: [] as string[],
    due_date: '',
    start_date: '',
    is_all_day: true,
  });

  const createTask = useCreateTask();
  const { data: projectsResponse } = useProjects();
  const { data: tagsResponse } = useTags();

  const projects = projectsResponse?.results || [];
  const tags = tagsResponse?.results || [];

  const handleCancel = () => {
    navigate('/');
  };

  const handleCreate = async () => {
    setError('');
    
    if (!formData.title.trim()) {
      setError('请输入任务标题');
      return;
    }

    if (!formData.project_uid) {
      // 使用第一个项目作为默认项目
      if (projects.length > 0) {
        formData.project_uid = projects[0].uid;
      } else {
        setError('请选择一个项目');
        return;
      }
    }

    try {
      const taskData: any = {
        project_uid: formData.project_uid,
        title: formData.title.trim(),
        priority: formData.priority,
        tag_uids: formData.tag_uids,
        is_all_day: formData.is_all_day,
      };

      // 只有非空内容才添加
      if (formData.content.trim()) {
        taskData.content = formData.content.trim();
      }

      // 处理日期时间格式 - 确保符合Django的ISO 8601格式要求
      if (formData.due_date) {
        // HTML datetime-local 格式: YYYY-MM-DDTHH:mm
        // Django 期望格式: YYYY-MM-DDTHH:mm:ss[.ffffff][+HH:MM|-HH:MM|Z]
        const dueDate = new Date(formData.due_date);
        if (!isNaN(dueDate.getTime())) {
          // 转换为ISO字符串，Django会自动处理时区
          taskData.due_date = dueDate.toISOString();
        }
      }

      if (formData.start_date) {
        const startDate = new Date(formData.start_date);
        if (!isNaN(startDate.getTime())) {
          taskData.start_date = startDate.toISOString();
        }
      }

      console.log('发送的任务数据:', taskData); // 调试用

      await createTask.mutateAsync(taskData);
      
      // 显示成功提示
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
      successDiv.textContent = '任务创建成功！';
      document.body.appendChild(successDiv);
      
      setTimeout(() => {
        if (document.body.contains(successDiv)) {
          document.body.removeChild(successDiv);
        }
      }, 2000);
      
      navigate('/');
    } catch (error: any) {
      console.error('创建任务失败:', error);
      
      // 更详细的错误处理
      let errorMessage = '创建任务失败，请重试';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'object') {
          // 处理字段验证错误
          const fieldErrors = [];
          for (const [field, messages] of Object.entries(errorData)) {
            if (Array.isArray(messages)) {
              fieldErrors.push(`${field}: ${messages.join(', ')}`);
            } else if (typeof messages === 'string') {
              fieldErrors.push(`${field}: ${messages}`);
            }
          }
          if (fieldErrors.length > 0) {
            errorMessage = fieldErrors.join('; ');
          }
        }
      }
      
      setError(errorMessage);
    }
  };

  const handlePriorityChange = (priority: TaskPriority) => {
    setFormData({ ...formData, priority });
  };

  const handleTagToggle = (tagUid: string) => {
    const newTagUids = formData.tag_uids.includes(tagUid)
      ? formData.tag_uids.filter(uid => uid !== tagUid)
      : [...formData.tag_uids, tagUid];
    
    setFormData({ ...formData, tag_uids: newTagUids });
  };

  const handleProjectSelect = (projectUid: string) => {
    setFormData({ ...formData, project_uid: projectUid });
    setShowProjectSelector(false);
  };

  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW: return '低';
      case TaskPriority.MEDIUM: return '中';
      case TaskPriority.HIGH: return '高';
      case TaskPriority.URGENT: return '紧急';
      default: return '中';
    }
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.LOW: return 'text-gray-500';
      case TaskPriority.MEDIUM: return 'text-blue-500';
      case TaskPriority.HIGH: return 'text-orange-500';
      case TaskPriority.URGENT: return 'text-red-500';
      default: return 'text-blue-500';
    }
  };

  const selectedProject = projects.find(p => p.uid === formData.project_uid) || projects[0];

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleCreate();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          handleCancel();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData]);

  // 自动选择第一个项目
  useEffect(() => {
    if (projects.length > 0 && !formData.project_uid) {
      setFormData(prev => ({ ...prev, project_uid: projects[0].uid }));
    }
  }, [projects, formData.project_uid]);

  return (
    <div className="relative flex h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-background-dark overflow-hidden pb-16">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 pt-safe max-w-md mx-auto">
        <div className="flex items-center justify-between px-4 h-14">
          <button 
            onClick={handleCancel}
            className="text-gray-500 dark:text-gray-400 font-medium text-base hover:opacity-70 transition-opacity"
          >
            取消
          </button>
          <h1 className="text-base font-semibold">新建任务</h1>
          <button 
            onClick={handleCreate}
            disabled={createTask.isPending || !formData.title.trim()}
            className="text-primary font-semibold text-base hover:opacity-70 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createTask.isPending ? '创建中...' : '创建'}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-10" style={{ paddingTop: 'calc(env(safe-area-inset-top) + 56px)' }}>
        <div className="px-5 py-6 space-y-8">
          {/* Title and Description */}
          <div className="space-y-4">
            <input 
              className="w-full border-none p-0 text-xl font-bold placeholder-gray-300 dark:placeholder-gray-600 focus:ring-0 bg-transparent focus:outline-none"
              placeholder="任务标题"
              type="text"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (error) setError(''); // 清除错误提示
              }}
            />
            <textarea 
              className="w-full border-none p-0 text-sm leading-relaxed placeholder-gray-400 dark:placeholder-gray-500 focus:ring-0 bg-transparent resize-none focus:outline-none"
              placeholder="添加详细描述..."
              rows={3}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
            
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="material-symbols-outlined text-red-500 text-[18px]">error</span>
                <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-1">
            {/* Project Selection */}
            <div 
              className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700 group active:bg-gray-50 dark:active:bg-surface-dark transition-colors cursor-pointer"
              onClick={() => setShowProjectSelector(true)}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">list_alt</span>
                <span className="text-sm font-medium">项目</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500">
                  {selectedProject ? selectedProject.name : '选择项目'}
                </span>
                <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
              </div>
            </div>

            {/* Due Date */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">calendar_today</span>
                <span className="text-sm font-medium">截止日期</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="datetime-local"
                  className="text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  placeholder="设置日期"
                />
                {formData.due_date && (
                  <button
                    onClick={() => setFormData({ ...formData, due_date: '' })}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
              </div>
            </div>

            {/* Start Date */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">schedule</span>
                <span className="text-sm font-medium">开始时间</span>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="datetime-local"
                  className="text-sm text-gray-500 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 focus:ring-2 focus:ring-primary focus:border-transparent cursor-pointer"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  placeholder="设置时间"
                />
                {formData.start_date && (
                  <button
                    onClick={() => setFormData({ ...formData, start_date: '' })}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                )}
                <span className="material-symbols-outlined text-gray-400 text-sm">chevron_right</span>
              </div>
            </div>

            {/* Priority */}
            <div className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">flag</span>
                <span className="text-sm font-medium">优先级</span>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-surface-dark p-0.5 rounded-lg">
                {[TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT].map((priority) => (
                  <button
                    key={priority}
                    onClick={() => handlePriorityChange(priority)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                      formData.priority === priority
                        ? `bg-white dark:bg-gray-700 shadow-sm ${getPriorityColor(priority)}`
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                    }`}
                  >
                    {getPriorityLabel(priority)}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-gray-400 dark:text-gray-500">label</span>
                <span className="text-sm font-medium">标签</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.uid}
                    onClick={() => handleTagToggle(tag.uid)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      formData.tag_uids.includes(tag.uid)
                        ? 'shadow-sm'
                        : 'bg-gray-100 dark:bg-surface-dark text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                    style={formData.tag_uids.includes(tag.uid) ? {
                      backgroundColor: `${tag.color}20`,
                      color: tag.color,
                      borderColor: `${tag.color}40`,
                      border: '1px solid'
                    } : {}}
                  >
                    <span 
                      className="size-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    ></span>
                    {tag.name}
                  </button>
                ))}
                <button className="flex items-center justify-center size-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-full text-gray-400 hover:border-primary hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-sm">add</span>
                </button>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <button className="flex items-center gap-3 text-gray-400 dark:text-gray-500 text-sm font-medium hover:text-primary transition-colors">
              <span className="material-symbols-outlined">attach_file</span>
              <span>添加附件</span>
            </button>
          </div>
        </div>
      </main>

      {/* Bottom Toolbar */}
      <div className="bg-white dark:bg-surface-dark border-t border-gray-200 dark:border-gray-700 pb-safe">
        <div className="flex items-center justify-around h-12 px-2">
          <button className="flex items-center justify-center text-gray-400 hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined">format_list_bulleted</span>
          </button>
          <button className="flex items-center justify-center text-gray-400 hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined">alternate_email</span>
          </button>
          <button className="flex items-center justify-center text-gray-400 hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined">image</span>
          </button>
          <button className="flex items-center justify-center text-gray-400 hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined">mic</span>
          </button>
          <button className="flex items-center justify-center text-gray-400 hover:text-primary transition-colors p-2">
            <span className="material-symbols-outlined">more_horiz</span>
          </button>
        </div>
      </div>

      {/* Project Selector Modal */}
      {showProjectSelector && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div className="w-full max-w-md bg-white dark:bg-surface-dark rounded-t-2xl max-h-[70vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold">选择项目</h3>
              <button 
                onClick={() => setShowProjectSelector(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {projects.map((project) => (
                <button
                  key={project.uid}
                  onClick={() => handleProjectSelect(project.uid)}
                  className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                    formData.project_uid === project.uid ? 'bg-primary/10 text-primary' : ''
                  }`}
                >
                  <div className="flex-1 text-left">
                    <p className="font-medium">{project.name}</p>
                    {project.desc && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{project.desc}</p>
                    )}
                  </div>
                  {formData.project_uid === project.uid && (
                    <span className="material-symbols-outlined text-primary">check</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};

export default CreateTaskPage;