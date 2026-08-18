import { LlmError } from './llm.errors';
import { extractJsonText, parseJsonResponse } from './json.util';

/**
 * Estos casos son reales: son las formas en que los modelos gratuitos
 * "casi" cumplen el formato pedido. Si esta utilidad falla, el dominio recibe
 * basura, asi que conviene ampliar esta lista cada vez que aparezca un caso nuevo.
 */
describe('json.util', () => {
  describe('extractJsonText', () => {
    it('devuelve el JSON tal cual cuando ya viene limpio', () => {
      expect(extractJsonText('{"monto":50000}')).toBe('{"monto":50000}');
    });

    it('quita el bloque de codigo markdown', () => {
      const raw = '```json\n{"monto":50000}\n```';
      expect(extractJsonText(raw)).toBe('{"monto":50000}');
    });

    it('quita la prosa que el modelo agrega alrededor', () => {
      const raw = 'Claro, aqui tienes:\n{"monto":50000}\nEspero que te sirva.';
      expect(extractJsonText(raw)).toBe('{"monto":50000}');
    });

    it('respeta las llaves que aparecen dentro de cadenas', () => {
      const raw = '{"descripcion":"pago } de arriendo","monto":450000}';
      const parsed = JSON.parse(extractJsonText(raw)) as { monto: number };
      expect(parsed.monto).toBe(450000);
    });

    it('maneja arreglos en la raiz', () => {
      expect(extractJsonText('Resultado: [1,2,3]')).toBe('[1,2,3]');
    });
  });

  describe('parseJsonResponse', () => {
    it('parsea objetos anidados', () => {
      const raw = '```json\n{"transacciones":[{"monto":1000}]}\n```';
      const parsed = parseJsonResponse<{ transacciones: { monto: number }[] }>(
        raw,
      );
      expect(parsed.transacciones[0].monto).toBe(1000);
    });

    it('lanza LlmError con codigo parse ante texto no JSON', () => {
      expect(() => parseJsonResponse('lo siento, no entendi')).toThrow(
        LlmError,
      );

      try {
        parseJsonResponse('lo siento, no entendi', 'groq');
      } catch (error) {
        expect((error as LlmError).code).toBe('parse');
        expect((error as LlmError).providerId).toBe('groq');
        // Un JSON invalido no se arregla reintentando la misma peticion.
        expect((error as LlmError).retryable).toBe(false);
      }
    });

    it('lanza LlmError ante respuesta vacia', () => {
      expect(() => parseJsonResponse('   ')).toThrow(LlmError);
    });
  });
});
