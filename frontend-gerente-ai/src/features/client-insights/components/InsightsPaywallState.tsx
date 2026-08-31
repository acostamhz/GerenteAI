import { Sparkles, Lock, ArrowRight, CheckCircle2, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";

interface InsightsPaywallStateProps {
  onUpgrade: () => void;
}

export function InsightsPaywallState({ onUpgrade }: InsightsPaywallStateProps) {
  return (
    <div className="relative max-w-4xl mx-auto py-2 sm:py-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Banner Header */}
      <div className="text-center mb-4 sm:mb-8 px-3">
        <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] sm:text-xs font-bold mb-2.5 sm:mb-4 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
          <span>Exclusivo para Planes Gerente y Administrador</span>
        </div>

        <h2 className="text-xl sm:text-3xl font-black text-foreground tracking-tight max-w-2xl mx-auto leading-tight">
          Toma decisiones estratégicas con{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400">
            Recomendaciones de IA
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 sm:mt-3 max-w-xl mx-auto leading-relaxed">
          Luka analiza continuamente tus ventas, gastos y movimientos para entregarte alertas inteligentes y oportunidades de ahorro en tiempo real.
        </p>
      </div>

      {/* Interactive Paywall Teaser Container */}
      <div className="relative bg-gradient-to-b from-emerald-500/5 via-card/70 to-card dark:from-emerald-500/10 dark:via-slate-900/60 dark:to-slate-950 backdrop-blur-xl border border-emerald-500/20 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl overflow-hidden min-h-[220px] sm:min-h-[260px] flex items-center justify-center">
        {/* Blurred Insights Preview Cards */}
        <div className="hidden sm:grid sm:grid-cols-3 gap-4 opacity-50 blur-[2px] pointer-events-none select-none w-full">
          {/* Card 1 */}
          <div className="bg-card border border-amber-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400">Alerta de Margen</span>
            </div>
            <p className="text-xs font-bold text-foreground line-clamp-1">Producto líder con bajo margen</p>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
              Tus ventas aumentaron 24%, pero el costo de adquisición redujo el margen neto al 8%.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-card border border-emerald-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">Oportunidad de Flujo</span>
            </div>
            <p className="text-xs font-bold text-foreground line-clamp-1">Proyección de liquidez positiva</p>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
              El flujo estimado para los próximos 15 días permite liquidar compras con descuento.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-card border border-cyan-500/30 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
                <Lightbulb className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400">Acción Sugerida</span>
            </div>
            <p className="text-xs font-bold text-foreground line-clamp-1">Optimización de inventario</p>
            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
              3 productos presentan rotación lenta. Activa una promoción para liberar capital.
            </p>
          </div>
        </div>

        {/* Center Floating Lock & CTA con gradiente transparente hacia opaco */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-gradient-to-b from-transparent via-card/80 to-card dark:via-slate-950/80 dark:to-slate-950 backdrop-blur-xs">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2.5 sm:mb-3.5 shadow-md shadow-emerald-500/10">
            <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <h3 className="text-base sm:text-xl font-bold text-foreground max-w-sm sm:max-w-md leading-snug">
            Desbloquea la Inteligencia Financiera de tu Negocio
          </h3>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 max-w-xs sm:max-w-md">
            Disponible a partir del <strong className="text-foreground">Plan Gerente ($79.900/mes)</strong> y <strong className="text-foreground">Plan Administrador ($249.900/mes)</strong>.
          </p>

          <button
            type="button"
            onClick={onUpgrade}
            className="mt-3.5 sm:mt-5 inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
            <span>Mejorar mi Plan</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
          </button>
        </div>
      </div>

      {/* Feature Bullet List (Grid 2x2 en móvil, 4 en desktop) */}
      <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 px-1 sm:px-2">
        <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-foreground">Alertas Prescriptivas</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Sugerencias concretas con 1 clic.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-foreground">Márgenes y Costos</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Detección automática de fugas.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-foreground">Cuota 500+ Mensajes</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Auditorías financieras continuas.</p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-muted/30 border border-border">
          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-[11px] sm:text-xs font-bold text-foreground">Múltiples Sedes</p>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">Análisis individual o total.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
