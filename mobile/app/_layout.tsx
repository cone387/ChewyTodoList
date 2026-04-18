import '../global.css';
import { useEffect } from 'react';
import { View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuth } from '../hooks/useAuth';
import { ToastContainer } from '../components/ui/Toast';
import { ToastContext, useToastProvider } from '../hooks/useToast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60,
    },
  },
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

  return <>{children}</>;
}

export default function RootLayout() {
  const toastCtx = useToastProvider();

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <ToastContext.Provider value={toastCtx}>
          <StatusBar style="auto" />
          <View style={{ flex: 1 }}>
            <AuthGuard>
              <Stack screenOptions={{ headerShown: false }} />
            </AuthGuard>
            <ToastContainer toasts={toastCtx.toasts} onDismiss={toastCtx.dismissToast} />
          </View>
        </ToastContext.Provider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
