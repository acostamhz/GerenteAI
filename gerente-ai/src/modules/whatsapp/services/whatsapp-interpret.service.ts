import { Injectable, Logger } from '@nestjs/common';

import { LlmError, type LlmErrorCode } from '../../../ai/core/llm.errors';
import { PrismaService } from '../../../services/prisma.service';
import {
  CATEGORY_LABELS,
  type MessageIntentType,
  type QueryPeriod,
  type TransactionCategory,
} from '../../finance-ai/domain/finance.types';
import {
  WhatsAppMessageService,
  type WhatsAppMessageResult,
} from '../../finance-ai/services/whatsapp-message.service';
import type { InterpretMessageDto } from '../dto/interpret-message.dto';
import { MessageDedupeService } from './message-dedupe.service';
import {
  maskPhone,
  normalizePhone,
  WhatsappRoutingService,
  type WhatsappContext,
} from './whatsapp-routing.service';

/**
 * Adaptador entre n8n y el cerebro financiero.
 *
 * Responsabilidades, en orden:
 *   1. descartar duplicados (Meta reintenta)
 *   2. resolver telefono -> sede (sin sede no hay donde guardar)
 *   3. dejar el mensaje del usuario en el historial
 *   4. pedirle la interpretacion a `WhatsAppMessageService` (Persona 3)
 *   5. guardar la respuesta en el historial
 *   6. devolver el contrato plano que n8n espera
 *
 * REGLA DE ORO DE ESTE SERVICIO: nunca deja al usuario sin respuesta. Si la IA
 * falla, se responde con un texto degradado y `ok:false`; el 500 se reserva
 * para fallos de infraestructura que n8n si debe reintentar.
 */

/** Tipos en espanol: es el vocabulario del contrato publico con n8n. */
export type PublicIntentType =
  | 'gasto'
  | 'ingreso'
  | 'inversion'
  | 'consulta'
  | 'correccion'
  | 'no_claro'
  | 'no_registrado'
  | 'error';

export interface InterpretResponse {
  /** false = hubo un fallo y `reply` es un mensaje degradado. */
  ok: boolean;
  /** Texto listo para enviar por WhatsApp. Vacio = no responder nada. */
  reply: string;
  interpreted: {
    type: PublicIntentType;
    /** El tipo interno (income/expense/...), por si n8n necesita ramificar. */
    rawType: MessageIntentType | null;
    amount: number | null;
    category: string | null;
    categoryLabel: string | null;
    concept: string | null;
    confidence: number;
    period: QueryPeriod | null;
    /** true = quedo escrito en PostgreSQL. */
    saved: boolean;
    transactionId: string | null;
  };
  meta: {
    negocioId: string | null;
    sedeId: string | null;
    duplicate: boolean;
    promptVersion: string | null;
    provider: string | null;
    model: string | null;
    latencyMs: number | null;
    costUsd: number | null;
    durationMs: number;
  };
  error?: { code: string; retryable: boolean };
}

const TYPE_LABELS: Record<MessageIntentType, PublicIntentType> = {
  expense: 'gasto',
  income: 'ingreso',
  investment: 'inversion',
  query: 'consulta',
  correction: 'correccion',
  unclear: 'no_claro',
};

/**
 * Que se le dice al usuario cuando la IA falla. Nada de codigos ni de jerga:
 * al otro lado hay un tendero, no un desarrollador.
 */
const FALLBACK_REPLY: Partial<Record<LlmErrorCode, string>> = {
  rate_limit:
    'Estoy recibiendo muchos mensajes en este momento 😅 Reenviame el tuyo en un minuto y lo registro.',
  timeout:
    'Me demore mas de la cuenta procesando tu mensaje. ¿Me lo reenvias, por favor?',
  network:
    'Tuve un problema de conexion y no pude procesar tu mensaje. Intenta de nuevo en un momento.',
  server:
    'Tuve un problema tecnico y no pude procesar tu mensaje. Intenta de nuevo en un momento.',
  quota_exceeded:
    'Alcanzaste el limite de mensajes de tu plan este mes. Puedes ampliarlo desde el panel de Luka AI.',
  content_filter:
    'No pude procesar ese mensaje. ¿Me lo escribes de otra forma?',
  auth: 'El asistente esta en mantenimiento. Ya estamos trabajando en ello 🙏',
};

const GENERIC_FALLBACK =
  'No pude procesar tu mensaje en este momento 😔 Intenta de nuevo en unos minutos.';

@Injectable()
export class WhatsappInterpretService {
  private readonly logger = new Logger(WhatsappInterpretService.name);

  constructor(
    private readonly routing: WhatsappRoutingService,
    private readonly whatsapp: WhatsAppMessageService,
    private readonly dedupe: MessageDedupeService,
    private readonly prisma: PrismaService,
  ) {}

  async interpret(dto: InterpretMessageDto): Promise<InterpretResponse> {
    const startedAt = Date.now();
    const phone = normalizePhone(dto.phone);

    this.logger.log(
      `Mensaje de ${dto.name ?? 'sin nombre'} (${maskPhone(phone)}): "${dto.message.slice(0, 120)}"`,
    );

    // ---- 1. Duplicados ----------------------------------------------------
    if (!this.dedupe.isFirstTime(dto.messageId)) {
      return this.emptyResponse({
        type: 'no_claro',
        reply: '',
        durationMs: Date.now() - startedAt,
        duplicate: true,
      });
    }

    try {
      return await this.process(dto, phone, startedAt);
    } catch (error) {
      // El mensaje no llego a atenderse: se libera el id para que el reintento
      // de n8n vuelva a intentarlo en vez de recibir "duplicado".
      this.dedupe.forget(dto.messageId);
      throw error;
    }
  }

