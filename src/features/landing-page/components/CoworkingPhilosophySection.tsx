import { Building2, Rocket, Users, Sparkles } from "lucide-react";

const philosophyItems = [
  {
    icon: Building2,
    title: "Diseñado para negocios reales",
    description:
      "Cada función nace de las necesidades diarias de cafeterías, tiendas, restaurantes y otros pequeños negocios.",
  },
  {
    icon: Users,
    title: "Construido junto a emprendedores",
    description:
      "Estamos validando Luka con negocios que aportan comentarios para mejorar cada versión.",
  },
  {
    icon: Rocket,
    title: "Evolución constante",
    description:
      "Nuevas capacidades llegarán continuamente gracias a la retroalimentación de nuestros usuarios.",
  },
];

export function CoworkingPhilosophySection() {
  return (
    <section className="relative py-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Nuestra filosofía</span>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Luka evoluciona con cada negocio que lo utiliza.
          </h2>

          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
            No creemos en construir funciones porque sí. Escuchamos a los
            emprendedores y desarrollamos herramientas que realmente
            simplifican la administración de sus negocios.
          </p>
        </div>

        {/* Philosophy Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {philosophyItems.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-700 dark:bg-emerald-600 flex items-center justify-center text-white mb-7">
                  <Icon className="w-7 h-7" />
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-snug">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm md:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Join CTA */}
        <div className="mt-16 rounded-[2rem] bg-gradient-to-r from-emerald-700 to-teal-500 p-8 md:p-10 text-white shadow-xl shadow-emerald-500/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
            
            {/* Text */}
            <div className="max-w-3xl">
              <h3 className="text-2xl md:text-3xl font-bold">
                ¿Quieres ayudarnos a construir Luka?
              </h3>

              <p className="mt-4 text-sm md:text-base text-emerald-50 leading-relaxed">
                Únete al programa de acceso anticipado y ayúdanos a crear la
                plataforma que cambiará la forma en que los pequeños negocios
                administran su día a día.
              </p>
            </div>

            {/* Button */}
            <button
              type="button"
              className="shrink-0 inline-flex items-center justify-center px-8 py-4 rounded-xl bg-white text-emerald-700 font-bold shadow-lg transition-all duration-300 hover:bg-emerald-50 hover:scale-[1.02] active:scale-[0.98]"
            >
              Únete
            </button>

          </div>
        </div>

      </div>
    </section>
  );
}