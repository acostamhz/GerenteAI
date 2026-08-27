import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

import { LlmError, type LlmErrorCode } from '../core/llm.errors';

/**
 * Traduce los fallos de IA a respuestas HTTP con un mensaje entendible.
 *
 * Como los errores ya vienen normalizados, este mapeo no cambia al migrar de
 * proveedor: un 429 de Groq y uno de Anthropic terminan igual.
 */
const STATUS_BY_CODE: Record<LlmErrorCode, number> = {
  auth: HttpStatus.BAD_GATEWAY,
  rate_limit: HttpStatus.TOO_MANY_REQUESTS,
  timeout: HttpStatus.GATEWAY_TIMEOUT,
  network: HttpStatus.SERVICE_UNAVAILABLE,
  bad_request: HttpStatus.BAD_REQUEST,
  server: HttpStatus.BAD_GATEWAY,
  refusal: HttpStatus.UNPROCESSABLE_ENTITY,
  content_filter: HttpStatus.UNPROCESSABLE_ENTITY,
  parse: HttpStatus.BAD_GATEWAY,
  quota_exceeded: HttpStatus.PAYMENT_REQUIRED,
  unsupported: HttpStatus.NOT_IMPLEMENTED,
  unknown: HttpStatus.INTERNAL_SERVER_ERROR,
};

/** Mensajes para el usuario final: sin detalles internos del proveedor. */
const PUBLIC_MESSAGE: Record<LlmErrorCode, string> = {
  auth: 'El servicio de IA no esta configurado correctamente. Contacta al soporte.',
  rate_limit:
    'El servicio de IA esta saturado. Intenta de nuevo en unos segundos.',
  timeout: 'La IA tardo demasiado en responder. Intenta de nuevo.',
  network: 'No se pudo contactar al servicio de IA. Intenta de nuevo.',
  bad_request: 'La solicitud enviada a la IA no es valida.',
  server: 'El servicio de IA presento un error. Intenta de nuevo.',
  refusal: 'La IA no pudo procesar esta solicitud.',
  content_filter:
    'El contenido del mensaje fue bloqueado por los filtros de seguridad.',
  parse:
    'La IA devolvio una respuesta que no pudimos interpretar. Intenta de nuevo.',
  quota_exceeded:
    'Agotaste los mensajes de IA de tu plan este mes. Mejora tu plan para continuar.',
  unsupported:
    'Esta funcion no esta disponible con el proveedor de IA configurado.',
  unknown: 'Ocurrio un error inesperado con el servicio de IA.',
};

@Catch(LlmError)
export class LlmExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('LlmExceptionFilter');

  catch(exception: LlmError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      STATUS_BY_CODE[exception.code] ?? HttpStatus.INTERNAL_SERVER_ERROR;

    // El detalle tecnico va al log, no al cliente.
    this.logger.error(
      `[${exception.code}] proveedor=${exception.providerId} status=${exception.status ?? '-'} ${exception.message}`,
    );

    response.status(status).json({
      success: false,
      error: {
        code: exception.code,
        message: PUBLIC_MESSAGE[exception.code] ?? PUBLIC_MESSAGE.unknown,
        retryable: exception.retryable,
        retryAfterSeconds: exception.retryAfterSeconds,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
