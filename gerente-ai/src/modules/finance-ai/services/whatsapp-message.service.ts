import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { LlmService } from '../../../ai/services/llm.service';
import type { AiCallContext } from '../../../ai/usage/usage.service';
import {
  fechaColombiana,
  partesDelDia,
  sumarDias,
} from '../domain/dia-colombia';
import {
  CATEGORIES_BY_TYPE,
  CATEGORY_LABELS,
  DEFAULT_CATEGORY_BY_TYPE,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PROFIT_BENEFICIARIES,
  PROFIT_BENEFICIARY_LABELS,
  type MessageIntent,
  type MessageIntentType,
  type MovementDraft,
  type PaymentMethod,
  type PeriodSummary,
  type ProfitBeneficiary,
  type ProfitShare,
  type QueryKind,
  type QueryPeriod,
  type Transaction,
  type TransactionCategory,
  type TransactionType,
} from '../domain/finance.types';
import {
  FINANCE_DATA_PORT,
  type FinanceDataPort,
} from '../ports/finance-data.port';
import {
  WHATSAPP_ASSISTANT_PROMPT_VERSION,
  WHATSAPP_INTENT_SCHEMA,
  buildWhatsAppAssistantSystemPrompt,
  type WhatsAppIntentOutput,
} from '../prompts/whatsapp-assistant.prompt';

/** Por debajo de esto la interpretacion se registra como sospechosa en los logs. */
export const LOW_CONFIDENCE_THRESHOLD = 0.6;

export interface WhatsAppMessageRequest {
  tenantId: string;
  businessId: string;
  message: string;
  businessName?: string;
  currency?: string;
  plan?: string;
  /** Guarda el movimiento detectado a traves del puerto de datos. */
  persist?: boolean;
  /**
   * Turnos anteriores de la conversacion, del mas viejo al mas nuevo.
   *
   * Sin esto el modelo no puede completar un movimiento a medias: preguntaba
   * el monto, el usuario lo respondia suelto y volvia a preguntar lo mismo.
   */
  history?: { role: 'user' | 'assistant'; content: string }[];
  /** Nombre comercial del plan, para decidir que funciones estan incluidas. */
  planName?: string;
  /** true si el plan vigente es el gratuito. */
  planIsFree?: boolean;
}

export interface WhatsAppMessageResult {
  /** Lo que el modelo entendio, ya validado. Es el JSON del system prompt. */
  intent: MessageIntent;
  /**
   * Todos los movimientos creados por el mensaje. Un mensaje puede traer
   * varios ("pague 50.000 de transporte y 30.000 de almuerzo").
   */
  transactions: Transaction[];
  /**
   * El primer movimiento, o null.
   *
   * Se conserva por compatibilidad con quienes solo esperaban uno (n8n, el
   * panel). Para saber todo lo que se registro, usa `transactions`.
   */
  transaction: Transaction | null;
  /** Reparto de utilidades registrado, si el mensaje lo pedia. */
  profitDistribution: {
    total: number;
    shares: ProfitShare[];
  } | null;
  /** Resumen real del periodo, si el mensaje era una consulta. */
  summary: PeriodSummary | null;
  /** El texto que se le responde al usuario por WhatsApp. */
  replyText: string;
  meta: {
    promptVersion: string;
    provider: string;
    model: string;
    latencyMs: number;
    costUsd: number;
  };
}

/**
 * Cerebro del chatbot financiero de WhatsApp.
 *
 * Flujo: mensaje → modelo → intencion validada → accion.
 *
 *   income / expense / investment → crea el movimiento
 *   query                        → consulta los datos reales y arma el resumen
 *   correction / unclear         → responde pidiendo o confirmando
 *
 * No sabe que IA hay detras: le pide a `LlmService` una respuesta con esquema.
 * Cambiar de proveedor no afecta a este archivo.
 */
@Injectable()
export class WhatsAppMessageService {
  private readonly logger = new Logger(WhatsAppMessageService.name);

  constructor(
    private readonly llm: LlmService,
    @Inject(FINANCE_DATA_PORT) private readonly financeData: FinanceDataPort,
  ) {}

