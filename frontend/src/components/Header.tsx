import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavViews } from '../hooks/useViews';
import { useLogout, useProfile } from '../hooks/useAuth';
import type { TaskView } from '../types/index';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onViewChange?: (viewUid: string) => void;
  currentView?: string;
  onOpenViewSettings?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onFilter, 
  onViewChange, 
  currentView,
  onOpenViewSettings,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const { data: navViews } = useNavViews();
  const { data: profileData } = useProfile();
  const logout = useLogout();

  // 点击外部关闭用户菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const handleLogout = () => {
    setShowUserMenu(false);
    logout.mutate();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const handleEditView = (view: TaskView) => {
    navigate(`/views/edit/${view.uid}`);
  };

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
            <span className="text-base font-semibold">任务管理</span>
          </div>
          
          <div className="flex items-center justify-end gap-2">
            {/* 当前视图设置按钮 */}
            {onOpenViewSettings && (
              <button 
                onClick={onOpenViewSettings}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center justify-center size-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="编辑当前视图"
              >
                <span className="material-symbols-outlined text-[20px]">edit_note</span>
              </button>
            )}
            
            {/* 用户头像和菜单 */}
            <div className="relative" ref={userMenuRef}>
              <button 
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="size-8 rounded-full bg-gray-200 dark:bg-[#252f3a] flex items-center justify-center relative hover:ring-2 hover:ring-primary/50 transition-all"
              >
                <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px]">
                  person
                </span>
                <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
              </button>

              {/* 用户下拉菜单 */}
              {showUserMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-surface-dark rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  {/* 用户信息 */}
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {profileData?.data?.username || '用户'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {profileData?.data?.email || ''}
                    </p>
                  </div>

                  {/* 菜单项 */}
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      disabled={logout.isPending}
                      className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span>
                      {logout.isPending ? '退出中...' : '退出登录'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 可滑动隐藏的搜索栏 */}
      <div 
        className={`fixed top-0 left-0 right-0 z-20 bg-white dark:bg-surface-dark max-w-md mx-auto transition-transform duration-300 ${
          isSearchVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
        style={{ paddingTop: 'calc(env(safe-area-inset-top) + 60px)' }}
      >
        {/* 搜索栏 */}
        <div className="px-3 pb-2 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800">
          <div className="flex flex-1 items-center rounded-lg bg-[#f0f2f5] dark:bg-[#252f3a] h-9 px-3">
            <span className="material-symbols-outlined text-gray-400 text-[20px]">search</span>
            <input 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-[#111418] dark:text-white placeholder-gray-400 ml-2 p-0 focus:outline-none"
              placeholder="搜索任务..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          <button 
            className="size-9 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center text-purple-600"
            onClick={onFilter}
          >
            <span className="material-symbols-outlined text-[20px]">filter_list</span>
          </button>
        </div>
      </div>

      {/* 固定吸顶的视图栏 */}
      <div 
        className="fixed top-0 left-0 right-0 z-10 bg-white dark:bg-surface-dark border-b border-gray-100 dark:border-gray-800 max-w-md mx-auto"
        style={{ paddingTop: `calc(env(safe-area-inset-top) + 60px + ${isSearchVisible ? '50px' : '0px'})` }}
      >
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 py-2 text-sm font-medium">
          {navViews?.results?.map((view) => (
            <button
              key={view.uid}
              onClick={() => onViewChange?.(view.uid)}
              onDoubleClick={() => handleEditView(view)}
              className={`whitespace-nowrap pb-1 ${
                currentView === view.uid
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {view.name}
            </button>
          ))}
          
          {/* 视图管理按钮 - 固定在最右边 */}
          <button 
            onClick={() => navigate('/views')}
            className="ml-auto whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 pb-1 flex items-center gap-1 sticky right-0 bg-white dark:bg-surface-dark pl-2"
            title="视图管理"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>管理</span>
          </button>
        </div>
      </div>

      {/* 占位空间，防止内容被固定头部遮挡 */}
      <div className="h-36"></div>
    </>
  );
};

export default Header;