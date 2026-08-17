import { Module } from '@nestjs/common';

import { InMemoryFinanceDataAdapter } from './adapters/in-memory-finance-data.adapter';
import { FinanceAiController } from './finance-ai.controller';
import { FINANCE_DATA_PORT } from './ports/finance-data.port';
import { AssistantService } from './services/assistant.service';
import { InsightsService } from './services/insights.service';
import { WhatsAppMessageService } from './services/whatsapp-message.service';

/**
 * Casos de uso de IA sobre las finanzas del negocio.
 *
 * Depende de `LlmService` (que expone `AiModule`, marcado como global) y del
 * puerto de datos. Cuando exista la base de datos, cambiar el `useClass` de
 * `FINANCE_DATA_PORT` es lo unico necesario.
 */
@Module({
  controllers: [FinanceAiController],
  providers: [
    { provide: FINANCE_DATA_PORT, useClass: InMemoryFinanceDataAdapter },
    WhatsAppMessageService,
    InsightsService,
    AssistantService,
  ],
  exports: [WhatsAppMessageService, InsightsService, AssistantService],
})
export class FinanceAiModule {}
