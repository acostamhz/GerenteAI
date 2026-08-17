import { ArrowRight, Sparkles, Bot } from "lucide-react";

export function CoworkingHeroSection() {
  return (
    <section className="relative pt-40 pb-20 px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
      {/* Background soft gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-900/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300/20 dark:bg-blue-900/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

      {/* Left Column: Text Content */}
      <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-emerald-500/10 backdrop-blur-md border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-medium mb-8 shadow-sm">
          <Sparkles className="w-4 h-4" />
          <span>Integra Inteligencia Artificial en tu negocio</span>
        </div>

        <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight max-w-2xl mb-6">
          Conoce a Luka, tu asistente con <br className="hidden lg:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">
            Inteligencia Artificial
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-xl mb-10 leading-relaxed">
          Automatiza tareas, mejora la atención al cliente y obtén analíticas en tiempo real. Luka AI es el aliado perfecto para empresas modernas que buscan escalar.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button className="px-8 py-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 active:scale-[0.98]">
            Comenzar Prueba Gratis
            <ArrowRight className="w-5 h-5" />
          </button>
          <button className="px-8 py-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-white font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm">
            Agendar Demostración
          </button>
        </div>
      </div>

      {/* Right Column: Chat Interface Mockup */}
      <div className="flex-1 w-full max-w-lg z-10 relative">
        {/* Glow behind the chat */}
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-400/20 blur-2xl rounded-[2.5rem] -z-10"></div>
        
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-[2rem] shadow-2xl shadow-slate-900/10 dark:shadow-slate-950/50 overflow-hidden flex flex-col h-[500px]">
          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-white/5 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-md flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Bot className="w-5 h-5" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">Luka AI</h3>
              <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                En línea
              </p>
            </div>
          </div>

          {/* Chat Body */}
          <div className="flex-1 p-6 flex flex-col gap-4 overflow-y-auto">
            {/* User Message */}
            <div className="self-end max-w-[85%] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm">
              <p className="text-sm">¿Cómo van las ventas esta semana comparadas con la anterior?</p>
            </div>
            
            {/* AI Message */}
            <div className="self-start max-w-[85%] bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex gap-3">
              <div className="shrink-0 w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center mt-0.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed mb-3">
                  Las ventas esta semana ascienden a <strong className="text-slate-900 dark:text-white">$12,450</strong>, lo que representa un <strong>aumento del 18%</strong> frente a la semana pasada.
                </p>
                <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3 flex items-center gap-3">
                   <div className="flex-1 h-2 bg-emerald-200 dark:bg-emerald-900/50 rounded-full overflow-hidden">
                     <div className="h-full bg-emerald-500 w-[75%] rounded-full"></div>
                   </div>
                   <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">+18%</span>
                </div>
              </div>
            </div>
            
             {/* User Message */}
             <div className="self-end max-w-[85%] bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm mt-2">
              <p className="text-sm">¡Excelente! Genera un reporte en PDF y envíamelo.</p>
            </div>
          </div>

          {/* Chat Input Placeholder */}
          <div className="p-4 bg-white/50 dark:bg-slate-800/30 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 shadow-sm">
               <div className="flex-1 text-slate-400 text-sm">Generando reporte PDF...</div>
               <div className="flex gap-1">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-100"></span>
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce delay-200"></span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
