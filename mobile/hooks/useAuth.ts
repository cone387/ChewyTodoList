import { useState, useEffect, useCallback } from 'react';
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
    // 1. Clear tokens first (synchronous-like on web, async on native)
    await storage.removeItem(TOKEN_KEYS.access);
    await storage.removeItem(TOKEN_KEYS.refresh);

    // 2. Try to call logout API (best effort, don't block)
    try {
      await authApi.logout();
    } catch {
      // Ignore — tokens already cleared locally
    }

    // 3. Set state — AuthGuard will handle the redirect
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, register, logout };
}
