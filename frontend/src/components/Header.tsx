import React, { useState } from 'react';
import { useProfile } from '../hooks/useAuth';

interface HeaderProps {
  onSearch?: (query: string) => void;
  onFilter?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearch, onFilter }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: profile } = useProfile();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-surface-dark pt-safe border-b border-gray-100 dark:border-gray-800">
      {/* 顶部栏 */}
      <div className="flex items-center p-3 justify-between">
        <div className="flex items-center gap-3">
          <button className="text-[#5f6368] dark:text-white flex items-center justify-center">
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-base font-semibold">任务管理</span>
        </div>
        
        <div className="flex items-center justify-end">
          <div className="size-8 rounded-full bg-gray-200 dark:bg-[#252f3a] flex items-center justify-center relative">
            <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-[18px]">
              person
            </span>
            <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 rounded-full border-2 border-white dark:border-surface-dark"></div>
          </div>
        </div>
      </div>

      {/* 搜索栏 */}
      <div className="px-3 pb-2 flex items-center gap-2">
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

      {/* 标签栏 */}
      <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 py-2 text-sm font-medium border-t border-gray-50 dark:border-gray-800">
        <button className="whitespace-nowrap text-primary border-b-2 border-primary pb-1">
          最近
        </button>
        <button className="whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 pb-1">
          收藏
        </button>
        <button className="whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 pb-1">
          项目
        </button>
        <button className="whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 pb-1">
          看板
        </button>
        <button className="whitespace-nowrap text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 pb-1">
          文档
        </button>
      </div>
    </header>
  );
};

export default Header;