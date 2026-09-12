import { useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  Check,
  ChevronDown,
  MessageCircle,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

const faqs = [
  {
    question: "¿Necesito saber de contabilidad para usar Luka AI?",
    answer:
      "No, en absoluto. Luka está diseñada para que cualquier persona pueda gestionar su negocio sin necesidad de conocimientos previos de contabilidad o administración.",
  },
  {
    question: "¿Cómo funciona el registro por WhatsApp?",
    answer:
      'Simplemente escríbele a Luka como si hablaras con una persona. Por ejemplo: "Gasté $50.000 en insumos hoy". Luka entiende el mensaje, identifica el movimiento y registra la información automáticamente.',
  },
  {
    question: "¿Qué tan seguros están mis datos?",
    answer:
      "Tu información se almacena de forma segura y está protegida mediante medidas de seguridad diseñadas para mantener tus datos privados. Luka no comparte tu información financiera con terceros.",
  },
  {
    question: "¿Puedo cambiar de plan más adelante?",
    answer:
      "Sí. Puedes cambiar de plan cuando lo necesites. Si tu negocio crece, puedes pasar a un plan superior y acceder a más herramientas y capacidades.",
  },
];

/* -------------------------------------------------------------------------- */
/*                               LUKA GRAPHIC                                 */
/* -------------------------------------------------------------------------- */

function LukaGraphic() {
  return (
    <div className="relative mx-auto h-[470px] w-full max-w-[520px]">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[330px] w-[330px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.08] blur-[100px]" />

      <div className="pointer-events-none absolute right-[5%] top-[18%] h-[180px] w-[180px] rounded-full bg-cyan-500/[0.05] blur-[80px]" />

      {/* Large orbit */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-1/2 top-1/2 h-[370px] w-[370px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/[0.08]"
      />

      {/* Second orbit */}
      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-1/2 top-1/2 h-[285px] w-[285px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-400/[0.07]"
      />

      {/* Orbit dots */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-1/2 top-1/2 h-[370px] w-[370px] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute left-1/2 top-[-4px] h-2 w-2 -translate-x-1/2 rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.9)]" />
      </motion.div>

      <motion.div
        animate={{ rotate: -360 }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute left-1/2 top-1/2 h-[285px] w-[285px] -translate-x-1/2 -translate-y-1/2"
      >
        <div className="absolute bottom-[-3px] left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)]" />
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/*                         CENTRAL LUKA CORE                           */}
      {/* ------------------------------------------------------------------ */}

      <motion.div
        animate={{
          y: [0, -7, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2"
      >
        <div className="relative flex h-[138px] w-[138px] items-center justify-center rounded-[2.5rem] border border-white/10 bg-slate-900/90 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          {/* inner glow */}
          <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-emerald-400/10 to-cyan-400/10" />

          {/* Luka icon */}
          <div className="relative flex h-[72px] w-[72px] items-center justify-center rounded-[1.6rem] bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-[0_0_45px_rgba(16,185,129,0.25)]">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-[1.35rem] bg-slate-950">
              <Sparkles className="h-7 w-7 text-emerald-400" />
            </div>
          </div>

          {/* Status */}
          <div className="absolute -bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-400/20 bg-slate-950 px-3 py-1.5 text-[10px] font-semibold text-emerald-400 shadow-lg">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Luka está pensando
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/*                         CHAT BUBBLE TOP                             */}
      {/* ------------------------------------------------------------------ */}

      <motion.div
        animate={{
          y: [0, -8, 0],
          rotate: [-1, 0, -1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-[3%] top-[8%] z-30 w-[205px]"
      >
        <div className="rounded-[1.35rem] rounded-bl-md border border-white/[0.08] bg-slate-900/90 p-4 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10">
              <MessageCircle className="h-3.5 w-3.5 text-emerald-400" />
            </div>

            <div>
              <p className="text-[10px] font-bold text-white">
                Tú
              </p>

              <p className="text-[8px] text-slate-500">
                WhatsApp
              </p>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-slate-300">
            ¿Cómo estuvieron las ventas esta semana?
          </p>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/*                         AI RESPONSE                                 */}
      {/* ------------------------------------------------------------------ */}

      <motion.div
        animate={{
          y: [0, 7, 0],
          rotate: [1, 0, 1],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[7%] right-[0%] z-30 w-[225px]"
      >
        <div className="rounded-[1.35rem] rounded-br-md border border-emerald-400/10 bg-gradient-to-br from-emerald-500/[0.12] to-cyan-500/[0.06] p-4 shadow-[0_25px_60px_-25px_rgba(0,0,0,0.9)] backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/10">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            </div>

            <div>
              <p className="text-[10px] font-bold text-white">
                Luka AI
              </p>

              <p className="text-[8px] text-emerald-400">
                Análisis completado
              </p>
            </div>
          </div>

          <div className="mt-3 flex items-end justify-between">
            <div>
              <p className="text-[8px] text-slate-500">
                Ventas
              </p>

              <p className="text-xl font-extrabold tracking-tight text-white">
                $1.84M
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-bold text-emerald-400">
              <TrendingUp className="h-2.5 w-2.5" />
              +18.4%
            </div>
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/*                        FLOATING DATA CARD                           */}
      {/* ------------------------------------------------------------------ */}

      <motion.div
        animate={{
          y: [0, -5, 0],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute right-[4%] top-[4%] z-10 hidden w-[128px] md:block"
      >
        <div className="rounded-2xl border border-white/[0.07] bg-slate-900/80 p-3 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[7px] font-semibold text-slate-500">
              Negocio
            </span>

            <BarChart3 className="h-3 w-3 text-cyan-400" />
          </div>

          <div className="mt-3 flex items-end gap-1">
            {[30, 45, 38, 62, 50, 72, 85].map((height, index) => (
              <motion.div
                key={index}
                animate={{
                  height: [`${height}%`, `${Math.max(25, height - 12)}%`, `${height}%`],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: index * 0.08,
                  ease: "easeInOut",
                }}
                className="w-2 rounded-t-sm bg-gradient-to-t from-emerald-500/40 to-cyan-400"
                style={{
                  minHeight: "8px",
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------------------ */}
      {/*                         MINI CHECK CARD                             */}
      {/* ------------------------------------------------------------------ */}

      <motion.div
        animate={{
          y: [0, 5, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute bottom-[10%] left-[3%] z-10 hidden w-[150px] md:block"
      >
        <div className="flex items-center gap-2.5 rounded-2xl border border-white/[0.07] bg-slate-900/80 p-3 shadow-xl backdrop-blur-xl">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/10">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          </div>

          <div>
            <p className="text-[9px] font-bold text-white">
              Todo organizado
            </p>

            <p className="mt-0.5 text-[7px] text-slate-500">
              Ventas · gastos · inventario
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tiny decorative particles */}
      <div className="absolute left-[18%] top-[48%] h-1.5 w-1.5 rounded-full bg-emerald-400/50" />
      <div className="absolute right-[22%] top-[61%] h-1 w-1 rounded-full bg-cyan-400/50" />
      <div className="absolute bottom-[28%] left-[28%] h-1 w-1 rounded-full bg-emerald-300/40" />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                              FAQ COMPONENT                                 */
/* -------------------------------------------------------------------------- */

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="relative overflow-hidden bg-slate-950 px-6 py-28 text-white md:px-12 md:py-36"
    >
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[20%] top-[-180px] h-[500px] w-[700px] rounded-full bg-emerald-500/[0.035] blur-[150px]" />

        <div className="absolute bottom-[-220px] right-[-150px] h-[500px] w-[500px] rounded-full bg-cyan-500/[0.025] blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* ---------------------------------------------------------------- */}
        {/*                              HEADER                              */}
        {/* ---------------------------------------------------------------- */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.06] px-4 py-2 text-sm font-semibold text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>Preguntas frecuentes</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.045em] text-white sm:text-5xl md:text-6xl">
            Todo lo que quieras saber
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              sobre Luka.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
            Si tienes una pregunta, probablemente ya la hemos respondido.
          </p>
        </motion.div>

        {/* ---------------------------------------------------------------- */}
        {/*                         MAIN CONTENT                             */}
        {/* ---------------------------------------------------------------- */}

        <div className="mt-20 grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
          {/* LEFT — GRAPHIC */}
          <motion.div
            initial={{ opacity: 0, x: -25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="order-2 lg:order-1"
          >
            <LukaGraphic />
          </motion.div>

          {/* RIGHT — QUESTIONS */}
          <motion.div
            initial={{ opacity: 0, x: 25 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="order-1 lg:order-2"
          >
            <div className="space-y-3">
              {faqs.map((faq, index) => {
                const isOpen = openIndex === index;

                return (
                  <motion.div
                    key={faq.question}
                    layout
                    className={`overflow-hidden rounded-[1.5rem] border transition-all duration-300 ${
                      isOpen
                        ? "border-emerald-400/20 bg-gradient-to-br from-emerald-400/[0.07] to-cyan-400/[0.025] shadow-[0_20px_60px_-30px_rgba(16,185,129,0.25)]"
                        : "border-white/[0.07] bg-white/[0.025] hover:border-white/[0.12] hover:bg-white/[0.035]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenIndex(isOpen ? null : index)
                      }
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-5 px-5 py-5 text-left md:px-6 md:py-6"
                    >
                      {/* Number */}
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-extrabold tracking-wider transition-all duration-300 ${
                          isOpen
                            ? "bg-emerald-400 text-slate-950"
                            : "bg-white/[0.05] text-slate-500"
                        }`}
                      >
                        0{index + 1}
                      </span>

                      {/* Question */}
                      <span
                        className={`flex-1 text-base font-extrabold tracking-tight transition-colors duration-300 md:text-lg ${
                          isOpen
                            ? "text-white"
                            : "text-slate-300 group-hover:text-white"
                        }`}
                      >
                        {faq.question}
                      </span>

                      {/* Arrow */}
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                          isOpen
                            ? "rotate-45 border-emerald-400/20 bg-emerald-400/10 text-emerald-400"
                            : "border-white/[0.08] text-slate-500"
                        }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{
                            height: 0,
                            opacity: 0,
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                          }}
                          transition={{
                            duration: 0.3,
                            ease: "easeOut",
                          }}
                        >
                          <div className="px-5 pb-6 pl-[4.5rem] pr-6 md:px-6 md:pb-7 md:pl-[4.75rem]">
                            <div className="mb-4 h-px bg-white/[0.06]" />

                            <p className="max-w-xl text-sm leading-7 text-slate-400 md:text-[15px]">
                              {faq.answer}
                            </p>

                            <div className="mt-5 flex items-center gap-2 text-xs font-semibold text-emerald-400">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                              Luka está aquí para ayudarte
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Small bottom CTA */}
            <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 md:px-6">
              <div>
                <p className="text-sm font-bold text-white">
                  ¿Tienes otra pregunta?
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Habla directamente con Luka.
                </p>
              </div>

              <a
                href="https://wa.me/573043904488"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-slate-950 transition-transform duration-300 hover:scale-105"
                aria-label="Hablar con Luka por WhatsApp"
              >
                <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}