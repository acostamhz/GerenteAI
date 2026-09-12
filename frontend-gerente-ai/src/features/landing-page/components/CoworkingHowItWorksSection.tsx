import {
  MessageCircle,
  BrainCircuit,
  BarChart3,
  ArrowUpRight,
  Sparkles,
  Mic,
  Package,
  TrendingUp,
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
      "Consulta reportes y recibe recomendaciones inteligentes.",
  },
];

/* =========================================================
   TELÉFONO — WHATSAPP
   ========================================================= */

function WhatsAppGraphic() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[245px] overflow-hidden sm:h-[270px] md:h-full">
      {/* Glow */}
      <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />

      {/* Decorative circle */}
      <div className="absolute right-8 top-8 h-5 w-5 rounded-full border-2 border-emerald-900/20" />

      {/* Decorative dot */}
      <div className="absolute bottom-12 left-10 h-3 w-3 rounded-full bg-emerald-900/20" />

      {/* PHONE */}
      <div
        className="
          absolute
          bottom-[-55px]
          right-[-12px]
          z-10
          h-[300px]
          w-[160px]
          rotate-[6deg]
          rounded-[2.2rem]
          border-[7px]
          border-slate-950
          bg-white
          shadow-2xl

          sm:right-4
          sm:h-[330px]
          sm:w-[175px]

          md:bottom-[-42px]
          md:right-3
          md:h-[330px]
          md:w-[175px]
        "
      >
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-2 h-5 w-16 -translate-x-1/2 rounded-full bg-slate-950" />

        <div className="mt-10 px-3">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white">
              <MessageCircle size={14} />
            </div>

            <div>
              <div className="text-[9px] font-bold text-slate-900">
                Luka AI
              </div>

              <div className="text-[7px] text-slate-400">
                En línea
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="mt-5 space-y-3">
            <div className="ml-auto w-[78%] rounded-2xl rounded-br-sm bg-emerald-500 px-3 py-2 text-[8px] text-white">
              ¿Cómo fueron las ventas hoy?
            </div>

            <div className="w-[84%] rounded-2xl rounded-bl-sm bg-slate-100 px-3 py-2 text-[8px] leading-3 text-slate-700">
              Hoy vendiste $428.000.
              <br />
              Tus ventas aumentaron 18%.
            </div>

            <div className="ml-auto w-[65%] rounded-2xl rounded-br-sm bg-emerald-500 px-3 py-2 text-[8px] text-white">
              ¿Y cuáles fueron los productos más vendidos?
            </div>
          </div>
        </div>
      </div>

      {/* AUDIO */}
      <div
        className="
          absolute
          bottom-4
          left-4
          z-20
          flex
          max-w-[245px]
          items-center
          gap-3
          rounded-2xl
          bg-white
          px-4
          py-3
          shadow-xl

          sm:left-8
          sm:max-w-[275px]

          md:bottom-8
          md:left-10
        "
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
          <Mic size={18} />
        </div>

        <div>
          <p className="text-[10px] font-semibold text-slate-900">
            También puedes enviar audios
          </p>

          <div className="mt-1 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />

            <span className="text-[8px] text-slate-400">
              Luka entiende tu mensaje
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BRAIN GRAPHIC
   ========================================================= */

function BrainGraphic() {
  return (
    <div
      className="
        absolute
        inset-x-0
        bottom-0
        h-[220px]
        overflow-hidden

        sm:h-[235px]

        md:absolute
        md:inset-0
        md:h-full
      "
    >
      <div className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-cyan-300/30 blur-3xl" />

      <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />

      {/* Inventory */}
      <div
        className="
          absolute
          bottom-7
          left-5
          z-20
          rotate-[-6deg]
          rounded-2xl
          bg-white/90
          px-4
          py-3
          shadow-xl
          backdrop-blur-md

          sm:left-10

          md:bottom-auto
          md:left-8
          md:top-12
        "
      >
        <div className="flex items-center gap-2">
          <Package size={16} className="text-cyan-600" />

          <span className="text-[10px] font-bold text-slate-900">
            Inventario
          </span>
        </div>

        <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-[72%] rounded-full bg-cyan-500" />
        </div>
      </div>

      {/* IA */}
      <div
        className="
          absolute
          bottom-9
          right-5
          z-20
          rotate-[5deg]
          rounded-2xl
          bg-slate-950
          px-4
          py-3
          shadow-2xl

          sm:right-10

          md:bottom-auto
          md:right-8
          md:top-20
        "
      >
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-emerald-400" />

          <span className="text-[10px] font-bold text-white">
            IA procesando
          </span>
        </div>

        <div className="mt-2 flex gap-1">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />

          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:150ms]" />

          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 [animation-delay:300ms]" />
        </div>
      </div>

      {/* Brain */}
      <div
        className="
          absolute
          bottom-[-5px]
          left-1/2
          flex
          -translate-x-1/2
          items-center
          justify-center

          md:bottom-auto
          md:top-1/2
          md:-translate-y-1/2
        "
      >
        <div className="absolute h-36 w-36 rounded-full border border-cyan-400/20 md:h-44 md:w-44" />

        <div className="absolute h-28 w-28 rounded-full border border-emerald-400/30 md:h-32 md:w-32" />

        <div className="flex h-20 w-20 items-center justify-center rounded-[1.7rem] bg-gradient-to-br from-cyan-500 to-emerald-500 text-white shadow-2xl shadow-emerald-500/30 md:h-24 md:w-24 md:rounded-[2rem]">
          <BrainCircuit size={38} strokeWidth={1.8} />
        </div>
      </div>

      {/* Bottom label */}
      <div
        className="
          absolute
          bottom-2
          left-1/2
          z-30
          hidden
          -translate-x-1/2
          rounded-full
          bg-white
          px-5
          py-2
          text-[10px]
          font-bold
          text-slate-900
          shadow-xl

          md:block
          md:bottom-10
        "
      >
        Todo organizado automáticamente
      </div>
    </div>
  );
}

