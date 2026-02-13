import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../services/api';

// 获取项目列表
export const useProjects = (params?: { group?: string; search?: string }) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectApi.getProjects(params),
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

// 获取单个项目
export const useProject = (uid: string) => {
  return useQuery({
    queryKey: ['project', uid],
    queryFn: () => projectApi.getProject(uid),
    select: (data) => data.data.data,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
    enabled: !!uid && !!localStorage.getItem('access_token'),
  });
};

// 获取项目统计
export const useProjectStats = (uid: string) => {
  return useQuery({
    queryKey: ['project-stats', uid],
    queryFn: () => projectApi.getProjectStats(uid),
    select: (data) => data.data.data,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) return false;
      return failureCount < 2;
    },
    enabled: !!uid && !!localStorage.getItem('access_token'),
  });
};

// 创建项目
export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

// 更新项目
export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  // 深度合并对象（处理嵌套对象如 style）
  const deepMerge = (target: any, source: any) => {
    const result = { ...target };
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    return result;
  };
  
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) =>
      projectApi.updateProject(uid, data),
    onMutate: async ({ uid, data }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['project', uid] });
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // 保存当前状态用于回滚
      const previousProject = queryClient.getQueryData(['project', uid]);
      const previousProjects = queryClient.getQueryData(['projects', undefined]);

      // 乐观更新单个项目缓存
      queryClient.setQueryData(['project', uid], (old: any) => {
        if (!old) return old;
        // 保持API响应格式: { data: { data: project } }
        return {
          ...old,
          data: {
            ...old.data,
            data: deepMerge(old.data.data, data)
          }
        };
      });

      // 乐观更新项目列表缓存
      queryClient.setQueryData(['projects', undefined], (old: any) => {
        if (!old?.data?.data?.results) return old;
        let updatedResults = old.data.data.results.map((p: any) =>
          p.uid === uid ? deepMerge(p, data) : p
        );
        // 如果更新了 sort_order，重新排序
        if (data.sort_order !== undefined) {
          updatedResults = [...updatedResults].sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        }
        return {
          ...old,
          data: {
            ...old.data,
            data: {
              ...old.data.data,
              results: updatedResults
            }
          }
        };
      });

      return { previousProject, previousProjects };
    },
    onError: (_err, { uid }, context) => {
      // 发生错误时回滚
      if (context?.previousProject) {
        queryClient.setQueryData(['project', uid], context.previousProject);
      }
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects', undefined], context.previousProjects);
      }
    },
    onSuccess: (_data, variables) => {
      // 成功后只重新验证必要的查询
      queryClient.invalidateQueries({ queryKey: ['project', variables.uid] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      // 如果改变了分组，需要刷新分组数据
      if (variables.data.group_uid !== undefined) {
        queryClient.invalidateQueries({ queryKey: ['groups'] });
      }
    },
  });
};

// 删除项目
export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};
