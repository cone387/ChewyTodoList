import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useProfile, useLogout } from '../hooks/useAuth';
import { useProjects } from '../hooks/useProjects';
import { useGroups } from '../hooks/useGroups';
import type { Project, Group } from '../types/index';

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProjectUid?: string | null;
  onProjectChange?: (uid: string | null) => void;
}

const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  selectedProjectUid,
  onProjectChange,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(() => {
    return (localStorage.getItem('theme') as 'light' | 'dark' | 'system') || 'system';
  });

  const { data: profileData } = useProfile();
  const { data: projectsData } = useProjects();
  const { data: groupsData } = useGroups();
  const logout = useLogout();

  const projects = projectsData?.results || [];
  const groups = groupsData?.results || [];

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
      } else {
        map.set(project.group.uid, { group: project.group, projects: [project] });
      }
    }
    return Array.from(map.values()).filter(entry => entry.projects.length > 0);
  }, [projects, groups]);

  // 默认展开所有分组
  useEffect(() => {
    if (groupedProjects.length > 0 && expandedGroups.size === 0) {
      setExpandedGroups(new Set(groupedProjects.map(g => g.group.uid)));
    }
  }, [groupedProjects]);

  // 动画控制
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      if (isAnimating) {
        setIsClosing(true);
        setIsAnimating(false);
        const timer = setTimeout(() => {
          setIsClosing(false);
        }, 300);
        return () => clearTimeout(timer);
      }
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setIsAnimating(false);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleNavigate = (path: string) => {
    handleClose();
    setTimeout(() => navigate(path), 100);
  };

  const handleProjectSelect = (uid: string | null) => {
    onProjectChange?.(uid);
    handleClose();
    if (location.pathname !== '/') {
      setTimeout(() => navigate('/'), 100);
    }
  };

  const toggleGroup = (groupUid: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupUid)) {
        next.delete(groupUid);
      } else {
        next.add(groupUid);
      }
      return next;
    });
  };

  // 主题切换
  const applyTheme = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else if (newTheme === 'light') {
      root.classList.remove('dark');
    } else {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  };

  const handleLogout = () => {
    handleClose();
    setTimeout(() => logout.mutate(), 100);
  };

  const getProjectIcon = (project: Project) => {
    return project.style?.icon || 'folder';
  };

  const getProjectColor = (project: Project) => {
    const color = project.style?.color;
    const colorMap: Record<string, string> = {
      purple: 'text-purple-500',
      blue: 'text-blue-500',
      orange: 'text-orange-500',
      green: 'text-green-500',
      pink: 'text-pink-500',
      indigo: 'text-indigo-500',
      teal: 'text-teal-500',
      red: 'text-red-500',
    };
    return colorMap[color] || 'text-gray-500 dark:text-gray-400';
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-colors duration-300 ${
        isAnimating && !isClosing ? 'bg-black/50' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`h-full w-[280px] max-w-[80vw] bg-white dark:bg-surface-dark flex flex-col transform transition-transform duration-300 ease-out shadow-2xl ${
          isAnimating && !isClosing ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 用户信息区 */}
        <div className="pt-safe">
          <div className="px-5 pt-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary text-[24px]">person</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {profileData?.data?.username || '用户'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {profileData?.data?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 可滚动内容区 */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
          {/* 快捷导航 */}
          <div className="py-2">
            <button
              onClick={() => handleProjectSelect(null)}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition-colors ${
                location.pathname === '/' && selectedProjectUid === null
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">home</span>
              <span className="text-sm font-medium">全部任务</span>
            </button>

            <button
              onClick={() => handleProjectSelect('inbox')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition-colors ${
                selectedProjectUid === 'inbox'
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">inbox</span>
              <span className="text-sm font-medium">收集箱</span>
            </button>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

          {/* 快捷入口 */}
          <div className="py-2">
            <button
              onClick={() => handleNavigate('/projects')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition-colors ${
                location.pathname.startsWith('/projects')
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">list_alt</span>
              <span className="text-sm font-medium">清单管理</span>
            </button>

            <button
              onClick={() => handleNavigate('/views')}
              className={`w-full flex items-center gap-3 px-5 py-2.5 transition-colors ${
                location.pathname.startsWith('/views')
                  ? 'bg-primary/10 text-primary'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              <span className="text-sm font-medium">视图管理</span>
            </button>

            <button
              className="w-full flex items-center gap-3 px-5 py-2.5 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              disabled
            >
              <span className="material-symbols-outlined text-[20px]">label</span>
              <span className="text-sm font-medium">标签管理</span>
              <span className="ml-auto text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded">
                即将推出
              </span>
            </button>
          </div>

          <div className="h-px bg-gray-100 dark:bg-gray-700 mx-4" />

          {/* 清单列表（按分组折叠） */}
          <div className="py-2">
            <div className="px-5 py-1.5 flex items-center justify-between">
              <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                我的清单
              </span>
            </div>

            {groupedProjects.map(({ group, projects: groupProjects }) => (
              <div key={group.uid}>
                {/* 分组标题 */}
                <button
                  onClick={() => toggleGroup(group.uid)}
                  className="w-full flex items-center gap-2 px-5 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <span
                    className={`material-symbols-outlined text-[16px] transition-transform duration-200 ${
                      expandedGroups.has(group.uid) ? 'rotate-90' : ''
                    }`}
                  >
                    chevron_right
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {group.name}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">
                    {groupProjects.length}
                  </span>
                </button>

                {/* 项目列表 */}
                {expandedGroups.has(group.uid) && (
                  <div>
                    {groupProjects.map(project => (
                      <button
                        key={project.uid}
                        onClick={() => handleProjectSelect(project.uid)}
                        className={`w-full flex items-center gap-3 pl-10 pr-5 py-2 transition-colors ${
                          selectedProjectUid === project.uid
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span className={`material-symbols-outlined text-[18px] ${
                          selectedProjectUid === project.uid ? 'text-primary' : getProjectColor(project)
                        }`}>
                          {getProjectIcon(project)}
                        </span>
                        <span className="text-sm font-medium truncate flex-1 text-left">
                          {project.name}
                        </span>
                        {project.tasks_count > 0 && (
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums">
                            {project.tasks_count}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {groupedProjects.length === 0 && (
              <div className="px-5 py-4 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500">暂无清单</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部区域 */}
        <div className="border-t border-gray-100 dark:border-gray-700 pb-safe">
          {/* 主题切换 */}
          <div className="px-5 py-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px]">
              {theme === 'dark' ? 'dark_mode' : theme === 'light' ? 'light_mode' : 'contrast'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mr-auto">主题</span>
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {([
                { key: 'light' as const, icon: 'light_mode' },
                { key: 'system' as const, icon: 'contrast' },
                { key: 'dark' as const, icon: 'dark_mode' },
              ]).map(opt => (
                <button
                  key={opt.key}
                  onClick={() => applyTheme(opt.key)}
                  className={`p-1.5 rounded-md transition-colors ${
                    theme === opt.key
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-primary'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                  title={opt.key === 'light' ? '浅色' : opt.key === 'dark' ? '深色' : '跟随系统'}
                >
                  <span className="material-symbols-outlined text-[16px]">{opt.icon}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            disabled={logout.isPending}
            className="w-full flex items-center gap-3 px-5 py-3 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span className="text-sm font-medium">
              {logout.isPending ? '退出中...' : '退出登录'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrawerMenu;
