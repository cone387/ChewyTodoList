import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = '确定',
  cancelText = '取消',
  confirmColor = 'danger',
  onConfirm,
  onCancel,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl max-w-sm w-full animate-scale-in">
        {/* 标题 */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className={`size-10 rounded-full flex items-center justify-center ${
              confirmColor === 'danger' 
                ? 'bg-red-100 dark:bg-red-900/30' 
                : 'bg-blue-100 dark:bg-blue-900/30'
            }`}>
              <span className={`material-symbols-outlined text-[24px] ${
                confirmColor === 'danger' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-blue-600 dark:text-blue-400'
              }`}>
                {confirmColor === 'danger' ? 'warning' : 'help'}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          </div>
          
          {/* 消息内容 */}
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
            {message}
          </p>
        </div>

        {/* 按钮 */}
        <div className="flex gap-3 p-6 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 text-sm font-medium text-white rounded-lg transition-colors ${
              confirmColor === 'danger'
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-primary hover:opacity-90'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
