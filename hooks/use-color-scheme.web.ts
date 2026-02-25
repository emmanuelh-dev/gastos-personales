// En web, usamos nuestro ThemeContext en lugar de Appearance/useRNColorScheme,
// ya que Appearance.setColorScheme no funciona en todos los navegadores.
import { useTheme } from '@/context/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  return useTheme().scheme;
}
