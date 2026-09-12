import {
  ArrowDownRight,
  BarChart3,
  BrainCircuit,
  Check,
  MessageCircle,
  Package,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Luka entiende",
    description:
      "La inteligencia artificial interpreta lo que le cuentas y entiende el contexto de tu negocio.",
    type: "understand",
  },
  {
    number: "02",
    title: "Luka organiza",
    description:
      "Ventas, gastos, inventario y clientes quedan organizados automáticamente.",
    type: "organize",
  },
  {
    number: "03",
    title: "Pregunta lo que quieras",
    description:
      "Consulta tus resultados, compara periodos y descubre qué está pasando en tu negocio.",
    type: "ask",
  },
  {
    number: "04",
    title: "Toma mejores decisiones",
    description:
      "Luka transforma tus datos en información útil para ayudarte a hacer crecer tu negocio.",
    type: "decide",
  },
];

function PhoneShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative h-[320px] w-[164px] rounded-[2rem] border-[4px] border-slate-800 bg-slate-950 p-[4px] shadow-[0_28px_65px_-22px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* Dynamic Island */}
      <div className="absolute left-1/2 top-[7px] z-40 h-[15px] w-[58px] -translate-x-1/2 rounded-full bg-black" />

      {/* Screen */}
      <div className="relative h-full w-full overflow-hidden rounded-[1.55rem] bg-[#f4f6f8]">
        {children}
      </div>
    </div>
  );
}

function WhatsAppHeader() {
  return (
    <div className="flex h-[52px] items-end gap-2 bg-[#075E54] px-2.5 pb-2 pt-5 text-white">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#25D366]">
        <MessageCircle className="h-3.5 w-3.5" />
      </div>

      <div className="min-w-0 leading-tight">
        <p className="truncate text-[8px] font-bold">Luka AI</p>
        <p className="text-[6.5px] text-white/70">en línea</p>
      </div>
    </div>
  );
}

function MessageBubble({
  children,
  incoming = false,
}: {
  children: React.ReactNode;
  incoming?: boolean;
}) {
  return (
    <div
      className={`max-w-[122px] rounded-[13px] px-2.5 py-1.5 text-[7px] leading-[1.45] shadow-sm ${
        incoming
          ? "rounded-tl-[4px] bg-white text-slate-700"
          : "ml-auto rounded-tr-[4px] bg-[#d9ffc9] text-slate-700"
      }`}
    >
      {children}
    </div>
  );
}

function UnderstandPhone() {
  return (
    <PhoneShell className="rotate-[2deg]">
      <WhatsAppHeader />

      <div className="space-y-2 bg-[#e5ddd5] p-2.5 pt-3">
        <MessageBubble>
          Hoy vendí 8 almuerzos y gasté $120.000.
        </MessageBubble>

        <div className="rounded-[13px] rounded-tl-[4px] bg-white p-2.5 shadow-sm">
          <div className="mb-2 flex items-center gap-1.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <BrainCircuit className="h-3 w-3 text-emerald-600" />
            </div>

            <div>
              <p className="text-[7px] font-bold text-slate-800">
                Luka entiende
              </p>

              <p className="text-[5.5px] text-slate-400">
                Analizando información
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="rounded-lg bg-slate-50 px-2 py-1 text-[6px] text-slate-500">
              ✓ Ventas detectadas
            </div>

            <div className="rounded-lg bg-slate-50 px-2 py-1 text-[6px] text-slate-500">
              ✓ Gasto detectado
            </div>

            <div className="rounded-lg bg-emerald-50 px-2 py-1 text-[6px] font-semibold text-emerald-700">
              ✓ Información comprendida
            </div>
          </div>
        </div>

        <MessageBubble incoming>
          Entendí. Registraré las ventas y el gasto en tu negocio.
        </MessageBubble>
      </div>
    </PhoneShell>
  );
}

