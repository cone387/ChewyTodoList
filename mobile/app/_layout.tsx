import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from '../hooks/useAuth';
import { authApi } from '../shared/services/api';
import { ToastContainer } from '../components/ui/Toast';
import { ToastContext, useToastProvider } from '../hooks/useToast';

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

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(tabs)');
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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: asyncStoragePersister, maxAge: 1000 * 60 * 60 * 24 }}
        >
          <ToastContext.Provider value={toastCtx}>
            <StatusBar style="auto" />
            <View style={{ flex: 1 }}>
              <AuthGuard>
                <Stack screenOptions={{ headerShown: false }} />
              </AuthGuard>
              <ToastContainer toasts={toastCtx.toasts} onDismiss={toastCtx.dismissToast} />
            </View>
          </ToastContext.Provider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
