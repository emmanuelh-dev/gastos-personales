import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  name: IoniconName;
  size?: number;
  color?: string;
}

export default function CategoryIcon({ name, size = 22, color = '#666' }: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}

// ── Mapa de íconos disponibles para usar en la app ─────────────────────────
// Gastos
export const EXPENSE_ICONS: { name: IoniconName; label: string }[] = [
  { name: 'fast-food', label: 'Comida' },
  { name: 'cafe', label: 'Café' },
  { name: 'pizza', label: 'Pizza' },
  { name: 'restaurant', label: 'Restaurante' },
  { name: 'car', label: 'Auto' },
  { name: 'bus', label: 'Bus' },
  { name: 'airplane', label: 'Vuelo' },
  { name: 'bicycle', label: 'Bici' },
  { name: 'flash', label: 'Luz' },
  { name: 'water', label: 'Agua' },
  { name: 'home', label: 'Casa' },
  { name: 'wifi', label: 'Internet' },
  { name: 'phone-portrait', label: 'Celular' },
  { name: 'heart', label: 'Salud' },
  { name: 'medkit', label: 'Medicina' },
  { name: 'fitness', label: 'Gym' },
  { name: 'game-controller', label: 'Videojuego' },
  { name: 'film', label: 'Streaming' },
  { name: 'musical-notes', label: 'Música' },
  { name: 'headset', label: 'Audífonos' },
  { name: 'football', label: 'Deporte' },
  { name: 'bag', label: 'Compras' },
  { name: 'cart', label: 'Supermercado' },
  { name: 'shirt', label: 'Ropa' },
  { name: 'gift', label: 'Regalo' },
  { name: 'pricetag', label: 'Oferta' },
  { name: 'paw', label: 'Mascotas' },
  { name: 'school', label: 'Educación' },
  { name: 'book', label: 'Libro' },
  { name: 'construct', label: 'Reparación' },
  { name: 'flag', label: 'Otro' },
];

// Ingresos
export const INCOME_ICONS: { name: IoniconName; label: string }[] = [
  { name: 'briefcase', label: 'Salario' },
  { name: 'laptop', label: 'Freelance' },
  { name: 'cash', label: 'Efectivo' },
  { name: 'card', label: 'Transferencia' },
  { name: 'wallet', label: 'Cartera' },
  { name: 'trending-up', label: 'Inversión' },
  { name: 'storefront', label: 'Negocio' },
  { name: 'star', label: 'Bono' },
  { name: 'gift', label: 'Regalo' },
  { name: 'flag', label: 'Otro' },
];

export const ALL_ICONS = [...EXPENSE_ICONS, ...INCOME_ICONS];
