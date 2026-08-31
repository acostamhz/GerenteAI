import { Link } from "react-router";

import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoginShowcase } from "@/features/auth/components/LoginShowcase";

import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";

export function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-background font-body">

      {/* =========================
          LEFT SIDE: FORM
      ========================== */}
      <div
        className="
          w-full
          lg:w-1/2
          flex
          flex-col
          relative
          animate-in
          fade-in
          slide-in-from-left-8
          duration-700
        "
      >

        {/* =========================
            THEME TOGGLE
        ========================== */}
        <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
          <ThemeToggle />
        </div>

        {/* =========================
            LOGO
        ========================== */}
        <div className="p-8 sm:p-12">

          <Link
            to="/home"
            className="inline-flex items-center group cursor-pointer"
            aria-label="Luka AI - Inicio"
          >
            <img
              src="/Luka.png"
              alt="Luka AI"
              className="
                h-11
                w-auto
                max-w-[170px]
                object-contain
                object-left
                transition-transform
                duration-200
                group-hover:scale-[1.03]
              "
            />
          </Link>

        </div>

        {/* =========================
            CENTER FORM
        ========================== */}
        <div className="flex-1 flex items-center justify-center">
          <LoginForm />
        </div>

        {/* =========================
            FOOTER
        ========================== */}
        <div
          className="
            mt-auto
            p-8
            sm:p-12
            text-center
            lg:text-left
            text-sm
            font-medium
            text-muted-foreground
          "
        >
          &copy; {new Date().getFullYear()} Luka AI. Todos los derechos reservados.
        </div>

      </div>

      {/* =========================
          RIGHT SIDE: SHOWCASE
      ========================== */}
      <div
        className="
          hidden
          lg:block
          w-1/2
          animate-in
          fade-in
          slide-in-from-right-8
          duration-700
        "
      >
        <LoginShowcase />
      </div>

    </div>
  );
}