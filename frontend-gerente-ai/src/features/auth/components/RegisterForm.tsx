import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
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
import { Button } from "@/app/components/ui/button";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";
import { AuthErrorAlert } from "./AuthErrorAlert";

export function RegisterForm() {
  const navigate = useNavigate();
  const {
    register,
    isLoading,
    error: authError,
    clearError,
  } = useAuth();

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    whatsappUsername: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [localError, setLocalError] =
    useState<string | null>(null);

  const [isSuccess, setIsSuccess] =
    useState(false);

  // Estados para reenvío
  const [isResending, setIsResending] =
    useState(false);

  const [resendMessage, setResendMessage] =
    useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLocalError(null);

    return () => {
      clearError();
    };
  }, [clearError]);

  const calculatePasswordStrength = (
    pass: string,
  ) => {
    if (!pass) {
      return {
        score: 0,
        label: "",
        color: "bg-border",
      };
    }

    let score = 0;

    if (pass.length >= 8) score += 1;
    if (
      /[a-z]/.test(pass) &&
      /[A-Z]/.test(pass)
    )
      score += 1;

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

  const strength =
    calculatePasswordStrength(
      formData.password,
    );

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
      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    if (localError || authError) {
      setLocalError(null);
      clearError();
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
  ) => {
    e.preventDefault();

    setLocalError(null);
    clearError();

    const cleanFullName =
      formData.fullName.trim();

    const cleanEmail =
      formData.email
        .trim()
        .toLowerCase();

    const cleanPhone =
      formData.phone.replace(
        /\D/g,
        "",
      );

    const cleanWhatsappUsername =
      formData.whatsappUsername
        .trim()
        .replace(/^@+/, "");

    if (!cleanFullName) {
      setLocalError(
        "Por favor ingresa tu nombre completo.",
      );
      return;
    }

    if (!cleanEmail) {
      setLocalError(
        "Por favor ingresa un correo electrónico válido.",
      );
      return;
    }

    if (cleanPhone.length < 10) {
      setLocalError(
        "El número de celular debe tener al menos 10 dígitos (incluyendo indicativo).",
      );
      return;
    }

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setLocalError(
        "Las contraseñas no coinciden.",
      );
      return;
    }

    if (formData.password.length < 8) {
      setLocalError(
        "La contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (
      !/(?=.*[a-z])/.test(
        formData.password,
      )
    ) {
      setLocalError(
        "La contraseña debe contener al menos una letra minúscula.",
      );
      return;
    }

    if (
      !/(?=.*[A-Z])/.test(
        formData.password,
      )
    ) {
      setLocalError(
        "La contraseña debe contener al menos una letra mayúscula.",
      );
      return;
    }

    if (
      !/(?=.*\d)/.test(
        formData.password,
      )
    ) {
      setLocalError(
        "La contraseña debe contener al menos un número.",
      );
      return;
    }

    if (
      !/(?=.*[!@#$%^&*(),.?":{}|<>])/.test(
        formData.password,
      )
    ) {
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
          cleanWhatsappUsername ||
          undefined,
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

  const handleResendVerification =
    async () => {
      const cleanEmail =
        formData.email
          .trim()
          .toLowerCase();

      if (!cleanEmail) return;

      setIsResending(true);
      setResendMessage(null);

      try {
        const res =
          await authApi.reenviarVerificacion(
            cleanEmail,
          );

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

  const displayError =
    localError || authError;

  /*
   * =========================================================
   * PANTALLA DE CONFIRMACIÓN
   * =========================================================
   */
  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto px-6 py-6 text-center space-y-5 animate-in fade-in duration-500">

        {/* Logo Luka AI */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <img
            src="/Luka.png"
            alt="Luka AI"
            className="w-11 h-11 object-contain shrink-0"
          />

          <span className="text-2xl font-black tracking-tight">
            <span className="text-[#5CE1E6]">
              Luka
            </span>

            <span className="text-foreground">
              {" "}AI
            </span>
          </span>
        </div>

        <div className="relative mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <MailCheck className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />

          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
            ✓
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-foreground tracking-tight">
            ¡Revisa tu correo electrónico!
          </h2>

          <p className="text-muted-foreground text-xs leading-relaxed max-w-xs mx-auto">
            Hemos enviado un enlace de verificación a:
          </p>

          <div className="inline-block px-3 py-1 bg-muted rounded-md text-xs font-bold text-foreground">
            {formData.email
              .trim()
              .toLowerCase()}
          </div>

          <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
            Haz clic en el enlace del correo para activar tu cuenta antes de iniciar sesión.
          </p>
        </div>

        {resendMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400 leading-relaxed">
            {resendMessage}
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <Button
            onClick={() =>
              navigate("/login", {
                replace: true,
              })
            }
            className="w-full py-2.5 text-xs font-bold rounded-xl cursor-pointer"
          >
            Ir a Iniciar Sesión
          </Button>

          <button
            type="button"
            disabled={isResending}
            onClick={
              handleResendVerification
            }
            className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isResending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}

            ¿No recibiste el correo?
            Reenviar enlace
          </button>
        </div>
      </div>
    );
  }

  /*
   * =========================================================
   * FORMULARIO DE REGISTRO
   * =========================================================
   */
  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-2">

      {/* =====================================================
          LOGO LUKA AI
      ====================================================== */}
      <div className="flex items-center gap-3 mb-7">
        <img
          src="/Luka.png"
          alt="Luka AI"
          className="w-11 h-11 object-contain shrink-0"
        />

        <span className="text-2xl font-black tracking-tight">
          <span className="text-[#5CE1E6]">
            Luka
          </span>

          <span className="text-foreground">
            {" "}AI
          </span>
        </span>
      </div>

      {/* =====================================================
          CABECERA
      ====================================================== */}
      <div className="mb-4 text-center sm:text-left">
        <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">
          Crea tu cuenta gratis
        </h1>

        <p className="text-muted-foreground font-medium text-xs">
          Empieza a gestionar tu negocio con Inteligencia Artificial hoy.
        </p>
      </div>

      {/* =====================================================
          ALERTA DE ERROR
      ====================================================== */}
      <AuthErrorAlert
        error={displayError}
      />

      <form
        onSubmit={handleSubmit}
        className="space-y-3"
      >

        {/* ===================================================
            FILA 1: NOMBRE Y CORREO
        ==================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Nombre completo
            </label>

            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <input
                type="text"
                name="fullName"
                placeholder="María Rodríguez"
                required
                disabled={isLoading}
                value={
                  formData.fullName
                }
                onChange={
                  handleChange
                }
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium disabled:opacity-60"
              />
            </div>
          </div>

          {/* Correo */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Correo electrónico
            </label>

            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <input
                type="email"
                name="email"
                placeholder="tu@empresa.com"
                required
                disabled={isLoading}
                value={
                  formData.email
                }
                onChange={
                  handleChange
                }
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium disabled:opacity-60"
              />
            </div>
          </div>
        </div>

        {/* ===================================================
            FILA 2: CELULAR Y WHATSAPP
        ==================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Celular */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Celular
            </label>

            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <input
                type="tel"
                name="phone"
                placeholder="+57 300 000 0000"
                required
                disabled={isLoading}
                minLength={10}
                value={
                  formData.phone
                }
                onChange={
                  handleChange
                }
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium disabled:opacity-60"
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Debes incluir el código de país{" "}
              <span className="font-semibold">
                +57
              </span>
            </p>
          </div>

          {/* WhatsApp */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              WhatsApp
            </label>

            <div className="relative">
              <MessageCircle className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <input
                type="text"
                name="whatsappUsername"
                placeholder="@usuario"
                disabled={isLoading}
                value={
                  formData.whatsappUsername
                }
                onChange={
                  handleChange
                }
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium disabled:opacity-60"
              />
            </div>

            <p className="text-[10px] text-muted-foreground">
              Escríbelo sin el @, solo el nombre de usuario. Ejemplo:{" "}
              <span className="font-semibold">
                mariarodriguez
              </span>
            </p>
          </div>
        </div>

        {/* ===================================================
            FILA 3: CONTRASEÑAS
        ==================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Contraseña
            </label>

            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                name="password"
                placeholder="Mín. 8 caracteres (A-Z, 0-9)"
                required
                disabled={isLoading}
                minLength={8}
                value={
                  formData.password
                }
                onChange={
                  handleChange
                }
                className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium disabled:opacity-60"
              />

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setShowPassword(
                    !showPassword,
                  )
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                aria-label={
                  showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {formData.password && (
              <div className="flex items-center gap-2 pt-0.5">
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{
                      width: `${strength.score}%`,
                    }}
                  />
                </div>

                <span className="text-[10px] font-bold text-muted-foreground shrink-0">
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          {/* Confirmar contraseña */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Confirmar contraseña
            </label>

            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                name="confirmPassword"
                placeholder="Repite la contraseña"
                required
                disabled={isLoading}
                value={
                  formData.confirmPassword
                }
                onChange={
                  handleChange
                }
                className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium disabled:opacity-60"
              />

              <button
                type="button"
                disabled={isLoading}
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword,
                  )
                }
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5 cursor-pointer"
                aria-label={
                  showConfirmPassword
                    ? "Ocultar confirmación"
                    : "Mostrar confirmación"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================
            TÉRMINOS
        ==================================================== */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="termsAccepted"
              disabled={isLoading}
              checked={
                formData.termsAccepted
              }
              onChange={
                handleChange
              }
              className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/20"
            />

            <span className="text-[11px] text-muted-foreground font-medium">
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
        </div>

        {/* ===================================================
            BOTÓN DE REGISTRO
        ==================================================== */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creando tu cuenta...
            </>
          ) : (
            "Crear cuenta y comenzar gratis"
          )}
        </Button>
      </form>

      {/* =====================================================
          REDIRECCIÓN AL LOGIN
      ====================================================== */}
      <div className="mt-4 text-center text-xs font-medium text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}

        <Link
          to="/login"
          onClick={() =>
            clearError()
          }
          className="font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
}