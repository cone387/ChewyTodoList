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
  });
};