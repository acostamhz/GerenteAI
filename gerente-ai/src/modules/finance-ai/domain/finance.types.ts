/** Modelo de dominio financiero de Luka AI. Independiente de la IA y del ORM. */

/**
 * Intenciones que puede tener un mensaje de WhatsApp.
 * Coincide exactamente con el campo `type` del JSON que devuelve el modelo.
 */
export type MessageIntentType =
  | 'income'
  | 'expense'
  | 'investment'
  | 'query'
  | 'correction'
  | 'unclear'
  /** Le pidieron algo que no son las finanzas del negocio (codigo, poemas...). */
  | 'out_of_scope';

/** Solo estas tres intenciones producen un movimiento contable. */
export type TransactionType = 'income' | 'expense' | 'investment';

export type QueryPeriod = 'day' | 'week' | 'month';

/** Categorias cerradas por tipo de movimiento. */
export const EXPENSE_CATEGORIES = [
  'mercancia',
  'insumos',
  'servicios',
  'nomina',
  'renta',
  'transporte',
  'mantenimiento',
  'otros_gastos',
] as const;

export const INCOME_CATEGORIES = [
  'ventas',
  'servicios_prestados',
  'cobros',
  'otros_ingresos',
] as const;

export const INVESTMENT_CATEGORIES = [
  'equipo',
  'maquinaria',
  'infraestructura',
  'tecnologia',
] as const;

export const TRANSACTION_CATEGORIES = [
  ...EXPENSE_CATEGORIES,
  ...INCOME_CATEGORIES,
  ...INVESTMENT_CATEGORIES,
] as const;

export type TransactionCategory = (typeof TRANSACTION_CATEGORIES)[number];

/** Categorias validas para cada tipo, y a cual caer si el modelo se equivoca. */
export const CATEGORIES_BY_TYPE: Record<
  TransactionType,
  readonly TransactionCategory[]
> = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
  investment: INVESTMENT_CATEGORIES,
};

export const DEFAULT_CATEGORY_BY_TYPE: Record<
  TransactionType,
  TransactionCategory
> = {
  expense: 'otros_gastos',
  income: 'otros_ingresos',
  investment: 'equipo',
};

/** Etiquetas para mostrar en el panel. La base guarda la clave, no el texto. */
export const CATEGORY_LABELS: Record<TransactionCategory, string> = {
  mercancia: 'Mercancía',
  insumos: 'Insumos',
  servicios: 'Servicios',
  nomina: 'Nómina',
  renta: 'Renta',
  transporte: 'Transporte',
  mantenimiento: 'Mantenimiento',
  otros_gastos: 'Otros gastos',
  ventas: 'Ventas',
  servicios_prestados: 'Servicios prestados',
  cobros: 'Cobros',
  otros_ingresos: 'Otros ingresos',
  equipo: 'Equipo',
  maquinaria: 'Maquinaria',
  infraestructura: 'Infraestructura',
  tecnologia: 'Tecnología',
};

/**
 * Lo que el modelo entiende de un mensaje. Es exactamente el JSON del
 * system prompt, ya validado y normalizado.
 */
export interface MessageIntent {
  type: MessageIntentType;
  amount: number | null;
  category: string | null;
  concept: string | null;
  responseText: string;
  queryPeriod: QueryPeriod | null;
  /**
   * Que tan seguro esta el modelo de su propia interpretacion (0 a 1).
   *
   * Lo pide el prompt, pero nunca se confia en el a ciegas: si el modelo no lo
   * devuelve o devuelve basura, el backend lo deriva de la calidad de los datos
   * extraidos (ver `normalizeConfidence`). Sirve para dos cosas: avisar en los
   * logs cuando la interpretacion es floja, y exponerlo a los canales externos
   * (n8n / WhatsApp) que deciden si pedir confirmacion al usuario.
   */
  confidence: number;
}

export interface Transaction {
  id: string;
  businessId: string;
  /** Fecha del movimiento en formato YYYY-MM-DD. */
  date: string;
  description: string;
  category: TransactionCategory;
  /** Siempre positivo; el signo lo determina `type`. */
  amount: number;
  type: TransactionType;
  currency: string;
  source: 'whatsapp' | 'manual' | 'import';
  createdAt: string;
}

export interface MonthlyTotals {
  month: string;
  income: number;
  expense: number;
  investment: number;
}

export interface CategoryTotal {
  category: TransactionCategory;
  type: TransactionType;
  total: number;
}

/** Resultado de una consulta ("¿cómo voy esta semana?"). */
export interface PeriodSummary {
  period: QueryPeriod;
  from: string;
  to: string;
  currency: string;
  income: number;
  expense: number;
  investment: number;
  balance: number;
  transactionCount: number;
  byCategory: CategoryTotal[];
}

/** Foto del negocio que se le entrega al modelo para razonar. */
export interface BusinessSnapshot {
  businessId: string;
  businessName: string;
  currency: string;
  periodStart: string;
  periodEnd: string;
  totalIncome: number;
  totalExpense: number;
  totalInvestment: number;
  balance: number;
  monthly: MonthlyTotals[];
  topCategories: CategoryTotal[];
  recentTransactions: Transaction[];
}

export type InsightType = 'warning' | 'success' | 'info';

export interface Insight {
  id: string;
  businessId: string;
  type: InsightType;
  title: string;
  body: string;
  /** Accion concreta sugerida al dueno del negocio. */
  action: string;
  /** 1 = urgente, 5 = informativo. */
  priority: number;
  generatedAt: string;
  read: boolean;
}
