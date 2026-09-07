import { apiClient } from '@/lib/apiClient';
import { resolveActiveSedeId } from '@/lib/activeBusiness';

export type InsightType = 'warning' | 'success' | 'info';

/** Lo que devuelve el backend en POST /ai/insights. */
export interface Insight {
  id: string;
  businessId: string;
  type: InsightType;
  title: string;
  body: string;
  /** Acción concreta sugerida. El backend siempre la manda. */
  action: string;
  /** 1 = urgente, 5 = informativo. */
  priority: number;
  generatedAt: string;
  read: boolean;
}

interface InsightsResponse {
  success: boolean;
  data: {
    insights: Insight[];
    meta: { provider: string; model: string; latencyMs: number };
  };
}

interface CachedInsights {
  timestamp: number;
  insights: Insight[];
}

const INSIGHTS_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutos

export const insightsApi = {
  /**
   * Obtiene insights en caché síncronamente si existen y son válidos.
   */
  getCached: (sedeId: string): Insight[] | null => {
    try {
      const raw = sessionStorage.getItem(`insights_cache_${sedeId}`);
      if (!raw) return null;
      const parsed: CachedInsights = JSON.parse(raw);
      if (Date.now() - parsed.timestamp < INSIGHTS_CACHE_TTL_MS) {
        return parsed.insights;
      }
    } catch {
      // Ignorar error de parsing
    }
    return null;
  },

  /**
   * Genera las recomendaciones del negocio activo.
   * Utiliza caché de sesión (10 min) para acelerar recargas a menos que forceRefresh sea true.
   * POST /ai/insights — el límite máximo que acepta el backend es 5.
   */
  generate: async (limit = 5, forceRefresh = false): Promise<Insight[]> => {
    const sedeId = await resolveActiveSedeId();
    if (!sedeId) return [];

    if (!forceRefresh) {
      const cached = insightsApi.getCached(sedeId);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    const negocioId = localStorage.getItem('active_business_id') ?? undefined;

    const res = await apiClient<InsightsResponse>('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({
        businessId: sedeId,
        ...(negocioId ? { tenantId: negocioId } : {}),
        limit,
      }),
    });

    const insights = res.data.insights;

    try {
      const cacheData: CachedInsights = {
        timestamp: Date.now(),
        insights,
      };
      sessionStorage.setItem(`insights_cache_${sedeId}`, JSON.stringify(cacheData));
    } catch {
      // SessionStorage puede fallar si está lleno
    }

    return insights;
  },
};

/** "2026-08-28T14:03:00Z" -> "Hace 2 h". El backend manda ISO, no texto. */
export function tiempoRelativo(iso: string): string {
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);

  if (!Number.isFinite(minutos) || minutos < 1) return 'Recién';
  if (minutos < 60) return `Hace ${minutos} min`;

  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;

  const dias = Math.round(horas / 24);
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
}
