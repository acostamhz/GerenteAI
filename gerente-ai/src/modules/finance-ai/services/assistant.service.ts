import { Inject, Injectable } from '@nestjs/common';

import { LlmService } from '../../../ai/services/llm.service';
import type { LlmMessage } from '../../../ai/core/llm.types';
import type { AiCallContext } from '../../../ai/usage/usage.service';
import { CATEGORY_LABELS, type Transaction } from '../domain/finance.types';
import {
  FINANCE_DATA_PORT,
  type FinanceDataPort,
} from '../ports/finance-data.port';
import {
  ASSISTANT_PROMPT_VERSION,
  ASSISTANT_TOOLS,
  buildAssistantSystemPrompt,
} from '../prompts/assistant.prompt';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequest {
  tenantId: string;
  businessId: string;
  question: string;
  /** Historial previo de la conversacion, del mas antiguo al mas reciente. */
  history?: AssistantTurn[];
  plan?: string;
}

export interface AssistantResult {
  answer: string;
  /** Herramientas que el modelo decidio usar. Util para auditar respuestas. */
  toolsUsed: { name: string; args: Record<string, unknown> }[];
  meta: {
    promptVersion: string;
    provider: string;
    model: string;
    latencyMs: number;
    costUsd: number;
  };
}

/**
 * Asistente conversacional con acceso a los datos del negocio.
 *
 * El modelo no recibe la base de datos: recibe herramientas. Cada herramienta
 * se resuelve aqui contra el puerto de datos, asi que el modelo solo puede ver
 * lo del negocio consultado.
 */
@Injectable()
export class AssistantService {
  constructor(
    private readonly llm: LlmService,
    @Inject(FINANCE_DATA_PORT) private readonly financeData: FinanceDataPort,
  ) {}

  async ask(request: AssistantRequest): Promise<AssistantResult> {
    const snapshot = await this.financeData.getSnapshot(request.businessId);

    const messages: LlmMessage[] = [
      ...(request.history ?? []).map((turn) => ({
        role: turn.role,
        content: turn.content,
      })),
      { role: 'user' as const, content: request.question },
    ];

    const context: AiCallContext = {
      tenantId: request.tenantId,
      businessId: request.businessId,
      feature: 'assistant.chat',
      plan: request.plan,
    };

    const result = await this.llm.runToolLoop(
      {
        system: buildAssistantSystemPrompt({
          businessName: snapshot.businessName,
          currency: snapshot.currency,
          referenceDate: new Date().toISOString().slice(0, 10),
        }),
        messages,
        temperature: 0.2,
        effort: 'medium',
        maxOutputTokens: 1_024,
      },
      {
        tools: ASSISTANT_TOOLS,
        maxSteps: 4,
        execute: (name, args) =>
          this.executeTool(request.businessId, name, args),
      },
      context,
    );

    return {
      answer: result.response.text.trim(),
      toolsUsed: result.toolCallsExecuted,
      meta: {
        promptVersion: ASSISTANT_PROMPT_VERSION,
        provider: result.response.providerId,
        model: result.response.model,
        latencyMs: result.response.latencyMs,
        costUsd: result.totalUsage.costUsd,
      },
    };
  }

  /**
   * Implementacion de las herramientas declaradas en `ASSISTANT_TOOLS`.
   * El businessId viene del backend, nunca de los argumentos del modelo: asi
   * el modelo no puede pedir datos de otro negocio.
   */
  private async executeTool(
    businessId: string,
    name: string,
    args: Record<string, unknown>,
  ): Promise<string> {
    switch (name) {
      case 'consultar_resumen_financiero': {
        const snapshot = await this.financeData.getSnapshot(businessId);
        return JSON.stringify({
          moneda: snapshot.currency,
          periodo: `${snapshot.periodStart} a ${snapshot.periodEnd}`,
          ingresos: snapshot.totalIncome,
          gastos: snapshot.totalExpense,
          inversiones: snapshot.totalInvestment,
          balance: snapshot.balance,
          mensual: snapshot.monthly,
          categorias: snapshot.topCategories,
        });
      }

      case 'listar_transacciones': {
        const rows = await this.financeData.listTransactions({
          businessId,
          from: asDate(args.desde),
          to: asDate(args.hasta),
          type:
            args.tipo === 'income' ||
            args.tipo === 'expense' ||
            args.tipo === 'investment'
              ? args.tipo
              : undefined,
          category:
            typeof args.categoria === 'string' ? args.categoria : undefined,
          limit: clampInt(Number(args.limite), 1, 50, 20),
        });

        return JSON.stringify({
          total: rows.length,
          movimientos: rows.map(toCompactRow),
        });
      }

      case 'calcular_totales': {
        const rows = await this.financeData.listTransactions({
          businessId,
          from: asDate(args.desde),
          to: asDate(args.hasta),
          limit: 1_000,
        });

        const groupBy =
          typeof args.agruparPor === 'string' ? args.agruparPor : 'categoria';
        return JSON.stringify({
          agrupadoPor: groupBy,
          movimientosConsiderados: rows.length,
          totales: groupTotals(rows, groupBy),
        });
      }

      default:
        return `ERROR: la herramienta "${name}" no existe.`;
    }
  }
}

// ------------------------------------------------------------------ helpers

function toCompactRow(transaction: Transaction) {
  return {
    fecha: transaction.date,
    concepto: transaction.description,
    // Etiqueta legible: al modelo le cuesta menos leer "Mercancía" que "mercancia".
    categoria: CATEGORY_LABELS[transaction.category],
    tipo: transaction.type,
    monto: transaction.amount,
  };
}

function groupTotals(
  rows: Transaction[],
  groupBy: string,
): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const row of rows) {
    let key: string;
    if (groupBy === 'tipo') key = row.type;
    else if (groupBy === 'mes') key = row.date.slice(0, 7);
    else key = `${row.category} (${row.type})`;

    totals[key] = (totals[key] ?? 0) + row.amount;
  }

  return totals;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function asDate(value: unknown): string | undefined {
  return typeof value === 'string' && ISO_DATE.test(value) ? value : undefined;
}

function clampInt(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}
