import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      path: '/',
      icon: 'home',
      label: '任务',
      filled: false,
    },
    {
      path: '/projects',
      icon: 'list_alt',
      label: '清单',
      filled: true,
    },
    {
      path: '/notifications',
      icon: 'inbox',
      label: '通知',
      filled: false,
      hasNotification: false,
    },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="bg-white dark:bg-surface-dark border-t border-[#e5e7eb] dark:border-[#2a3441] flex items-center justify-around h-16 pb-safe fixed bottom-0 w-full z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] max-w-md mx-auto left-1/2 transform -translate-x-1/2">
      {navItems.map((item) => {
        const active = isActive(item.path);
        
        return (
          <button
            key={item.path}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${
              active
                ? 'text-[#111418] dark:text-white'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
            onClick={() => navigate(item.path)}
          >
            <div className="relative">
              <span className={`material-symbols-outlined text-[24px] ${
                active && item.filled ? 'fill-1' : ''
              }`}>
                {item.icon}
              </span>
              {item.hasNotification && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full ring-2 ring-white dark:ring-surface-dark bg-red-500"></span>
              )}
            </div>
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;