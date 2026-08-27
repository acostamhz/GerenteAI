import {
  BrainCircuit,
  Clock3,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";

const highlights = [
  {
    icon: Clock3,
    title: "24/7",
    description: "Disponible siempre",
  },
  {
    icon: MessageCircle,
    title: "WhatsApp",
    description: "Sin instalar aplicaciones",
  },
  {
    icon: BrainCircuit,
    title: "IA",
    description: "Entiende lenguaje natural",
  },
  {
    icon: ShieldCheck,
    title: "Seguro",
    description: "Información protegida",
  },
];

export function CoworkingHighlightsSection() {
  return (
    <section className="relative pb-20">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {highlights.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="group rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-10 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg">
                    <Icon size={38} />
                  </div>

                  <h3 className="mt-10 text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-xl leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
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