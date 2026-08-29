import { postJson } from '../core/http.util';
import { LlmError } from '../core/llm.errors';
import type { LlmProvider } from '../core/llm.provider';
import type {
  JsonSchema,
  LlmCapabilities,
  LlmEffort,
  LlmFinishReason,
  LlmHealth,
  LlmMessage,
  LlmRequest,
  LlmResponse,
  LlmToolCall,
} from '../core/llm.types';
import { estimateCostUsd } from '../config/provider.catalog';

/**
 * Adaptador para Google AI Studio (Gemini), la opcion gratuita recomendada
 * para las pruebas: buen espanol, JSON con esquema nativo y vision incluida.
 *
 * Endpoint: POST {baseUrl}/models/{model}:generateContent
 */
export interface GeminiProviderOptions {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey: string;
  timeoutMs: number;
  defaultMaxOutputTokens: number;
}

export class GeminiProvider implements LlmProvider {
  constructor(private readonly options: GeminiProviderOptions) {}

  get id(): string {
    return this.options.providerId;
  }

  get model(): string {
    return this.options.model;
  }

  get capabilities(): LlmCapabilities {
    return {
      tools: true,
      nativeJsonSchema: true,
      jsonMode: true,
      vision: true,
      maxOutputTokens: this.options.defaultMaxOutputTokens,
    };
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const startedAt = Date.now();

    const raw = await postJson<GenerateContentResponse>({
      url: `${this.options.baseUrl.replace(/\/+$/, '')}/models/${this.model}:generateContent`,
      body: this.buildBody(request),
      headers: { 'x-goog-api-key': this.options.apiKey },
      timeoutMs: request.timeoutMs ?? this.options.timeoutMs,
      providerId: this.id,
    });

    return this.mapResponse(raw, Date.now() - startedAt);
  }

  async healthCheck(): Promise<LlmHealth> {
    const startedAt = Date.now();
    try {
      const response = await this.generate({
        messages: [{ role: 'user', content: 'Responde exactamente: OK' }],
        maxOutputTokens: 16,
        temperature: 0,
      });
      return {
        ok: true,
        providerId: this.id,
        model: this.model,
        latencyMs: Date.now() - startedAt,
        detail: response.text.slice(0, 60),
      };
    } catch (error) {
      return {
        ok: false,
        providerId: this.id,
        model: this.model,
        latencyMs: Date.now() - startedAt,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ------------------------------------------------------------- traduccion

  private buildBody(request: LlmRequest): Record<string, unknown> {
    const body: Record<string, unknown> = {
      contents: this.mapMessages(request.messages),
    };

    if (request.system) {
      body.systemInstruction = { parts: [{ text: request.system }] };
    }

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens:
        request.maxOutputTokens ?? this.options.defaultMaxOutputTokens,
    };
    if (request.temperature !== undefined) {
      generationConfig.temperature = request.temperature;
    }

    const thinkingLevel = this.thinkingLevelFor(request.effort);
    if (thinkingLevel) {
      generationConfig.thinkingConfig = { thinkingLevel };
    }

    const hasTools = Boolean(request.tools?.length);

    if (hasTools) {
      body.tools = [
        {
          functionDeclarations: request.tools!.map((tool) => ({
            name: tool.name,
            description: tool.description,
            parameters: toGeminiSchema(tool.parameters),
          })),
        },
      ];
      body.toolConfig = this.mapToolConfig(request);
    } else {
      // Gemini no permite combinar function calling con salida JSON forzada.
      const format = request.responseFormat;
      if (format?.type === 'json_schema') {
        generationConfig.responseMimeType = 'application/json';
        generationConfig.responseSchema = toGeminiSchema(format.schema);
      } else if (format?.type === 'json') {
        generationConfig.responseMimeType = 'application/json';
      }
    }

    body.generationConfig = generationConfig;
    return body;
  }

  /**
   * Cuanto puede "pensar" el modelo antes de responder.
   *
   * Los Gemini 3.x razonan antes de contestar y por defecto lo hacen al maximo,
   * lo que en este producto es contraproducente: clasificar "compre mercancia
   * por 8000" no necesita razonamiento profundo, necesita respuesta rapida.
   * Sin este control, gemini-3.7-flash tardaba mas de 30 s y se caia por timeout.
   *
   * Solo se envia a los modelos 3.x: en los anteriores (2.0-flash y compania)
   * el campo no existe y la API responde 400.
   */
  private thinkingLevelFor(effort: LlmEffort | undefined): string | undefined {
    if (!effort) return undefined;
    if (!/gemini-3/i.test(this.model)) return undefined;

    // "minimal" existe, pero la propia documentacion advierte que no garantiza
    // apagar el pensamiento; "low" es el minimo con comportamiento predecible.
    const NIVELES: Record<LlmEffort, string> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
    };

    return NIVELES[effort];
  }

  private mapToolConfig(request: LlmRequest): Record<string, unknown> {
    const choice = request.toolChoice ?? 'auto';

    if (typeof choice === 'object') {
      return {
        functionCallingConfig: {
          mode: 'ANY',
          allowedFunctionNames: [choice.name],
        },
      };
    }

    const mode =
      choice === 'none' ? 'NONE' : choice === 'required' ? 'ANY' : 'AUTO';
    return { functionCallingConfig: { mode } };
  }

  private mapMessages(messages: LlmMessage[]): Record<string, unknown>[] {
    const contents: Record<string, unknown>[] = [];

    for (const message of messages) {
      if (message.role === 'system') {
        // Ya viaja en systemInstruction; si llega aqui lo tratamos como usuario.
        contents.push({
          role: 'user',
          parts: [{ text: textOf(message.content) }],
        });
        continue;
      }

      if (message.role === 'tool') {
        contents.push({
          role: 'user',
          parts: [
            {
              functionResponse: {
                name: message.name ?? 'unknown',
                response: { result: textOf(message.content) },
              },
            },
          ],
        });
        continue;
      }

      const parts: Record<string, unknown>[] = [];

      if (typeof message.content === 'string') {
        if (message.content) parts.push({ text: message.content });
      } else {
        for (const part of message.content) {
          if (part.type === 'text') parts.push({ text: part.text });
          else
            parts.push({
              inlineData: { mimeType: part.mimeType, data: part.dataBase64 },
            });
        }
      }

      for (const call of message.toolCalls ?? []) {
        parts.push({ functionCall: { name: call.name, args: call.arguments } });
      }

      if (!parts.length) parts.push({ text: '' });

      contents.push({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts,
      });
    }

    return contents;
  }

  private mapResponse(
    raw: GenerateContentResponse,
    latencyMs: number,
  ): LlmResponse {
    if (raw.promptFeedback?.blockReason) {
      throw new LlmError(
        'content_filter',
        `Gemini bloqueo la peticion: ${raw.promptFeedback.blockReason}`,
        { providerId: this.id },
      );
    }

    const candidate = raw.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const text = parts
      .map((part) => part.text)
      .filter((value): value is string => typeof value === 'string')
      .join('');

    const toolCalls: LlmToolCall[] = parts
      .filter((part) => part.functionCall)
      .map((part, index) => ({
        id: `gemini_call_${index}`,
        name: part.functionCall!.name,
        arguments: (part.functionCall!.args ?? {}) as Record<string, unknown>,
      }));

    const inputTokens = raw.usageMetadata?.promptTokenCount ?? 0;
    const outputTokens = raw.usageMetadata?.candidatesTokenCount ?? 0;

    return {
      text,
      toolCalls,
      finishReason: mapFinishReason(candidate?.finishReason, toolCalls.length),
      usage: {
        inputTokens,
        outputTokens,
        totalTokens:
          raw.usageMetadata?.totalTokenCount ?? inputTokens + outputTokens,
        cachedInputTokens: raw.usageMetadata?.cachedContentTokenCount,
      },
      providerId: this.id,
      model: this.model,
      latencyMs,
      costUsd: estimateCostUsd(this.model, inputTokens, outputTokens),
      raw,
    };
  }
}

// ------------------------------------------------------------------ helpers

interface GenerateContentResponse {
  candidates?: {
    finishReason?: string;
    content?: {
      parts?: {
        text?: string;
        functionCall?: { name: string; args?: unknown };
      }[];
    };
  }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
    cachedContentTokenCount?: number;
  };
}