  async handleMessage(
    request: WhatsAppMessageRequest,
  ): Promise<WhatsAppMessageResult> {
    const currency = request.currency ?? 'COP';
    const referenceDate = todayIso();

    const context: AiCallContext = {
      tenantId: request.tenantId,
      businessId: request.businessId,
      feature: 'whatsapp.message',
      plan: request.plan,
    };

    // ---- 1. La IA interpreta el mensaje -----------------------------------
    const { data, response } =
      await this.llm.completeJson<WhatsAppIntentOutput>(
        {
          system: buildWhatsAppAssistantSystemPrompt({
            businessName: request.businessName ?? 'el negocio',
            currency,
            referenceDate,
            planName: request.planName,
            planIsFree: request.planIsFree,
          }),
          messages: [
            ...(request.history ?? []),
            { role: 'user', content: request.message },
          ],
          schemaName: 'intencion_financiera',
          schema: WHATSAPP_INTENT_SCHEMA,
          // Interpretar un mensaje es determinista: sin creatividad.
          temperature: 0,
          effort: 'low',
          maxOutputTokens: 512,
        },
        context,
      );

    const intent = this.normalizeIntent(data);

    if (intent.confidence < LOW_CONFIDENCE_THRESHOLD) {
      // Traza para depurar el prompt: que mensajes reales confunden al modelo.
      this.logger.warn(
        `Interpretacion floja (confidence=${intent.confidence}, type=${intent.type}) para: "${request.message.slice(0, 80)}"`,
      );
    }

    // ---- 2. El backend actua segun la intencion ---------------------------
    const meta = {
      promptVersion: WHATSAPP_ASSISTANT_PROMPT_VERSION,
      provider: response.providerId,
      model: response.model,
      latencyMs: response.latencyMs,
      costUsd: response.costUsd,
    };

    // Cada intencion tiene su manejador. El switch deja a la vista todos los
    // caminos posibles del mensaje, que antes estaban encadenados en ifs.
    switch (intent.type) {
      case 'query':
        return this.handleQuery(intent, request, currency, meta);

      case 'breakdown':
        return this.handleBreakdown(intent, request, currency, meta);

      case 'profit_share':
        return this.handleProfitShare(intent, request, currency, meta);

      case 'income':
      case 'expense':
      case 'investment':
        return this.handleMovements(
          intent,
          request,
          currency,
          referenceDate,
          meta,
        );

      default:
        // correction, unclear, out_of_scope y premium solo responden.
        // Aplicar una correccion requiere persistencia (ver docs/IA.md).
        return this.plainResult(intent, intent.responseText, meta);
    }
  }

  // ------------------------------------------------------------- movimientos

  /**
   * Registra uno o varios movimientos.
   *
   * Antes de guardar nada comprueba que el desglose cuadre con el total que
   * dijo el usuario: registrar cifras que no suman es peor que no registrar,
   * porque el error queda escondido en la contabilidad.
   */
  private async handleMovements(
    intent: MessageIntent,
    request: WhatsAppMessageRequest,
    currency: string,
    referenceDate: string,
    meta: WhatsAppMessageResult['meta'],
  ): Promise<WhatsAppMessageResult> {
    if (!intent.movements.length) {
      this.logger.warn(
        `Intencion "${intent.type}" sin monto valido: "${request.message.slice(0, 80)}"`,
      );
      return this.needsClarification(
        intent,
        'No alcancé a identificar el monto. ¿Me lo confirmas para registrarlo?',
        meta,
      );
    }

    const descuadre = checkBreakdown(intent.declaredTotal, intent.movements);
    if (descuadre) {
      this.logger.warn(
        `Desglose que no cuadra: total ${descuadre.declared}, partes ${descuadre.sum}.`,
      );
      return this.needsClarification(
        intent,
        renderMismatch(descuadre, currency),
        meta,
      );
    }

    const transactions = this.buildTransactions(
      intent.movements,
      request,
      currency,
      referenceDate,
    );

    if (request.persist) {
      await this.financeData.saveTransactions(transactions);
    }

    return {
      intent,
      transactions,
      transaction: transactions[0] ?? null,
      profitDistribution: null,
      summary: null,
      // Con un solo movimiento se respeta el texto del modelo, que suena
      // natural. Con varios lo arma el backend: son cifras, y las cifras las
      // pone quien tiene los datos.
      replyText:
        transactions.length === 1
          ? intent.responseText
          : renderMovementsRegistered(transactions, currency),
      meta,
    };
  }

  /**
   * Desglosa un total que ya estaba registrado.
   *
   * Busca el movimiento del que se esta hablando y lo sustituye por sus partes.
   * Si no lo encuentra (el usuario nunca registro ese total), trata el mensaje
   * como movimientos nuevos en vez de perderlo.
   */
  private async handleBreakdown(
    intent: MessageIntent,
    request: WhatsAppMessageRequest,
    currency: string,
    meta: WhatsAppMessageResult['meta'],
  ): Promise<WhatsAppMessageResult> {
    if (!intent.movements.length) {
      return this.needsClarification(
        intent,
        'No entendí el desglose. ¿Me repites cuánto fue en cada forma de pago?',
        meta,
      );
    }

    const referenceDate = todayIso();
    const suma = sumAmounts(intent.movements);
    const original = await this.findTransactionToBreakDown(
      request.businessId,
      intent.movements[0].type,
      suma,
    );

    const partes = this.buildTransactions(
      intent.movements,
      request,
      currency,
      referenceDate,
      original?.groupId ?? randomUUID(),
    );

    if (!original) {
      // No hay un total previo con esa cifra: son movimientos nuevos.
      this.logger.warn(
        `Desglose sin total previo de ${suma} en sede ${request.businessId}: se registra como movimientos nuevos.`,
      );
      if (request.persist) {
        await this.financeData.saveTransactions(partes);
      }
      return {
        intent,
        transactions: partes,
        transaction: partes[0] ?? null,
        profitDistribution: null,
        summary: null,
        replyText: renderMovementsRegistered(partes, currency),
        meta,
      };
    }

    if (request.persist) {
      await this.financeData.replaceTransaction(
        request.businessId,
        original.id,
        partes,
      );
    }

    return {
      intent,
      transactions: partes,
      transaction: partes[0] ?? null,
      profitDistribution: null,
      summary: null,
      replyText: renderBreakdown(partes, suma, currency),
      meta,
    };
  }

