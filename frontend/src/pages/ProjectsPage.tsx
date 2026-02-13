import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from '../hooks/useGroups';
import BottomNav from '../components/BottomNav';
import BottomSheet from '../components/BottomSheet';
import type { Project, Group } from '../types/index';

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
  { key: 'purple', bg: 'bg-purple-500' },
  { key: 'blue', bg: 'bg-blue-500' },
  { key: 'orange', bg: 'bg-orange-500' },
  { key: 'green', bg: 'bg-green-500' },
  { key: 'pink', bg: 'bg-pink-500' },
  { key: 'indigo', bg: 'bg-indigo-500' },
  { key: 'teal', bg: 'bg-teal-500' },
  { key: 'red', bg: 'bg-red-500' },
];

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { iconBg: string; textColor: string; progressBg: string }> = {
    purple: { iconBg: 'bg-purple-100 dark:bg-purple-800/50', textColor: 'text-purple-600 dark:text-purple-300', progressBg: 'bg-purple-500' },
    blue: { iconBg: 'bg-blue-100 dark:bg-blue-800/50', textColor: 'text-blue-600 dark:text-blue-300', progressBg: 'bg-blue-500' },
    orange: { iconBg: 'bg-orange-100 dark:bg-orange-800/50', textColor: 'text-orange-500', progressBg: 'bg-orange-500' },
    green: { iconBg: 'bg-green-100 dark:bg-green-800/50', textColor: 'text-green-500', progressBg: 'bg-green-500' },
    pink: { iconBg: 'bg-pink-100 dark:bg-pink-800/50', textColor: 'text-pink-500', progressBg: 'bg-pink-500' },
    indigo: { iconBg: 'bg-indigo-100 dark:bg-indigo-800/50', textColor: 'text-indigo-500', progressBg: 'bg-indigo-500' },
    teal: { iconBg: 'bg-teal-100 dark:bg-teal-800/50', textColor: 'text-teal-600', progressBg: 'bg-teal-500' },
    red: { iconBg: 'bg-red-100 dark:bg-red-800/50', textColor: 'text-red-500', progressBg: 'bg-red-500' },
  };
  return colorMap[color] || colorMap.blue;
};

const getProjectStyle = (project: Project) => {
  const icons = ['work', 'person', 'shopping_cart', 'flight', 'sports_esports', 'book', 'home', 'fitness_center'];
  const colors = ['purple', 'blue', 'orange', 'green', 'pink', 'indigo', 'teal', 'red'];
  return {
    icon: project.style?.icon || icons[project.name.length % icons.length],
    color: project.style?.color || colors[project.uid.length % colors.length],
  };
};

