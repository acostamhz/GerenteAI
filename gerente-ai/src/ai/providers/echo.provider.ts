import type { LlmProvider } from '../core/llm.provider';
import type {
  JsonSchema,
  LlmCapabilities,
  LlmHealth,
  LlmMessage,
  LlmRequest,
  LlmResponse,
} from '../core/llm.types';

/**
 * Proveedor simulado: no hace red ni necesita llaves.
 *
 * Sirve para tres cosas:
 *  1. Levantar el backend recien clonado sin configurar nada.
 *  2. Correr tests deterministas del dominio sin gastar cuota.
 *  3. Demostrar que el contrato es realmente agnostico: si el dominio funciona
 *     contra Echo, funciona contra cualquier proveedor.
 *
 * Cuando se le pide JSON con esquema, fabrica un objeto que cumple ese esquema.
 */
export class EchoProvider implements LlmProvider {
  readonly id = 'echo';

  constructor(readonly model: string = 'echo-1') {}

  get capabilities(): LlmCapabilities {
    return {
      tools: true,
      nativeJsonSchema: true,
      jsonMode: true,
      vision: true,
      maxOutputTokens: 4_096,
    };
  }

  generate(request: LlmRequest): Promise<LlmResponse> {
    const startedAt = Date.now();
    const lastUserMessage = [...request.messages]
      .reverse()
      .find((message) => message.role === 'user');

    const text = this.buildText(request, lastUserMessage);
    const inputTokens = estimateTokens(
      (request.system ?? '') +
        request.messages.map((message) => textOf(message.content)).join(' '),
    );

    return Promise.resolve({
      text,
      toolCalls: [],
      finishReason: 'stop',
      usage: {
        inputTokens,
        outputTokens: estimateTokens(text),
        totalTokens: inputTokens + estimateTokens(text),
      },
      providerId: this.id,
      model: this.model,
      latencyMs: Date.now() - startedAt,
      costUsd: 0,
    });
  }

  healthCheck(): Promise<LlmHealth> {
    return Promise.resolve({
      ok: true,
      providerId: this.id,
      model: this.model,
      latencyMs: 0,
      detail: 'Proveedor simulado: no realiza llamadas externas.',
    });
  }

  private buildText(
    request: LlmRequest,
    lastUserMessage: LlmMessage | undefined,
  ): string {
    const format = request.responseFormat;

    if (format?.type === 'json_schema') {
      return JSON.stringify(buildSampleFromSchema(format.schema));
    }
    if (format?.type === 'json') {
      return JSON.stringify({ echo: textOf(lastUserMessage?.content ?? '') });
    }

    return `[echo] ${textOf(lastUserMessage?.content ?? 'sin mensaje')}`;
  }
}

/** Construye un valor de ejemplo que satisface el esquema recibido. */
export function buildSampleFromSchema(schema: JsonSchema): unknown {
  if (schema.enum?.length) return schema.enum[0];

  // Un campo `['string','null']` se ejemplifica con su tipo real, no con null.
  const type = Array.isArray(schema.type)
    ? schema.type.find((entry) => entry !== 'null')
    : schema.type;

  switch (type) {
    case 'object': {
      const result: Record<string, unknown> = {};
      for (const [key, sub] of Object.entries(schema.properties ?? {})) {
        result[key] = buildSampleFromSchema(sub);
      }
      return result;
    }
    case 'array':
      return schema.items ? [buildSampleFromSchema(schema.items)] : [];
    case 'number':
    case 'integer':
      // Distinto de cero a proposito: un 0 haria que el dominio descarte el
      // valor (montos, cantidades) y nunca se ejercitaria el camino feliz.
      return 1_000;
    case 'boolean':
      return false;
    case 'null':
      return null;
    default:
      return schema.description ? `[echo] ${schema.description}` : '[echo]';
  }
}

function textOf(content: LlmMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text',
    )
    .map((part) => part.text)
    .join('\n');
}

/** Aproximacion suficiente para metricas locales: ~4 caracteres por token. */
function estimateTokens(text: string): number {
  return Math.ceil((text?.length ?? 0) / 4);
}
