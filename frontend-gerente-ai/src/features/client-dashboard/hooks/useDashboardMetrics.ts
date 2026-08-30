import {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";

import { useAuth } from "@/features/auth";

import {
  PeriodoTipo,
  ReporteFinanciero,
  DashboardTransactionItem,
} from "../types";

import { dashboardApi } from "../api/dashboardApi";

import {
  profileApi,
} from "@/features/shared-profile/api/profileApi";

import { apiClient } from "@/lib/apiClient";

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

const EMPTY_METRICS = (
  periodo: PeriodoTipo,
): ReporteFinanciero => ({
  periodo: {
    tipo: periodo,
    desde: new Date().toISOString(),
    hasta: new Date().toISOString(),
    zonaHoraria: "UTC-5",
  },

  ingresos: {
    ventasContado: 0,
    abonos: 0,
    total: 0,
  },

  egresos: {
    compras: 0,
    gastos: 0,
    total: 0,
  },

  balance: 0,

  informativo: {
    ventasFiado: 0,
    ventasTotales: 0,

    conteos: {
      ventas: 0,
      abonos: 0,
      compras: 0,
      gastos: 0,
    },
  },
});

export function useDashboardMetrics(
  customBusinessId?: string,
  customSedeId?: string,
) {
  const { user, token } = useAuth();

  const [periodo, setPeriodoState] =
    useState<PeriodoTipo>("mensual");

  const [periodMetrics, setPeriodMetrics] =
    useState<ReporteFinanciero>(
      EMPTY_METRICS("mensual"),
    );

  const [generalMetrics, setGeneralMetrics] =
    useState<ReporteFinanciero>(
      EMPTY_METRICS("mensual"),
    );

  const [allTransactions, setAllTransactions] =
    useState<DashboardTransactionItem[]>([]);

  const [resolvedBusinessId, setResolvedBusinessId] =
    useState<string | null>(() => {
      return (
        customBusinessId ||
        localStorage.getItem(
          "active_business_id",
        ) ||
        null
      );
    });

  const [businessName, setBusinessName] =
    useState<string>(() => {
      return (
        localStorage.getItem(
          "active_business_name",
        ) || "Mi Negocio"
      );
    });

  const [resolvedSedeId, setResolvedSedeId] =
    useState<string | null>(() => {
      if (customSedeId) {
        return customSedeId;
      }

      const sedeId =
        localStorage.getItem(
          "active_sede_id",
        );

      return sedeId && sedeId !== "all"
        ? sedeId
        : null;
    });

  const [sedeName, setSedeName] =
    useState<string>(() => {
      return (
        localStorage.getItem(
          "active_sede_name",
        ) || "Todas las sedes"
      );
    });

  const [hasNoBusiness, setHasNoBusiness] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isChartLoading, setIsChartLoading] =
    useState(false);

  const [isRefreshing, setIsRefreshing] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Resolver negocio activo.
   */
  const resolveActiveBusiness = useCallback(
    async (): Promise<string | null> => {
      if (customBusinessId) {
        return customBusinessId;
      }

      try {
        const me =
          await apiClient<UsuarioMeResponse>(
            "/auth/usuarios/me",
          );

        const userNegocios =
          me.negocios?.map(
            (n) => n.negocio,
          ) || [];

        if (
          userNegocios.length === 0 &&
          (!me.sedes ||
            me.sedes.length === 0)
        ) {
          localStorage.removeItem(
            "active_business_id",
          );

          localStorage.removeItem(
            "active_business_name",
          );

          localStorage.removeItem(
            "active_sede_id",
          );

          localStorage.removeItem(
            "active_sede_name",
          );

          setBusinessName("Sin Negocio");
          setSedeName("Sin Sede");
          setHasNoBusiness(true);

          return null;
        }

        const savedId =
          localStorage.getItem(
            "active_business_id",
          );

        const savedName =
          localStorage.getItem(
            "active_business_name",
          );

        const matchedSaved =
          userNegocios.find(
            (n) => n.id === savedId,
          );

        if (matchedSaved) {
          setBusinessName(
            savedName ||
              matchedSaved.nombre,
          );

          if (!savedName) {
            localStorage.setItem(
              "active_business_name",
              matchedSaved.nombre,
            );
          }

          return matchedSaved.id;
        }

        if (userNegocios.length > 0) {
          const first =
            userNegocios[0];

          localStorage.setItem(
            "active_business_id",
            first.id,
          );

          localStorage.setItem(
            "active_business_name",
            first.nombre,
          );

          setBusinessName(
            first.nombre,
          );

          return first.id;
        }

        if (
          me.sedes &&
          me.sedes.length > 0
        ) {
          const firstSede =
            me.sedes[0].sede;

          localStorage.setItem(
            "active_business_id",
            firstSede.negocioId,
          );

          setBusinessName(
            "Mi Negocio",
          );

          return firstSede.negocioId;
        }
      } catch (err) {
        console.warn(
          "No se pudo verificar el perfil del usuario autenticado:",
          err,
        );
      }

      return null;
    },
    [customBusinessId],
  );

  /*
   * Resolver las sedes que deben alimentar Cashflow.
   */
  const resolveSedeIds = useCallback(
    async (
      businessId: string | null,
      sedeId: string | null,
      report?: ReporteFinanciero,
    ): Promise<string[]> => {
      if (sedeId) {
        return [sedeId];
      }

      if (
        report?.sedes &&
        report.sedes.length > 0
      ) {
        return report.sedes.map(
          (s) => s.sede.id,
        );
      }

      if (!businessId) {
        return [];
      }

      const sedesList =
        await profileApi
          .getSedes(businessId)
          .catch(() => []);

      return sedesList.map(
        (s) => s.id,
      );
    },
    [],
  );

  /*
   * Cargar transacciones.
   *
   * Las transacciones se obtienen desde las sedes
   * autorizadas del negocio.
   */
  const loadTransactions = useCallback(
    async (
      businessId: string | null,
      sedeId: string | null,
      report?: ReporteFinanciero,
    ) => {
      try {
        const targetSedeIds =
          await resolveSedeIds(
            businessId,
            sedeId,
            report,
          );

        if (
          targetSedeIds.length === 0
        ) {
          setAllTransactions([]);
          return;
        }

        const txList =
          await dashboardApi.getTransacciones(
            targetSedeIds,
          );

        setAllTransactions(
          txList || [],
        );
      } catch (err) {
        console.warn(
          "No se pudieron cargar las transacciones:",
          err,
        );

        setAllTransactions([]);
      }
    },
    [resolveSedeIds],
  );

  /*
   * Carga principal.
   */
  const fetchMetrics = useCallback(
    async (
      isManualRefresh = false,
    ) => {
      setIsLoading(true);

      if (isManualRefresh) {
        setIsRefreshing(true);
      }

      setError(null);

      const startTime =
        Date.now();

      try {
        if (!token) {
          throw new Error(
            "No hay una sesión activa. Inicia sesión para visualizar los datos del negocio.",
          );
        }

        const targetBusinessId =
          await resolveActiveBusiness();

        setResolvedBusinessId(
          targetBusinessId,
        );

        const currentSedeStorage =
          localStorage.getItem(
            "active_sede_id",
          );

        const effectiveSedeId =
          customSedeId ||
          (currentSedeStorage &&
          currentSedeStorage !== "all"
            ? currentSedeStorage
            : null);

        setResolvedSedeId(
          effectiveSedeId,
        );

        const currentSedeName =
          localStorage.getItem(
            "active_sede_name",
          );

        setSedeName(
          effectiveSedeId
            ? currentSedeName ||
                "Sede Seleccionada"
            : "Todas las sedes",
        );

        if (
          !targetBusinessId &&
          !effectiveSedeId
        ) {
          setHasNoBusiness(true);

          const empty =
            EMPTY_METRICS(periodo);

          setPeriodMetrics(empty);
          setGeneralMetrics(empty);
          setAllTransactions([]);

          setIsLoading(false);
          setIsRefreshing(false);

          return;
        }

        setHasNoBusiness(false);

        /*
         * Obtener reporte financiero.
         */
        let reportResult:
          | ReporteFinanciero
          | undefined;

        if (effectiveSedeId) {
          reportResult =
            await dashboardApi.getReporteSede(
              effectiveSedeId,
              periodo,
            );
        } else if (targetBusinessId) {
          reportResult =
            await dashboardApi.getReporteNegocio(
              targetBusinessId,
              periodo,
            );
        }

        const safeReport =
          reportResult ||
          EMPTY_METRICS(periodo);

        if (
          safeReport?.negocio?.nombre
        ) {
          setBusinessName(
            safeReport.negocio.nombre,
          );

          localStorage.setItem(
            "active_business_name",
            safeReport.negocio.nombre,
          );
        }

        setPeriodMetrics(
          safeReport,
        );

        setGeneralMetrics(
          safeReport,
        );

        /*
         * Obtener movimientos.
         */
        await loadTransactions(
          targetBusinessId,
          effectiveSedeId,
          safeReport,
        );
      } catch (err: any) {
        console.error(
          "Error al obtener métricas del dashboard:",
          err,
        );

        const errorMsg =
          err?.message ||
          "Error de conexión con el servidor al cargar las métricas financieras.";

        const lower =
          errorMsg.toLowerCase();

        if (
          lower.includes("permisos") ||
          lower.includes("no tienes")
        ) {
          localStorage.removeItem(
            "active_business_id",
          );

          localStorage.removeItem(
            "active_business_name",
          );

          localStorage.removeItem(
            "active_sede_id",
          );

          localStorage.removeItem(
            "active_sede_name",
          );

          setHasNoBusiness(true);
          setBusinessName(
            "Sin Negocio",
          );
          setSedeName("Sin Sede");
          setError(null);
        } else {
          setError(errorMsg);
        }

        setPeriodMetrics(
          EMPTY_METRICS(periodo),
        );

        setGeneralMetrics(
          EMPTY_METRICS(periodo),
        );

        setAllTransactions([]);
      } finally {
        const elapsed =
          Date.now() - startTime;

        if (elapsed < 280) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                280 - elapsed,
              ),
          );
        }

        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [
      token,
      resolveActiveBusiness,
      customSedeId,
      periodo,
      loadTransactions,
    ],
  );

  /*
   * Cambio de período.
   *
   * IMPORTANTE:
   * Se actualizan tanto las métricas como las transacciones.
   */
  const handlePeriodChange = async (
    newPeriodo: PeriodoTipo,
  ) => {
    if (
      newPeriodo === periodo
    ) {
      return;
    }

    setPeriodoState(newPeriodo);

    const currentSedeStorage =
      localStorage.getItem(
        "active_sede_id",
      );

    const effectiveSedeId =
      customSedeId ||
      (currentSedeStorage &&
      currentSedeStorage !== "all"
        ? currentSedeStorage
        : null);

    if (
      !resolvedBusinessId &&
      !effectiveSedeId
    ) {
      return;
    }

    setIsChartLoading(true);

    try {
      let reportResult:
        | ReporteFinanciero
        | undefined;

      if (effectiveSedeId) {
        reportResult =
          await dashboardApi.getReporteSede(
            effectiveSedeId,
            newPeriodo,
          );
      } else if (
        resolvedBusinessId
      ) {
        reportResult =
          await dashboardApi.getReporteNegocio(
            resolvedBusinessId,
            newPeriodo,
          );
      }

      const safeReport =
        reportResult ||
        EMPTY_METRICS(
          newPeriodo,
        );

      setPeriodMetrics(
        safeReport,
      );

      /*
       * Actualizar transacciones también.
       */
      await loadTransactions(
        resolvedBusinessId,
        effectiveSedeId,
        safeReport,
      );
    } catch (err) {
      console.warn(
        "Error al cambiar período:",
        err,
      );

      setPeriodMetrics(
        EMPTY_METRICS(
          newPeriodo,
        ),
      );

      setAllTransactions([]);
    } finally {
      setIsChartLoading(false);
    }
  };

  /*
   * Carga inicial.
   */
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  /*
   * Cambios de negocio/sede.
   */
  useEffect(() => {
    const handleBusinessChange =
      () => {
        const bId =
          localStorage.getItem(
            "active_business_id",
          );

        const bName =
          localStorage.getItem(
            "active_business_name",
          );

        const sId =
          localStorage.getItem(
            "active_sede_id",
          );

        const sName =
          localStorage.getItem(
            "active_sede_name",
          );

        setResolvedBusinessId(
          bId,
        );

        setBusinessName(
          bName || "Mi Negocio",
        );

        setResolvedSedeId(
          sId && sId !== "all"
            ? sId
            : null,
        );

        setSedeName(
          sName ||
            "Todas las sedes",
        );

        fetchMetrics(true);
      };

    window.addEventListener(
      "storage",
      handleBusinessChange,
    );

    window.addEventListener(
      "business-changed",
      handleBusinessChange,
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleBusinessChange,
      );

      window.removeEventListener(
        "business-changed",
        handleBusinessChange,
      );
    };
  }, [fetchMetrics]);

  const isConsolidated =
    useMemo(() => {
      return (
        !resolvedSedeId ||
        resolvedSedeId === "all"
      );
    }, [resolvedSedeId]);

  return {
    user,

    metrics: periodMetrics,

    generalMetrics:
      generalMetrics ||
      periodMetrics,

    transactions:
      allTransactions,

    isLoading,

    isChartLoading,

    isRefreshing,

    error,

    hasNoBusiness,

    refreshMetrics: () =>
      fetchMetrics(true),

    periodo,

    setPeriodo:
      handlePeriodChange,

    businessName,

    sedeName,

    businessId:
      resolvedBusinessId,

    sedeId:
      resolvedSedeId,

    isConsolidated,
  };
}