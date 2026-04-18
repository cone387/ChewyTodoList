import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { authApi } from '../shared/services/api';
import { storage } from '../shared/services/storage';

const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const;

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = loading

  // 初始化时检查 token
  useEffect(() => {
    storage.getItem(TOKEN_KEYS.access).then((token) => {
      setIsAuthenticated(!!token);
    });
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const response = await authApi.login({ username, password });
    const { access, refresh } = response.data.data;
    await storage.setItem(TOKEN_KEYS.access, access);
    await storage.setItem(TOKEN_KEYS.refresh, refresh);
    setIsAuthenticated(true);
    return response.data;
  }, []);

  const register = useCallback(
    async (username: string, password: string, email: string) => {
      const response = await authApi.register({
        username,
        email,
        password,
        password_confirm: password,
      });
      const { access, refresh } = response.data.data;
      await storage.setItem(TOKEN_KEYS.access, access);
      await storage.setItem(TOKEN_KEYS.refresh, refresh);
      setIsAuthenticated(true);
      return response.data;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // 即使 API 失败也清除本地 token
    } finally {
      await storage.removeItem(TOKEN_KEYS.access);
      await storage.removeItem(TOKEN_KEYS.refresh);
      setIsAuthenticated(false);
      router.replace('/(auth)/login');
    }
  }, []);

  return { isAuthenticated, login, register, logout };
}
