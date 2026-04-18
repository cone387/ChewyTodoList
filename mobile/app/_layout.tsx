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
import { useAuth, AuthContext, useAuthProvider } from '../hooks/useAuth';
import { authApi } from '../shared/services/api';
import { ToastContainer } from '../components/ui/Toast';
import { ToastContext, useToastProvider } from '../hooks/useToast';
import { ThemeContext, useThemeProvider } from '../hooks/useTheme';

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

    if (!isAuthenticated && !inAuthGroup) {
      setTimeout(() => router.replace('/(auth)/login'), 50);
    } else if (isAuthenticated && inAuthGroup) {
      setTimeout(() => router.replace('/(tabs)'), 100);
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
                    <Stack screenOptions={{ headerShown: false }} />
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
