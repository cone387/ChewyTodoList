/**
 * useReminders — 提醒 CRUD hooks（基于 @tanstack/react-query）
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reminderApi } from '../shared/services/api';
import type { ReminderInput } from '../shared/types/index';

/**
 * 查询指定任务的提醒列表
 */
export function useReminders(taskUid: string) {
  return useQuery({
    queryKey: ['reminders', taskUid],
    queryFn: async () => {
      const res = await reminderApi.getReminders({ task: taskUid });
      return res.data.data;
    },
    enabled: !!taskUid,
    staleTime: 1000 * 30,
  });
}

/**
 * 查询即将触发的提醒（默认 60 分钟内）
 */
export function useUpcomingReminders(withinMinutes = 60) {
  return useQuery({
    queryKey: ['reminders-upcoming', withinMinutes],
    queryFn: async () => {
      const res = await reminderApi.getUpcoming(withinMinutes);
      return res.data.data;
    },
    staleTime: 1000 * 60,
    refetchInterval: 1000 * 60 * 5, // 每 5 分钟自动刷新
  });
}

/**
 * 创建提醒
 */
export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ReminderInput & { task_uid: string }) =>
      reminderApi.createReminder(data),
    onSuccess: (_, { task_uid }) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', task_uid] });
      queryClient.invalidateQueries({ queryKey: ['reminders-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['task', task_uid] });
    },
  });
}

/**
 * 删除提醒
 */
export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ uid, taskUid }: { uid: string; taskUid: string }) =>
      reminderApi.deleteReminder(uid),
    onSuccess: (_, { taskUid }) => {
      queryClient.invalidateQueries({ queryKey: ['reminders', taskUid] });
      queryClient.invalidateQueries({ queryKey: ['reminders-upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['task', taskUid] });
    },
  });
}

/**
 * 标记提醒已触发
 */
export function useMarkReminderTriggered() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (uid: string) => reminderApi.markTriggered(uid),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders-upcoming'] });
    },
  });
}
