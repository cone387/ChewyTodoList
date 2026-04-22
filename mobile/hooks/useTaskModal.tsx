import React, { createContext, useContext, useState, useCallback } from 'react';

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

  return (
    <TaskModalContext.Provider value={{ state, openTask, openCreateTask, closeTask }}>
      {children}
    </TaskModalContext.Provider>
  );
}
