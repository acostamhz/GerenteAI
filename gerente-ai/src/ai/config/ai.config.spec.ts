import { AiConfigError, loadAiConfig } from './ai.config';

describe('loadAiConfig', () => {
  it('usa el proveedor simulado cuando no hay nada configurado', () => {
    const config = loadAiConfig({});
    expect(config.primary.preset.id).toBe('echo');
    expect(config.primary.model).toBe('echo-1');
  });

  it('resuelve la llave desde la variable especifica del proveedor', () => {
    const config = loadAiConfig({
      AI_PROVIDER: 'groq',
      GROQ_API_KEY: 'gsk_test',
    });
    expect(config.primary.preset.id).toBe('groq');
    expect(config.primary.apiKey).toBe('gsk_test');
    expect(config.primary.baseUrl).toBe('https://api.groq.com/openai/v1');
  });

  it('AI_API_KEY tiene prioridad sobre la variable especifica', () => {
    const config = loadAiConfig({
      AI_PROVIDER: 'groq',
      AI_API_KEY: 'generica',
      GROQ_API_KEY: 'especifica',
    });
    expect(config.primary.apiKey).toBe('generica');
  });

  it('permite sobreescribir el modelo por defecto', () => {
    const config = loadAiConfig({
      AI_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-ant-test',
      AI_MODEL: 'claude-haiku-4-5',
    });
    expect(config.primary.model).toBe('claude-haiku-4-5');
  });

  it('falla si el proveedor no existe', () => {
    expect(() => loadAiConfig({ AI_PROVIDER: 'inexistente' })).toThrow(
      AiConfigError,
    );
  });

  it('falla si falta la llave de un proveedor que la exige', () => {
    expect(() => loadAiConfig({ AI_PROVIDER: 'gemini' })).toThrow(
      AiConfigError,
    );
  });

  it('no exige llave para proveedores locales', () => {
    const config = loadAiConfig({ AI_PROVIDER: 'ollama' });
    expect(config.primary.preset.id).toBe('ollama');
    expect(config.primary.apiKey).toBeUndefined();
  });

  it('configura el proveedor de respaldo', () => {
    const config = loadAiConfig({
      AI_PROVIDER: 'anthropic',
      ANTHROPIC_API_KEY: 'sk-ant-test',
      AI_FALLBACK_PROVIDER: 'groq',
      AI_FALLBACK_API_KEY: 'gsk_test',
    });
    expect(config.fallback?.preset.id).toBe('groq');
  });

  it('rechaza valores numericos fuera de rango', () => {
    expect(() => loadAiConfig({ AI_TIMEOUT_MS: '10' })).toThrow(AiConfigError);
    expect(() => loadAiConfig({ AI_TEMPERATURE: 'caliente' })).toThrow(
      AiConfigError,
    );
  });
});
