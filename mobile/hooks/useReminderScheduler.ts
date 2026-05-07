/**
 * useReminderScheduler — 本地通知调度 Hook
 * 负责将提醒数据转化为 expo-notifications 的本地推送
 */
import { useCallback, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { reminderApi } from '../shared/services/api';
import type { Reminder, Task } from '../shared/types/index';

// 存储已调度的 notification ID 映射: reminder_uid -> notification_id
const scheduledMap = new Map<string, string>();

export function useReminderScheduler() {
  const isSyncing = useRef(false);

  /**
   * 为单条提醒调度本地通知
   */
  const scheduleReminder = useCallback(async (reminder: Reminder, task: Task) => {
    if (!reminder.effective_trigger_at) return;

    const triggerDate = new Date(reminder.effective_trigger_at);
    const now = new Date();
    if (triggerDate <= now) return; // 已过期

    // 取消旧的如果存在
    const existingId = scheduledMap.get(reminder.uid);
    if (existingId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(existingId);
      } catch {}
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: `任务提醒`,
        body: task.title,
        data: { taskUid: task.uid, reminderUid: reminder.uid },
        sound: true,
        ...(Platform.OS === 'android' ? { channelId: 'task-reminders' } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
      },
    });

    scheduledMap.set(reminder.uid, notificationId);

    // 如果后端需要存储 client_notification_id，可以在此回调
    return notificationId;
  }, []);

  /**
   * 取消单条提醒的本地通知
   */
  const cancelReminder = useCallback(async (reminderUid: string) => {
    const notificationId = scheduledMap.get(reminderUid);
    if (notificationId) {
      try {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      } catch {}
      scheduledMap.delete(reminderUid);
    }
  }, []);

  /**
   * 同步即将触发的提醒：从后端拉取 upcoming 列表，对比本地已调度，补齐/取消
   */
  const syncUpcoming = useCallback(async () => {
    if (isSyncing.current) return;
    isSyncing.current = true;

    try {
      const res = await reminderApi.getUpcoming(120); // 2小时内的
      const upcoming: Reminder[] = res.data.data || [];

      // 获取当前所有已调度的通知
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      const scheduledIdentifiers = new Set(scheduled.map(n => n.identifier));

      // 找出需要新调度的
      for (const reminder of upcoming) {
        const existingId = scheduledMap.get(reminder.uid);
        if (existingId && scheduledIdentifiers.has(existingId)) {
          continue; // 已经调度，跳过
        }

        // 需要调度 — 但我们需要 task 信息来显示通知内容
        // 这里用 reminder 自带信息生成简单通知
        if (!reminder.effective_trigger_at) continue;
        const triggerDate = new Date(reminder.effective_trigger_at);
        if (triggerDate <= new Date()) continue;

        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '任务提醒',
            body: `你有一个待办任务需要关注`,
            data: { taskUid: reminder.task_uid, reminderUid: reminder.uid },
            sound: true,
            ...(Platform.OS === 'android' ? { channelId: 'task-reminders' } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          },
        });
        scheduledMap.set(reminder.uid, notificationId);
      }

      // 取消已不在 upcoming 列表中的旧调度
      const upcomingUids = new Set(upcoming.map(r => r.uid));
      for (const [uid, notifId] of scheduledMap.entries()) {
        if (!upcomingUids.has(uid)) {
          try {
            await Notifications.cancelScheduledNotificationAsync(notifId);
          } catch {}
          scheduledMap.delete(uid);
        }
      }
    } catch (err) {
      console.warn('[ReminderScheduler] syncUpcoming failed:', err);
    } finally {
      isSyncing.current = false;
    }
  }, []);

  /**
   * 标记提醒已触发 — 当通知被接收时调用
   */
  const markTriggered = useCallback(async (reminderUid: string) => {
    try {
      await reminderApi.markTriggered(reminderUid);
      scheduledMap.delete(reminderUid);
    } catch (err) {
      console.warn('[ReminderScheduler] markTriggered failed:', err);
    }
  }, []);

  return {
    scheduleReminder,
    cancelReminder,
    syncUpcoming,
    markTriggered,
  };
}
