/**
 * Registro de consumo de IA.
 *
 * Es un puerto: hoy hay una implementacion en memoria y manana una con
 * Postgres/Prisma. El resto del codigo no cambia.
 */

export interface AiUsageRecord {
  tenantId: string;
  businessId?: string;
  /** Caso de uso: "whatsapp.extraction", "insights.generate", "assistant.chat". */
  feature: string;
  providerId: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  errorCode?: string;
  createdAt: Date;
}

export interface AiUsageSummary {
  tenantId: string;
  from: Date;
  to: Date;
  /** Numero de llamadas al modelo: la unidad que venden los planes. */
  messages: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  byProvider: Record<string, number>;
}

export interface AiUsageRepository {
  record(entry: AiUsageRecord): Promise<void>;
  /** Llamadas exitosas del tenant dentro del rango. */
  countMessages(tenantId: string, from: Date, to: Date): Promise<number>;
  summarize(tenantId: string, from: Date, to: Date): Promise<AiUsageSummary>;
}

export const AI_USAGE_REPOSITORY = Symbol('AI_USAGE_REPOSITORY');
