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
  plan: number;
  planVenceEl: string | null;
}

export type CicloFacturacion = 'mensual' | 'anual';

export const DESCUENTO_ANUAL = 0.16;

/** Catálogo por defecto basado en la fuente de verdad del backend (PlanesService) */
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
    precioAnual: Math.round(79900 * 12 * (1 - DESCUENTO_ANUAL)), // 805.392 COP
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
    precioAnual: Math.round(249900 * 12 * (1 - DESCUENTO_ANUAL)), // 2.518.992 COP
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

export const MENSAJES_IA_POR_PLAN: Record<number, string> = {
  1: '50 mensajes de IA / mes',
  2: '500 mensajes de IA / mes',
  3: '5.000 mensajes de IA / mes',
  4: 'Mensajes de IA ilimitados',
};

export const DESCRIPCIONES_POR_PLAN: Record<number, string> = {
  1: 'Para dar los primeros pasos y organizar tu negocio con Luka AI.',
  2: 'El plan ideal para pymes con alto volumen de ventas y sucursales.',
  3: 'Para empresas consolidadas que requieren IA predictiva y múltiples sedes.',
  4: 'Soluciones enterprise y alianzas estratégicas a la medida.',
};

let cachedPlanesPromise: Promise<PlanBackend[]> | null = null;
let cachedPlanes: PlanBackend[] | null = null;

export const planesApi = {
  /** Obtiene el catálogo comercial oficial de planes con deduplicación y caché en memoria */
  async getPlanesCatalogo(forceRefresh = false): Promise<PlanBackend[]> {
    if (!forceRefresh && cachedPlanes) {
      return cachedPlanes;
    }
    if (!forceRefresh && cachedPlanesPromise) {
      return cachedPlanesPromise;
    }
    cachedPlanesPromise = (async () => {
      try {
        const catalogo = await apiClient<PlanBackend[]>('/planes');
        if (Array.isArray(catalogo) && catalogo.length > 0) {
          cachedPlanes = catalogo;
          return catalogo;
        }
        cachedPlanes = PLANES_FALLBACK;
        return PLANES_FALLBACK;
      } catch {
        cachedPlanes = PLANES_FALLBACK;
        return PLANES_FALLBACK;
      } finally {
        cachedPlanesPromise = null;
      }
    })();
    return cachedPlanesPromise;
  },

  /** Obtiene la información del plan del negocio actual */
  async getNegocioPlan(negocioId: string): Promise<NegocioPlanInfo | null> {
    if (!negocioId) return null;
    try {
      return await apiClient<NegocioPlanInfo>(`/negocios/${negocioId}`);
    } catch {
      return null;
    }
  },
};
