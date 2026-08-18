import { NestFactory } from '@nestjs/core';

import { AppModule } from '../app.module';
import { LlmService } from '../ai/services/llm.service';
import { AiUsageService } from '../ai/usage/usage.service';
import { AssistantService } from '../modules/finance-ai/services/assistant.service';
import { InsightsService } from '../modules/finance-ai/services/insights.service';
import { WhatsAppMessageService } from '../modules/finance-ai/services/whatsapp-message.service';

/**
 * Prueba de humo de la capa de IA: `npm run ai:smoke`.
 *
 * Ejecuta los tres casos de uso contra el proveedor configurado en .env.
 * Sirve para validar una llave nueva y, sobre todo, para comparar proveedores:
 * corre el mismo guion con AI_PROVIDER=groq, luego =gemini, luego =anthropic y
 * contrasta calidad, latencia y costo con datos, no con intuicion.
 */

const TENANT = 'smoke-tenant';
const BUSINESS = 'demo-business';

/** Un mensaje por cada intencion que el system prompt debe reconocer. */
const MENSAJES_WHATSAPP = [
  'Hoy compré mercancía por $8.000', // expense
  'Vendí 30 panes a $25', // income
  'Compré una batidora industrial por 1.200.000', // investment
  '¿Cómo voy esta semana?', // query
  'Gasté como 500 en unas cosas', // unclear
];

async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const llm = app.get(LlmService);
  const whatsapp = app.get(WhatsAppMessageService);
  const insights = app.get(InsightsService);
  const assistant = app.get(AssistantService);
  const usage = app.get(AiUsageService);

  try {
    section('Proveedor activo');
    console.log(JSON.stringify(llm.describe(), null, 2));

    if (llm.provider.id === 'echo') {
      console.log(
        '\n⚠️  Estás usando el proveedor simulado: NO interpreta el texto,\n' +
          '   solo devuelve un ejemplo que cumple el esquema. Para ver el\n' +
          '   chatbot razonando de verdad, configura AI_PROVIDER=groq o=gemini\n' +
          '   en el .env (ambos tienen capa gratuita).',
      );
    }

    section('Health check');
    console.log(JSON.stringify(await llm.health(), null, 2));

    section('Chatbot de WhatsApp');
    for (const mensaje of MENSAJES_WHATSAPP) {
      const result = await whatsapp.handleMessage({
        tenantId: TENANT,
        businessId: BUSINESS,
        businessName: 'El Virrey',
        message: mensaje,
      });

      console.log(`\n> Usuario: "${mensaje}"`);
      console.log(
        `  intencion: ${result.intent.type}` +
          (result.intent.amount !== null
            ? ` · monto ${result.intent.amount}`
            : '') +
          (result.intent.category ? ` · ${result.intent.category}` : '') +
          (result.intent.queryPeriod
            ? ` · periodo ${result.intent.queryPeriod}`
            : ''),
      );
      if (result.transaction) {
        console.log(
          `  movimiento: ${result.transaction.date} | ${result.transaction.type} | ${result.transaction.category} | ${result.transaction.amount} ${result.transaction.currency}`,
        );
      }
      console.log(`  Luka: ${result.replyText.replace(/\n/g, '\n        ')}`);
      console.log(
        `  (${result.meta.provider}/${result.meta.model} · ${result.meta.latencyMs} ms)`,
      );
    }

    section('Insights del negocio');
    const insightsResult = await insights.generate({
      tenantId: TENANT,
      businessId: BUSINESS,
    });
    for (const insight of insightsResult.insights) {
      console.log(
        `\n[${insight.type}] (P${insight.priority}) ${insight.title}`,
      );
      console.log(`  ${insight.body}`);
      if (insight.action) console.log(`  Accion: ${insight.action}`);
    }

    section('Asistente con herramientas');
    const answer = await assistant.ask({
      tenantId: TENANT,
      businessId: BUSINESS,
      question: 'Cuanto le pague a proveedores y como va mi balance?',
    });
    console.log(
      `\nPregunta: Cuanto le pague a proveedores y como va mi balance?`,
    );
    console.log(`Respuesta: ${answer.answer}`);
    console.log(
      `Herramientas usadas: ${answer.toolsUsed.map((tool) => tool.name).join(', ') || 'ninguna'}`,
    );

    section('Consumo del mes');
    console.log(
      JSON.stringify(await usage.summarizeCurrentMonth(TENANT), null, 2),
    );
    console.log(JSON.stringify(await usage.getQuotaStatus(TENANT), null, 2));
  } finally {
    await app.close();
  }
}

function section(title: string): void {
  console.log(`\n${'='.repeat(70)}\n${title}\n${'='.repeat(70)}`);
}

main().catch((error) => {
  console.error('\nLa prueba de humo fallo:');
  console.error(error);
  process.exitCode = 1;
});
