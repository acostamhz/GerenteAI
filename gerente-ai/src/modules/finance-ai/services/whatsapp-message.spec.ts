import type { LlmResponse } from '../../../ai/core/llm.types';
import type { LlmService } from '../../../ai/services/llm.service';
import type { PeriodSummary, Transaction } from '../domain/finance.types';
import type { FinanceDataPort } from '../ports/finance-data.port';
import type { WhatsAppIntentOutput } from '../prompts/whatsapp-assistant.prompt';
import {
  WhatsAppMessageService,
  periodRange,
  renderSummary,
} from './whatsapp-message.service';

/**
 * El modelo se sustituye por un doble que devuelve el JSON que queremos
 * probar. Asi se verifica la logica del chatbot (validacion, ramas, consultas)
 * sin gastar cuota y sin depender de que proveedor este configurado.
 */
function fakeLlm(intent: Partial<WhatsAppIntentOutput>): LlmService {
  const response: LlmResponse = {
    text: '',
    toolCalls: [],
    finishReason: 'stop',
    usage: { inputTokens: 10, outputTokens: 5, totalTokens: 15 },
    providerId: 'fake',
    model: 'fake-1',
    latencyMs: 1,
    costUsd: 0,
  };

  return {
    completeJson: () =>
      Promise.resolve({
        data: {
          type: 'unclear',
          amount: null,
          category: null,
          concept: null,
          responseText: 'ok',
          queryPeriod: null,
          ...intent,
        },
        response,
      }),
  } as unknown as LlmService;
}

const SEED: Transaction[] = [
  {
    id: '1',
    businessId: 'b1',
    date: '2026-07-14',
    description: 'Compra de harina',
    category: 'mercancia',
    amount: 700_000,
    type: 'expense',
    currency: 'COP',
    source: 'import',
    createdAt: '2026-07-14T12:00:00.000Z',
  },
  {
    id: '2',
    businessId: 'b1',
    date: '2026-07-15',
    description: 'Ventas del dia',
    category: 'ventas',
    amount: 1_500_000,
    type: 'income',
    currency: 'COP',
    source: 'import',
    createdAt: '2026-07-15T12:00:00.000Z',
  },
];

function fakeFinanceData(): FinanceDataPort & { saved: Transaction[] } {
  const saved: Transaction[] = [];
  return {
    saved,
    getSnapshot: () => Promise.reject(new Error('no usado en estas pruebas')),
    listTransactions: () => Promise.resolve(SEED),
    saveTransactions: (transactions: Transaction[]) => {
      saved.push(...transactions);
      return Promise.resolve(transactions);
    },
  };
}

function buildService(intent: Partial<WhatsAppIntentOutput>) {
  const financeData = fakeFinanceData();
  const service = new WhatsAppMessageService(fakeLlm(intent), financeData);
  return { service, financeData };
}

const BASE_REQUEST = {
  tenantId: 't1',
  businessId: 'b1',
  message: 'mensaje de prueba',
};

