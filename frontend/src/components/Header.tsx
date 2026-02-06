import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavViews } from '../hooks/useViews';
import { useLogout, useProfile } from '../hooks/useAuth';
import type { TaskView } from '../types/index';

// 显示设置类型
interface DisplaySettings {
  show_completed: boolean;
  show_project: boolean;
  show_tags: boolean;
  show_due_date: boolean;
  show_priority: boolean;
  show_status: boolean;
  compact_mode: boolean;
}

interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
  onViewChange?: (viewUid: string) => void;
  currentView?: string;
  onOpenViewSettings?: () => void;
  // 过滤栏相关
  showFilterBar?: boolean;
  onToggleFilterBar?: () => void;
  // 排序设置
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (field: string, direction: 'asc' | 'desc') => void;
  // 分组设置
  groupBy?: string;
  onGroupByChange?: (field: string) => void;
  // 显示设置
  displaySettings?: DisplaySettings;
  onDisplaySettingsChange?: (settings: Partial<DisplaySettings>) => void;
}

const defaultDisplaySettings: DisplaySettings = {
  show_completed: false,
  show_project: true,
  show_tags: true,
  show_due_date: true,
  show_priority: true,
  show_status: true,
  compact_mode: false,
};

const Header: React.FC<HeaderProps> = ({ 
  onSearch, 
  onFilter, 
  onViewChange, 
  currentView,
  onOpenViewSettings,
  showFilterBar = false,
  onToggleFilterBar,
  sortField = '',
  sortDirection = 'desc',
  onSortChange,
  groupBy = '',
  onGroupByChange,
  displaySettings = defaultDisplaySettings,
  onDisplaySettingsChange,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<'sort' | 'group' | 'display' | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const filterBarRef = useRef<HTMLDivElement>(null);

  const { data: navViews } = useNavViews();
  const { data: profileData } = useProfile();
  const logout = useLogout();

  // 点击外部关闭用户菜单和下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (filterBarRef.current && !filterBarRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };

    if (showUserMenu || activeDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu, activeDropdown]);

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
          
          {/* 右侧固定按钮组 */}
          <div className="ml-auto flex items-center gap-2 sticky right-0 bg-white dark:bg-surface-dark pl-2">
            {/* 过滤按钮 */}
            <button 
              onClick={onToggleFilterBar}
              className={`whitespace-nowrap pb-1 flex items-center gap-0.5 transition-colors ${
                showFilterBar 
                  ? 'text-primary' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="过滤设置"
            >
              <span className="material-symbols-outlined text-[16px]">filter_alt</span>
              <span>过滤</span>
            </button>
            
            {/* 视图管理按钮 */}
            <button 
              onClick={() => navigate('/views')}
              className="whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 pb-1 flex items-center gap-1"
              title="视图管理"
            >
              <span className="material-symbols-outlined text-[16px]">tune</span>
              <span>管理</span>
            </button>
          </div>
        </div>

        {/* 过滤栏 */}
        {showFilterBar && (
          <div className="border-t border-gray-100 dark:border-gray-700" ref={filterBarRef}>
            {/* 过滤选项行 */}
            <div className="flex items-center text-xs">
              {/* 排序设置 */}
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'sort' ? null : 'sort')}
                className={`flex-1 flex items-center justify-center gap-0.5 py-2 ${activeDropdown === 'sort' ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <span>排序：{sortField ? (
                  sortField === 'created_at' ? '创建时间' :
                  sortField === 'updated_at' ? '更新时间' :
                  sortField === 'due_date' ? '截止时间' :
                  sortField === 'priority' ? '优先级' :
                  sortField === 'title' ? '标题' : '默认'
                ) : '默认'}</span>
                {sortField && (
                  <span className="material-symbols-outlined text-[14px]">
                    {sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                )}
                <span className="material-symbols-outlined text-[14px]">
                  {activeDropdown === 'sort' ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* 分组设置 */}
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'group' ? null : 'group')}
                className={`flex-1 flex items-center justify-center gap-0.5 py-2 ${activeDropdown === 'group' ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <span>分组：{groupBy ? (
                  groupBy === 'status' ? '状态' :
                  groupBy === 'priority' ? '优先级' :
                  groupBy === 'project' ? '清单' :
                  groupBy === 'due_date' ? '截止日期' : '无'
                ) : '无'}</span>
                <span className="material-symbols-outlined text-[14px]">
                  {activeDropdown === 'group' ? 'expand_less' : 'expand_more'}
                </span>
              </button>

              {/* 显示设置 */}
              <button
                onClick={() => setActiveDropdown(activeDropdown === 'display' ? null : 'display')}
                className={`flex-1 flex items-center justify-center gap-0.5 py-2 ${activeDropdown === 'display' ? 'text-primary' : 'text-gray-600 dark:text-gray-300'}`}
              >
                <span>显示</span>
                <span className="material-symbols-outlined text-[14px]">
                  {activeDropdown === 'display' ? 'expand_less' : 'expand_more'}
                </span>
              </button>
            </div>

            {/* 排序下拉选项 */}
            {activeDropdown === 'sort' && (
              <div className="border-t border-gray-50 dark:border-gray-800">
                {[
                  { value: '', label: '默认排序' },
                  { value: 'created_at', label: '创建时间' },
                  { value: 'updated_at', label: '更新时间' },
                  { value: 'due_date', label: '截止时间' },
                  { value: 'priority', label: '优先级' },
                  { value: 'title', label: '标题' },
                ].map((option) => (
                  <div
                    key={option.value}
                    className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                  >
                    {/* 点击选项名称：选中并关闭弹窗 */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onSortChange?.(option.value, sortDirection);
                        setTimeout(() => setActiveDropdown(null), 0);
                      }}
                      className={`flex items-center gap-2 ${sortField === option.value ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}`}
                    >
                      {sortField === option.value && (
                        <span className="material-symbols-outlined text-primary text-[16px]">check</span>
                      )}
                      <span>{option.label}</span>
                    </button>
                    
                    {/* 排序方式按钮：点击选中排序字段和方式，然后关闭弹窗 */}
                    {option.value && (
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSortChange?.(option.value, 'asc');
                            setTimeout(() => setActiveDropdown(null), 0);
                          }}
                          className={`px-2 py-1 rounded ${
                            sortField === option.value && sortDirection === 'asc'
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          正序
                        </button>
                        <span className="text-gray-300 dark:text-gray-600">|</span>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onSortChange?.(option.value, 'desc');
                            setTimeout(() => setActiveDropdown(null), 0);
                          }}
                          className={`px-2 py-1 rounded ${
                            sortField === option.value && sortDirection === 'desc'
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          倒序
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* 分组下拉选项 */}
            {activeDropdown === 'group' && (
              <div className="border-t border-gray-50 dark:border-gray-800">
                {[
                  { value: '', label: '不分组' },
                  { value: 'status', label: '按状态' },
                  { value: 'priority', label: '按优先级' },
                  { value: 'project', label: '按清单' },
                  { value: 'due_date', label: '按截止日期' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      onGroupByChange?.(option.value);
                      setActiveDropdown(null);
                    }}
                    className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 last:border-b-0"
                  >
                    <span className={groupBy === option.value ? 'text-primary' : 'text-gray-700 dark:text-gray-200'}>
                      {option.label}
                    </span>
                    {groupBy === option.value && (
                      <span className="material-symbols-outlined text-primary text-[18px]">check</span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* 显示设置下拉选项 */}
            {activeDropdown === 'display' && (
              <div className="border-t border-gray-50 dark:border-gray-800">
                <label className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-200">已完成任务</span>
                  <input
                    type="checkbox"
                    checked={displaySettings.show_completed}
                    onChange={(e) => onDisplaySettingsChange?.({ show_completed: e.target.checked })}
                    className="size-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary cursor-pointer"
                  />
                </label>
                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>
                <label className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-200">项目/清单</span>
                  <input
                    type="checkbox"
                    checked={displaySettings.show_project}
                    onChange={(e) => onDisplaySettingsChange?.({ show_project: e.target.checked })}
                    className="size-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary cursor-pointer"
                  />
                </label>
                <label className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-200">标签</span>
                  <input
                    type="checkbox"
                    checked={displaySettings.show_tags}
                    onChange={(e) => onDisplaySettingsChange?.({ show_tags: e.target.checked })}
                    className="size-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary cursor-pointer"
                  />
                </label>
                <label className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-200">截止日期</span>
                  <input
                    type="checkbox"
                    checked={displaySettings.show_due_date}
                    onChange={(e) => onDisplaySettingsChange?.({ show_due_date: e.target.checked })}
                    className="size-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary cursor-pointer"
                  />
                </label>
                <label className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-50 dark:border-gray-800 cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-200">优先级</span>
                  <input
                    type="checkbox"
                    checked={displaySettings.show_priority}
                    onChange={(e) => onDisplaySettingsChange?.({ show_priority: e.target.checked })}
                    className="size-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary cursor-pointer"
                  />
                </label>
                <label className="w-full px-4 py-3 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                  <span className="text-gray-700 dark:text-gray-200">状态</span>
                  <input
                    type="checkbox"
                    checked={displaySettings.show_status}
                    onChange={(e) => onDisplaySettingsChange?.({ show_status: e.target.checked })}
                    className="size-4 rounded border-gray-300 dark:border-gray-500 text-primary focus:ring-primary cursor-pointer"
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 占位空间，防止内容被固定头部遮挡 */}
      <div className={showFilterBar ? 'h-[168px]' : 'h-36'}></div>
    </>
  );
};

export default Header;