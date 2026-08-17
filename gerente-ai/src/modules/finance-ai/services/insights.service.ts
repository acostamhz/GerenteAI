import { randomUUID } from 'node:crypto';

import { Inject, Injectable } from '@nestjs/common';

import { LlmService } from '../../../ai/services/llm.service';
import type { AiCallContext } from '../../../ai/usage/usage.service';
import type { Insight, InsightType } from '../domain/finance.types';
import {
  FINANCE_DATA_PORT,
  type FinanceDataPort,
} from '../ports/finance-data.port';
import {
  INSIGHTS_PROMPT_VERSION,
  INSIGHTS_SCHEMA,
  buildInsightsSystemPrompt,
  buildInsightsUserPrompt,
  type InsightsModelOutput,
} from '../prompts/insights.prompt';

export interface InsightsRequest {
  tenantId: string;
  businessId: string;
  plan?: string;
  /** Maximo de recomendaciones a devolver (1-5). */
  limit?: number;
}

export interface InsightsResult {
  insights: Insight[];
  meta: {
    promptVersion: string;
    provider: string;
    model: string;
    latencyMs: number;
    costUsd: number;
  };
}

/** Genera las "Recomendaciones de IA" del panel a partir de datos reales. */
@Injectable()
export class InsightsService {
  constructor(
    private readonly llm: LlmService,
    @Inject(FINANCE_DATA_PORT) private readonly financeData: FinanceDataPort,
  ) {}

  async generate(request: InsightsRequest): Promise<InsightsResult> {
    const snapshot = await this.financeData.getSnapshot(request.businessId);

    const context: AiCallContext = {
      tenantId: request.tenantId,
      businessId: request.businessId,
      feature: 'insights.generate',
      plan: request.plan,
    };

    const { data, response } = await this.llm.completeJson<InsightsModelOutput>(
      {
        system: buildInsightsSystemPrompt(snapshot.currency),
        messages: [
          { role: 'user', content: buildInsightsUserPrompt(snapshot) },
        ],
        schemaName: 'insights_negocio',
        schema: INSIGHTS_SCHEMA,
        // Algo de variedad, pero sin inventar: el analisis debe ser estable.
        temperature: 0.3,
        effort: 'medium',
        maxOutputTokens: 2_048,
      },
      context,
    );

    const limit = clampInt(request.limit ?? 5, 1, 5);
    const generatedAt = new Date().toISOString();

    const insights: Insight[] = (data?.insights ?? [])
      .filter((item) => item?.titulo && item?.cuerpo)
      .map((item) => ({
        id: randomUUID(),
        businessId: request.businessId,
        type: normalizeType(item.tipo),
        title: item.titulo.trim(),
        body: item.cuerpo.trim(),
        action: (item.accion ?? '').trim(),
        priority: clampInt(Number(item.prioridad), 1, 5),
        generatedAt,
        read: false,
      }))
      .sort((a, b) => a.priority - b.priority)
      .slice(0, limit);

    return {
      insights,
      meta: {
        promptVersion: INSIGHTS_PROMPT_VERSION,
        provider: response.providerId,
        model: response.model,
        latencyMs: response.latencyMs,
        costUsd: response.costUsd,
      },
    };
  }
}

function normalizeType(value: unknown): InsightType {
  return value === 'warning' || value === 'success' || value === 'info'
    ? value
    : 'info';
}

function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return max;
  return Math.min(max, Math.max(min, Math.round(value)));
}
