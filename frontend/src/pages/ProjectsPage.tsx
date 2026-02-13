import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject } from '../hooks/useProjects';
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from '../hooks/useGroups';
import ProjectsHeader from '../components/ProjectsHeader';
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
  const colorMap: Record<string, { bg: string; iconBg: string; textColor: string; progressBg: string }> = {
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', iconBg: 'bg-purple-100 dark:bg-purple-800/50', textColor: 'text-purple-600 dark:text-purple-300', progressBg: 'bg-purple-500' },
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', iconBg: 'bg-blue-100 dark:bg-blue-800/50', textColor: 'text-blue-600 dark:text-blue-300', progressBg: 'bg-blue-500' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', iconBg: 'bg-orange-100 dark:bg-orange-800/50', textColor: 'text-orange-500', progressBg: 'bg-orange-500' },
    green: { bg: 'bg-green-50 dark:bg-green-900/20', iconBg: 'bg-green-100 dark:bg-green-800/50', textColor: 'text-green-500', progressBg: 'bg-green-500' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', iconBg: 'bg-pink-100 dark:bg-pink-800/50', textColor: 'text-pink-500', progressBg: 'bg-pink-500' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', iconBg: 'bg-indigo-100 dark:bg-indigo-800/50', textColor: 'text-indigo-500', progressBg: 'bg-indigo-500' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', iconBg: 'bg-teal-100 dark:bg-teal-800/50', textColor: 'text-teal-600', progressBg: 'bg-teal-500' },
    red: { bg: 'bg-red-50 dark:bg-red-900/20', iconBg: 'bg-red-100 dark:bg-red-800/50', textColor: 'text-red-500', progressBg: 'bg-red-500' },
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

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  // 搜索
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // 分组浏览
  const [selectedGroupUid, setSelectedGroupUid] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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
  const [groupActionTarget, setGroupActionTarget] = useState<Group | null>(null);

  // 数据
  const { data: projectsResponse } = useProjects(
    debouncedSearch ? { search: debouncedSearch } : undefined
  );
  const { data: groupsData } = useGroups();
  const createProject = useCreateProject();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const projects = projectsResponse?.results || [];
  const groups = groupsData?.results || [];

  // 搜索防抖
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 默认展开所有分组
  useEffect(() => {
    if (groups.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groups.map(g => g.uid)));
    }
  }, [groups]);

  // 当前选中分组
  const selectedGroup = selectedGroupUid ? groups.find(g => g.uid === selectedGroupUid) : null;

  // 按分组归类项目
  const groupedProjects = useMemo(() => {
    const targetProjects = selectedGroupUid
      ? projects.filter(p => p.group.uid === selectedGroupUid)
      : projects;

    if (selectedGroupUid) {
      return [{ group: selectedGroup!, projects: targetProjects }].filter(g => g.group);
    }

    const map = new Map<string, { group: Group; projects: Project[] }>();
    for (const group of groups) {
      map.set(group.uid, { group, projects: [] });
    }
    for (const project of targetProjects) {
      const entry = map.get(project.group.uid);
      if (entry) {
        entry.projects.push(project);
      }
    }
    return Array.from(map.values());
  }, [projects, groups, selectedGroupUid, selectedGroup]);

  const totalFilteredProjects = groupedProjects.reduce((sum, g) => sum + g.projects.length, 0);

  // Header 标题
  const headerTitle = debouncedSearch
    ? '搜索结果'
    : selectedGroup
      ? selectedGroup.name
      : '清单';

  const handleBack = selectedGroupUid
    ? () => { setSelectedGroupUid(null); setSearchQuery(''); }
    : undefined;

  const toggleGroup = (groupUid: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      next.has(groupUid) ? next.delete(groupUid) : next.add(groupUid);
      return next;
    });
  };

  // 进入分组
  const handleEnterGroup = (groupUid: string) => {
    setSelectedGroupUid(groupUid);
    setSearchQuery('');
  };

  // 创建清单
  const handleOpenCreateProject = useCallback(() => {
    const groupUid = selectedGroupUid || groups[0]?.uid || '';
    setNewProject({ name: '', desc: '', group_uid: groupUid, icon: 'folder', color: 'blue' });
    setShowCreateSheet(true);
  }, [selectedGroupUid, groups]);

  const handleSubmitCreate = () => {
    if (!newProject.name.trim() || !newProject.group_uid) return;
    const data = {
      name: newProject.name.trim(),
      desc: newProject.desc.trim() || undefined,
      group_uid: newProject.group_uid,
      style: { icon: newProject.icon, color: newProject.color },
    };
    setShowCreateSheet(false);
    setNewProject({ name: '', desc: '', group_uid: '', icon: 'folder', color: 'blue' });
    createProject.mutate(data as any);
  };

  // 分组管理
  const handleOpenCreateGroup = () => {
    setEditingGroup(null);
    setGroupFormName('');
    setGroupFormDesc('');
    setShowGroupSheet(true);
  };

  const handleOpenEditGroup = (group: Group) => {
    setEditingGroup(group);
    setGroupFormName(group.name);
    setGroupFormDesc(group.desc || '');
    setGroupActionTarget(null);
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
        if (selectedGroupUid === group.uid) setSelectedGroupUid(null);
      },
      onError: (error: any) => {
        setDeleteGroupError(error?.response?.data?.error?.message || '删除失败');
      },
    });
  };

  // 项目卡片渲染
  const renderProjectCard = (project: Project) => {
    const { icon, color } = getProjectStyle(project);
    const cc = getColorClasses(color);
    const progress = project.tasks_count > 0
      ? Math.round((project.completed_tasks_count / project.tasks_count) * 100)
      : 0;

    return (
      <button
        key={project.uid}
        onClick={() => navigate(`/projects/${project.uid}`)}
        className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group/item"
      >
        <div className={`size-10 rounded-lg ${cc.iconBg} flex items-center justify-center ${cc.textColor} mr-3 shrink-0`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div className={`h-full rounded-full ${cc.progressBg} transition-all duration-300`} style={{ width: `${progress}%` }} />
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
              {project.completed_tasks_count}/{project.tasks_count}
            </span>
          </div>
        </div>
        <span className="material-symbols-outlined text-gray-300 dark:text-gray-600 text-[20px] group-hover/item:text-gray-500 ml-2 shrink-0">
          chevron_right
        </span>
      </button>
    );
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
      <ProjectsHeader
        title={headerTitle}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onBack={handleBack}
      />

      <main className="flex-1 overflow-y-auto pb-24 bg-white dark:bg-background-dark px-3 relative">
        {/* 搜索结果：扁平展示 */}
        {debouncedSearch ? (
          <div className="mt-2">
            {projects.length > 0 ? (
              <div className="space-y-1.5">
                {projects.map(renderProjectCard)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-[48px] mb-4">search_off</span>
                <p className="text-sm">未找到匹配的清单</p>
              </div>
            )}
          </div>
        ) : selectedGroupUid ? (
          /* 分组内浏览 */
          <div className="mt-2">
            {groupedProjects[0]?.projects.length > 0 ? (
              <div className="space-y-1.5">
                {groupedProjects[0].projects.map(renderProjectCard)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-[48px] mb-4">folder_open</span>
                <p className="text-sm">该分组下暂无清单</p>
                <button
                  onClick={handleOpenCreateProject}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  创建清单
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 顶层视图：分组列表 */
          <>
            {groupedProjects.map(({ group, projects: groupProjects }) => (
              <div key={group.uid} className="mt-3">
                {/* 分组标题行 */}
                <div className="flex items-center gap-1 px-1 py-2">
                  {/* 展开/折叠 */}
                  <button
                    onClick={() => toggleGroup(group.uid)}
                    className="flex items-center gap-1.5 flex-1 min-w-0"
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                        expandedGroups.has(group.uid) ? 'rotate-90' : ''
                      }`}
                    >
                      chevron_right
                    </span>
                    <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider truncate">
                      {group.name}
                    </h3>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                      {groupProjects.length}
                    </span>
                  </button>

                  {/* 进入分组 */}
                  <button
                    onClick={() => handleEnterGroup(group.uid)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="进入分组"
                  >
                    <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  </button>

                  {/* 分组操作 */}
                  <button
                    onClick={() => setGroupActionTarget(groupActionTarget?.uid === group.uid ? null : group)}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">more_horiz</span>
                  </button>
                </div>

                {/* 分组操作菜单 */}
                {groupActionTarget?.uid === group.uid && (
                  <div className="mx-1 mb-2 p-1 bg-gray-50 dark:bg-gray-800 rounded-lg flex gap-1">
                    <button
                      onClick={() => handleOpenEditGroup(group)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                      编辑
                    </button>
                    <button
                      onClick={() => { setGroupActionTarget(null); setShowDeleteGroupConfirm(group); }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 text-xs text-red-500 hover:bg-white dark:hover:bg-gray-700 rounded-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                      删除
                    </button>
                  </div>
                )}

                {/* 项目列表 */}
                {expandedGroups.has(group.uid) && (
                  <div className="space-y-1.5">
                    {groupProjects.map(renderProjectCard)}
                  </div>
                )}
              </div>
            ))}

            {/* 新建分组按钮 */}
            <button
              onClick={handleOpenCreateGroup}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 text-sm text-gray-500 dark:text-gray-400 hover:text-primary hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors border border-dashed border-gray-200 dark:border-gray-700"
            >
              <span className="material-symbols-outlined text-[18px]">create_new_folder</span>
              新建分组
            </button>

            {/* 全空状态 */}
            {groups.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <span className="material-symbols-outlined text-[48px] mb-4">list_alt</span>
                <p className="text-sm">暂无清单</p>
                <button
                  onClick={handleOpenCreateGroup}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
                >
                  创建第一个分组
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* FAB */}
      <button
        onClick={handleOpenCreateProject}
        className="fixed bottom-24 right-6 size-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>

      <BottomNav />

      {/* 创建清单 BottomSheet */}
      <BottomSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="新建清单">
        <div className="px-5 py-4 space-y-5">
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
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">描述</label>
            <textarea
              value={newProject.desc}
              onChange={(e) => setNewProject(prev => ({ ...prev, desc: e.target.value }))}
              placeholder="简要描述这个清单..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              分组 <span className="text-red-500">*</span>
            </label>
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
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  <span className="text-[9px]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">颜色</label>
            <div className="flex gap-3 flex-wrap">
              {PRESET_COLORS.map(({ key, bg }) => (
                <button
                  key={key}
                  onClick={() => setNewProject(prev => ({ ...prev, color: key }))}
                  className={`size-8 rounded-full ${bg} transition-all ${
                    newProject.color === key
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-gray-900 dark:ring-white scale-110'
                      : 'hover:scale-110'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 预览 */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
            <div className={`size-10 rounded-lg flex items-center justify-center ${getColorClasses(newProject.color).iconBg} ${getColorClasses(newProject.color).textColor}`}>
              <span className="material-symbols-outlined text-[20px]">{newProject.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{newProject.name || '清单名称'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{newProject.desc || '暂无描述'}</p>
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
