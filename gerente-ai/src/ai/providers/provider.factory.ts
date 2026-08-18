import { Logger } from '@nestjs/common';

import { AiConfigError } from '../config/ai.config';
import type { AiConfig, ProviderRuntimeConfig } from '../config/ai.config';
import type { LlmProvider } from '../core/llm.provider';
import { AnthropicProvider } from './anthropic.provider';
import { EchoProvider } from './echo.provider';
import { GeminiProvider } from './gemini.provider';
import { OpenAiCompatibleProvider } from './openai-compatible.provider';

/**
 * Unico lugar del backend donde se decide QUE IA se usa.
 *
 * Para anadir un proveedor nuevo:
 *  - si habla protocolo OpenAI: basta con anadirlo a `PROVIDER_PRESETS`;
 *  - si tiene protocolo propio: crea su adaptador y anade un `case` aqui.
 */
export function createProvider(
  runtime: ProviderRuntimeConfig,
  config: AiConfig,
): LlmProvider {
  const { preset, model, apiKey, baseUrl } = runtime;

  switch (preset.kind) {
    case 'openai-compatible': {
      if (!baseUrl) {
        throw new AiConfigError(
          `El proveedor "${preset.id}" necesita una URL base (AI_BASE_URL).`,
        );
      }
      return new OpenAiCompatibleProvider({
        providerId: preset.id,
        baseUrl,
        model,
        apiKey,
        timeoutMs: config.timeoutMs,
        defaultMaxOutputTokens: config.maxOutputTokens,
        supportsVision: supportsVision(preset.id, model),
        extraHeaders:
          preset.id === 'openrouter'
            ? {
                'HTTP-Referer': 'https://luka.ai',
                'X-Title': 'Luka AI',
              }
            : undefined,
      });
    }

    case 'gemini': {
      if (!baseUrl || !apiKey) {
        throw new AiConfigError(
          'Gemini necesita GEMINI_API_KEY (o AI_API_KEY) y una URL base.',
        );
      }
      return new GeminiProvider({
        providerId: preset.id,
        baseUrl,
        model,
        apiKey,
        timeoutMs: config.timeoutMs,
        defaultMaxOutputTokens: config.maxOutputTokens,
      });
    }

    case 'anthropic': {
      if (!apiKey) {
        throw new AiConfigError(
          'Anthropic necesita ANTHROPIC_API_KEY (o AI_API_KEY).',
        );
      }
      return new AnthropicProvider({
        providerId: preset.id,
        model,
        apiKey,
        timeoutMs: config.timeoutMs,
        defaultMaxOutputTokens: config.maxOutputTokens,
        serverFallback: config.anthropicServerFallback,
      });
    }

    case 'echo':
      return new EchoProvider(model);

    default: {
      // Si alguien anade un `kind` nuevo al catalogo sin su adaptador, esta
      // linea deja de compilar: el error se ve en el build, no en produccion.
      const exhaustive: never = preset.kind;
      throw new AiConfigError(
        `Tipo de proveedor no soportado: ${String(exhaustive)}`,
      );
    }
  }
}

/** Crea el proveedor principal y, si esta configurado, el de respaldo. */
export function createProviders(config: AiConfig): {
  primary: LlmProvider;
  fallback?: LlmProvider;
} {
  const logger = new Logger('LlmProviderFactory');

  const primary = createProvider(config.primary, config);
  logger.log(
    `Proveedor de IA activo: ${config.primary.preset.label} (${primary.id}) · modelo ${primary.model} · plan ${config.primary.preset.tier}`,
  );

  if (!config.fallback) return { primary };

  const fallback = createProvider(config.fallback, config);
  logger.log(
    `Proveedor de respaldo: ${config.fallback.preset.label} (${fallback.id}) · modelo ${fallback.model}`,
  );
  return { primary, fallback };
}

/** Los modelos multimodales mas comunes de cada servicio OpenAI-compatible. */
function supportsVision(providerId: string, model: string): boolean {
  const name = model.toLowerCase();
  if (providerId === 'openai')
    return name.startsWith('gpt-4') || name.startsWith('gpt-5');
  if (providerId === 'groq')
    return (
      name.includes('vision') ||
      name.includes('scout') ||
      name.includes('maverick')
    );
  if (providerId === 'ollama')
    return name.includes('llava') || name.includes('vision');
  if (providerId === 'openrouter')
    return name.includes('vision') || name.includes('vl');
  return false;
}
