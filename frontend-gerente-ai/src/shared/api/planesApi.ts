import { apiClient } from '@/lib/apiClient';

export interface PlanBackend {
  id: number;
  nombre: string;
  precioMensual: number;
  precioAnual: number;
  maxSedes: number;
  funcionalidades: string[];
}

export interface NegocioPlanInfo {
  id: string;
  nombre: string;

  /** Plan que el negocio tiene contratado. */
  plan: number;

  /** Plan que realmente está vigente y puede utilizar. */
  planVigente: number;

  /** Indica si el plan contratado ya venció. */
  planVencido: boolean;

  /** Fecha de vencimiento del plan contratado. */
  planVenceEl: string | null;
}

export type CicloFacturacion =
  | 'mensual'
  | 'anual';

export const DESCUENTO_ANUAL = 0.16;

/**
 * Catálogo por defecto basado en la fuente de verdad
 * del backend (PlanesService).
 */
export const PLANES_FALLBACK: PlanBackend[] = [
  {
    id: 1,
    nombre: 'Asistente',
    precioMensual: 0,
    precioAnual: 0,
    maxSedes: 1,
    funcionalidades: [],
  },
  {
    id: 2,
    nombre: 'Gerente',
    precioMensual: 79900,
    precioAnual: Math.round(
      79900 * 12 * (1 - DESCUENTO_ANUAL),
    ),
    maxSedes: 4,
    funcionalidades: [
      'reportes_por_producto',
      'reporte_fiados',
      'recomendaciones_estadisticas',
      'anotaciones_por_foto',
      'anotaciones_por_audio',
    ],
  },
  {
    id: 3,
    nombre: 'Administrador',
    precioMensual: 249900,
    precioAnual: Math.round(
      249900 * 12 * (1 - DESCUENTO_ANUAL),
    ),
    maxSedes: 10,
    funcionalidades: [
      'reportes_por_producto',
      'reporte_fiados',
      'recomendaciones_estadisticas',
      'anotaciones_por_foto',
      'anotaciones_por_audio',
      'ia_avanzada',
    ],
  },
];

/**
 * Cuota de mensajes de IA que muestra cada plan.
 *
 * OJO: estos numeros estan duplicados. La fuente de verdad es `PLAN_LIMITS`
 * en el backend (`src/ai/usage/usage.service.ts`), que es quien realmente
 * corta el servicio cuando se agota la cuota. Si cambian alli, hay que
 * cambiarlos aqui tambien: la pagina llego a anunciar 50 mensajes mientras el
 * backend ya concedia 500.
 */
export const MENSAJES_IA_POR_PLAN: Record<
  number,
  string
> = {
  1: '500 mensajes de IA / mes',
  2: '4.000 mensajes de IA / mes',
  3: '10.000 mensajes de IA / mes',
  4: 'Mensajes de IA ilimitados',
};

export const DESCRIPCIONES_POR_PLAN: Record<
  number,
  string
> = {
  1: 'Para dar los primeros pasos y organizar tu negocio con Luka AI.',
  2: 'El plan ideal para pymes con alto volumen de ventas y sucursales.',
  3: 'Para empresas consolidadas que requieren IA predictiva y múltiples sedes.',
  4: 'Soluciones enterprise y alianzas estratégicas a la medida.',
};

let cachedPlanesPromise:
  | Promise<PlanBackend[]>
  | null = null;

let cachedPlanes:
  | PlanBackend[]
  | null = null;

export const planesApi = {
  /**
   * Obtiene el catálogo comercial oficial de planes
   * con deduplicación y caché en memoria.
   */
  async getPlanesCatalogo(
    forceRefresh = false,
  ): Promise<PlanBackend[]> {
    if (!forceRefresh && cachedPlanes) {
      return cachedPlanes;
    }

    if (
      !forceRefresh &&
      cachedPlanesPromise
    ) {
      return cachedPlanesPromise;
    }

    cachedPlanesPromise =
      (async () => {
        try {
          const catalogo =
            await apiClient<PlanBackend[]>(
              '/planes',
            );

          if (
            Array.isArray(catalogo) &&
            catalogo.length > 0
          ) {
            cachedPlanes = catalogo;
            return catalogo;
          }

          cachedPlanes =
            PLANES_FALLBACK;

          return PLANES_FALLBACK;
        } catch {
          cachedPlanes =
            PLANES_FALLBACK;

          return PLANES_FALLBACK;
        } finally {
          cachedPlanesPromise = null;
        }
      })();

    return cachedPlanesPromise;
  },

  /**
   * Obtiene la información del plan
   * del negocio actual.
   */
  async getNegocioPlan(
    negocioId: string,
  ): Promise<NegocioPlanInfo | null> {
    if (!negocioId) {
      return null;
    }

    try {
      return await apiClient<NegocioPlanInfo>(
        `/negocios/${negocioId}`,
      );
    } catch {
      return null;
    }
  },

  /**
   * Baja voluntariamente el negocio
   * al plan Asistente.
   *
   * No cancela pagos.
   * No elimina información.
   * No requiere Wompi.
   *
   * El backend es quien autoriza y ejecuta
   * el cambio.
   */
  async cambiarAAsistente(
    negocioId: string,
  ): Promise<NegocioPlanInfo> {
    if (!negocioId) {
      throw new Error(
        'No hay un negocio activo.',
      );
    }

    return apiClient<NegocioPlanInfo>(
      `/negocios/${negocioId}/plan/asistente`,
      {
        method: 'PATCH',
      },
    );
  },
};