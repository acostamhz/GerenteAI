import { apiClient } from '@/lib/apiClient';
import { PeriodoTipo, ReporteFinanciero, DashboardTransactionItem } from '../types';
import { formatNumber } from '../utils/formatters';

interface BackendVenta {
  id: string;
  total: number;
  tipo: 'CONTADO' | 'FIADO';
  metodoPago?: string;
  fecha: string;
  cliente?: {
    id: string;
    nombre: string;
  };
}

interface BackendGasto {
  id: string;
  monto: number;
  categoria: string;
  descripcion?: string;
  fecha: string;
}

export const dashboardApi = {
  /**
   * Obtiene el reporte financiero consolidado de un negocio
   * GET /reportes/negocio/:negocioId?periodo=diario|semanal|mensual&fecha=YYYY-MM-DD
   */
  getReporteNegocio: async (
    negocioId: string,
    periodo: PeriodoTipo = 'diario',
    fecha?: string,
  ): Promise<ReporteFinanciero> => {
    const params = new URLSearchParams({ periodo });
    if (fecha) params.append('fecha', fecha);

    return apiClient<ReporteFinanciero>(`/reportes/negocio/${negocioId}?${params.toString()}`);
  },

  /**
   * Obtiene el reporte financiero de una sede específica
   * GET /reportes/sede/:sedeId?periodo=diario|semanal|mensual&fecha=YYYY-MM-DD
   */
  getReporteSede: async (
    sedeId: string,
    periodo: PeriodoTipo = 'diario',
    fecha?: string,
  ): Promise<ReporteFinanciero> => {
    const params = new URLSearchParams({ periodo });
    if (fecha) params.append('fecha', fecha);

    return apiClient<ReporteFinanciero>(`/reportes/sede/${sedeId}?${params.toString()}`);
  },

  /**
   * Obtiene transacciones combinadas (ventas y gastos) filtradas estrictamente por sedes autorizadas
   */
  getTransacciones: async (sedeIds?: string | string[]): Promise<DashboardTransactionItem[]> => {
    if (!sedeIds || (Array.isArray(sedeIds) && sedeIds.length === 0)) {
      return [];
    }

    const ids = Array.isArray(sedeIds) ? sedeIds : [sedeIds];
    const items: DashboardTransactionItem[] = [];

    await Promise.all(
      ids.map(async (sId) => {
        const [ventasRes, gastosRes] = await Promise.allSettled([
          apiClient<BackendVenta[]>(`/ventas?sedeId=${sId}`),
          apiClient<BackendGasto[]>(`/gastos?sedeId=${sId}`),
        ]);

        if (ventasRes.status === 'fulfilled' && Array.isArray(ventasRes.value)) {
          for (const v of ventasRes.value) {
            items.push({
              id: `v-${v.id}`,
              type: v.tipo === 'FIADO' ? 'Convertida' : 'Venta',
              amount: Number(v.total) || 0,
              amountFormatted: `+ ${formatNumber(Number(v.total) || 0)} COP`,
              paymentMethod: v.metodoPago || (v.tipo === 'FIADO' ? 'Crédito/Fiado' : 'Efectivo'),
              pmDetails: v.tipo === 'FIADO' ? 'Cuenta por Cobrar' : 'Contado',
              status: 'Exitoso',
              activity: v.tipo === 'FIADO' ? 'Venta a crédito registrada' : 'Venta de mostrador',
              personName: v.cliente?.nombre || 'Cliente general',
              date: new Date(v.fecha).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              rawDate: v.fecha,
            });
          }
        }

        if (gastosRes.status === 'fulfilled' && Array.isArray(gastosRes.value)) {
          for (const g of gastosRes.value) {
            items.push({
              id: `g-${g.id}`,
              type: 'Gasto',
              amount: Number(g.monto) || 0,
              amountFormatted: `- ${formatNumber(Number(g.monto) || 0)} COP`,
              paymentMethod: g.categoria || 'Gasto Operativo',
              pmDetails: 'Egreso',
              status: 'Exitoso',
              activity: g.descripcion || `Pago de ${g.categoria || 'operación'}`,
              personName: 'Proveedor / Servicio',
              date: new Date(g.fecha).toLocaleDateString('es-CO', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }),
              rawDate: g.fecha,
            });
          }
        }
      })
    );

    // Ordenar de más reciente a más antiguo
    return items.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
  },
};
