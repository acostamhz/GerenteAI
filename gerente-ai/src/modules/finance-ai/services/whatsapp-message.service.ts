import { randomUUID } from 'node:crypto';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { LlmService } from '../../../ai/services/llm.service';
import type { AiCallContext } from '../../../ai/usage/usage.service';
import {
  CATEGORIES_BY_TYPE,
  CATEGORY_LABELS,
  DEFAULT_CATEGORY_BY_TYPE,
  type MessageIntent,
  type MessageIntentType,
  type PeriodSummary,
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
}

export interface WhatsAppMessageResult {
  /** Lo que el modelo entendio, ya validado. Es el JSON del system prompt. */
  intent: MessageIntent;
  /** Movimiento contable, si el mensaje era un ingreso, gasto o inversion. */
  transaction: Transaction | null;
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
          }),
          messages: [{ role: 'user', content: request.message }],
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

    if (intent.type === 'query') {
      const summary = await this.buildSummary(
        request.businessId,
        intent.queryPeriod ?? 'month',
        currency,
      );
      return {
        intent,
        transaction: null,
        summary,
        replyText: renderSummary(summary),
        meta,
      };
    }

    if (isTransactionType(intent.type)) {
      const transaction = this.buildTransaction(
        intent,
        intent.type,
        request,
        currency,
        referenceDate,
      );

      if (!transaction) {
        // El modelo dijo "gasto" pero no dejo un monto usable: no inventamos
        // cifras, preguntamos.
        this.logger.warn(
          `Intencion "${intent.type}" sin monto valido: "${request.message.slice(0, 80)}"`,
        );
        return {
          // Al degradar a "unclear" se limpian los campos del movimiento:
          // dejarlos puestos haria creer que hay un registro a medio hacer.
          intent: {
            ...intent,
            type: 'unclear',
            category: null,
            queryPeriod: null,
            // Si no hubo monto, la interpretacion no puede considerarse buena
            // por mucho que el modelo diga lo contrario.
            confidence: Math.min(intent.confidence, 0.4),
          },
          transaction: null,
          summary: null,
          replyText:
            'No alcancé a identificar el monto. ¿Me lo confirmas para registrarlo?',
          meta,
        };
      }

      if (request.persist) {
        await this.financeData.saveTransactions([transaction]);
      }

      return {
        intent,
        transaction,
        summary: null,
        replyText: intent.responseText,
        meta,
      };
    }

    // correction y unclear: por ahora solo se responde.
    // Aplicar la correccion requiere persistencia (ver docs/IA.md, pendientes).
    return {
      intent,
      transaction: null,
      summary: null,
      replyText: intent.responseText,
      meta,
    };
  }

  // ------------------------------------------------------------ validacion

  /**
   * Saneamiento defensivo: aunque el esquema obligue, un modelo puede devolver
   * un tipo raro, un monto negativo o una categoria inventada. Nada de eso
   * debe llegar a la contabilidad del cliente.
   */
  private normalizeIntent(output: WhatsAppIntentOutput): MessageIntent {
    const type = normalizeType(output?.type);
    const amount = normalizeAmount(output?.amount);
    const category = isTransactionType(type)
      ? normalizeCategory(output?.category, type)
      : null;

    return {
      type,
      amount,
      category,
      concept: cleanText(output?.concept),
      responseText:
        cleanText(output?.responseText) ??
        'Recibí tu mensaje, pero no logré interpretarlo. ¿Me lo repites?',
      queryPeriod:
        type === 'query' ? normalizePeriod(output?.queryPeriod) : null,
      confidence: normalizeConfidence(output?.confidence, {
        type,
        amount,
        concept: cleanText(output?.concept),
      }),
    };
  }

  private buildTransaction(
    intent: MessageIntent,
    type: TransactionType,
    request: WhatsAppMessageRequest,
    currency: string,
    referenceDate: string,
  ): Transaction | null {
    if (intent.amount === null || intent.amount <= 0) return null;

    return {
      id: randomUUID(),
      businessId: request.businessId,
      date: referenceDate,
      description:
        intent.concept ?? `Movimiento registrado por WhatsApp (${type})`,
      category:
        (intent.category as TransactionCategory | null) ??
        DEFAULT_CATEGORY_BY_TYPE[type],
      amount: intent.amount,
      type,
      currency,
      source: 'whatsapp',
      createdAt: new Date().toISOString(),
    };
  }

  // -------------------------------------------------------------- consultas

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
    const byCategory = new Map<string, PeriodSummary['byCategory'][number]>();

    for (const row of rows) {
      totals[row.type] += row.amount;

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
      transactionCount: rows.length,
      byCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    };
  }
}

// ------------------------------------------------------------------ helpers

const INTENT_TYPES: MessageIntentType[] = [
  'income',
  'expense',
  'investment',
  'query',
  'correction',
  'unclear',
];

const TRANSACTION_TYPES: TransactionType[] = [
  'income',
  'expense',
  'investment',
];

function isTransactionType(type: MessageIntentType): type is TransactionType {
  return (TRANSACTION_TYPES as string[]).includes(type);
}

function normalizeType(value: unknown): MessageIntentType {
  return typeof value === 'string' && (INTENT_TYPES as string[]).includes(value)
    ? (value as MessageIntentType)
    : 'unclear';
}

function normalizeAmount(value: unknown): number | null {
  const amount = Math.abs(Number(value));
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
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

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Rangos de fecha para las consultas: hoy, semana en curso, mes en curso. */
export function periodRange(
  period: QueryPeriod,
  now: Date = new Date(),
): { from: string; to: string } {
  const to = isoDate(now);

  if (period === 'day') return { from: to, to };

  if (period === 'week') {
    const day = now.getDay();
    // getDay(): 0 = domingo. La semana laboral arranca el lunes.
    const daysSinceMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(now);
    monday.setDate(now.getDate() - daysSinceMonday);
    return { from: isoDate(monday), to };
  }

  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from: isoDate(first), to };
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  return lines.join('\n');
}

function formatMoney(value: number, currency: string): string {
  // Formato colombiano (punto para miles). Ajustar si se opera en otro pais.
  return `$${Math.round(value).toLocaleString('es-CO')} ${currency}`;
}
