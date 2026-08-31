import {
  ArrowLeft,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Zap,
} from "lucide-react";

import { Link } from "react-router";

export function RegisterShowcase() {
  return (
    <div className="relative flex flex-col justify-center items-center w-full h-full bg-muted/30 p-12 overflow-hidden">

      {/* =========================
          BACKGROUND
      ========================== */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-background to-teal-500/5" />

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] animate-pulse" />

      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-[100px] animate-pulse delay-1000" />

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
          CONTENT
      ========================== */}
      <div className="relative z-10 w-full max-w-lg">

        {/* =========================
            DECORATIVE TEXT
        ========================== */}
        <div className="mb-10">

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold mb-4 shadow-sm">

            <Sparkles className="w-3.5 h-3.5" />

            <span>
              Prueba Gratis, mejora tu plan cuando quieras.
            </span>

          </div>

          <h2 className="text-4xl font-display font-bold text-foreground mb-4 leading-tight">
            Únete a miles de negocios inteligentes.
          </h2>

          <p className="text-muted-foreground text-base leading-relaxed">
            Regístrate en menos de 2 minutos y lleva la contabilidad de tu empresa por WhatsApp de forma automática.
          </p>

        </div>

        {/* =========================
            BENTO CARDS
        ========================== */}
        <div className="grid grid-cols-2 gap-4">

          {/* =========================
              WHATSAPP
          ========================== */}
          <div className="col-span-2 bg-card/70 border border-border backdrop-blur-xl p-6 rounded-2xl shadow-xl transition-transform hover:-translate-y-1 duration-500">

            <div className="flex items-center justify-between mb-3">

              <div className="flex items-center gap-3">

                <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>

                <div>
                  <span className="text-card-foreground font-bold block text-sm">
                    Registro por WhatsApp
                  </span>

                  <span className="text-xs text-muted-foreground">
                    Envía fotos o notas de voz
                  </span>
                </div>

              </div>

              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Activo
              </span>

            </div>

            <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
              "Luka, registré $150.000 en insumos de papelería hoy" → Registrado automáticamente ✓
            </div>

          </div>

          {/* =========================
              CONFIGURACIÓN
          ========================== */}
          <div className="bg-card/70 border border-border backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-500 delay-100">

            <div className="p-2.5 bg-amber-500/10 rounded-xl w-max mb-4">
              <Zap className="w-5 h-5 text-amber-500" />
            </div>

            <div>

              <p className="text-muted-foreground text-[10px] font-bold mb-1 uppercase tracking-wider">
                Configuración
              </p>

              <p className="text-xl font-black text-card-foreground">
                Inmediata
              </p>

            </div>

          </div>

          {/* =========================
              SEGURIDAD
          ========================== */}
          <div className="bg-card/70 border border-border backdrop-blur-xl p-5 rounded-2xl shadow-xl flex flex-col justify-between transition-transform hover:-translate-y-1 duration-500 delay-150">

            <div className="p-2.5 bg-blue-500/10 rounded-xl w-max mb-4">
              <ShieldCheck className="w-5 h-5 text-blue-500 dark:text-blue-400" />
            </div>

            <div>

              <p className="text-muted-foreground text-[10px] font-bold mb-1 uppercase tracking-wider">
                Tus datos
              </p>

              <p className="text-xl font-black text-card-foreground">
                100% Seguros
              </p>

            </div>

          </div>

        </div>
      </div>

    </div>
  );
}