  /**
   * Busca el movimiento total que el desglose viene a detallar.
   *
   * Criterio: mismo tipo, mismo monto que la suma de las partes, sin desglosar
   * todavia y reciente. Es deterministico y no necesita memoria de la
   * conversacion, que en WhatsApp no siempre llega completa.
   */
  private async findTransactionToBreakDown(
    businessId: string,
    type: TransactionType,
    total: number,
  ): Promise<Transaction | null> {
    const hoy = todayIso();
    const rows = await this.financeData.listTransactions({
      businessId,
      from: sumarDias(hoy, -BREAKDOWN_WINDOW_DAYS),
      to: hoy,
      type,
      limit: 200,
    });

    // No se filtra por `source`: la base no guarda de donde vino el movimiento
    // y el adaptador de Prisma devuelve "manual" para todo, asi que exigir
    // "whatsapp" no encontraria nunca el total y el desglose terminaria
    // duplicando el dinero.
    return (
      rows.find((row) => !row.groupId && Math.abs(row.amount - total) < 0.01) ??
      null
    );
  }

  // --------------------------------------------------- reparto de utilidades

  /**
   * Reparte las utilidades del periodo entre el dueno y los trabajadores.
   *
   * Los porcentajes los da el usuario; los montos los calcula el backend. Un
   * modelo de lenguaje no es de fiar haciendo aritmetica, y aqui el resultado
   * es plata que alguien va a recibir.
   */
  private async handleProfitShare(
    intent: MessageIntent,
    request: WhatsAppMessageRequest,
    currency: string,
    meta: WhatsAppMessageResult['meta'],
  ): Promise<WhatsAppMessageResult> {
    if (!intent.profitShares.length) {
      return this.needsClarification(
        intent,
        'Con gusto reparto las utilidades 😊 ¿Qué porcentaje te queda a ti y qué porcentaje va para los trabajadores?',
        meta,
      );
    }

    const suma = intent.profitShares.reduce(
      (total, share) => total + share.percentage,
      0,
    );
    if (Math.abs(suma - 100) > 0.01) {
      return this.needsClarification(
        intent,
        `Los porcentajes que me diste suman ${round2(suma)}% y deberían sumar 100%. ¿Me los confirmas?`,
        meta,
      );
    }

    const summary = await this.buildSummary(
      request.businessId,
      intent.queryPeriod ?? 'month',
      currency,
    );

    if (summary.balance <= 0) {
      return this.plainResult(
        intent,
        `Este periodo no hay utilidades para repartir: llevas ${formatMoney(summary.balance, currency)} de balance.`,
        meta,
      );
    }

    const shares = intent.profitShares.map((share) => ({
      ...share,
      amount: round2((summary.balance * share.percentage) / 100),
    }));

    if (request.persist) {
      await this.financeData.saveProfitDistribution({
        businessId: request.businessId,
        total: summary.balance,
        shares,
        date: todayIso(),
        groupId: randomUUID(),
      });
    }

    return {
      intent: { ...intent, profitShares: shares },
      transactions: [],
      transaction: null,
      profitDistribution: { total: summary.balance, shares },
      summary,
      replyText: renderProfitShare(summary.balance, shares, currency),
      meta,
    };
  }

  // ---------------------------------------------------------------- consultas

