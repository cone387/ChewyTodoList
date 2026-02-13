import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProject, useProjectStats, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { useGroups } from '../hooks/useGroups';
import BottomSheet from '../components/BottomSheet';
import BottomNav from '../components/BottomNav';
import type { Group } from '../types/index';

const PRESET_ICONS = [
  { icon: 'work', label: '工作' },
  { icon: 'person', label: '个人' },
  { icon: 'shopping_cart', label: '购物' },
  { icon: 'flight', label: '旅行' },
  { icon: 'sports_esports', label: '娱乐' },
  { icon: 'book', label: '学习' },
  { icon: 'home', label: '家庭' },
  { icon: 'fitness_center', label: '健身' },
  { icon: 'restaurant', label: '美食' },
  { icon: 'code', label: '开发' },
  { icon: 'palette', label: '设计' },
  { icon: 'music_note', label: '音乐' },
];

const PRESET_COLORS = [
  { key: 'purple', bg: 'bg-purple-500', ring: 'ring-purple-500' },
  { key: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
  { key: 'orange', bg: 'bg-orange-500', ring: 'ring-orange-500' },
  { key: 'green', bg: 'bg-green-500', ring: 'ring-green-500' },
  { key: 'pink', bg: 'bg-pink-500', ring: 'ring-pink-500' },
  { key: 'indigo', bg: 'bg-indigo-500', ring: 'ring-indigo-500' },
  { key: 'teal', bg: 'bg-teal-500', ring: 'ring-teal-500' },
  { key: 'red', bg: 'bg-red-500', ring: 'ring-red-500' },
];

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; iconBg: string; textColor: string }> = {
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', iconBg: 'bg-purple-100 dark:bg-purple-800/50', textColor: 'text-purple-600 dark:text-purple-300' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', iconBg: 'bg-blue-100 dark:bg-blue-800/50', textColor: 'text-blue-600 dark:text-blue-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', iconBg: 'bg-orange-100 dark:bg-orange-800/50', textColor: 'text-orange-500' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', iconBg: 'bg-green-100 dark:bg-green-800/50', textColor: 'text-green-500' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', iconBg: 'bg-pink-100 dark:bg-pink-800/50', textColor: 'text-pink-500' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconBg: 'bg-indigo-100 dark:bg-indigo-800/50', textColor: 'text-indigo-500' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', iconBg: 'bg-teal-100 dark:bg-teal-800/50', textColor: 'text-teal-600' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', iconBg: 'bg-red-100 dark:bg-red-800/50', textColor: 'text-red-500' },
  };
  return colorMap[color] || colorMap.blue;
};

