import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/features/auth';
import { PeriodoTipo, ReporteFinanciero, DashboardTransactionItem } from '../types';
import { dashboardApi } from '../api/dashboardApi';
import { apiClient } from '@/lib/apiClient';

interface UsuarioMeResponse {
  id: string;
  nombre: string;
  email: string;
  rolGlobal: string;
  negocios: Array<{
    negocio: {
      id: string;
      nombre: string;
    };
  }>;
  sedes: Array<{
    sede: {
      id: string;
      nombre: string;
      negocioId: string;
    };
  }>;
}

const EMPTY_METRICS = (periodo: PeriodoTipo): ReporteFinanciero => ({
  periodo: {
    tipo: periodo,
    desde: new Date().toISOString(),
    hasta: new Date().toISOString(),
    zonaHoraria: 'UTC-5',
  },
  ingresos: { ventasContado: 0, abonos: 0, total: 0 },
  egresos: { compras: 0, gastos: 0, total: 0 },
  balance: 0,
  informativo: {
    ventasFiado: 0,
    ventasTotales: 0,
    conteos: { ventas: 0, abonos: 0, compras: 0, gastos: 0 },
  },
});

export function useDashboardMetrics(customBusinessId?: string, customSedeId?: string) {
  const { user, token } = useAuth();

  const [periodo, setPeriodoState] = useState<PeriodoTipo>('mensual');
  const [periodMetrics, setPeriodMetrics] = useState<ReporteFinanciero | null>(null);
  const [generalMetrics, setGeneralMetrics] = useState<ReporteFinanciero | null>(null);
  const [allTransactions, setAllTransactions] = useState<DashboardTransactionItem[]>([]);
  
  const [resolvedBusinessId, setResolvedBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState<string>('Mi Negocio');
  const [hasNoBusiness, setHasNoBusiness] = useState<boolean>(false);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isChartLoading, setIsChartLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Determinar los negocios sobre los que el usuario tiene permisos reales
  const resolveActiveBusiness = useCallback(async (): Promise<string | null> => {
    if (customBusinessId) return customBusinessId;

    try {
      const me = await apiClient<UsuarioMeResponse>('/auth/usuarios/me');
      const userNegocios = me.negocios?.map((n) => n.negocio) || [];

      if (userNegocios.length > 0) {
        const savedId = localStorage.getItem('active_business_id');
        const matched = userNegocios.find((n) => n.id === savedId) || userNegocios[0];

        localStorage.setItem('active_business_id', matched.id);
      // Al cambiar de negocio, la sede cacheada para /ai deja de valer.
      localStorage.removeItem('active_sede_id');
        localStorage.setItem('active_business_name', matched.nombre);
        setBusinessName(matched.nombre);
        return matched.id;
      }

      if (me.sedes && me.sedes.length > 0) {
        const firstSede = me.sedes[0].sede;
        localStorage.setItem('active_business_id', firstSede.negocioId);
      // Al cambiar de negocio, la sede cacheada para /ai deja de valer.
      localStorage.removeItem('active_sede_id');
        return firstSede.negocioId;
      }
    } catch (err) {
      console.warn('No se pudo verificar el perfil del usuario autenticado:', err);
    }

    return null;
  }, [customBusinessId]);

  // Carga inicial completa o refresco manual
  const fetchMetrics = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      try {
        if (!token) {
          throw new Error('No hay una sesión activa. Inicia sesión para visualizar los datos del negocio.');
        }

        const targetBusinessId = await resolveActiveBusiness();
        setResolvedBusinessId(targetBusinessId);

        if (!targetBusinessId && !customSedeId) {
          setHasNoBusiness(true);
          setPeriodMetrics(EMPTY_METRICS(periodo));
          setGeneralMetrics(EMPTY_METRICS(periodo));
          setAllTransactions([]);
          setIsLoading(false);
          setIsRefreshing(false);
          return;
        }

        setHasNoBusiness(false);

        // 1. Cargar Reporte Financiero real para el período activo y reporte acumulado
        let reportResult: ReporteFinanciero;
        if (customSedeId) {
          reportResult = await dashboardApi.getReporteSede(customSedeId, periodo);
        } else if (targetBusinessId) {
          reportResult = await dashboardApi.getReporteNegocio(targetBusinessId, periodo);
        } else {
          reportResult = EMPTY_METRICS(periodo);
        }

        if (reportResult?.negocio?.nombre) {
          setBusinessName(reportResult.negocio.nombre);
          localStorage.setItem('active_business_name', reportResult.negocio.nombre);
        }

        setPeriodMetrics(reportResult || EMPTY_METRICS(periodo));
        setGeneralMetrics(reportResult || EMPTY_METRICS(periodo));

        // 2. Cargar Transacciones reales de las sedes de este negocio
        try {
          let targetSedeIds: string[] = [];
          if (customSedeId) {
            targetSedeIds = [customSedeId];
          } else if (reportResult?.sedes && reportResult.sedes.length > 0) {
            targetSedeIds = reportResult.sedes.map((s) => s.sede.id);
          }

          if (targetSedeIds.length > 0) {
            const txList = await dashboardApi.getTransacciones(targetSedeIds);
            setAllTransactions(txList);
          } else {
            setAllTransactions([]);
          }
        } catch {
          setAllTransactions([]);
        }
      } catch (err: any) {
        console.error('Error al obtener métricas del dashboard:', err);
        const errorMsg = err?.message || 'Error de conexión con el servidor al cargar las métricas financieras.';
        setError(errorMsg);
        setPeriodMetrics(null);
        setGeneralMetrics(null);
        setAllTransactions([]);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, resolveActiveBusiness, customSedeId, periodo],
  );

  // Cambio de período rápido: SOLO actualiza la gráfica de gastos y el filtro de transacciones
  const handlePeriodChange = async (newPeriodo: PeriodoTipo) => {
    if (newPeriodo === periodo) return;
    setPeriodoState(newPeriodo);
    
    if (!resolvedBusinessId && !customSedeId) return;

    setIsChartLoading(true);
    try {
      let reportResult: ReporteFinanciero;
      if (customSedeId) {
        reportResult = await dashboardApi.getReporteSede(customSedeId, newPeriodo);
      } else if (resolvedBusinessId) {
        reportResult = await dashboardApi.getReporteNegocio(resolvedBusinessId, newPeriodo);
      } else {
        reportResult = EMPTY_METRICS(newPeriodo);
      }
      setPeriodMetrics(reportResult || EMPTY_METRICS(newPeriodo));
    } catch (err) {
      console.warn('Error al actualizar reporte por período:', err);
    } finally {
      setIsChartLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    const handleBusinessChange = () => {
      fetchMetrics(true);
    };
    window.addEventListener('business_changed', handleBusinessChange);
    return () => window.removeEventListener('business_changed', handleBusinessChange);
  }, [fetchMetrics]);

  // Transacciones filtradas según el período (Hoy / Esta semana / Últimos meses)
  const filteredTransactions = useMemo(() => {
    if (!allTransactions.length) return [];

    const now = new Date();

    if (periodo === 'diario') {
      const todayYear = now.getFullYear();
      const todayMonth = now.getMonth();
      const todayDate = now.getDate();
      return allTransactions.filter((tx) => {
        const d = new Date(tx.rawDate);
        return (
          d.getFullYear() === todayYear &&
          d.getMonth() === todayMonth &&
          d.getDate() === todayDate
        );
      });
    }

    if (periodo === 'semanal') {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(now.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return allTransactions.filter((tx) => new Date(tx.rawDate) >= sevenDaysAgo);
    }

    // 'mensual' -> últimos meses
    return allTransactions;
  }, [allTransactions, periodo]);

  const refreshMetrics = () => {
    return fetchMetrics(true);
  };

  return {
    metrics: periodMetrics || EMPTY_METRICS(periodo),
    generalMetrics: generalMetrics || EMPTY_METRICS('mensual'),
    transactions: filteredTransactions,
    periodo,
    setPeriodo: handlePeriodChange,
    isLoading,
    isChartLoading,
    isRefreshing,
    error,
    refreshMetrics,
    hasNoBusiness,
    businessId: resolvedBusinessId,
    businessName,
    user,
  };
}
