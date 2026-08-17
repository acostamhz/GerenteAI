import { Play } from "lucide-react";

export function CoworkingMediaSection() {
  return (
    <section className="py-16 px-6 max-w-7xl mx-auto">
      <div className="relative rounded-3xl overflow-hidden border border-gray-200 dark:border-white/10 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900/60 dark:to-slate-900/40 p-4 md:p-8 shadow-xl">
        <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-slate-900 aspect-[16/9] flex items-center justify-center group cursor-pointer shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/10 group-hover:opacity-75 transition-opacity" />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
            <p className="font-semibold text-white text-lg tracking-wide">Ver Video de Demostración</p>
          </div>
        </div>
      </div>
    </section>
  );
}
