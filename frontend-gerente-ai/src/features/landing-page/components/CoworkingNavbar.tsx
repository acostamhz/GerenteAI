import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Menu,
  X,
  ArrowRight,
  CircleDollarSign,
} from "lucide-react";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { useAuth } from "@/features/auth";

function easeInOutQuart(t: number): number {
  return t < 0.5
    ? 8 * t * t * t * t
    : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function customSmoothScroll(
  targetY: number,
  duration: number = 1000
) {
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  let startTime: number | null = null;

  function animation(currentTime: number) {
    if (startTime === null) {
      startTime = currentTime;
    }

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

const navLinks = [
  {
    name: "Negocios",
    href: "#negocios",
  },
  {
    name: "Usos",
    href: "#usos",
  },
  {
    name: "Funciones",
    href: "#features",
  },
  {
    name: "Planes",
    href: "#planes",
  },
  {
    name: "Preguntas",
    href: "#faq",
  },
];

export function CoworkingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [showAnnouncement, setShowAnnouncement] =
    useState(true);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;

      window.requestAnimationFrame(() => {
        const shouldShow = window.scrollY <= 20;

        setShowAnnouncement((current) => {
          if (current === shouldShow) return current;
          return shouldShow;
        });

        ticking = false;
      });
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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
    <>
      {/* =====================================================
          TOP ANNOUNCEMENT BAR
          ===================================================== */}

      <div
        className={`
          fixed
          left-0
          right-0
          top-0
          z-[70]
          h-11
          transition-all
          duration-300
          ease-out
          ${
            showAnnouncement
              ? "translate-y-0 opacity-100"
              : "-translate-y-full pointer-events-none opacity-0"
          }
        `}
      >
        <a
          href="#planes"
          onClick={(e) =>
            handleSmoothScroll(e, "#planes")
          }
          className="
            group
            flex
            h-full
            w-full
            items-center
            justify-center
            gap-2
            bg-[#00B545]
            px-4
            text-center
            text-sm
            font-semibold
            text-slate-950
            transition-all
            duration-300
            hover:bg-[#00C44B]
          "
        >
          <CircleDollarSign
            className="
              h-4
              w-4
              shrink-0
              text-white
              transition-transform
              duration-300
              group-hover:scale-110
            "
          />

          <span className="text-white">
            Conoce los nuevos planes de Luka
          </span>

          <ArrowRight
            className="
              h-4
              w-4
              shrink-0
              text-white
              transition-transform
              duration-300
              group-hover:translate-x-1
            "
          />
        </a>
      </div>

      {/* =====================================================
          MAIN NAVBAR
          ===================================================== */}

      <header
        className={`
          fixed
          left-1/2
          z-50
          w-[calc(100%-2rem)]
          max-w-7xl
          -translate-x-1/2
          transition-[top]
          duration-300
          ease-out
          ${
            showAnnouncement
              ? "top-[3.75rem]"
              : "top-3 sm:top-4"
          }
        `}
      >
        <div
          className="
            relative
            flex
            min-h-[68px]
            items-center
            rounded-full
            border
            border-slate-200/80
            bg-transparent
            px-4
            py-2.5
            shadow-[0_10px_40px_rgba(15,23,42,0.08)]
            backdrop-blur-xl
            transition-all
            duration-300

            sm:px-5

            dark:border-white/10
            dark:bg-transparent
            dark:shadow-[0_10px_40px_rgba(0,0,0,0.35)]
          "
        >
          {/* =================================================
              BRAND
              ================================================= */}

          <Link
            to="/home"
            onClick={(e) => {
              if (
                window.location.pathname === "/home"
              ) {
                e.preventDefault();
                customSmoothScroll(0, 1000);
              }
            }}
            className="
              group
              relative
              z-20
              flex
              shrink-0
              items-center
              gap-2.5
            "
            aria-label="Luka AI - Inicio"
          >
            <img
              src="/Luka.png"
              alt="Luka AI"
              className="
                h-9
                w-auto
                max-w-[145px]
                object-contain
                object-left
                transition-transform
                duration-300
                group-hover:scale-[1.03]
              "
            />

            {/* Luka AI — degradado de la marca */}
            <span
              className="
                hidden
                bg-gradient-to-r
                from-cyan-400
                via-blue-500
                to-purple-500
                bg-clip-text
                text-xl
                font-extrabold
                tracking-tight
                text-transparent
                sm:block
              "
            >
              Luka AI
            </span>
          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
              ================================================= */}

          <nav
            className="
              absolute
              left-1/2
              top-1/2
              hidden
              -translate-x-1/2
              -translate-y-1/2
              items-center
              gap-1
              lg:flex
            "
          >
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) =>
                  handleSmoothScroll(
                    e,
                    link.href
                  )
                }
                className="
                  group
                  flex
                  items-center
                  whitespace-nowrap
                  rounded-full
                  px-4
                  py-2.5
                  text-sm
                  font-medium
                  text-slate-700
                  transition-all
                  duration-300
                  hover:bg-slate-100
                  hover:text-slate-950

                  dark:text-slate-300
                  dark:hover:bg-white/5
                  dark:hover:text-white
                "
              >
                <span>{link.name}</span>
              </a>
            ))}
          </nav>

          {/* =================================================
              DESKTOP ACTIONS
              ================================================= */}

          <div
            className="
              relative
              z-20
              ml-auto
              hidden
              shrink-0
              items-center
              gap-2
              sm:flex
            "
          >
            <ThemeToggle />

            {isAuthenticated && user ? (
              <>
                <Link
                  to="/"
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-slate-700
                    transition-all
                    duration-300
                    hover:bg-slate-100
                    hover:text-slate-950

                    dark:text-slate-300
                    dark:hover:bg-white/5
                    dark:hover:text-white
                  "
                >
                  <span className="max-w-[100px] truncate">
                    {user.name ||
                      user.email ||
                      "Dashboard"}
                  </span>
                </Link>

                <Link
                  to="/"
                  className="
                    group
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-gradient-to-r
                    from-cyan-400
                    via-blue-500
                    to-purple-500
                    px-5
                    py-2.5
                    text-sm
                    font-bold
                    text-white
                    shadow-[0_8px_25px_rgba(59,130,246,0.25)]
                    transition-all
                    duration-300
                    hover:scale-[1.03]
                    hover:shadow-[0_10px_35px_rgba(59,130,246,0.4)]
                    active:scale-95
                  "
                >
                  Ir al dashboard

                  <ArrowRight
                    className="
                      h-4
                      w-4
                      transition-transform
                      duration-300
                      group-hover:translate-x-1
                    "
                  />
                </Link>
              </>
            ) : (
              <Link
                to="/login"
                className="
                  group
                  relative
                  flex
                  items-center
                  gap-2
                  overflow-hidden
                  rounded-full
                  bg-gradient-to-r
                  from-cyan-400
                  via-blue-500
                  to-purple-500
                  px-5
                  py-2.5
                  text-sm
                  font-bold
                  text-white
                  shadow-[0_8px_25px_rgba(59,130,246,0.25)]
                  transition-all
                  duration-300
                  hover:scale-[1.03]
                  hover:shadow-[0_10px_35px_rgba(59,130,246,0.4)]
                  active:scale-95
                "
              >
                <span
                  className="
                    absolute
                    inset-0
                    -translate-x-full
                    bg-gradient-to-r
                    from-transparent
                    via-white/25
                    to-transparent
                    transition-transform
                    duration-1000
                    group-hover:translate-x-full
                  "
                />

                <span className="relative z-10">
                  Inicia sesión
                </span>

                <ArrowRight
                  className="
                    relative
                    z-10
                    h-4
                    w-4
                    transition-transform
                    duration-300
                    group-hover:translate-x-1
                  "
                />
              </Link>
            )}
          </div>

          {/* =================================================
              MOBILE
              ================================================= */}

          <div
            className="
              relative
              z-20
              ml-auto
              flex
              items-center
              gap-2
              sm:hidden
            "
          >
            <ThemeToggle />

            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(
                  !mobileMenuOpen
                )
              }
              className="
                flex
                h-10
                w-10
                items-center
                justify-center
                rounded-full
                border
                border-slate-200
                bg-transparent
                text-slate-800
                transition-all
                duration-300
                hover:bg-slate-100
                active:scale-90

                dark:border-white/10
                dark:bg-transparent
                dark:text-white
              "
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* =====================================================
            MOBILE MENU
            ===================================================== */}

        {mobileMenuOpen && (
          <div
            className="
              mt-3
              overflow-hidden
              rounded-3xl
              border
              border-slate-200
              bg-slate-50/95
              p-4
              shadow-[0_20px_50px_rgba(15,23,42,0.12)]
              backdrop-blur-xl

              dark:border-white/10
              dark:bg-[#070B12]/95
              dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)]
            "
          >
            <div className="space-y-1">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={(e) =>
                    handleSmoothScroll(
                      e,
                      link.href
                    )
                  }
                  className="
                    block
                    rounded-2xl
                    px-4
                    py-3
                    text-sm
                    font-medium
                    text-slate-700
                    transition-colors
                    duration-200
                    hover:bg-slate-100
                    hover:text-slate-950

                    dark:text-slate-300
                    dark:hover:bg-white/5
                    dark:hover:text-white
                  "
                >
                  {link.name}
                </a>
              ))}
            </div>

            <div
              className="
                mt-3
                border-t
                border-slate-200
                pt-3

                dark:border-white/10
              "
            >
              <Link
                to="/register"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-full
                  bg-gradient-to-r
                  from-cyan-400
                  via-blue-500
                  to-purple-500
                  px-4
                  py-3
                  text-sm
                  font-bold
                  text-white
                  shadow-[0_8px_25px_rgba(59,130,246,0.25)]
                  transition-all
                  active:scale-95
                "
              >
                Inicia sesión

                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>
    </>
  );
}