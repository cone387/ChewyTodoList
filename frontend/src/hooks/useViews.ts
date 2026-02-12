import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { viewApi } from '../services/api';

// 获取视图列表
export const useViews = (params?: {
  project?: string;
  view_type?: string;
}) => {
  return useQuery({
    queryKey: ['views', params],
    queryFn: () => viewApi.getViews(params),
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

// 获取视图详情
export const useView = (uid: string) => {
  return useQuery({
    queryKey: ['view', uid],
    queryFn: async () => {
      const response = await viewApi.getView(uid);
      return response.data.data; // 直接返回视图对象，避免 select 与 setQueryData 冲突
    },
    enabled: !!uid && !!localStorage.getItem('access_token'),
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
  });
};

// 获取视图下的任务
export const useViewTasks = (uid: string, params?: {
  page?: number;
}) => {
  return useQuery({
    queryKey: ['view-tasks', uid, params],
    queryFn: () => viewApi.getViewTasks(uid, params),
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

// 获取默认视图
export const useDefaultViews = (params?: {
  project?: string;
}) => {
  return useQuery({
    queryKey: ['default-views', params],
    queryFn: () => viewApi.getDefaultViews(params),
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

// 创建视图
export const useCreateView = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: viewApi.createView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['default-views'] });
    },
  });
};

// 更新视图（支持乐观更新）
export const useUpdateView = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) =>
      viewApi.updateView(uid, data),
    onMutate: async ({ uid, data }) => {
      // 取消正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['view', uid] });
      
      // 保存之前的数据用于回滚
      const previousView = queryClient.getQueryData(['view', uid]);
      
      // 乐观更新视图数据
      if (previousView) {
        queryClient.setQueryData(['view', uid], (old: any) => {
          if (!old) return old;
          return { ...old, ...data };
        });
      }
      
      return { previousView };
    },
    onError: (err, { uid }, context) => {
      // 发生错误时回滚
      if (context?.previousView) {
        queryClient.setQueryData(['view', uid], context.previousView);
      }
      console.error('更新视图失败:', err);
    },
    onSuccess: (response, { uid }) => {
      // 成功后用服务器返回的数据更新缓存
      const serverData = response.data?.data;
      if (serverData) {
        queryClient.setQueryData(['view', uid], serverData);
      }
      // 更新视图列表
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['default-views'] });
    },
  });
};

// 删除视图
export const useDeleteView = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: viewApi.deleteView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['default-views'] });
    },
  });
};

// 设置默认视图
export const useSetDefaultView = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: viewApi.setDefaultView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['default-views'] });
    },
  });
};

// 复制视图
export const useDuplicateView = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: viewApi.duplicateView,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
    },
  });
};

// 切换视图在导航栏的显示状态
export const useToggleViewVisibility = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uid, isVisible, sortOrder }: { uid: string; isVisible: boolean; sortOrder?: number }) => {
      const updateData: any = { is_visible_in_nav: isVisible };
      if (sortOrder !== undefined) {
        updateData.sort_order = sortOrder;
      }
      return viewApi.updateView(uid, updateData);
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['view', uid] });
      queryClient.invalidateQueries({ queryKey: ['default-views'] });
      queryClient.invalidateQueries({ queryKey: ['nav-views'] });
    },
  });
};

// 获取导航栏显示的视图（用于Header组件）
export const useNavViews = (params?: {
  project?: string;
}) => {
  return useQuery({
    queryKey: ['nav-views', params],
    queryFn: () => viewApi.getViews({ ...params, is_visible_in_nav: true }),
    select: (data) => data.data.data,
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    enabled: !!localStorage.getItem('access_token'),
  });
};