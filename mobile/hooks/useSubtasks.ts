import { useQuery } from '@tanstack/react-query';
import { taskApi } from '../shared/services/api';
import type { Task } from '../shared/types/index';

export function useSubtasks(parentUid: string) {
  return useQuery({
    queryKey: ['subtasks', parentUid],
    queryFn: async () => {
      const res = await taskApi.getTasks({ parent: parentUid });
      return res.data.data.results as Task[];
    },
    enabled: !!parentUid,
    staleTime: 1000 * 30,
  });
}
