/**
 * Utilidades de formateo numérico, monetario y de fechas para el Dashboard y módulos financieros.
 */

const copFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const compactFormatter = new Intl.NumberFormat('es-CO', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat('es-CO');

/**
 * Formatea un número como moneda colombiana (COP), ej: $ 1.450.000
 */
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$ 0';
  }
  return copFormatter.format(amount);
}

/**
 * Formatea un número en notación compacta para gráficos, ej: 1,5M, 250K
 */
export function formatCompact(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '0';
  }
  return compactFormatter.format(amount);
}

/**
 * Formatea un número con separadores de miles estándar, ej: 1.250
 */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0';
  }
  return numberFormatter.format(value);
}

/**
 * Formatea una fecha ISO en formato legible local
 */
export function formatDate(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate);
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return isoDate;
  }
}
