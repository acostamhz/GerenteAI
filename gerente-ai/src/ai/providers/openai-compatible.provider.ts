import { postJson } from '../core/http.util';
import { buildJsonSchemaInstruction } from '../core/json.util';
import { LlmError } from '../core/llm.errors';
import type { LlmProvider } from '../core/llm.provider';
import type {
  LlmCapabilities,
  LlmContentPart,
  LlmFinishReason,
  LlmHealth,
  LlmMessage,
  LlmRequest,
  LlmResponse,
  LlmToolCall,
} from '../core/llm.types';
import { estimateCostUsd } from '../config/provider.catalog';

/**
 * Adaptador para cualquier servicio que hable el protocolo
 * `POST /chat/completions` de OpenAI.
 *
 * Con este unico archivo quedan cubiertos: Groq, Ollama, OpenRouter, DeepSeek,
 * Together y la propia OpenAI. Cambiar entre ellos es cambiar `baseUrl`,
 * `model` y la llave.
 */

/** Como pedimos JSON a este servidor concreto. */
export type JsonStrategy =
  /** `response_format: {type:"json_schema"}` — el servidor garantiza el esquema. */
  | 'schema'
  /** `response_format: {type:"json_object"}` — JSON valido, esquema por prompt. */
  | 'object'
  /** Sin soporte: todo por prompt. */
  | 'prompt';

export interface OpenAiCompatibleOptions {
  providerId: string;
  baseUrl: string;
  model: string;
  apiKey?: string;
  timeoutMs: number;
  defaultMaxOutputTokens: number;
  jsonStrategy?: JsonStrategy;
  supportsTools?: boolean;
  supportsVision?: boolean;
  extraHeaders?: Record<string, string>;
}

/** Estrategia JSON por defecto de cada servicio conocido. */
const JSON_STRATEGY_BY_PROVIDER: Record<string, JsonStrategy> = {
  openai: 'schema',
  groq: 'object',
  openrouter: 'object',
  deepseek: 'object',
  ollama: 'object',
};

export class OpenAiCompatibleProvider implements LlmProvider {
  private readonly options: OpenAiCompatibleOptions;
  private readonly jsonStrategy: JsonStrategy;

  constructor(options: OpenAiCompatibleOptions) {
    this.options = options;
    this.jsonStrategy =
      options.jsonStrategy ??
      JSON_STRATEGY_BY_PROVIDER[options.providerId] ??
      'object';
  }

  get id(): string {
    return this.options.providerId;
  }

  get model(): string {
    return this.options.model;
  }

