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

export const insightsApi = {
  /**
   * Genera las recomendaciones del negocio activo.
   * POST /ai/insights — el límite máximo que acepta el backend es 5.
   */
  generate: async (limit = 5): Promise<Insight[]> => {
    const sedeId = await resolveActiveSedeId();
    if (!sedeId) return [];

    const negocioId = localStorage.getItem('active_business_id') ?? undefined;

    const res = await apiClient<InsightsResponse>('/ai/insights', {
      method: 'POST',
      body: JSON.stringify({
        businessId: sedeId,
        ...(negocioId ? { tenantId: negocioId } : {}),
        limit,
      }),
    });

    return res.data.insights;
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
