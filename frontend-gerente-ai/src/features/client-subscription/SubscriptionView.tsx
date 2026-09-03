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
  X,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router";

import {
  planesApi,
  PlanBackend,
  CicloFacturacion,
  MENSAJES_IA_POR_PLAN,
  DESCRIPCIONES_POR_PLAN,
} from "@/shared/api/planesApi";

import { lukaWhatsappUrl } from "@/lib/whatsapp";
import { WompiCheckoutModal } from "./components/WompiCheckoutModal";

const PRECIO_FORMATTER =
  new Intl.NumberFormat("es-CO");

/* ============================================================
   UTILIDADES
============================================================ */

function textoSedes(
  maxSedes: number,
  planId?: number,
): string {
  if (planId === 5 || maxSedes <= 0 || maxSedes >= 999 || !Number.isFinite(maxSedes)) {
    return "Sedes por definir";
  }

  return maxSedes === 1
    ? "1 sede comercial"
    : `Hasta ${maxSedes} sedes con WhatsApp`;
}

/* ============================================================
   COMPONENTE
============================================================ */

export function SubscriptionView() {
  const [planes, setPlanes] =
    useState<PlanBackend[]>([]);

  const [planActual, setPlanActual] =
    useState<number | null>(null);

  const [ciclo, setCiclo] =
    useState<CicloFacturacion>(
      "mensual",
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /* ==========================================================
     DOWNGRADE
  ========================================================== */

  const [
    isChangingToAssistant,
    setIsChangingToAssistant,
  ] = useState(false);

  const [
    isDowngradeModalOpen,
    setIsDowngradeModalOpen,
  ] = useState(false);

  /* ==========================================================
     CHECKOUT
  ========================================================== */

  const [
    selectedPlanForCheckout,
    setSelectedPlanForCheckout,
  ] =
    useState<PlanBackend | null>(
      null,
    );

  const [
    isCheckoutOpen,
    setIsCheckoutOpen,
  ] = useState(false);

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

  const negocioId =
    getNegocioId();

  const negocioNombre =
    getNegocioNombre();

  /* ==========================================================
     CARGAR DATOS
  ========================================================== */

  const cargarDatos =
    useCallback(async () => {
      const currentNegocioId =
        getNegocioId();

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

            const backendPlanVigente =
              negocio?.planVigente !== null &&
              negocio?.planVigente !== undefined
                ? Number(
                    negocio.planVigente,
                  )
                : NaN;

            if (
              Number.isFinite(
                backendPlanVigente,
              ) &&
              backendPlanVigente >= 1
            ) {
              resolvedPlan =
                backendPlanVigente;
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
          !Number.isFinite(
            resolvedPlan,
          ) ||
          resolvedPlan < 1
        ) {
          resolvedPlan = 1;
        }

        setPlanActual(
          resolvedPlan,
        );

        /* ======================================================
           DEBUG
        ====================================================== */

        console.info(
          "[SubscriptionView] Estado de suscripción:",
          {
            negocioId:
              currentNegocioId,
            planVigente:
              resolvedPlan,
            planNombre: (
              Array.isArray(
                catalogo,
              )
                ? catalogo
                : []
            ).find(
              (plan) =>
                plan.id ===
                resolvedPlan,
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

    const handlePlanUpdated =
      (event: Event) => {
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
            Number.isFinite(
              numericPlan,
            ) &&
            numericPlan >= 1
          ) {
            setPlanActual(
              numericPlan,
            );
          }
        }

        void cargarDatos();
      };

    /* ========================================================
       EVENTO: NEGOCIO CAMBIADO
    ======================================================== */

    const handleBusinessChanged =
      () => {
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
     ABRIR MODAL DE DOWNGRADE
  ========================================================== */

  const handleCambiarAAsistente =
    () => {
      if (!negocioId) {
        setError(
          "No encontramos el negocio activo.",
        );
        return;
      }

      if (
        planActual === 1
      ) {
        return;
      }

      setIsDowngradeModalOpen(
        true,
      );
    };

  /* ==========================================================
     CONFIRMAR DOWNGRADE
  ========================================================== */

  const confirmarCambioAAsistente =
    async () => {
      if (!negocioId) {
        setError(
          "No encontramos el negocio activo.",
        );
        return;
      }

      try {
        setIsChangingToAssistant(
          true,
        );

        setError(null);

        const negocio =
          await planesApi.cambiarAAsistente(
            negocioId,
          );

        const nuevoPlan =
          Number(
            negocio.plan,
          );

        setPlanActual(
          Number.isFinite(
            nuevoPlan,
          )
            ? nuevoPlan
            : 1,
        );

        /* ======================================================
           AVISAR AL RESTO DE LA APLICACIÓN
        ====================================================== */

        window.dispatchEvent(
          new CustomEvent(
            "plan_updated",
            {
              detail: {
                planId: 1,
              },
            },
          ),
        );

        /* ======================================================
           CERRAR MODAL
        ====================================================== */

        setIsDowngradeModalOpen(
          false,
        );

        /* ======================================================
           CONFIRMAR CONTRA BACKEND
        ====================================================== */

        await cargarDatos();
      } catch (e: unknown) {
        const message =
          e instanceof Error
            ? e.message
            : "No pudimos cambiar el plan.";

        console.error(
          "[SubscriptionView] Error cambiando al plan Asistente:",
          e,
        );

        setError(message);
      } finally {
        setIsChangingToAssistant(
          false,
        );
      }
    };

  /* ==========================================================
     SELECCIONAR PLAN
  ========================================================== */

  const handleSeleccionarPlan = (
    plan: PlanBackend,
  ) => {
    /* ========================================================
       PLAN ACTUAL
    ======================================================== */

    if (
      planActual ===
      plan.id
    ) {
      return;
    }

    /* ========================================================
       CORPORATIVO (ID 5) -> WHATSAPP COLOMBIA
    ======================================================== */

    if (plan.id === 5) {
      const msg = `Hola Luka 👋, quisiera recibir información y asesoría sobre el Plan Corporativo para mi empresa (${negocioNombre}).`;
      window.open(lukaWhatsappUrl(msg), '_blank', 'noopener,noreferrer');
      return;
    }

    /* ========================================================
       DOWNGRADE A ASISTENTE
    ======================================================== */

    if (
      plan.id === 1
    ) {
      handleCambiarAAsistente();
      return;
    }

    /* ========================================================
       PLANES DE PAGO
    ======================================================== */

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

            Escala la capacidad operativa y
            automatizaciones con Inteligencia
            Artificial para{" "}

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

        <div className="relative inline-flex items-center p-1.5 bg-muted/60 border border-border rounded-2xl shadow-inner">

          {/* Mensual */}

          <button
            type="button"
            onClick={() =>
              setCiclo("mensual")
            }
            className={`relative z-10 px-6 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              ciclo === "mensual"
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {ciclo === "mensual" && (
              <motion.div
                layoutId="active-subscription-cycle-pill"
                className="absolute inset-0 bg-background rounded-xl shadow-sm border border-border -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}
            Facturación mensual
          </button>

          {/* Anual */}

          <button
            type="button"
            onClick={() =>
              setCiclo("anual")
            }
            className={`relative z-10 px-6 py-2 rounded-xl text-xs font-bold transition-colors flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
              ciclo === "anual"
                ? "text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {ciclo === "anual" && (
              <motion.div
                layoutId="active-subscription-cycle-pill"
                className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 rounded-xl shadow-md -z-10"
                transition={{ type: "spring", stiffness: 450, damping: 35 }}
              />
            )}

            <span
              className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full transition-colors ${
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">

          {[0, 1, 2, 3, 4].map(
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

      {!isLoading &&
        error && (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">

            {planes.map(
              (plan) => {

                const esActual =
                  planActual ===
                  plan.id;

                const esGratuito =
                  plan.precioMensual ===
                  0 && plan.id === 1;

                const esCorporativo =
                  plan.id === 5;

                const esPlanGerente =
                  plan.id === 2;

                const esPopular =
                  plan.id === 3; // Administrador (3 sedes)

                const esDowngrade =
                  plan.id === 1 &&
                  planActual !== null &&
                  planActual !== 1;

                let precioMostrado = "";
                let facturacionTotalAnual: string | null = null;

                if (esGratuito) {
                  precioMostrado = "Gratis";
                } else if (esCorporativo) {
                  precioMostrado = "Cotizar";
                } else if (esPlanGerente) {
                  precioMostrado = `$${PRECIO_FORMATTER.format(
                    plan.precioMensual,
                  )}`;
                  if (ciclo === "anual") {
                    facturacionTotalAnual =
                      "Solo disponible mensual";
                  }
                } else if (
                  ciclo === "anual"
                ) {
                  precioMostrado = `$${PRECIO_FORMATTER.format(
                    Math.round(
                      plan.precioAnual / 12,
                    ),
                  )}`;
                  facturacionTotalAnual = `Facturado $${PRECIO_FORMATTER.format(
                    plan.precioAnual,
                  )} COP/año`;
                } else {
                  precioMostrado = `$${PRECIO_FORMATTER.format(
                    plan.precioMensual,
                  )}`;
                }

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

                    {/* ==================================================
                        BADGE
                    ================================================== */}

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
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={ciclo}
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.15 }}
                          >
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
                          </motion.div>
                        </AnimatePresence>
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
                            plan.id,
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

                      {/* Reportes */}

                      <div className="flex items-start gap-3">

                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">

                          <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />

                        </div>

                        <span className="text-xs font-semibold text-foreground">

                          {plan.id === 1
                            ? "Reportes básicos"
                            : "Reportes avanzados"}

                        </span>

                      </div>



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
                        esActual ||
                        isChangingToAssistant
                      }
                      onClick={() =>
                        handleSeleccionarPlan(
                          plan,
                        )
                      }
                      className={`w-full py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        esActual
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 cursor-default opacity-80"
                          : esCorporativo
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
                            : esDowngrade
                              ? "bg-muted text-foreground border border-border hover:bg-muted/80 cursor-pointer"
                              : esPopular
                                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md shadow-emerald-500/20 cursor-pointer"
                                : "bg-foreground text-background hover:opacity-90 cursor-pointer"
                      }`}
                    >

                      {esActual ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />

                          <span>
                            Plan Actual Activo
                          </span>
                        </>
                      ) : esCorporativo ? (
                        <>
                          <MessageSquare className="w-4 h-4" />

                          <span>
                            Hablar con Ventas
                          </span>
                        </>
                      ) : esDowngrade ? (
                        <>
                          <Bot className="w-4 h-4" />

                          <span>
                            {isChangingToAssistant
                              ? "Cambiando plan..."
                              : "Cambiar al plan Asistente"}
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />

                          <span>
                            {esPlanGerente && ciclo === "anual"
                              ? "Elegir Plan Mensual"
                              : `Elegir Plan ${plan.nombre}`}
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
              Cambia de plan en cualquier
              momento sin contratos de permanencia
              ni cobros ocultos.
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
          MODAL DOWNGRADE
      ====================================================== */}

      <AnimatePresence>
        {isDowngradeModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">

            {/* ==================================================
                BACKDROP
            ================================================== */}

            <motion.div
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.2,
              }}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              onClick={() => {
                if (
                  !isChangingToAssistant
                ) {
                  setIsDowngradeModalOpen(
                    false,
                  );
                }
              }}
            />

            {/* ==================================================
                MODAL
            ================================================== */}

            <motion.div
              initial={{
                opacity: 0,
                scale: 0.96,
                y: 16,
              }}
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                scale: 0.96,
                y: 16,
              }}
              transition={{
                duration: 0.22,
                ease: "easeOut",
              }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="downgrade-title"
              className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-2xl shadow-emerald-500/10"
            >

              {/* ==================================================
                  GLOW SUPERIOR
              ================================================== */}

              <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-emerald-500/10 via-cyan-500/[0.03] to-transparent pointer-events-none" />

              {/* ==================================================
                  BOTÓN CERRAR
              ================================================== */}

              <button
                type="button"
                aria-label="Cerrar"
                disabled={
                  isChangingToAssistant
                }
                onClick={() =>
                  setIsDowngradeModalOpen(
                    false,
                  )
                }
                className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all hover:bg-white/[0.08] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="h-4 w-4" />
              </button>

              {/* ==================================================
                  CONTENIDO
              ================================================== */}

              <div className="relative p-7 sm:p-8">

                {/* ==================================================
                    ICONO
                ================================================== */}

                <div className="flex justify-center mb-6">

                  <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 shadow-lg shadow-emerald-500/10">

                    <div className="absolute inset-0 rounded-2xl bg-emerald-400/10 blur-xl" />

                    <Bot className="relative w-8 h-8 text-emerald-400" />

                  </div>

                </div>

                {/* ==================================================
                    TÍTULO
                ================================================== */}

                <div className="text-center">

                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400 mb-2">
                    Cambio de plan
                  </p>

                  <h2
                    id="downgrade-title"
                    className="text-xl sm:text-2xl font-black text-white tracking-tight"
                  >
                    ¿Cambiar al plan Asistente?
                  </h2>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    El cambio será inmediato y tu
                    negocio continuará funcionando
                    con las capacidades del plan
                    Asistente.
                  </p>

                </div>

                {/* ==================================================
                    INFORMACIÓN
                ================================================== */}

                <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">

                  <div className="flex items-start gap-3">

                    <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-emerald-500/10 shrink-0">

                      <ShieldCheck className="w-4 h-4 text-emerald-400" />

                    </div>

                    <div>

                      <p className="text-xs font-bold text-white">
                        Tu información está segura
                      </p>

                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        No se eliminarán ventas,
                        clientes, productos ni ningún
                        otro dato de tu negocio.
                      </p>

                    </div>

                  </div>

                </div>

                {/* ==================================================
                    ADVERTENCIA
                ================================================== */}

                <div className="mt-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.05] p-4">

                  <p className="text-xs leading-5 text-amber-200/80">
                    El cambio será inmediato. Las
                    funciones y sedes que superen
                    los límites del plan Asistente
                    dejarán de estar habilitadas.
                    El tiempo restante del plan
                    actual no se conserva.
                  </p>

                </div>

                {/* ==================================================
                    BOTONES
                ================================================== */}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">

                  {/* Mantener plan */}

                  <button
                    type="button"
                    disabled={
                      isChangingToAssistant
                    }
                    onClick={() =>
                      setIsDowngradeModalOpen(
                        false,
                      )
                    }
                    className="w-full py-3.5 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Mantener mi plan
                  </button>

                  {/* Confirmar */}

                  <button
                    type="button"
                    disabled={
                      isChangingToAssistant
                    }
                    onClick={() =>
                      void confirmarCambioAAsistente()
                    }
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isChangingToAssistant
                      ? "Cambiando plan..."
                      : "Cambiar al plan Asistente"}
                  </button>

                </div>

              </div>

            </motion.div>

          </div>
        )}
      </AnimatePresence>

      {/* ======================================================
          CHECKOUT WOMPI
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
            void cargarDatos();
          }}
        />
      )}

    </div>
  );
}