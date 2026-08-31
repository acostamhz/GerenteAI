import { Injectable, Logger } from '@nestjs/common';
import { CategoriaGasto, Prisma } from '@prisma/client';

import { PrismaService } from '../../../services/prisma.service';
import {
  fechaColombiana,
  finDelDia,
  inicioDelDia,
} from '../domain/dia-colombia';
import {
  CATEGORY_LABELS,
  type BusinessSnapshot,
  type CategoryTotal,
  type MonthlyTotals,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
} from '../domain/finance.types';
import type {
  FinanceDataPort,
  TransactionQuery,
} from '../ports/finance-data.port';

/**
 * Adaptador real: la IA lee y escribe en PostgreSQL a traves de Prisma.
 *
 * ---------------------------------------------------------------------------
 * DECISIONES DE MAPEO (documentadas porque el dominio de IA y el esquema de la
 * base no nacieron con la misma forma):
 *
 *   businessId (dominio IA)  ==  Sede.id (base de datos)
 *       Gasto, Venta y Compra cuelgan de Sede, no de Negocio. La sede es la
 *       unidad contable real, asi que es la que identifica al "negocio" para
 *       la IA. El WhatsappRoutingService resuelve telefono -> sede.
 *
 *   expense     -> Gasto
 *   investment  -> Gasto con descripcion prefijada "Inversion · ..."
 *   income      -> Venta (tipo CONTADO, sin detalle de productos)
 *
 * LIMITACIONES CONOCIDAS (aceptadas a proposito, no son descuidos):
 *   1. `CategoriaGasto` en Prisma solo tiene 5 valores (ARRIENDO, SERVICIOS,
 *      NOMINA, TRANSPORTE, OTROS) y la IA maneja 8. Las que no tienen equivalente
 *      caen en OTROS y su etiqueta se conserva en `descripcion` para que un
 *      humano la vea. Al releer, esos gastos vuelven como "otros_gastos".
 *   2. Una inversion releida se ve como gasto: la base no distingue el tipo.
 *   Ambas se resuelven agregando valores al enum (ver docs/INTEGRACIONES.md).
 * ---------------------------------------------------------------------------
 */
@Injectable()
export class PrismaFinanceDataAdapter implements FinanceDataPort {
  private readonly logger = new Logger(PrismaFinanceDataAdapter.name);

  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------------ lectura

  async listTransactions(query: TransactionQuery): Promise<Transaction[]> {
    // `undefined` en un filtro de Prisma significa "no filtres por esto".
    const fecha = dateRange(query.from, query.to);
    const take = query.limit ?? 500;

    // Se consultan las tres tablas siempre y se filtra por tipo al final: son
    // tres indices por sedeId + fecha, y el codigo queda sin ramas.
    const [gastos, ventas, compras] = await Promise.all([
      this.prisma.gasto.findMany({
        where: { sedeId: query.businessId, fecha },
        orderBy: { fecha: 'desc' },
        take,
      }),
      this.prisma.venta.findMany({
        where: { sedeId: query.businessId, fecha },
        orderBy: { fecha: 'desc' },
        take,
      }),
      this.prisma.compra.findMany({
        where: { sedeId: query.businessId, fecha },
        orderBy: { fecha: 'desc' },
        take,
      }),
    ]);

    const rows: Transaction[] = [
      ...gastos.map((gasto): Transaction => ({
        id: gasto.id,
        businessId: gasto.sedeId,
        date: isoDate(gasto.fecha),
        description: gasto.descripcion,
        category: CATEGORY_FROM_PRISMA[gasto.categoria],
        amount: toNumber(gasto.monto),
        type: 'expense',
        currency: 'COP',
        source: 'manual' as const,
        createdAt: gasto.fecha.toISOString(),
      })),
      ...ventas.map((venta): Transaction => ({
        id: venta.id,
        businessId: venta.sedeId,
        date: isoDate(venta.fecha),
        description: `Venta ${venta.tipo === 'FIADO' ? 'a credito' : 'de contado'}`,
        category: 'ventas',
        amount: toNumber(venta.total),
        type: 'income',
        currency: 'COP',
        source: 'manual' as const,
        createdAt: venta.fecha.toISOString(),
      })),
      ...compras.map((compra): Transaction => ({
        id: compra.id,
        businessId: compra.sedeId,
        date: isoDate(compra.fecha),
        description: 'Compra a proveedor',
        category: 'mercancia',
        amount: toNumber(compra.total),
        type: 'expense',
        currency: 'COP',
        source: 'manual' as const,
        createdAt: compra.fecha.toISOString(),
      })),
    ];

    return rows
      .filter((row) => !query.type || row.type === query.type)
      .filter((row) => !query.category || row.category === query.category)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, take);
  }

  async getSnapshot(businessId: string): Promise<BusinessSnapshot> {
    const sede = await this.prisma.sede.findUnique({
      where: { id: businessId },
      include: { negocio: true },
    });

    // Ultimos 6 meses: suficiente para tendencias, acotado para no traer todo.
    const from = new Date();
    from.setMonth(from.getMonth() - 5);
    from.setDate(1);

    const rows = await this.listTransactions({
      businessId,
      from: isoDate(from),
      limit: 2_000,
    });

    const totalIncome = sumByType(rows, 'income');
    const totalExpense = sumByType(rows, 'expense');
    const totalInvestment = sumByType(rows, 'investment');
    const dates = rows.map((row) => row.date).sort();

    return {
      businessId,
      businessName: sede
        ? `${sede.negocio.nombre} - ${sede.nombre}`
        : 'Negocio',
      currency: 'COP',
      periodStart: dates[0] ?? isoDate(from),
      periodEnd: dates[dates.length - 1] ?? isoDate(new Date()),
      totalIncome,
      totalExpense,
      totalInvestment,
      balance: totalIncome - totalExpense - totalInvestment,
      monthly: groupByMonth(rows),
      topCategories: topCategories(rows),
      recentTransactions: rows.slice(0, 15),
    };
  }

  // ----------------------------------------------------------------- escritura

  async saveTransactions(transactions: Transaction[]): Promise<Transaction[]> {
    if (!transactions.length) return [];

    // Una sola transaccion de base: o entran todos los movimientos del mensaje
    // o no entra ninguno. Nada de contabilidad a medias.
    const operations: Prisma.PrismaPromise<unknown>[] = transactions.map(
      (transaction) =>
        transaction.type === 'income'
          ? this.prisma.venta.create({
              data: {
                id: transaction.id,
                sedeId: transaction.businessId,
                total: new Prisma.Decimal(transaction.amount),
                tipo: 'CONTADO',
                fecha: new Date(transaction.createdAt),
              },
            })
          : this.prisma.gasto.create({
              data: {
                id: transaction.id,
                sedeId: transaction.businessId,
                descripcion: buildDescription(transaction),
                monto: new Prisma.Decimal(transaction.amount),
                categoria: CATEGORY_TO_PRISMA[transaction.category] ?? 'OTROS',
                fecha: new Date(transaction.createdAt),
              },
            }),
    );

    await this.prisma.$transaction(operations);

    this.logger.log(
      `Guardados ${transactions.length} movimientos en sede ${transactions[0].businessId} (origen: ${transactions[0].source}).`,
    );

    return transactions;
  }
}

