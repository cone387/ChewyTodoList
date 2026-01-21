import { useQuery } from '@tanstack/react-query';
import { activityApi } from '../services/api';

// 获取活动日志列表
export const useActivityLogs = (params?: {
  task?: string;
  project?: string;
  page?: number;
}) => {
  return useQuery({
    queryKey: ['activity-logs', params],
    queryFn: () => activityApi.getActivityLogs(params),
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