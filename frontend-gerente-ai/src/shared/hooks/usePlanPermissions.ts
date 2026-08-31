import {
  useState,
  useEffect,
  useCallback,
} from "react";

import { useAuth } from "@/features/auth";
import { profileApi } from "@/features/shared-profile/api/profileApi";

import {
  planesApi,
  PlanBackend,
  PLANES_FALLBACK,
} from "@/shared/api/planesApi";

export function usePlanPermissions() {
  const { user, token } = useAuth();

  const [catalogo, setCatalogo] =
    useState<PlanBackend[]>(PLANES_FALLBACK);

  const [cantidadNegocios, setCantidadNegocios] =
    useState<number>(0);

  const [planUsuarioId, setPlanUsuarioId] =
    useState<number>(1);

  const [isLoading, setIsLoading] =
    useState<boolean>(true);

  // ============================================================
  // PAYWALL
  // ============================================================

  const [isPaywallOpen, setIsPaywallOpen] =
    useState<boolean>(false);

  const [paywallMotivo, setPaywallMotivo] =
    useState<string>("");

  const [paywallPlanRecomendadoId, setPaywallPlanRecomendadoId] =
    useState<number>(2);

  // ============================================================
  // CARGAR DATOS
  // ============================================================

  const cargarDatos = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // ========================================================
      // CATÁLOGO + PERFIL
      // ========================================================

      const [planes, perfil] = await Promise.all([
        planesApi.getPlanesCatalogo(),

        profileApi.getMe().catch(() => null),
      ]);

      if (Array.isArray(planes) && planes.length > 0) {
        setCatalogo(planes);
      }

      // ========================================================
      // NEGOCIO ACTIVO
      // ========================================================

      const activeNegocioId =
        localStorage.getItem("active_business_id");

      // ========================================================
      // MASTER
      // ========================================================

      const isMaster =
        perfil?.rolGlobal === "MASTER" ||
        user?.rolGlobal === "MASTER";

      // ========================================================
      // DETERMINAR PLAN
      // ========================================================

      let resolvedPlan = 1;

      /*
       * MASTER
       *
       * Los usuarios MASTER tienen acceso equivalente
       * al Plan Administrador.
       */
      if (isMaster) {
        resolvedPlan = 3;
      }

      /*
       * USUARIO NORMAL
       *
       * El plan se obtiene exclusivamente desde
       * el negocio activo.
       */
      else if (activeNegocioId) {
        try {
          const negocioPlan =
            await planesApi.getNegocioPlan(
              activeNegocioId,
            );

          const backendPlan =
            negocioPlan?.plan !== null &&
            negocioPlan?.plan !== undefined
              ? Number(negocioPlan.plan)
              : NaN;

          if (
            Number.isFinite(backendPlan) &&
            backendPlan >= 1
          ) {
            resolvedPlan = backendPlan;
          } else {
            console.warn(
              "[usePlanPermissions] El backend no devolvió un plan válido para el negocio activo.",
              {
                negocioId: activeNegocioId,
                negocioPlan,
              },
            );
          }
        } catch (error) {
          console.error(
            "[usePlanPermissions] Error obteniendo el plan del negocio:",
            error,
          );
        }
      }

      /*
       * SIN NEGOCIO ACTIVO
       *
       * No usamos localStorage para determinar el plan.
       *
       * Si no existe negocio activo, mantenemos Plan 1
       * como estado seguro.
       */

      // ========================================================
      // VALIDACIÓN FINAL
      // ========================================================

      if (
        !Number.isFinite(resolvedPlan) ||
        resolvedPlan < 1
      ) {
        resolvedPlan = 1;
      }

      setPlanUsuarioId(resolvedPlan);

      // ========================================================
      // CANTIDAD DE NEGOCIOS
      // ========================================================

      if (
        Array.isArray(perfil?.negocios)
      ) {
        setCantidadNegocios(
          perfil.negocios.length,
        );
      } else {
        const lista =
          await profileApi
            .getNegocios()
            .catch(() => []);

        setCantidadNegocios(
          Array.isArray(lista)
            ? lista.length
            : 0,
        );
      }

      // ========================================================
      // DEBUG CONTROLADO
      // ========================================================

      console.info(
        "[usePlanPermissions] Estado de permisos:",
        {
          negocioId: activeNegocioId,
          plan: resolvedPlan,
          planNombre:
            (Array.isArray(planes)
              ? planes
              : PLANES_FALLBACK
            ).find(
              (p) =>
                p.id === resolvedPlan,
            )?.nombre,
          isMaster,
          cantidadNegocios:
            Array.isArray(perfil?.negocios)
              ? perfil.negocios.length
              : undefined,
        },
      );
    } catch (error) {
      console.error(
        "[usePlanPermissions] Error al verificar permisos de plan:",
        error,
      );

      /*
       * IMPORTANTE:
       *
       * No recuperamos business_plan_*
       * ni active_business_plan.
       *
       * Esos valores pertenecen a pruebas anteriores
       * y no deben poder modificar el plan real.
       */
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  // ============================================================
  // CARGA INICIAL + EVENTOS
  // ============================================================

  useEffect(() => {
    void cargarDatos();

    // ----------------------------------------------------------
    // CAMBIO DE PLAN
    // ----------------------------------------------------------

    const handlePlanUpdated = (
      event: Event,
    ) => {
      const customEvent =
        event as CustomEvent<{
          planId?: number;
        }>;

      const planId =
        customEvent.detail?.planId;

      if (
        planId !== undefined &&
        planId !== null
      ) {
        const numericPlan =
          Number(planId);

        if (
          Number.isFinite(numericPlan) &&
          numericPlan >= 1
        ) {
          setPlanUsuarioId(
            numericPlan,
          );
        }
      }

      /*
       * Confirmamos siempre con backend.
       */
      void cargarDatos();
    };

    // ----------------------------------------------------------
    // CAMBIO DE NEGOCIO
    // ----------------------------------------------------------

    const handleBusinessChanged = () => {
      /*
       * El active_business_id puede actualizarse
       * justo antes de disparar este evento.
       *
       * Esperamos un tick para leer el valor nuevo.
       */
      setTimeout(() => {
        void cargarDatos();
      }, 0);
    };

    window.addEventListener(
      "plan_updated",
      handlePlanUpdated,
    );

    window.addEventListener(
      "business_changed",
      handleBusinessChanged,
    );

    return () => {
      window.removeEventListener(
        "plan_updated",
        handlePlanUpdated,
      );

      window.removeEventListener(
        "business_changed",
        handleBusinessChanged,
      );
    };
  }, [cargarDatos]);

  // ============================================================
  // REGLAS DE NEGOCIO
  // ============================================================

  /*
   * Plan 1 — Asistente
   * 1 negocio
   *
   * Plan 2 — Gerente
   * 5 negocios
   *
   * Plan 3 — Administrador
   * 20 negocios
   *
   * Plan 4 — Socio
   * Ilimitado
   */

  const maxNegociosPermitidos =
    planUsuarioId === 1
      ? 1
      : planUsuarioId === 2
        ? 5
        : planUsuarioId === 3
          ? 20
          : Number.POSITIVE_INFINITY;

  const puedeCrearNegocio =
    cantidadNegocios <
    maxNegociosPermitidos;

  // ============================================================
  // PAYWALL
  // ============================================================

  const abrirPaywall = (
    motivo?: string,
    planRecomendado = 2,
  ) => {
    setPaywallMotivo(
      motivo ||
        `El Plan ${
          planUsuarioId === 1
            ? "Asistente (Gratis)"
            : planInfo.nombre
        } permite administrar hasta ${
          maxNegociosPermitidos ===
          Number.POSITIVE_INFINITY
            ? "un número ilimitado de"
            : maxNegociosPermitidos
        } comercio(s). Mejora tu plan para crear múltiples negocios y sucursales.`,
    );

    setPaywallPlanRecomendadoId(
      planRecomendado,
    );

    setIsPaywallOpen(true);
  };

  const cerrarPaywall = () => {
    setIsPaywallOpen(false);
  };

  // ============================================================
  // INFORMACIÓN DEL PLAN
  // ============================================================

  const planInfo =
    catalogo.find(
      (plan) =>
        plan.id === planUsuarioId,
    ) ||
    PLANES_FALLBACK.find(
      (plan) =>
        plan.id === planUsuarioId,
    ) ||
    PLANES_FALLBACK[0];

  // ============================================================
  // MÁXIMO DE SEDES
  // ============================================================

  const maxSedesPermitidas =
    planInfo.maxSedes ??
    (
      planUsuarioId === 1
        ? 1
        : planUsuarioId === 2
          ? 4
          : 10
    );

  // ============================================================
  // VERIFICAR CREACIÓN DE NEGOCIO
  // ============================================================

  const verificarCreacionNegocio = (
    onPermitido: () => void,
  ) => {
    if (puedeCrearNegocio) {
      onPermitido();
    } else {
      abrirPaywall();
    }
  };

  // ============================================================
  // VERIFICAR CREACIÓN DE SEDE
  // ============================================================

  const verificarCreacionSede = (
    totalSedesActuales: number,
    onPermitido: () => void,
  ) => {
    if (
      totalSedesActuales <
      maxSedesPermitidas
    ) {
      onPermitido();
    } else {
      abrirPaywall(
        `Tu Plan ${planInfo.nombre} permite administrar hasta ${maxSedesPermitidas} sede(s). Para registrar una nueva sucursal, sube al Plan ${
          planUsuarioId === 1
            ? "Gerente"
            : "Administrador"
        }.`,
        planUsuarioId === 1
          ? 2
          : 3,
      );
    }
  };

  // ============================================================
  // RETURN
  // ============================================================

  return {
    planUsuarioId,

    planNombre:
      planInfo.nombre,

    planInfo,

    catalogo,

    cantidadNegocios,

    maxNegociosPermitidos,

    maxSedesPermitidas,

    puedeCrearNegocio,

    isLoading,

    isPaywallOpen,

    paywallMotivo,

    paywallPlanRecomendadoId,

    abrirPaywall,

    cerrarPaywall,

    verificarCreacionNegocio,

    verificarCreacionSede,

    recargarPermisos:
      cargarDatos,
  };
}