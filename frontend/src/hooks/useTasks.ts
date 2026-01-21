import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '../services/api';
import type { Task } from '../types/index';

// 获取任务列表
export const useTasks = (params?: {
  status?: number;
  project?: string;
  search?: string;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['tasks', params],
    queryFn: () => taskApi.getTasks(params),
    select: (data) => data.data.data,
  });
};

// 获取任务详情
export const useTask = (uid: string) => {
  return useQuery({
    queryKey: ['task', uid],
    queryFn: () => taskApi.getTask(uid),
    select: (data) => data.data.data,
    enabled: !!uid,
  });
};

// 创建任务
export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: taskApi.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// 更新任务
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) =>
      taskApi.updateTask(uid, data),
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task', uid] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// 删除任务
export const useDeleteTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: taskApi.deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// 切换任务完成状态
export const useToggleTaskStatus = () => {
  const updateTask = useUpdateTask();
  
  return useMutation({
    mutationFn: (task: Task) => {
      const newStatus = task.is_completed ? 1 : 2; // TODO or COMPLETED
      return updateTask.mutateAsync({
        uid: task.uid,
        data: { status: newStatus },
      });
    },
  });
};