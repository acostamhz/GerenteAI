import { LlmError } from './llm.errors';

/**
 * Cliente HTTP minimo compartido por los adaptadores que hablan REST puro
 * (Groq, Ollama, OpenRouter, Gemini...). Usa `fetch` nativo de Node 18+, sin
 * dependencias extra, y normaliza todos los fallos a `LlmError`.
 */

export interface PostJsonOptions {
  url: string;
  body: unknown;
  headers?: Record<string, string>;
  timeoutMs: number;
  providerId: string;
}

export async function postJson<T>(options: PostJsonOptions): Promise<T> {
  const { url, body, headers = {}, timeoutMs, providerId } = options;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (error) {
    const aborted =
      controller.signal.aborted ||
      (error instanceof Error && error.name === 'AbortError');

    throw new LlmError(
      aborted ? 'timeout' : 'network',
      aborted
        ? `El proveedor ${providerId} no respondio en ${timeoutMs} ms.`
        : `No se pudo conectar con el proveedor ${providerId}: ${errorMessage(error)}`,
      { providerId, cause: error },
    );
  } finally {
    clearTimeout(timer);
  }

  const rawText = await response.text();

  if (!response.ok) {
    throw LlmError.fromHttpStatus(
      response.status,
      `${providerId} respondio ${response.status}: ${rawText.slice(0, 500)}`,
      providerId,
      {
        retryAfterSeconds: parseRetryAfter(response.headers.get('retry-after')),
      },
    );
  }

  if (!rawText.trim()) {
    return {} as T;
  }

  try {
    return JSON.parse(rawText) as T;
  } catch (error) {
    throw new LlmError(
      'parse',
      `${providerId} devolvio una respuesta que no es JSON: ${rawText.slice(0, 300)}`,
      { providerId, cause: error },
    );
  }
}

export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  maxDelayMs?: number;
  onRetry?: (error: LlmError, attempt: number, delayMs: number) => void;
}

/** Reintentos con backoff exponencial + jitter, solo para errores marcados como reintentables. */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const maxDelay = options.maxDelayMs ?? 20_000;
  let lastError: unknown;

  for (let attempt = 1; attempt <= options.attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const isLast = attempt === options.attempts;
      if (isLast || !LlmError.isLlmError(error) || !error.retryable) {
        throw error;
      }

      const suggested = error.retryAfterSeconds
        ? error.retryAfterSeconds * 1000
        : options.baseDelayMs * 2 ** (attempt - 1);
      const jitter = Math.random() * options.baseDelayMs;
      const delay = Math.min(suggested + jitter, maxDelay);

      options.onRetry?.(error, attempt, delay);
      await sleep(delay);
    }
  }

  throw lastError;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : undefined;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