/* =========================================================
   ANALYTICS GRAPHIC
   ========================================================= */

function AnalyticsGraphic() {
  return (
    <div
      className="
        absolute
        inset-x-0
        bottom-0
        h-[225px]
        overflow-hidden

        sm:h-[245px]

        md:absolute
        md:inset-0
        md:h-full
      "
    >
      <div className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />

      {/* Recommendation */}
      <div
        className="
          absolute
          left-5
          top-[105px]
          z-20
          max-w-[185px]
          rotate-[-4deg]
          rounded-2xl
          bg-slate-950
          px-4
          py-3
          shadow-xl

          sm:left-8
          sm:top-[115px]

          md:left-8
          md:top-[120px]
          md:max-w-[190px]
        "
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-emerald-400" />

          <span className="text-[9px] font-bold text-white">
            Recomendación de Luka
          </span>
        </div>

        <p className="mt-2 text-[9px] leading-3 text-slate-300">
          Tu producto más vendido está aumentando esta semana.
        </p>
      </div>

      {/* Sales card */}
      <div
        className="
          absolute
          bottom-[-70px]
          right-3
          z-20
          w-[245px]
          rounded-[1.8rem]
          bg-white
          p-4
          shadow-2xl

          sm:right-8
          sm:bottom-[-65px]
          sm:w-[280px]
          sm:p-5

          md:bottom-[-45px]
          md:right-8
          md:w-[270px]

          lg:right-14
          lg:bottom-[-40px]
          lg:w-[320px]
        "
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[9px] font-medium text-slate-400">
              Ventas del mes
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
              $8.420.000
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <TrendingUp size={17} />
          </div>
        </div>

        <div className="mt-5 flex h-24 items-end gap-2 sm:mt-7 sm:h-28">
          <div className="h-[35%] flex-1 rounded-t-md bg-emerald-100" />
          <div className="h-[48%] flex-1 rounded-t-md bg-emerald-200" />
          <div className="h-[42%] flex-1 rounded-t-md bg-emerald-200" />
          <div className="h-[65%] flex-1 rounded-t-md bg-emerald-300" />
          <div className="h-[58%] flex-1 rounded-t-md bg-emerald-300" />
          <div className="h-[78%] flex-1 rounded-t-md bg-emerald-400" />
          <div className="h-[92%] flex-1 rounded-t-md bg-emerald-500" />
        </div>

        <div className="mt-3 flex items-center justify-between sm:mt-4">
          <span className="text-[8px] text-slate-400">
            Últimos 7 días
          </span>

          <span className="flex items-center gap-1 text-[9px] font-semibold text-emerald-600">
            <TrendingUp size={11} />
            +18.4%
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   MAIN SECTION
   ========================================================= */

export function CoworkingHowItWorksSection() {
  return (
    <section
      className="
        relative
        w-full
        overflow-hidden
        bg-slate-50
        px-6
        pt-4
        pb-6
        dark:bg-[#070B12]

        md:px-12
        md:pt-14
        md:pb-16
      "
    >
      <div className="mx-auto w-full max-w-7xl">
        {/* =========================================================
            PRIMER PISO
            ========================================================= */}

        <div className="grid gap-2 md:grid-cols-[1.35fr_0.85fr]">
          {/* =======================================================
              ADMINISTRAR TU NEGOCIO
              ======================================================= */}

          <div
            className="
              relative
              min-h-[440px]
              overflow-hidden
              rounded-[2rem]
              bg-white
              px-7
              py-10
              shadow-sm

              sm:px-10
              sm:py-12

              lg:px-14
              lg:py-14

              dark:border
              dark:border-white/[0.06]
              dark:bg-[#101722]
            "
          >
            <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />

            <div className="relative z-10 max-w-3xl">
              <div
                className="
                  inline-flex
                  items-center
                  rounded-full
                  bg-emerald-50
                  px-5
                  py-2
                  text-sm
                  font-semibold
                  text-emerald-700

                  dark:bg-emerald-400/10
                  dark:text-emerald-300
                "
              >
                Así de simple
              </div>

              <h2
                className="
                  mt-7
                  max-w-3xl
                  text-5xl
                  font-black
                  leading-[1.02]
                  tracking-tight
                  text-slate-950

                  dark:text-white
                "
              >
                Administrar tu negocio nunca fue tan fácil.
              </h2>

              <p
                className="
                  mt-7
                  max-w-2xl
                  text-lg
                  leading-8
                  text-slate-600

                  dark:text-slate-400
                "
              >
                No necesitas aprender un software nuevo. Solo conversa con
                Luka y deja que la inteligencia artificial haga el resto.
              </p>

              <div className="mt-10 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                  Ventas
                </span>

                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                  Gastos
                </span>

                <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-medium text-slate-600 dark:bg-white/[0.06] dark:text-slate-300">
                  Inventario
                </span>

                <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300">
                  Inteligencia Artificial
                </span>
              </div>
            </div>

            <div className="absolute -bottom-24 -right-20 hidden h-72 w-72 rounded-full bg-gradient-to-br from-emerald-300/30 to-cyan-300/20 blur-2xl sm:block" />

            <div className="absolute bottom-10 right-10 hidden items-center justify-center sm:flex">
              <div className="flex h-24 w-24 rotate-6 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-500 to-cyan-500 text-white shadow-2xl shadow-emerald-500/20">
                <Sparkles size={40} />
              </div>
            </div>

            <ArrowUpRight
              className="absolute right-8 top-8 text-slate-200 dark:text-white/10"
              size={34}
            />
          </div>

          {/* =======================================================
              TODO DESDE WHATSAPP
              ======================================================= */}

          <div
            className="
              relative
              min-h-[500px]
              overflow-hidden
              rounded-[2rem]
              bg-[#62D56B]
              dark:bg-[#42B95B]

              md:min-h-[440px]
            "
          >
            <div
              className="
                relative
                z-30
                px-8
                pt-8

                sm:px-10
                sm:pt-10
              "
            >
              <h3
                className="
                  max-w-[240px]
                  text-5xl
                  font-black
                  leading-[1.02]
                  tracking-tight
                  text-slate-950

                  md:max-w-[235px]
                "
              >
                Todo desde WhatsApp
              </h3>

              <p
                className="
                  mt-5
                  max-w-[225px]
                  text-base
                  leading-6
                  text-slate-950/75
                "
              >
                Pregunta por tus ventas, gastos, inventario y mucho más.
              </p>

              <a
                href="https://wa.me/573043904488"
                target="_blank"
                rel="noopener noreferrer"
                className="
                  pointer-events-auto
                  mt-6
                  inline-flex
                  items-center
                  justify-center
                  rounded-full
                  bg-slate-950
                  px-6
                  py-3
                  text-sm
                  font-bold
                  text-white
                  transition-all
                  duration-300
                  hover:scale-[1.03]
                  hover:bg-slate-900
                "
              >
                Hablar con Luka
              </a>
            </div>

            <WhatsAppGraphic />
          </div>
        </div>

        {/* =========================================================
            SEGUNDO PISO
            ========================================================= */}

        <div className="mt-2 grid gap-2 md:grid-cols-[0.82fr_1.38fr]">
          {/* =======================================================
              2. LUKA ORGANIZA TODO
              ======================================================= */}

          <div
            className="
              relative
              min-h-[500px]
              overflow-hidden
              rounded-[2rem]
              bg-gradient-to-br
              from-cyan-400
              via-cyan-500
              to-emerald-400
              p-8

              sm:p-10

              md:min-h-[410px]
            "
          >
            <div className="relative z-30 max-w-[250px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                <BrainCircuit size={24} />
              </div>

              <h3
                className="
                  mt-7
                  text-5xl
                  font-black
                  leading-[1.02]
                  tracking-tight
                  text-slate-950
                "
              >
                {steps[1].title}
              </h3>

              <p
                className="
                  mt-5
                  max-w-[245px]
                  text-base
                  leading-7
                  text-slate-950/75
                "
              >
                {steps[1].description}
              </p>
            </div>

            <BrainGraphic />
          </div>

          {/* =======================================================
              3. TOMA MEJORES DECISIONES
              ======================================================= */}

          <div
            className="
              relative
              min-h-[500px]
              overflow-hidden
              rounded-[2rem]
              border
              border-slate-200
              bg-white
              p-8

              sm:p-10

              md:min-h-[410px]

              dark:border-white/[0.06]
              dark:bg-[#111A25]
            "
          >
            <div className="relative z-30 max-w-[245px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-lg">
                <BarChart3 size={24} />
              </div>

              <h3
                className="
                  mt-7
                  text-5xl
                  font-black
                  leading-[1.02]
                  tracking-tight
                  text-slate-950

                  dark:text-white
                "
              >
                {steps[2].title}
              </h3>

              <p
                className="
                  mt-5
                  max-w-[240px]
                  text-base
                  leading-7
                  text-slate-600

                  dark:text-slate-400
                "
              >
                {steps[2].description}
              </p>
            </div>

            <AnalyticsGraphic />
          </div>
        </div>

        {/* =========================================================
            TERCER PISO
            ========================================================= */}

        <div className="mt-2 grid gap-2 md:grid-cols-[1.38fr_0.82fr]">
          {/* =======================================================
              1. HABLA CON LUKA
              ======================================================= */}

          <div
            className="
              relative
              min-h-[440px]
              overflow-hidden
              rounded-[2rem]
              bg-[#063B32]
              p-8

              sm:p-10

              md:min-h-[350px]
            "
          >
            <div className="relative z-30 max-w-[300px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400 text-slate-950 shadow-lg">
                <Mic size={23} />
              </div>

              <h3
                className="
                  mt-7
                  text-5xl
                  font-black
                  leading-[1.02]
                  tracking-tight
                  text-white
                "
              >
                {steps[0].title}
              </h3>

              <p
                className="
                  mt-5
                  max-w-[290px]
                  text-base
                  leading-7
                  text-emerald-50/75
                "
              >
                {steps[0].description}
              </p>
            </div>

            {/* CHAT BUBBLES */}
            <div
              className="
                absolute
                bottom-7
                right-5
                z-20
                flex
                flex-col
                gap-2

                sm:right-10

                md:right-14
              "
            >
              <div className="rounded-2xl rounded-br-sm bg-emerald-400 px-5 py-3 text-xs font-semibold text-slate-950 shadow-xl">
                Hola Luka 👋
              </div>

              <div className="ml-8 rounded-2xl rounded-bl-sm bg-white px-5 py-3 text-xs font-semibold text-slate-900 shadow-xl">
                ¿Cómo va mi negocio?
              </div>
            </div>
          </div>

          {/* =======================================================
              TU NEGOCIO, ENTENDIDO EN SEGUNDOS
              ======================================================= */}

          <div
            className="
              relative
              min-h-[440px]
              overflow-hidden
              rounded-[2rem]
              bg-[#DDE6E0]
              p-8

              sm:p-10

              md:min-h-[350px]
            "
          >
            <div className="relative z-30 max-w-[280px]">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg">
                <TrendingUp size={23} />
              </div>

              <p className="mt-7 text-sm font-semibold uppercase tracking-widest text-slate-600">
                LUKA AI
              </p>

              <p
                className="
                  mt-3
                  max-w-[280px]
                  text-5xl
                  font-black
                  leading-[1.02]
                  tracking-tight
                  text-slate-950
                "
              >
                Tu negocio, entendido en segundos.
              </p>

              <p className="mt-5 max-w-[260px] text-base leading-6 text-slate-600">
                Convierte la información de tu negocio inteligentemente.
              </p>
            </div>

            {/* =====================================================
                CHART
                Se baja deliberadamente para que no invada el texto.
                El contenedor mantiene exactamente el mismo tamaño
                y overflow-hidden se encarga de recortarlo.
                ===================================================== */}
            <div
              className="
                absolute
                bottom-[-75px]
                right-[-5px]
                z-10
                flex
                h-40
                items-end
                gap-2
                opacity-70
              "
            >
              <div className="h-16 w-7 rounded-t-lg bg-emerald-300" />
              <div className="h-24 w-7 rounded-t-lg bg-emerald-400" />
              <div className="h-20 w-7 rounded-t-lg bg-emerald-500" />
              <div className="h-32 w-7 rounded-t-lg bg-emerald-600" />
              <div className="h-40 w-7 rounded-t-lg bg-slate-950" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}