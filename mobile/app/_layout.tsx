import '../global.css';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-modules-core';
import { useAuth, AuthContext, useAuthProvider } from '../hooks/useAuth';
import { authApi } from '../shared/services/api';
import { ToastContainer } from '../components/ui/Toast';
import { ToastContext, useToastProvider } from '../hooks/useToast';
import { ThemeContext, useThemeProvider } from '../hooks/useTheme';
import { useReminderScheduler } from '../hooks/useReminderScheduler';
import { useNotificationPermission } from '../hooks/useNotificationPermission';

// 配置通知在前台也显示
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 60 * 24, // 24 hours — keep cache for offline
    },
  },
});

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'CHEWY_QUERY_CACHE',
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated === null) return;

    // On web, Expo Router strips group names from segments,
    // so /login has segments=['login'] not segments=['(auth)','login']
    const inAuthGroup = segments[0] === '(auth)' ||
      segments.some(s => s === 'login' || s === 'register');

    // Use microtask deferral via Promise.resolve — ensures navigation happens
    // after current render commit without the brittle fixed-ms delays.
    if (!isAuthenticated && !inAuthGroup) {
      Promise.resolve().then(() => router.replace('/(auth)/login'));
    } else if (isAuthenticated && inAuthGroup) {
      Promise.resolve().then(() => router.replace('/(tabs)'));
    }
  }, [isAuthenticated, segments]);

  // User initialization check
  useEffect(() => {
    if (!isAuthenticated) return;
    authApi.checkInitialized().then((res) => {
      const data = res.data.data || res.data;
      if (!data.is_initialized) {
        authApi.initializeUser().then(() => {
          // Refresh all caches after initialization
          queryClient.invalidateQueries();
        }).catch(() => {});
      }
    }).catch(() => {});
  }, [isAuthenticated]);

  return <>{children}</>;
}

export default function RootLayout() {
  const toastCtx = useToastProvider();
  const themeCtx = useThemeProvider();
  const authCtx = useAuthProvider();
  const router = useRouter();
  const { syncUpcoming, markTriggered } = useReminderScheduler();
  const { requestPermission } = useNotificationPermission();
  const notificationResponseListener = useRef<EventSubscription | undefined>(undefined);
  const notificationReceivedListener = useRef<EventSubscription | undefined>(undefined);

  // 通知权限 + 调度同步
  useEffect(() => {
    requestPermission();
    // App 启动时同步即将触发的提醒
    syncUpcoming();
  }, []);

  // 监听通知点击 → 跳转任务详情
  useEffect(() => {
    notificationResponseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { taskUid?: string; reminderUid?: string } | undefined;
      if (data?.taskUid) {
        router.push(`/task/${data.taskUid}` as any);
      }
      // 标记已触发
      if (data?.reminderUid) {
        markTriggered(data.reminderUid);
      }
    });

    // 监听前台通知接收 → 标记已触发
    notificationReceivedListener.current = Notifications.addNotificationReceivedListener((notification) => {
      const data = notification.request.content.data as { taskUid?: string; reminderUid?: string } | undefined;
      if (data?.reminderUid) {
        markTriggered(data.reminderUid);
      }
    });

    return () => {
      if (notificationResponseListener.current) {
        notificationResponseListener.current.remove();
      }
      if (notificationReceivedListener.current) {
        notificationReceivedListener.current.remove();
      }
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
        >
          <AuthContext.Provider value={authCtx}>
            <ThemeContext.Provider value={themeCtx}>
              <ToastContext.Provider value={toastCtx}>
                <StatusBar style={themeCtx.isDark ? 'light' : 'dark'} />
                <View style={{ flex: 1, backgroundColor: themeCtx.colors.background.primary }}>
                  <AuthGuard>
                    <Slot />
                  </AuthGuard>
                  <ToastContainer toasts={toastCtx.toasts} onDismiss={toastCtx.dismissToast} />
                </View>
              </ToastContext.Provider>
            </ThemeContext.Provider>
          </AuthContext.Provider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
