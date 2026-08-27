import type {
  LlmCapabilities,
  LlmHealth,
  LlmRequest,
  LlmResponse,
} from './llm.types';

/**
 * Puerto que TODO proveedor de IA debe implementar.
 *
 * Es la unica superficie que el dominio conoce. Cambiar de IA = escribir otra
 * clase que implemente esta interfaz y cambiar una variable de entorno.
 */
export interface LlmProvider {
  /** Identificador estable del adaptador: "groq", "gemini", "anthropic"... */
  readonly id: string;
  /** Modelo concreto configurado para esta instancia. */
  readonly model: string;
  readonly capabilities: LlmCapabilities;

  /** Una sola llamada al modelo. Debe lanzar `LlmError` ante cualquier fallo. */
  generate(request: LlmRequest): Promise<LlmResponse>;

  /** Prueba de vida barata, para /health y para validar credenciales al arrancar. */
  healthCheck(): Promise<LlmHealth>;
}

/** Token de inyeccion de Nest para el proveedor principal. */
export const LLM_PROVIDER = Symbol('LLM_PROVIDER');

/** Token del proveedor de respaldo (opcional). */
export const LLM_FALLBACK_PROVIDER = Symbol('LLM_FALLBACK_PROVIDER');
