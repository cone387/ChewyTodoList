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
    queryFn: () => viewApi.getView(uid),
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

// 更新视图
export const useUpdateView = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: any }) =>
      viewApi.updateView(uid, data),
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['view', uid] });
      queryClient.invalidateQueries({ queryKey: ['view-tasks', uid] });
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
    mutationFn: ({ uid, isVisible }: { uid: string; isVisible: boolean }) =>
      viewApi.updateView(uid, { is_visible_in_nav: isVisible }),
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['view', uid] });
      queryClient.invalidateQueries({ queryKey: ['default-views'] });
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