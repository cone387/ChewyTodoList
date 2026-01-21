import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '../hooks/useProjects';
import { useTasks } from '../hooks/useTasks';
import { isToday, parseISO } from 'date-fns';

const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: projectsResponse } = useProjects();
  const { data: tasksResponse } = useTasks();

  const projects = projectsResponse?.results || [];
  const tasks = tasksResponse?.results || [];

  // 获取项目的图标和颜色
  const getProjectIcon = (project: any) => {
    const icons = ['work', 'person', 'shopping_cart', 'flight', 'fitness_center', 'book', 'home', 'school'];
    const colors = ['purple', 'blue', 'orange', 'green', 'pink', 'indigo', 'teal', 'red'];
    
    // 根据项目名称生成一致的图标和颜色
    const iconIndex = project.name.length % icons.length;
    const colorIndex = project.uid.length % colors.length;
    
    return {
      icon: project.style?.icon || icons[iconIndex],
      color: colors[colorIndex]
    };
  };

  // 获取项目的任务统计
  const getProjectStats = (projectUid: string) => {
    const projectTasks = tasks.filter(task => task.project.uid === projectUid);
    const todayTasks = projectTasks.filter(task => {
      if (task.due_date) {
        return isToday(parseISO(task.due_date));
      }
      if (task.start_date) {
        return isToday(parseISO(task.start_date));
      }
      return false;
    });
    
    return {
      totalTasks: projectTasks.length,
      todayTasks: todayTasks.length,
      completedTasks: projectTasks.filter(task => task.is_completed).length
    };
  };

  // 获取颜色样式类
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { bg: string; iconBg: string; textColor: string; badgeBg: string } } = {
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        iconBg: 'bg-purple-100 dark:bg-purple-800/50',
        textColor: 'text-purple-600 dark:text-purple-300',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      },
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        iconBg: 'bg-blue-100 dark:bg-blue-800/50',
        textColor: 'text-blue-600 dark:text-blue-300',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      },
      orange: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        iconBg: 'bg-orange-100 dark:bg-orange-900/30',
        textColor: 'text-orange-500',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      },
      green: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        iconBg: 'bg-green-100 dark:bg-green-900/30',
        textColor: 'text-green-500',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      },
      pink: {
        bg: 'bg-pink-100 dark:bg-pink-900/30',
        iconBg: 'bg-pink-100 dark:bg-pink-900/30',
        textColor: 'text-pink-500',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      },
      indigo: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        iconBg: 'bg-indigo-100 dark:bg-indigo-900/30',
        textColor: 'text-indigo-500',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      },
      teal: {
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        iconBg: 'bg-teal-100 dark:bg-teal-900/30',
        textColor: 'text-teal-600',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      },
      red: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        iconBg: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-500',
        badgeBg: 'bg-white/50 dark:bg-black/20'
      }
    };
    
    return colorMap[color] || colorMap.blue;
  };

  // 筛选项目
  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.desc?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 分组项目
  const favoriteProjects = filteredProjects.slice(0, 2); // 前两个作为收藏
  const myProjects = filteredProjects.slice(2); // 其余作为我的清单

  const handleProjectClick = (projectUid: string) => {
    // TODO: 跳转到项目详情页面或筛选任务
    navigate(`/?project=${projectUid}`);
  };

  const handleCreateProject = () => {
    // TODO: 实现创建项目功能
    console.log('Create project clicked');
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-white dark:bg-surface-dark shadow-xl overflow-hidden">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white dark:bg-surface-dark pt-safe">
        <div className="flex items-center p-3 justify-between">
          <div className="flex items-center gap-3">
            <button className="text-[#5f6368] dark:text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">menu</span>
            </button>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold">清单</span>
          </div>
          
          <div className="flex items-center justify-end">
            <div className="size-8 rounded-full bg-[#1c2630] text-white flex items-center justify-center text-xs font-medium relative">
              U
              <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white dark:border-[#1c2630]"></div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-3 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg bg-[#f0f2f5] dark:bg-[#252f3a] h-10 px-3">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#111418] dark:text-white placeholder-gray-400 ml-2 p-0 focus:outline-none"
              placeholder="搜索清单..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleCreateProject}
            className="size-10 rounded-lg bg-gray-50 dark:bg-[#252f3a] text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-24 bg-white dark:bg-background-dark px-3 relative">
        {/* Favorites Section */}
        {favoriteProjects.length > 0 && (
          <div className="mt-2">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              收藏
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {favoriteProjects.map((project) => {
                const { icon, color } = getProjectIcon(project);
                const colorClasses = getColorClasses(color);
                const stats = getProjectStats(project.uid);
                
                return (
                  <button
                    key={project.uid}
                    onClick={() => handleProjectClick(project.uid)}
                    className={`flex flex-col p-3 rounded-xl ${colorClasses.bg} text-left hover:opacity-80 transition-opacity`}
                  >
                    <div className="flex justify-between items-start w-full mb-2">
                      <div className={`size-8 rounded-full ${colorClasses.iconBg} flex items-center justify-center ${colorClasses.textColor}`}>
                        <span className="material-symbols-outlined text-[20px]">{icon}</span>
                      </div>
                      <span className={`text-xs font-medium ${colorClasses.textColor} ${colorClasses.badgeBg} px-1.5 py-0.5 rounded`}>
                        {stats.totalTasks}
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {project.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {stats.todayTasks > 0 ? `${stats.todayTasks} 个今日任务` : project.desc || '暂无描述'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* My Lists Section */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            我的清单
          </h3>
          <div className="space-y-1">
            {myProjects.map((project) => {
              const { icon, color } = getProjectIcon(project);
              const colorClasses = getColorClasses(color);
              const stats = getProjectStats(project.uid);
              
              return (
                <button
                  key={project.uid}
                  onClick={() => handleProjectClick(project.uid)}
                  className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className={`size-10 rounded-lg ${colorClasses.iconBg} flex items-center justify-center ${colorClasses.textColor} mr-3`}>
                    <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {project.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {stats.totalTasks > 0 ? `${stats.totalTasks} 个任务` : project.desc || '暂无任务'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {stats.totalTasks > 0 && (
                      <div className="flex -space-x-2">
                        <div className="size-6 rounded-full bg-gray-200 border-2 border-white dark:border-surface-dark"></div>
                        {stats.completedTasks > 0 && (
                          <div className="size-6 rounded-full bg-green-400 border-2 border-white dark:border-surface-dark"></div>
                        )}
                      </div>
                    )}
                    <span className="material-symbols-outlined text-gray-300 text-[20px] group-hover:text-gray-500">
                      chevron_right
                    </span>
                  </div>
                </button>
              );
            })}

            {/* Archive Item */}
            <button className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 mr-3">
                <span className="material-symbols-outlined text-[20px]">archive</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">已归档</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tasks.filter(task => task.is_completed).length} 个已完成任务
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-gray-300 text-[20px] group-hover:text-gray-500">
                  chevron_right
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Shared Section */}
        <div className="mt-6">
          <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
            与我共享
          </h3>
          <div className="space-y-1">
            <button className="w-full flex items-center p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <div className="size-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 mr-3">
                <span className="material-symbols-outlined text-[20px]">group</span>
              </div>
              <div className="flex-1 text-left">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">团队协作</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">来自团队的更新</p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2 mr-1">
                  <div className="size-6 rounded-full bg-blue-400 text-[8px] flex items-center justify-center text-white border-2 border-white dark:border-surface-dark">
                    A
                  </div>
                  <div className="size-6 rounded-full bg-purple-400 text-[8px] flex items-center justify-center text-white border-2 border-white dark:border-surface-dark">
                    B
                  </div>
                  <div className="size-6 rounded-full bg-gray-200 text-[8px] flex items-center justify-center text-gray-600 border-2 border-white dark:border-surface-dark">
                    +2
                  </div>
                </div>
                <span className="material-symbols-outlined text-gray-300 text-[20px] group-hover:text-gray-500">
                  chevron_right
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <span className="material-symbols-outlined text-[48px] mb-4">list_alt</span>
            <p className="text-sm">
              {searchQuery ? '未找到匹配的清单' : '暂无清单'}
            </p>
            {!searchQuery && (
              <button 
                onClick={handleCreateProject}
                className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
              >
                创建第一个清单
              </button>
            )}
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <button 
        onClick={handleCreateProject}
        className="fixed bottom-20 right-6 size-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform z-30"
      >
        <span className="material-symbols-outlined text-[32px]">add</span>
      </button>

      {/* Bottom Navigation */}
      <nav className="bg-white dark:bg-surface-dark border-t border-[#e5e7eb] dark:border-[#2a3441] flex items-center justify-around h-16 pb-safe absolute bottom-0 w-full z-20">
        <button 
          onClick={() => navigate('/')}
          className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 transition-colors gap-1"
        >
          <span className="material-symbols-outlined text-[24px]">home</span>
          <span className="text-[10px] font-medium">任务</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-[#111418] dark:text-white gap-1">
          <span className="material-symbols-outlined fill-1 text-[24px]">list_alt</span>
          <span className="text-[10px] font-medium">清单</span>
        </button>
        <button className="flex flex-col items-center justify-center w-full h-full text-gray-400 hover:text-gray-600 transition-colors gap-1">
          <div className="relative">
            <span className="material-symbols-outlined text-[24px]">inbox</span>
          </div>
          <span className="text-[10px] font-medium">通知</span>
        </button>
      </nav>
    </div>
  );
};

export default ProjectsPage;