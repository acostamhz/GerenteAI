import {
  Coffee,
  UtensilsCrossed,
  Store,
  ShoppingBasket,
  Scissors,
  Wrench,
  Truck,
  BookOpen,
} from "lucide-react";

const businesses = [
  {
    icon: Coffee,
    title: "Cafeterías",
    description: "Ventas, insumos y clientes frecuentes.",
  },
  {
    icon: UtensilsCrossed,
    title: "Restaurantes",
    description: "Pedidos, inventario y gastos diarios.",
  },
  {
    icon: Store,
    title: "Tiendas",
    description: "Control de productos y ventas.",
  },
  {
    icon: ShoppingBasket,
    title: "Minimercados",
    description: "Inventario y proveedores.",
  },
  {
    icon: Scissors,
    title: "Peluquerías",
    description: "Citas, clientes e ingresos.",
  },
  {
    icon: Wrench,
    title: "Ferreterías",
    description: "Stock y compras.",
  },
  {
    icon: Truck,
    title: "Talleres",
    description: "Servicios, repuestos y clientes.",
  },
  {
    icon: BookOpen,
    title: "Papelerías",
    description: "Productos escolares y ventas.",
  },
];

export function CoworkingBusinessesSection() {
  return (
    <section className="relative px-6 md:px-12 py-28">
      <div className="max-w-7xl mx-auto">

        <div className="max-w-3xl mx-auto text-center">

          <div className="inline-flex items-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-5 py-2 text-sm font-semibold text-teal-700 dark:text-emerald-400 border border-transparent dark:border-emerald-500/20">
            Un solo asistente para miles de negocios
          </div>

          <h2 className="mt-8 text-5xl md:text-6xl font-bold tracking-tight text-slate-900 dark:text-white">
            Luka se adapta a
            <span className="block bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-500 dark:from-emerald-400 dark:via-cyan-400 dark:to-teal-400 bg-clip-text text-transparent">
              la forma en que ya trabajas.
            </span>
          </h2>

          <p className="mt-8 text-xl leading-9 text-slate-600 dark:text-slate-400">
            No importa si administras una cafetería, una tienda o un taller.
            Luka entiende tu negocio y te ayuda desde el primer día.
          </p>
        </div>

        <div className="mt-20 grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {businesses.map((business) => {
            const Icon = business.icon;

            return (
              <div
                key={business.title}
                className="rounded-[2rem] border border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl p-8 shadow-xl shadow-slate-900/5 dark:shadow-black/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:hover:border-emerald-500/20"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-600 text-white shadow-lg shadow-teal-500/20">
                  <Icon size={30} />
                </div>

                <h3 className="mt-8 text-3xl font-bold text-slate-900 dark:text-white">
                  {business.title}
                </h3>

                <p className="mt-4 text-lg leading-8 text-slate-600 dark:text-slate-400">
                  {business.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}