// 默认分组名称
const DEFAULT_GROUP_NAME = '我的清单';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  // 分组状态
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // 新建菜单
  const [showAddMenu, setShowAddMenu] = useState(false);

  // 创建清单
  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', desc: '', group_uid: '', icon: 'folder', color: 'blue' });

  // 分组管理
  const [showGroupSheet, setShowGroupSheet] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupFormName, setGroupFormName] = useState('');
  const [groupFormDesc, setGroupFormDesc] = useState('');
  const [showDeleteGroupConfirm, setShowDeleteGroupConfirm] = useState<Group | null>(null);
  const [deleteGroupError, setDeleteGroupError] = useState('');
  const [activeGroupMenu, setActiveGroupMenu] = useState<string | null>(null);

  // 数据
  const { data: projectsResponse } = useProjects();
  const { data: groupsData } = useGroups();
  const createProject = useCreateProject();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const projects = projectsResponse?.results || [];
  const groups = groupsData?.results || [];

  // 获取默认分组（第一个分组或名为"我的清单"的分组）
  const defaultGroup = useMemo(() => {
    return groups.find(g => g.name === DEFAULT_GROUP_NAME) || groups[0];
  }, [groups]);

  // 默认展开所有分组
  useEffect(() => {
    if (groups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groups.map(g => g.uid)));
    }
  }, [groups]);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveGroupMenu(null);
      setShowAddMenu(false);
    };
    if (activeGroupMenu || showAddMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [activeGroupMenu, showAddMenu]);

  // 按分组归类项目
  const groupedProjects = useMemo(() => {
    const map = new Map<string, { group: Group; projects: Project[] }>();
    for (const group of groups) {
      map.set(group.uid, { group, projects: [] });
    }
    for (const project of projects) {
      const entry = map.get(project.group.uid);
      if (entry) {
        entry.projects.push(project);
      }
    }
    return Array.from(map.values());
  }, [projects, groups]);

  const toggleGroup = (groupUid: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupUid) ? next.delete(groupUid) : next.add(groupUid);
      return next;
    });
  };

  // 创建清单 - 默认使用默认分组
  const handleOpenCreateProject = useCallback(() => {
    const targetGroupUid = defaultGroup?.uid || '';
    setNewProject({ name: '', desc: '', group_uid: targetGroupUid, icon: 'folder', color: 'blue' });
    setShowAddMenu(false);
    setShowCreateSheet(true);
  }, [defaultGroup]);

  const handleSubmitCreate = () => {
    if (!newProject.name.trim() || !newProject.group_uid) return;
    // 乐观更新：立即关闭弹窗
    setShowCreateSheet(false);
    const data = {
      name: newProject.name.trim(),
      desc: newProject.desc.trim() || undefined,
      group_uid: newProject.group_uid,
      style: { icon: newProject.icon, color: newProject.color },
    };
    setNewProject({ name: '', desc: '', group_uid: '', icon: 'folder', color: 'blue' });
    createProject.mutate(data as any);
  };

  // 分组管理
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormName('');
    setGroupFormDesc('');
    setShowAddMenu(false);
    setShowGroupSheet(true);
  };

  const handleOpenEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupFormName(group.name);
    setGroupFormDesc(group.desc || '');
    setActiveGroupMenu(null);
    setShowGroupSheet(true);
  };

  const handleSubmitGroup = () => {
    if (!groupFormName.trim()) return;
    setShowGroupSheet(false);
    if (editingGroup) {
      updateGroup.mutate({ uid: editingGroup.uid, data: { name: groupFormName.trim(), desc: groupFormDesc.trim() || undefined } });
    } else {
      createGroup.mutate({ name: groupFormName.trim(), desc: groupFormDesc.trim() || undefined });
    }
    setGroupFormName('');
    setGroupFormDesc('');
    setEditingGroup(null);
  };

  const handleDeleteGroup = (group: Group) => {
    setDeleteGroupError('');
    deleteGroup.mutate(group.uid, {
      onSuccess: () => {
        setShowDeleteGroupConfirm(null);
      },
      onError: (error: any) => {
        setDeleteGroupError(error?.response?.data?.error?.message || '删除失败');
      },
    });
  };

  const handleGroupMenuClick = (e: React.MouseEvent, groupUid: string) => {
    e.stopPropagation();
    setActiveGroupMenu(activeGroupMenu === groupUid ? null : groupUid);
  };

  // 项目卡片渲染
  const renderProjectCard = (project: Project, isLast: boolean) => {
    const { icon, color } = getProjectStyle(project);
    const cc = getColorClasses(color);
    const progress = project.tasks_count > 0
      ? Math.round((project.completed_tasks_count / project.tasks_count) * 100)
      : 0;

    return (
      <button
        key={project.uid}
        onClick={() => navigate(`/projects/${project.uid}`)}
        className={`w-full flex items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group/item ${
          !isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''
        }`}
      >
        <div className={`size-10 rounded-xl ${cc.iconBg} flex items-center justify-center ${cc.textColor} mr-3 shrink-0`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div className={`h-full rounded-full ${cc.progressBg} transition-all duration-300`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
              {project.completed_tasks_count}/{project.tasks_count}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[18px] opacity-0 group-hover/item:opacity-100 ml-2 shrink-0 transition-opacity">
          chevron_right
        </span>
      </button>
    );
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-gray-50 dark:bg-background-dark overflow-hidden">
      {/* 顶部Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">清单</h1>
          
          {/* + 新建按钮 */}
          <div className="relative">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">add</span>
              <span>新建</span>
            </button>
            
            {/* 新建菜单 */}
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                <button
                  onClick={handleOpenCreateProject}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5"
                >
                  <span className="material-symbols-outlined text-[18px] text-primary">list_alt</span>
                  新建清单
                </button>
                <button
                  onClick={handleOpenCreateGroup}
                  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5"
                >
                  <span className="material-symbols-outlined text-[18px] text-orange-500">create_new_folder</span>
                  新建分组
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 px-4">
        {/* 分组列表 */}
        <div className="mt-3 space-y-3">
          {groupedProjects.map(({ group, projects: groupProjects }) => (
            <div key={group.uid} className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm">
              {/* 分组标题 */}
              <button
                onClick={() => toggleGroup(group.uid)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[18px] text-gray-400 transition-transform duration-200 ${
                      expandedGroups.has(group.uid) ? 'rotate-90' : ''
                    }`}
                  >
                    chevron_right
                  </span>
                  <span className="material-symbols-outlined text-[18px] text-primary">folder</span>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {group.name}
                  </h3>
                  <span className="text-xs text-gray-400 shrink-0">
                    {groupProjects.length}
                  </span>
                </div>
                <button
                  onClick={(e) => handleGroupMenuClick(e, group.uid)}
                  className="p-1.5 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">more_horiz</span>
                </button>
              </button>

              {/* 分组操作菜单 */}
              {activeGroupMenu === group.uid && (
                <div className="mx-4 mb-2 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg flex gap-1 animate-fade-in">
                  <button
                    onClick={() => handleOpenEditGroup(group)}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                    编辑
                  </button>
                  <button
                    onClick={() => { setActiveGroupMenu(null); setShowDeleteGroupConfirm(group); }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    删除
                  </button>
                </div>
              )}

              {/* 清单列表 */}
              {expandedGroups.has(group.uid) && (
                <div className="border-t border-gray-100 dark:border-gray-800">
                  {groupProjects.length > 0 ? (
                    groupProjects.map((project, idx) => renderProjectCard(project, idx === groupProjects.length - 1))
                  ) : (
                    <div className="py-6 text-center text-gray-400">
                      <p className="text-xs">暂无清单</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* 全空状态 */}
          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px] text-gray-300">folder_off</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">还没有任何分组</p>
              <p className="text-xs text-gray-400 mt-1">点击右上角"新建"创建分组</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      {/* 创建清单 BottomSheet */}
      <BottomSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="新建清单">
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
              placeholder="输入清单名称..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">分组</label>
            <select
              value={newProject.group_uid}
              onChange={(e) => setNewProject(prev => ({ ...prev, group_uid: e.target.value }))}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
            >
              {groups.map(group => (
                <option key={group.uid} value={group.uid}>{group.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">图标</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map(({ icon, label }) => (
                <button
                  key={icon}
                  onClick={() => setNewProject(prev => ({ ...prev, icon }))}
                  className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${
                    newProject.icon === icon
                      ? 'bg-primary/10 text-primary ring-1 ring-primary'
                      : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{icon}</span>
                  <span className="text-[8px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">颜色</label>
            <div className="flex gap-2.5 flex-wrap">
              {PRESET_COLORS.map(({ key, bg }) => (
                <button
                  key={key}
                  onClick={() => setNewProject(prev => ({ ...prev, color: key }))}
                  className={`size-7 rounded-full ${bg} transition-all ${
                    newProject.color === key
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-gray-900 dark:ring-white scale-110'
                      : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmitCreate}
            disabled={!newProject.name.trim() || !newProject.group_uid}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            创建清单
          </button>
        </div>
      </BottomSheet>

      {/* 分组管理 BottomSheet */}
      <BottomSheet isOpen={showGroupSheet} onClose={() => setShowGroupSheet(false)} title={editingGroup ? '编辑分组' : '新建分组'}>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              分组名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={groupFormName}
              onChange={(e) => setGroupFormName(e.target.value)}
              placeholder="输入分组名称..."
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">描述</label>
            <textarea
              value={groupFormDesc}
              onChange={(e) => setGroupFormDesc(e.target.value)}
              placeholder="简要描述这个分组..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>

          <button
            onClick={handleSubmitGroup}
            disabled={!groupFormName.trim()}
            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {editingGroup ? '保存修改' : '创建分组'}
          </button>
        </div>
      </BottomSheet>

      {/* 删除分组确认 */}
      {showDeleteGroupConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl p-5 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-[22px]">warning</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">删除分组</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
              确定要删除「{showDeleteGroupConfirm.name}」吗？分组下有清单时无法删除。
            </p>
            {deleteGroupError && (
              <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">{deleteGroupError}</p>
            )}
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowDeleteGroupConfirm(null); setDeleteGroupError(''); }}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDeleteGroup(showDeleteGroupConfirm)}
                disabled={deleteGroup.isPending}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {deleteGroup.isPending ? '删除中...' : '确定删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
