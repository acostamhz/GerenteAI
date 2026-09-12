"use client";

import { motion, useReducedMotion } from "motion/react";

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

const containerVariants = {
  hidden: {
    opacity: 0,
    y: 35,
    scale: 0.985,
    filter: "blur(8px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const headerContainerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const headerItemVariants = {
  hidden: {
    opacity: 0,
    y: 18,
    filter: "blur(5px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

export function CoworkingBusinessesSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="
        relative
        px-6
        pt-10
        pb-6
        md:pt-14
        md:pb-2
      "
    >
      <motion.div
        variants={containerVariants}
        initial={
          shouldReduceMotion ? false : "hidden"
        }
        whileInView={
          shouldReduceMotion ? undefined : "visible"
        }
        viewport={{
          once: true,
          amount: 0.15,
        }}
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
        {/* =====================================================
            ENCABEZADO
            Entrada escalonada
        ===================================================== */}

        <motion.div
          variants={headerContainerVariants}
          initial={
            shouldReduceMotion ? false : "hidden"
          }
          whileInView={
            shouldReduceMotion ? undefined : "visible"
          }
          viewport={{
            once: true,
            amount: 0.25,
          }}
          className="
            mx-auto
            max-w-3xl
            text-center
          "
        >
          {/* Badge */}

          <motion.div
            variants={headerItemVariants}
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
          </motion.div>

          {/* Título */}

          <motion.h2
            variants={headerItemVariants}
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
            Luka se adapta

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
          </motion.h2>

          {/* Descripción */}

          <motion.p
            variants={headerItemVariants}
            className="
              mt-8
              text-xl
              leading-9
              text-slate-700

              dark:text-slate-300
            "
          >
            No importa si administras una cafetería, una tienda
            o un taller. Luka entiende tu negocio y te ayuda desde
            el primer día.
          </motion.p>
        </motion.div>

        {/* =====================================================
            CATEGORÍAS
            Las tarjetas aparecen en cascada
        ===================================================== */}

        <motion.div
          initial={
            shouldReduceMotion
              ? false
              : {
                  opacity: 0,
                }
          }
          whileInView={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: 1,
                }
          }
          viewport={{
            once: true,
            amount: 0.12,
          }}
          transition={{
            duration: 0.4,
            delay: 0.15,
          }}
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
          {businesses.map((business, index) => {
            const isEven = index % 2 === 0;

            return (
              <motion.div
                key={business.title}
                initial={
                  shouldReduceMotion
                    ? false
                    : {
                        opacity: 0,
                        x: isEven ? -28 : 28,
                        y: 28,
                        scale: 0.96,
                        filter: "blur(5px)",
                      }
                }
                whileInView={
                  shouldReduceMotion
                    ? undefined
                    : {
                        opacity: 1,
                        x: 0,
                        y: 0,
                        scale: 1,
                        filter: "blur(0px)",
                      }
                }
                viewport={{
                  once: true,
                  amount: 0.2,
                }}
                transition={{
                  duration: 0.65,
                  delay: 0.2 + index * 0.07,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={
                  shouldReduceMotion
                    ? undefined
                    : {
                        y: -6,
                        transition: {
                          duration: 0.25,
                          ease: [0.22, 1, 0.36, 1],
                        },
                      }
                }
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
                {/* =================================================
                    LOGO
                ================================================= */}

                <motion.div
                  initial={
                    shouldReduceMotion
                      ? false
                      : {
                          opacity: 0,
                          scale: 0.7,
                        }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? undefined
                      : {
                          opacity: 1,
                          scale: 1,
                        }
                  }
                  viewport={{
                    once: true,
                    amount: 0.2,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.3 + index * 0.07,
                    ease: [0.22, 1, 0.36, 1],
                  }}
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
                </motion.div>

                {/* =================================================
                    NOMBRE
                ================================================= */}

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

                {/* =================================================
                    DESCRIPCIÓN
                ================================================= */}

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
              </motion.div>
            );
          })}
        </motion.div>
      </motion.div>
    </section>
  );
}