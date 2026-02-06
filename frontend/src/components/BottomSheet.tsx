import React, { useEffect, useState } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsClosing(false);
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    } else {
      // 当外部关闭时，触发关闭动画
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
  }, [isOpen, isAnimating]);

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

  if (!isOpen && !isClosing) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-end justify-center transition-colors duration-300 ${
        isAnimating && !isClosing ? 'bg-black/50' : 'bg-black/0'
      }`}
      onClick={handleBackdropClick}
    >
      <div 
        className={`w-full max-w-md bg-white dark:bg-surface-dark rounded-t-3xl flex flex-col overflow-hidden transform transition-transform duration-300 ease-out ${
          isAnimating && !isClosing ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ height: '85vh' }}
      >
        {/* iOS 风格拖动指示器 */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>
        
        {/* 头部 */}
        <div className="flex items-center justify-between px-5 pb-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button
            onClick={handleClose}
            className="size-8 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
        
        {/* 内容 */}
        <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
          {children}
        </div>

        {/* 底部安全区域 */}
        <div className="pb-safe" />
      </div>
    </div>
  );
};

export default BottomSheet;
