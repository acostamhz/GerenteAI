import { LlmError } from './llm.errors';
import type { JsonSchema } from './llm.types';

/**
 * Utilidades para obtener JSON confiable de CUALQUIER modelo.
 *
 * Los proveedores premium garantizan el esquema de forma nativa; los gratuitos
 * suelen devolver el JSON envuelto en ```json ... ``` o con texto alrededor.
 * Estas funciones nivelan el terreno para que el dominio siempre reciba un
 * objeto ya parseado.
 */

const FENCE_RE = /```(?:json|JSON)?\s*([\s\S]*?)```/;

/** Quita cercas de codigo y prosa alrededor, y devuelve el primer JSON balanceado. */
export function extractJsonText(raw: string): string {
  const text = (raw ?? '').trim();
  if (!text) return '';

  const fenced = FENCE_RE.exec(text);
  const candidate = (fenced ? fenced[1] : text).trim();

  // Si ya es JSON puro, listo.
  const first = candidate[0];
  if (first === '{' || first === '[') {
    const balanced = sliceBalanced(candidate);
    if (balanced) return balanced;
  }

  // Si no, buscamos el primer objeto/array balanceado dentro del texto.
  const start = findFirstJsonStart(candidate);
  if (start >= 0) {
    const balanced = sliceBalanced(candidate.slice(start));
    if (balanced) return balanced;
  }

  return candidate;
}

function findFirstJsonStart(text: string): number {
  const obj = text.indexOf('{');
  const arr = text.indexOf('[');
  if (obj < 0) return arr;
  if (arr < 0) return obj;
  return Math.min(obj, arr);
}

/**
 * Recorre el texto contando llaves/corchetes fuera de cadenas y devuelve el
 * fragmento que cierra correctamente el primer valor JSON.
 */
function sliceBalanced(text: string): string | null {
  const open = text[0];
  if (open !== '{' && open !== '[') return null;
  const close = open === '{' ? '}' : ']';

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === open) depth++;
    else if (char === close) {
      depth--;
      if (depth === 0) return text.slice(0, i + 1);
    }
  }

  return null;
}

/** Parsea la salida del modelo como JSON o lanza `LlmError('parse')`. */
export function parseJsonResponse<T>(raw: string, providerId = 'unknown'): T {
  const text = extractJsonText(raw);
  if (!text) {
    throw new LlmError('parse', 'El modelo devolvio una respuesta vacia.', {
      providerId,
    });
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new LlmError(
      'parse',
      `No se pudo interpretar la respuesta del modelo como JSON: ${text.slice(0, 300)}`,
      { providerId, cause: error },
    );
  }
}

/**
 * Instruccion de respaldo para proveedores sin JSON estructurado nativo.
 * Se anexa al system prompt SOLO cuando `capabilities.nativeJsonSchema` es false.
 */
export function buildJsonSchemaInstruction(
  name: string,
  schema: JsonSchema,
): string {
  return [
    '',
    '## Formato de salida obligatorio',
    `Responde UNICAMENTE con un objeto JSON valido llamado "${name}".`,
    'No escribas texto antes ni despues. No uses bloques de codigo (```).',
    'Debe cumplir exactamente este JSON Schema:',
    JSON.stringify(schema),
  ].join('\n');
}
