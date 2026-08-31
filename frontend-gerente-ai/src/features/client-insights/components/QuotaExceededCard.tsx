import { Zap, Sparkles, ArrowRight } from "lucide-react";

interface QuotaExceededCardProps {
  onUpgrade: () => void;
}

export function QuotaExceededCard({ onUpgrade }: QuotaExceededCardProps) {
  return (
    <div className="bg-card border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-6 sm:p-8 text-center max-w-xl mx-auto shadow-xl animate-in fade-in zoom-in-95 duration-200">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-4 border border-amber-500/20">
        <Zap className="w-6 h-6" />
      </div>

      <h3 className="text-lg font-black text-foreground tracking-tight">
        Límite Mensual de Mensajes de IA Alcanzado
      </h3>

      <p className="text-xs sm:text-sm text-muted-foreground mt-2 leading-relaxed">
        Has consumido la cuota de análisis de IA de tu plan para este ciclo de facturación. Puedes mejorar tu plan para obtener más mensajes mensuales o esperar al siguiente ciclo de renovación.
      </p>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button
          type="button"
          onClick={onUpgrade}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-slate-950" />
          <span>Aumentar Cuota de IA</span>
          <ArrowRight className="w-4 h-4 text-slate-950" />
        </button>
      </div>
    </div>
  );
}