  get capabilities(): LlmCapabilities {
    return {
      tools: this.options.supportsTools ?? true,
      nativeJsonSchema: this.jsonStrategy === 'schema',
      jsonMode: this.jsonStrategy !== 'prompt',
      vision: this.options.supportsVision ?? false,
      maxOutputTokens: this.options.defaultMaxOutputTokens,
    };
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    const startedAt = Date.now();
    const body = this.buildBody(request);

    const raw = await postJson<ChatCompletionResponse>({
      url: `${this.trimmedBaseUrl()}/chat/completions`,
      body,
      headers: this.buildHeaders(),
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
    const messages: OpenAiMessage[] = [];

    const system = this.buildSystemPrompt(request);
    if (system) messages.push({ role: 'system', content: system });

    for (const message of request.messages) {
      messages.push(this.mapMessage(message));
    }

    const body: Record<string, unknown> = {
      model: this.model,
      messages,
      max_tokens:
        request.maxOutputTokens ?? this.options.defaultMaxOutputTokens,
    };

    if (request.temperature !== undefined) {
      body.temperature = request.temperature;
    }

    if (request.tools?.length) {
      if (!this.capabilities.tools) {
        throw new LlmError(
          'unsupported',
          `El proveedor ${this.id} no soporta herramientas (function calling).`,
          { providerId: this.id },
        );
      }
      body.tools = request.tools.map((tool) => ({
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      }));
      body.tool_choice = this.mapToolChoice(request);
    }

    const responseFormat = this.mapResponseFormat(request);
    if (responseFormat) body.response_format = responseFormat;

    return body;
  }

  /**
   * Cuando el servidor no garantiza el esquema, lo pedimos por prompt.
   * Asi el dominio recibe la misma calidad de JSON venga de donde venga.
   */
  private buildSystemPrompt(request: LlmRequest): string | undefined {
    const parts: string[] = [];
    if (request.system) parts.push(request.system);

    const format = request.responseFormat;
    if (format?.type === 'json_schema' && this.jsonStrategy !== 'schema') {
      parts.push(buildJsonSchemaInstruction(format.name, format.schema));
    } else if (format?.type === 'json' && this.jsonStrategy === 'prompt') {
      parts.push('\nResponde unicamente con un objeto JSON valido.');
    }

    return parts.length ? parts.join('\n') : undefined;
  }

  private mapResponseFormat(
    request: LlmRequest,
  ): Record<string, unknown> | undefined {
    const format = request.responseFormat;
    if (!format || format.type === 'text') return undefined;

    if (format.type === 'json_schema' && this.jsonStrategy === 'schema') {
      return {
        type: 'json_schema',
        json_schema: {
          name: format.name,
          schema: format.schema,
          strict: true,
        },
      };
    }

    if (this.jsonStrategy === 'prompt') return undefined;

    // Herramientas y JSON forzado no se combinan bien: si hay tools, el modelo
    // debe poder elegir llamarlas en vez de responder JSON.
    if (request.tools?.length) return undefined;

    return { type: 'json_object' };
  }

  private mapToolChoice(request: LlmRequest): unknown {
    const choice = request.toolChoice ?? 'auto';
    if (typeof choice === 'string') return choice;
    return { type: 'function', function: { name: choice.name } };
  }

  private mapMessage(message: LlmMessage): OpenAiMessage {
    if (message.role === 'tool') {
      return {
        role: 'tool',
        tool_call_id: message.toolCallId,
        content: contentToText(message.content),
      };
    }

    if (message.role === 'assistant' && message.toolCalls?.length) {
      return {
        role: 'assistant',
        content: contentToText(message.content) || null,
        tool_calls: message.toolCalls.map((call) => ({
          id: call.id,
          type: 'function',
          function: {
            name: call.name,
            arguments: JSON.stringify(call.arguments ?? {}),
          },
        })),
      };
    }

    if (typeof message.content === 'string') {
      return { role: message.role, content: message.content };
    }

    return {
      role: message.role,
      content: message.content.map((part) => this.mapContentPart(part)),
    };
  }

  private mapContentPart(part: LlmContentPart): Record<string, unknown> {
    if (part.type === 'text') {
      return { type: 'text', text: part.text };
    }
    if (!this.capabilities.vision) {
      throw new LlmError(
        'unsupported',
        `El proveedor ${this.id} no acepta imagenes con el modelo ${this.model}.`,
        { providerId: this.id },
      );
    }
    return {
      type: 'image_url',
      image_url: { url: `data:${part.mimeType};base64,${part.dataBase64}` },
    };
  }

  private mapResponse(
    raw: ChatCompletionResponse,
    latencyMs: number,
  ): LlmResponse {
    const choice = raw.choices?.[0];
    if (!choice) {
      throw new LlmError('parse', `${this.id} no devolvio ninguna opcion.`, {
        providerId: this.id,
      });
    }

    const toolCalls: LlmToolCall[] = (choice.message?.tool_calls ?? []).map(
      (call) => ({
        id: call.id,
        name: call.function?.name ?? '',
        arguments: safeParseArguments(call.function?.arguments, this.id),
      }),
    );

    const inputTokens = raw.usage?.prompt_tokens ?? 0;
    const outputTokens = raw.usage?.completion_tokens ?? 0;

    return {
      text: choice.message?.content ?? '',
      toolCalls,
      finishReason: mapFinishReason(choice.finish_reason),
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: raw.usage?.total_tokens ?? inputTokens + outputTokens,
      },
      providerId: this.id,
      model: raw.model ?? this.model,
      latencyMs,
      costUsd: estimateCostUsd(
        raw.model ?? this.model,
        inputTokens,
        outputTokens,
      ),
      raw,
    };
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = { ...this.options.extraHeaders };
    if (this.options.apiKey) {
      headers.authorization = `Bearer ${this.options.apiKey}`;
    }
    return headers;
  }

  private trimmedBaseUrl(): string {
    return this.options.baseUrl.replace(/\/+$/, '');
  }
}

// ------------------------------------------------------------------ helpers

interface OpenAiMessage {
  role: string;
  content: string | null | Record<string, unknown>[];
  tool_calls?: unknown[];
  tool_call_id?: string;
}

interface ChatCompletionResponse {
  model?: string;
  choices?: {
    finish_reason?: string;
    message?: {
      content?: string | null;
      tool_calls?: {
        id: string;
        function?: { name?: string; arguments?: string };
      }[];
    };
  }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

function contentToText(content: LlmMessage['content']): string {
  if (typeof content === 'string') return content;
  return content
    .filter(
      (part): part is { type: 'text'; text: string } => part.type === 'text',
    )
    .map((part) => part.text)
    .join('\n');
}

function safeParseArguments(
  raw: string | undefined,
  providerId: string,
): Record<string, unknown> {
  if (!raw || !raw.trim()) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null
      ? (parsed as Record<string, unknown>)
      : {};
  } catch (error) {
    throw new LlmError(
      'parse',
      `${providerId} devolvio argumentos de herramienta invalidos: ${raw.slice(0, 200)}`,
      { providerId, cause: error },
    );
  }
}

function mapFinishReason(reason: string | undefined): LlmFinishReason {
  switch (reason) {
    case 'stop':
    case 'end_turn':
      return 'stop';
    case 'length':
    case 'max_tokens':
      return 'length';
    case 'tool_calls':
    case 'function_call':
      return 'tool_calls';
    case 'content_filter':
      return 'content_filter';
    default:
      return reason ? 'unknown' : 'stop';
  }
}
