import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getThemeColors, type ThemeMode } from '../constants/theme';

const THEME_KEY = 'CHEWY_THEME_MODE';

export interface ThemeContextValue {
  mode: ThemeMode;
  colors: ReturnType<typeof getThemeColors>;
  isDark: boolean;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  colors: getThemeColors('light'),
  isDark: false,
  toggleTheme: () => {},
  setMode: () => {},
});

export function useThemeProvider(): ThemeContextValue {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'dark' || stored === 'light') {
        setModeState(stored);
      }
    });
  }, []);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    AsyncStorage.setItem(THEME_KEY, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode(mode === 'light' ? 'dark' : 'light');
  }, [mode, setMode]);

  return {
    mode,
    colors: getThemeColors(mode),
    isDark: mode === 'dark',
    toggleTheme,
    setMode,
  };
}

export function useTheme() {
  return useContext(ThemeContext);
}
