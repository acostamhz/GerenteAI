import { Injectable, Logger } from '@nestjs/common';

import type { QueryPeriod, Transaction } from '../domain/finance.types';

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
 * porque hay una sola instancia y porque una pregunta se resuelve en segundos:
 * el usuario esta escribiendo del otro lado. Si el backend reinicia en la
 * mitad, la pregunta se pierde y Luka vuelve a preguntar, que es el
 * comportamiento seguro. Con varias instancias, esto se mueve a una tabla.
 */

/** Cual de varios movimientos parecidos hay que tocar. */
export interface PendingCorrection {
  kind: 'correction';
  action: 'update' | 'delete';
  /** Los movimientos que se le mostraron al usuario, en el mismo orden. */
  candidates: Transaction[];
  /** El cambio que ya habia pedido, para no volver a preguntarlo. */
  newAmount: number | null;
  newConcept: string | null;
  at: number;
}

/**
 * Un borrado esperando el "si".
 *
 * Borrar no se deshace, asi que nunca se ejecuta en el mismo turno en que se
 * pide: primero se le enseña al usuario exactamente que se va a ir.
 */
export interface PendingDeletion {
  kind: 'deletion';
  /** Los movimientos que se borrarian, tal como se le enseñaron. */
  targets: Transaction[];
  /** El periodo, cuando el borrado era masivo ("todo lo de hoy"). */
  period: QueryPeriod | null;
  at: number;
}

export type PendingAction = PendingCorrection | PendingDeletion;

@Injectable()
export class ConversationStateService {
  private readonly logger = new Logger(ConversationStateService.name);
  private readonly pendientes = new Map<string, PendingAction>();

  /**
   * Cuanto sobrevive una pregunta sin responder.
   *
   * Corto a proposito: si el usuario vuelve media hora despues con un "si", ya
   * no se acuerda de que estaba confirmando, y ejecutar un borrado a ciegas es
   * justo lo que se quiere evitar.
   */
  private readonly ttlMs = 10 * 60 * 1_000;

  /**
   * Solo cabe una pregunta abierta por sede: Luka pregunta una cosa a la vez.
   *
   * La clave es la SEDE, igual que el historial. Hereda su limitacion: dos
   * personas escribiendo desde el mismo negocio comparten la pregunta abierta.
   */
  private recordar(businessId: string, accion: PendingAction): void {
    this.pendientes.set(businessId, accion);
    this.logger.debug(
      `Pregunta abierta (${accion.kind}) en sede ${businessId}.`,
    );
  }

  recordarCorreccion(
    businessId: string,
    pendiente: Omit<PendingCorrection, 'at' | 'kind'>,
  ): void {
    this.recordar(businessId, {
      ...pendiente,
      kind: 'correction',
      at: Date.now(),
    });
  }

  recordarBorrado(
    businessId: string,
    pendiente: Omit<PendingDeletion, 'at' | 'kind'>,
  ): void {
    this.recordar(businessId, {
      ...pendiente,
      kind: 'deletion',
      at: Date.now(),
    });
  }

  /** La pregunta abierta de esa sede, si sigue vigente. */
  pendiente(businessId: string): PendingAction | null {
    const abierta = this.pendientes.get(businessId);
    if (!abierta) return null;

    if (Date.now() - abierta.at > this.ttlMs) {
      this.pendientes.delete(businessId);
      return null;
    }

    return abierta;
  }

  correccionPendiente(businessId: string): PendingCorrection | null {
    const abierta = this.pendiente(businessId);
    return abierta?.kind === 'correction' ? abierta : null;
  }

  borradoPendiente(businessId: string): PendingDeletion | null {
    const abierta = this.pendiente(businessId);
    return abierta?.kind === 'deletion' ? abierta : null;
  }

  /** Se resolvio (o el usuario cambio de tema): deja de haber pregunta abierta. */
  olvidar(businessId: string): void {
    this.pendientes.delete(businessId);
  }
}
