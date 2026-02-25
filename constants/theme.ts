/**
 * Colores y tokens de diseño para App Gastos
 * Inspirado en la estética de Mercado Libre / GBM
 */

import { Platform } from 'react-native';

// Paleta principal amarillo-dorado (ML style)
export const Palette = {
  yellow: '#FFE600',
  yellowDark: '#F5D800',
  yellowLight: '#FFF5A0',
  blue: '#3483FA',
  blueDark: '#2968C8',
  blueLight: '#EBF3FF',
  green: '#00A650',
  greenLight: '#E6F9EE',
  red: '#F23D4F',
  redLight: '#FEE8EB',
  gray50: '#F5F5F5',
  gray100: '#EBEBEB',
  gray200: '#D9D9D9',
  gray400: '#999999',
  gray600: '#666666',
  gray800: '#333333',
  gray900: '#1A1A1A',
  white: '#FFFFFF',
  black: '#000000',
};

export const Colors = {
  light: {
    text: Palette.gray900,
    textSecondary: Palette.gray600,
    background: Palette.gray50,
    card: Palette.white,
    tint: Palette.blue,
    icon: Palette.gray600,
    tabIconDefault: Palette.gray400,
    tabIconSelected: Palette.blue,
    border: Palette.gray100,
    primary: Palette.yellow,
    income: Palette.green,
    expense: Palette.red,
    incomeLight: Palette.greenLight,
    expenseLight: Palette.redLight,
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#111111',
    card: '#1E1E1E',
    tint: Palette.yellow,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: Palette.yellow,
    border: '#2A2A2A',
    primary: Palette.yellow,
    income: '#00D468',
    expense: '#FF6070',
    incomeLight: '#0D2B1A',
    expenseLight: '#2B0D10',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
