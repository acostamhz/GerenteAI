import { Injectable } from '@nestjs/common';

import type {
  AiUsageRecord,
  AiUsageRepository,
  AiUsageSummary,
} from './usage.repository';

/**
 * Implementacion en memoria del registro de consumo.
 *
 * Suficiente para desarrollo y pruebas. Al conectar Postgres basta con crear
 * `PrismaAiUsageRepository` y cambiar el proveedor en `AiModule`.
 *
 * Advertencia: los datos se pierden al reiniciar el proceso y no se comparten
 * entre instancias. No usar en produccion para facturar.
 */
@Injectable()
export class InMemoryAiUsageRepository implements AiUsageRepository {
  private readonly entries = new Map<string, AiUsageRecord[]>();
  /** Tope por tenant para que un proceso largo no consuma memoria sin limite. */
  private readonly maxEntriesPerTenant = 5_000;

  record(entry: AiUsageRecord): Promise<void> {
    const list = this.entries.get(entry.tenantId) ?? [];
    list.push(entry);

    if (list.length > this.maxEntriesPerTenant) {
      list.splice(0, list.length - this.maxEntriesPerTenant);
    }

    this.entries.set(entry.tenantId, list);
    return Promise.resolve();
  }

  countMessages(tenantId: string, from: Date, to: Date): Promise<number> {
    return Promise.resolve(
      this.inRange(tenantId, from, to).filter((entry) => entry.success).length,
    );
  }

  summarize(tenantId: string, from: Date, to: Date): Promise<AiUsageSummary> {
    const records = this.inRange(tenantId, from, to).filter(
      (entry) => entry.success,
    );

    const summary: AiUsageSummary = {
      tenantId,
      from,
      to,
      messages: records.length,
      inputTokens: 0,
      outputTokens: 0,
      costUsd: 0,
      byProvider: {},
    };

    for (const record of records) {
      summary.inputTokens += record.inputTokens;
      summary.outputTokens += record.outputTokens;
      summary.costUsd += record.costUsd;
      summary.byProvider[record.providerId] =
        (summary.byProvider[record.providerId] ?? 0) + 1;
    }

    summary.costUsd = Number(summary.costUsd.toFixed(6));
    return Promise.resolve(summary);
  }

  private inRange(tenantId: string, from: Date, to: Date): AiUsageRecord[] {
    return (this.entries.get(tenantId) ?? []).filter(
      (entry) => entry.createdAt >= from && entry.createdAt <= to,
    );
  }
}
