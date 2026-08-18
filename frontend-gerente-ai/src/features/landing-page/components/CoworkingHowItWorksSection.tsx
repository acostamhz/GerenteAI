import {
  MessageCircle,
  BrainCircuit,
  BarChart3,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    icon: MessageCircle,
    title: "1. Habla con Luka",
    description:
      "Escribe o envía audios por WhatsApp como lo haces todos los días.",
  },
  {
    icon: BrainCircuit,
    title: "2. Luka organiza todo",
    description:
      "La IA registra ventas, gastos, inventario, clientes y comprende el contexto de tu negocio.",
  },
  {
    icon: BarChart3,
    title: "3. Toma mejores decisiones",
    description:
      "Consulta reportes, utilidades, productos más vendidos y recibe recomendaciones inteligentes.",
  },
];

export function CoworkingHowItWorksSection() {
  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Encabezado */}

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-5 py-2 text-sm font-semibold">
            Así de simple
          </div>

          <h2 className="mt-8 text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Administrar tu negocio nunca fue tan fácil.
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-600 dark:text-slate-400">
            No necesitas aprender un software nuevo. Solo conversa con Luka y
            deja que la inteligencia artificial haga el resto.
          </p>
        </div>

        {/* Pasos */}

        <div className="relative mt-24 grid gap-10 lg:grid-cols-3">

          {steps.map((step, index) => {
            const Icon = step.icon;

            return (
              <div key={step.title} className="relative">

                {/* Flecha */}

                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute -right-9 top-1/2 -translate-y-1/2 z-20">
                    <ArrowRight
                      size={44}
                      className="text-slate-300"
                    />
                  </div>
                )}

                {/* Card */}

                <div className="h-full rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-10 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">

                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg">
                    <Icon size={38} />
                  </div>

                  <h3 className="mt-10 text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                    {step.title}
                  </h3>

                  <p className="mt-6 text-xl leading-10 text-slate-600 dark:text-slate-400">
                    {step.description}
                  </p>

                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}