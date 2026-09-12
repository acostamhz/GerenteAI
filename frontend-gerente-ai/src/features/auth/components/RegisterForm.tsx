import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  User,
  Mail,
  Phone,
  Lock,
  MailCheck,
  Send,
  MessageCircle,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";

import { Button } from "@/app/components/ui/button";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { AuthErrorAlert } from "./AuthErrorAlert";

const ease = [0.22, 1, 0.36, 1] as const;

export function RegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading, error: authError, clearError } = useAuth();

  const shouldReduceMotion = useReducedMotion();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsappUsername: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Reenvío de verificación
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLocalError(null);

    return () => {
      clearError();
    };
  }, [clearError]);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) {
      return {
        score: 0,
        label: "",
        color: "bg-border",
      };
    }

    let score = 0;

    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return {
          score: 25,
          label: "Débil",
          color: "bg-red-500",
        };

      case 2:
        return {
          score: 50,
          label: "Aceptable",
          color: "bg-amber-500",
        };

      case 3:
        return {
          score: 75,
          label: "Buena",
          color: "bg-blue-500",
        };

      case 4:
        return {
          score: 100,
          label: "Excelente",
          color: "bg-emerald-500",
        };

      default:
        return {
          score: 15,
          label: "Muy débil",
          color: "bg-red-500",
        };
    }
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (localError || authError) {
      setLocalError(null);
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLocalError(null);
    clearError();

    const cleanFullName = formData.fullName.trim();
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPhone = formData.phone.replace(/\D/g, "");
    const cleanWhatsappUsername = formData.whatsappUsername
      .trim()
      .replace(/^@+/, "");

    if (!cleanFullName) {
      setLocalError("Por favor ingresa tu nombre completo.");
      return;
    }

    if (!cleanEmail) {
      setLocalError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    if (cleanPhone.length < 10) {
      setLocalError(
        "El número de celular debe tener al menos 10 dígitos (incluyendo indicativo).",
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    if (formData.password.length < 8) {
      setLocalError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (!/(?=.*[a-z])/.test(formData.password)) {
      setLocalError(
        "La contraseña debe contener al menos una letra minúscula.",
      );
      return;
    }

    if (!/(?=.*[A-Z])/.test(formData.password)) {
      setLocalError(
        "La contraseña debe contener al menos una letra mayúscula.",
      );
      return;
    }

    if (!/(?=.*\d)/.test(formData.password)) {
      setLocalError(
        "La contraseña debe contener al menos un número.",
      );
      return;
    }

    if (!/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      setLocalError(
        "La contraseña debe contener al menos un carácter especial (!@#$%...).",
      );
      return;
    }

    if (!formData.termsAccepted) {
      setLocalError(
        "Debes aceptar los términos y condiciones para continuar.",
      );
      return;
    }

    try {
      await register({
        nombre: cleanFullName,
        email: cleanEmail,
        password: formData.password,
        telefono: formData.phone.trim(),
        whatsappUsername:
          cleanWhatsappUsername || undefined,
      });

      setIsSuccess(true);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        (err instanceof Error
          ? err.message
          : "Error al registrar la cuenta.");

      setLocalError(errorMsg);
    }
  };

  const handleResendVerification = async () => {
    const cleanEmail = formData.email.trim().toLowerCase();

    if (!cleanEmail) return;

    setIsResending(true);
    setResendMessage(null);

    try {
      const res =
        await authApi.reenviarVerificacion(cleanEmail);

      setResendMessage(
        res.mensaje ||
          "Correo de verificación reenviado con éxito.",
      );
    } catch (err: any) {
      setResendMessage(
        err?.message ||
          "No se pudo reenviar el correo.",
      );
    } finally {
      setIsResending(false);
    }
  };

  const displayError = localError || authError;

  // ================================================================
  // CONFIRMACIÓN DE REGISTRO
  // ================================================================

  if (isSuccess) {
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
            justify-center
            px-7
            py-7
            sm:px-10
            lg:px-12
          "
        >
          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1 }
                : {
                    opacity: 0,
                    y: 18,
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
            className="mx-auto w-full max-w-[430px] text-center"
          >
            {/* Icon */}

            <motion.div
              initial={
                shouldReduceMotion
                  ? {
                      opacity: 1,
                      scale: 1,
                    }
                  : {
                      opacity: 0,
                      scale: 0.8,
                      y: 8,
                    }
              }
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.6,
                delay: shouldReduceMotion ? 0 : 0.08,
                ease,
              }}
              className="
                relative
                mx-auto
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                bg-emerald-500/10
                ring-1
                ring-emerald-500/15
              "
            >
              <MailCheck className="h-7 w-7 text-emerald-500" />

              <span
                className="
                  absolute
                  -right-1
                  -top-1
                  flex
                  h-5
                  w-5
                  items-center
                  justify-center
                  rounded-full
                  bg-emerald-500
                  text-[10px]
                  font-bold
                  text-white
                  shadow-sm
                "
              >
                ✓
              </span>
            </motion.div>

            {/* Header */}

            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : {
                      opacity: 0,
                      y: 10,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.55,
                delay: shouldReduceMotion ? 0 : 0.18,
                ease,
              }}
              className="mt-5"
            >
              <span
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.18em]
                  text-muted-foreground/55
                "
              >
                Cuenta creada
              </span>

              <h1
                className="
                  mt-3
                  text-[2.3rem]
                  font-bold
                  leading-[1]
                  tracking-[-0.045em]
                  text-foreground
                "
              >
                Revisa tu correo
                <br />
                electrónico.
              </h1>

              <p
                className="
                  mx-auto
                  mt-4
                  max-w-[370px]
                  text-[13px]
                  leading-6
                  text-muted-foreground
                "
              >
                Hemos enviado un enlace de verificación a:
              </p>

              <div
                className="
                  mt-3
                  inline-flex
                  max-w-full
                  rounded-xl
                  bg-muted
                  px-3
                  py-2
                  text-[11px]
                  font-semibold
                  text-foreground
                "
              >
                <span className="truncate">
                  {formData.email.trim().toLowerCase()}
                </span>
              </div>

              <p
                className="
                  mx-auto
                  mt-4
                  max-w-[370px]
                  text-[11px]
                  leading-5
                  text-muted-foreground/70
                "
              >
                Haz clic en el enlace del correo para activar
                tu cuenta antes de iniciar sesión.
              </p>
            </motion.div>

            {/* Resend message */}

            <AnimatePresence mode="wait">
              {resendMessage && (
                <motion.div
                  key="resend"
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : {
                          opacity: 0,
                          y: 8,
                        }
                  }
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -8,
                  }}
                  transition={{
                    duration: shouldReduceMotion ? 0 : 0.35,
                    ease,
                  }}
                  className="
                    mt-5
                    rounded-xl
                    border
                    border-emerald-500/15
                    bg-emerald-500/[0.06]
                    px-4
                    py-3
                    text-[11px]
                    font-medium
                    leading-5
                    text-emerald-700
                    dark:text-emerald-400
                  "
                >
                  {resendMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}

            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : {
                      opacity: 0,
                      y: 10,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.55,
                delay: shouldReduceMotion ? 0 : 0.3,
                ease,
              }}
              className="mt-6 space-y-2"
            >
              <Button
                onClick={() =>
                  navigate("/login", {
                    replace: true,
                  })
                }
                className="
                  group
                  h-[52px]
                  w-full
                  rounded-[14px]
                  bg-primary
                  text-[13px]
                  font-bold
                  shadow-none
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:shadow-lg
                  hover:shadow-primary/15
                "
              >
                <span className="flex items-center justify-center gap-2">
                  Ir a Iniciar Sesión

                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Button>

              <button
                type="button"
                disabled={isResending}
                onClick={handleResendVerification}
                className="
                  flex
                  h-10
                  w-full
                  items-center
                  justify-center
                  gap-1.5
                  rounded-xl
                  text-[11px]
                  font-semibold
                  text-muted-foreground
                  transition-colors
                  hover:text-foreground
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              >
                {isResending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}

                ¿No recibiste el correo? Reenviar enlace
              </button>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // ================================================================
  // REGISTRO
  // ================================================================

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
          justify-center
          px-7
          py-7
          sm:px-10
          lg:px-12
        "
      >
        <motion.div
          initial={
            shouldReduceMotion
              ? { opacity: 1, y: 0 }
              : {
                  opacity: 0,
                  y: 14,
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
        >
          {/* ========================================================
              HEADER
          ======================================================== */}

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
              Crear cuenta
            </span>

            <h1
              className="
                mt-2.5
                bg-gradient-to-r
                from-emerald-400
                via-cyan-400
                to-blue-500
                bg-clip-text
                text-[2.15rem]
                font-bold
                leading-[1]
                tracking-[-0.045em]
                text-transparent
                sm:text-[2.3rem]
              "
            >
              Empieza con Luka.
            </h1>

            <p
              className="
                mt-3
                max-w-[480px]
                text-[13px]
                leading-5
                text-muted-foreground
              "
            >
              Crea tu cuenta y empieza a gestionar tu negocio con
              Inteligencia Artificial.
            </p>
          </motion.div>

          {/* ========================================================
              ERROR
          ======================================================== */}

          <AnimatePresence>
            {displayError && (
              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : {
                        opacity: 0,
                        y: -6,
                      }
                }
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -6,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.3,
                  ease,
                }}
                className="mb-4"
              >
                <AuthErrorAlert error={displayError} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================
              FORM
          ======================================================== */}

          <motion.form
            onSubmit={handleSubmit}
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 0,
                    y: 10,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.65,
              delay: shouldReduceMotion ? 0 : 0.16,
              ease,
            }}
            className="space-y-3"
          >
            {/* ======================================================
                ROW 1
            ====================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Full name */}

              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, x: 0 }
                    : {
                        opacity: 0,
                        x: -8,
                      }
                }
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.22,
                  ease,
                }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="register-full-name"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-foreground/60
                  "
                >
                  Nombre completo
                </label>

                <div className="relative">
                  <User
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-3.5
                      w-3.5
                      -translate-y-1/2
                      text-muted-foreground/45
                    "
                  />

                  <input
                    id="register-full-name"
                    type="text"
                    name="fullName"
                    placeholder="María Rodríguez"
                    required
                    disabled={isLoading}
                    value={formData.fullName}
                    onChange={handleChange}
                    className="
                      h-[48px]
                      w-full
                      rounded-[13px]
                      border
                      border-border/80
                      bg-background
                      px-9
                      text-[12px]
                      font-medium
                      text-foreground
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-muted-foreground/35
                      hover:border-border
                      focus:border-primary/50
                      focus:ring-4
                      focus:ring-primary/8
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>
              </motion.div>

              {/* Email */}

              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, x: 0 }
                    : {
                        opacity: 0,
                        x: 8,
                      }
                }
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.25,
                  ease,
                }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="register-email"
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

                <div className="relative">
                  <Mail
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-3.5
                      w-3.5
                      -translate-y-1/2
                      text-muted-foreground/45
                    "
                  />

                  <input
                    id="register-email"
                    type="email"
                    name="email"
                    placeholder="tu@empresa.com"
                    required
                    disabled={isLoading}
                    value={formData.email}
                    onChange={handleChange}
                    className="
                      h-[48px]
                      w-full
                      rounded-[13px]
                      border
                      border-border/80
                      bg-background
                      px-9
                      text-[12px]
                      font-medium
                      text-foreground
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-muted-foreground/35
                      hover:border-border
                      focus:border-primary/50
                      focus:ring-4
                      focus:ring-primary/8
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>
              </motion.div>
            </div>

            {/* ======================================================
                ROW 2
            ====================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Phone */}

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
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.29,
                  ease,
                }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="register-phone"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-foreground/60
                  "
                >
                  Celular
                </label>

                <div className="relative">
                  <Phone
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-3.5
                      w-3.5
                      -translate-y-1/2
                      text-muted-foreground/45
                    "
                  />

                  <input
                    id="register-phone"
                    type="tel"
                    name="phone"
                    placeholder="+57 300 000 0000"
                    required
                    disabled={isLoading}
                    minLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    className="
                      h-[48px]
                      w-full
                      rounded-[13px]
                      border
                      border-border/80
                      bg-background
                      px-9
                      text-[12px]
                      font-medium
                      text-foreground
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-muted-foreground/35
                      hover:border-border
                      focus:border-primary/50
                      focus:ring-4
                      focus:ring-primary/8
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>

                <p className="text-[9px] leading-4 text-muted-foreground">
                  Incluye el código de país{" "}
                  <span className="font-semibold">+57</span>.
                </p>
              </motion.div>

              {/* WhatsApp */}

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
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.34,
                  ease,
                }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="register-whatsapp"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-foreground/60
                  "
                >
                  WhatsApp
                </label>

                <div className="relative">
                  <MessageCircle
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-3.5
                      w-3.5
                      -translate-y-1/2
                      text-muted-foreground/45
                    "
                  />

                  <input
                    id="register-whatsapp"
                    type="text"
                    name="whatsappUsername"
                    placeholder="@usuario"
                    disabled={isLoading}
                    value={formData.whatsappUsername}
                    onChange={handleChange}
                    className="
                      h-[48px]
                      w-full
                      rounded-[13px]
                      border
                      border-border/80
                      bg-background
                      px-9
                      text-[12px]
                      font-medium
                      text-foreground
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-muted-foreground/35
                      hover:border-border
                      focus:border-primary/50
                      focus:ring-4
                      focus:ring-primary/8
                      disabled:cursor-not-allowed
                      disabled:opacity-60
                    "
                  />
                </div>

                <p className="text-[9px] leading-4 text-muted-foreground">
                  Sin el @. Ejemplo:{" "}
                  <span className="font-semibold">
                    mariarodriguez
                  </span>
                  .
                </p>
              </motion.div>
            </div>

            {/* ======================================================
                ROW 3
            ====================================================== */}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Password */}

              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : {
                        opacity: 0,
                        x: -7,
                      }
                }
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.39,
                  ease,
                }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="register-password"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-foreground/60
                  "
                >
                  Contraseña
                </label>

                <div className="relative">
                  <Lock
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-3.5
                      w-3.5
                      -translate-y-1/2
                      text-muted-foreground/45
                    "
                  />

                  <input
                    id="register-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Mín. 8 caracteres"
                    required
                    disabled={isLoading}
                    minLength={8}
                    value={formData.password}
                    onChange={handleChange}
                    className="
                      h-[48px]
                      w-full
                      rounded-[13px]
                      border
                      border-border/80
                      bg-background
                      px-9
                      pr-10
                      text-[12px]
                      font-medium
                      text-foreground
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-muted-foreground/35
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
                    onClick={() =>
                      setShowPassword((value) => !value)
                    }
                    aria-label={
                      showPassword
                        ? "Ocultar contraseña"
                        : "Mostrar contraseña"
                    }
                    className="
                      absolute
                      right-1.5
                      top-1/2
                      flex
                      h-9
                      w-9
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-[10px]
                      text-muted-foreground/50
                      transition-colors
                      hover:bg-muted
                      hover:text-foreground
                      disabled:opacity-50
                    "
                  >
                    {showPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <AnimatePresence initial={false}>
                  {formData.password && (
                    <motion.div
                      initial={
                        shouldReduceMotion
                          ? { opacity: 1, height: "auto" }
                          : {
                              opacity: 0,
                              height: 0,
                            }
                      }
                      animate={{
                        opacity: 1,
                        height: "auto",
                      }}
                      exit={{
                        opacity: 0,
                        height: 0,
                      }}
                      transition={{
                        duration: shouldReduceMotion ? 0 : 0.25,
                      }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-2 pt-0.5">
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{
                              width: 0,
                            }}
                            animate={{
                              width: `${strength.score}%`,
                            }}
                            transition={{
                              duration: shouldReduceMotion ? 0 : 0.3,
                              ease,
                            }}
                            className={`h-full rounded-full ${strength.color}`}
                          />
                        </div>

                        <span className="shrink-0 text-[9px] font-bold text-muted-foreground">
                          {strength.label}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>

              {/* Confirm password */}

              <motion.div
                initial={
                  shouldReduceMotion
                    ? { opacity: 1, y: 0 }
                    : {
                        opacity: 0,
                        x: 7,
                      }
                }
                animate={{
                  opacity: 1,
                  x: 0,
                }}
                transition={{
                  duration: shouldReduceMotion ? 0 : 0.45,
                  delay: shouldReduceMotion ? 0 : 0.44,
                  ease,
                }}
                className="space-y-1.5"
              >
                <label
                  htmlFor="register-confirm-password"
                  className="
                    block
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.15em]
                    text-foreground/60
                  "
                >
                  Confirmar contraseña
                </label>

                <div className="relative">
                  <Lock
                    className="
                      absolute
                      left-3
                      top-1/2
                      h-3.5
                      w-3.5
                      -translate-y-1/2
                      text-muted-foreground/45
                    "
                  />

                  <input
                    id="register-confirm-password"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    name="confirmPassword"
                    placeholder="Repite la contraseña"
                    required
                    disabled={isLoading}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="
                      h-[48px]
                      w-full
                      rounded-[13px]
                      border
                      border-border/80
                      bg-background
                      px-9
                      pr-10
                      text-[12px]
                      font-medium
                      text-foreground
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-muted-foreground/35
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
                    onClick={() =>
                      setShowConfirmPassword(
                        (value) => !value,
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Ocultar confirmación"
                        : "Mostrar confirmación"
                    }
                    className="
                      absolute
                      right-1.5
                      top-1/2
                      flex
                      h-9
                      w-9
                      -translate-y-1/2
                      items-center
                      justify-center
                      rounded-[10px]
                      text-muted-foreground/50
                      transition-colors
                      hover:bg-muted
                      hover:text-foreground
                      disabled:opacity-50
                    "
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3.5 w-3.5" />
                    ) : (
                      <Eye className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </motion.div>
            </div>

            {/* ======================================================
                TERMS
            ====================================================== */}

            <motion.div
              initial={
                shouldReduceMotion
                  ? { opacity: 1, y: 0 }
                  : {
                      opacity: 0,
                      y: 6,
                    }
              }
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: shouldReduceMotion ? 0 : 0.45,
                delay: shouldReduceMotion ? 0 : 0.49,
                ease,
              }}
              className="pt-1"
            >
              <label className="flex cursor-pointer items-start gap-2 select-none">
                <input
                  type="checkbox"
                  name="termsAccepted"
                  disabled={isLoading}
                  checked={formData.termsAccepted}
                  onChange={handleChange}
                  className="
                    mt-0.5
                    h-3.5
                    w-3.5
                    shrink-0
                    rounded
                    border-border
                    text-primary
                    focus:ring-primary/20
                  "
                />

                <span className="text-[10px] leading-4 text-muted-foreground">
                  Acepto los{" "}
                  <a
                    href="#terminos"
                    onClick={(e) =>
                      e.preventDefault()
                    }
                    className="font-bold text-primary hover:underline"
                  >
                    Términos
                  </a>{" "}
                  y la{" "}
                  <a
                    href="#privacidad"
                    onClick={(e) =>
                      e.preventDefault()
                    }
                    className="font-bold text-primary hover:underline"
                  >
                    Privacidad
                  </a>{" "}
                  de Luka AI.
                </span>
              </label>
            </motion.div>

            {/* ======================================================
                CTA
            ====================================================== */}

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
                delay: shouldReduceMotion ? 0 : 0.54,
                ease,
              }}
              whileHover={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: -1,
                    }
              }
              whileTap={
                shouldReduceMotion
                  ? undefined
                  : {
                      scale: 0.995,
                    }
              }
              className="pt-0.5"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="
                  group
                  h-[52px]
                  w-full
                  overflow-hidden
                  rounded-[14px]
                  bg-primary
                  px-5
                  text-[13px]
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
                <span className="flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creando tu cuenta...
                    </>
                  ) : (
                    <>
                      Crear cuenta y comenzar gratis

                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </span>
              </Button>
            </motion.div>
          </motion.form>

          {/* ========================================================
              LOGIN LINK
          ======================================================== */}

          <motion.div
            initial={
              shouldReduceMotion
                ? { opacity: 1, y: 0 }
                : {
                    opacity: 0,
                    y: 6,
                  }
            }
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: shouldReduceMotion ? 0 : 0.45,
              delay: shouldReduceMotion ? 0 : 0.62,
              ease,
            }}
            className="mt-5 text-center"
          >
            <p className="text-[11px] text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link
                to="/login"
                onClick={() => clearError()}
                className="
                  font-semibold
                  text-primary
                  transition-opacity
                  hover:opacity-70
                "
              >
                Inicia sesión
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}