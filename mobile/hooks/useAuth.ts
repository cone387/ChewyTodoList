import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { authApi } from '../shared/services/api';
import { storage } from '../shared/services/storage';

const TOKEN_KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
} as const;

export interface AuthContextValue {
  isAuthenticated: boolean | null;
  login: (username: string, password: string) => Promise<any>;
  register: (username: string, password: string, email: string) => Promise<any>;
  logout: () => Promise<void>;
}

// Global context so AuthGuard and all pages share the same state
export const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

/**
 * Call this ONCE in _layout.tsx to create the provider value.
 */
export function useAuthProvider(): AuthContextValue {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

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
    const refreshToken = await storage.getItem(TOKEN_KEYS.refresh);
    try {
      await authApi.logout(refreshToken || undefined);
    } catch {}
    await storage.removeItem(TOKEN_KEYS.access);
    await storage.removeItem(TOKEN_KEYS.refresh);
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, login, register, logout };
}

/**
 * Use this in any component to access auth state & actions.
 */
export function useAuth() {
  return useContext(AuthContext);
}
