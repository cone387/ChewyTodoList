import { useState, useCallback, createContext, useContext } from 'react';
import type { ToastData, ToastType } from '../components/ui/Toast';

let globalId = 0;

export interface ToastContextValue {
  toasts: ToastData[];
  showToast: (type: ToastType, message: string, duration?: number) => void;
  dismissToast: (id: string) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function useToastProvider(): ToastContextValue {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const showToast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = `toast_${++globalId}`;
    setToasts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, showToast, dismissToast };
}

export function useToast() {
  return useContext(ToastContext);
}