  /** Resumen, listado o busqueda, segun lo que pidio el usuario. */
  private async handleQuery(
    intent: MessageIntent,
    request: WhatsAppMessageRequest,
    currency: string,
    meta: WhatsAppMessageResult['meta'],
  ): Promise<WhatsAppMessageResult> {
    const period = intent.queryPeriod ?? 'month';

    // Una busqueda sin termino no se puede hacer: cae al resumen.
    if (intent.queryKind === 'search' && intent.concept) {
      const encontrados = await this.searchTransactions(
        request.businessId,
        intent.concept,
      );
      return {
        ...this.plainResult(intent, '', meta),
        replyText: renderSearch(intent.concept, encontrados, currency),
      };
    }

    const summary = await this.buildSummary(
      request.businessId,
      period,
      currency,
    );

    if (intent.queryKind === 'list') {
      const { from, to } = periodRange(period);
      // Se traen todos y el renderizador recorta: si se pidieran solo los 20
      // primeros, el encabezado diria "tus 20 movimientos" aunque hubiera 50,
      // y no cuadraria con el conteo que el resumen acaba de dar.
      const movimientos = await this.financeData.listTransactions({
        businessId: request.businessId,
        from,
        to,
        limit: 1_000,
      });
      return {
        ...this.plainResult(intent, '', meta),
        summary,
        replyText: renderMovementList(movimientos, period, currency),
      };
    }

    return {
      ...this.plainResult(intent, '', meta),
      summary,
      replyText: renderSummary(summary),
    };
  }

  // -------------------------------------------------------------- resultados

  /** Resultado sin movimientos ni reparto: solo texto. */
  private plainResult(
    intent: MessageIntent,
    replyText: string,
    meta: WhatsAppMessageResult['meta'],
  ): WhatsAppMessageResult {
    return {
      intent,
      transactions: [],
      transaction: null,
      profitDistribution: null,
      summary: null,
      replyText,
      meta,
    };
  }

  /**
   * El mensaje se entendio a medias: se pregunta y no se guarda nada.
   *
   * Al degradar a "unclear" se limpian los campos del movimiento: dejarlos
   * puestos haria creer que hay un registro a medio hacer.
   */
  private needsClarification(
    intent: MessageIntent,
    pregunta: string,
    meta: WhatsAppMessageResult['meta'],
  ): WhatsAppMessageResult {
    return this.plainResult(
      {
        ...intent,
        type: 'unclear',
        movements: [],
        amount: null,
        category: null,
        queryKind: null,
        queryPeriod: null,
        // Si no se pudo completar, la interpretacion no puede considerarse
        // buena por mucho que el modelo diga lo contrario.
        confidence: Math.min(intent.confidence, 0.4),
      },
      pregunta,
      meta,
    );
  }

  // ------------------------------------------------------------ validacion

  /**
   * Saneamiento defensivo: aunque el esquema obligue, un modelo puede devolver
   * un tipo raro, un monto negativo o una categoria inventada. Nada de eso
   * debe llegar a la contabilidad del cliente.
   */
  private normalizeIntent(output: WhatsAppIntentOutput): MessageIntent {
    const type = normalizeType(output?.type);
    const movements = normalizeMovements(output?.movements);
    const concept = cleanText(output?.concept);

    // `amount` y `category` se derivan de los movimientos para que quien solo
    // entiende un movimiento (n8n, el panel) siga leyendo algo coherente.
    const amount = movements.length ? sumAmounts(movements) : null;
    const category = movements.length === 1 ? movements[0].category : null;
    // Con un solo movimiento su concepto es el del mensaje; con varios, no hay
    // uno que represente al conjunto y se deja el que haya dado el modelo.
    const conceptoEfectivo =
      movements.length === 1 ? (movements[0].concept ?? concept) : concept;

    return {
      type,
      movements,
      declaredTotal: normalizeAmount(output?.declaredTotal),
      profitShares: normalizeProfitShares(output?.profitShares),
      amount,
      category,
      concept: conceptoEfectivo,
      responseText:
        cleanText(output?.responseText) ??
        'Recibí tu mensaje, pero no logré interpretarlo. ¿Me lo repites?',
      queryKind:
        type === 'query'
          ? normalizeQueryKind(output?.queryKind, concept)
          : null,
      queryPeriod:
        type === 'query' || type === 'profit_share'
          ? normalizePeriod(output?.queryPeriod)
          : null,
      confidence: normalizeConfidence(output?.confidence, {
        type,
        amount,
        concept: conceptoEfectivo,
      }),
    };
  }

  /**
   * Convierte los movimientos entendidos por el modelo en filas listas para
   * guardar.
   *
   * Cuando hay mas de uno comparten `groupId`: asi el panel puede mostrarlos
   * juntos y se sabe que salieron del mismo mensaje.
   */
  private buildTransactions(
    movements: MovementDraft[],
    request: WhatsAppMessageRequest,
    currency: string,
    referenceDate: string,
    groupId?: string,
  ): Transaction[] {
    const grupo = groupId ?? (movements.length > 1 ? randomUUID() : null);
    const createdAt = new Date().toISOString();

    return movements.map((movement) => ({
      id: randomUUID(),
      businessId: request.businessId,
      date: referenceDate,
      description:
        movement.concept ??
        `Movimiento registrado por WhatsApp (${movement.type})`,
      category: movement.category,
      amount: movement.amount,
      type: movement.type,
      currency,
      source: 'whatsapp',
      createdAt,
      paymentMethod: movement.paymentMethod,
      isCredit: movement.isCredit,
      customerName: movement.customerName,
      groupId: grupo,
    }));
  }

