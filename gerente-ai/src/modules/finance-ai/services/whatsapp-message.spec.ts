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
