import { useState } from "react";
import { Link } from "react-router";
import { Bot, Menu, X, LogIn } from "lucide-react";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";

function easeInOutQuart(t: number): number {
  return t < 0.5
    ? 8 * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function customSmoothScroll(targetY: number, duration: number = 1000) {
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  let startTime: number | null = null;

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;

    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    const ease = easeInOutQuart(progress);

    window.scrollTo(0, startY + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

export function CoworkingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Inicio", href: "#inicio" },
    { name: "Beneficios", href: "#beneficios" },
    { name: "Cómo funciona", href: "#como-funciona" },
    { name: "Características", href: "#caracteristicas" },
    { name: "Testimonios", href: "#testimonios" },
    { name: "Planes", href: "#planes" },
    { name: "FAQ", href: "#faq" },
  ];

  const handleSmoothScroll = (
    e: React.MouseEvent<HTMLAnchorElement>,
    href: string
  ) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    const targetId = href.replace("#", "");
    const element = document.getElementById(targetId);

    if (element) {
      const yOffset = -110;

      const targetY =
        element.getBoundingClientRect().top +
        window.pageYOffset +
        yOffset;

      customSmoothScroll(targetY, 1000);
    }
  };

  return (
    <header className="fixed top-4 left-1/2 -translate-x-1/2 w-[95%] max-w-7xl z-50">
      <div className="relative bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-gray-200/80 dark:border-white/10 rounded-2xl px-6 py-3.5 shadow-lg shadow-black/5 dark:shadow-slate-950/50 transition-colors duration-300">

        {/* Contenedor principal */}
        <div className="flex items-center justify-between">

          {/* Brand */}
          <Link
            to="/home"
            className="flex items-center gap-3 group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <Bot className="w-5 h-5" />
            </div>

            <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Luka AI
            </span>
          </Link>

          {/* Desktop Nav - ABSOLUTAMENTE CENTRADO */}
          <nav
            className="
              hidden lg:flex
              absolute
              left-1/2
              -translate-x-1/2
              items-center
              gap-1
              bg-slate-100/80
              dark:bg-slate-800/50
              p-1.5
              rounded-xl
              border
              border-gray-200/50
              dark:border-white/5
            "
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="
                  px-3.5
                  py-1.5
                  text-sm
                  font-medium
                  text-slate-600
                  dark:text-slate-300
                  hover:text-emerald-600
                  dark:hover:text-white
                  transition-colors
                  rounded-lg
                  hover:bg-white
                  dark:hover:bg-slate-700/50
                  whitespace-nowrap
                "
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Iniciar Sesión */}
            <Link
              to="/login"
              className="
                flex
                items-center
                gap-2
                text-sm
                font-semibold
                text-slate-700
                dark:text-slate-200
                hover:text-slate-900
                dark:hover:text-white
                px-3.5
                py-2
                rounded-xl
                border
                border-gray-200
                dark:border-slate-700
                hover:border-slate-400
                dark:hover:border-slate-500
                transition-all
              "
            >
              <LogIn className="w-4 h-4 text-emerald-500" />
              <span>Iniciar Sesión</span>
            </Link>
          </div>

          {/* Mobile */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden mt-2 bg-white/95 dark:bg-slate-900/95 border border-gray-200 dark:border-white/10 rounded-2xl p-6 space-y-4 shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-200">

          <div className="space-y-2">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleSmoothScroll(e, link.href)}
                className="
                  block
                  text-base
                  font-medium
                  text-slate-700
                  dark:text-slate-200
                  hover:text-emerald-600
                  dark:hover:text-emerald-400
                  py-1
                "
              >
                {link.name}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="
                flex
                items-center
                justify-center
                gap-2
                w-full
                py-2.5
                rounded-xl
                border
                border-gray-300
                dark:border-slate-700
                text-slate-800
                dark:text-slate-200
                font-semibold
              "
            >
              <LogIn className="w-4 h-4 text-emerald-500" />
              Iniciar Sesión
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}