  // -------------------------------------------------------------- consultas

  /**
   * Movimientos cuyo texto coincide con lo que pregunto el usuario.
   *
   * La ventana es amplia a proposito: quien pregunta "¿que dia compre jabones?"
   * no esta pensando en un periodo, esta buscando un hecho, y suele haber pasado
   * hace semanas. Se compara sin tildes ni mayusculas para que "jabon" encuentre
   * "Jabones".
   */
  private async searchTransactions(
    businessId: string,
    termino: string,
  ): Promise<Transaction[]> {
    const { from, to } = periodRange('month');

    const rows = await this.financeData.listTransactions({
      businessId,
      from: sumarDias(from, -SEARCH_WINDOW_DAYS),
      to,
      limit: 1_000,
    });

    const buscado = normalizeText(termino);
    if (!buscado) return [];

    return rows
      .filter((row) => normalizeText(row.description).includes(buscado))
      .slice(0, SEARCH_MAX_RESULTS);
  }

  private async buildSummary(
    businessId: string,
    period: QueryPeriod,
    currency: string,
  ): Promise<PeriodSummary> {
    const { from, to } = periodRange(period);

    const rows = await this.financeData.listTransactions({
      businessId,
      from,
      to,
      limit: 1_000,
    });

    const totals = { income: 0, expense: 0, investment: 0 };
    // Lo fiado esta dentro de `income` (la venta ocurrio) pero se informa
    // aparte: el dueno necesita distinguir lo vendido de lo cobrado.
    let pendingCollection = 0;
    const byCategory = new Map<string, PeriodSummary['byCategory'][number]>();

    for (const row of rows) {
      totals[row.type] += row.amount;
      if (row.isCredit) pendingCollection += row.amount;

      const key = `${row.type}:${row.category}`;
      const bucket = byCategory.get(key) ?? {
        category: row.category,
        type: row.type,
        total: 0,
      };
      bucket.total += row.amount;
      byCategory.set(key, bucket);
    }

    return {
      period,
      from,
      to,
      currency,
      income: totals.income,
      expense: totals.expense,
      investment: totals.investment,
      balance: totals.income - totals.expense - totals.investment,
      pendingCollection,
      transactionCount: rows.length,
      byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    };
  }
}

// ------------------------------------------------------------------ helpers

/**
 * Tipos aceptados en tiempo de ejecucion.
 *
 * Tiene que incluir todos los de `MessageIntentType`: lo que no este aqui se
 * degrada a "unclear" aunque el modelo lo haya devuelto bien.
 */
const INTENT_TYPES: MessageIntentType[] = [
  'income',
  'expense',
  'investment',
  'breakdown',
  'profit_share',
  'query',
  'correction',
  'unclear',
  'out_of_scope',
  'premium',
];

const TRANSACTION_TYPES: TransactionType[] = [
  'income',
  'expense',
  'investment',
];

function normalizeType(value: unknown): MessageIntentType {
  return typeof value === 'string' && (INTENT_TYPES as string[]).includes(value)
    ? (value as MessageIntentType)
    : 'unclear';
}

function normalizeAmount(value: unknown): number | null {
  const amount = Math.abs(Number(value));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return round2(amount);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/** Suma los montos de una lista de movimientos, sin errores de coma flotante. */
function sumAmounts(movements: { amount: number }[]): number {
  return round2(movements.reduce((total, row) => total + row.amount, 0));
}

/**
 * Valida los movimientos que devolvio el modelo.
 *
 * Se descartan los que no tienen un monto usable en vez de inventarlo, y se
 * corrige la categoria cuando no corresponde al tipo (un gasto no puede ser
 * "ventas": desalinearia los reportes).
 */
function normalizeMovements(value: unknown): MovementDraft[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw): MovementDraft | null => {
      const row = (raw ?? {}) as Record<string, unknown>;
      const amount = normalizeAmount(row.amount);
      if (amount === null) return null;

      const type = normalizeMovementType(row.type);

      return {
        type,
        amount,
        category: normalizeCategory(row.category, type),
        concept: cleanText(row.concept),
        paymentMethod: normalizePaymentMethod(row.paymentMethod),
        isCredit: row.isCredit === true,
        customerName: cleanText(row.customerName),
      };
    })
    .filter((movement): movement is MovementDraft => movement !== null)
    .slice(0, MAX_MOVEMENTS_PER_MESSAGE);
}

function normalizeMovementType(value: unknown): TransactionType {
  return typeof value === 'string' &&
    (TRANSACTION_TYPES as string[]).includes(value)
    ? (value as TransactionType)
    : 'expense';
}

function normalizePaymentMethod(value: unknown): PaymentMethod | null {
  if (typeof value !== 'string') return null;
  const candidate = value.trim().toLowerCase();
  return (
    PAYMENT_METHODS.find((method) => method === candidate) ??
    (candidate ? 'otro' : null)
  );
}

