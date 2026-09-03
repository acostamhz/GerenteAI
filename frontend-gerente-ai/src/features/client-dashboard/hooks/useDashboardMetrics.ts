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
  ReporteFiados,
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
    useState<PeriodoTipo>(
      "mensual",
    );

  const [
    periodMetrics,
    setPeriodMetrics,
  ] = useState<ReporteFinanciero>(
    EMPTY_METRICS("mensual"),
  );

  const [
    generalMetrics,
    setGeneralMetrics,
  ] = useState<ReporteFinanciero>(
    EMPTY_METRICS("mensual"),
  );

  const [
    allTransactions,
    setAllTransactions,
  ] = useState<
    DashboardTransactionItem[]
  >([]);

  /*
   * Cartera real.
   */
  const [fiados, setFiados] =
    useState<ReporteFiados | null>(
      null,
    );

  const [
    resolvedBusinessId,
    setResolvedBusinessId,
  ] = useState<string | null>(() => {
    return (
      customBusinessId ||
      localStorage.getItem(
        "active_business_id",
      ) ||
      null
    );
  });

  const [
    businessName,
    setBusinessName,
  ] = useState<string>(() => {
    return (
      localStorage.getItem(
        "active_business_name",
      ) || "Mi Negocio"
    );
  });

  const [
    resolvedSedeId,
    setResolvedSedeId,
  ] = useState<string | null>(() => {
    if (customSedeId) {
      return customSedeId;
    }

    const sedeId =
      localStorage.getItem(
        "active_sede_id",
      );

    return sedeId &&
      sedeId !== "all"
      ? sedeId
      : null;
  });

  const [
    sedeName,
    setSedeName,
  ] = useState<string>(() => {
    return (
      localStorage.getItem(
        "active_sede_name",
      ) || "Todas las sedes"
    );
  });

  const [
    hasNoBusiness,
    setHasNoBusiness,
  ] = useState(false);

  const [
    isLoading,
    setIsLoading,
  ] = useState(true);

  const [
    isChartLoading,
    setIsChartLoading,
  ] = useState(false);

  const [
    isRefreshing,
    setIsRefreshing,
  ] = useState(false);

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(() => new Date());

  const [
    isFiadosLoading,
    setIsFiadosLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

  /*
   * ============================================================
   * RESOLVER NEGOCIO ACTIVO
   * ============================================================
   */
  const resolveActiveBusiness =
    useCallback(
      async (): Promise<
        string | null
      > => {
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
            userNegocios.length ===
              0 &&
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

            setBusinessName(
              "Sin Negocio",
            );

            setSedeName(
              "Sin Sede",
            );

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
              (n) =>
                n.id === savedId,
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

          if (
            userNegocios.length > 0
          ) {
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
   * ============================================================
   * RESOLVER SEDES
   * ============================================================
   */
  const resolveSedeIds =
    useCallback(
      async (
        businessId: string | null,
        sedeId: string | null,
        report?: ReporteFinanciero,
      ): Promise<string[]> => {
        if (sedeId && sedeId !== "all") {
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

        if ((report as any)?.sede?.id) {
          return [(report as any).sede.id];
        }

        const targetBizId =
          businessId ||
          localStorage.getItem("active_business_id");

        if (!targetBizId) {
          return [];
        }

        const sedesList =
          await profileApi
            .getSedes(targetBizId)
            .catch(() => []);

        return sedesList.map(
          (s) => s.id,
        );
      },
      [],
    );

  /*
   * ============================================================
   * CARGAR TRANSACCIONES
   * ============================================================
   */

  /*
   * ============================================================
   * CÁLCULO DE MÉTRICAS HISTÓRICAS ACUMULADAS
   * ============================================================
   *
   * El backend solo calcula reportes para periodos específicos
   * (diario, semanal, mensual). Para conocer el Saldo Total
   * Acumulado de la caja real del negocio/sede, se consolidan
   * el 100% de las transacciones históricas:
   *
   * Ingresos Reales: Ventas Contado + Abonos
   * Egresos Reales: Compras + Gastos Operativos
   * Saldo Total = Ingresos Reales - Egresos Reales
   */
  const calcularMetricasHistoricas = useCallback(
    (
      transactions: DashboardTransactionItem[],
      baseReport: ReporteFinanciero,
    ): ReporteFinanciero => {
      let ventasContado = 0;
      let ventasFiado = 0;
      let abonos = 0;
      let compras = 0;
      let gastos = 0;

      for (const t of transactions) {
        const amount = Number(t.amount) || 0;
        switch (t.type) {
          case "Venta":
            ventasContado += amount;
            break;
          case "Abono":
            abonos += amount;
            break;
          case "Gasto":
            gastos += amount;
            break;
          case "Compra":
            compras += amount;
            break;
          case "Convertida":
            ventasFiado += amount;
            break;
          default:
            break;
        }
      }

      const totalIngresos = ventasContado + abonos;
      const totalEgresos = compras + gastos;
      const balance = totalIngresos - totalEgresos;

      return {
        ...baseReport,
        ingresos: {
          ventasContado,
          abonos,
          total: totalIngresos,
        },
        egresos: {
          compras,
          gastos,
          total: totalEgresos,
        },
        balance,
        informativo: {
          ...baseReport.informativo,
          ventasFiado,
          ventasTotales: ventasContado + ventasFiado,
          conteos: {
            ventas: transactions.filter(
              (t) => t.type === "Venta" || t.type === "Convertida",
            ).length,
            abonos: transactions.filter((t) => t.type === "Abono").length,
            compras: transactions.filter((t) => t.type === "Compra").length,
            gastos: transactions.filter((t) => t.type === "Gasto").length,
          },
        },
      };
    },
    [],
  );

  const loadTransactions =
    useCallback(
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
            setGeneralMetrics(EMPTY_METRICS("mensual"));
            return;
          }

          const rawTransactions =
            await dashboardApi.getTransacciones(
              targetSedeIds,
            );

          setAllTransactions(
            rawTransactions,
          );

          /*
           * Consolidar Saldo Total Acumulado Histórico con el 100% de registros
           */
          setGeneralMetrics((prevMetrics) => {
            const base = report || prevMetrics;
            return calcularMetricasHistoricas(
              rawTransactions,
              base,
            );
          });
        } catch (err) {
          console.warn(
            "No se pudieron cargar transacciones detalladas:",
            err,
          );

          setAllTransactions([]);
        }
      },
      [resolveSedeIds, calcularMetricasHistoricas],
    );

  /*
   * ============================================================
   * CARGAR FIADOS
   * ============================================================
   *
   * Consulta directa al backend:
   * GET /reportes/fiados/:sedeId
   *
   * Si el plan no tiene la funcionalidad 'reporte_fiados',
   * el backend responde 403 y getFiados retorna null de forma segura.
   */

  const loadFiados =
    useCallback(
      async (
        businessId: string | null,
        sedeId: string | null,
        report?: ReporteFinanciero,
        isSilent = false,
      ) => {
        if (!isSilent) {
          setIsFiadosLoading(
            true,
          );
        }

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
            setFiados(null);
            return;
          }

          const reportesRaw =
            await Promise.all(
              targetSedeIds.map(
                (id) =>
                  dashboardApi.getFiados(
                    id,
                  ),
              ),
            );

          const reportes = reportesRaw.filter(
            (r): r is ReporteFiados => r !== null,
          );

          if (
            reportes.length === 0
          ) {
            setFiados(null);
            return;
          }

          /*
           * Una sola sede:
           * conservar exactamente la respuesta
           * del backend.
           */
          if (
            reportes.length === 1
          ) {
            setFiados(
              reportes[0],
            );

            return;
          }

          /*
           * ======================================================
           * CONSOLIDACIÓN DE VARIAS SEDES
           * ======================================================
           */
          const clientesMap =
            new Map<
              string,
              ReporteFiados["clientes"][number]
            >();

          for (const reporte of reportes) {
            for (const cliente of reporte.clientes) {
              const existente =
                clientesMap.get(
                  cliente.id,
                );

              if (!existente) {
                clientesMap.set(
                  cliente.id,
                  {
                    ...cliente,

                    ventas: [
                      ...cliente.ventas,
                    ],
                  },
                );

                continue;
              }

              existente.saldoPendiente +=
                cliente.saldoPendiente;

              existente.vencido +=
                cliente.vencido;

              existente.diasDeLaDeudaMasAntigua =
                Math.max(
                  existente.diasDeLaDeudaMasAntigua,
                  cliente.diasDeLaDeudaMasAntigua,
                );

              existente.ventas.push(
                ...cliente.ventas,
              );
            }
          }

          const clientes = [
            ...clientesMap.values(),
          ].sort(
            (a, b) =>
              b.vencido -
                a.vencido ||
              b.saldoPendiente -
                a.saldoPendiente,
          );

          const porCobrar =
            clientes.reduce(
              (sum, cliente) =>
                sum +
                cliente.saldoPendiente,
              0,
            );

          const vencido =
            clientes.reduce(
              (sum, cliente) =>
                sum +
                cliente.vencido,
              0,
            );

          const ventasPendientes =
            clientes.reduce(
              (sum, cliente) =>
                sum +
                cliente.ventas.length,
              0,
            );

          setFiados({
            sede: {
              id: "consolidado",
              nombre:
                "Todas las sedes",
            },

            generadoEl:
              new Date().toISOString(),

            totales: {
              porCobrar,

              vencido,

              clientesConDeuda:
                clientes.length,

              ventasPendientes,
            },

            clientes,
          });
        } catch (err: any) {
          if (err?.statusCode !== 403) {
            console.warn(
              "No se pudo cargar la cartera:",
              err,
            );
          }

          setFiados(null);
        } finally {
          if (!isSilent) {
            setIsFiadosLoading(
              false,
            );
          }
        }
      },
      [resolveSedeIds],
    );

  /*
   * ============================================================
   * CARGA PRINCIPAL
   * ============================================================
   */
  const fetchMetrics =
    useCallback(
      async (
        isManualRefresh = false,
        isSilent = false,
      ) => {
        if (!isSilent) {
          setIsLoading(true);
        }

        if (isManualRefresh || isSilent) {
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
            currentSedeStorage !==
              "all"
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
            setHasNoBusiness(
              true,
            );

            const empty =
              EMPTY_METRICS(
                periodo,
              );

            setPeriodMetrics(
              empty,
            );

            setGeneralMetrics(
              empty,
            );

            setAllTransactions(
              [],
            );

            setFiados(null);

            setIsLoading(false);

            setIsRefreshing(false);

            return;
          }

          setHasNoBusiness(
            false,
          );

          let reportResult:
            | ReporteFinanciero
            | undefined;

          if (effectiveSedeId) {
            reportResult =
              await dashboardApi.getReporteSede(
                effectiveSedeId,
                periodo,
              );
          } else if (
            targetBusinessId
          ) {
            reportResult =
              await dashboardApi.getReporteNegocio(
                targetBusinessId,
                periodo,
              );
          }

          const safeReport =
            reportResult ||
            EMPTY_METRICS(
              periodo,
            );

          if (
            safeReport?.negocio
              ?.nombre
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

          /*
           * Cargar movimientos y cartera en paralelo para máxima velocidad.
           * loadTransactions se encarga de calcular el Saldo Total Histórico
           * con el 100% de los registros y actualizar generalMetrics.
           */
          await Promise.all([
            loadTransactions(
              targetBusinessId,
              effectiveSedeId,
              safeReport,
            ),
            loadFiados(
              targetBusinessId,
              effectiveSedeId,
              safeReport,
              isSilent,
            ),
          ]);
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
            lower.includes(
              "permisos",
            ) ||
            lower.includes(
              "no tienes",
            )
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

            setHasNoBusiness(
              true,
            );

            setBusinessName(
              "Sin Negocio",
            );

            setSedeName(
              "Sin Sede",
            );

            setError(null);
          } else {
            setError(
              errorMsg,
            );
          }

          setPeriodMetrics(
            EMPTY_METRICS(
              periodo,
            ),
          );

          setGeneralMetrics(
            EMPTY_METRICS(
              periodo,
            ),
          );

          setAllTransactions(
            [],
          );

          setFiados(null);
        } finally {
          const elapsed =
            Date.now() -
            startTime;

          if (!isSilent && elapsed < 280) {
            await new Promise(
              (resolve) =>
                setTimeout(
                  resolve,
                  280 - elapsed,
                ),
            );
          }

          if (!isSilent) {
            setIsLoading(false);
          }

          setIsRefreshing(
            false,
          );

          setLastUpdated(new Date());
        }
      },
      [
        token,
        resolveActiveBusiness,
        customSedeId,
        periodo,
        loadTransactions,
        loadFiados,
      ],
    );

  /**
   * Registra un abono en el backend y sincroniza tanto la cartera de fiados
   * como el flujo de caja en tiempo real.
   *
   * Flujo:
   * UI (PendingCashflow) -> POST /abonos -> fetchMetrics(false, true)
   */
  const registerPayment =
    useCallback(
      async (
        clienteId: string,
        ventaId: string,
        monto: number,
      ): Promise<void> => {
        if (!clienteId) {
          throw new Error(
            "No se indicó el cliente del abono.",
          );
        }

        if (!ventaId) {
          throw new Error(
            "No se indicó la venta que se está pagando.",
          );
        }

        if (
          !Number.isFinite(monto) ||
          monto <= 0
        ) {
          throw new Error(
            "El monto del abono debe ser mayor que cero.",
          );
        }

        /*
         * POST /abonos
         */
        await apiClient(
          "/abonos",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              clienteId,

              ventaId,

              monto,
            }),
          },
        );

        /*
         * IMPORTANTE:
         * Refresca silenciosamente las métricas financieras (ingreso en caja),
         * las transacciones y la cartera de fiados de forma atómica.
         */
        await fetchMetrics(false, true);
      },
      [fetchMetrics],
    );

  /*
   * ============================================================
   * CAMBIO DE PERÍODO
   * ============================================================
   */
  const handlePeriodChange =
    async (
      newPeriodo: PeriodoTipo,
    ) => {
      if (
        newPeriodo === periodo
      ) {
        return;
      }

      setPeriodoState(
        newPeriodo,
      );

      const currentSedeStorage =
        localStorage.getItem(
          "active_sede_id",
        );

      const effectiveSedeId =
        customSedeId ||
        (currentSedeStorage &&
        currentSedeStorage !==
          "all"
          ? currentSedeStorage
          : null);

      if (
        !resolvedBusinessId &&
        !effectiveSedeId
      ) {
        return;
      }

      setIsChartLoading(
        true,
      );

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

        await loadTransactions(
          resolvedBusinessId,
          effectiveSedeId,
          safeReport,
        );

        await loadFiados(
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

        setAllTransactions(
          [],
        );
      } finally {
        setIsChartLoading(
          false,
        );
      }
    };

  /*
   * ============================================================
   * CARGA INICIAL
   * ============================================================
   */
  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  /*
   * ============================================================
   * CAMBIOS DE NEGOCIO / SEDE
   * ============================================================
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
          bName ||
            "Mi Negocio",
        );

        setResolvedSedeId(
          sId &&
            sId !== "all"
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

  /*
   * ============================================================
   * MOTOR DE TIEMPO REAL (ZERO-FLICKER REALTIME)
   * ============================================================
   * 1. Polling silencioso adaptativo cada 8s (solo si document.visibilityState === 'visible')
   * 2. Revalidación inmediata al hacer focus en la ventana o cambiar visibilidad
   * 3. Sincronización multi-pestaña con BroadcastChannel
   */
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let channel: BroadcastChannel | null = null;

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("luka_realtime_sync");
        channel.onmessage = (event) => {
          if (event.data?.type === "REFRESH_DASHBOARD") {
            void fetchMetrics(false, true);
          }
        };
      }
    } catch {
      // Ignorar si el navegador restringe BroadcastChannel
    }

    const startPolling = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        if (
          typeof document !== "undefined" &&
          document.visibilityState === "visible"
        ) {
          void fetchMetrics(false, true);
        }
      }, 8000);
    };

    const handleVisibilityOrFocus = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        void fetchMetrics(false, true);
        startPolling();
      } else {
        if (timer) {
          clearInterval(timer);
          timer = null;
        }
      }
    };

    startPolling();
    window.addEventListener("focus", handleVisibilityOrFocus);
    document.addEventListener("visibilitychange", handleVisibilityOrFocus);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener("focus", handleVisibilityOrFocus);
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      if (channel) {
        channel.close();
      }
    };
  }, [fetchMetrics]);

  /*
   * ============================================================
   * CONSOLIDADO
   * ============================================================
   */
  const isConsolidated =
    useMemo(() => {
      return (
        !resolvedSedeId ||
        resolvedSedeId ===
          "all"
      );
    }, [resolvedSedeId]);

  /*
   * ============================================================
   * RETURN
   * ============================================================
   */
  return {
    user,

    metrics:
      periodMetrics,

    generalMetrics:
      generalMetrics ||
      periodMetrics,

    transactions:
      allTransactions,

    /*
     * Cartera real.
     */
    fiados,

    isFiadosLoading,

    isLoading,

    isChartLoading,

    isRefreshing,

    lastUpdated,

    error,

    hasNoBusiness,

    /*
     * Refrescar todo el dashboard.
     */
    refreshMetrics: () =>
      fetchMetrics(true),

    /*
     * Refrescar solamente cartera.
     */
    refreshFiados: () =>
      loadFiados(
        resolvedBusinessId,
        resolvedSedeId,
        periodMetrics,
      ),

    /*
     * Registrar un abono real.
     */
    registerPayment,

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