const ProjectDetailPage: React.FC = () => {
  const { uid } = useParams<{ uid: string }>();
  const navigate = useNavigate();
  const nameInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLTextAreaElement>(null);

  const { data: project, isLoading: isProjectLoading } = useProject(uid || '');
  const { data: stats, isLoading: isStatsLoading } = useProjectStats(uid || '');
  const { data: tasksData } = useTasks({ project: uid });
  const { data: groupsData } = useGroups();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const groups = groupsData?.results || [];
  const tasks = tasksData?.results || [];

  const [editingName, setEditingName] = useState(false);
  const [editingDesc, setEditingDesc] = useState(false);
  const [nameValue, setNameValue] = useState('');
  const [descValue, setDescValue] = useState('');
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (project) {
      setNameValue(project.name);
      setDescValue(project.desc || '');
    }
  }, [project]);

  useEffect(() => {
    if (editingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [editingName]);

  useEffect(() => {
    if (editingDesc && descInputRef.current) {
      descInputRef.current.focus();
    }
  }, [editingDesc]);

  const projectIcon = project?.style?.icon || 'folder';
  const projectColor = project?.style?.color || 'blue';
  const colorClasses = getColorClasses(projectColor);

  const handleSaveName = () => {
    setEditingName(false);
    if (nameValue.trim() && nameValue.trim() !== project?.name) {
      updateProject.mutate({ uid: uid!, data: { name: nameValue.trim() } });
    } else {
      setNameValue(project?.name || '');
    }
  };

  const handleSaveDesc = () => {
    setEditingDesc(false);
    if (descValue !== (project?.desc || '')) {
      updateProject.mutate({ uid: uid!, data: { desc: descValue } });
    }
  };

  const handleIconChange = (icon: string) => {
    updateProject.mutate({
      uid: uid!,
      data: { style: { ...project?.style, icon } },
    });
  };

  const handleColorChange = (color: string) => {
    updateProject.mutate({
      uid: uid!,
      data: { style: { ...project?.style, color } },
    });
  };

  const handleGroupChange = (group: Group) => {
    updateProject.mutate({
      uid: uid!,
      data: { group_uid: group.uid },
    });
    setShowGroupSheet(false);
  };

  const handleDelete = () => {
    setDeleteError('');
    deleteProject.mutate(uid!, {
      onSuccess: () => {
        navigate('/projects', { replace: true });
      },
      onError: (error: any) => {
        const message = error?.response?.data?.error?.message || '删除失败';
        setDeleteError(message);
      },
    });
  };

  if (isProjectLoading) {
    return (
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl min-h-screen flex flex-col items-center justify-center px-4">
        <span className="material-symbols-outlined text-[48px] text-gray-300 dark:text-gray-600 mb-4">error</span>
        <p className="text-gray-500 dark:text-gray-400 mb-4">清单不存在</p>
        <button onClick={() => navigate('/projects')} className="text-primary text-sm font-medium">
          返回清单列表
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto">
        <div className="flex items-center p-3 justify-between">
          <button
            onClick={() => navigate(-1)}
            className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px] text-gray-700 dark:text-gray-300">arrow_back</span>
          </button>
          
          <h1 className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">
            {project.name}
          </h1>
          
          <div className="relative">
            <button
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className="size-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px] text-gray-700 dark:text-gray-300">more_vert</span>
            </button>
            {showMoreMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                <button
                  onClick={() => {
                    setShowMoreMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                  删除清单
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 占位 */}
      <div className="h-14 pt-safe" />

      <main className="overflow-y-auto pb-24 px-4">
        {/* 项目信息卡片 */}
        <div className={`rounded-2xl ${colorClasses.bg} p-5 mt-4`}>
          <div className="flex items-start gap-4">
            <div className={`size-14 rounded-xl ${colorClasses.iconBg} flex items-center justify-center ${colorClasses.textColor} shrink-0`}>
              <span className="material-symbols-outlined text-[28px]">{projectIcon}</span>
            </div>
            <div className="flex-1 min-w-0">
              {/* 名称 */}
              {editingName ? (
                <input
                  ref={nameInputRef}
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveName();
                    if (e.key === 'Escape') { setEditingName(false); setNameValue(project.name); }
                  }}
                  className="w-full text-lg font-bold bg-transparent border-b-2 border-primary focus:outline-none text-gray-900 dark:text-white pb-0.5"
                />
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-left w-full"
                >
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                    {project.name}
                  </h2>
                </button>
              )}

              {/* 描述 */}
              {editingDesc ? (
                <textarea
                  ref={descInputRef}
                  value={descValue}
                  onChange={(e) => setDescValue(e.target.value)}
                  onBlur={handleSaveDesc}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setEditingDesc(false); setDescValue(project.desc || ''); }
                  }}
                  rows={2}
                  className="w-full text-sm bg-transparent border-b-2 border-primary focus:outline-none text-gray-600 dark:text-gray-300 mt-1 resize-none"
                  placeholder="添加描述..."
                />
              ) : (
                <button
                  onClick={() => setEditingDesc(true)}
                  className="text-left w-full mt-1"
                >
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {project.desc || '点击添加描述...'}
                  </p>
                </button>
              )}

              {/* 所属分组 */}
              <button
                onClick={() => setShowGroupSheet(true)}
                className="mt-2 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">folder</span>
                <span>{project.group?.name || '未分组'}</span>
                <span className="material-symbols-outlined text-[14px]">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          {[
            { label: '总任务', value: stats?.total_tasks ?? project.tasks_count ?? 0, icon: 'task_alt', color: 'text-blue-500' },
            { label: '已完成', value: stats?.completed_tasks ?? project.completed_tasks_count ?? 0, icon: 'check_circle', color: 'text-green-500' },
            { label: '进行中', value: stats?.pending_tasks ?? 0, icon: 'pending', color: 'text-orange-500' },
            { label: '已逾期', value: stats?.overdue_tasks ?? 0, icon: 'schedule', color: 'text-red-500' },
          ].map(stat => (
            <div
              key={stat.label}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50"
            >
              <span className={`material-symbols-outlined text-[22px] ${stat.color}`}>{stat.icon}</span>
              <div>
                <p className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
                  {isStatsLoading ? '-' : stat.value}
                </p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* 图标选择 */}
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">图标</h3>
          <div className="grid grid-cols-6 gap-2">
            {PRESET_ICONS.map(({ icon, label }) => (
              <button
                key={icon}
                onClick={() => handleIconChange(icon)}
                className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                  projectIcon === icon
                    ? 'bg-primary/10 text-primary ring-1 ring-primary'
                    : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{icon}</span>
                <span className="text-[9px]">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 颜色选择 */}
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">颜色</h3>
          <div className="flex gap-3 flex-wrap">
            {PRESET_COLORS.map(({ key, bg }) => (
              <button
                key={key}
                onClick={() => handleColorChange(key)}
                className={`size-8 rounded-full ${bg} transition-all ${
                  projectColor === key
                    ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-gray-900 dark:ring-white scale-110'
                    : 'hover:scale-110'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 任务列表 */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              任务 ({tasks.length})
            </h3>
            <button
              onClick={() => navigate('/create')}
              className="text-primary text-xs font-medium flex items-center gap-0.5 hover:opacity-80"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              新建
            </button>
          </div>
          
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-gray-400 dark:text-gray-500">
              <span className="material-symbols-outlined text-[36px] mb-2">checklist</span>
              <p className="text-sm">暂无任务</p>
            </div>
          ) : (
            <div className="space-y-1">
              {tasks.map(task => (
                <button
                  key={task.uid}
                  onClick={() => navigate(`/task/${task.uid}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                >
                  <span className={`material-symbols-outlined text-[20px] ${
                    task.is_completed
                      ? 'text-green-500 fill-1'
                      : task.is_overdue
                        ? 'text-red-400'
                        : 'text-gray-300 dark:text-gray-600'
                  }`}>
                    {task.is_completed ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${
                      task.is_completed
                        ? 'text-gray-400 dark:text-gray-500 line-through'
                        : 'text-gray-900 dark:text-white'
                    } truncate`}>
                      {task.title}
                    </p>
                    {task.due_date && (
                      <p className={`text-[11px] mt-0.5 ${
                        task.is_overdue ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                        {new Date(task.due_date).toLocaleDateString('zh-CN')}
                      </p>
                    )}
                  </div>
                  {task.priority > 0 && (
                    <span className={`material-symbols-outlined text-[16px] ${
                      task.priority === 3 ? 'text-red-500' :
                      task.priority === 2 ? 'text-orange-500' :
                      'text-blue-400'
                    }`}>
                      flag
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 危险区域 */}
        <div className="mt-8 mb-4 p-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-900/10">
          <h3 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-1">危险操作</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            删除清单后无法恢复。清单下有任务时无法删除。
          </p>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
          >
            删除清单
          </button>
        </div>
      </main>

      <BottomNav />

      {/* 分组选择 BottomSheet */}
      <BottomSheet
        isOpen={showGroupSheet}
        onClose={() => setShowGroupSheet(false)}
        title="选择分组"
      >
        <div className="py-2">
          {groups.map(group => (
            <button
              key={group.uid}
              onClick={() => handleGroupChange(group)}
              className={`w-full px-5 py-3 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                project.group?.uid === group.uid ? 'text-primary' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">folder</span>
                <div>
                  <p className="text-sm font-medium">{group.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {group.projects_count} 个清单
                  </p>
                </div>
              </div>
              {project.group?.uid === group.uid && (
                <span className="material-symbols-outlined text-primary text-[20px]">check</span>
              )}
            </button>
          ))}
        </div>
      </BottomSheet>

      {/* 删除确认 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl p-5 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-[22px]">warning</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">删除清单</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              确定要删除「{project.name}」吗？此操作无法撤销。
            </p>
            {deleteError && (
              <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowDeleteConfirm(false); setDeleteError(''); }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProject.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
              >
                {deleteProject.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    删除中...
                  </>
                ) : (
                  '确定删除'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailPage;
