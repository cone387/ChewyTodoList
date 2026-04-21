import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { viewApi } from '../shared/services/api';
import type { TaskView } from '../shared/types/index';

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

export function useViewTasks(uid: string, params?: Record<string, any>) {
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

export function useCreateView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<TaskView> & { project_uid?: string; card_config_uid?: string }) =>
      viewApi.createView(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
    },
  });
}

export function useUpdateView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: Partial<TaskView> & { project_uid?: string } }) =>
      viewApi.updateView(uid, data),
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
      queryClient.invalidateQueries({ queryKey: ['view', uid] });
      queryClient.invalidateQueries({ queryKey: ['view-tasks', uid] });
    },
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

export function useToggleViewVisibility() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, isVisible, sortOrder }: { uid: string; isVisible: boolean; sortOrder?: number }) =>
      viewApi.updateView(uid, {
        is_visible_in_nav: isVisible,
        ...(sortOrder !== undefined ? { sort_order: sortOrder } : {}),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['views'] });
    },
  });
}
