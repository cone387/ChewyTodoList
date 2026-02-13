import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../hooks/useProjects';
import { useGroups, useCreateGroup, useUpdateGroup, useDeleteGroup } from '../hooks/useGroups';
import BottomNav from '../components/BottomNav';
import BottomSheet from '../components/BottomSheet';
import type { Project, Group } from '../types/index';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// 格式化时间
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'MM/dd', { locale: zhCN });
  } catch {
    return '';
  }
};

// 可拖拽的清单卡片组件
interface SortableProjectCardProps {
  project: Project;
  isLast: boolean;
  onNavigate: (uid: string) => void;
  onMenuClick: (e: React.MouseEvent, project: Project) => void;
}

const SortableProjectCard: React.FC<SortableProjectCardProps> = ({ project, isLast, onNavigate, onMenuClick }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: project.uid });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { icon, color } = getProjectStyle(project);
  const cc = getColorClasses(color);
  const progress = project.tasks_count > 0
    ? Math.round((project.completed_tasks_count / project.tasks_count) * 100)
    : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center px-4 py-3 bg-white dark:bg-surface-dark hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group/item ${
        !isLast ? 'border-b border-gray-100 dark:border-gray-800' : ''
      }`}
    >
      {/* 拖拽手柄 */}
      <div {...attributes} {...listeners} className="mr-2 cursor-grab active:cursor-grabbing touch-none">
        <span className="material-symbols-outlined text-[18px] text-gray-300 dark:text-gray-600">drag_indicator</span>
      </div>

      {/* 点击进入清单 */}
      <button onClick={() => onNavigate(project.uid)} className="flex-1 flex items-center min-w-0">
        <div className={`size-10 rounded-xl ${cc.iconBg} flex items-center justify-center ${cc.textColor} mr-3 shrink-0`}>
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{project.name}</h4>
            <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums shrink-0">
              {project.completed_tasks_count}/{project.tasks_count}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-1 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
              <div className={`h-full rounded-full ${cc.progressBg} transition-all duration-300`} style={{ width: `${progress}%` }} />
            </div>
            {project.updated_at && (
              <span className="text-[10px] text-gray-400 shrink-0">更新 {formatDate(project.updated_at)}</span>
            )}
          </div>
        </div>
      </button>

      {/* 更多菜单 */}
      <button
        onClick={(e) => onMenuClick(e, project)}
        className="ml-2 size-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors opacity-0 group-hover/item:opacity-100"
      >
        <span className="material-symbols-outlined text-[18px]">more_vert</span>
      </button>
    </div>
  );
};

// 可拖拽的分组组件
interface SortableGroupProps {
  group: Group;
  projects: Project[];
  isExpanded: boolean;
  onToggle: () => void;
  onMenuClick: (e: React.MouseEvent, group: Group) => void;
  onProjectNavigate: (uid: string) => void;
  onProjectMenuClick: (e: React.MouseEvent, project: Project) => void;
  onProjectDragEnd: (groupUid: string, activeId: string, overId: string) => void;
}

const SortableGroup: React.FC<SortableGroupProps> = ({
  group,
  projects,
  isExpanded,
  onToggle,
  onMenuClick,
  onProjectNavigate,
  onProjectMenuClick,
  onProjectDragEnd,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: group.uid });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleProjectDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onProjectDragEnd(group.uid, active.id as string, over.id as string);
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-white dark:bg-surface-dark rounded-2xl overflow-hidden shadow-sm">
      {/* 分组标题 */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* 左侧：拖拽手柄 + 分组名 */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div {...attributes} {...listeners} className="flex items-center cursor-grab active:cursor-grabbing touch-none">
            <span className="material-symbols-outlined text-[18px] text-gray-300 dark:text-gray-600 leading-none">drag_indicator</span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-none">
            {group.name}
          </h3>
          <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded-full shrink-0 leading-none">
            {projects.length}
          </span>
        </div>

        {/* 右侧：更多菜单 + 折叠按钮 */}
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => onMenuClick(e, group)}
            className="size-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">more_horiz</span>
          </button>
          <button
            onClick={onToggle}
            className="size-8 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              expand_more
            </span>
          </button>
        </div>
      </div>

      {/* 清单列表 */}
      {isExpanded && (
        <div className="border-t border-gray-100 dark:border-gray-800">
          {projects.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleProjectDragEnd}>
              <SortableContext items={projects.map(p => p.uid)} strategy={verticalListSortingStrategy}>
                {projects.map((project, idx) => (
                  <SortableProjectCard
                    key={project.uid}
                    project={project}
                    isLast={idx === projects.length - 1}
                    onNavigate={onProjectNavigate}
                    onMenuClick={onProjectMenuClick}
                  />
                ))}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="py-6 text-center text-gray-400">
              <p className="text-xs">暂无清单</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();

  // 折叠状态
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
  const [activeGroupMenu, setActiveGroupMenu] = useState<{ group: Group; position: { x: number; y: number } } | null>(null);

  // 清单菜单
  const [activeProjectMenu, setActiveProjectMenu] = useState<{ project: Project; position: { x: number; y: number } } | null>(null);
  const [showDeleteProjectConfirm, setShowDeleteProjectConfirm] = useState<Project | null>(null);
  const [deleteProjectError, setDeleteProjectError] = useState('');

  // 数据
  const { data: projectsResponse } = useProjects();
  const { data: groupsData } = useGroups();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const createGroup = useCreateGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();

  const projects = projectsResponse?.results || [];
  const groups = groupsData?.results || [];

  // 拖拽传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // 获取默认分组
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
      setShowAddMenu(false);
      setActiveGroupMenu(null);
      setActiveProjectMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  // 分组拖拽结束
  const handleGroupDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = groups.findIndex(g => g.uid === active.id);
      const newIndex = groups.findIndex(g => g.uid === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        // 计算新的 sort_order
        const newOrder = arrayMove(groups, oldIndex, newIndex);
        const targetGroup = groups[oldIndex];
        let newSortOrder: number;
        if (newIndex === 0) {
          newSortOrder = (newOrder[1]?.sort_order || 0) - 1;
        } else if (newIndex === newOrder.length - 1) {
          newSortOrder = (newOrder[newOrder.length - 2]?.sort_order || 0) + 1;
        } else {
          const prev = newOrder[newIndex - 1]?.sort_order || 0;
          const next = newOrder[newIndex + 1]?.sort_order || 0;
          newSortOrder = (prev + next) / 2;
        }
        updateGroup.mutate({ uid: targetGroup.uid, data: { sort_order: newSortOrder } });
      }
    }
  };

  // 清单拖拽结束
  const handleProjectDragEnd = (groupUid: string, activeId: string, overId: string) => {
    const groupProjects = projects.filter(p => p.group.uid === groupUid);
    const oldIndex = groupProjects.findIndex(p => p.uid === activeId);
    const newIndex = groupProjects.findIndex(p => p.uid === overId);
    if (oldIndex !== -1 && newIndex !== -1) {
      const newOrder = arrayMove(groupProjects, oldIndex, newIndex);
      const targetProject = groupProjects[oldIndex];
      let newSortOrder: number;
      if (newIndex === 0) {
        newSortOrder = (newOrder[1]?.sort_order || 0) - 1;
      } else if (newIndex === newOrder.length - 1) {
        newSortOrder = (newOrder[newOrder.length - 2]?.sort_order || 0) + 1;
      } else {
        const prev = newOrder[newIndex - 1]?.sort_order || 0;
        const next = newOrder[newIndex + 1]?.sort_order || 0;
        newSortOrder = (prev + next) / 2;
      }
      updateProject.mutate({ uid: targetProject.uid, data: { sort_order: newSortOrder } });
    }
  };

  // 创建清单
  const handleOpenCreateProject = useCallback(() => {
    const targetGroupUid = defaultGroup?.uid || '';
    setNewProject({ name: '', desc: '', group_uid: targetGroupUid, icon: 'folder', color: 'blue' });
    setShowAddMenu(false);
    setShowCreateSheet(true);
  }, [defaultGroup]);

  const handleSubmitCreate = () => {
    if (!newProject.name.trim() || !newProject.group_uid) return;
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
      onSuccess: () => setShowDeleteGroupConfirm(null),
      onError: (error: any) => setDeleteGroupError(error?.response?.data?.error?.message || '删除失败'),
    });
  };

  const handleDeleteProject = (project: Project) => {
    setDeleteProjectError('');
    deleteProject.mutate(project.uid, {
      onSuccess: () => setShowDeleteProjectConfirm(null),
      onError: (error: any) => setDeleteProjectError(error?.response?.data?.error?.message || '删除失败'),
    });
  };

  const handleGroupMenuClick = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setActiveGroupMenu({ group, position: { x: rect.right, y: rect.bottom } });
    setActiveProjectMenu(null);
  };

  const handleProjectMenuClick = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setActiveProjectMenu({ project, position: { x: rect.right, y: rect.bottom } });
    setActiveGroupMenu(null);
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-gray-50 dark:bg-background-dark overflow-hidden">
      {/* 顶部Header */}
      <header className="sticky top-0 z-30 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-10"></div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">清单</h1>
          <div className="relative w-10 flex justify-end">
            <button
              onClick={(e) => { e.stopPropagation(); setShowAddMenu(!showAddMenu); }}
              className="size-9 flex items-center justify-center text-primary hover:bg-primary/10 rounded-lg transition-colors"
            >
              <span className="material-symbols-outlined text-[24px]">add</span>
            </button>
            {showAddMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 animate-fade-in">
                <button onClick={handleOpenCreateProject} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-primary">list_alt</span>
                  新建清单
                </button>
                <button onClick={handleOpenCreateGroup} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-orange-500">create_new_folder</span>
                  新建分组
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20 px-4">
        <div className="mt-3 space-y-3">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleGroupDragEnd}>
            <SortableContext items={groups.map(g => g.uid)} strategy={verticalListSortingStrategy}>
              {groupedProjects.map(({ group, projects: groupProjects }) => (
                <SortableGroup
                  key={group.uid}
                  group={group}
                  projects={groupProjects}
                  isExpanded={expandedGroups.has(group.uid)}
                  onToggle={() => toggleGroup(group.uid)}
                  onMenuClick={handleGroupMenuClick}
                  onProjectNavigate={(uid) => navigate(`/projects/${uid}`)}
                  onProjectMenuClick={handleProjectMenuClick}
                  onProjectDragEnd={handleProjectDragEnd}
                />
              ))}
            </SortableContext>
          </DndContext>

          {groups.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="size-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <span className="material-symbols-outlined text-[32px] text-gray-300">folder_off</span>
              </div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">还没有任何分组</p>
              <p className="text-xs text-gray-400 mt-1">点击右上角"+"创建分组</p>
            </div>
          )}
        </div>
      </main>

      <BottomNav />

      {/* 分组弹出菜单 */}
      {activeGroupMenu && (
        <div
          className="fixed z-50 w-36 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-fade-in"
          style={{ top: activeGroupMenu.position.y, left: activeGroupMenu.position.x - 144 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={() => handleOpenEditGroup(activeGroupMenu.group)} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">edit</span>
            编辑分组
          </button>
          <button
            onClick={() => { setShowDeleteGroupConfirm(activeGroupMenu.group); setActiveGroupMenu(null); }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            删除分组
          </button>
        </div>
      )}

      {/* 清单弹出菜单 */}
      {activeProjectMenu && (
        <div
          className="fixed z-50 w-36 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 animate-fade-in"
          style={{ top: activeProjectMenu.position.y, left: activeProjectMenu.position.x - 144 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => { navigate(`/projects/${activeProjectMenu.project.uid}`); setActiveProjectMenu(null); }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            打开清单
          </button>
          <button
            onClick={() => { setShowDeleteProjectConfirm(activeProjectMenu.project); setActiveProjectMenu(null); }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
            删除清单
          </button>
        </div>
      )}

      {/* 创建清单 BottomSheet */}
      <BottomSheet isOpen={showCreateSheet} onClose={() => setShowCreateSheet(false)} title="新建清单">
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">名称 <span className="text-red-500">*</span></label>
            <input type="text" value={newProject.name} onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))} placeholder="输入清单名称..." className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">分组</label>
            <select value={newProject.group_uid} onChange={(e) => setNewProject(prev => ({ ...prev, group_uid: e.target.value }))} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary">
              {groups.map(group => (<option key={group.uid} value={group.uid}>{group.name}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">图标</label>
            <div className="grid grid-cols-6 gap-2">
              {PRESET_ICONS.map(({ icon, label }) => (
                <button key={icon} onClick={() => setNewProject(prev => ({ ...prev, icon }))} className={`flex flex-col items-center gap-0.5 p-2 rounded-lg transition-colors ${newProject.icon === icon ? 'bg-primary/10 text-primary ring-1 ring-primary' : 'bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
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
                <button key={key} onClick={() => setNewProject(prev => ({ ...prev, color: key }))} className={`size-7 rounded-full ${bg} transition-all ${newProject.color === key ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-dark ring-gray-900 dark:ring-white scale-110' : 'hover:scale-110'}`} />
              ))}
            </div>
          </div>
          <button onClick={handleSubmitCreate} disabled={!newProject.name.trim() || !newProject.group_uid} className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">创建清单</button>
        </div>
      </BottomSheet>

      {/* 分组管理 BottomSheet */}
      <BottomSheet isOpen={showGroupSheet} onClose={() => setShowGroupSheet(false)} title={editingGroup ? '编辑分组' : '新建分组'}>
        <div className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">分组名称 <span className="text-red-500">*</span></label>
            <input type="text" value={groupFormName} onChange={(e) => setGroupFormName(e.target.value)} placeholder="输入分组名称..." className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">描述</label>
            <textarea value={groupFormDesc} onChange={(e) => setGroupFormDesc(e.target.value)} placeholder="简要描述这个分组..." rows={2} className="w-full px-3 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none" />
          </div>
          <button onClick={handleSubmitGroup} disabled={!groupFormName.trim()} className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">{editingGroup ? '保存修改' : '创建分组'}</button>
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
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">确定要删除「{showDeleteGroupConfirm.name}」吗？分组下有清单时无法删除。</p>
            {deleteGroupError && <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">{deleteGroupError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowDeleteGroupConfirm(null); setDeleteGroupError(''); }} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">取消</button>
              <button onClick={() => handleDeleteGroup(showDeleteGroupConfirm)} disabled={deleteGroup.isPending} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">{deleteGroup.isPending ? '删除中...' : '确定删除'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除清单确认 */}
      {showDeleteProjectConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark rounded-2xl p-5 animate-scale-in">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <span className="material-symbols-outlined text-red-500 text-[22px]">warning</span>
              </div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">删除清单</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">确定要删除「{showDeleteProjectConfirm.name}」吗？此操作无法撤销。</p>
            {deleteProjectError && <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">{deleteProjectError}</p>}
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setShowDeleteProjectConfirm(null); setDeleteProjectError(''); }} className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium">取消</button>
              <button onClick={() => handleDeleteProject(showDeleteProjectConfirm)} disabled={deleteProject.isPending} className="flex-1 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium disabled:opacity-50">{deleteProject.isPending ? '删除中...' : '确定删除'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsPage;
