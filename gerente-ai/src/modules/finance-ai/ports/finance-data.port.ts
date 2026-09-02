import type {
  BusinessSnapshot,
  ProfitShare,
  Transaction,
} from '../domain/finance.types';

/**
 * Puerto de datos financieros.
 *
 * La capa de IA nunca toca la base de datos: pide informacion a traves de este
 * puerto. Hoy lo implementa un adaptador en memoria con datos de demostracion;
 * cuando exista el esquema real, se sustituye por uno de Prisma sin tocar los
 * servicios de IA.
 */

export interface TransactionQuery {
  businessId: string;
  from?: string;
  to?: string;
  type?: Transaction['type'];
  category?: string;
  limit?: number;
}

/** Lo que se puede corregir de un movimiento ya registrado. */
export interface TransactionChanges {
  amount?: number;
  description?: string;
}

/** Un reparto de utilidades listo para guardar. */
export interface ProfitDistribution {
  businessId: string;
  /** Utilidad que se repartio. */
  total: number;
  shares: ProfitShare[];
  date: string;
  groupId: string;
}

export interface FinanceDataPort {
  getSnapshot(businessId: string): Promise<BusinessSnapshot>;
  listTransactions(query: TransactionQuery): Promise<Transaction[]>;
  saveTransactions(transactions: Transaction[]): Promise<Transaction[]>;

  /**
   * Sustituye un movimiento por las partes en que se desglosa.
   *
   * Existe para el caso "primero el total, despues el desglose": el usuario
   * registra "hoy vendi 2.000.000" y minutos despues aclara como lo recibio.
   * Guardar las partes sin quitar el total duplicaria el dinero, asi que la
   * sustitucion tiene que ser atomica.
   */
  replaceTransaction(
    businessId: string,
    transactionId: string,
    parts: Transaction[],
  ): Promise<Transaction[]>;

  /** Guarda un reparto de utilidades. */
  saveProfitDistribution(
    distribution: ProfitDistribution,
  ): Promise<ProfitDistribution>;

  /**
   * Corrige un movimiento ya registrado.
   *
   * Solo se permiten el monto y el concepto: son los dos datos que la gente
   * dicta mal por WhatsApp. Cambiar el tipo (de gasto a ingreso) implicaria
   * mover la fila de tabla, y para eso es mas claro borrar y volver a
   * registrar.
   *
   * Devuelve el movimiento ya actualizado, o null si no existe.
   */
  updateTransaction(
    businessId: string,
    transactionId: string,
    changes: TransactionChanges,
  ): Promise<Transaction | null>;

  /** Elimina un movimiento. Devuelve false si no existia. */
  deleteTransaction(
    businessId: string,
    transactionId: string,
  ): Promise<boolean>;
}

export const FINANCE_DATA_PORT = Symbol('FINANCE_DATA_PORT');
