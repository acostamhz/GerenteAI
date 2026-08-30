
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { LukaHeroChat } from "@/features/assistant";

export function CoworkingHeroSection() {
  return (
    <section className="relative pt-40 pb-36 px-6 md:px-12 max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
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
          <Link
            to="/register"
            className="px-8 py-4 rounded-xl bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-all duration-300 flex items-center gap-2 hover:scale-[1.02] shadow-lg shadow-emerald-500/25 active:scale-[0.98]"
          >
            <span>Comenzar prueba gratis</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
          <a
            href="#planes"
            className="px-8 py-4 rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-md text-slate-900 dark:text-white font-medium border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
          >
            Ver planes y precios
          </a>
        </div>
      </div>

      {/* Right Column: Interactive Chat Interface */}
      <div className="flex-1 w-full max-w-lg z-10 flex justify-center">
        <LukaHeroChat />
      </div>
    </section>
  );
}
