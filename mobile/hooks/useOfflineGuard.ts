import { useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { useToast } from './useToast';

/**
 * Hook that wraps async operations with offline detection.
 * If offline, shows a toast and prevents the operation.
 */
export function useOfflineGuard() {
  const { isOnline } = useNetworkStatus();
  const { showToast } = useToast();

  const guardedAction = useCallback(
    async <T>(action: () => Promise<T>, offlineMessage?: string): Promise<T | null> => {
      if (!isOnline) {
        showToast('warning', offlineMessage || '当前处于离线状态，操作无法完成');
        return null;
      }
      return action();
    },
    [isOnline, showToast]
  );

  return { isOnline, guardedAction };
}
