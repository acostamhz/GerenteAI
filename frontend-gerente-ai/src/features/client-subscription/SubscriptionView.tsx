import { useEffect, useState } from "react";
import { 
  Check, 
  Building2, 
  MessageSquare, 
  Phone, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  HelpCircle, 
  ArrowRight,
  TrendingUp,
  Bot
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { 
  planesApi, 
  PlanBackend, 
  CicloFacturacion, 
  MENSAJES_IA_POR_PLAN, 
  DESCRIPCIONES_POR_PLAN 
} from "@/shared/api/planesApi";
import { WompiCheckoutModal } from "./components/WompiCheckoutModal";

const PRECIO_FORMATTER = new Intl.NumberFormat("es-CO");

function textoSedes(maxSedes: number): string {
  if (!Number.isFinite(maxSedes)) return "Sedes ilimitadas";
  return maxSedes === 1 ? "1 sede comercial" : `Hasta ${maxSedes} sedes con WhatsApp`;
}

export function SubscriptionView() {
  const [planes, setPlanes] = useState<PlanBackend[]>([]);
  const [planActual, setPlanActual] = useState<number | null>(null);
  const [ciclo, setCiclo] = useState<CicloFacturacion>("mensual");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout Modal
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanBackend | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const negocioId = localStorage.getItem("active_business_id") || "";
  const negocioNombre = localStorage.getItem("active_business_name") || "Tu Negocio";

  const cargarDatos = async () => {
    try {
      setIsLoading(true);
      const [catalogo, negocio] = await Promise.all([
        planesApi.getPlanesCatalogo(),
        negocioId ? planesApi.getNegocioPlan(negocioId) : Promise.resolve(null),
      ]);

      setPlanes(catalogo);

      // Check simulated local storage plan first (if user just upgraded in session)
      const localSimulatedPlan = localStorage.getItem(`business_plan_${negocioId}`);
      if (localSimulatedPlan) {
        setPlanActual(Number(localSimulatedPlan));
      } else {
        setPlanActual(negocio?.plan ?? 1); // Default Asistente
      }
    } catch (e: any) {
      setError(e.message || "No se pudieron cargar los planes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();

    // Sincronización reactiva al cambiar de negocio o completar pago
    const handlePlanUpdated = (e: any) => {
      if (e.detail?.planId) {
        setPlanActual(e.detail.planId);
      }
    };

    const handleBusinessChanged = () => {
      cargarDatos();
    };

    window.addEventListener("plan_updated", handlePlanUpdated);
    window.addEventListener("business_changed", handleBusinessChanged);

    return () => {
      window.removeEventListener("plan_updated", handlePlanUpdated);
      window.removeEventListener("business_changed", handleBusinessChanged);
    };
  }, [negocioId]);

  const handleSeleccionarPlan = (plan: PlanBackend) => {
    if (planActual === plan.id) return;
    if (plan.precioMensual === 0) return; // Plan Gratuito
    setSelectedPlanForCheckout(plan);
    setIsCheckoutOpen(true);
  };

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Pasarela Oficial Wompi Bancolombia
          </div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Planes y suscripción</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Escala la capacidad operativa y automatizaciones con Inteligencia Artificial para <strong className="text-foreground">{negocioNombre}</strong>.
          </p>
        </div>

        <Link
          to="/manage-subscription"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl border border-border transition-colors self-start md:self-auto"
        >
          <Bot className="w-4 h-4 text-emerald-500" />
          <span>Administrar mi plan actual</span>
        </Link>
      </div>

      {/* Selector de Ciclo de Facturación (Mensual vs Anual -16%) */}
      <div className="flex items-center justify-center mb-10">
        <div className="inline-flex items-center p-1.5 bg-muted/60 border border-border rounded-2xl shadow-inner">
          <button
            onClick={() => setCiclo("mensual")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              ciclo === "mensual"
                ? "bg-background text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Facturación mensual
          </button>
          <button
            onClick={() => setCiclo("anual")}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              ciclo === "anual"
                ? "bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Facturación anual</span>
            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
              ciclo === "anual" 
                ? "bg-white/20 text-white" 
                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
            }`}>
              Ahorra 16%
            </span>
          </button>
        </div>
      </div>

      {/* Estados de Carga y Error */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-96 bg-card border border-border rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-card border border-destructive/20 rounded-3xl p-8 text-center mb-12">
          <p className="text-sm font-bold text-destructive">No pudimos cargar los planes comerciales</p>
          <p className="text-xs mt-1 text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Grid de Planes */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {planes.map((plan) => {
            const esActual = planActual === plan.id;
            const esGratuito = plan.precioMensual === 0;
            const esPopular = plan.id === 2; // Plan Gerente
            const precioMostrado = esGratuito 
              ? "Gratis" 
              : ciclo === "anual" 
                ? `$${PRECIO_FORMATTER.format(Math.round(plan.precioAnual / 12))}`
                : `$${PRECIO_FORMATTER.format(plan.precioMensual)}`;

            const facturacionTotalAnual = ciclo === "anual" && !esGratuito
              ? `Facturado $${PRECIO_FORMATTER.format(plan.precioAnual)} COP/año`
              : null;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className={`relative flex flex-col bg-card border rounded-3xl p-6 sm:p-8 shadow-sm transition-all duration-300 ${
                  esActual
                    ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-500/[0.02]"
                    : esPopular
                      ? "border-emerald-500/50 shadow-md hover:border-emerald-500"
                      : "border-border hover:border-border/80"
                }`}
              >
                {/* Badge Más Popular */}
                {esPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-[10px] font-black uppercase tracking-wider rounded-full shadow-md">
                    ★ Recomendado para Pymes
                  </div>
                )}

                {/* Cabecera del Plan */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-black text-foreground">{plan.nombre}</h3>
                    {esActual && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Plan Actual
                      </span>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground min-h-[32px]">
                    {DESCRIPCIONES_POR_PLAN[plan.id] || "Plan comercial para negocios."}
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

                {/* Lista de Características */}
                <div className="flex-1 space-y-3.5 mb-8">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {textoSedes(plan.maxSedes)}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {MENSAJES_IA_POR_PLAN[plan.id] || "Mensajes con IA incluidos"}
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Building2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-xs font-semibold text-foreground">
                      {plan.funcionalidades.length > 0
                        ? `${plan.funcionalidades.length} módulos y reportes avanzados`
                        : "Módulos financieros esenciales"}
                    </span>
                  </div>

                  {/* Detalle de funciones específicas */}
                  {plan.funcionalidades.includes("anotaciones_por_audio") && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Registro de ventas por nota de voz y fotos
                      </span>
                    </div>
                  )}

                  {plan.funcionalidades.includes("recomendaciones_estadisticas") && (
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        Recomendaciones y analítica de margen
                      </span>
                    </div>
                  )}
                </div>

                {/* Botón de Acción */}
                <button
                  type="button"
                  disabled={esActual}
                  onClick={() => handleSeleccionarPlan(plan)}
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
                      <span>Plan Actual Activo</span>
                    </>
                  ) : esGratuito ? (
                    <span>Plan Básico Gratuito</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Mejorar a {plan.nombre}</span>
                    </>
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Garantía y Seguridad Wompi */}
      <div className="p-6 bg-card border border-border rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground">Pagos protegidos por Wompi Bancolombia</h4>
            <p className="text-xs text-muted-foreground">
              Cancela o cambia de plan en cualquier momento sin contratos de permanencia ni cobros ocultos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
          <span className="px-2.5 py-1 bg-muted rounded-lg border border-border">PSE</span>
          <span className="px-2.5 py-1 bg-muted rounded-lg border border-border">Nequi</span>
          <span className="px-2.5 py-1 bg-muted rounded-lg border border-border">Tarjetas</span>
        </div>
      </div>

      {/* Modal de Checkout */}
      {selectedPlanForCheckout && (
        <WompiCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={selectedPlanForCheckout}
          ciclo={ciclo}
          negocioId={negocioId}
          negocioNombre={negocioNombre}
          onPaymentSuccess={() => {
            cargarDatos();
          }}
        />
      )}
    </div>
  );
}