/**
 * Gemini usa un subconjunto de OpenAPI 3, no JSON Schema completo:
 * los tipos van en mayusculas y rechaza claves como `additionalProperties`.
 */
const GEMINI_ALLOWED_KEYS = new Set([
  'type',
  'description',
  'properties',
  'required',
  'items',
  'enum',
  'format',
  'nullable',
]);

export function toGeminiSchema(schema: JsonSchema): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(schema)) {
    if (!GEMINI_ALLOWED_KEYS.has(key)) continue;

    if (key === 'type') {
      // Gemini no acepta listas de tipos: `['string','null']` se traduce a
      // type STRING + nullable true.
      const types: unknown[] = Array.isArray(value)
        ? (value as unknown[])
        : [value];
      const primary = types.find((entry) => entry !== 'null');
      if (typeof primary === 'string') output.type = primary.toUpperCase();
      if (types.includes('null')) output.nullable = true;
    } else if (key === 'enum' && Array.isArray(value)) {
      // Un enum con null tampoco es valido: el nulo ya viaja en `nullable`.
      output.enum = (value as unknown[]).filter((entry) => entry !== null);
    } else if (key === 'properties' && value && typeof value === 'object') {
      const properties: Record<string, unknown> = {};
      for (const [name, sub] of Object.entries(
        value as Record<string, JsonSchema>,
      )) {
        properties[name] = toGeminiSchema(sub);
      }
      output.properties = properties;
    } else if (key === 'items' && value && typeof value === 'object') {
      output.items = toGeminiSchema(value as JsonSchema);
    } else {
      output[key] = value;
    }
  }

  return output;
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

function mapFinishReason(
  reason: string | undefined,
  toolCallCount: number,
): LlmFinishReason {
  if (toolCallCount > 0) return 'tool_calls';
  switch (reason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    case 'SAFETY':
    case 'RECITATION':
    case 'PROHIBITED_CONTENT':
      return 'content_filter';
    default:
      return reason ? 'unknown' : 'stop';
  }
}
