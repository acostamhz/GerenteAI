import { Injectable, Logger } from '@nestjs/common';

/**
 * Evita registrar dos veces el mismo mensaje.
 *
 * Meta reintenta el webhook si no recibe un 200 rapido, y n8n tambien puede
 * reintentar un nodo. Sin esto, "compre mercancia por $8.000" se convierte en
 * dos gastos de $8.000 y el cliente pierde la confianza en el bot.
 *
 * ALCANCE: memoria del proceso. Sirve porque hay una sola instancia del backend
 * y la ventana de reintento de Meta es de minutos. Con varias instancias (o si
 * Railway reinicia el contenedor) hay que mover esto a Redis o a una tabla con
 * indice unico sobre el `wamid`.
 */
interface Atendido {
  at: number;
  /** La respuesta que ya se le dio a ese mensaje, si alcanzo a calcularse. */
  respuesta?: unknown;
}

@Injectable()
export class MessageDedupeService {
  private readonly logger = new Logger(MessageDedupeService.name);
  private readonly seen = new Map<string, Atendido>();

  /** Ventana de deduplicacion: mas larga que cualquier reintento de Meta. */
  private readonly ttlMs = 15 * 60 * 1_000;
  /** Tope de memoria: ~5 MB en el peor caso. */
  private readonly maxEntries = 10_000;

  /**
   * Devuelve true la PRIMERA vez que ve un id, y false en las siguientes.
   * Un mensaje sin id siempre se procesa (no hay forma de saber si es repetido).
   */
  isFirstTime(messageId: string | undefined): boolean {
    if (!messageId) return true;

    this.prune();

    if (this.seen.has(messageId)) {
      this.logger.warn(`Mensaje duplicado descartado: ${messageId}`);
      return false;
    }

    this.seen.set(messageId, { at: Date.now() });
    return true;
  }

  /**
   * Guarda la respuesta que se dio, para poder repetirla tal cual si el mismo
   * mensaje vuelve a entrar.
   *
   * Es lo que evita el peor caso: Render despierta lento, n8n corta por timeout
   * y reintenta, el backend ya habia registrado el movimiento y respondia
   * "duplicado" con texto vacio. El gasto quedaba guardado y el usuario sin
   * ninguna confirmacion, que es justo lo que lo hace desconfiar del bot.
   */
  remember(messageId: string | undefined, respuesta: unknown): void {
    if (!messageId) return;
    this.seen.set(messageId, { at: Date.now(), respuesta });
  }

  /** La respuesta que ya se dio a ese mensaje, si se alcanzo a calcular. */
  recall<T>(messageId: string | undefined): T | undefined {
    if (!messageId) return undefined;
    return this.seen.get(messageId)?.respuesta as T | undefined;
  }

  /**
   * Olvida un id.
   *
   * Se usa cuando el procesamiento fallo a mitad de camino: el mensaje NO quedo
   * atendido, asi que el reintento de n8n debe poder volver a entrar. Sin esto,
   * un error transitorio (base caida, timeout) convertia el reintento en un
   * "duplicado" y el usuario se quedaba sin ninguna respuesta.
   */
  forget(messageId: string | undefined): void {
    if (messageId) this.seen.delete(messageId);
  }

  private prune(): void {
    const limit = Date.now() - this.ttlMs;

    for (const [id, entrada] of this.seen) {
      if (entrada.at < limit) this.seen.delete(id);
    }

    // Cinturon y tirantes: si un pico de trafico llena el mapa antes de que el
    // TTL alcance, se descartan las entradas mas viejas.
    if (this.seen.size > this.maxEntries) {
      const excess = this.seen.size - this.maxEntries;
      let removed = 0;
      for (const id of this.seen.keys()) {
        if (removed++ >= excess) break;
        this.seen.delete(id);
      }
    }
  }
}
