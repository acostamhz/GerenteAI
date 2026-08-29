import { GeminiProvider } from './gemini.provider';

/**
 * Los Gemini 3.x razonan antes de responder y por defecto lo hacen al maximo.
 * En este producto eso es contraproducente: clasificar "compre mercancia por
 * 8000" no necesita razonamiento profundo, necesita respuesta rapida. Sin este
 * control, gemini-3.7-flash tardaba mas de 30 s y moria por timeout.
 *
 * Se intercepta `fetch` para leer el cuerpo que se manda, sin tocar la red.
 */
/** Solo la parte del cuerpo que importa para estas pruebas. */
interface CuerpoGemini {
  generationConfig: {
    thinkingConfig?: { thinkingLevel: string };
  };
}

function provider(model: string) {
  return new GeminiProvider({
    providerId: 'gemini',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    model,
    apiKey: 'llave-de-prueba',
    timeoutMs: 5_000,
    defaultMaxOutputTokens: 256,
  });
}

const RESPUESTA_VACIA = {
  candidates: [{ content: { parts: [{ text: 'ok' }] }, finishReason: 'STOP' }],
  usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
};

async function capturarCuerpo(
  model: string,
  effort: 'low' | 'medium' | 'high' | undefined,
): Promise<CuerpoGemini> {
  let enviado = {} as CuerpoGemini;

  const original = global.fetch;
  global.fetch = jest.fn((_url: unknown, init: { body: string }) => {
    enviado = JSON.parse(init.body) as CuerpoGemini;
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(RESPUESTA_VACIA),
      text: () => Promise.resolve(''),
    });
  }) as unknown as typeof fetch;

  try {
    await provider(model).generate({
      messages: [{ role: 'user', content: 'hola' }],
      ...(effort ? { effort } : {}),
    });
  } finally {
    global.fetch = original;
  }

  return enviado;
}

describe('GeminiProvider · nivel de pensamiento', () => {
  it('traduce el effort a thinkingLevel en los modelos 3.x', async () => {
    const cuerpo = await capturarCuerpo('gemini-3.7-flash', 'low');

    expect(cuerpo.generationConfig.thinkingConfig).toEqual({
      thinkingLevel: 'low',
    });
  });

  it('respeta el nivel pedido', async () => {
    const cuerpo = await capturarCuerpo('gemini-3.6-flash', 'high');

    expect(cuerpo.generationConfig.thinkingConfig).toEqual({
      thinkingLevel: 'high',
    });
  });

  it('NO lo manda a modelos anteriores: ahí el campo no existe y la API da 400', async () => {
    const cuerpo = await capturarCuerpo('gemini-2.0-flash', 'low');

    expect(cuerpo.generationConfig.thinkingConfig).toBeUndefined();
  });

  it('sin effort no impone ningún nivel', async () => {
    const cuerpo = await capturarCuerpo('gemini-3.7-flash', undefined);

    expect(cuerpo.generationConfig.thinkingConfig).toBeUndefined();
  });
});
