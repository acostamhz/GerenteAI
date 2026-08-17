import type { BusinessSnapshot, Transaction } from '../domain/finance.types';

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

export interface FinanceDataPort {
  getSnapshot(businessId: string): Promise<BusinessSnapshot>;
  listTransactions(query: TransactionQuery): Promise<Transaction[]>;
  saveTransactions(transactions: Transaction[]): Promise<Transaction[]>;
}

export const FINANCE_DATA_PORT = Symbol('FINANCE_DATA_PORT');
