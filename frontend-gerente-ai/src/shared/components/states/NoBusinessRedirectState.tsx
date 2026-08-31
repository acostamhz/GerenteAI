import { Link } from "react-router";
import { Building2, ArrowRight, Sparkles } from "lucide-react";

interface NoBusinessRedirectStateProps {
  title?: string;
  description?: string;
}

export function NoBusinessRedirectState({
  title = "Aún no tienes un negocio registrado",
  description = "Para acceder a esta sección, primero debes registrar tu negocio y configurar tu primera sede.",
}: NoBusinessRedirectStateProps) {
  return (
    <div className="relative max-w-xl mx-auto py-12 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 shadow-2xl">
        <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-6 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <Building2 className="w-8 h-8" />
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          {title}
        </h2>

        <p className="text-xs sm:text-sm text-muted-foreground mt-2.5 max-w-md mx-auto leading-relaxed">
          {description}
        </p>

        <div className="mt-8 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-slate-950" />
            <span>Ir a Resumen para empezar</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </Link>
        </div>
      </div>
    </div>
  );
}
