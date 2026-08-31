import {
  useState,
  useEffect,
  useCallback,
} from "react";

import {
  Check,
  Building2,
  MessageSquare,
  Phone,
  Sparkles,
  ShieldCheck,
  Bot,
} from "lucide-react";

import { motion } from "motion/react";
import { Link } from "react-router";

import {
  planesApi,
  PlanBackend,
  CicloFacturacion,
  MENSAJES_IA_POR_PLAN,
  DESCRIPCIONES_POR_PLAN,
} from "@/shared/api/planesApi";

import { WompiCheckoutModal } from "./components/WompiCheckoutModal";

const PRECIO_FORMATTER = new Intl.NumberFormat("es-CO");

/* ============================================================
   UTILIDADES
============================================================ */

function textoSedes(maxSedes: number): string {
  if (!Number.isFinite(maxSedes)) {
    return "Sedes ilimitadas";
  }

  return maxSedes === 1
    ? "1 sede comercial"
    : `Hasta ${maxSedes} sedes con WhatsApp`;
}

/* ============================================================
   COMPONENTE
============================================================ */

export function SubscriptionView() {
  const [planes, setPlanes] = useState<PlanBackend[]>([]);
  const [planActual, setPlanActual] = useState<number | null>(null);

  const [ciclo, setCiclo] =
    useState<CicloFacturacion>("mensual");

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ==========================================================
     CHECKOUT
  ========================================================== */

  const [
    selectedPlanForCheckout,
    setSelectedPlanForCheckout,
  ] = useState<PlanBackend | null>(null);

  const [isCheckoutOpen, setIsCheckoutOpen] =
    useState(false);

  /* ==========================================================
     NEGOCIO ACTIVO
  ========================================================== */

  const getNegocioId = () => {
    return (
      localStorage.getItem(
        "active_business_id",
      ) || ""
    );
  };

  const getNegocioNombre = () => {
    return (
      localStorage.getItem(
        "active_business_name",
      ) || "Tu Negocio"
    );
  };

  const negocioId = getNegocioId();

  const negocioNombre = getNegocioNombre();

  /* ==========================================================
     CARGAR DATOS
     
     IMPORTANTE:
     
     El backend es la FUENTE PRINCIPAL DE VERDAD.
     
     NO utilizamos:
     
     - business_plan_*
     - active_business_plan
     
     El plan del negocio se obtiene mediante:
     
     GET /negocios/:id
  ========================================================== */

  const cargarDatos = useCallback(async () => {
    const currentNegocioId = getNegocioId();

    try {
      setIsLoading(true);
      setError(null);

      /* ======================================================
         CATÁLOGO
      ====================================================== */

      const catalogo =
        await planesApi.getPlanesCatalogo();

      setPlanes(
        Array.isArray(catalogo)
          ? catalogo
          : [],
      );

      /* ======================================================
         PLAN DEL NEGOCIO ACTIVO
      ====================================================== */

      let resolvedPlan = 1;

      if (currentNegocioId) {
        try {
          const negocio =
            await planesApi.getNegocioPlan(
              currentNegocioId,
            );

          const backendPlan =
            negocio?.plan !== null &&
            negocio?.plan !== undefined
              ? Number(negocio.plan)
              : NaN;

          if (
            Number.isFinite(backendPlan) &&
            backendPlan >= 1
          ) {
            resolvedPlan = backendPlan;
          }
        } catch (error) {
          console.error(
            "[SubscriptionView] Error obteniendo plan del negocio:",
            error,
          );
        }
      }

      /* ======================================================
         VALIDACIÓN FINAL
      ====================================================== */

      if (
        !Number.isFinite(resolvedPlan) ||
        resolvedPlan < 1
      ) {
        resolvedPlan = 1;
      }

      setPlanActual(resolvedPlan);

      /* ======================================================
         DEBUG CONTROLADO
      ====================================================== */

      console.info(
        "[SubscriptionView] Estado de suscripción:",
        {
          negocioId: currentNegocioId,
          plan: resolvedPlan,
          planNombre: (
            Array.isArray(catalogo)
              ? catalogo
              : []
          ).find(
            (plan) =>
              plan.id === resolvedPlan,
          )?.nombre,
        },
      );
    } catch (e: unknown) {
      const message =
        e instanceof Error
          ? e.message
          : "No se pudieron cargar los planes.";

      console.error(
        "[SubscriptionView] Error cargando planes:",
        e,
      );

      setError(message);

      /*
       * IMPORTANTE:
       *
       * No utilizamos localStorage para recuperar
       * el plan.
       *
       * Si el backend falla, mostramos Plan 1
       * como estado seguro.
       */
      setPlanActual(1);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ==========================================================
     CARGA INICIAL + EVENTOS
  ========================================================== */

  useEffect(() => {
    void cargarDatos();

    /* ========================================================
       EVENTO: PLAN ACTUALIZADO
    ======================================================== */

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
          /*
           * Actualización inmediata de UI.
           */
          setPlanActual(
            numericPlan,
          );
        }
      }

      /*
       * Confirmamos siempre con backend.
       */
      void cargarDatos();
    };

    /* ========================================================
       EVENTO: NEGOCIO CAMBIADO
    ======================================================== */

    const handleBusinessChanged = () => {
      /*
       * Esperamos un tick para asegurarnos de que
       * active_business_id ya haya sido actualizado.
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

  /* ==========================================================
     SELECCIONAR PLAN
  ========================================================== */

  const handleSeleccionarPlan = (
    plan: PlanBackend,
  ) => {
    /*
     * No hacer nada si ya es el plan actual.
     */
    if (
      planActual === plan.id
    ) {
      return;
    }

    /*
     * El plan gratuito no requiere checkout.
     */
    if (
      plan.precioMensual === 0
    ) {
      return;
    }

    setSelectedPlanForCheckout(
      plan,
    );

    setIsCheckoutOpen(
      true,
    );
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">

        <div>

          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Pasarela Oficial Wompi Bancolombia
          </div>

          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Planes y suscripción
          </h1>

          <p className="text-sm text-muted-foreground mt-0.5">
            Escala la capacidad operativa y automatizaciones
            con Inteligencia Artificial para{" "}
            <strong className="text-foreground">
              {negocioNombre}
            </strong>
            .
          </p>

        </div>

        <Link
          to="/manage-subscription"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border transition-colors self-start md:self-auto"
        >
          <Bot className="w-4 h-4 text-emerald-500" />

          <span>
            Administrar mi plan actual
          </span>
        </Link>

      </div>

      {/* ======================================================
          SELECTOR DE CICLO
      ====================================================== */}

      <div className="flex items-center justify-center mb-10">

        <div className="inline-flex items-center p-1.5 bg-muted/60 border border-border rounded-2xl shadow-inner">

          {/* Mensual */}

          <button
            type="button"
            onClick={() =>
              setCiclo("mensual")
            }
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ciclo === "mensual"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Facturación mensual
          </button>

          {/* Anual */}

          <button
            type="button"
            onClick={() =>
              setCiclo("anual")
            }
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              ciclo === "anual"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >

            <span
              className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                ciclo === "anual"
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              }`}
            >
              Ahorra 16%
            </span>

            <span>
              Facturación anual
            </span>

          </button>

        </div>

      </div>

      {/* ======================================================
          LOADING
      ====================================================== */}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          {[0, 1, 2].map(
            (i) => (
              <div
                key={i}
                className="h-96 bg-card border border-border rounded-3xl animate-pulse"
              />
            ),
          )}

        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!isLoading && error && (
        <div className="bg-card border border-destructive/20 rounded-3xl p-8 text-center mb-12">

          <p className="text-sm font-bold text-destructive">
            No pudimos cargar los planes comerciales
          </p>

          <p className="text-xs mt-1 text-muted-foreground">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void cargarDatos()
            }
            className="mt-4 px-4 py-2 rounded-xl bg-foreground text-background text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer"
          >
            Reintentar
          </button>

        </div>
      )}

      {/* ======================================================
          GRID DE PLANES
      ====================================================== */}

      {!isLoading &&
        !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

            {planes.map(
              (plan) => {
                const esActual =
                  planActual ===
                  plan.id;

                const esGratuito =
                  plan.precioMensual ===
                  0;

                const esPopular =
                  plan.id === 2;

                const precioMostrado =
                  esGratuito
                    ? "Gratis"
                    : ciclo ===
                        "anual"
                      ? `$${PRECIO_FORMATTER.format(
                          Math.round(
                            plan.precioAnual /
                              12,
                          ),
                        )}`
                      : `$${PRECIO_FORMATTER.format(
                          plan.precioMensual,
                        )}`;

                const facturacionTotalAnual =
                  ciclo ===
                    "anual" &&
                  !esGratuito
                    ? `Facturado $${PRECIO_FORMATTER.format(
                        plan.precioAnual,
                      )} COP/año`
                    : null;

                return (
                  <motion.div
                    key={plan.id}
                    initial={{
                      opacity: 0,
                      y: 15,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.4,
                    }}
                    className={`relative flex flex-col bg-card border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 ${
                      esActual
                        ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.02]"
                        : esPopular
                          ? "border-emerald-500/50 shadow-md hover:border-emerald-500"
                          : "border-border hover:border-border/80"
                    }`}
                  >

                    {/* Badge */}

                    {esPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                        ★ Recomendado para Pymes
                      </div>
                    )}

                    {/* ==================================================
                        CABECERA
                    ================================================== */}

                    <div className="mb-6">

                      <div className="flex items-center justify-between mb-2">

                        <h3 className="text-xl font-black text-foreground">
                          {plan.nombre}
                        </h3>

                        {esActual && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">

                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />

                            Plan Actual

                          </span>
                        )}

                      </div>

                      <p className="text-xs text-muted-foreground min-h-[32px]">

                        {DESCRIPCIONES_POR_PLAN[
                          plan.id
                        ] ||
                          "Plan comercial para negocios."}

                      </p>

                      <div className="mt-4 pt-4 border-t border-border">

                        <div className="flex items-baseline gap-1.5">

                          <span className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                            {precioMostrado}
                          </span>

                          {!esGratuito && (
                            <span className="text-xs font-semibold text-muted-foreground">
                              COP /mes
                            </span>
                          )}

                        </div>

                        {facturacionTotalAnual && (
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                            {facturacionTotalAnual}
                          </p>
                        )}

                      </div>

                    </div>

                    {/* ==================================================
                        CARACTERÍSTICAS
                    ================================================== */}

                    <div className="flex-1 space-y-3.5 mb-8">

                      {/* Sedes */}

                      <div className="flex items-start gap-3">

                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <span className="text-xs font-semibold text-foreground">
                          {textoSedes(
                            plan.maxSedes,
                          )}
                        </span>

                      </div>

                      {/* IA */}

                      <div className="flex items-start gap-3">

                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <span className="text-xs font-semibold text-foreground">
                          {MENSAJES_IA_POR_PLAN[
                            plan.id
                          ] ||
                            "Mensajes con IA incluidos"}
                        </span>

                      </div>

                      {/* Módulos */}

                      <div className="flex items-start gap-3">

                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                          <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        </div>

                        <span className="text-xs font-semibold text-foreground">
                          {plan.funcionalidades
                            .length >
                          0
                            ? `${plan.funcionalidades.length} módulos y reportes avanzados`
                            : "Módulos financieros esenciales"}
                        </span>

                      </div>

                      {/* Audio / Fotos */}

                      {plan.funcionalidades.includes(
                        "anotaciones_por_audio",
                      ) && (
                        <div className="flex items-start gap-3">

                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          </div>

                          <span className="text-xs text-muted-foreground">
                            Registro de ventas por nota de
                            voz y fotos
                          </span>

                        </div>
                      )}

                      {/* Recomendaciones */}

                      {plan.funcionalidades.includes(
                        "recomendaciones_estadisticas",
                      ) && (
                        <div className="flex items-start gap-3">

                          <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          </div>

                          <span className="text-xs text-muted-foreground">
                            Recomendaciones y analítica de
                            margen
                          </span>

                        </div>
                      )}

                    </div>

                    {/* ==================================================
                        BOTÓN
                    ================================================== */}

                    <button
                      type="button"
                      disabled={
                        esActual
                      }
                      onClick={() =>
                        handleSeleccionarPlan(
                          plan,
                        )
                      }
                      className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        esActual
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default opacity-80"
                          : esPopular
                            ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-500/20"
                            : "bg-foreground text-background hover:opacity-90"
                      }`}
                    >

                      {esActual ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />

                          <span>
                            Plan Actual Activo
                          </span>
                        </>
                      ) : esGratuito ? (
                        <span>
                          Plan Básico Gratuito
                        </span>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />

                          <span>
                            Mejorar a{" "}
                            {plan.nombre}
                          </span>
                        </>
                      )}

                    </button>

                  </motion.div>
                );
              },
            )}

          </div>
        )}

      {/* ======================================================
          SEGURIDAD
      ====================================================== */}

      <div className="p-6 bg-card border border-border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">

        <div className="flex items-center gap-3">

          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div>

            <h4 className="text-sm font-bold text-foreground">
              Pagos protegidos por Wompi Bancolombia
            </h4>

            <p className="text-xs text-muted-foreground">
              Cancela o cambia de plan en cualquier
              momento sin contratos de permanencia ni
              cobros ocultos.
            </p>

          </div>

        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">

          <span className="px-2.5 py-1 bg-muted rounded-lg border border-border">
            PSE
          </span>

          <span className="px-2.5 py-1 bg-muted rounded-lg border border-border">
            Nequi
          </span>

          <span className="px-2.5 py-1 bg-muted rounded-lg border border-border">
            Tarjetas
          </span>

        </div>

      </div>

      {/* ======================================================
          CHECKOUT
      ====================================================== */}

      {selectedPlanForCheckout && (
        <WompiCheckoutModal
          isOpen={
            isCheckoutOpen
          }
          onClose={() =>
            setIsCheckoutOpen(
              false,
            )
          }
          plan={
            selectedPlanForCheckout
          }
          ciclo={ciclo}
          negocioId={
            negocioId
          }
          negocioNombre={
            negocioNombre
          }
          onPaymentSuccess={() => {
            /*
             * Recargamos inmediatamente después
             * del pago.
             */
            void cargarDatos();
          }}
        />
      )}

    </div>
  );
}