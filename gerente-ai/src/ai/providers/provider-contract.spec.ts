import { loadAiConfig } from '../config/ai.config';
import { parseJsonResponse } from '../core/json.util';
import type { LlmProvider } from '../core/llm.provider';
import type { JsonSchema } from '../core/llm.types';
import { EchoProvider } from './echo.provider';
import { createProvider } from './provider.factory';

/**
 * Test de contrato: la bateria que TODO proveedor debe pasar.
 *
 * Es la red de seguridad de la migracion. Antes de mover produccion a una IA
 * nueva, ejecuta esta bateria contra ella:
 *
 *   AI_LIVE_TEST=1 AI_PROVIDER=gemini GEMINI_API_KEY=... npm test
 *
 * Si pasa, el dominio funcionara igual con ese proveedor.
 */

const SCHEMA: JsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['ciudad', 'poblacion'],
  properties: {
    ciudad: { type: 'string', description: 'Nombre de la ciudad' },
    poblacion: { type: 'number', description: 'Habitantes aproximados' },
  },
};

export function runProviderContract(
  label: string,
  createSubject: () => LlmProvider,
): void {
  describe(`contrato de proveedor: ${label}`, () => {
    let provider: LlmProvider;

    beforeAll(() => {
      provider = createSubject();
    });

    it('se identifica correctamente', () => {
      expect(provider.id).toBeTruthy();
      expect(provider.model).toBeTruthy();
    });

    it('declara sus capacidades', () => {
      const capabilities = provider.capabilities;
      expect(typeof capabilities.tools).toBe('boolean');
      expect(typeof capabilities.nativeJsonSchema).toBe('boolean');
      expect(typeof capabilities.jsonMode).toBe('boolean');
      expect(typeof capabilities.vision).toBe('boolean');
      expect(capabilities.maxOutputTokens).toBeGreaterThan(0);
    });

    it('responde texto con metricas de uso', async () => {
      const response = await provider.generate({
        messages: [{ role: 'user', content: 'Di la palabra: listo' }],
        maxOutputTokens: 64,
        temperature: 0,
      });

      expect(typeof response.text).toBe('string');
      expect(response.providerId).toBe(provider.id);
      expect(response.usage.inputTokens).toBeGreaterThanOrEqual(0);
      expect(response.usage.outputTokens).toBeGreaterThanOrEqual(0);
      expect(response.latencyMs).toBeGreaterThanOrEqual(0);
      expect(response.costUsd).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(response.toolCalls)).toBe(true);
    });

    it('devuelve JSON parseable cuando se le pide un esquema', async () => {
      const response = await provider.generate({
        system: 'Responde con datos aproximados, no importa la exactitud.',
        messages: [{ role: 'user', content: 'Dame la ciudad de Bogota.' }],
        responseFormat: { type: 'json_schema', name: 'ciudad', schema: SCHEMA },
        maxOutputTokens: 256,
        temperature: 0,
      });

      const data = parseJsonResponse<Record<string, unknown>>(
        response.text,
        provider.id,
      );
      expect(data).toHaveProperty('ciudad');
      expect(data).toHaveProperty('poblacion');
    });

    it('reporta su estado', async () => {
      const health = await provider.healthCheck();
      expect(health.providerId).toBe(provider.id);
      expect(typeof health.ok).toBe('boolean');
    });
  });
}

// El proveedor simulado corre siempre: valida el contrato sin red ni llaves.
runProviderContract('echo', () => new EchoProvider());

// El proveedor real solo corre bajo demanda, para no gastar cuota en CI.
const liveTestEnabled = process.env.AI_LIVE_TEST === '1';

if (liveTestEnabled) {
  const config = loadAiConfig();
  runProviderContract(`${config.primary.preset.id} (en vivo)`, () =>
    createProvider(config.primary, config),
  );
} else {
  describe('contrato de proveedor en vivo', () => {
    it.skip('omitido: exporta AI_LIVE_TEST=1 para probar el proveedor real', () => {
      // Intencionalmente vacio.
    });
  });
}
