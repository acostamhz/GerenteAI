/**
 * Taxonomia de errores normalizada.
 *
 * Cada adaptador traduce los errores nativos de su proveedor a estos codigos,
 * para que el resto de la aplicacion (reintentos, fallback, HTTP status) no
 * dependa de como falla un proveedor en particular.
 */
export type LlmErrorCode =
  | 'auth' // API key invalida o ausente
  | 'rate_limit' // 429 / cuota del proveedor
  | 'timeout'
  | 'network'
  | 'bad_request' // payload invalido: no reintentar
  | 'server' // 5xx del proveedor
  | 'refusal' // el modelo se nego a responder
  | 'content_filter'
  | 'parse' // respondio, pero no pudimos interpretar la salida
  | 'quota_exceeded' // cuota INTERNA del plan del tenant, no del proveedor
  | 'unsupported' // capacidad no soportada por este proveedor
  | 'unknown';

const RETRYABLE: ReadonlySet<LlmErrorCode> = new Set<LlmErrorCode>([
  'rate_limit',
  'timeout',
  'network',
  'server',
]);

export class LlmError extends Error {
  readonly code: LlmErrorCode;
  readonly providerId: string;
  readonly status?: number;
  readonly retryable: boolean;
  /** Segundos sugeridos de espera (cabecera Retry-After), si el proveedor la envia. */
  readonly retryAfterSeconds?: number;
  readonly cause?: unknown;

  constructor(
    code: LlmErrorCode,
    message: string,
    options: {
      providerId?: string;
      status?: number;
      retryable?: boolean;
      retryAfterSeconds?: number;
      cause?: unknown;
    } = {},
  ) {
    super(message);
    this.name = 'LlmError';
    this.code = code;
    this.providerId = options.providerId ?? 'unknown';
    this.status = options.status;
    this.retryable = options.retryable ?? RETRYABLE.has(code);
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.cause = options.cause;
  }

  /** Mapea un status HTTP al codigo normalizado. */
  static fromHttpStatus(
    status: number,
    message: string,
    providerId: string,
    extra: { retryAfterSeconds?: number; cause?: unknown } = {},
  ): LlmError {
    let code: LlmErrorCode;
    if (status === 401 || status === 403) code = 'auth';
    else if (status === 429) code = 'rate_limit';
    else if (status === 408 || status === 504) code = 'timeout';
    else if (status >= 500) code = 'server';
    else if (status >= 400) code = 'bad_request';
    else code = 'unknown';

    return new LlmError(code, message, { providerId, status, ...extra });
  }

  static isLlmError(error: unknown): error is LlmError {
    return error instanceof LlmError;
  }
}

/** Cuota del plan del negocio agotada (limite de mensajes de IA del mes). */
export class AiQuotaExceededError extends LlmError {
  readonly used: number;
  readonly limit: number;

  constructor(used: number, limit: number, scope: string) {
    super(
      'quota_exceeded',
      `Se agoto la cuota de IA del plan (${used}/${limit} mensajes este mes) para ${scope}.`,
      { retryable: false },
    );
    this.name = 'AiQuotaExceededError';
    this.used = used;
    this.limit = limit;
  }
}
