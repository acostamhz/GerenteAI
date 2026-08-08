import {
  Clock3,
  Wallet,
  Boxes,
  TrendingUp,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

const benefits = [
  {
    icon: Clock3,
    title: "Ahorra horas de trabajo",
    description:
      "Registra ventas, gastos e inventario hablando con Luka en segundos.",
  },
  {
    icon: Wallet,
    title: "Conoce tus ganancias reales",
    description:
      "Consulta ingresos, utilidad y flujo de caja cuando lo necesites.",
  },
  {
    icon: Boxes,
    title: "Nunca pierdas el control del inventario",
    description:
      "Lleva un seguimiento de productos, compras y existencias.",
  },
  {
    icon: TrendingUp,
    title: "Toma mejores decisiones",
    description:
      "Obtén reportes inteligentes para hacer crecer tu negocio.",
  },
  {
    icon: ShieldCheck,
    title: "Toda tu información organizada",
    description:
      "Clientes, proveedores, ventas y gastos en un solo lugar.",
  },
  {
    icon: Smartphone,
    title: "Desde cualquier lugar",
    description:
      "Solo necesitas WhatsApp para administrar tu negocio.",
  },
];

export function CoworkingBenefitsSection() {
  return (
    <section className="relative py-24">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}

        <div className="max-w-4xl mx-auto text-center">

          <div className="inline-flex items-center rounded-full bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700">
            Más que una IA
          </div>

          <h2 className="mt-8 text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Luka trabaja para que tú puedas dedicarte a vender.
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-600 dark:text-slate-400">
            Menos tiempo administrando. Más tiempo atendiendo clientes y haciendo
            crecer tu negocio.
          </p>

        </div>

        {/* Cards */}

        <div className="mt-24 grid gap-8 md:grid-cols-2 xl:grid-cols-3">

          {benefits.map((benefit) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-10 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-teal-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                  <Icon size={32} />
                </div>

                <h3 className="mt-10 text-2xl font-bold leading-tight text-slate-900 dark:text-white">
                  {benefit.title}
                </h3>

                <p className="mt-6 text-lg leading-9 text-slate-600 dark:text-slate-400">
                  {benefit.description}
                </p>

              </div>
            );
          })}

        </div>
      </div>
    </section>
  );
}