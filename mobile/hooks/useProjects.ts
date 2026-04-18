import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../shared/services/api';

export function useProjects(params?: { group?: string }) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const res = await projectApi.getProjects(params);
      return res.data.data.results;
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useProject(uid: string) {
  return useQuery({
    queryKey: ['project', uid],
    queryFn: async () => {
      const res = await projectApi.getProject(uid);
      return res.data.data;
    },
    enabled: !!uid,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { group_uid: string; name: string; desc?: string; style?: Record<string, any> }) =>
      projectApi.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, data }: { uid: string; data: Partial<{ name: string; desc: string; style: Record<string, any>; group_uid: string }> }) =>
      projectApi.updateProject(uid, data),
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: ['project', uid] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => projectApi.deleteProject(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