// -------------------------------------------------------------------- mapeos

const CATEGORY_TO_PRISMA: Partial<Record<TransactionCategory, CategoriaGasto>> =
  {
    renta: CategoriaGasto.ARRIENDO,
    servicios: CategoriaGasto.SERVICIOS,
    nomina: CategoriaGasto.NOMINA,
    transporte: CategoriaGasto.TRANSPORTE,
    // mercancia, insumos, mantenimiento, otros_gastos y las de inversion
    // no tienen equivalente: caen en OTROS (ver cabecera del archivo).
  };

const CATEGORY_FROM_PRISMA: Record<CategoriaGasto, TransactionCategory> = {
  ARRIENDO: 'renta',
  SERVICIOS: 'servicios',
  NOMINA: 'nomina',
  TRANSPORTE: 'transporte',
  OTROS: 'otros_gastos',
};

/**
 * Conserva en texto lo que el enum de la base no puede guardar: la categoria
 * fina de la IA y si era una inversion. Asi el dato no se pierde para quien
 * lea la tabla, aunque el enum diga OTROS.
 */
function buildDescription(transaction: Transaction): string {
  const prefix =
    transaction.type === 'investment'
      ? 'Inversion'
      : CATEGORY_TO_PRISMA[transaction.category]
        ? null
        : CATEGORY_LABELS[transaction.category];

  return prefix
    ? `${prefix} · ${transaction.description}`
    : transaction.description;
}

// ------------------------------------------------------------------- helpers

/**
 * Rango de fechas para Prisma.
 *
 * `from` y `to` son dias COLOMBIANOS, y aqui se convierten a los instantes UTC
 * que los delimitan: el 30 de agosto va de las 05:00Z de ese dia a las 04:59Z
 * del siguiente. Antes se interpretaban como dias UTC, y entonces todo lo
 * registrado despues de las 7 p.m. hora local caia fuera de "hoy".
 */
function dateRange(
  from?: string,
  to?: string,
): Prisma.DateTimeFilter | undefined {
  if (!from && !to) return undefined;

  return {
    gte: from ? inicioDelDia(from) : undefined,
    lte: to ? finDelDia(to) : undefined,
  };
}

/**
 * El dia que se le muestra al usuario. Es el colombiano y no el UTC: a quien
 * registro un gasto a las 11 p.m. del 30 hay que responderle "30", no "31".
 */
function isoDate(date: Date): string {
  return fechaColombiana(date);
}

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function sumByType(rows: Transaction[], type: TransactionType): number {
  return rows
    .filter((row) => row.type === type)
    .reduce((total, row) => total + row.amount, 0);
}

function groupByMonth(rows: Transaction[]): MonthlyTotals[] {
  const months = new Map<string, MonthlyTotals>();

  for (const row of rows) {
    const month = row.date.slice(0, 7);
    const bucket = months.get(month) ?? {
      month,
      income: 0,
      expense: 0,
      investment: 0,
    };
    bucket[row.type] += row.amount;
    months.set(month, bucket);
  }

  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

function topCategories(rows: Transaction[]): CategoryTotal[] {
  const totals = new Map<string, CategoryTotal>();

  for (const row of rows) {
    const key = `${row.type}:${row.category}`;
    const bucket = totals.get(key) ?? {
      category: row.category,
      type: row.type,
      total: 0,
    };
    bucket.total += row.amount;
    totals.set(key, bucket);
  }

  return [...totals.values()].sort((a, b) => b.total - a.total).slice(0, 8);
}
