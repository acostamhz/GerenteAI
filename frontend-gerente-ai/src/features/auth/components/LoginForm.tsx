import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import { Button } from "@/app/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";
import { AuthErrorAlert } from "./AuthErrorAlert";

const ease = [0.22, 1, 0.36, 1] as const;

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();

  const shouldReduceMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLocalError(null);
    setResendMsg(null);

    return () => {
      clearError();
    };
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setLocalError("Por favor ingresa tu correo y contraseña.");
      return;
    }

    setLocalError(null);
    setResendMsg(null);
    clearError();

    try {
      const loggedUser = await login({
        email: cleanEmail,
        password,
      });

      const from = (
        location.state as {
          from?: {
            pathname?: string;
          };
        }
      )?.from?.pathname;

      if (from && from !== "/login") {
        navigate(from, { replace: true });
      } else if (loggedUser.rolGlobal === "MASTER") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error("❌ [LoginForm] Error en handleSubmit:", err);
    }
  };

  const handleQuickResend = async () => {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setLocalError(
        "Por favor ingresa tu correo electrónico para reenviarte el enlace de activación.",
      );
      return;
    }

    setIsResending(true);

    try {
      const res = await authApi.reenviarVerificacion(cleanEmail);

      setResendMsg(
        res.mensaje ||
          "Correo de verificación reenviado con éxito. Revisa tu bandeja de entrada.",
      );

      setLocalError(null);
      clearError();
    } catch (err: any) {
      setLocalError(
        err?.message ||
          "No se pudo reenviar el correo. Verifica que el email sea el correcto.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="flex h-full min-h-0 w-full items-center justify-center overflow-hidden bg-background">
      <div
        className="
          flex
          h-full
          min-h-0
          w-full
          max-w-[560px]
          flex-col
          justify-between
          px-7
          py-7
          sm:px-10
          lg:px-12
        "
      >
        {/* ============================================================
            MAIN CONTENT
        ============================================================ */}

        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : {
                  opacity: 0,
                  y: 16,
                }
          }
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: shouldReduceMotion ? 0 : 0.7,
            ease,
          }}
          className="flex min-h-0 flex-1 flex-col justify-center"
        >
          {/* ==========================================================
              EYEBROW
          ========================================================== */}

          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 0,
                    y: 8,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.08,
              ease,
            }}
            className="mb-5"
          >
            <span
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.18em]
                text-muted-foreground/60
              "
            >
              Iniciar sesión
            </span>
          </motion.div>

          {/* ==========================================================
              TITLE
          ========================================================== */}

          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 0,
                    y: 12,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : 0.14,
              ease,
            }}
          >
            <h1
              className="
                bg-gradient-to-r
                from-emerald-400
                via-cyan-400
                to-blue-500
                bg-clip-text
                text-[2.45rem]
                font-bold
                leading-[1.02]
                tracking-[-0.045em]
                text-transparent
              "
            >
              Bienvenido
              <br />
              de nuevo.
            </h1>

            <p
              className="
                mt-4
                max-w-[450px]
                text-[14px]
                leading-6
                text-muted-foreground
              "
            >
              Ingresa a tu cuenta para continuar administrando tu negocio con
              Luka.
            </p>
          </motion.div>

          {/* ==========================================================
              SUCCESS
          ========================================================== */}

          <AnimatePresence mode="wait">
            {resendMsg && (
              <motion.div
                key="resend-success"
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 0,
                        y: -6,
                        scale: 0.98,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: -6,
                        scale: 0.98,
                      }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.35,
                  ease,
                }}
                className="
                  mt-5
                  flex
                  items-start
                  gap-3
                  rounded-xl
                  border
                  border-emerald-500/15
                  bg-emerald-500/[0.06]
                  px-4
                  py-3
                "
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />

                <span className="text-[12px] font-medium leading-5 text-emerald-700 dark:text-emerald-400">
                  {resendMsg}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==========================================================
              ERROR
          ========================================================== */}

          <AnimatePresence>
            {displayError && (
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : {
                        opacity: 0,
                        y: -6,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={
                  shouldReduceMotion
                    ? { opacity: 0 }
                    : {
                        opacity: 0,
                        y: -6,
                      }
                }
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  ease,
                }}
                className="mt-5"
              >
                <AuthErrorAlert
                  error={displayError}
                  onResendVerification={handleQuickResend}
                  isResending={isResending}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ==========================================================
              FORM
          ========================================================== */}

          <motion.form
            onSubmit={handleSubmit}
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 0,
                    y: 12,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.6,
              delay: shouldReduceMotion ? 0 : 0.2,
              ease,
            }}
            className="mt-7 space-y-5"
          >
            {/* ========================================================
                EMAIL
            ======================================================== */}

            <div className="space-y-2">
              <label
                htmlFor="login-email"
                className="
                  block
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.15em]
                  text-foreground/60
                "
              >
                Correo electrónico
              </label>

              <input
                id="login-email"
                type="email"
                placeholder="tu@empresa.com"
                required
                disabled={isLoading}
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);

                  if (displayError) {
                    setLocalError(null);
                    clearError();
                  }
                }}
                className="
                  h-[54px]
                  w-full
                  rounded-[14px]
                  border
                  border-border/80
                  bg-background
                  px-4
                  text-[14px]
                  font-medium
                  text-foreground
                  outline-none
                  transition-all
                  duration-300
                  placeholder:text-muted-foreground/40
                  hover:border-border
                  focus:border-primary/50
                  focus:ring-4
                  focus:ring-primary/8
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />
            </div>

            {/* ========================================================
                PASSWORD
            ======================================================== */}

            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4">
                <label
                  htmlFor="login-password"
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-foreground/60
                  "
                >
                  Contraseña
                </label>

                <Link
                  to="/forgot-password"
                  onClick={() => clearError()}
                  className="
                    text-[11px]
                    font-semibold
                    text-primary
                    transition-opacity
                    hover:opacity-70
                  "
                >
                  ¿La olvidaste?
                </Link>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);

                    if (displayError) {
                      setLocalError(null);
                      clearError();
                    }
                  }}
                  className="
                    h-[54px]
                    w-full
                    rounded-[14px]
                    border
                    border-border/80
                    bg-background
                    px-4
                    pr-14
                    text-[14px]
                    font-medium
                    tracking-[0.08em]
                    text-foreground
                    outline-none
                    transition-all
                    duration-300
                    placeholder:text-muted-foreground/40
                    hover:border-border
                    focus:border-primary/50
                    focus:ring-4
                    focus:ring-primary/8
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                  "
                />

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
                  }
                  className="
                    absolute
                    right-2
                    top-1/2
                    flex
                    h-10
                    w-10
                    -translate-y-1/2
                    items-center
                    justify-center
                    rounded-xl
                    text-muted-foreground/50
                    transition-all
                    duration-200
                    hover:bg-muted
                    hover:text-foreground
                    disabled:cursor-not-allowed
                    disabled:opacity-50
                  "
                >
                  {showPassword ? (
                    <EyeOff className="h-[17px] w-[17px]" />
                  ) : (
                    <Eye className="h-[17px] w-[17px]" />
                  )}
                </button>
              </div>
            </div>

            {/* ========================================================
                CTA
            ======================================================== */}

            <motion.div
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
              whileTap={shouldReduceMotion ? undefined : { scale: 0.995 }}
              className="pt-0.5"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="
                  group
                  relative
                  h-[54px]
                  w-full
                  overflow-hidden
                  rounded-[14px]
                  bg-primary
                  px-5
                  text-[14px]
                  font-bold
                  text-primary-foreground
                  shadow-none
                  transition-all
                  duration-300
                  hover:shadow-lg
                  hover:shadow-primary/15
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                <span className="relative flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verificando credenciales...
                    </>
                  ) : (
                    <>
                      Ingresar a la plataforma

                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </motion.form>

          {/* ==========================================================
              REGISTER
          ========================================================== */}

          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 0,
                    y: 7,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.45,
              ease,
            }}
            className="mt-6 text-center"
          >
            <p className="text-[12px] text-muted-foreground">
              ¿No tienes una cuenta?{" "}
              <Link
                to="/register"
                onClick={() => clearError()}
                className="
                  font-semibold
                  text-primary
                  transition-opacity
                  hover:opacity-70
                "
              >
                Regístrate gratis
              </Link>
            </p>
          </motion.div>

          {/* ==========================================================
              SECURITY
          ========================================================== */}

          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                  }
            }
            animate={{
              opacity: 1,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.5,
              delay: shouldReduceMotion ? 0 : 0.58,
              ease,
            }}
            className="
              mt-6
              flex
              items-center
              justify-center
              gap-2
              text-[9px]
              font-medium
              uppercase
              tracking-[0.13em]
              text-muted-foreground/35
            "
          >
            <span className="h-1 w-1 rounded-full bg-emerald-500/50" />
            Acceso seguro
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}