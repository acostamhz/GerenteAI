import { Injectable, Logger } from '@nestjs/common';

import type { Transaction } from '../domain/finance.types';

/**
 * Lo que quedo a medias en la conversacion y hay que recordar para el proximo
 * mensaje.
 *
 * Nace de un error que corrompio datos reales: Luka mostraba tres movimientos
 * parecidos y preguntaba cual corregir, el usuario contestaba "la primera" y
 * el backend, que no guardaba esa lista, interpretaba la respuesta como un
 * mensaje suelto. Al no reconocer ningun identificador caia en la regla "sin
 * referencia = el ultimo movimiento" y termino cambiandole el monto a una
 * compra que no tenia nada que ver.
 *
 * La leccion: mientras hay una pregunta abierta, "no dijo cual" NO puede
 * significar "el ultimo". Significa que hay que volver a preguntar.
 *
 * ALCANCE: memoria del proceso, igual que `MessageDedupeService`. Alcanza
 * porque hay una sola instancia y porque una desambiguacion se resuelve en
 * segundos: el usuario esta escribiendo del otro lado. Si el backend reinicia
 * en la mitad, la pregunta se pierde y Luka vuelve a preguntar, que es el
 * comportamiento seguro. Cuando haya varias instancias, esto se mueve a una
 * tabla.
 */
export interface PendingCorrection {
  action: 'update' | 'delete';
  /** Los movimientos que se le mostraron al usuario, en el mismo orden. */
  candidates: Transaction[];
  /** El cambio que ya habia pedido, para no volver a preguntarlo. */
  newAmount: number | null;
  newConcept: string | null;
  at: number;
}

@Injectable()
export class ConversationStateService {
  private readonly logger = new Logger(ConversationStateService.name);
  private readonly pendientes = new Map<string, PendingCorrection>();

  /**
   * Cuanto sobrevive una pregunta sin responder.
   *
   * Corto a proposito: si el usuario vuelve media hora despues con un "la
   * primera", ya no se acuerda de cual lista hablaba, y aplicar un cambio a
   * ciegas es justo lo que se quiere evitar.
   */
  private readonly ttlMs = 10 * 60 * 1_000;

  /**
   * La clave es la SEDE, igual que el historial de la conversacion. Hereda su
   * limitacion: dos personas escribiendo desde el mismo negocio comparten la
   * pregunta abierta.
   */
  recordarCorreccion(
    businessId: string,
    pendiente: Omit<PendingCorrection, 'at'>,
  ): void {
    this.pendientes.set(businessId, { ...pendiente, at: Date.now() });
    this.logger.debug(
      `Correccion pendiente en sede ${businessId}: ${pendiente.candidates.length} candidatos.`,
    );
  }

  /** La pregunta abierta de esa sede, si sigue vigente. */
  correccionPendiente(businessId: string): PendingCorrection | null {
    const pendiente = this.pendientes.get(businessId);
    if (!pendiente) return null;

    if (Date.now() - pendiente.at > this.ttlMs) {
      this.pendientes.delete(businessId);
      return null;
    }

    return pendiente;
  }

  /** Se resolvio (o el usuario cambio de tema): deja de haber pregunta abierta. */
  olvidarCorreccion(businessId: string): void {
    this.pendientes.delete(businessId);
  }
}
