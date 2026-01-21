import React, { useState, useEffect } from 'react';

interface ProjectsHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateProject: () => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ 
  searchQuery, 
  onSearchChange, 
  onCreateProject 
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // 向下滚动时隐藏搜索栏，向上滚动时显示
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsSearchVisible(false);
      } else if (currentScrollY < lastScrollY) {
        setIsSearchVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* 固定顶部导航栏 */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto">
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
      </header>

      {/* 可滑动隐藏的搜索栏 */}
      <div 
        className={`fixed top-0 left-0 right-0 z-20 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto transition-transform duration-300 ${
          isSearchVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}
      >
        {/* 搜索栏 */}
        <div className="px-3 pb-3 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg bg-[#f0f2f5] dark:bg-[#252f3a] h-10 px-3">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#111418] dark:text-white placeholder-gray-400 ml-2 p-0 focus:outline-none"
              placeholder="搜索清单..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
          <button 
            onClick={onCreateProject}
            className="size-10 rounded-lg bg-gray-50 dark:bg-[#252f3a] text-gray-600 dark:text-gray-300 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
        </div>
      </div>

      {/* 占位空间，防止内容被固定头部遮挡 */}
      <div className="h-20" style={{ height: `calc(env(safe-area-inset-top) + 60px + ${isSearchVisible ? '64px' : '0px'})` }}></div>
    </>
  );
};

export default ProjectsHeader;