/** Porcentajes del reparto, saneados. Los montos se calculan en el servicio. */
function normalizeProfitShares(value: unknown): ProfitShare[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((raw): ProfitShare | null => {
      const row = (raw ?? {}) as Record<string, unknown>;
      const percentage = Number(row.percentage);
      if (!Number.isFinite(percentage) || percentage <= 0 || percentage > 100) {
        return null;
      }

      const beneficiary =
        typeof row.beneficiary === 'string' &&
        (PROFIT_BENEFICIARIES as readonly string[]).includes(row.beneficiary)
          ? (row.beneficiary as ProfitBeneficiary)
          : 'trabajador';

      return {
        beneficiary,
        name: cleanText(row.name),
        percentage: round2(percentage),
        // Provisional: lo reemplaza el servicio con la cifra real.
        amount: 0,
      };
    })
    .filter((share): share is ProfitShare => share !== null);
}

/**
 * Clase de consulta.
 *
 * Si el modelo no la dice pero dejo un termino de busqueda, es una busqueda:
 * un modelo pequeno omite el campo nuevo antes que el que ya conocia.
 */
function normalizeQueryKind(value: unknown, concept: string | null): QueryKind {
  if (value === 'summary' || value === 'list' || value === 'search') {
    return value;
  }
  return concept ? 'search' : 'summary';
}

/** Descuadre entre el total declarado y la suma de las partes. */
export interface BreakdownMismatch {
  declared: number;
  sum: number;
  difference: number;
}

/**
 * Comprueba que el desglose sume el total que dijo el usuario.
 *
 * Lo hace el backend y no el prompt a proposito: un modelo de lenguaje no es
 * de fiar sumando, y aqui una suma mal hecha se convierte en contabilidad
 * equivocada. Se tolera un peso de diferencia por los redondeos.
 */
export function checkBreakdown(
  declaredTotal: number | null,
  movements: { amount: number }[],
): BreakdownMismatch | null {
  if (declaredTotal === null || movements.length < 2) return null;

  const sum = sumAmounts(movements);
  const difference = round2(declaredTotal - sum);

  return Math.abs(difference) <= BREAKDOWN_TOLERANCE
    ? null
    : { declared: declaredTotal, sum, difference };
}

function normalizeCategory(
  value: unknown,
  type: TransactionType,
): TransactionCategory {
  if (typeof value !== 'string') return DEFAULT_CATEGORY_BY_TYPE[type];

  const candidate = value.trim().toLowerCase();
  const allowed = CATEGORIES_BY_TYPE[type];
  const match = allowed.find((category) => category === candidate);

  // Una categoria de otro tipo (p.ej. "ventas" en un gasto) no se acepta:
  // desalinearia los reportes.
  return match ?? DEFAULT_CATEGORY_BY_TYPE[type];
}

/**
 * Confianza del modelo, saneada.
 *
 * Un modelo pequeno a veces omite el campo, devuelve "0.9" como texto o pone
 * 1.0 en todo. Se acepta el valor solo si es un numero utilizable; si no, se
 * deriva de lo que realmente extrajo: sin monto no hay interpretacion buena.
 */
function normalizeConfidence(
  value: unknown,
  intent: {
    type: MessageIntentType;
    amount: number | null;
    concept: string | null;
  },
): number {
  const reported = Number(value);
  if (Number.isFinite(reported) && reported >= 0 && reported <= 1) {
    return Math.round(reported * 100) / 100;
  }

  if (intent.type === 'unclear') return 0.3;
  // Reconocer que algo NO es del dominio suele ser facil: no es una duda.
  if (intent.type === 'out_of_scope') return 0.9;
  if (intent.type === 'premium') return 0.9;
  if (intent.type === 'query') return 0.85;
  if (intent.type === 'correction') return 0.6;
  if (intent.amount === null) return 0.4;
  return intent.concept ? 0.9 : 0.7;
}

function normalizePeriod(value: unknown): QueryPeriod {
  return value === 'day' || value === 'week' || value === 'month'
    ? value
    : 'month';
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const text = value.trim();
  return text.length ? text : null;
}

/**
 * El dia de HOY en Colombia, no en la hora del contenedor.
 *
 * `toISOString()` da la fecha UTC: a las 7 p.m. en Colombia ya es el dia
 * siguiente en UTC, y los movimientos se confirmaban con la fecha de manana
 * aunque quedaran guardados con la de hoy. El resto del modulo ya calculaba
 * sobre el dia colombiano; esta funcion era la ultima que faltaba.
 */
function todayIso(): string {
  return fechaColombiana(new Date());
}

