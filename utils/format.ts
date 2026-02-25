/**
 * Formatea un número como moneda mexicana (MXN)
 */
export function formatCurrency(amount: number, showDecimals = true): string {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('es-MX', {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  });
  return `$${formatted}`;
}

/**
 * Formatea una fecha ISO en texto legible
 */
export function formatDate(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;

  return date.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/**
 * Agrupa transacciones por fecha
 */
export function groupByDate<T extends { date: string }>(items: T[]): { label: string; data: T[] }[] {
  const groups: Record<string, T[]> = {};
  for (const item of items) {
    const label = formatDate(item.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(item);
  }
  return Object.entries(groups).map(([label, data]) => ({ label, data }));
}

// ──── RECURRENCIA ─────────────────────────────────────────────────────────────

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export interface Recurrence {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  dayOfWeek?: number;   // 0=Dom … 6=Sab
  dayOfMonth?: number;  // 1-28
}

/** Convierte una recurrencia a texto: "Cada 1° del mes", "Cada viernes", etc. */
export function formatRecurrence(r: Recurrence): string {
  switch (r.frequency) {
    case 'monthly':  return `Cada ${r.dayOfMonth ?? 1}° del mes`;
    case 'weekly':   return `Cada ${DAY_NAMES[r.dayOfWeek ?? 1]}`;
    case 'biweekly': return `Cada 2 semanas (${DAY_NAMES[r.dayOfWeek ?? 1]})`;
    case 'daily':    return 'Diario';
    default:         return '';
  }
}

/** Determina si una transacción recurrente debe ejecutarse hoy. */
export function shouldExecToday(r: Recurrence, lastExec?: string): boolean {
  const today = new Date();
  const last  = lastExec ? new Date(lastExec) : null;
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

  if (last && sameDay(last, today)) return false; // ya ejecutó hoy

  switch (r.frequency) {
    case 'daily':
      return true;
    case 'monthly':
      return today.getDate() === (r.dayOfMonth ?? 1) &&
        (!last || last.getMonth() !== today.getMonth() || last.getFullYear() !== today.getFullYear());
    case 'weekly':
      return today.getDay() === (r.dayOfWeek ?? 1) &&
        (!last || (today.getTime() - last.getTime()) >= 6 * 24 * 60 * 60 * 1000);
    case 'biweekly':
      return today.getDay() === (r.dayOfWeek ?? 1) &&
        (!last || (today.getTime() - last.getTime()) >= 13 * 24 * 60 * 60 * 1000);
    default:
      return false;
  }
}
