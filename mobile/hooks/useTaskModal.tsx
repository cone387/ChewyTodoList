import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

// Simple global signal for deep link — set by /task/[uid] route, consumed by TaskModalProvider
export const pendingDeepLink: { taskUid: string | null } = { taskUid: null };

interface TaskModalState {
  visible: boolean;
  taskUid: string;
  projectUid?: string;
}

interface TaskModalContextType {
  state: TaskModalState;
  openTask: (uid: string) => void;
  openCreateTask: (projectUid?: string) => void;
  closeTask: () => void;
}

const TaskModalContext = createContext<TaskModalContextType>(null!);

export function useTaskModal() {
  return useContext(TaskModalContext);
}

export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TaskModalState>({ visible: false, taskUid: '' });

  const openTask = useCallback((uid: string) => {
    setState({ visible: true, taskUid: uid });
  }, []);

  const openCreateTask = useCallback((projectUid?: string) => {
    setState({ visible: true, taskUid: 'create', projectUid });
  }, []);

  const closeTask = useCallback(() => {
    setState({ visible: false, taskUid: '' });
  }, []);

  // Check for pending deep link on mount and periodically
  useEffect(() => {
    const check = () => {
      if (pendingDeepLink.taskUid) {
        const uid = pendingDeepLink.taskUid;
        pendingDeepLink.taskUid = null;
        openTask(uid);
      }
    };
    check();
    // Also check after a short delay in case redirect hasn't settled
    const timer = setTimeout(check, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <TaskModalContext.Provider value={{ state, openTask, openCreateTask, closeTask }}>
      {children}
    </TaskModalContext.Provider>
  );
}
