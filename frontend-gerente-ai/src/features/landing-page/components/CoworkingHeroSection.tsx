import { ArrowRight, Check, Sparkles } from "lucide-react";
import { Link } from "react-router";
import { LukaHeroChat } from "@/features/assistant";

export function CoworkingHeroSection() {
  return (
    <section
      className="
        relative
        isolate
        min-h-[100svh]
        w-full
        overflow-hidden
        bg-transparent
      "
    >
      {/* =========================================================
          HERO CONTAINER
          ========================================================= */}

      <div
        className="
          mx-auto
          flex
          min-h-[100svh]
          w-full
          items-start
          px-6
          pb-10
          pt-[9rem]

          md:px-12
          md:pt-[10rem]

          lg:h-[100svh]
          lg:min-h-[760px]
          lg:w-[calc(100%-2rem)]
          lg:max-w-7xl
          lg:items-center
          lg:px-0
          lg:pb-10
          lg:pt-[10.5rem]
        "
      >
        <div
          className="
            grid
            w-full
            items-start
            gap-10

            lg:grid-cols-[1fr_1fr]
            lg:items-center
            lg:gap-8

            xl:gap-10
          "
        >
          {/* =====================================================
              LEFT — HERO CONTENT
              ===================================================== */}

          <div
            className="
              flex
              w-full
              min-w-0
              flex-col
              justify-center

              lg:-translate-y-5
              lg:translate-x-8
              xl:translate-x-13
            "
          >
            {/* =================================================
                WHATSAPP
                ================================================= */}

            <div
              className="
                mb-4
                flex
                h-12
                items-center

                sm:mb-6
                sm:h-16
              "
            >
              <div
                className="
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center

                  sm:h-16
                  sm:w-16
                "
              >
                <svg
                  viewBox="0 0 24 24"
                  className="
                    h-9
                    w-9

                    sm:h-12
                    sm:w-12
                  "
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="WhatsApp"
                  role="img"
                >
                  <path
                    fill="#25D366"
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.67-.51-.173-.008-.372-.01-.57-.01-.198 0-.52.075-.792.372-.273.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982 1-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.887 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.304-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.478-8.413"
                  />
                </svg>
              </div>
            </div>

            {/* =================================================
                BADGE
                ================================================= */}

            <div
              className="
                mb-4
                inline-flex
                w-fit
                max-w-full
                items-center
                gap-2
                rounded-full
                border
                border-emerald-200
                bg-emerald-50
                px-3
                py-2
                text-xs
                font-semibold
                text-emerald-700
                shadow-sm

                sm:mb-5
                sm:px-4
                sm:text-sm

                dark:border-emerald-500/25
                dark:bg-emerald-500/[0.08]
                dark:text-emerald-400
              "
            >
              <Sparkles className="h-4 w-4 shrink-0" />

              <span className="truncate">
                Integra Inteligencia Artificial en tu negocio
              </span>
            </div>

            {/* =================================================
                TITLE
                ================================================= */}

            <h1
              className="
                w-full
                max-w-[650px]
                text-[2.75rem]
                font-black
                leading-[0.98]
                tracking-[-0.045em]
                text-slate-950

                sm:text-[3.35rem]
                md:text-[3.65rem]
                lg:text-[3.75rem]
                xl:text-[4rem]
                2xl:text-[4.2rem]

                dark:text-white
              "
            >
              Conoce a Luka, tu{" "}
              <span
                className="
                  bg-gradient-to-r
                  from-emerald-500
                  via-cyan-500
                  to-blue-500
                  bg-clip-text
                  text-transparent
                "
              >
                nuevo asistente.
              </span>
            </h1>

            {/* =================================================
                CTA
                ================================================= */}

            <div className="mt-7 sm:mt-8">
              <Link
                to="/register"
                className="
                  group
                  inline-flex
                  items-center
                  justify-center
                  gap-3
                  rounded-full
                  bg-gradient-to-r
                  from-emerald-500
                  via-cyan-500
                  to-blue-500
                  px-7
                  py-3.5
                  text-sm
                  font-bold
                  text-white
                  shadow-[0_12px_35px_rgba(16,185,129,0.22)]
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-[0_16px_45px_rgba(16,185,129,0.32)]
                  active:translate-y-0

                  sm:px-8
                  sm:py-4
                  sm:text-base
                "
              >
                <span>Comenzar gratis</span>

                <ArrowRight
                  className="
                    h-5
                    w-5
                    transition-transform
                    duration-300
                    group-hover:translate-x-1
                  "
                />
              </Link>
            </div>

            {/* =================================================
                BENEFITS
                ================================================= */}

            <div
              className="
                mt-6
                flex
                w-full
                max-w-[650px]
                flex-col
                items-start
                gap-3

                sm:mt-7
              "
            >
              <div className="flex w-full min-w-0 items-start gap-3">
                <div
                  className="
                    mt-0.5
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-500
                    text-white
                  "
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>

                <span
                  className="
                    min-w-0
                    text-[13px]
                    font-medium
                    leading-5
                    text-slate-700

                    sm:text-base
                    sm:leading-6

                    dark:text-slate-300
                  "
                >
                  Controla las finanzas de tu negocio
                </span>
              </div>

              <div className="flex w-full min-w-0 items-start gap-3">
                <div
                  className="
                    mt-0.5
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-500
                    text-white
                  "
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>

                <span
                  className="
                    min-w-0
                    text-[13px]
                    font-medium
                    leading-5
                    text-slate-700

                    sm:text-base
                    sm:leading-6

                    dark:text-slate-300
                  "
                >
                  Gestiona ventas, gastos e inventario
                </span>
              </div>

              <div className="flex w-full min-w-0 items-start gap-3">
                <div
                  className="
                    mt-0.5
                    flex
                    h-5
                    w-5
                    shrink-0
                    items-center
                    justify-center
                    rounded-full
                    bg-emerald-500
                    text-white
                  "
                >
                  <Check className="h-3.5 w-3.5 stroke-[3]" />
                </div>

                <span
                  className="
                    min-w-0
                    break-words
                    text-[13px]
                    font-medium
                    leading-5
                    text-slate-700

                    sm:text-base
                    sm:leading-6

                    dark:text-slate-300
                  "
                >
                  Toma decisiones con ayuda de Inteligencia Artificial
                </span>
              </div>
            </div>
          </div>

          {/* =====================================================
              RIGHT — LUKA CHAT
              ===================================================== */}

          <div
            className="
              relative
              flex
              w-full
              min-w-0
              items-center
              justify-center

              lg:h-full
              lg:min-h-0
              lg:justify-end
            "
          >
            <div
              className="
                relative
                flex
                w-full
                min-w-0
                max-w-none
                items-center
                justify-center

                lg:w-[calc(100%+20px)]
                lg:max-w-[760px]
                lg:translate-x-4
                lg:justify-end

                xl:translate-x-6
              "
            >
              <div
                className="
                  w-full
                  min-w-0
                  origin-center

                  lg:scale-[1.10]
                  xl:scale-[1.14]
                "
              >
                <LukaHeroChat />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}