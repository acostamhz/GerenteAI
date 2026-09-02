import { Injectable, Logger } from '@nestjs/common';
import {
  BeneficiarioReparto,
  CategoriaGasto,
  MetodoPago,
  Prisma,
} from '@prisma/client';

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
  type PaymentMethod,
  type ProfitBeneficiary,
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
        paymentMethod: gasto.metodoPago
          ? PAYMENT_FROM_PRISMA[gasto.metodoPago]
          : null,
        isCredit: false,
        customerName: null,
        groupId: gasto.grupoId,
      })),
      ...ventas.map((venta): Transaction => ({
        id: venta.id,
        businessId: venta.sedeId,
        date: isoDate(venta.fecha),
        // El concepto real cuando existe. Sin este campo no habia forma de
        // buscar un ingreso por su nombre, como si se hace con los gastos.
        description:
          venta.descripcion ??
          `Venta ${venta.tipo === 'FIADO' ? 'a credito' : 'de contado'}`,
        category: 'ventas',
        amount: toNumber(venta.total),
        type: 'income',
        currency: 'COP',
        source: 'manual' as const,
        createdAt: venta.fecha.toISOString(),
        paymentMethod: venta.metodoPago
          ? PAYMENT_FROM_PRISMA[venta.metodoPago]
          : null,
        isCredit: venta.tipo === 'FIADO',
        customerName: null,
        groupId: venta.grupoId,
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

    // Los clientes de los fiados se resuelven antes de abrir la transaccion:
    // buscar o crear un cliente es una consulta aparte y no puede ir dentro de
    // la lista de operaciones atomicas.
    const clientes = await this.resolveCustomers(transactions);

    const operations: Prisma.PrismaPromise<unknown>[] = transactions.map(
      (transaction) => this.buildWriteOperation(transaction, clientes),
    );

    await this.prisma.$transaction(operations);

    this.logger.log(
      `Guardados ${transactions.length} movimientos en sede ${transactions[0].businessId} (origen: ${transactions[0].source}).`,
    );

    return transactions;
  }

  /**
   * Sustituye un movimiento por sus partes, en una sola transaccion de base.
   *
   * Si se guardaran las partes sin borrar el total, el dinero quedaria contado
   * dos veces; si se borrara primero y fallara la insercion, se perderia la
   * venta. Por eso las dos cosas van juntas o no van.
   */
  async replaceTransaction(
    businessId: string,
    transactionId: string,
    parts: Transaction[],
  ): Promise<Transaction[]> {
    const clientes = await this.resolveCustomers(parts);

    // El movimiento original puede ser una venta o un gasto: se intenta borrar
    // en ambas tablas y solo una encuentra la fila.
    const operations: Prisma.PrismaPromise<unknown>[] = [
      this.prisma.venta.deleteMany({
        where: { id: transactionId, sedeId: businessId },
      }),
      this.prisma.gasto.deleteMany({
        where: { id: transactionId, sedeId: businessId },
      }),
      ...parts.map((part) => this.buildWriteOperation(part, clientes)),
    ];

    await this.prisma.$transaction(operations);

    this.logger.log(
      `Movimiento ${transactionId} reemplazado por ${parts.length} partes en sede ${businessId}.`,
    );

    return parts;
  }

  /** Guarda el reparto de utilidades: una fila por beneficiario. */
  async saveProfitDistribution(
    distribution: ProfitDistribution,
  ): Promise<ProfitDistribution> {
    await this.prisma.repartoUtilidad.createMany({
      data: distribution.shares.map((share) => ({
        beneficiario: BENEFICIARY_TO_PRISMA[share.beneficiary],
        nombre: share.name,
        porcentaje: new Prisma.Decimal(share.percentage),
        monto: new Prisma.Decimal(share.amount),
        totalRepartido: new Prisma.Decimal(distribution.total),
        grupoId: distribution.groupId,
        sedeId: distribution.businessId,
        fecha: new Date(`${distribution.date}T12:00:00.000Z`),
      })),
    });

    this.logger.log(
      `Reparto de utilidades de ${distribution.total} entre ${distribution.shares.length} beneficiarios en sede ${distribution.businessId}.`,
    );

    return distribution;
  }

  /**
   * Corrige un movimiento en PostgreSQL.
   *
   * Al escribir en las mismas tablas que lee el panel (`Venta`, `Gasto`), la
   * correccion hecha por WhatsApp aparece en la web sin ningun paso extra: no
   * hay copia que sincronizar.
   *
   * Un movimiento puede ser venta o gasto y el id no dice cual, asi que se
   * intenta en las dos tablas; solo una tiene la fila.
   */
  async updateTransaction(
    businessId: string,
    transactionId: string,
    changes: TransactionChanges,
  ): Promise<Transaction | null> {
    const monto =
      changes.amount !== undefined
        ? new Prisma.Decimal(changes.amount)
        : undefined;

    const venta = await this.prisma.venta.updateMany({
      where: { id: transactionId, sedeId: businessId },
      data: {
        total: monto,
        descripcion: changes.description,
        // Un fiado corregido debe reflejar el nuevo saldo por cobrar; si no,
        // el reporte de cuentas por cobrar seguiria mostrando el monto viejo.
        ...(monto !== undefined ? { saldoPendiente: monto } : {}),
      },
    });

    if (venta.count === 0) {
      const gasto = await this.prisma.gasto.updateMany({
        where: { id: transactionId, sedeId: businessId },
        data: { monto, descripcion: changes.description },
      });
      if (gasto.count === 0) return null;
    }

    this.logger.log(
      `Movimiento ${transactionId} corregido en sede ${businessId}: ${JSON.stringify(changes)}.`,
    );

    return this.findTransaction(businessId, transactionId);
  }

  async deleteTransaction(
    businessId: string,
    transactionId: string,
  ): Promise<boolean> {
    const [venta, gasto] = await this.prisma.$transaction([
      this.prisma.venta.deleteMany({
        where: { id: transactionId, sedeId: businessId },
      }),
      this.prisma.gasto.deleteMany({
        where: { id: transactionId, sedeId: businessId },
      }),
    ]);

    const borrado = venta.count + gasto.count > 0;
    if (borrado) {
      this.logger.log(
        `Movimiento ${transactionId} eliminado de la sede ${businessId}.`,
      );
    }
    return borrado;
  }

  /** Relee un movimiento por su id, venga de la tabla que venga. */
  private async findTransaction(
    businessId: string,
    transactionId: string,
  ): Promise<Transaction | null> {
    const rows = await this.listTransactions({ businessId, limit: 1_000 });
    return rows.find((row) => row.id === transactionId) ?? null;
  }

  // ------------------------------------------------------- escritura: detalle

  /**
   * Traduce un movimiento del dominio a la operacion de Prisma que le
   * corresponde. Un ingreso es una Venta; todo lo demas, un Gasto.
   */
  private buildWriteOperation(
    transaction: Transaction,
    clientes: Map<string, string>,
  ): Prisma.PrismaPromise<unknown> {
    return transaction.type === 'income'
      ? this.prisma.venta.create({
          data: {
            id: transaction.id,
            sedeId: transaction.businessId,
            total: new Prisma.Decimal(transaction.amount),
            // Un fiado se registra como venta a credito con su saldo por
            // cobrar. Antes todo entraba como CONTADO y el reporte de fiados,
            // que filtra por saldoPendiente > 0, nunca los veia.
            tipo: transaction.isCredit ? 'FIADO' : 'CONTADO',
            saldoPendiente: new Prisma.Decimal(
              transaction.isCredit ? transaction.amount : 0,
            ),
            descripcion: transaction.description,
            metodoPago: transaction.paymentMethod
              ? PAYMENT_TO_PRISMA[transaction.paymentMethod]
              : null,
            grupoId: transaction.groupId ?? null,
            clienteId: transaction.customerName
              ? (clientes.get(customerKey(transaction)) ?? null)
              : null,
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
            metodoPago: transaction.paymentMethod
              ? PAYMENT_TO_PRISMA[transaction.paymentMethod]
              : null,
            grupoId: transaction.groupId ?? null,
            fecha: new Date(transaction.createdAt),
          },
        });
  }

  /**
   * Busca o crea los clientes de las ventas fiadas y devuelve sus ids.
   *
   * Un fiado sin cliente no sirve para nada: el reporte de cuentas por cobrar
   * necesita saber a quien cobrarle. Se busca por nombre dentro de la sede,
   * sin distinguir mayusculas, y se crea si no existe.
   */
  private async resolveCustomers(
    transactions: Transaction[],
  ): Promise<Map<string, string>> {
    const resultado = new Map<string, string>();

    const pendientes = transactions.filter(
      (transaction) => transaction.isCredit && transaction.customerName,
    );

    for (const transaction of pendientes) {
      const clave = customerKey(transaction);
      if (resultado.has(clave)) continue;

      const nombre = transaction.customerName!.trim();
      const existente = await this.prisma.cliente.findFirst({
        where: {
          sedeId: transaction.businessId,
          nombre: { equals: nombre, mode: 'insensitive' },
        },
      });

      const cliente =
        existente ??
        (await this.prisma.cliente.create({
          data: { nombre, sedeId: transaction.businessId },
        }));

      resultado.set(clave, cliente.id);
    }

    return resultado;
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

const PAYMENT_TO_PRISMA: Record<PaymentMethod, MetodoPago> = {
  efectivo: MetodoPago.EFECTIVO,
  transferencia: MetodoPago.TRANSFERENCIA,
  tarjeta: MetodoPago.TARJETA,
  otro: MetodoPago.OTRO,
};

const PAYMENT_FROM_PRISMA: Record<MetodoPago, PaymentMethod> = {
  EFECTIVO: 'efectivo',
  TRANSFERENCIA: 'transferencia',
  TARJETA: 'tarjeta',
  OTRO: 'otro',
};

const BENEFICIARY_TO_PRISMA: Record<ProfitBeneficiary, BeneficiarioReparto> = {
  dueno: BeneficiarioReparto.DUENO,
  trabajador: BeneficiarioReparto.TRABAJADOR,
};

/** Identifica a un cliente dentro de una sede, sin distinguir mayusculas. */
function customerKey(transaction: Transaction): string {
  return `${transaction.businessId}:${(transaction.customerName ?? '').trim().toLowerCase()}`;
}

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
