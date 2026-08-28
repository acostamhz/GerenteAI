import { useEffect, useState } from "react";
import { Check, Building2, MessageSquare, Phone } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

/** Catálogo comercial: GET /planes. */
interface PlanBackend {
  id: number;
  nombre: string;
  precioMensual: number;
  precioAnual: number;
  maxSedes: number;
  funcionalidades: string[];
}

interface NegocioBackend {
  id: string;
  nombre: string;
  plan: number;
  planVenceEl: string | null;
}

/**
 * Mensajes de IA por mes de cada plan.
 *
 * La cuota la define el módulo de IA (`PLAN_LIMITS`) y hoy no se expone por
 * HTTP: el catálogo de /planes solo trae precio, sedes y funcionalidades. Se
 * mantiene aquí en vez de inventar un endpoint nuevo; si el backend llega a
 * publicarla, este mapa se borra.
 */
const MENSAJES_IA: Record<number, string> = {
  1: "50 mensajes de IA / mes",
  2: "500 mensajes de IA / mes",
  3: "5.000 mensajes de IA / mes",
  4: "Mensajes de IA ilimitados",
};

const DESCRIPCIONES: Record<number, string> = {
  1: "Para empezar a explorar el poder de la IA en tu negocio.",
  2: "Ideal para pymes que necesitan automatización básica.",
  3: "Para empresas establecidas con alto volumen de consultas.",
  4: "Soluciones a la medida para grandes corporaciones.",
};

const PRECIO = new Intl.NumberFormat("es-CO");

function textoSedes(maxSedes: number): string {
  if (!Number.isFinite(maxSedes)) return "Sedes ilimitadas";
  return maxSedes === 1 ? "1 sede" : `Hasta ${maxSedes} sedes`;
}

export function SubscriptionView() {
  const [planes, setPlanes] = useState<PlanBackend[]>([]);
  const [planActual, setPlanActual] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        const negocioId = localStorage.getItem("active_business_id");

        const [catalogo, negocio] = await Promise.all([
          apiClient<PlanBackend[]>("/planes"),
          // Sin negocio activo se muestra el catálogo igual, solo que sin
          // marcar cuál es el plan contratado.
          negocioId
            ? apiClient<NegocioBackend>(`/negocios/${negocioId}`).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (cancelado) return;

        setPlanes(catalogo);
        setPlanActual(negocio?.plan ?? null);
      } catch (e) {
        if (!cancelado) {
          setError(e instanceof Error ? e.message : "No se pudieron cargar los planes.");
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  const tarjetas = planes.map((plan) => {
    const esActual = planActual === plan.id;
    const esGratuito = plan.precioMensual === 0;

    return {
      id: plan.id,
      name: plan.nombre,
      price: esGratuito ? "Gratuito" : PRECIO.format(plan.precioMensual),
      currency: esGratuito ? undefined : "COP",
      period: esGratuito ? undefined : "/mes",
      description: DESCRIPCIONES[plan.id] ?? "",
      features: [
        { icon: Phone, text: `${textoSedes(plan.maxSedes)} con WhatsApp` },
        { icon: MessageSquare, text: MENSAJES_IA[plan.id] ?? "Mensajes de IA incluidos" },
        {
          icon: Building2,
          text: plan.funcionalidades.length
            ? `${plan.funcionalidades.length} funciones Premium`
            : "Funciones básicas",
        },
      ],
      // El más caro del catálogo es el que se destaca, sin nombres fijos.
      isPopular: plan.id === 2,
      isActive: esActual,
      buttonText: esActual ? "Plan Actual" : `Mejorar a ${plan.nombre}`,
      disabled: esActual,
    };
  });

  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Planes y Suscripción</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu plan y escala el poder de Luka AI</p>
        </div>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 bg-card border border-border rounded-3xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && error && (
        <div className="bg-card border border-border rounded-3xl p-8 text-center">
          <p className="text-sm font-bold text-foreground">No pudimos cargar los planes</p>
          <p className="text-xs mt-1 text-muted-foreground">{error}</p>
        </div>
      )}

      {/* Pricing Plans (Bento Grid Style) */}
      {!isLoading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          {tarjetas.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col bg-card border rounded-3xl p-6 shadow-sm transition-all duration-300 ${
                plan.isActive
                  ? "border-emerald-500 ring-1 ring-emerald-500/20"
                  : "border-border hover:border-emerald-500/50"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                  Más Popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                  {plan.name}
                  {plan.isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Plan Activo" />
                  )}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-black text-foreground">{plan.price}</span>
                  {plan.currency && (
                    <span className="text-sm font-bold text-muted-foreground">{plan.currency}</span>
                  )}
                  {plan.period && (
                    <span className="text-sm font-medium text-muted-foreground">{plan.period}</span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground h-10">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-6">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">{feature.text}</span>
                  </div>
                ))}
              </div>

              <button
                disabled={plan.disabled}
                className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                  plan.isActive
                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                    : "bg-muted hover:bg-muted/80 text-foreground"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {plan.buttonText}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
