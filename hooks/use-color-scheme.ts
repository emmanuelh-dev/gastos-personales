// `useColorScheme` retorna el scheme actual ('light' | 'dark') para compatibilidad
// con el código existente que lo usa como string.
// Para el toggle, importa `useTheme` directamente de '@/context/ThemeContext'.
import { useTheme } from '@/context/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  return useTheme().scheme;
}
