import {
  DollarSign,
  Package,
  Users,
  ReceiptText,
  Truck,
  Bell,
  FileBarChart,
  BrainCircuit,
} from "lucide-react";

const features = [
  {
    icon: DollarSign,
    title: "Ventas",
    description:
      "Registra ventas al instante y conoce tus ingresos en tiempo real.",
  },
  {
    icon: Package,
    title: "Inventario",
    description:
      "Controla existencias, productos agotados y movimientos de inventario.",
  },
  {
    icon: Users,
    title: "Clientes",
    description:
      "Consulta historial de compras y construye relaciones más fuertes.",
  },
  {
    icon: ReceiptText,
    title: "Gastos",
    description:
      "Lleva el control de cada gasto sin usar hojas de cálculo.",
  },
  {
    icon: Truck,
    title: "Proveedores",
    description:
      "Organiza compras, pagos y pedidos desde un solo lugar.",
  },
  {
    icon: Bell,
    title: "Recordatorios",
    description:
      "Recibe alertas sobre pagos, inventario y tareas importantes.",
  },
  {
    icon: FileBarChart,
    title: "Reportes",
    description:
      "Consulta indicadores, utilidades y desempeño cuando quieras.",
  },
  {
    icon: BrainCircuit,
    title: "IA",
    description:
      "Recibe recomendaciones inteligentes para mejorar tu negocio.",
  },
];

export function CoworkingFeaturesSection() {
  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6 md:px-12">

        {/* Header */}

        <div className="max-w-4xl mx-auto text-center">

          <div className="inline-flex items-center rounded-full bg-emerald-50 px-5 py-2 text-sm font-semibold text-emerald-700">
            Una plataforma completa
          </div>

          <h2 className="mt-8 text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Todo lo que necesitas para administrar tu negocio.
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-600 dark:text-slate-400">
            Luka reúne en una sola plataforma las herramientas que normalmente
            encontrarías distribuidas en diferentes aplicaciones.
          </p>

        </div>

        {/* Grid */}

        <div className="mt-24 grid gap-8 md:grid-cols-2 xl:grid-cols-4">

          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 shadow-xl shadow-slate-900/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <Icon size={28} />
                </div>

                <h3 className="mt-8 text-2xl font-bold text-slate-900 dark:text-white">
                  {feature.title}
                </h3>

                <p className="mt-5 text-lg leading-9 text-slate-600 dark:text-slate-400">
                  {feature.description}
                </p>

              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
}