function OrganizePhone() {
  return (
    <PhoneShell className="rotate-[-1deg]">
      <div className="bg-slate-950 px-3 pb-3 pt-9 text-white">
        <p className="text-[6px] text-white/50">Luka AI</p>

        <p className="mt-0.5 text-[11px] font-bold">Tu negocio</p>
      </div>

      <div className="space-y-2 bg-slate-50 p-2.5">
        <div className="grid grid-cols-2 gap-1.5">
          <div className="rounded-xl bg-white p-2 shadow-sm">
            <Wallet className="h-3 w-3 text-emerald-500" />

            <p className="mt-2 text-[6px] text-slate-400">Ventas</p>

            <p className="text-[11px] font-extrabold text-slate-800">
              $428K
            </p>
          </div>

          <div className="rounded-xl bg-white p-2 shadow-sm">
            <Package className="h-3 w-3 text-blue-500" />

            <p className="mt-2 text-[6px] text-slate-400">
              Inventario
            </p>

            <p className="text-[11px] font-extrabold text-slate-800">
              128
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white p-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[7px] font-bold text-slate-700">
              Movimientos recientes
            </p>

            <BarChart3 className="h-3 w-3 text-emerald-500" />
          </div>

          <div className="mt-2.5 space-y-1.5">
            {[
              ["Venta", "+$85.000"],
              ["Compra", "-$40.000"],
              ["Venta", "+$62.000"],
              ["Gasto", "-$25.000"],
            ].map(([label, value]) => (
              <div
                key={`${label}-${value}`}
                className="flex items-center justify-between border-b border-slate-100 pb-1"
              >
                <span className="text-[6px] text-slate-400">
                  {label}
                </span>

                <span
                  className={`text-[6px] font-bold ${
                    value.startsWith("+")
                      ? "text-emerald-600"
                      : "text-slate-600"
                  }`}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhoneShell>
  );
}

function AskPhone() {
  return (
    <PhoneShell className="rotate-[2deg]">
      <WhatsAppHeader />

      <div className="flex h-[calc(100%-52px)] flex-col justify-end gap-1.5 bg-[#e5ddd5] p-2.5 pb-3">
        <MessageBubble incoming>
          Puedes preguntarme cualquier cosa sobre tu negocio.
        </MessageBubble>

        <MessageBubble>
          ¿Cuánto vendí esta semana?
        </MessageBubble>

        <MessageBubble incoming>
          Esta semana vendiste{" "}
          <span className="font-bold">$1.840.000</span>.
        </MessageBubble>

        <MessageBubble>
          ¿Cuál fue mi producto más vendido?
        </MessageBubble>

        <MessageBubble incoming>
          El arroz, con 47 unidades.
        </MessageBubble>

        <div className="mt-0.5 h-7 rounded-full bg-white px-3 py-1.5 text-[6.5px] text-slate-400 shadow-sm">
          Pregúntale a Luka...
        </div>
      </div>
    </PhoneShell>
  );
}

function DecisionPhone() {
  return (
    <PhoneShell className="rotate-[-2deg]">
      <div className="bg-gradient-to-br from-emerald-700 to-teal-500 px-3 pb-4 pt-9 text-white">
        <p className="text-[6px] text-white/70">Luka AI</p>

        <p className="mt-0.5 text-[11px] font-bold">
          Una oportunidad
        </p>
      </div>

      <div className="space-y-2 bg-slate-50 p-2.5">
        <div className="rounded-xl bg-white p-3 shadow-sm">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3 text-emerald-500" />

            <p className="text-[7px] font-bold text-slate-700">
              Insight de Luka
            </p>
          </div>

          <p className="mt-3 text-[16px] font-extrabold text-slate-900">
            +18.4%
          </p>

          <p className="mt-0.5 text-[6px] leading-relaxed text-slate-400">
            Tus ventas crecieron frente a la semana anterior.
          </p>
        </div>

        <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <p className="text-[6px] font-bold text-emerald-700">
            Recomendación
          </p>

          <p className="mt-1.5 text-[6.5px] leading-relaxed text-emerald-800">
            Considera aumentar el inventario de tus productos más
            vendidos.
          </p>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg bg-white p-2 shadow-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
            <Check className="h-3 w-3 text-emerald-600" />
          </div>

          <p className="text-[6px] font-semibold text-slate-600">
            Decisiones basadas en tus datos.
          </p>
        </div>
      </div>
    </PhoneShell>
  );
}

function StepPhone({ type }: { type: string }) {
  switch (type) {
    case "understand":
      return <UnderstandPhone />;

    case "organize":
      return <OrganizePhone />;

    case "ask":
      return <AskPhone />;

    case "decide":
      return <DecisionPhone />;

    default:
      return null;
  }
}

function Connector() {
  return (
    <div className="pointer-events-none absolute right-[-42px] top-[58%] z-20 hidden w-[84px] xl:block">
      <svg
        viewBox="0 0 84 55"
        fill="none"
        className="h-auto w-full overflow-visible"
      >
        <path
          d="M2 8 C27 8, 34 47, 68 47"
          stroke="#00C896"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="4 6"
          opacity="0.8"
        />

        <path
          d="M61 40 L69 47 L61 54"
          stroke="#00C896"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.9"
        />
      </svg>
    </div>
  );
}

export function CoworkingPhilosophySection() {
  return (
    <section className="relative overflow-hidden bg-slate-950 px-6 py-24 text-white md:px-12 md:py-32">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[15%] h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-emerald-500/[0.06] blur-[140px]" />

        <div className="absolute left-[-160px] top-[45%] h-[340px] w-[340px] rounded-full bg-teal-500/[0.035] blur-[120px]" />

        <div className="absolute right-[-140px] top-[30%] h-[380px] w-[380px] rounded-full bg-cyan-500/[0.03] blur-[140px]" />
      </div>

      {/* Exact same content width as the other landing sections */}
      <div className="relative mx-auto max-w-7xl">
        {/* HEADER */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-2 text-sm font-semibold text-emerald-400">
            <Sparkles className="h-4 w-4" />

            <span>Así de simple</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
            De una conversación
            <br />
            a un negocio{" "}
            <span className="text-emerald-400">
              bajo control.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
            Todo empieza con un mensaje de WhatsApp. Luka entiende lo que
            necesitas, organiza la información y te ayuda a tomar mejores
            decisiones.
          </p>
        </div>

        {/* DESKTOP FLOW */}
        <div className="relative mt-24 hidden xl:block">
          <div className="grid grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div
                key={step.number}
                className="relative flex min-w-0 flex-col"
              >
                {/* Step */}
                <div className="mb-9 text-center">
                  <span className="text-[10px] font-bold tracking-[0.25em] text-emerald-400">
                    PASO {step.number}
                  </span>

                  <h3 className="mx-auto mt-2.5 max-w-[210px] text-xl font-extrabold leading-tight tracking-tight text-white">
                    {step.title}
                  </h3>

                  <p className="mx-auto mt-2.5 max-w-[220px] text-xs leading-relaxed text-slate-400">
                    {step.description}
                  </p>
                </div>

                {/* Phone */}
                <div className="flex justify-center">
                  <StepPhone type={step.type} />
                </div>

                {/* Connector */}
                {index < steps.length - 1 && <Connector />}
              </div>
            ))}
          </div>
        </div>

        {/* TABLET / MOBILE */}
        <div className="mt-20 space-y-16 xl:hidden">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative grid items-center gap-10 md:grid-cols-2"
            >
              <div className={index % 2 === 1 ? "md:order-2" : ""}>
                <span className="text-xs font-bold tracking-[0.25em] text-emerald-400">
                  PASO {step.number}
                </span>

                <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-white">
                  {step.title}
                </h3>

                <p className="mt-4 max-w-md text-base leading-relaxed text-slate-400">
                  {step.description}
                </p>
              </div>

              <div
                className={`flex ${
                  index % 2 === 1
                    ? "justify-start md:order-1"
                    : "justify-end"
                }`}
              >
                <StepPhone type={step.type} />
              </div>

              {index < steps.length - 1 && (
                <ArrowDownRight className="absolute -bottom-11 left-1/2 h-6 w-6 -translate-x-1/2 rotate-45 text-emerald-500/60 md:hidden" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}