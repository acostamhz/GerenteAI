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
  // ESTADO DEL MODAL PAYWALL
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

      const [planes, perfil] =
        await Promise.all([
          planesApi.getPlanesCatalogo(),

          profileApi
            .getMe()
            .catch(() => null),
        ]);

      // ========================================================
      // CATÁLOGO DE PLANES
      // ========================================================

      if (
        planes &&
        planes.length > 0
      ) {
        setCatalogo(planes);
      }

      // ========================================================
      // DETERMINAR PLAN DEL USUARIO
      // ========================================================

      const activeNegocioId =
        localStorage.getItem(
          "active_business_id",
        );

      const perBusinessPlan =
        activeNegocioId
          ? localStorage.getItem(
              `business_plan_${activeNegocioId}`,
            )
          : null;

      const accountPlan =
        localStorage.getItem(
          "active_business_plan",
        );

      /*
       * IMPORTANTE:
       *
       * El backend debe ser la fuente principal
       * de verdad.
       *
       * localStorage solamente se utiliza como
       * fallback cuando no tenemos información
       * del backend.
       */

      const isMaster =
        perfil?.rolGlobal === "MASTER" ||
        user?.rolGlobal === "MASTER";

      let resolvedPlan = 1;

      /*
       * MASTER
       *
       * MASTER tiene permisos equivalentes
       * al Plan Administrador.
       *
       * Lo evaluamos primero para evitar que
       * cualquier valor antiguo del localStorage
       * pueda degradar sus permisos.
       */
      if (isMaster) {
        resolvedPlan = 3;
      }

      /*
       * Plan informado por el backend.
       */
      else if (
        perfil?.plan !== null &&
        perfil?.plan !== undefined
      ) {
        const backendPlan =
          Number(perfil.plan);

        if (
          Number.isFinite(
            backendPlan,
          ) &&
          backendPlan > 0
        ) {
          resolvedPlan =
            backendPlan;
        }
      }

      /*
       * Plan disponible en el usuario
       * autenticado.
       */
      else if (
        user?.plan !== null &&
        user?.plan !== undefined
      ) {
        const userPlan =
          Number(user.plan);

        if (
          Number.isFinite(
            userPlan,
          ) &&
          userPlan > 0
        ) {
          resolvedPlan =
            userPlan;
        }
      }

      /*
       * FALLBACK:
       *
       * Solamente si el backend no informó
       * el plan, utilizamos localStorage.
       */
      else if (
        perBusinessPlan
      ) {
        const storedPlan =
          Number(perBusinessPlan);

        if (
          Number.isFinite(
            storedPlan,
          ) &&
          storedPlan > 0
        ) {
          resolvedPlan =
            storedPlan;
        }
      }

      else if (
        accountPlan
      ) {
        const storedPlan =
          Number(accountPlan);

        if (
          Number.isFinite(
            storedPlan,
          ) &&
          storedPlan > 0
        ) {
          resolvedPlan =
            storedPlan;
        }
      }

      /*
       * Protección final.
       *
       * Si por alguna razón se obtiene un
       * número inválido, volvemos al Plan 1.
       */
      if (
        !Number.isFinite(
          resolvedPlan,
        ) ||
        resolvedPlan < 1
      ) {
        resolvedPlan = 1;
      }

      setPlanUsuarioId(
        resolvedPlan,
      );

      // ========================================================
      // CANTIDAD DE NEGOCIOS
      // ========================================================

      if (
        perfil &&
        (perfil as any).negocios &&
        Array.isArray(
          (perfil as any).negocios,
        )
      ) {
        setCantidadNegocios(
          (perfil as any).negocios.length,
        );
      } else {
        /*
         * Fallback:
         * obtener negocios directamente.
         */
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
    } catch (e) {
      console.error(
        "Error al verificar permisos de plan:",
        e,
      );
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  // ============================================================
  // CARGA INICIAL + EVENTOS
  // ============================================================

  useEffect(() => {
    cargarDatos();

    /*
     * Cuando cambia el plan desde otro componente,
     * actualizamos inmediatamente y después
     * volvemos a consultar el backend.
     */
    const handlePlanUpdated = (
      e: Event,
    ) => {
      const customEvent =
        e as CustomEvent<{
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
          Number.isFinite(
            numericPlan,
          ) &&
          numericPlan > 0
        ) {
          setPlanUsuarioId(
            numericPlan,
          );
        }
      }

      void cargarDatos();
    };

    /*
     * Cuando cambia el negocio activo,
     * debemos volver a determinar el plan.
     */
    const handleBusinessChanged =
      () => {
        void cargarDatos();
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
  // REGLAS DE NEGOCIO SEGÚN EL PLAN
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
            : "actual"
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
      (p) =>
        p.id === planUsuarioId,
    ) ||
    catalogo[0] ||
    PLANES_FALLBACK[0];

  // ============================================================
  // MÁXIMO DE SEDES
  // ============================================================

  const maxSedesPermitidas =
    planInfo.maxSedes ||
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
    if (
      puedeCrearNegocio
    ) {
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