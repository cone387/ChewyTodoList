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

// 搜索任务（带防抖）
export const useSearchTasks = (search: string) => {
  return useQuery({
    queryKey: ['tasks', 'search', search],
    queryFn: () => taskApi.getTasks({ search }),
    select: (data) => data.data.data,
    retry: false,
    enabled: !!search && search.trim().length > 0 && !!localStorage.getItem('access_token'),
    staleTime: 30000, // 30秒内不重新请求相同搜索词
  });
};

// 获取任务详情
export const useTask = (uid: string, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['task', uid],
    queryFn: async () => {
      const response = await taskApi.getTask(uid);
      return response.data.data; // 直接返回 task 对象，避免 select 与 setQueryData 冲突
    },
    enabled: (options?.enabled ?? true) && !!uid && !!localStorage.getItem('access_token'),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
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
          if (data.project_uid !== undefined) {
            // 需要从 projects 中找到对应的项目信息
            const projectsData = queryClient.getQueryData(['projects']) as any;
            const projects = projectsData?.results || [];
            const project = data.project_uid ? projects.find((p: any) => p.uid === data.project_uid) : null;
            updatedData.project = project;
            delete updatedData.project_uid;
          }
          // 处理 tag_uids
          if (data.tag_uids !== undefined) {
            const tagsData = queryClient.getQueryData(['tags']) as any;
            const allTags = tagsData?.results || [];
            updatedData.tags = data.tag_uids.map((uid: string) => allTags.find((t: any) => t.uid === uid)).filter(Boolean);
            delete updatedData.tag_uids;
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
    onSuccess: (response, { uid }) => {
      // 成功后用服务器返回的数据更新缓存（确保数据一致性）
      const serverData = response.data?.data;
      if (serverData) {
        queryClient.setQueryData(['task', uid], serverData);
      }
      // 只 invalidate 列表类查询（它们可能需要重新排序等）
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['view-tasks'] });
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