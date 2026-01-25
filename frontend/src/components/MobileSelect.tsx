import React, { useState, useEffect } from 'react';

interface Option {
  value: string | number;
  label: string;
}

interface MobileSelectProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: Option[];
  className?: string;
  placeholder?: string;
}

const MobileSelect: React.FC<MobileSelectProps> = ({
  value,
  onChange,
  options,
  className = '',
  placeholder = '请选择',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  const handleSelect = (optionValue: string | number) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  // 点击外部关闭
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        // 检查是否点击在弹窗内部
        if (!target.closest('.mobile-select-popup') && !target.closest('.mobile-select-container')) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <>
      {/* 触发按钮 */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`mobile-select-container w-full px-3 py-2 text-sm bg-white text-gray-900 rounded-lg border-0 shadow-sm text-left flex items-center justify-between ${className}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400'}>
          {selectedOption?.label || placeholder}
        </span>
        <span className="material-symbols-outlined text-gray-400 text-[20px]">
          expand_more
        </span>
      </button>

      {/* iOS风格弹窗 */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black bg-opacity-30 animate-fade-in">
          <div 
            className="mobile-select-popup w-full max-w-md bg-white rounded-t-2xl shadow-2xl animate-slide-up"
            style={{ maxHeight: '60vh' }}
          >
            {/* 顶部拖动条 */}
            <div className="flex items-center justify-center py-2 border-b border-gray-100">
              <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
            </div>

            {/* 选项列表 */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(60vh - 60px)' }}>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-4 py-3 text-left text-base transition-colors ${
                    option.value === value
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{option.label}</span>
                    {option.value === value && (
                      <span className="material-symbols-outlined text-blue-600 text-[20px]">
                        check
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* 取消按钮 */}
            <div className="p-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default MobileSelect;
