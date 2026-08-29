import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/features/auth';
import { profileApi } from '@/features/shared-profile/api/profileApi';
import { planesApi, PlanBackend, PLANES_FALLBACK } from '@/shared/api/planesApi';

export function usePlanPermissions() {
  const { user, token } = useAuth();

  const [catalogo, setCatalogo] = useState<PlanBackend[]>(PLANES_FALLBACK);
  const [cantidadNegocios, setCantidadNegocios] = useState<number>(0);
  const [planUsuarioId, setPlanUsuarioId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Estado del Modal Paywall
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [paywallMotivo, setPaywallMotivo] = useState<string>('');
  const [paywallPlanRecomendadoId, setPaywallPlanRecomendadoId] = useState<number>(2);

  const cargarDatos = useCallback(async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [planes, perfil] = await Promise.all([
        planesApi.getPlanesCatalogo(),
        profileApi.getMe().catch(() => null),
      ]);

      if (planes && planes.length > 0) {
        setCatalogo(planes);
      }

      const activeNegocioId = localStorage.getItem('active_business_id');
      const perBusinessPlan = activeNegocioId 
        ? localStorage.getItem(`business_plan_${activeNegocioId}`) 
        : null;
      const accountPlan = localStorage.getItem('active_business_plan');

      let resolvedPlan = 1;
      if (perBusinessPlan) {
        resolvedPlan = Number(perBusinessPlan);
      } else if (accountPlan) {
        resolvedPlan = Number(accountPlan);
      } else if (perfil?.plan) {
        resolvedPlan = Number(perfil.plan);
      } else if (user?.plan) {
        resolvedPlan = Number(user.plan);
      } else if (perfil?.rolGlobal === 'MASTER' || user?.rolGlobal === 'MASTER') {
        resolvedPlan = 3; // Plan Administrador por defecto para MASTER
      }

      setPlanUsuarioId(resolvedPlan);

      // Conteo de negocios del usuario
      if (perfil && (perfil as any).negocios && Array.isArray((perfil as any).negocios)) {
        setCantidadNegocios((perfil as any).negocios.length);
      } else {
        // Fallback desde lista de negocios
        const lista = await profileApi.getNegocios().catch(() => []);
        setCantidadNegocios(Array.isArray(lista) ? lista.length : 0);
      }
    } catch (e) {
      console.error('Error al verificar permisos de plan:', e);
    } finally {
      setIsLoading(false);
    }
  }, [token, user]);

  useEffect(() => {
    cargarDatos();

    const handlePlanUpdated = (e: any) => {
      if (e.detail?.planId) {
        setPlanUsuarioId(e.detail.planId);
      }
      cargarDatos();
    };

    const handleBusinessChanged = () => {
      cargarDatos();
    };

    window.addEventListener('plan_updated', handlePlanUpdated);
    window.addEventListener('business_changed', handleBusinessChanged);

    return () => {
      window.removeEventListener('plan_updated', handlePlanUpdated);
      window.removeEventListener('business_changed', handleBusinessChanged);
    };
  }, [cargarDatos]);

  // Reglas de negocio según el plan
  // Plan 1 (Asistente): 1 negocio, 1 sede
  // Plan 2 (Gerente): 5 negocios, 4 sedes por negocio
  // Plan 3 (Administrador): 20 negocios, 10 sedes por negocio
  // Plan 4 (Socio): Ilimitado
  const maxNegociosPermitidos = planUsuarioId === 1 
    ? 1 
    : planUsuarioId === 2 
      ? 5 
      : planUsuarioId === 3 
        ? 20 
        : Number.POSITIVE_INFINITY;

  const puedeCrearNegocio = cantidadNegocios < maxNegociosPermitidos;

  const abrirPaywall = (motivo?: string, planRecomendado = 2) => {
    setPaywallMotivo(
      motivo || 
      `El Plan ${planUsuarioId === 1 ? 'Asistente (Gratis)' : 'actual'} permite administrar hasta ${maxNegociosPermitidos} comercio(s). Mejora tu plan para crear múltiples negocios y sucursales.`
    );
    setPaywallPlanRecomendadoId(planRecomendado);
    setIsPaywallOpen(true);
  };

  const cerrarPaywall = () => {
    setIsPaywallOpen(false);
  };

  const planInfo = catalogo.find((p) => p.id === planUsuarioId) || catalogo[0] || PLANES_FALLBACK[0];

  const maxSedesPermitidas = planInfo.maxSedes || (planUsuarioId === 1 ? 1 : planUsuarioId === 2 ? 4 : 10);

  const verificarCreacionNegocio = (onPermitido: () => void) => {
    if (puedeCrearNegocio) {
      onPermitido();
    } else {
      abrirPaywall();
    }
  };

  const verificarCreacionSede = (totalSedesActuales: number, onPermitido: () => void) => {
    if (totalSedesActuales < maxSedesPermitidas) {
      onPermitido();
    } else {
      abrirPaywall(
        `Tu Plan ${planInfo.nombre} permite administrar hasta ${maxSedesPermitidas} sede(s). Para registrar una nueva sucursal, sube al Plan ${planUsuarioId === 1 ? 'Gerente' : 'Administrador'}.`,
        planUsuarioId === 1 ? 2 : 3
      );
    }
  };

  return {
    planUsuarioId,
    planNombre: planInfo.nombre,
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
    recargarPermisos: cargarDatos,
  };
}
