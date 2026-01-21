import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tagApi } from '../services/api';

// 获取标签列表
export const useTags = () => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => tagApi.getTags(),
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

// 创建标签
export const useCreateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tagApi.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

// 更新标签
export const useUpdateTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) =>
      tagApi.updateTag(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

// 删除标签
export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: tagApi.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};