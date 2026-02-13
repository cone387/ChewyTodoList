import React, { useState, useEffect } from 'react';

interface ProjectsHeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onBack?: () => void;
}

const ProjectsHeader: React.FC<ProjectsHeaderProps> = ({ 
  title,
  searchQuery, 
  onSearchChange, 
  onBack,
}) => {
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
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
          <div className="flex items-center gap-3 w-10">
            {onBack ? (
              <button onClick={onBack} className="text-[#5f6368] dark:text-white flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
            ) : (
              <div className="w-5" />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-base font-semibold text-gray-900 dark:text-white truncate max-w-[200px]">{title}</span>
          </div>
          
          <div className="w-10" />
        </div>
      </header>

      {/* 可滑动隐藏的搜索栏 */}
      <div 
        className={`fixed top-0 left-0 right-0 z-20 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto transition-transform duration-300 ${
          isSearchVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}
      >
        <div className="px-3 pb-3 flex items-center gap-2">
          <div className="flex flex-1 items-center rounded-lg bg-[#f0f2f5] dark:bg-[#252f3a] h-10 px-3">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#111418] dark:text-white placeholder-gray-400 ml-2 p-0 focus:outline-none"
              placeholder="搜索清单..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 占位空间 */}
      <div style={{ height: `calc(env(safe-area-inset-top) + 60px + ${isSearchVisible ? '56px' : '0px'})` }}></div>
    </>
  );
};

export default ProjectsHeader;
