import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../shared/services/api';
import type { Task, EditScope } from '../shared/types/index';
import { TaskStatus } from '../shared/types/index';

export function useTasks(params?: Record<string, any>) {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: async () => {
      const res = await taskApi.getTasks(params);
      return res.data.data;
    },
    staleTime: 1000 * 30,
  });
}

export function useTask(uid: string) {
  return useQuery({
    queryKey: ['task', uid],
    queryFn: async () => {
      const res = await taskApi.getTask(uid);
      return res.data.data;
    },
    enabled: !!uid,
    staleTime: 1000 * 30,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof taskApi.createTask>[0]) => taskApi.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['view-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data, scope }: { uid: string; data: Parameters<typeof taskApi.updateTask>[1]; scope?: EditScope }) =>
      taskApi.updateTask(uid, data, scope),
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['task', uid] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['view-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, scope }: { uid: string; scope?: EditScope }) => taskApi.deleteTask(uid, scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['view-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

export function useSkipTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => taskApi.skipTask(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['view-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}

export function useToggleTaskStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ task }: { task: Task }) => {
      const newStatus =
        task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
      const res = await taskApi.updateTask(task.uid, { status: newStatus });
      return res.data.data;
    },
    onMutate: async ({ task }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['view-tasks'] });
      const newStatus =
        task.status === TaskStatus.COMPLETED ? TaskStatus.TODO : TaskStatus.COMPLETED;
      queryClient.setQueriesData({ queryKey: ['view-tasks'] }, (old: any) => {
        if (!old?.results) return old;
        return {
          ...old,
          results: old.results.map((t: Task) =>
            t.uid === task.uid ? { ...t, status: newStatus, is_completed: newStatus === TaskStatus.COMPLETED } : t
          ),
        };
      });
      return { previousStatus: task.status };
    },
    onError: (_, { task }, context) => {
      // Rollback
      queryClient.setQueriesData({ queryKey: ['view-tasks'] }, (old: any) => {
        if (!old?.results) return old;
        return {
          ...old,
          results: old.results.map((t: Task) =>
            t.uid === task.uid ? { ...t, status: context?.previousStatus } : t
          ),
        };
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['view-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
}
