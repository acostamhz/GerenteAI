import { timingSafeEqual } from 'node:crypto';

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Protege las rutas que consume n8n.
 *
 * No se usa JWT porque n8n no es un usuario: es un servicio. Un secreto
 * compartido en la cabecera `x-api-key` es el mecanismo correcto y el que menos
 * partes moviles tiene.
 *
 * Sin esta guarda, cualquiera que conozca la URL puede gastar la cuota de IA del
 * proyecto y escribir movimientos falsos en la contabilidad de un cliente.
 */
@Injectable()
export class N8nApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(N8nApiKeyGuard.name);

  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('N8N_API_KEY')?.trim();

    if (!expected) {
      // En produccion no arrancamos a ciegas: mejor fallar que quedar abierto.
      if (this.config.get<string>('NODE_ENV') === 'production') {
        this.logger.error(
          'N8N_API_KEY no esta definida: se rechazan las llamadas de integracion.',
        );
        throw new UnauthorizedException(
          'La integracion de WhatsApp no esta configurada en el servidor.',
        );
      }

      this.logger.warn(
        'N8N_API_KEY no definida: ruta ABIERTA (solo aceptable en desarrollo).',
      );
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const received = readApiKey(request);

    if (!received || !safeEqual(received, expected)) {
      this.logger.warn(
        `Llamada rechazada a ${request.path} desde ${request.ip ?? 'origen desconocido'}: API key invalida o ausente.`,
      );
      throw new UnauthorizedException('API key invalida.');
    }

    return true;
  }
}

/** Acepta `x-api-key: <clave>` y `Authorization: Bearer <clave>`. */
function readApiKey(request: Request): string | null {
  const header = request.headers['x-api-key'];
  if (typeof header === 'string' && header.trim()) return header.trim();

  const auth = request.headers.authorization;
  if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) {
    return auth.slice(7).trim();
  }

  return null;
}

/** Comparacion en tiempo constante: no filtra el secreto por el tiempo de respuesta. */
function safeEqual(received: string, expected: string): boolean {
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
