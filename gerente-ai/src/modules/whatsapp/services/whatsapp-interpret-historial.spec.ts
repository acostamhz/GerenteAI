import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../../services/prisma.service';
import { WhatsAppMessageService } from '../../finance-ai/services/whatsapp-message.service';
import { MessageDedupeService } from './message-dedupe.service';
import { WhatsappInterpretService } from './whatsapp-interpret.service';
import type { WhatsappRoutingService } from './whatsapp-routing.service';

/**
 * El historial solo debe guardar turnos que se pudieron atender.
 *
 * Guardar el mensaje del usuario ANTES de interpretarlo dejaba, cuando el
 * modelo fallaba, una pregunta sin respuesta en el historial. En el mensaje
 * siguiente el modelo la veia, intentaba contestarla otra vez y volvia a fallar
 * por lo mismo: la conversacion quedaba trabada y hasta un "Hola" devolvia
 * "no pude procesar tu mensaje".
 */

const SEDE = 'sede-1';

function armar(handleMessage: () => Promise<unknown>) {
  const guardados: { rol: string; contenido: string }[] = [];

  const prisma = {
    mensaje: {
      findMany: () => Promise.resolve([]),
      create: ({ data }: { data: { rol: string; contenido: string } }) => {
        guardados.push({ rol: data.rol, contenido: data.contenido });
        return Promise.resolve(data);
      },
    },
  } as unknown as PrismaService;

  const routing = {
    resolve: () =>
      Promise.resolve({
        negocioId: 'n1',
        negocioNombre: 'Panadería El Virrey',
        sedeId: SEDE,
        sedeNombre: 'Sede principal',
        plan: 'asistente',
        planName: 'Asistente',
        planIsFree: true,
        currency: 'COP',
        diaInicioPeriodo: 1,
        contexto: null,
      }),
    findUsuarioSinNegocio: () => Promise.resolve(null),
  } as unknown as WhatsappRoutingService;

  const whatsapp = { handleMessage } as unknown as WhatsAppMessageService;
  const config = { get: () => undefined } as unknown as ConfigService;

  const service = new WhatsappInterpretService(
    routing,
    whatsapp,
    new MessageDedupeService(),
    prisma,
    config,
  );

  return { service, guardados };
}

const RESPUESTA_OK = {
  intent: {
    type: 'unclear',
    amount: null,
    category: null,
    concept: null,
    responseText: '¡Hola! ¿En qué te ayudo?',
    queryPeriod: null,
    confidence: 0.9,
    movements: [],
    declaredTotal: null,
  },
  transactions: [],
  transaction: null,
  summary: null,
  replyText: '¡Hola! ¿En qué te ayudo?',
  meta: {
    promptVersion: 'v1',
    provider: 'fake',
    model: 'fake-1',
    latencyMs: 1,
    costUsd: 0,
  },
};

describe('WhatsappInterpretService · historial', () => {
  it('guarda la pregunta y la respuesta cuando se pudo atender', async () => {
    const { service, guardados } = armar(() =>
      Promise.resolve(RESPUESTA_OK as never),
    );

    await service.interpret({
      message: 'Hola',
      phone: '573001234567',
      messageId: 'wamid.ok',
    });

    expect(guardados.map((g) => g.rol)).toEqual(['USER', 'ASSISTANT']);
    expect(guardados[0].contenido).toBe('Hola');
  });

  it('NO deja el turno del usuario colgado si la interpretación falla', async () => {
    // Es lo que trababa la conversación: el mensaje quedaba guardado sin
    // respuesta y contaminaba todos los mensajes siguientes.
    const { service, guardados } = armar(() =>
      Promise.reject(new Error('el modelo devolvió JSON inválido')),
    );

    await service.interpret({
      message: '23 agosto vendí una cama en 2.000.000',
      phone: '573001234567',
      messageId: 'wamid.falla',
    });

    expect(guardados).toHaveLength(0);
  });
});
