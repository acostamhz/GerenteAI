/**
 * Catalogo de proveedores soportados.
 *
 * Este archivo es el "menu" de IAs disponibles. Anadir un proveedor nuevo que
 * hable protocolo OpenAI (la mayoria) es literalmente anadir una entrada aqui:
 * no requiere codigo nuevo.
 */

export type ProviderKind =
  /** Protocolo /v1/chat/completions de OpenAI. Lo hablan Groq, Ollama, OpenRouter, DeepSeek, Together, OpenAI... */
  | 'openai-compatible'
  | 'gemini'
  | 'anthropic'
  /** Proveedor simulado, sin red ni llaves. Para tests y desarrollo offline. */
  | 'echo';

export type ProviderTier = 'free' | 'paid' | 'local';

export interface ProviderPreset {
  id: string;
  kind: ProviderKind;
  label: string;
  tier: ProviderTier;
  /** Para adaptadores REST. Ignorado por `anthropic` (usa su SDK) y `echo`. */
  baseUrl?: string;
  defaultModel: string;
  /** Variable de entorno donde se busca la llave si no se define `AI_API_KEY`. */
  apiKeyEnv?: string;
  /** Si es false, arrancar sin llave es un error de configuracion. */
  apiKeyOptional?: boolean;
  notes: string;
}

export const PROVIDER_PRESETS: Record<string, ProviderPreset> = {
  // ---------------------------------------------------------------- GRATUITOS
  groq: {
    id: 'groq',
    kind: 'openai-compatible',
    label: 'Groq Cloud',
    tier: 'free',
    baseUrl: 'https://api.groq.com/openai/v1',
    defaultModel: 'llama-3.3-70b-versatile',
    apiKeyEnv: 'GROQ_API_KEY',
    notes:
      'Capa gratuita generosa y muy rapida. Soporta tools y JSON mode. Ideal para las pruebas.',
  },
  gemini: {
    id: 'gemini',
    kind: 'gemini',
    label: 'Google AI Studio (Gemini)',
    tier: 'free',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
    apiKeyEnv: 'GEMINI_API_KEY',
    notes:
      'Capa gratuita con limites por minuto/dia. Muy buen espanol y JSON con esquema nativo.',
  },
  openrouter: {
    id: 'openrouter',
    kind: 'openai-compatible',
    label: 'OpenRouter',
    tier: 'free',
    baseUrl: 'https://openrouter.ai/api/v1',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKeyEnv: 'OPENROUTER_API_KEY',
    notes:
      'Pasarela a decenas de modelos, varios con sufijo ":free". Util para comparar modelos sin cambiar codigo.',
  },
  ollama: {
    id: 'ollama',
    kind: 'openai-compatible',
    label: 'Ollama (local)',
    tier: 'local',
    baseUrl: 'http://localhost:11434/v1',
    defaultModel: 'llama3.1:8b',
    apiKeyOptional: true,
    notes:
      'Todo corre en tu maquina: costo cero y sin enviar datos financieros a terceros.',
  },

  // ------------------------------------------------------------------- PAGOS
  anthropic: {
    id: 'anthropic',
    kind: 'anthropic',
    label: 'Anthropic (Claude)',
    tier: 'paid',
    defaultModel: 'claude-opus-5',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
    notes:
      'Destino de produccion sugerido. Structured outputs nativo y tool use robusto.',
  },
  openai: {
    id: 'openai',
    kind: 'openai-compatible',
    label: 'OpenAI',
    tier: 'paid',
    baseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    apiKeyEnv: 'OPENAI_API_KEY',
    notes: 'Alternativa de pago; mismo adaptador que Groq/OpenRouter.',
  },
  deepseek: {
    id: 'deepseek',
    kind: 'openai-compatible',
    label: 'DeepSeek',
    tier: 'paid',
    baseUrl: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
    notes: 'Muy economico. Mismo adaptador OpenAI-compatible.',
  },

  // -------------------------------------------------------------------- TEST
  echo: {
    id: 'echo',
    kind: 'echo',
    label: 'Echo (simulado)',
    tier: 'local',
    defaultModel: 'echo-1',
    apiKeyOptional: true,
    notes:
      'No llama a ninguna IA: devuelve respuestas deterministas. Permite levantar la app y correr tests sin llaves.',
  },
};

/**
 * Precios publicos en USD por millon de tokens.
 * Solo se usa para estimar costos en los logs y en el panel de administracion.
 * Si un modelo no esta aqui, el costo estimado sera 0.
 */
export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

export const MODEL_PRICING: Record<string, ModelPricing> = {
  // Anthropic (tarifas de la API de Anthropic)
  'claude-opus-5': { inputPerMillion: 5, outputPerMillion: 25 },
  'claude-opus-4-8': { inputPerMillion: 5, outputPerMillion: 25 },
  'claude-sonnet-5': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-4-5': { inputPerMillion: 1, outputPerMillion: 5 },
  'claude-fable-5': { inputPerMillion: 10, outputPerMillion: 50 },
};

export function getModelPricing(model: string): ModelPricing | undefined {
  return MODEL_PRICING[model];
}

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const pricing = getModelPricing(model);
  if (!pricing) return 0;

  const cost =
    (inputTokens / 1_000_000) * pricing.inputPerMillion +
    (outputTokens / 1_000_000) * pricing.outputPerMillion;

  // 6 decimales: una extraccion de gasto cuesta fracciones de centavo.
  return Number(cost.toFixed(6));
}
