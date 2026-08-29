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
  AlertCircle,
  MailCheck,
  Send,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { authApi } from "../api/authApi";
import { useAuth } from "../hooks/useAuth";

export function RegisterForm() {
  const navigate = useNavigate();
  const { register, isLoading, error: authError, clearError } = useAuth();

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

  // Estados para reenvío
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  useEffect(() => {
    clearError();
    setLocalError(null);
  }, []);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-border" };

    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Débil", color: "bg-red-500" };
      case 2:
        return { score: 50, label: "Aceptable", color: "bg-amber-500" };
      case 3:
        return { score: 75, label: "Buena", color: "bg-blue-500" };
      case 4:
        return { score: 100, label: "Excelente", color: "bg-emerald-500" };
      default:
        return { score: 15, label: "Muy débil", color: "bg-red-500" };
    }
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

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

    const cleanPhone = formData.phone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      setLocalError("El número de celular debe tener al menos 10 dígitos.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Las contraseñas no coinciden.");
      return;
    }

    if (formData.password.length < 8) {
      setLocalError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(formData.password)) {
      setLocalError("La contraseña debe incluir mayúscula, minúscula, número y carácter especial.");
      return;
    }

    if (!formData.termsAccepted) {
      setLocalError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    try {
      const whatsappUsername = formData.whatsappUsername.trim().replace(/^@+/, "");

      await register({
        nombre: formData.fullName,
        email: formData.email,
        password: formData.password,
        telefono: formData.phone,
        whatsappUsername,
      });

      setIsSuccess(true);
    } catch (err: any) {
      const errorMsg =
        err?.message ||
        (err instanceof Error ? err.message : "Error al registrar la cuenta.");
      setLocalError(errorMsg);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) return;
    setIsResending(true);
    setResendMessage(null);
    try {
      const res = await authApi.reenviarVerificacion(formData.email);
      setResendMessage(res.mensaje || "Correo de verificación reenviado con éxito.");
    } catch (err: any) {
      setResendMessage(err?.message || "No se pudo reenviar el correo.");
    } finally {
      setIsResending(false);
    }
  };

  const displayError = localError || authError;

  // Pantalla de Confirmación de Envío de Correo
  if (isSuccess) {
    return (
      <div className="w-full max-w-md mx-auto px-6 py-6 text-center space-y-5 animate-in fade-in duration-500">
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
            {formData.email}
          </div>
          <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
            Haz clic en el enlace del correo para activar tu cuenta antes de iniciar sesión.
          </p>
        </div>

        {resendMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs font-medium text-emerald-600 dark:text-emerald-400">
            {resendMessage}
          </div>
        )}

        <div className="space-y-2.5 pt-2">
          <Button
            onClick={() => navigate("/login", { replace: true })}
            className="w-full py-2.5 text-xs font-bold rounded-xl"
          >
            Ir a Iniciar Sesión
          </Button>

          <button
            type="button"
            disabled={isResending}
            onClick={handleResendVerification}
            className="w-full py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isResending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
            ¿No recibiste el correo? Reenviar enlace
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-xl mx-auto px-4 sm:px-6 py-2">
      <div className="mb-4 text-center sm:text-left">
        <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">
          Crea tu cuenta gratis
        </h1>
        <p className="text-muted-foreground font-medium text-xs">
          Empieza a gestionar tu negocio con Inteligencia Artificial hoy.
        </p>
      </div>

      {displayError && (
        <div
          role="alert"
          className="mb-4 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center justify-between gap-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{displayError}</span>
          </div>
          {displayError.toLowerCase().includes("iniciar sesión") && (
            <Link
              to="/login"
              className="text-xs font-bold underline hover:opacity-80 shrink-0 cursor-pointer text-destructive"
            >
              Iniciar Sesión →
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Fila 1: Nombre completo y Correo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                value={formData.fullName}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium"
              />
            </div>
          </div>

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
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Fila 2: Celular y WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                minLength={10}
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              WhatsApp
            </label>
            <div className="relative">
              <MessageCircle className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="whatsappUsername"
                placeholder="@tu_usuario o número"
                value={formData.whatsappUsername}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Fila 3: Contraseña y Confirmación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Mín. 8 caracteres (A-Z, 0-9)"
                required
                minLength={8}
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>

            {formData.password && (
              <div className="flex items-center gap-2 pt-0.5">
                <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${strength.color}`}
                    style={{ width: `${strength.score}%` }}
                  />
                </div>
                <span className="text-[10px] font-bold text-muted-foreground shrink-0">{strength.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Confirmar contraseña
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Repite la contraseña"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full pl-9 pr-8 py-2 bg-card border border-border rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-xs shadow-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-[11px] text-muted-foreground font-medium">
              Acepto los{" "}
              <a href="#terminos" onClick={(e) => e.preventDefault()} className="font-bold text-primary hover:underline">
                Términos
              </a>{" "}
              y la{" "}
              <a href="#privacidad" onClick={(e) => e.preventDefault()} className="font-bold text-primary hover:underline">
                Privacidad
              </a>{" "}
              de Luka AI.
            </span>
          </label>
        </div>

        {/* Botón de Registro */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 text-xs font-bold rounded-xl shadow-sm hover:shadow transition-all mt-2"
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

      {/* Redirección al Login */}
      <div className="mt-4 text-center text-xs font-medium text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Link
          to="/login"
          onClick={() => clearError()}
          className="font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
}