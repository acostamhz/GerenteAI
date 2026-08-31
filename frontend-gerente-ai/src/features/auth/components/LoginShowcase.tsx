import {
  ArrowLeft,
  BrainCircuit,
  Rocket,
  LockKeyhole,
} from "lucide-react";

import { Link } from "react-router";

export function LoginShowcase() {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full bg-muted/30 p-12 overflow-hidden">

      {/* =========================
          BACKGROUND
      ========================== */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse" />

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

      {/* =========================
          VOLVER AL HOME
      ========================== */}
      <Link
        to="/home"
        aria-label="Volver al inicio"
        title="Volver al inicio"
        className="
          absolute
          top-6
          right-8
          z-20
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          text-muted-foreground
          transition-all
          duration-200
          hover:bg-muted
          hover:text-foreground
          hover:scale-105
        "
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* =========================
          FLOATING BENTO GRID
      ========================== */}
      <div className="relative z-10 w-full max-w-lg">

        {/* =========================
            DECORATIVE TEXT
        ========================== */}
        <div className="mb-12">

          <h2 className="text-4xl font-display font-bold text-foreground mb-4">
            El control total de tu negocio.
          </h2>

          <p className="text-muted-foreground text-lg leading-relaxed">
            Recomendaciones potenciadas por IA, proyecciones financieras precisas y control de cartera en un solo lugar.
          </p>

        </div>

        {/* =========================
            BENTO CARDS
        ========================== */}
        <div className="grid grid-cols-2 gap-4">

          {/* =========================
              IA
          ========================== */}
          <div className="col-span-2 bg-card/60 border border-border backdrop-blur-xl p-6 rounded-2xl shadow-xl transition-transform hover:-translate-y-1 duration-500">

            <div className="flex items-center justify-between mb-4">

              <div className="flex items-center gap-3">

                <div className="p-2.5 bg-primary/10 rounded-lg">
                  <BrainCircuit className="w-5 h-5 text-primary" />
                </div>

                <span className="text-card-foreground font-bold">
                  Recomendaciones IA
                </span>

              </div>

              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                +32% Eficiencia
              </span>

            </div>

            <div className="space-y-3">

              <div className="h-2 w-3/4 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-gradient-to-r from-primary to-primary/60 rounded-full" />
              </div>

              <div className="h-2 w-1/2 bg-muted rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-primary/40 rounded-full" />
              </div>

            </div>

          </div>

          {/* =========================
              CRECIMIENTO
          ========================== */}
          <div className="bg-card/60 border border-border backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-500 delay-100">

            <div className="p-2.5 bg-indigo-500/10 rounded-lg w-max mb-6">
              <Rocket className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            </div>

            <div>

              <p className="text-muted-foreground text-xs font-bold mb-1.5 uppercase tracking-wider">
                Crecimiento
              </p>

              <p className="text-2xl font-black text-card-foreground">
                +45.2%
              </p>

            </div>

          </div>

          {/* =========================
              SEGURIDAD
          ========================== */}
          <div className="bg-card/60 border border-border backdrop-blur-xl p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-500 delay-150">

            <div className="p-2.5 bg-emerald-500/10 rounded-lg w-max mb-6">
              <LockKeyhole className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
            </div>

            <div>

              <p className="text-muted-foreground text-xs font-bold mb-1.5 uppercase tracking-wider">
                Seguridad
              </p>

              <p className="text-2xl font-black text-card-foreground">
                Garantizada
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}