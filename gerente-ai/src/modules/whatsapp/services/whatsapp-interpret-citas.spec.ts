import { ConfigService } from '@nestjs/config';
import type { PrismaService } from '../../../services/prisma.service';
import { WhatsAppMessageService } from '../../finance-ai/services/whatsapp-message.service';
import { MessageDedupeService } from './message-dedupe.service';
import { WhatsappInterpretService } from './whatsapp-interpret.service';
import type { WhatsappRoutingService } from './whatsapp-routing.service';

/**
 * Responder citando un mensaje anterior, y memoria por persona.
 *
 * En WhatsApp se puede responder a un mensaje concreto, y la gente lo usa justo
 * cuando habla de algo que no es lo ultimo que se dijo. Antes esa cita no
 * llegaba al backend: "pero esto es lo que me dijiste" entraba suelto y Luka
 * contestaba cualquier cosa.
 */

const SEDE = 'sede-1';

interface MensajeGuardado {
  id: string;
  rol: string;
  contenido: string;
  wamid: string | null;
  remitente: string | null;
  fecha: Date;
}

function armar(existentes: MensajeGuardado[] = []) {
  const guardados: MensajeGuardado[] = [...existentes];
  const consultas: Record<string, unknown>[] = [];
  let siguienteId = 1;

  const prisma = {
    mensaje: {
      findMany: ({ where }: { where: Record<string, unknown> }) => {
        consultas.push(where);
        return Promise.resolve([]);
      },
      findFirst: ({ where }: { where: { wamid: string; sedeId: string } }) =>
        Promise.resolve(
          guardados.find(
            (m) => m.wamid === where.wamid && where.sedeId === SEDE,
          ) ?? null,
        ),
      create: ({ data }: { data: Omit<MensajeGuardado, 'id' | 'fecha'> }) => {
        const fila = {
          ...data,
          id: `m${siguienteId++}`,
          fecha: new Date('2026-09-04T15:00:00.000Z'),
        };
        guardados.push(fila);
        return Promise.resolve(fila);
      },
      updateMany: ({
        where,
        data,
      }: {
        where: { id: string };
        data: { wamid: string };
      }) => {
        const fila = guardados.find((m) => m.id === where.id);
        if (fila) fila.wamid = data.wamid;
        return Promise.resolve({ count: fila ? 1 : 0 });
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

  const visto: { quoted?: unknown } = {};

  const whatsapp = {
    handleMessage: (request: { quotedMessage?: unknown }) => {
      visto.quoted = request.quotedMessage;
      return Promise.resolve({
        intent: {
          type: 'unclear',
          amount: null,
          category: null,
          concept: null,
          responseText: 'ok',
          queryPeriod: null,
          confidence: 0.9,
          movements: [],
          declaredTotal: null,
        },
        transactions: [],
        transaction: null,
        summary: null,
        replyText: 'ok',
        meta: {
          promptVersion: 'v1',
          provider: 'fake',
          model: 'fake-1',
          latencyMs: 1,
          costUsd: 0,
        },
      } as never);
    },
  } as unknown as WhatsAppMessageService;

  const service = new WhatsappInterpretService(
    routing,
    whatsapp,
    new MessageDedupeService(),
    prisma,
    { get: () => undefined } as unknown as ConfigService,
  );

  return { service, guardados, consultas, visto };
}

describe('WhatsappInterpretService · mensajes citados', () => {
  it('le pasa a Luka el mensaje que el usuario está citando', async () => {
    const { service, visto } = armar([
      {
        id: 'viejo',
        rol: 'ASSISTANT',
        contenido: 'Registré un gasto de $50.000 en transporte.',
        wamid: 'wamid.luka1',
        remitente: null,
        fecha: new Date('2026-09-01T20:00:00.000Z'),
      },
    ]);

    await service.interpret({
      message: 'pero esto es lo que me dijiste',
      phone: '573001234567',
      messageId: 'wamid.nuevo',
      quotedMessageId: 'wamid.luka1',
    });

    expect(visto.quoted).toEqual({
      fromLuka: true,
      date: '2026-09-01',
      content: 'Registré un gasto de $50.000 en transporte.',
    });
  });

  it('reconoce cuando el usuario cita un mensaje suyo', async () => {
    const { service, visto } = armar([
      {
        id: 'viejo',
        rol: 'USER',
        contenido: 'Vendí 300.000 fiado a Rosa',
        wamid: 'wamid.mio',
        remitente: '573001234567',
        fecha: new Date('2026-08-28T14:00:00.000Z'),
      },
    ]);

    await service.interpret({
      message: 'esto que registré aquí está mal',
      phone: '573001234567',
      quotedMessageId: 'wamid.mio',
    });

    expect(visto.quoted).toMatchObject({
      fromLuka: false,
      content: 'Vendí 300.000 fiado a Rosa',
    });
  });

  it('si el mensaje citado no está guardado, sigue sin romperse', async () => {
    // Pasa con los mensajes anteriores a que se guardara el wamid.
    const { service, visto } = armar();

    await service.interpret({
      message: 'esto',
      phone: '573001234567',
      quotedMessageId: 'wamid.desconocido',
    });

    expect(visto.quoted).toBeNull();
  });

  it('guarda el wamid y el remitente del mensaje del usuario', async () => {
    const { service, guardados } = armar();

    await service.interpret({
      message: 'Hola',
      phone: '573001234567',
      messageId: 'wamid.hola',
    });

    const delUsuario = guardados.find((m) => m.rol === 'USER')!;
    expect(delUsuario.wamid).toBe('wamid.hola');
    expect(delUsuario.remitente).toBe('573001234567');
  });

  it('devuelve el id del mensaje de Luka para que n8n anote su wamid', async () => {
    const { service } = armar();

    const respuesta = await service.interpret({
      message: 'Hola',
      phone: '573001234567',
      messageId: 'wamid.hola',
    });

    expect(respuesta.meta.assistantMessageId).not.toBeNull();
  });

  it('anota el wamid con el que se envió la respuesta', async () => {
    // Sin este paso, citar un mensaje de Luka manda un wamid que no está en
    // ninguna parte y la cita se pierde.
    const { service, guardados } = armar();

    const respuesta = await service.interpret({
      message: 'Hola',
      phone: '573001234567',
      messageId: 'wamid.hola',
    });

    const anotado = await service.registrarEnvio(
      respuesta.meta.assistantMessageId!,
      'wamid.respuesta',
    );

    expect(anotado).toBe(true);
    expect(guardados.find((m) => m.rol === 'ASSISTANT')!.wamid).toBe(
      'wamid.respuesta',
    );
  });
});

describe('WhatsappInterpretService · memoria por persona', () => {
  it('no mezcla la conversación de dos empleados de la misma sede', async () => {
    // Antes el historial era solo por sede: Luka le contestaba a uno con el
    // contexto del otro.
    const { service, consultas } = armar();

    await service.interpret({
      message: 'Hola',
      phone: '573001234567',
      messageId: 'wamid.uno',
    });

    expect(consultas[0]).toMatchObject({
      sedeId: SEDE,
      OR: [
        { remitente: '573001234567' },
        { remitente: null },
        { rol: 'ASSISTANT' },
      ],
    });
  });
});
