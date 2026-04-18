import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { viewApi } from '../shared/services/api';

export function useNavViews() {
  return useQuery({
    queryKey: ['views', 'nav'],
    queryFn: async () => {
      const res = await viewApi.getViews({ is_visible_in_nav: true });
      return res.data.data.results;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useViews(params?: { project?: string }) {
  return useQuery({
    queryKey: ['views', params],
    queryFn: async () => {
      const res = await viewApi.getViews(params);
      return res.data.data.results;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useView(uid: string) {
  return useQuery({
    queryKey: ['view', uid],
    queryFn: async () => {
      const res = await viewApi.getView(uid);
      return res.data.data;
    },
    enabled: !!uid,
    staleTime: 1000 * 30,
  });
}

export function useViewTasks(uid: string, params?: { page?: number; project?: string }) {
  return useQuery({
    queryKey: ['view-tasks', uid, params],
    queryFn: async () => {
      const res = await viewApi.getViewTasks(uid, params);
      return res.data.data;
    },
    enabled: !!uid,
    staleTime: 1000 * 60,
  });
}

export function useDeleteView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => viewApi.deleteView(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
    },
  });
}

export function useDuplicateView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => viewApi.duplicateView(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
    },
  });
}
