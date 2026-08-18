import type { JsonSchema } from '../../../ai/core/llm.types';
import {
  CATEGORY_LABELS,
  type BusinessSnapshot,
} from '../domain/finance.types';

/**
 * Prompt y esquema de las "Recomendaciones de IA" que ve el cliente en el
 * panel: alertas y oportunidades derivadas de sus propios numeros.
 */

export const INSIGHTS_PROMPT_VERSION = 'insights-negocio/v1';

export interface InsightsModelOutput {
  insights: {
    tipo: 'warning' | 'success' | 'info';
    titulo: string;
    cuerpo: string;
    accion: string;
    prioridad: number;
  }[];
}

export const INSIGHTS_SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['insights'],
  properties: {
    insights: {
      type: 'array',
      description: 'Entre 2 y 5 hallazgos, ordenados del mas urgente al menos.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['tipo', 'titulo', 'cuerpo', 'accion', 'prioridad'],
        properties: {
          tipo: {
            type: 'string',
            enum: ['warning', 'success', 'info'],
            description:
              'warning: riesgo o gasto que se disparo. success: resultado positivo. info: dato util.',
          },
          titulo: {
            type: 'string',
            description: 'Titular de maximo 60 caracteres, con la cifra clave.',
          },
          cuerpo: {
            type: 'string',
            description:
              'Dos o tres frases explicando el hallazgo con cifras concretas del negocio.',
          },
          accion: {
            type: 'string',
            description:
              'Una accion concreta que el dueno puede ejecutar esta semana.',
          },
          prioridad: {
            type: 'integer',
            description: '1 = urgente, 5 = informativo.',
            minimum: 1,
            maximum: 5,
          },
        },
      },
    },
  },
};

export function buildInsightsSystemPrompt(currency: string): string {
  return [
    'Eres un gerente financiero con 20 anos de experiencia asesorando pymes',
    'colombianas. Analizas las cifras reales de un negocio y entregas hallazgos',
    'accionables, no generalidades.',
    '',
    '## Reglas',
    `1. Todas las cifras que menciones deben salir de los datos entregados, en ${currency}.`,
    '2. Nunca inventes numeros ni tendencias que los datos no muestren.',
    '3. Cada hallazgo debe poder ejecutarse esta semana con los recursos del negocio.',
    '4. Prohibido el consejo generico ("controla tus gastos"): di que gasto, cuanto',
    '   subio y que hacer con el.',
    '5. Si los datos son insuficientes para una conclusion, dilo en un insight de',
    '   tipo "info" en vez de especular.',
    '6. Escribe en espanol claro, sin jerga contable innecesaria, tuteando al dueno.',
  ].join('\n');
}

/**
 * Serializa el negocio para el modelo. Es texto compacto y no JSON crudo
 * porque los modelos pequenos leen mucho mejor una tabla legible.
 */
export function buildInsightsUserPrompt(snapshot: BusinessSnapshot): string {
  const money = (value: number) =>
    `${snapshot.currency} ${Math.round(value).toLocaleString('es-CO')}`;

  const lines: string[] = [
    `Negocio: ${snapshot.businessName}`,
    `Periodo analizado: ${snapshot.periodStart} a ${snapshot.periodEnd}`,
    `Ingresos totales: ${money(snapshot.totalIncome)}`,
    `Gastos totales: ${money(snapshot.totalExpense)}`,
    `Inversiones totales: ${money(snapshot.totalInvestment)}`,
    `Balance: ${money(snapshot.balance)}`,
    '',
    'Evolucion mensual (mes | ingresos | gastos | inversiones):',
  ];

  for (const month of snapshot.monthly) {
    lines.push(
      `- ${month.month} | ${money(month.income)} | ${money(month.expense)} | ${money(month.investment)}`,
    );
  }

  lines.push('', 'Principales categorias (categoria | tipo | total):');
  for (const category of snapshot.topCategories) {
    lines.push(
      `- ${CATEGORY_LABELS[category.category]} | ${category.type} | ${money(category.total)}`,
    );
  }

  lines.push(
    '',
    'Movimientos recientes (fecha | concepto | categoria | tipo | monto):',
  );
  for (const transaction of snapshot.recentTransactions) {
    lines.push(
      `- ${transaction.date} | ${transaction.description} | ${CATEGORY_LABELS[transaction.category]} | ${transaction.type} | ${money(transaction.amount)}`,
    );
  }

  lines.push(
    '',
    'Analiza estos datos y entrega los hallazgos mas relevantes para el dueno.',
  );

  return lines.join('\n');
}
