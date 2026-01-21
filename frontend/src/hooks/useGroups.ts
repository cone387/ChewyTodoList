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