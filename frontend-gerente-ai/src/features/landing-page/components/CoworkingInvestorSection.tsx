import { ArrowRight, TrendingUp } from "lucide-react";

export function CoworkingInvestorSection() {
  return (
    <section id="inversores" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white p-8 md:p-14 border border-emerald-500/30 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 text-emerald-500/10 rotate-12">
            <TrendingUp className="w-72 h-72" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">¿Eres Inversor?</h2>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Estamos transformando la manera en que millones de micronegocios gestionan sus finanzas en LATAM. Únete a nuestra ronda de inversión y sé parte del crecimiento.
            </p>
            
            <a 
              href="mailto:inversores@luka.ai" 
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-lg hover:bg-emerald-400 transition-all hover:scale-105 shadow-xl shadow-emerald-500/20"
            >
              Contáctanos
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
