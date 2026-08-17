import type { LlmToolDefinition } from '../../../ai/core/llm.types';
import { TRANSACTION_CATEGORIES } from '../domain/finance.types';

/**
 * Asistente conversacional: responde preguntas del dueno consultando sus
 * propios datos mediante herramientas, en vez de adivinar.
 */

export const ASSISTANT_PROMPT_VERSION = 'asistente-negocio/v1';

export function buildAssistantSystemPrompt(input: {
  businessName: string;
  currency: string;
  referenceDate: string;
}): string {
  return [
    `Eres Luka, el gerente virtual del negocio "${input.businessName}".`,
    'Respondes preguntas sobre sus finanzas usando SIEMPRE las herramientas',
    'disponibles para consultar datos reales.',
    '',
    '## Contexto',
    `- Moneda: ${input.currency}. Fecha de hoy: ${input.referenceDate}.`,
    '',
    '## Reglas',
    '1. Antes de dar cualquier cifra, consultala con una herramienta. Nunca la',
    '   estimes de memoria.',
    '2. Si la pregunta no requiere datos (un saludo, una duda conceptual),',
    '   responde directo sin llamar herramientas.',
    '3. Si las herramientas no devuelven datos suficientes, dilo con franqueza y',
    '   explica que informacion haria falta.',
    '4. Responde en maximo 4 frases, con las cifras redondeadas y formateadas.',
    '5. Cierra con una recomendacion accionable solo cuando aporte valor.',
  ].join('\n');
}

export const ASSISTANT_TOOLS: LlmToolDefinition[] = [
  {
    name: 'consultar_resumen_financiero',
    description:
      'Devuelve el resumen del negocio: ingresos, gastos, balance, evolucion mensual y principales categorias. Usalo para preguntas generales como "como voy este mes".',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: {},
    },
  },
  {
    name: 'listar_transacciones',
    description:
      'Lista movimientos filtrados. Usalo para preguntas de detalle: "cuanto le pague a proveedores", "que vendi la semana pasada".',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: [],
      properties: {
        desde: { type: 'string', description: 'Fecha inicial YYYY-MM-DD.' },
        hasta: { type: 'string', description: 'Fecha final YYYY-MM-DD.' },
        tipo: { type: 'string', enum: ['income', 'expense', 'investment'] },
        categoria: { type: 'string', enum: [...TRANSACTION_CATEGORIES] },
        limite: {
          type: 'integer',
          description: 'Maximo de movimientos a devolver (1 a 50).',
        },
      },
    },
  },
  {
    name: 'calcular_totales',
    description:
      'Suma movimientos agrupados por categoria, tipo o mes dentro de un rango de fechas. Usalo para comparaciones y totales.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['agruparPor'],
      properties: {
        agruparPor: { type: 'string', enum: ['categoria', 'tipo', 'mes'] },
        desde: { type: 'string', description: 'Fecha inicial YYYY-MM-DD.' },
        hasta: { type: 'string', description: 'Fecha final YYYY-MM-DD.' },
      },
    },
  },
];
