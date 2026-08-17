import { Global, Module } from '@nestjs/common';

import { AI_CONFIG, loadAiConfig, type AiConfig } from './config/ai.config';
import {
  LLM_FALLBACK_PROVIDER,
  LLM_PROVIDER,
  type LlmProvider,
} from './core/llm.provider';
import { createProviders } from './providers/provider.factory';
import { LlmService } from './services/llm.service';
import { InMemoryAiUsageRepository } from './usage/in-memory-usage.repository';
import { AI_USAGE_REPOSITORY } from './usage/usage.repository';
import { AiUsageService } from './usage/usage.service';

/** Instancias ya construidas, para no crear el proveedor dos veces. */
const LLM_PROVIDER_BUNDLE = Symbol('LLM_PROVIDER_BUNDLE');

interface ProviderBundle {
  primary: LlmProvider;
  fallback?: LlmProvider;
}

/**
 * Modulo de infraestructura de IA.
 *
 * Es global a proposito: cualquier modulo de dominio puede inyectar
 * `LlmService` sin volver a importar nada. La eleccion del proveedor ocurre
 * una sola vez, aqui, a partir de variables de entorno.
 */
@Global()
@Module({
  providers: [
    {
      provide: AI_CONFIG,
      useFactory: (): AiConfig => loadAiConfig(),
    },
    {
      provide: LLM_PROVIDER_BUNDLE,
      useFactory: (config: AiConfig): ProviderBundle => createProviders(config),
      inject: [AI_CONFIG],
    },
    {
      provide: LLM_PROVIDER,
      useFactory: (bundle: ProviderBundle) => bundle.primary,
      inject: [LLM_PROVIDER_BUNDLE],
    },
    {
      provide: LLM_FALLBACK_PROVIDER,
      useFactory: (bundle: ProviderBundle) => bundle.fallback ?? null,
      inject: [LLM_PROVIDER_BUNDLE],
    },
    {
      // Cambiar a una implementacion con base de datos no toca nada mas.
      provide: AI_USAGE_REPOSITORY,
      useClass: InMemoryAiUsageRepository,
    },
    AiUsageService,
    LlmService,
  ],
  exports: [LlmService, AiUsageService, AI_CONFIG, LLM_PROVIDER],
})
export class AiModule {}
