import React from 'react';
import Toast from './Toast';
import type { ToastType } from './Toast';

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{ top: `${80 + index * 70}px` }}
          className="fixed left-1/2 -translate-x-1/2 z-50"
        >
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </>
  );
};

export default ToastContainer;
