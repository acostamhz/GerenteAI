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
  /**
   * Desglose de un total que ya se registro antes ("de esos 2 millones,
   * 1.500.000 fueron en efectivo"). No suma dinero nuevo: reemplaza el
   * movimiento total por sus partes.
   */
  | 'breakdown'
  /** Reparto de utilidades entre el dueno y los trabajadores. */
  | 'profit_share'
  /** Le pidieron algo que no son las finanzas del negocio (codigo, poemas...). */
  | 'out_of_scope'
  /** Pidio una funcion que solo existe en los planes pagos. */
  | 'premium';

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
 * Como entro o salio el dinero. Espeja el enum `MetodoPago` de la base.
 *
 * Sirve para desglosar un total en sus partes ("de los $2.000.000, $1.500.000
 * fueron en efectivo") sin perder la relacion con el total: las partes se
 * agrupan con `groupId`.
 */
export const PAYMENT_METHODS = [
  'efectivo',
  'transferencia',
  'tarjeta',
  'otro',
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
  otro: 'Otro',
};

/** A quien le toca una parte de las utilidades repartidas. */
export const PROFIT_BENEFICIARIES = ['dueno', 'trabajador'] as const;

export type ProfitBeneficiary = (typeof PROFIT_BENEFICIARIES)[number];

export const PROFIT_BENEFICIARY_LABELS: Record<ProfitBeneficiary, string> = {
  dueno: 'Dueño',
  trabajador: 'Trabajador',
};

/** Una parte del reparto de utilidades, ya validada. */
export interface ProfitShare {
  beneficiary: ProfitBeneficiary;
  /** Nombre concreto si se dijo ("Maria"). null si solo se dijo el rol. */
  name: string | null;
  /** Porcentaje del total repartido, de 0 a 100. */
  percentage: number;
  /** Monto que le corresponde, ya calculado sobre el total. */
  amount: number;
}

/**
 * Un movimiento suelto tal como lo entendio el modelo.
 *
 * Un mensaje puede contener varios ("pague 50.000 de transporte y 30.000 de
 * almuerzo"), y cada uno termina siendo una fila propia. Antes solo cabia uno
 * y el modelo se veia obligado a sumarlos en un unico registro.
 */
export interface MovementDraft {
  type: TransactionType;
  /** Siempre positivo. */
  amount: number;
  category: TransactionCategory;
  concept: string | null;
  /** null = el usuario no dijo como pago. */
  paymentMethod: PaymentMethod | null;
  /** true = venta fiada: quedo registrada pero el dinero aun no entro. */
  isCredit: boolean;
  /** A quien se le fio, cuando se menciona. */
  customerName: string | null;
}

/** Que clase de consulta hizo el usuario. */
export type QueryKind =
  /** "¿Como voy?" → totales del periodo. */
  | 'summary'
  /** "¿Cuales son esos 8 movimientos?" → el detalle, uno por uno. */
  | 'list'
  /** "¿Que dia compre jabones?" → busqueda por concepto. */
  | 'search';

/**
 * Lo que el modelo entiende de un mensaje. Es exactamente el JSON del
 * system prompt, ya validado y normalizado.
 */
export interface MessageIntent {
  type: MessageIntentType;
  /**
   * Movimientos detectados en el mensaje, ya validados. Vacio si el mensaje no
   * registraba nada (una consulta, un saludo).
   */
  movements: MovementDraft[];
  /**
   * Total general que el usuario declaro de viva voz ("hoy vendi $2.000.000").
   * Se compara contra la suma de `movements` para detectar desgloses que no
   * cuadran. null = no dijo un total, solo las partes.
   */
  declaredTotal: number | null;
  /** Reparto de utilidades, cuando el mensaje lo menciona. */
  profitShares: ProfitShare[];
  /**
   * Suma de los movimientos. Se conserva por compatibilidad: los consumidores
   * que solo manejan un movimiento (n8n, el panel) siguen leyendo aqui.
   */
  amount: number | null;
  /** Categoria del movimiento cuando hay exactamente uno. */
  category: string | null;
  concept: string | null;
  responseText: string;
  /** Que clase de consulta es. Solo para type "query". */
  queryKind: QueryKind | null;
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
  /**
   * Campos opcionales: los movimientos antiguos y los creados desde el panel
   * no los tienen, y todo el codigo existente sigue funcionando sin ellos.
   */
  /** Como se movio el dinero. */
  paymentMethod?: PaymentMethod | null;
  /** true = venta fiada: registrada, pero todavia por cobrar. */
  isCredit?: boolean;
  /** Cliente al que se le fio. */
  customerName?: string | null;
  /** Une el total con sus desgloses por metodo de pago. */
  groupId?: string | null;
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
  /**
   * Parte de `income` que corresponde a ventas fiadas: esta registrada pero
   * el dinero todavia no entro a la caja. Se informa aparte para que el
   * usuario no confunda lo vendido con lo cobrado.
   */
  pendingCollection: number;
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
