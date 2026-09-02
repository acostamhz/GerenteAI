import { Injectable } from '@nestjs/common';

import {
  type BusinessSnapshot,
  type CategoryTotal,
  type MonthlyTotals,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
} from '../domain/finance.types';
import type {
  FinanceDataPort,
  ProfitDistribution,
  TransactionChanges,
  TransactionQuery,
} from '../ports/finance-data.port';

/**
 * Adaptador en memoria con datos de demostracion, para que los endpoints de IA
 * funcionen antes de que exista la base de datos.
 *
 * Sustituir por `PrismaFinanceDataAdapter` cuando el esquema este listo:
 * solo hay que cambiar el `useClass` en `FinanceAiModule`.
 */
@Injectable()
export class InMemoryFinanceDataAdapter implements FinanceDataPort {
  private readonly businessNames: Record<string, string> = {
    'demo-business': 'El Virrey',
  };

  private readonly transactions: Transaction[] = seedTransactions();
  private readonly profitDistributions: ProfitDistribution[] = [];

  getSnapshot(businessId: string): Promise<BusinessSnapshot> {
    const rows = this.transactions.filter(
      (transaction) => transaction.businessId === businessId,
    );

    const totalIncome = sumByType(rows, 'income');
    const totalExpense = sumByType(rows, 'expense');
    const totalInvestment = sumByType(rows, 'investment');
    const dates = rows.map((row) => row.date).sort();

    return Promise.resolve({
      businessId,
      businessName: this.businessNames[businessId] ?? 'Negocio',
      currency: 'COP',
      periodStart: dates[0] ?? today(),
      periodEnd: dates[dates.length - 1] ?? today(),
      totalIncome,
      totalExpense,
      totalInvestment,
      balance: totalIncome - totalExpense - totalInvestment,
      monthly: groupByMonth(rows),
      topCategories: topCategories(rows),
      recentTransactions: [...rows]
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 15),
    });
  }

  listTransactions(query: TransactionQuery): Promise<Transaction[]> {
    const rows = this.transactions
      .filter((transaction) => transaction.businessId === query.businessId)
      .filter((transaction) => !query.from || transaction.date >= query.from)
      .filter((transaction) => !query.to || transaction.date <= query.to)
      .filter((transaction) => !query.type || transaction.type === query.type)
      .filter(
        (transaction) =>
          !query.category || transaction.category === query.category,
      )
      .sort((a, b) => b.date.localeCompare(a.date));

    return Promise.resolve(rows.slice(0, query.limit ?? 50));
  }

  saveTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    this.transactions.push(...transactions);
    return Promise.resolve(transactions);
  }

  replaceTransaction(
    businessId: string,
    transactionId: string,
    parts: Transaction[],
  ): Promise<Transaction[]> {
    const indice = this.transactions.findIndex(
      (row) => row.id === transactionId && row.businessId === businessId,
    );

    if (indice >= 0) this.transactions.splice(indice, 1);
    this.transactions.push(...parts);

    return Promise.resolve(parts);
  }

  saveProfitDistribution(
    distribution: ProfitDistribution,
  ): Promise<ProfitDistribution> {
    this.profitDistributions.push(distribution);
    return Promise.resolve(distribution);
  }

  updateTransaction(
    businessId: string,
    transactionId: string,
    changes: TransactionChanges,
  ): Promise<Transaction | null> {
    const fila = this.transactions.find(
      (row) => row.id === transactionId && row.businessId === businessId,
    );
    if (!fila) return Promise.resolve(null);

    if (changes.amount !== undefined) fila.amount = changes.amount;
    if (changes.description !== undefined)
      fila.description = changes.description;

    return Promise.resolve(fila);
  }

  deleteTransaction(
    businessId: string,
    transactionId: string,
  ): Promise<boolean> {
    const indice = this.transactions.findIndex(
      (row) => row.id === transactionId && row.businessId === businessId,
    );
    if (indice < 0) return Promise.resolve(false);

    this.transactions.splice(indice, 1);
    return Promise.resolve(true);
  }
}

// ------------------------------------------------------------------ helpers

function sumByType(rows: Transaction[], type: TransactionType): number {
  return rows
    .filter((row) => row.type === type)
    .reduce((total, row) => total + row.amount, 0);
}

function groupByMonth(rows: Transaction[]): MonthlyTotals[] {
  const buckets = new Map<string, MonthlyTotals>();

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    const bucket = buckets.get(month) ?? {
      month,
      income: 0,
      expense: 0,
      investment: 0,
    };
    bucket[row.type] += row.amount;
    buckets.set(month, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function topCategories(rows: Transaction[]): CategoryTotal[] {
  const buckets = new Map<string, CategoryTotal>();

  for (const row of rows) {
    const key = `${row.type}:${row.category}`;
    const bucket = buckets.get(key) ?? {
      category: row.category,
      type: row.type,
      total: 0,
    };
    bucket.total += row.amount;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => b.total - a.total).slice(0, 8);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Datos de demostracion equivalentes a `src/mocks/index.ts` del frontend. */
function seedTransactions(): Transaction[] {
  const rows: [string, string, TransactionCategory, number, TransactionType][] =
    [
      [
        '2025-07-15',
        'Venta mostrador — Cliente Ramirez',
        'ventas',
        4_800_000,
        'income',
      ],
      [
        '2025-07-15',
        'Compra inventario — Dist. Norte',
        'mercancia',
        2_150_000,
        'expense',
      ],
      [
        '2025-07-14',
        'Venta online — Mercado Libre',
        'ventas',
        1_340_000,
        'income',
      ],
      ['2025-07-14', 'Renta local julio', 'renta', 4_500_000, 'expense'],
      [
        '2025-07-14',
        'Venta mostrador — Cliente Lopez',
        'ventas',
        2_200_000,
        'income',
      ],
      ['2025-07-13', 'Nomina semanal', 'nomina', 5_600_000, 'expense'],
      [
        '2025-07-13',
        'Venta mayoreo — Tienda XYZ',
        'ventas',
        9_800_000,
        'income',
      ],
      [
        '2025-07-12',
        'Publicidad Meta Ads',
        'otros_gastos',
        1_200_000,
        'expense',
      ],
      [
        '2025-07-12',
        'Venta mostrador — Cliente Garcia',
        'ventas',
        3_100_000,
        'income',
      ],
      [
        '2025-07-11',
        'Servicios (agua, luz, internet)',
        'servicios',
        780_000,
        'expense',
      ],
      [
        '2025-07-10',
        'Compra de nevera industrial',
        'maquinaria',
        3_200_000,
        'investment',
      ],
      [
        '2025-06-28',
        'Venta mayoreo — Supermercado Sur',
        'ventas',
        7_400_000,
        'income',
      ],
      [
        '2025-06-27',
        'Compra inventario — Proveedor Meza',
        'mercancia',
        3_950_000,
        'expense',
      ],
      ['2025-06-20', 'Venta mostrador — varios', 'ventas', 5_100_000, 'income'],
      ['2025-06-15', 'Renta local junio', 'renta', 4_500_000, 'expense'],
      ['2025-06-10', 'Nomina quincena', 'nomina', 5_600_000, 'expense'],
    ];

  return rows.map(([date, description, category, amount, type], index) => ({
    id: `seed-${index + 1}`,
    businessId: 'demo-business',
    date,
    description,
    category,
    amount,
    type,
    currency: 'COP',
    source: 'import' as const,
    createdAt: new Date(`${date}T12:00:00.000Z`).toISOString(),
  }));
}
