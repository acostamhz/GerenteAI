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
