/**
 * useNotificationPermission — 通知权限管理 Hook
 * 封装通知权限请求、状态监听、Android channel 创建
 */
import { useState, useEffect, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export function useNotificationPermission() {
  const [status, setStatus] = useState<PermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  // 检查当前权限状态
  const checkPermission = useCallback(async () => {
    if (!Device.isDevice) {
      // 模拟器上通知权限特殊处理
      setStatus('granted');
      setIsLoading(false);
      return 'granted';
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    const mapped: PermissionStatus =
      existingStatus === 'granted' ? 'granted' :
      existingStatus === 'denied' ? 'denied' : 'undetermined';
    setStatus(mapped);
    setIsLoading(false);
    return mapped;
  }, []);

  // 请求通知权限
  const requestPermission = useCallback(async () => {
    if (!Device.isDevice) {
      setStatus('granted');
      return 'granted';
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') {
      setStatus('granted');
      return 'granted';
    }

    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    const mapped: PermissionStatus =
      newStatus === 'granted' ? 'granted' :
      newStatus === 'denied' ? 'denied' : 'undetermined';
    setStatus(mapped);
    return mapped;
  }, []);

  // 创建 Android 通知渠道
  const setupAndroidChannel = useCallback(async () => {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('task-reminders', {
        name: '任务提醒',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4F46E5',
        sound: 'default',
      });
    }
  }, []);

  // 初始化
  useEffect(() => {
    checkPermission();
    setupAndroidChannel();
  }, []);

  return {
    status,
    isLoading,
    isGranted: status === 'granted',
    isDenied: status === 'denied',
    requestPermission,
    checkPermission,
  };
}
