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

type Business = {
  title: string;
  description: string;
  logo: string;
};

const businesses: Business[] = [
  {
    title: "Cafeterías",
    description: "Ventas, insumos y clientes frecuentes.",
    logo: "/Starbucks.jpg",
  },
  {
    title: "Restaurantes",
    description: "Pedidos, inventario y gastos diarios.",
    logo: "/McDonalds.jpg",
  },
  {
    title: "Tiendas",
    description: "Control de productos y ventas.",
    logo: "/Ara.png",
  },
  {
    title: "Minimercados",
    description: "Inventario y proveedores.",
    logo: "/Carulla.jpg",
  },
  {
    title: "Peluquerías",
    description: "Citas, clientes e ingresos.",
    logo: "/Arte.png",
  },
  {
    title: "Ferreterías",
    description: "Stock y compras.",
    logo: "/Homecenter.jpg",
  },
  {
    title: "Talleres",
    description: "Servicios, repuestos y clientes.",
    logo: "/Auteco.jpg",
  },
  {
    title: "Papelerías",
    description: "Productos escolares y ventas.",
    logo: "/Buscalibre.png",
  },
];

export function CoworkingBusinessesSection() {
  return (
    <section
      className="
        relative
        px-6
        pt-4
        pb-6
        md:pt-14
        md:pb-16
      "
    >
      <div
        className="
          mx-auto
          max-w-7xl
          overflow-hidden
          rounded-[2.5rem]
          border
          border-slate-200/90
          bg-slate-100/90
          px-6
          py-16
          shadow-[0_25px_70px_rgba(15,23,42,0.08)]
          backdrop-blur-xl

          dark:border-white/[0.08]
          dark:bg-[#111925]
          dark:shadow-black/20

          md:px-10
          md:py-20
          lg:px-14
        "
      >
        {/* Encabezado */}
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="
              inline-flex
              items-center
              rounded-full
              border
              border-emerald-600/15
              bg-emerald-950/[0.06]
              px-5
              py-2
              text-sm
              font-semibold
              text-emerald-800

              dark:border-emerald-400/20
              dark:bg-emerald-400/[0.08]
              dark:text-emerald-300
            "
          >
            Un solo asistente para miles de negocios
          </div>

          <h2
            className="
              mt-8
              text-5xl
              font-bold
              tracking-tight
              text-slate-950
              md:text-6xl

              dark:text-white
            "
          >
            Luka se adapta a

            <span
              className="
                block
                bg-gradient-to-r
                from-teal-700
                via-cyan-600
                to-emerald-600
                bg-clip-text
                text-transparent

                dark:from-emerald-400
                dark:via-cyan-400
                dark:to-teal-400
              "
            >
              la forma en que ya trabajas.
            </span>
          </h2>

          <p
            className="
              mt-8
              text-xl
              leading-9
              text-slate-700

              dark:text-slate-300
            "
          >
            No importa si administras una cafetería, una tienda o un taller.
            Luka entiende tu negocio y te ayuda desde el primer día.
          </p>
        </div>

        {/* Categorías */}
        <div
          className="
            mx-auto
            mt-16
            grid
            max-w-6xl
            gap-5
            sm:grid-cols-2
            xl:grid-cols-4
          "
        >
          {businesses.map((business) => (
            <div
              key={business.title}
              className="
                group
                rounded-[1.75rem]
                border
                border-slate-200
                bg-white
                p-6
                shadow-[0_10px_30px_rgba(15,23,42,0.06)]
                transition-all
                duration-300
                hover:-translate-y-1.5
                hover:border-emerald-500/30
                hover:shadow-[0_18px_40px_rgba(15,23,42,0.10)]

                dark:border-white/[0.08]
                dark:bg-[#17202D]
                dark:shadow-black/10
                dark:hover:border-emerald-400/25
                dark:hover:bg-[#192432]

                sm:p-7
              "
            >
              {/* Logo circular */}
              <div
                className="
                  flex
                  h-14
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  border
                  border-slate-200/80
                  bg-white
                  shadow-sm
                  ring-1
                  ring-slate-200/60

                  dark:border-slate-200/80
                  dark:bg-white
                  dark:ring-white/10
                "
              >
                <img
                  src={business.logo}
                  alt={`Logo de ${business.title}`}
                  className="
                    h-full
                    w-full
                    rounded-full
                    object-contain
                  "
                />
              </div>

              {/* Nombre */}
              <h3
                className="
                  mt-7
                  text-[1.25rem]
                  font-bold
                  tracking-tight
                  text-slate-950

                  dark:text-white
                "
              >
                {business.title}
              </h3>

              {/* Descripción */}
              <p
                className="
                  mt-3
                  text-[0.95rem]
                  leading-7
                  text-slate-600

                  dark:text-slate-400
                "
              >
                {business.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}