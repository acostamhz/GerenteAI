import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
  type WhatsappSender,
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
  | 'fuera_de_alcance'
  | 'plan_requerido'
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
  out_of_scope: 'fuera_de_alcance',
  premium: 'plan_requerido',
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

/**
 * A donde se manda a registrar a quien escribe desde un numero desconocido.
 * Se puede sobreescribir con FRONTEND_REGISTER_URL.
 *
 * No se reutiliza FRONTEND_URL a proposito: esa apunta al entorno desde el que
 * se arman los enlaces de los correos, y en desarrollo vale localhost, que
 * dentro de un WhatsApp no le sirve a nadie.
 */
const DEFAULT_REGISTER_URL = 'https://luka-gules.vercel.app/home';

/** Pantalla de planes, para cuando piden algo que su plan no incluye. */
const DEFAULT_PLANS_URL = 'https://luka-gules.vercel.app/subscription';

/** Turnos de conversacion que se le pasan al modelo. 6 = 3 idas y vueltas. */
const HISTORY_TURNS = 6;

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
    private readonly config: ConfigService,
  ) {}

  async interpret(dto: InterpretMessageDto): Promise<InterpretResponse> {
    const startedAt = Date.now();
    const sender = readSender(dto);

    if (!sender.phone && !sender.userId) {
      // n8n no deberia llamar sin remitente; si pasa, conviene un 400 claro y
      // no un fallo mas adelante con un mensaje que no explica nada.
      throw new BadRequestException(
        'Falta identificar al remitente: se requiere phone o userId.',
      );
    }

    this.logger.log(
      `Mensaje de ${dto.name ?? 'sin nombre'} (${describeSender(sender)}): "${dto.message.slice(0, 120)}"`,
    );

    // ---- 1. Duplicados ----------------------------------------------------
    if (!this.dedupe.isFirstTime(dto.messageId)) {
      const previa = this.dedupe.recall<InterpretResponse>(dto.messageId);

      if (previa) {
        // Se repite la respuesta ya calculada en vez de devolver vacio: el
        // movimiento NO se registra dos veces, pero el usuario recibe su
        // confirmacion aunque n8n haya reintentado por timeout.
        this.logger.log(
          `Mensaje repetido (${dto.messageId}): se reenvia la respuesta anterior.`,
        );
        return { ...previa, meta: { ...previa.meta, duplicate: true } };
      }

      // Sin respuesta guardada, el original sigue en curso: contestara el.
      return this.emptyResponse({
        type: 'no_claro',
        reply: '',
        durationMs: Date.now() - startedAt,
        duplicate: true,
      });
    }

    try {
      const respuesta = await this.process(dto, sender, startedAt);
      this.dedupe.remember(dto.messageId, respuesta);
      return respuesta;
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
    sender: WhatsappSender,
    startedAt: number,
  ): Promise<InterpretResponse> {
    // ---- 2. ¿De quien es este remitente? ----------------------------------
    const context = await this.routing.resolve(sender);

    if (!context) {
      // Sin negocio asociado no se llama al modelo: no se gasta cuota con
      // numeros desconocidos (y ahi es donde llega el spam).
      return this.emptyResponse({
        type: 'no_registrado',
        reply: this.unregisteredReply(dto.name, sender),
        durationMs: Date.now() - startedAt,
        duplicate: false,
      });
    }

    // ---- 3. Historial ------------------------------------------------------
    // Se lee ANTES de guardar el mensaje nuevo: si no, el modelo recibiria dos
    // veces el mismo texto (como turno anterior y como mensaje actual).
    const history = await this.loadHistory(context.sedeId);
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
        planName: context.planName,
        planIsFree: context.planIsFree,
        history,
        // El bot existe para registrar: se guarda salvo que n8n pida lo contrario.
        persist: dto.persist ?? true,
      });
    } catch (error) {
      return this.degradedResponse(error, context, Date.now() - startedAt);
    }

    // ---- 5. Funciones que su plan no incluye -------------------------------
    // El texto lo pone el backend, no el modelo: los precios y el enlace no se
    // improvisan, y asi el mensaje comercial es siempre el mismo.
    const replyText =
      result.intent.type === 'premium' && context.planIsFree
        ? this.upgradeReply(context.planName)
        : result.replyText;

    // ---- 6. Historial: lo que respondio el bot ----------------------------
    await this.saveMessage(context.sedeId, 'ASSISTANT', replyText);

    const category = result.intent.category as TransactionCategory | null;

    this.logger.log(
      `→ ${result.intent.type} · ${result.intent.amount ?? '-'} ${context.currency} · confianza ${result.intent.confidence} · guardado=${result.transaction !== null} · ${result.meta.provider}/${result.meta.model} · ${Date.now() - startedAt} ms`,
    );

    // ---- 7. Contrato de salida -------------------------------------------
    return {
      ok: true,
      reply: replyText,
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

  /**
   * Ultimos turnos de la conversacion de esa sede.
   *
   * Es lo que permite completar un movimiento a medias: sin historial, el
   * modelo preguntaba el monto, el usuario lo respondia suelto y volvia a
   * preguntar lo mismo, porque cada mensaje llegaba sin pasado.
   *
   * LIMITACION: el historial es por SEDE, no por persona. Si dos empleados
   * escriben desde la misma sede, sus conversaciones se mezclan. Separarlas
   * requiere guardar el remitente en `Mensaje`.
   */
  private async loadHistory(
    sedeId: string,
  ): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    try {
      const mensajes = await this.prisma.mensaje.findMany({
        where: { sedeId, rol: { in: ['USER', 'ASSISTANT'] } },
        orderBy: { fecha: 'desc' },
        take: HISTORY_TURNS,
      });

      return mensajes.reverse().map((m) => ({
        role: m.rol === 'USER' ? ('user' as const) : ('assistant' as const),
        content: m.contenido,
      }));
    } catch (error) {
      // Sin historial el bot responde peor, pero responde. No vale la pena
      // dejar al usuario sin respuesta por esto.
      this.logger.warn(
        `No se pudo leer el historial de la sede ${sedeId}: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return [];
    }
  }

  /** Pidio algo que su plan no incluye. Se le dice con que plan si lo tendria. */
  private upgradeReply(planName: string): string {
    const url =
      this.config.get<string>('FRONTEND_PLANS_URL')?.trim() ||
      DEFAULT_PLANS_URL;

    return [
      `Esa función no está incluida en tu plan ${planName} 😊`,
      '',
      'Con los planes Gerente o Administrador puedes tener reportes por producto, reporte de fiados, recomendaciones con IA y registrar por foto o audio.',
      '',
      `Puedes verlos aquí:
${url}`,
      '',
      'Mientras tanto sigo registrando tus gastos, ingresos e inversiones y dándote tus resúmenes 💪',
    ].join('\n');
  }

  /**
   * Numero desconocido: no hay negocio al cual imputar nada.
   *
   * Se responde igual, porque del otro lado puede haber un cliente, pero sin
   * gastar un solo token de IA: el modelo ni se llama. El enlace de registro va
   * explicito porque es la unica salida posible.
   */
  private unregisteredReply(
    name: string | undefined,
    sender: WhatsappSender,
  ): string {
    const saludo = name ? SALUDO_CON_NOMBRE(name) : '¡Hola! 👋';
    const url =
      this.config.get<string>('FRONTEND_REGISTER_URL')?.trim() ||
      DEFAULT_REGISTER_URL;

    // A quien tiene el nombre de usuario de WhatsApp activado no se le puede
    // pedir "agrega este numero": ni el ni nosotros lo vemos. Se le pide su
    // nombre de usuario, que si conoce y puede escribir. El BSUID solo aparece
    // si Meta no mando el usuario, porque es la unica llave que quedaria.
    const cuerpo = sender.phone
      ? [
          'Todavía no encuentro este número registrado en ningún negocio, así que aún no puedo llevarte las cuentas.',
          '',
          'Regístrate aquí y agrega este número a tu negocio:',
        ]
      : [
          'Todavía no encuentro tu negocio. Regístrate y, al crearlo, pon tu usuario de WhatsApp:',
          '',
          sender.username ?? sender.userId ?? '',
          '',
          'Puedes hacerlo aquí:',
        ];

    return [
      saludo + ' Soy Luka, tu asistente financiero con IA.',
      '',
      ...cuerpo,
      url,
      '',
      'Cuando termines, escríbeme de nuevo y empezamos 🚀',
    ].join('\n');
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
 * Identidad del remitente tal como la manda n8n.
 *
 * El telefono se normaliza a digitos; la identidad de WhatsApp se toma tal cual,
 * porque no es un numero y cualquier "limpieza" la romperia.
 */
function readSender(dto: InterpretMessageDto): WhatsappSender {
  const phone = dto.phone ? normalizePhone(dto.phone) : '';
  return {
    phone: phone.length > 0 ? phone : undefined,
    userId: dto.userId?.trim() || undefined,
    username: dto.username?.trim() || undefined,
  };
}

/** Para logs: nunca el telefono completo, y algo util cuando solo hay identidad. */
function describeSender(sender: WhatsappSender): string {
  if (sender.phone) return maskPhone(sender.phone);
  return sender.userId ? `id ${sender.userId}` : 'sin remitente';
}

/** "Angelica Marcillo" -> "¡Hola Angelica! 👋". Solo el primer nombre. */
const SALUDO_CON_NOMBRE = (name: string): string =>
  `¡Hola ${name.trim().split(' ')[0]}! 👋`;
