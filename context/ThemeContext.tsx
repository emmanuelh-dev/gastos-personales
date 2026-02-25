import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

const THEME_KEY = '@finance_theme_v1';

interface ThemeContextValue {
  scheme: 'light' | 'dark';
  /** Timestamp que cambia en cada toggle – úsalo como `key` para forzar re-render */
  themeVersion: number;
  toggleScheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  themeVersion: 0,
  toggleScheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [scheme, setScheme] = useState<'light' | 'dark'>(
    (Appearance.getColorScheme() ?? 'light') as 'light' | 'dark'
  );
  const [themeVersion, setThemeVersion] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((val) => {
      if (val === 'light' || val === 'dark') {
        setScheme(val);
        setThemeVersion((v) => v + 1);
        try { Appearance.setColorScheme(val); } catch { /* ignorar */ }
      }
    }).catch(() => { });
  }, []);

  const toggleScheme = useCallback(() => {
    setScheme((prev) => {
      const next: 'light' | 'dark' = prev === 'light' ? 'dark' : 'light';
      AsyncStorage.setItem(THEME_KEY, next).catch(console.error);
      try { Appearance.setColorScheme(next); } catch { /* ignorar en web */ }
      return next;
    });
    // Incrementar versión para propagar el re-render a todos los consumidores
    setThemeVersion((v) => v + 1);
  }, []);

  return (
    <ThemeContext.Provider value={{ scheme, themeVersion, toggleScheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
