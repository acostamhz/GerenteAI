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
import { profileApi } from "@/features/shared-profile/api/profileApi";
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

  /*
   * IMPORTANTE:
   *
   * Antes estos estados comenzaban en null.
   *
   * Eso provocaba que RealCashflow intentara hacer:
   *
   * metrics.ingresos.total
   *
   * cuando metrics todavía era null.
   *
   * Ahora siempre existe una estructura válida.
   */
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
        localStorage.getItem("active_business_id") ||
        null
      );
    });

  const [businessName, setBusinessName] =
    useState<string>(() => {
      return (
        localStorage.getItem("active_business_name") ||
        "Mi Negocio"
      );
    });

  const [resolvedSedeId, setResolvedSedeId] =
    useState<string | null>(() => {
      if (customSedeId) {
        return customSedeId;
      }

      const s =
        localStorage.getItem("active_sede_id");

      return s && s !== "all" ? s : null;
    });

  const [sedeName, setSedeName] =
    useState<string>(() => {
      return (
        localStorage.getItem("active_sede_name") ||
        "Todas las sedes"
      );
    });

  const [hasNoBusiness, setHasNoBusiness] =
    useState<boolean>(false);

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  const [isChartLoading, setIsChartLoading] =
    useState<boolean>(false);

  const [isRefreshing, setIsRefreshing] =
    useState<boolean>(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Determinar el negocio activo sobre el que el usuario
   * realmente tiene permisos.
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

        /*
         * Si el usuario no tiene negocios ni sedes.
         */
        if (
          userNegocios.length === 0 &&
          (!me.sedes || me.sedes.length === 0)
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

        /*
         * Validar negocio guardado.
         */
        const matchedSaved =
          userNegocios.find(
            (n) => n.id === savedId,
          );

        if (matchedSaved) {
          if (savedName) {
            setBusinessName(savedName);
          } else {
            setBusinessName(
              matchedSaved.nombre,
            );

            localStorage.setItem(
              "active_business_name",
              matchedSaved.nombre,
            );
          }

          return matchedSaved.id;
        }

        /*
         * Si no hay negocio guardado válido,
         * utilizar el primero disponible.
         */
        if (userNegocios.length > 0) {
          const first = userNegocios[0];

          localStorage.setItem(
            "active_business_id",
            first.id,
          );

          localStorage.setItem(
            "active_business_name",
            first.nombre,
          );

          setBusinessName(first.nombre);

          return first.id;
        }

        /*
         * Fallback mediante una sede.
         */
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
   * Carga inicial completa o refresco manual.
   */
  const fetchMetrics = useCallback(
    async (isManualRefresh = false) => {
      setIsLoading(true);

      if (isManualRefresh) {
        setIsRefreshing(true);
      }

      setError(null);

      const startTime = Date.now();

      try {
        if (!token) {
          throw new Error(
            "No hay una sesión activa. Inicia sesión para visualizar los datos del negocio.",
          );
        }

        /*
         * Resolver negocio activo.
         */
        const targetBusinessId =
          await resolveActiveBusiness();

        setResolvedBusinessId(
          targetBusinessId,
        );

        /*
         * Resolver sede activa.
         */
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

        /*
         * No hay negocio ni sede.
         */
        if (
          !targetBusinessId &&
          !effectiveSedeId
        ) {
          setHasNoBusiness(true);

          const emptyMetrics =
            EMPTY_METRICS(periodo);

          setPeriodMetrics(
            emptyMetrics,
          );

          setGeneralMetrics(
            emptyMetrics,
          );

          setAllTransactions([]);

          setError(null);
          setIsLoading(false);
          setIsRefreshing(false);

          return;
        }

        setHasNoBusiness(false);

        /*
         * 1. Obtener reporte financiero real.
         */
        let reportResult: ReporteFinanciero;

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
        } else {
          reportResult =
            EMPTY_METRICS(periodo);
        }

        /*
         * Actualizar nombre del negocio si viene
         * en la respuesta del backend.
         */
        if (reportResult?.negocio?.nombre) {
          setBusinessName(
            reportResult.negocio.nombre,
          );

          localStorage.setItem(
            "active_business_name",
            reportResult.negocio.nombre,
          );
        }

        /*
         * Nunca guardar null.
         *
         * Si el backend devuelve algo inesperado,
         * utilizamos EMPTY_METRICS.
         */
        const safeReport =
          reportResult ||
          EMPTY_METRICS(periodo);

        setPeriodMetrics(
          safeReport,
        );

        setGeneralMetrics(
          safeReport,
        );

        /*
         * 2. Cargar transacciones reales.
         */
        try {
          let targetSedeIds: string[] = [];

          if (effectiveSedeId) {
            targetSedeIds = [
              effectiveSedeId,
            ];
          } else if (
            safeReport?.sedes &&
            safeReport.sedes.length > 0
          ) {
            targetSedeIds =
              safeReport.sedes.map(
                (s) => s.sede.id,
              );
          } else if (targetBusinessId) {
            const sedesList =
              await profileApi
                .getSedes(
                  targetBusinessId,
                )
                .catch(() => []);

            targetSedeIds =
              sedesList.map(
                (s) => s.id,
              );
          }

          if (
            targetSedeIds.length > 0
          ) {
            const txList =
              await dashboardApi.getTransacciones(
                targetSedeIds,
              );

            setAllTransactions(
              txList || [],
            );
          } else {
            setAllTransactions([]);
          }
        } catch {
          /*
           * Si falla únicamente la carga de
           * transacciones, no hacemos caer las métricas.
           */
          setAllTransactions([]);
        }
      } catch (err: any) {
        console.error(
          "Error al obtener métricas del dashboard:",
          err,
        );

        const errorMsg =
          err?.message ||
          "Error de conexión con el servidor al cargar las métricas financieras.";

        /*
         * Si el error corresponde a permisos,
         * limpiar selección residual.
         */
        if (
          errorMsg
            .toLowerCase()
            .includes("permisos") ||
          errorMsg
            .toLowerCase()
            .includes("no tienes")
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
          setBusinessName("Sin Negocio");
          setSedeName("Sin Sede");
          setError(null);
        } else {
          setError(errorMsg);
        }

        /*
         * IMPORTANTE:
         *
         * Antes aquí se hacía:
         *
         * setPeriodMetrics(null)
         * setGeneralMetrics(null)
         *
         * Eso podía provocar nuevamente:
         *
         * Cannot read properties of null
         *
         * Ahora siempre mantenemos una estructura válida.
         */
        setPeriodMetrics(
          EMPTY_METRICS(periodo),
        );

        setGeneralMetrics(
          EMPTY_METRICS(periodo),
        );

        setAllTransactions([]);
      } finally {
        /*
         * Garantizar al menos 280ms para una transición
         * visual suave del skeleton.
         */
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
    ],
  );

  /*
   * Cambio de período.
   */
  const handlePeriodChange = async (
    newPeriodo: PeriodoTipo,
  ) => {
    if (newPeriodo === periodo) {
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
      let reportResult: ReporteFinanciero;

      if (effectiveSedeId) {
        reportResult =
          await dashboardApi.getReporteSede(
            effectiveSedeId,
            newPeriodo,
          );
      } else if (resolvedBusinessId) {
        reportResult =
          await dashboardApi.getReporteNegocio(
            resolvedBusinessId,
            newPeriodo,
          );
      } else {
        reportResult =
          EMPTY_METRICS(newPeriodo);
      }

      /*
       * Nunca dejar metrics en null.
       */
      setPeriodMetrics(
        reportResult ||
          EMPTY_METRICS(newPeriodo),
      );
    } catch (err: any) {
      console.warn(
        "Error al cambiar período:",
        err,
      );

      /*
       * Mantener una estructura válida incluso
       * si falla el cambio de período.
       */
      setPeriodMetrics(
        EMPTY_METRICS(newPeriodo),
      );
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
   * Escuchar cambios de selección global.
   */
  useEffect(() => {
    const handleBusinessChange = () => {
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
        sName || "Todas las sedes",
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

  /*
   * Determinar si estamos viendo todas las sedes.
   */
  const isConsolidated = useMemo(() => {
    return (
      !resolvedSedeId ||
      resolvedSedeId === "all"
    );
  }, [resolvedSedeId]);

  return {
    metrics: periodMetrics,

    generalMetrics:
      generalMetrics || periodMetrics,

    transactions: allTransactions,

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