describe('WhatsAppMessageService', () => {
  it('registra un gasto y responde con el texto del modelo', async () => {
    const { service, financeData } = buildService({
      type: 'expense',
      amount: 8000,
      category: 'mercancia',
      concept: 'Compra de mercancía',
      responseText: '✅ Registré un gasto de $8.000 en mercancía.',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.intent.type).toBe('expense');
    expect(result.transaction?.amount).toBe(8000);
    expect(result.transaction?.category).toBe('mercancia');
    expect(result.transaction?.source).toBe('whatsapp');
    expect(result.replyText).toContain('Registré un gasto');
    expect(financeData.saved).toHaveLength(1);
  });

  it('no guarda nada si no se pidió persistir', async () => {
    const { service, financeData } = buildService({
      type: 'income',
      amount: 750,
      category: 'ventas',
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.transaction).not.toBeNull();
    expect(financeData.saved).toHaveLength(0);
  });

  it('rechaza una categoría que no corresponde al tipo', async () => {
    // "ventas" es categoría de ingreso: en un gasto no puede pasar.
    const { service } = buildService({
      type: 'expense',
      amount: 5000,
      category: 'ventas',
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transaction?.category).toBe('otros_gastos');
  });

  it('convierte montos negativos en positivos', async () => {
    const { service } = buildService({
      type: 'expense',
      amount: -3000,
      category: 'insumos',
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transaction?.amount).toBe(3000);
  });

  it('pide aclaración si el modelo dice "gasto" pero no deja monto', async () => {
    const { service, financeData } = buildService({
      type: 'expense',
      amount: null,
      category: 'insumos',
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.intent.type).toBe('unclear');
    expect(result.intent.category).toBeNull();
    expect(result.transaction).toBeNull();
    expect(result.replyText).toContain('monto');
    expect(financeData.saved).toHaveLength(0);
  });

  it('responde una consulta con las cifras reales del negocio', async () => {
    const { service } = buildService({
      type: 'query',
      queryPeriod: 'week',
      responseText: 'Dame un momento, voy a consultar tu resumen.',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.summary).not.toBeNull();
    expect(result.summary?.income).toBe(1_500_000);
    expect(result.summary?.expense).toBe(700_000);
    expect(result.summary?.balance).toBe(800_000);
    // El texto que se envía lleva los números del backend, no el "dame un momento".
    expect(result.replyText).toContain('$1.500.000');
    expect(result.replyText).not.toContain('Dame un momento');
  });

  it('respeta la confianza que reporta el modelo', async () => {
    const { service } = buildService({
      type: 'expense',
      amount: 8000,
      category: 'mercancia',
      confidence: 0.95,
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.intent.confidence).toBe(0.95);
  });

  it('deriva la confianza si el modelo no la envía o manda basura', async () => {
    // Modelo pequeño que ignora el campo: se infiere de lo que sí extrajo.
    const sinCampo = buildService({
      type: 'expense',
      amount: 8000,
      category: 'mercancia',
      concept: 'Compra de harina',
      responseText: 'ok',
      confidence: undefined,
    });
    const conConcepto = await sinCampo.service.handleMessage(BASE_REQUEST);
    expect(conConcepto.intent.confidence).toBe(0.9);

    // Fuera de rango: tampoco se acepta.
    const fueraDeRango = buildService({
      type: 'query',
      queryPeriod: 'week',
      confidence: 42,
      responseText: 'ok',
    });
    const consulta = await fueraDeRango.service.handleMessage(BASE_REQUEST);
    expect(consulta.intent.confidence).toBe(0.85);
  });

  it('baja la confianza cuando degrada el mensaje a unclear', async () => {
    const { service } = buildService({
      type: 'expense',
      amount: null,
      category: 'insumos',
      confidence: 0.99,
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.intent.type).toBe('unclear');
    expect(result.intent.confidence).toBeLessThanOrEqual(0.4);
  });

  it('trata un tipo desconocido como unclear', async () => {
    const { service } = buildService({
      type: 'transferencia' as WhatsAppIntentOutput['type'],
      amount: 1000,
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.intent.type).toBe('unclear');
    expect(result.transaction).toBeNull();
  });
});

describe('periodRange', () => {
  // Miercoles 15 de julio de 2026.
  const wednesday = new Date(2026, 6, 15, 10, 0, 0);

  it('day: solo hoy', () => {
    expect(periodRange('day', wednesday)).toEqual({
      from: '2026-07-15',
      to: '2026-07-15',
    });
  });

  it('week: desde el lunes de la semana en curso', () => {
    expect(periodRange('week', wednesday)).toEqual({
      from: '2026-07-13',
      to: '2026-07-15',
    });
  });

  it('week: el domingo cierra la semana que arrancó el lunes', () => {
    const sunday = new Date(2026, 6, 19, 10, 0, 0);
    expect(periodRange('week', sunday)).toEqual({
      from: '2026-07-13',
      to: '2026-07-19',
    });
  });

  it('month: desde el primero del mes', () => {
    expect(periodRange('month', wednesday)).toEqual({
      from: '2026-07-01',
      to: '2026-07-15',
    });
  });
});

describe('renderSummary', () => {
  const base: PeriodSummary = {
    period: 'week',
    from: '2026-07-13',
    to: '2026-07-15',
    currency: 'COP',
    income: 1_500_000,
    expense: 900_000,
    investment: 0,
    balance: 600_000,
    transactionCount: 4,
    byCategory: [
      { category: 'mercancia', type: 'expense', total: 700_000 },
      { category: 'ventas', type: 'income', total: 1_500_000 },
    ],
  };

  it('incluye las cifras reales del periodo', () => {
    const text = renderSummary(base);
    expect(text).toContain('esta semana');
    expect(text).toContain('$1.500.000');
    expect(text).toContain('$900.000');
    expect(text).toContain('Mercancía');
  });

  it('omite inversiones cuando no hubo', () => {
    expect(renderSummary(base)).not.toContain('Inversiones');
    expect(renderSummary({ ...base, investment: 500_000 })).toContain(
      'Inversiones',
    );
  });

  it('avisa cuando no hay movimientos, sin inventar cifras', () => {
    const text = renderSummary({ ...base, transactionCount: 0 });
    expect(text).toContain('Todavía no tienes movimientos');
    expect(text).not.toContain('$');
  });

  it('no usa markdown: el texto va a WhatsApp', () => {
    const text = renderSummary(base);
    expect(text).not.toMatch(/[*_`#]/);
  });
});

describe('WhatsAppMessageService · contexto de la conversación', () => {
  /** Captura lo que se le manda al modelo, para verificar prompt e historial. */
  function espiarLlm(intent: Partial<WhatsAppIntentOutput>) {
    const visto: { system?: string; messages?: unknown[] } = {};

    const llm = {
      completeJson: (req: { system?: string; messages?: unknown[] }) => {
        visto.system = req.system;
        visto.messages = req.messages;
        return Promise.resolve({
          data: {
            type: 'unclear',
            amount: null,
            category: null,
            concept: null,
            responseText: 'ok',
            queryPeriod: null,
            confidence: 0.9,
            ...intent,
          },
          response: {
            text: '',
            toolCalls: [],
            finishReason: 'stop',
            usage: { inputTokens: 1, outputTokens: 1, totalTokens: 2 },
            providerId: 'fake',
            model: 'fake-1',
            latencyMs: 1,
            costUsd: 0,
          },
        });
      },
    } as unknown as LlmService;

    return { llm, visto };
  }

  it('le pasa al modelo los turnos anteriores', async () => {
    // Sin esto, Luka preguntaba el monto, el usuario lo respondía suelto y
    // volvía a preguntar lo mismo: cada mensaje llegaba sin pasado.
    const { llm, visto } = espiarLlm({ type: 'unclear' });
    const service = new WhatsAppMessageService(llm, fakeFinanceData());

    await service.handleMessage({
      ...BASE_REQUEST,
      message: 'Mejoras en local',
      history: [
        { role: 'user', content: 'Invertí 1530000' },
        { role: 'assistant', content: '¿En qué invertiste los $1.530.000?' },
      ],
    });

    expect(visto.messages).toEqual([
      { role: 'user', content: 'Invertí 1530000' },
      { role: 'assistant', content: '¿En qué invertiste los $1.530.000?' },
      { role: 'user', content: 'Mejoras en local' },
    ]);
  });

  it('le dice al modelo qué plan tiene el negocio', async () => {
    const { llm, visto } = espiarLlm({ type: 'unclear' });
    const service = new WhatsAppMessageService(llm, fakeFinanceData());

    await service.handleMessage({
      ...BASE_REQUEST,
      planName: 'Asistente',
      planIsFree: true,
    });

    expect(visto.system).toContain('Plan contratado: Asistente');
    expect(visto.system).toContain('gratuito');
  });

  it('acepta la intención de función de pago sin degradarla', async () => {
    const { llm } = espiarLlm({
      type: 'premium',
      concept: 'reporte por producto',
      responseText: 'Eso está en los planes pagos.',
    });
    const service = new WhatsAppMessageService(llm, fakeFinanceData());

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.intent.type).toBe('premium');
    expect(result.transaction).toBeNull();
  });
});

describe('WhatsAppMessageService · búsqueda por concepto', () => {
  it('busca movimientos por texto en vez de devolver el resumen', async () => {
    // "¿Qué día compré harina?" antes caía en el resumen del mes y el usuario
    // recibía los mismos totales sin importar qué hubiera preguntado.
    const { service } = buildService({
      type: 'query',
      concept: 'harina',
      responseText: 'Déjame buscar.',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.summary).toBeNull();
    expect(result.replyText).toContain('Compra de harina');
    expect(result.replyText).toContain('$700.000');
  });

  it('encuentra sin importar tildes ni mayúsculas', async () => {
    const { service } = buildService({
      type: 'query',
      concept: 'HARÍNA',
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.replyText).toContain('Compra de harina');
  });

  it('lo dice claro cuando no encuentra nada, sin inventar', async () => {
    const { service } = buildService({
      type: 'query',
      concept: 'jabones',
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.replyText).toContain('No encontré movimientos');
    expect(result.replyText).toContain('jabones');
    expect(result.replyText).not.toContain('$');
  });

  it('sin concepto sigue devolviendo el resumen del periodo', async () => {
    const { service } = buildService({
      type: 'query',
      queryPeriod: 'week',
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.summary).not.toBeNull();
  });
});
