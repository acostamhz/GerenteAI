import { Injectable } from '@nestjs/common';

/**
 * Catalogo comercial de planes.
 *
 * El plan se guarda como `Int` en `Negocio.plan` y NO como enum: el modulo de
 * WhatsApp mapea ese entero por indice para resolver la cuota de IA, y cambiarlo
 * de tipo romperia su codigo. Este archivo es la fuente de verdad de las reglas
 * de negocio (sedes y funcionalidades); la cuota de mensajes de IA la sigue
 * definiendo `PLAN_LIMITS` en el modulo de IA, que es su dominio.
 */

export const PLAN_ASISTENTE = 1;
export const PLAN_GERENTE = 2;
export const PLAN_ADMINISTRADOR = 3;
export const PLAN_SOCIO = 4;

/**
 * Funcionalidades que un plan habilita. El backend solo AUTORIZA: quien calcula
 * las recomendaciones o procesa fotos y audios es el equipo de IA.
 */
export type Funcionalidad =
  | 'reportes_por_producto'
  | 'reporte_fiados'
  | 'recomendaciones_estadisticas'
  | 'anotaciones_por_foto'
  | 'anotaciones_por_audio'
  | 'ia_avanzada';

/** Pagar el año completo tiene 16% de descuento sobre 12 meses. */
export const DESCUENTO_ANUAL = 0.16;

export interface DefinicionPlan {
  id: number;
  nombre: string;
  /** En pesos colombianos. 0 = gratuito. */
  precioMensual: number;
  /** Derivado del mensual: ver `conPrecioAnual`. Nunca se escribe a mano. */
  precioAnual: number;
  /** Tope de sedes dentro del negocio. */
  maxSedes: number;
  funcionalidades: Funcionalidad[];
}

// El precio anual se calcula y no se escribe: cuando se llevaban por separado,
// los anuales quedaron computados sobre 79.000 y 249.000 en vez de 79.900 y
// 249.900, y nadie lo notó. Derivarlo hace imposible que vuelvan a discrepar.
function conPrecioAnual(
  plan: Omit<DefinicionPlan, 'precioAnual'>,
): DefinicionPlan {
  return {
    ...plan,
    precioAnual: Math.round(plan.precioMensual * 12 * (1 - DESCUENTO_ANUAL)),
  };
}

export const PLANES: Record<number, DefinicionPlan> = {
  [PLAN_ASISTENTE]: conPrecioAnual({
    id: PLAN_ASISTENTE,
    nombre: 'Asistente',
    precioMensual: 0,
    maxSedes: 1,
    funcionalidades: [],
  }),
  [PLAN_GERENTE]: conPrecioAnual({
    id: PLAN_GERENTE,
    nombre: 'Gerente',
    precioMensual: 79_900,
    maxSedes: 4,
    funcionalidades: [
      'reportes_por_producto',
      'reporte_fiados',
      'recomendaciones_estadisticas',
      'anotaciones_por_foto',
      'anotaciones_por_audio',
    ],
  }),
  [PLAN_ADMINISTRADOR]: conPrecioAnual({
    id: PLAN_ADMINISTRADOR,
    nombre: 'Administrador',
    precioMensual: 249_900,
    maxSedes: 10,
    funcionalidades: [
      'reportes_por_producto',
      'reporte_fiados',
      'recomendaciones_estadisticas',
      'anotaciones_por_foto',
      'anotaciones_por_audio',
      'ia_avanzada',
    ],
  }),
  // Plan de socios: fuera del alcance comercial, sin limites. No se vende.
  [PLAN_SOCIO]: conPrecioAnual({
    id: PLAN_SOCIO,
    nombre: 'Socio',
    precioMensual: 0,
    maxSedes: Number.POSITIVE_INFINITY,
    funcionalidades: [
      'reportes_por_producto',
      'reporte_fiados',
      'recomendaciones_estadisticas',
      'anotaciones_por_foto',
      'anotaciones_por_audio',
      'ia_avanzada',
    ],
  }),
};

/** Lo que el backend necesita saber de un negocio para decidir. */
export interface EstadoDelPlan {
  /** El plan que se pagó, aunque esté vencido. */
  contratado: DefinicionPlan;
  /** El que rige hoy: si venció, es Asistente. */
  vigente: DefinicionPlan;
  vencido: boolean;
  venceEl: Date | null;
}

@Injectable()
export class PlanesService {
  /** Catalogo publico, para la pantalla de suscripcion del frontend. */
  catalogo(): DefinicionPlan[] {
    return [PLAN_ASISTENTE, PLAN_GERENTE, PLAN_ADMINISTRADOR].map(
      (id) => PLANES[id],
    );
  }

  /**
   * Resuelve que plan rige hoy.
   *
   * Un plan vencido NO deja al negocio bloqueado: cae a Asistente. El comerciante
   * sigue registrando ventas en su primera sede aunque se haya atrasado con la
   * suscripcion; lo que pierde son las sedes adicionales y las funciones Premium.
   */
  estado(
    plan: number,
    planVenceEl: Date | null,
    ahora = new Date(),
  ): EstadoDelPlan {
    const contratado = PLANES[plan] ?? PLANES[PLAN_ASISTENTE];

    // Sin fecha de vencimiento el plan no caduca (es el caso del gratuito).
    const vencido =
      planVenceEl !== null && planVenceEl.getTime() <= ahora.getTime();

    return {
      contratado,
      vigente: vencido ? PLANES[PLAN_ASISTENTE] : contratado,
      vencido,
      venceEl: planVenceEl,
    };
  }

  /** Tope de sedes que puede usar el negocio hoy. */
  maxSedes(plan: number, planVenceEl: Date | null, ahora = new Date()): number {
    return this.estado(plan, planVenceEl, ahora).vigente.maxSedes;
  }

  /**
   * Las funcionalidades se evaluan contra el plan VIGENTE, no el contratado:
   * un Gerente vencido no puede ver el reporte de fiados.
   */
  tieneFuncionalidad(
    plan: number,
    planVenceEl: Date | null,
    funcionalidad: Funcionalidad,
    ahora = new Date(),
  ): boolean {
    return this.estado(
      plan,
      planVenceEl,
      ahora,
    ).vigente.funcionalidades.includes(funcionalidad);
  }
}