  /** Todo lo que ocurre una vez descartado el duplicado. */
  private async process(
    dto: InterpretMessageDto,
    phone: string,
    startedAt: number,
  ): Promise<InterpretResponse> {
    // ---- 2. ¿De quien es este numero? -------------------------------------
    const context = await this.routing.resolve(phone);

    if (!context) {
      // Sin negocio asociado no se llama al modelo: no se gasta cuota con
      // numeros desconocidos (y ahi es donde llega el spam).
      return this.emptyResponse({
        type: 'no_registrado',
        reply: unregisteredReply(dto.name),
        durationMs: Date.now() - startedAt,
        duplicate: false,
      });
    }

    // ---- 3. Historial: lo que dijo el usuario -----------------------------
    await this.saveMessage(context.sedeId, 'USER', dto.message);

    // ---- 4. Interpretacion ------------------------------------------------
    let result: WhatsAppMessageResult;
    try {
      result = await this.whatsapp.handleMessage({
        tenantId: context.negocioId,
        businessId: context.sedeId,
        message: dto.message,
        businessName: context.negocioNombre,
        currency: context.currency,
        plan: context.plan,
        // El bot existe para registrar: se guarda salvo que n8n pida lo contrario.
        persist: dto.persist ?? true,
      });
    } catch (error) {
      return this.degradedResponse(error, context, Date.now() - startedAt);
    }

    // ---- 5. Historial: lo que respondio el bot ----------------------------
    await this.saveMessage(context.sedeId, 'ASSISTANT', result.replyText);

    const category = result.intent.category as TransactionCategory | null;

    this.logger.log(
      `→ ${result.intent.type} · ${result.intent.amount ?? '-'} ${context.currency} · confianza ${result.intent.confidence} · guardado=${result.transaction !== null} · ${result.meta.provider}/${result.meta.model} · ${Date.now() - startedAt} ms`,
    );

    // ---- 6. Contrato de salida -------------------------------------------
    return {
      ok: true,
      reply: result.replyText,
      interpreted: {
        type: TYPE_LABELS[result.intent.type],
        rawType: result.intent.type,
        amount: result.intent.amount,
        category,
        categoryLabel: category ? CATEGORY_LABELS[category] : null,
        concept: result.intent.concept,
        confidence: result.intent.confidence,
        period: result.intent.queryPeriod,
        saved: result.transaction !== null,
        transactionId: result.transaction?.id ?? null,
      },
      meta: {
        negocioId: context.negocioId,
        sedeId: context.sedeId,
        duplicate: false,
        promptVersion: result.meta.promptVersion,
        provider: result.meta.provider,
        model: result.meta.model,
        latencyMs: result.meta.latencyMs,
        costUsd: result.meta.costUsd,
        durationMs: Date.now() - startedAt,
      },
    };
  }

  // ------------------------------------------------------------------ interno

  /**
   * El historial es util (auditoria, contexto futuro, soporte) pero no es
   * critico: si falla, el usuario igual debe recibir su respuesta.
   */
  private async saveMessage(
    sedeId: string,
    rol: 'USER' | 'ASSISTANT',
    contenido: string,
  ): Promise<void> {
    try {
      await this.prisma.mensaje.create({ data: { sedeId, rol, contenido } });
    } catch (error) {
      this.logger.error(
        `No se pudo guardar el mensaje (${rol}) de la sede ${sedeId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /** La IA fallo: se responde algo util y se deja constancia del codigo real. */
  private degradedResponse(
    error: unknown,
    context: WhatsappContext,
    durationMs: number,
  ): InterpretResponse {
    const llmError = LlmError.isLlmError(error) ? error : null;
    const code = llmError?.code ?? 'unknown';

    this.logger.error(
      `Fallo la interpretacion para la sede ${context.sedeId} [${code}]: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );

    return {
      ok: false,
      reply: FALLBACK_REPLY[code] ?? GENERIC_FALLBACK,
      interpreted: {
        type: 'error',
        rawType: null,
        amount: null,
        category: null,
        categoryLabel: null,
        concept: null,
        confidence: 0,
        period: null,
        saved: false,
        transactionId: null,
      },
      meta: {
        negocioId: context.negocioId,
        sedeId: context.sedeId,
        duplicate: false,
        promptVersion: null,
        provider: null,
        model: null,
        latencyMs: null,
        costUsd: null,
        durationMs,
      },
      error: { code, retryable: llmError?.retryable ?? false },
    };
  }

  private emptyResponse(options: {
    type: PublicIntentType;
    reply: string;
    durationMs: number;
    duplicate: boolean;
  }): InterpretResponse {
    return {
      ok: true,
      reply: options.reply,
      interpreted: {
        type: options.type,
        rawType: null,
        amount: null,
        category: null,
        categoryLabel: null,
        concept: null,
        confidence: 0,
        period: null,
        saved: false,
        transactionId: null,
      },
      meta: {
        negocioId: null,
        sedeId: null,
        duplicate: options.duplicate,
        promptVersion: null,
        provider: null,
        model: null,
        latencyMs: null,
        costUsd: null,
        durationMs: options.durationMs,
      },
    };
  }
}

/**
 * Numero desconocido. Se responde igual (es un posible cliente) pero sin gastar
 * un solo token de IA.
 */
function unregisteredReply(name?: string): string {
  const saludo = name ? `Hola ${name.split(' ')[0]} 👋` : 'Hola 👋';
  return `${saludo} Soy el asistente financiero de Luka AI, pero este numero todavia no esta registrado en ningun negocio.\n\nPara empezar a registrar tus gastos e ingresos por WhatsApp, crea tu cuenta y agrega este numero desde el panel.`;
}