/** Rangos de fecha para las consultas: hoy, semana en curso, mes en curso. */
export function periodRange(
  period: QueryPeriod,
  now: Date = new Date(),
): { from: string; to: string } {
  // Todo se calcula sobre el dia colombiano, no sobre la hora del contenedor:
  // asi el periodo es el mismo corra donde corra el proceso.
  const { fecha: to, diaDeLaSemana, primeroDelMes } = partesDelDia(now);

  if (period === 'day') return { from: to, to };

  if (period === 'week') {
    // 0 = domingo. La semana laboral arranca el lunes.
    const desdeElLunes = diaDeLaSemana === 0 ? 6 : diaDeLaSemana - 1;
    return { from: sumarDias(to, -desdeElLunes), to };
  }

  return { from: primeroDelMes, to };
}

const PERIOD_LABELS: Record<QueryPeriod, string> = {
  day: 'hoy',
  week: 'esta semana',
  month: 'este mes',
};

/**
 * Arma la respuesta de una consulta con cifras reales.
 *
 * El modelo solo dice "dame un momento": los numeros los pone el backend, que
 * es la unica fuente confiable. Texto plano y sin markdown, es para WhatsApp.
 */
export function renderSummary(summary: PeriodSummary): string {
  const money = (value: number) => formatMoney(value, summary.currency);

  if (summary.transactionCount === 0) {
    return `Todavía no tienes movimientos registrados ${PERIOD_LABELS[summary.period]}.`;
  }

  const lines = [
    `📊 Resumen de ${PERIOD_LABELS[summary.period]}:`,
    `Ingresos: ${money(summary.income)}`,
    `Gastos: ${money(summary.expense)}`,
  ];

  if (summary.investment > 0) {
    lines.push(`Inversiones: ${money(summary.investment)}`);
  }

  // Lo fiado esta contado dentro de los ingresos, pero todavia no es plata en
  // caja. Decirlo evita que el dueno crea que tiene mas de lo que tiene.
  if (summary.pendingCollection > 0) {
    lines.push(
      `De eso, ${money(summary.pendingCollection)} está fiado por cobrar.`,
    );
  }

  lines.push(
    `Balance: ${money(summary.balance)}`,
    `(${summary.transactionCount} movimientos entre ${summary.from} y ${summary.to})`,
  );

  const topExpense = summary.byCategory.find((row) => row.type === 'expense');
  if (topExpense) {
    lines.push(
      `Tu mayor gasto fue ${CATEGORY_LABELS[topExpense.category]}: ${money(topExpense.total)}.`,
    );
  }

  // El resumen y el listado quedan conectados: quien ve el conteo sabe que
  // puede pedir el detalle, y el modelo tiene la pista para clasificar la
  // respuesta como queryKind "list".
  lines.push(
    'Escríbeme "muéstrame los movimientos" si quieres verlos uno por uno.',
  );

  return lines.join('\n');
}

function formatMoney(value: number, currency: string): string {
  // Formato colombiano (punto para miles). Ajustar si se opera en otro pais.
  return `$${Math.round(value).toLocaleString('es-CO')} ${currency}`;
}

/** Ventana de busqueda hacia atras. Cuatro meses cubre lo que la gente recuerda. */
/**
 * Tope de movimientos por mensaje. Nadie dicta veinte gastos de una sentada;
 * pasado ese punto es mas probable que el modelo se haya descarrilado.
 */
const MAX_MOVEMENTS_PER_MESSAGE = 15;

/** Diferencia que se acepta entre el total declarado y la suma de las partes. */
const BREAKDOWN_TOLERANCE = 1;

/**
 * Cuanto se mira hacia atras para encontrar el total que un desglose detalla.
 * Dos dias cubren el "ayer se me olvido decirte como me pagaron".
 */
const BREAKDOWN_WINDOW_DAYS = 2;

/** Cuantos movimientos caben comodos en un mensaje de WhatsApp. */
const LIST_MAX_RESULTS = 20;

const SEARCH_WINDOW_DAYS = 120;
/** Mas de esto no se lee comodo en un WhatsApp. */
const SEARCH_MAX_RESULTS = 8;

/** Sin tildes y en minusculas: "Jabón" y "jabones" deben cruzarse. */
function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: 'short',
});

/**
 * Respuesta a una busqueda concreta.
 *
 * Se listan los movimientos con su fecha, que es justo lo que se pregunta
 * ("¿que dia fue?"), y el total, que es lo que se pregunta despues.
 */
export function renderSearch(
  termino: string,
  encontrados: Transaction[],
  currency: string,
): string {
  if (encontrados.length === 0) {
    return `No encontré movimientos que mencionen "${termino}" en los últimos 4 meses. Si lo registraste con otro nombre, dime cuál y lo busco.`;
  }

  const total = encontrados.reduce((suma, row) => suma + row.amount, 0);
  const lineas = encontrados.map((row) => {
    const signo = row.type === 'income' ? '+' : '-';
    const fecha = FECHA_CORTA.format(new Date(`${row.date}T12:00:00.000Z`));
    return `• ${fecha} · ${row.description} · ${signo}${formatMoney(row.amount, currency)}`;
  });

  const encabezado =
    encontrados.length === 1
      ? `🔎 Encontré 1 movimiento con "${termino}":`
      : `🔎 Encontré ${encontrados.length} movimientos con "${termino}":`;

  return [encabezado, ...lineas, `Total: ${formatMoney(total, currency)}`].join(
    '\n',
  );
}

