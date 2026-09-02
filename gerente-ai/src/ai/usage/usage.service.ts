import { Inject, Injectable, Logger } from '@nestjs/common';

import { AiQuotaExceededError } from '../core/llm.errors';
import type { LlmResponse } from '../core/llm.types';
import {
  AI_USAGE_REPOSITORY,
  type AiUsageRepository,
  type AiUsageSummary,
} from './usage.repository';

/**
 * Planes comerciales de Luka AI. Los limites reflejan la pantalla de
 * suscripcion del frontend (mensajes de IA por mes).
 */
export type PlanId = 'asistente' | 'gerente' | 'director' | 'corporativo';

export interface PlanLimits {
  id: PlanId;
  label: string;
  /** Llamadas al modelo por mes. `Infinity` = sin tope. */
  monthlyAiMessages: number;
  whatsappNumbers: number;
  businesses: number;
}

export const PLAN_LIMITS: Record<PlanId, PlanLimits> = {
  // Los topes de mensajes los fija el area comercial. El nombre de cada plan
  // sale de `planes.service.ts`, que es el catalogo oficial; aqui solo se
  // define cuanta IA incluye cada uno.
  asistente: {
    id: 'asistente',
    label: 'Asistente',
    monthlyAiMessages: 500,
    whatsappNumbers: 1,
    businesses: 1,
  },
  gerente: {
    id: 'gerente',
    label: 'Gerente',
    monthlyAiMessages: 4_000,
    whatsappNumbers: 3,
    businesses: 4,
  },
  director: {
    id: 'director',
    label: 'Administrador',
    monthlyAiMessages: 10_000,
    whatsappNumbers: 10,
    businesses: 10,
  },
  // Plan interno de socios: no se vende y no tiene tope.
  corporativo: {
    id: 'corporativo',
    label: 'Socio',
    monthlyAiMessages: Number.POSITIVE_INFINITY,
    whatsappNumbers: Number.POSITIVE_INFINITY,
    businesses: Number.POSITIVE_INFINITY,
  },
};

export function resolvePlan(plan: string | undefined): PlanLimits {
  const key = (plan ?? '').toLowerCase() as PlanId;
  // Ante un plan vacio o desconocido se cae al MAS restrictivo. Caer a
  // "gerente" regalaba 500 mensajes al mes a cualquiera cuyo plan no se pudiera
  // resolver, incluidos los del plan gratuito.
  return PLAN_LIMITS[key] ?? PLAN_LIMITS.asistente;
}

export interface AiCallContext {
  tenantId: string;
  businessId?: string;
  /** Caso de uso, para poder desglosar consumo por funcionalidad. */
  feature: string;
  /** Plan vigente del tenant. Por defecto "gerente". */
  plan?: string;
}

export interface QuotaStatus {
  plan: PlanLimits;
  used: number;
  limit: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
}

@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    @Inject(AI_USAGE_REPOSITORY)
    private readonly repository: AiUsageRepository,
  ) {}

  /** Lanza `AiQuotaExceededError` si el tenant agoto su plan del mes. */
  async assertWithinQuota(context: AiCallContext): Promise<QuotaStatus> {
    const status = await this.getQuotaStatus(context.tenantId, context.plan);

    if (status.remaining <= 0) {
      this.logger.warn(
        `Cuota agotada · tenant=${context.tenantId} plan=${status.plan.id} uso=${status.used}/${status.limit}`,
      );
      throw new AiQuotaExceededError(
        status.used,
        status.limit,
        `el plan ${status.plan.label}`,
      );
    }

    return status;
  }

  async getQuotaStatus(tenantId: string, plan?: string): Promise<QuotaStatus> {
    const limits = resolvePlan(plan);
    const { start, end } = currentMonthRange();
    const used = await this.repository.countMessages(tenantId, start, end);

    return {
      plan: limits,
      used,
      limit: limits.monthlyAiMessages,
      remaining: Math.max(0, limits.monthlyAiMessages - used),
      periodStart: start,
      periodEnd: end,
    };
  }

  async recordSuccess(
    context: AiCallContext,
    response: LlmResponse,
  ): Promise<void> {
    await this.repository.record({
      tenantId: context.tenantId,
      businessId: context.businessId,
      feature: context.feature,
      providerId: response.providerId,
      model: response.model,
      inputTokens: response.usage.inputTokens,
      outputTokens: response.usage.outputTokens,
      costUsd: response.costUsd,
      latencyMs: response.latencyMs,
      success: true,
      createdAt: new Date(),
    });
  }

  async recordFailure(
    context: AiCallContext,
    providerId: string,
    model: string,
    errorCode: string,
    latencyMs: number,
  ): Promise<void> {
    // Los fallos se registran para diagnostico pero NO descuentan cuota.
    await this.repository.record({
      tenantId: context.tenantId,
      businessId: context.businessId,
      feature: context.feature,
      providerId,
      model,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      latencyMs,
      success: false,
      errorCode,
      createdAt: new Date(),
    });
  }

  async summarizeCurrentMonth(tenantId: string): Promise<AiUsageSummary> {
    const { start, end } = currentMonthRange();
    return this.repository.summarize(tenantId, start, end);
  }
}

function currentMonthRange(now: Date = new Date()): { start: Date; end: Date } {
  const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  );
  return { start, end };
}
