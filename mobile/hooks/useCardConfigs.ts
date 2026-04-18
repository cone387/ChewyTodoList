import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cardConfigApi } from '../shared/services/api';
import type { TaskCardConfig } from '../shared/types/index';

export function useCardConfigs(params?: { is_preset?: boolean }) {
  return useQuery({
    queryKey: ['card-configs', params],
    queryFn: async () => {
      const res = await cardConfigApi.getConfigs(params);
      return res.data.data.results as TaskCardConfig[];
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useCardConfig(uid: string) {
  return useQuery({
    queryKey: ['card-config', uid],
    queryFn: async () => {
      const res = await cardConfigApi.getConfig(uid);
      return res.data.data as TaskCardConfig;
    },
    enabled: !!uid,
  });
}

export function useUpdateCardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: Partial<TaskCardConfig> }) =>
      cardConfigApi.updateConfig(uid, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-configs'] });
    },
  });
}

export function useDuplicateCardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => cardConfigApi.duplicateConfig(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-configs'] });
    },
  });
}

export function useDeleteCardConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => cardConfigApi.deleteConfig(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['card-configs'] });
    },
  });
}
