import type { LlmResponse } from '../../../ai/core/llm.types';
import type { LlmService } from '../../../ai/services/llm.service';
import type { PeriodSummary, Transaction } from '../domain/finance.types';
import type {
  FinanceDataPort,
  ProfitDistribution,
} from '../ports/finance-data.port';
import type { WhatsAppIntentOutput } from '../prompts/whatsapp-assistant.prompt';
import {
  WhatsAppMessageService,
  checkBreakdown,
  periodRange,
  renderMovementList,
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
          movements: [],
          declaredTotal: null,
          profitShares: [],
          concept: null,
          queryKind: null,
          queryPeriod: null,
          responseText: 'ok',
          ...intent,
        },
        response,
      }),
  } as unknown as LlmService;
}

/** Atajo para no repetir los campos que casi nunca cambian en las pruebas. */
function movimiento(
  parcial: Partial<NonNullable<WhatsAppIntentOutput['movements']>[number]>,
): NonNullable<WhatsAppIntentOutput['movements']>[number] {
  return {
    type: 'expense',
    amount: 1000,
    category: 'otros_gastos',
    concept: null,
    paymentMethod: null,
    isCredit: false,
    customerName: null,
    ...parcial,
  };
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

interface FakeFinanceData extends FinanceDataPort {
  saved: Transaction[];
  replaced: { id: string; parts: Transaction[] }[];
  distributions: ProfitDistribution[];
}

function fakeFinanceData(rows: Transaction[] = SEED): FakeFinanceData {
  const saved: Transaction[] = [];
  const replaced: { id: string; parts: Transaction[] }[] = [];
  const distributions: ProfitDistribution[] = [];

  return {
    saved,
    replaced,
    distributions,
    getSnapshot: () => Promise.reject(new Error('no usado en estas pruebas')),
    listTransactions: () => Promise.resolve(rows),
    saveTransactions: (transactions: Transaction[]) => {
      saved.push(...transactions);
      return Promise.resolve(transactions);
    },
    replaceTransaction: (
      _businessId: string,
      transactionId: string,
      parts: Transaction[],
    ) => {
      replaced.push({ id: transactionId, parts });
      return Promise.resolve(parts);
    },
    saveProfitDistribution: (distribution: ProfitDistribution) => {
      distributions.push(distribution);
      return Promise.resolve(distribution);
    },
  };
}

function buildService(
  intent: Partial<WhatsAppIntentOutput>,
  rows: Transaction[] = SEED,
) {
  const financeData = fakeFinanceData(rows);
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
      movements: [
        movimiento({
          amount: 8000,
          category: 'mercancia',
          concept: 'Compra de mercancía',
        }),
      ],
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
      movements: [
        movimiento({ type: 'income', amount: 750, category: 'ventas' }),
      ],
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
      movements: [movimiento({ amount: 5000, category: 'ventas' })],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transaction?.category).toBe('otros_gastos');
  });

  it('convierte montos negativos en positivos', async () => {
    const { service } = buildService({
      type: 'expense',
      movements: [movimiento({ amount: -3000, category: 'insumos' })],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transaction?.amount).toBe(3000);
  });

  it('pide aclaración si el modelo dice "gasto" pero no deja monto', async () => {
    const { service, financeData } = buildService({
      type: 'expense',
      movements: [movimiento({ amount: null, category: 'insumos' })],
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
      movements: [movimiento({ amount: 8000, category: 'mercancia' })],
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
      movements: [
        movimiento({
          amount: 8000,
          category: 'mercancia',
          concept: 'Compra de harina',
        }),
      ],
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
      movements: [movimiento({ amount: null, category: 'insumos' })],
      confidence: 0.99,
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.intent.type).toBe('unclear');
    expect(result.intent.confidence).toBeLessThanOrEqual(0.4);
  });

  it('trata un tipo desconocido como unclear', async () => {
    const { service } = buildService({
      type: 'transferencia',
      movements: [movimiento({ amount: 1000 })],
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
    pendingCollection: 0,
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
            movements: [],
            declaredTotal: null,
            profitShares: [],
            concept: null,
            queryKind: null,
            queryPeriod: null,
            responseText: 'ok',
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

// ===========================================================================
// Error 2 - varios movimientos en un mismo mensaje
// ===========================================================================

describe('WhatsAppMessageService - varios movimientos', () => {
  it('registra un movimiento por cada gasto, no la suma', async () => {
    // "Pague 50.000 de transporte y 30.000 de almuerzo" terminaba como un solo
    // gasto de 80.000, y despues no habia forma de consultar uno por separado.
    const { service, financeData } = buildService({
      type: 'expense',
      movements: [
        movimiento({
          amount: 50_000,
          category: 'transporte',
          concept: 'Transporte',
        }),
        movimiento({
          amount: 30_000,
          category: 'otros_gastos',
          concept: 'Almuerzo',
        }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions.map((row) => row.amount)).toEqual([
      50_000, 30_000,
    ]);
    expect(result.transactions.map((row) => row.description)).toEqual([
      'Transporte',
      'Almuerzo',
    ]);
    expect(financeData.saved).toHaveLength(2);
  });

  it('agrupa los movimientos del mismo mensaje con un groupId comun', async () => {
    const { service } = buildService({
      type: 'expense',
      movements: [
        movimiento({ amount: 50_000, concept: 'Transporte' }),
        movimiento({ amount: 30_000, concept: 'Almuerzo' }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    const grupos = new Set(result.transactions.map((row) => row.groupId));

    expect(grupos.size).toBe(1);
    expect([...grupos][0]).toBeTruthy();
  });

  it('un solo movimiento no se agrupa: no hay nada que agrupar', async () => {
    const { service } = buildService({
      type: 'expense',
      movements: [movimiento({ amount: 50_000 })],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transactions[0].groupId).toBeNull();
  });

  it('el texto de respuesta detalla cada movimiento con su monto', async () => {
    const { service } = buildService({
      type: 'expense',
      movements: [
        movimiento({ amount: 50_000, concept: 'Transporte' }),
        movimiento({ amount: 30_000, concept: 'Almuerzo' }),
      ],
      responseText: 'Registre todo.',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.replyText).toContain('$50.000');
    expect(result.replyText).toContain('$30.000');
    expect(result.replyText).toContain('$80.000');
  });

  it('descarta los movimientos sin monto y conserva los validos', async () => {
    const { service } = buildService({
      type: 'expense',
      movements: [
        movimiento({ amount: 50_000, concept: 'Transporte' }),
        movimiento({ amount: null, concept: 'Algo sin precio' }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transactions).toHaveLength(1);
    expect(result.transactions[0].amount).toBe(50_000);
  });
});

// ===========================================================================
// Error 1 - total general, desglose y validacion de la suma
// ===========================================================================

describe('checkBreakdown', () => {
  it('acepta un desglose que cuadra con el total', () => {
    expect(
      checkBreakdown(2_000_000, [
        { amount: 1_500_000 },
        { amount: 200_000 },
        { amount: 300_000 },
      ]),
    ).toBeNull();
  });

  it('detecta cuando faltan pesos por asignar', () => {
    const descuadre = checkBreakdown(2_000_000, [
      { amount: 1_500_000 },
      { amount: 200_000 },
    ]);

    expect(descuadre).not.toBeNull();
    expect(descuadre?.sum).toBe(1_700_000);
    expect(descuadre?.difference).toBe(300_000);
  });

  it('detecta cuando las partes se pasan del total', () => {
    const descuadre = checkBreakdown(1_000_000, [
      { amount: 800_000 },
      { amount: 500_000 },
    ]);
    expect(descuadre?.difference).toBe(-300_000);
  });

  it('sin total declarado no hay nada que verificar', () => {
    expect(checkBreakdown(null, [{ amount: 100 }, { amount: 200 }])).toBeNull();
  });

  it('tolera un peso de diferencia por redondeos', () => {
    expect(
      checkBreakdown(1_000_000, [{ amount: 999_999.5 }, { amount: 0.5 }]),
    ).toBeNull();
  });
});

describe('WhatsAppMessageService - total con desglose', () => {
  it('registra las partes cuando el desglose cuadra con el total', async () => {
    const { service, financeData } = buildService({
      type: 'income',
      declaredTotal: 2_000_000,
      movements: [
        movimiento({
          type: 'income',
          amount: 1_500_000,
          category: 'ventas',
          concept: 'Ventas en efectivo',
          paymentMethod: 'efectivo',
        }),
        movimiento({
          type: 'income',
          amount: 500_000,
          category: 'ventas',
          concept: 'Ventas con tarjeta',
          paymentMethod: 'tarjeta',
        }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].paymentMethod).toBe('efectivo');
    expect(result.transactions[1].paymentMethod).toBe('tarjeta');
    expect(financeData.saved).toHaveLength(2);
  });

  it('NO registra nada cuando el desglose no cuadra: pregunta', async () => {
    // Registrar cifras que no suman es peor que no registrar: el error queda
    // escondido dentro de la contabilidad.
    const { service, financeData } = buildService({
      type: 'income',
      declaredTotal: 2_000_000,
      movements: [
        movimiento({ type: 'income', amount: 1_500_000, category: 'ventas' }),
        movimiento({ type: 'income', amount: 200_000, category: 'ventas' }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.intent.type).toBe('unclear');
    expect(result.transactions).toHaveLength(0);
    expect(financeData.saved).toHaveLength(0);
    expect(result.replyText).toContain('$2.000.000');
    expect(result.replyText).toContain('$1.700.000');
    expect(result.replyText).toContain('$300.000');
  });
});

describe('WhatsAppMessageService - desglose de un total ya registrado', () => {
  /** El total que el usuario registro antes, listo para ser desglosado. */
  const TOTAL_PREVIO: Transaction[] = [
    {
      id: 'venta-total',
      businessId: 'b1',
      date: '2026-07-15',
      description: 'Ventas del dia',
      category: 'ventas',
      amount: 2_000_000,
      type: 'income',
      currency: 'COP',
      source: 'whatsapp',
      createdAt: '2026-07-15T12:00:00.000Z',
      groupId: null,
    },
  ];

  const PARTES = [
    movimiento({
      type: 'income',
      amount: 1_500_000,
      category: 'ventas',
      concept: 'Ventas en efectivo',
      paymentMethod: 'efectivo',
    }),
    movimiento({
      type: 'income',
      amount: 500_000,
      category: 'ventas',
      concept: 'Ventas con tarjeta',
      paymentMethod: 'tarjeta',
    }),
  ];

  it('reemplaza el total por sus partes en vez de duplicar el dinero', async () => {
    const { service, financeData } = buildService(
      { type: 'breakdown', movements: PARTES, responseText: 'ok' },
      TOTAL_PREVIO,
    );

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(financeData.replaced).toHaveLength(1);
    expect(financeData.replaced[0].id).toBe('venta-total');
    expect(financeData.replaced[0].parts).toHaveLength(2);
    // Nada se guarda por la via normal: seria plata contada dos veces.
    expect(financeData.saved).toHaveLength(0);
    expect(result.replyText).toContain('$2.000.000');
  });

  it('las partes heredan la relacion con el total original', async () => {
    const conGrupo: Transaction[] = [{ ...TOTAL_PREVIO[0], groupId: null }];
    const { service, financeData } = buildService(
      { type: 'breakdown', movements: PARTES, responseText: 'ok' },
      conGrupo,
    );

    await service.handleMessage({ ...BASE_REQUEST, persist: true });
    const grupos = new Set(
      financeData.replaced[0].parts.map((row) => row.groupId),
    );

    expect(grupos.size).toBe(1);
    expect([...grupos][0]).toBeTruthy();
  });

  it('si no encuentra el total previo, registra las partes como nuevas', async () => {
    // El usuario puede desglosar algo que nunca registro: mejor guardarlo que
    // perderlo.
    const { service, financeData } = buildService(
      { type: 'breakdown', movements: PARTES, responseText: 'ok' },
      [],
    );

    await service.handleMessage({ ...BASE_REQUEST, persist: true });

    expect(financeData.replaced).toHaveLength(0);
    expect(financeData.saved).toHaveLength(2);
  });

  it('no toca un movimiento que ya estaba desglosado', async () => {
    const yaDesglosado: Transaction[] = [
      { ...TOTAL_PREVIO[0], groupId: 'grupo-existente' },
    ];
    const { service, financeData } = buildService(
      { type: 'breakdown', movements: PARTES, responseText: 'ok' },
      yaDesglosado,
    );

    await service.handleMessage({ ...BASE_REQUEST, persist: true });

    expect(financeData.replaced).toHaveLength(0);
    expect(financeData.saved).toHaveLength(2);
  });
});

// ===========================================================================
// Error 3 - fiados
// ===========================================================================

describe('WhatsAppMessageService - fiados', () => {
  it('marca la venta como fiada y guarda a quien se le fio', async () => {
    const { service, financeData } = buildService({
      type: 'income',
      movements: [
        movimiento({
          type: 'income',
          amount: 50_000,
          category: 'ventas',
          concept: 'Venta fiada a dona Rosa',
          isCredit: true,
          customerName: 'Dona Rosa',
        }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.transactions[0].isCredit).toBe(true);
    expect(result.transactions[0].customerName).toBe('Dona Rosa');
    expect(financeData.saved[0].isCredit).toBe(true);
  });

  it('una venta normal no queda marcada como fiada', async () => {
    const { service } = buildService({
      type: 'income',
      movements: [
        movimiento({ type: 'income', amount: 50_000, category: 'ventas' }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transactions[0].isCredit).toBe(false);
  });

  it('el resumen separa lo fiado de lo cobrado', async () => {
    // Lo fiado suma como ingreso (la venta ocurrio) pero todavia no es caja.
    const conFiado: Transaction[] = [
      {
        id: 'f1',
        businessId: 'b1',
        date: '2026-07-15',
        description: 'Venta fiada',
        category: 'ventas',
        amount: 300_000,
        type: 'income',
        currency: 'COP',
        source: 'whatsapp',
        createdAt: '2026-07-15T12:00:00.000Z',
        isCredit: true,
      },
      {
        id: 'f2',
        businessId: 'b1',
        date: '2026-07-15',
        description: 'Venta de contado',
        category: 'ventas',
        amount: 700_000,
        type: 'income',
        currency: 'COP',
        source: 'whatsapp',
        createdAt: '2026-07-15T12:00:00.000Z',
        isCredit: false,
      },
    ];

    const { service } = buildService(
      {
        type: 'query',
        queryKind: 'summary',
        queryPeriod: 'month',
        responseText: 'ok',
      },
      conFiado,
    );

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.summary?.income).toBe(1_000_000);
    expect(result.summary?.pendingCollection).toBe(300_000);
    expect(result.replyText).toContain('fiado por cobrar');
  });
});

// ===========================================================================
// Error 4 - buscar ingresos por concepto, igual que los gastos
// ===========================================================================

describe('WhatsAppMessageService - busqueda de ingresos', () => {
  const MOVIMIENTOS: Transaction[] = [
    {
      id: 'g1',
      businessId: 'b1',
      date: '2026-07-14',
      description: 'Compra en Postobon',
      category: 'mercancia',
      amount: 200_000,
      type: 'expense',
      currency: 'COP',
      source: 'whatsapp',
      createdAt: '2026-07-14T12:00:00.000Z',
    },
    {
      id: 'i1',
      businessId: 'b1',
      date: '2026-07-15',
      description: 'Ganancia por ventas de gaseosa',
      category: 'ventas',
      amount: 3_000_000,
      type: 'income',
      currency: 'COP',
      source: 'whatsapp',
      createdAt: '2026-07-15T12:00:00.000Z',
    },
  ];

  it('encuentra un ingreso por su concepto', async () => {
    // Antes solo funcionaba con gastos: las ventas se guardaban sin concepto.
    const { service } = buildService(
      {
        type: 'query',
        queryKind: 'search',
        concept: 'gaseosa',
        responseText: 'ok',
      },
      MOVIMIENTOS,
    );

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.replyText).toContain('Ganancia por ventas de gaseosa');
    expect(result.replyText).toContain('$3.000.000');
    expect(result.replyText).toContain('+');
  });

  it('sigue encontrando gastos por su concepto', async () => {
    const { service } = buildService(
      {
        type: 'query',
        queryKind: 'search',
        concept: 'Postobon',
        responseText: 'ok',
      },
      MOVIMIENTOS,
    );

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.replyText).toContain('Compra en Postobon');
    expect(result.replyText).toContain('$200.000');
  });
});

// ===========================================================================
// Error 5 - listar los movimientos, no solo contarlos
// ===========================================================================

describe('WhatsAppMessageService - listado de movimientos', () => {
  it('devuelve el detalle de cada movimiento cuando lo piden', async () => {
    // El resumen decia "tienes 2 movimientos" y al preguntar cuales eran
    // devolvia el mismo resumen: un callejon sin salida.
    const { service } = buildService({
      type: 'query',
      queryKind: 'list',
      queryPeriod: 'month',
      responseText: 'Te los detallo.',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.replyText).toContain('Compra de harina');
    expect(result.replyText).toContain('$700.000');
    expect(result.replyText).toContain('Ventas del dia');
    expect(result.replyText).toContain('$1.500.000');
  });

  it('el resumen le dice al usuario que puede pedir el detalle', async () => {
    const { service } = buildService({
      type: 'query',
      queryKind: 'summary',
      queryPeriod: 'month',
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.replyText).toContain('movimientos');
    expect(result.replyText.toLowerCase()).toContain('uno por uno');
  });
});

describe('renderMovementList', () => {
  const FILAS: Transaction[] = [
    {
      id: '1',
      businessId: 'b1',
      date: '2026-07-15',
      description: 'Compra de harina',
      category: 'mercancia',
      amount: 700_000,
      type: 'expense',
      currency: 'COP',
      source: 'whatsapp',
      createdAt: '2026-07-15T12:00:00.000Z',
      paymentMethod: 'efectivo',
    },
    {
      id: '2',
      businessId: 'b1',
      date: '2026-07-15',
      description: 'Venta fiada',
      category: 'ventas',
      amount: 300_000,
      type: 'income',
      currency: 'COP',
      source: 'whatsapp',
      createdAt: '2026-07-15T12:00:00.000Z',
      isCredit: true,
    },
  ];

  it('muestra tipo, concepto, valor y fecha de cada movimiento', () => {
    const texto = renderMovementList(FILAS, 'month', 'COP');

    expect(texto).toContain('Compra de harina');
    expect(texto).toContain('-$700.000');
    expect(texto).toContain('Venta fiada');
    expect(texto).toContain('+$300.000');
    // El formato corto local incluye "de": "15 de jul".
    expect(texto).toContain('15 de jul');
  });

  it('anota la forma de pago y si fue fiado', () => {
    const texto = renderMovementList(FILAS, 'month', 'COP');
    expect(texto).toContain('Efectivo');
    expect(texto).toContain('fiado');
  });

  it('avisa cuando no hay movimientos, sin inventar', () => {
    const texto = renderMovementList([], 'week', 'COP');
    expect(texto).toContain('No tienes movimientos');
    expect(texto).not.toContain('$');
  });

  it('no usa markdown: el texto va a WhatsApp', () => {
    expect(renderMovementList(FILAS, 'month', 'COP')).not.toMatch(/[*_`#]/);
  });
});

// ===========================================================================
// Error 1 - reparto de utilidades
// ===========================================================================

describe('WhatsAppMessageService - reparto de utilidades', () => {
  it('calcula el monto de cada quien sobre la utilidad real', async () => {
    // SEED deja un balance de 800.000 (1.500.000 - 700.000).
    const { service, financeData } = buildService({
      type: 'profit_share',
      profitShares: [
        { beneficiary: 'dueno', name: null, percentage: 60 },
        { beneficiary: 'trabajador', name: null, percentage: 40 },
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.profitDistribution?.total).toBe(800_000);
    expect(result.profitDistribution?.shares[0].amount).toBe(480_000);
    expect(result.profitDistribution?.shares[1].amount).toBe(320_000);
    expect(financeData.distributions).toHaveLength(1);
    expect(result.replyText).toContain('$480.000');
  });

  it('pide los porcentajes cuando no los dan', async () => {
    const { service, financeData } = buildService({
      type: 'profit_share',
      profitShares: [],
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.intent.type).toBe('unclear');
    expect(result.replyText).toContain('porcentaje');
    expect(financeData.distributions).toHaveLength(0);
  });

  it('rechaza porcentajes que no suman 100', async () => {
    const { service, financeData } = buildService({
      type: 'profit_share',
      profitShares: [
        { beneficiary: 'dueno', name: null, percentage: 60 },
        { beneficiary: 'trabajador', name: null, percentage: 30 },
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.replyText).toContain('100%');
    expect(financeData.distributions).toHaveLength(0);
  });

  it('no reparte cuando no hay utilidades', async () => {
    const enPerdida: Transaction[] = [
      {
        id: 'p1',
        businessId: 'b1',
        date: '2026-07-15',
        description: 'Compra grande',
        category: 'mercancia',
        amount: 900_000,
        type: 'expense',
        currency: 'COP',
        source: 'whatsapp',
        createdAt: '2026-07-15T12:00:00.000Z',
      },
    ];

    const { service, financeData } = buildService(
      {
        type: 'profit_share',
        profitShares: [{ beneficiary: 'dueno', name: null, percentage: 100 }],
        responseText: 'ok',
      },
      enPerdida,
    );

    const result = await service.handleMessage({
      ...BASE_REQUEST,
      persist: true,
    });

    expect(result.replyText).toContain('no hay utilidades');
    expect(financeData.distributions).toHaveLength(0);
  });
});

describe('WhatsAppMessageService - el desglose encuentra el total aunque venga de la base', () => {
  it('no exige que el origen sea whatsapp', async () => {
    // El adaptador de Prisma devuelve source "manual" para todo, porque la
    // base no guarda el origen. Si el buscador exigiera "whatsapp", en
    // produccion nunca encontraria el total y duplicaria el dinero.
    const totalDesdeLaBase: Transaction[] = [
      {
        id: 'venta-total',
        businessId: 'b1',
        date: '2026-07-15',
        description: 'Ventas del dia',
        category: 'ventas',
        amount: 900_000,
        type: 'income',
        currency: 'COP',
        source: 'manual',
        createdAt: '2026-07-15T12:00:00.000Z',
        groupId: null,
      },
    ];

    const { service, financeData } = buildService(
      {
        type: 'breakdown',
        movements: [
          movimiento({
            type: 'income',
            amount: 600_000,
            category: 'ventas',
            paymentMethod: 'efectivo',
          }),
          movimiento({
            type: 'income',
            amount: 300_000,
            category: 'ventas',
            paymentMethod: 'tarjeta',
          }),
        ],
        responseText: 'ok',
      },
      totalDesdeLaBase,
    );

    await service.handleMessage({ ...BASE_REQUEST, persist: true });

    expect(financeData.replaced).toHaveLength(1);
    expect(financeData.saved).toHaveLength(0);
  });
});

// ===========================================================================
// La fecha del movimiento es la de Colombia, no la del contenedor
// ===========================================================================

describe('WhatsAppMessageService - fecha colombiana', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('registra con el dia colombiano aunque en UTC ya sea manana', async () => {
    // 1 de septiembre, 7:53 p.m. en Colombia = 2 de septiembre 00:53 UTC.
    // La confirmacion decia "2 de sept" mientras el movimiento quedaba
    // guardado el 1: la fecha se calculaba con toISOString(), que da UTC.
    jest.useFakeTimers().setSystemTime(new Date('2026-09-02T00:53:00.000Z'));

    const { service } = buildService({
      type: 'expense',
      movements: [
        movimiento({
          amount: 50_000,
          category: 'transporte',
          concept: 'Transporte',
        }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.transactions[0].date).toBe('2026-09-01');
  });

  it('el texto de confirmacion muestra esa misma fecha', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-02T00:53:00.000Z'));

    const { service } = buildService({
      type: 'expense',
      movements: [
        movimiento({ amount: 50_000, concept: 'Transporte' }),
        movimiento({ amount: 30_000, concept: 'Almuerzo' }),
      ],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);

    expect(result.replyText).toContain('1 de sept');
    expect(result.replyText).not.toContain('2 de sept');
  });

  it('antes de las 7 p.m. no hay diferencia', async () => {
    // Mediodia en Colombia: el dia UTC y el colombiano coinciden.
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T17:00:00.000Z'));

    const { service } = buildService({
      type: 'expense',
      movements: [movimiento({ amount: 50_000 })],
      responseText: 'ok',
    });

    const result = await service.handleMessage(BASE_REQUEST);
    expect(result.transactions[0].date).toBe('2026-09-01');
  });
});
