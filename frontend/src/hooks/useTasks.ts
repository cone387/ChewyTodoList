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
    retry: (failureCount, error: any) => {
      // 如果是401错误，不要重试
      if (error?.response?.status === 401) {
        return false;
      }
      // 其他错误最多重试2次
      return failureCount < 2;
    },
    enabled: !!localStorage.getItem('access_token'),
  });
};

// 获取任务详情
export const useTask = (uid: string) => {
  return useQuery({
    queryKey: ['task', uid],
    queryFn: () => taskApi.getTask(uid),
    select: (data) => data.data.data,
    enabled: !!uid && !!localStorage.getItem('access_token'),
    retry: (failureCount, error: any) => {
      // 如果是401错误，不要重试
      if (error?.response?.status === 401) {
        return false;
      }
      // 其他错误最多重试2次
      return failureCount < 2;
    },
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

// 更新任务（支持乐观更新）
export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) =>
      taskApi.updateTask(uid, data),
    onMutate: async ({ uid, data }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['task', uid] });
      await queryClient.cancelQueries({ queryKey: ['tasks'] });
      
      // 保存之前的数据用于回滚
      const previousTask = queryClient.getQueryData(['task', uid]);
      const previousTasks = queryClient.getQueryData(['tasks']);
      
      // 乐观更新任务详情
      if (previousTask) {
        queryClient.setQueryData(['task', uid], (old: any) => {
          if (!old) return old;
          // 处理 project_uid 的特殊情况
          const updatedData = { ...data };
          if (data.project_uid) {
            // 需要从 projects 中找到对应的项目信息
            const projectsData = queryClient.getQueryData(['projects']) as any;
            const projects = projectsData?.results || [];
            const project = projects.find((p: any) => p.uid === data.project_uid);
            if (project) {
              updatedData.project = project;
            }
            delete updatedData.project_uid;
          }
          return { ...old, ...updatedData };
        });
      }
      
      return { previousTask, previousTasks };
    },
    onError: (err, { uid }, context) => {
      // 发生错误时回滚
      if (context?.previousTask) {
        queryClient.setQueryData(['task', uid], context.previousTask);
      }
      if (context?.previousTasks) {
        queryClient.setQueryData(['tasks'], context.previousTasks);
      }
      console.error('更新任务失败:', err);
    },
    onSettled: (_, __, { uid }) => {
      // 无论成功还是失败，都重新获取最新数据
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