import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { groupApi } from '../services/api';

// 获取分组列表
export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => groupApi.getGroups(),
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

// 创建分组
export const useCreateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: groupApi.createGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

// 更新分组
export const useUpdateGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) =>
      groupApi.updateGroup(uid, data),
    onMutate: async ({ uid, data }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['groups'] });
      
      // 保存当前状态用于回滚
      const previousGroups = queryClient.getQueryData(['groups']);
      
      // 乐观更新分组列表
      queryClient.setQueryData(['groups'], (old: any) => {
        if (!old?.data?.data?.results) return old;
        const updatedResults = old.data.data.results.map((g: any) =>
          g.uid === uid ? { ...g, ...data } : g
        );
        // 如果更新了 sort_order，重新排序
        if (data.sort_order !== undefined) {
          updatedResults.sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
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
      
      return { previousGroups };
    },
    onError: (_err, _variables, context) => {
      // 发生错误时回滚
      if (context?.previousGroups) {
        queryClient.setQueryData(['groups'], context.previousGroups);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
};

// 删除分组
export const useDeleteGroup = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: groupApi.deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};