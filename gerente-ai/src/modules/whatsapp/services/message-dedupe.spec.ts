import { MessageDedupeService } from './message-dedupe.service';

describe('MessageDedupeService', () => {
  it('acepta el primer mensaje y descarta el repetido', () => {
    const dedupe = new MessageDedupeService();

    expect(dedupe.isFirstTime('wamid.1')).toBe(true);
    expect(dedupe.isFirstTime('wamid.1')).toBe(false);
    expect(dedupe.isFirstTime('wamid.2')).toBe(true);
  });

  it('procesa siempre los mensajes sin id: no hay forma de saber si repiten', () => {
    const dedupe = new MessageDedupeService();

    expect(dedupe.isFirstTime(undefined)).toBe(true);
    expect(dedupe.isFirstTime(undefined)).toBe(true);
  });

  it('olvida el id cuando el procesamiento falló, para que el reintento entre', () => {
    // Es el caso real que rompió en produccion: el backend fallaba, n8n
    // reintentaba, y el reintento se descartaba como duplicado. Resultado: el
    // usuario no recibia ninguna respuesta.
    const dedupe = new MessageDedupeService();

    expect(dedupe.isFirstTime('wamid.3')).toBe(true);
    dedupe.forget('wamid.3');
    expect(dedupe.isFirstTime('wamid.3')).toBe(true);
  });
});

describe('MessageDedupeService · respuesta repetida', () => {
  it('reenvía la respuesta ya calculada cuando el mensaje vuelve', () => {
    // El caso real: Render despierta lento, n8n corta por timeout y reintenta.
    // El backend ya habia registrado el movimiento; si respondiera vacio, el
    // gasto quedaria guardado y el usuario sin confirmacion.
    const dedupe = new MessageDedupeService();

    expect(dedupe.isFirstTime('wamid.10')).toBe(true);
    dedupe.remember('wamid.10', { reply: '✅ Registré un gasto de $8.000' });

    expect(dedupe.isFirstTime('wamid.10')).toBe(false);
    expect(dedupe.recall<{ reply: string }>('wamid.10')?.reply).toContain(
      'Registré un gasto',
    );
  });

  it('no devuelve nada si el original todavía no terminó', () => {
    // Sin respuesta guardada, contestará la petición original: repetir aquí
    // duplicaría el mensaje al usuario.
    const dedupe = new MessageDedupeService();

    dedupe.isFirstTime('wamid.11');
    expect(dedupe.recall('wamid.11')).toBeUndefined();
  });

  it('olvidar un id también borra su respuesta', () => {
    const dedupe = new MessageDedupeService();

    dedupe.isFirstTime('wamid.12');
    dedupe.remember('wamid.12', { reply: 'algo' });
    dedupe.forget('wamid.12');

    expect(dedupe.isFirstTime('wamid.12')).toBe(true);
    expect(dedupe.recall('wamid.12')).toBeUndefined();
  });
});