// ------------------------------------------------- respuestas de movimientos

/** Una linea por movimiento: "• 15 ago · Transporte · -$50.000 COP". */
function movementLine(row: Transaction, currency: string): string {
  const signo = row.type === 'income' ? '+' : '-';
  const fecha = FECHA_CORTA.format(new Date(`${row.date}T12:00:00.000Z`));
  const extras = [
    row.paymentMethod ? PAYMENT_METHOD_LABELS[row.paymentMethod] : null,
    row.isCredit ? 'fiado' : null,
  ].filter(Boolean);

  return (
    `• ${fecha} · ${row.description} · ${signo}${formatMoney(row.amount, currency)}` +
    (extras.length ? ` (${extras.join(', ')})` : '')
  );
}

/**
 * Confirmacion cuando el mensaje traia varios movimientos.
 *
 * Se detallan uno por uno a proposito: si el usuario dicto tres gastos y solo
 * ve un total, no tiene forma de saber si se separaron bien.
 */
export function renderMovementsRegistered(
  transactions: Transaction[],
  currency: string,
): string {
  const total = sumAmounts(transactions);
  const lineas = transactions.map((row) => movementLine(row, currency));

  return [
    `✅ Registré ${transactions.length} movimientos:`,
    ...lineas,
    `Total: ${formatMoney(total, currency)}`,
  ].join('\n');
}

/** Confirmacion de un desglose que reemplazo a un total ya registrado. */
export function renderBreakdown(
  partes: Transaction[],
  total: number,
  currency: string,
): string {
  const lineas = partes.map((row) => movementLine(row, currency));

  return [
    `✅ Listo, separé los ${formatMoney(total, currency)} así:`,
    ...lineas,
    'El total no cambia, solo queda detallado.',
  ].join('\n');
}

/**
 * El desglose no cuadra con el total.
 *
 * Se dicen las dos cifras y la diferencia exacta: el usuario necesita saber
 * cuanto falta para poder corregirlo, y asi no se registra nada inconsistente.
 */
export function renderMismatch(
  mismatch: BreakdownMismatch,
  currency: string,
): string {
  const falta = mismatch.difference > 0;

  return [
    `Me diste un total de ${formatMoney(mismatch.declared, currency)}, pero las partes suman ${formatMoney(mismatch.sum, currency)}.`,
    falta
      ? `Faltan ${formatMoney(Math.abs(mismatch.difference), currency)} por asignar.`
      : `Sobran ${formatMoney(Math.abs(mismatch.difference), currency)}.`,
    '¿Me confirmas las cifras para registrarlo bien?',
  ].join('\n');
}

/** Confirmacion del reparto de utilidades, con el monto de cada quien. */
export function renderProfitShare(
  total: number,
  shares: ProfitShare[],
  currency: string,
): string {
  const lineas = shares.map((share) => {
    const quien = share.name ?? PROFIT_BENEFICIARY_LABELS[share.beneficiary];
    return `• ${quien}: ${share.percentage}% → ${formatMoney(share.amount, currency)}`;
  });

  return [
    `💰 Reparto de utilidades sobre ${formatMoney(total, currency)}:`,
    ...lineas,
  ].join('\n');
}

/**
 * El detalle de los movimientos del periodo, uno por uno.
 *
 * Responde a "¿cuales son esos 8 movimientos?": antes el resumen decia cuantos
 * habia pero no habia forma de verlos, y volver a preguntar devolvia el mismo
 * resumen.
 */
export function renderMovementList(
  movimientos: Transaction[],
  period: QueryPeriod,
  currency: string,
): string {
  if (movimientos.length === 0) {
    return `No tienes movimientos registrados ${PERIOD_LABELS[period]}.`;
  }

  const mostrados = movimientos.slice(0, LIST_MAX_RESULTS);
  const lineas = mostrados.map((row) => movementLine(row, currency));
  const encabezado =
    movimientos.length === 1
      ? `📋 Tienes 1 movimiento ${PERIOD_LABELS[period]}:`
      : `📋 Tus ${movimientos.length} movimientos ${PERIOD_LABELS[period]}:`;

  const pie =
    movimientos.length > mostrados.length
      ? [
          `Te muestro los ${mostrados.length} más recientes. Pídeme un periodo más corto para ver el resto.`,
        ]
      : [];

  return [encabezado, ...lineas, ...pie].join('\n');
}
