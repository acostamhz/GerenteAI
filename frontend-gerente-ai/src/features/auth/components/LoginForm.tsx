import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/app/components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { authApi } from "../api/authApi";
import { AuthErrorAlert } from "./AuthErrorAlert";

export function LoginForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Reenviar verificación desde el login si no está verificado
  const [isResending, setIsResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<string | null>(null);

  // Limpiar errores residuales al montar o desmontar la vista
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
      const loggedUser = await login({ email: cleanEmail, password });
      
      // Redirección inteligente según rol del backend
      const from = (location.state as { from?: { pathname?: string } })?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
      } else if (loggedUser.rolGlobal === 'MASTER') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      console.error("❌ [LoginForm] Error en handleSubmit:", err);
    }
  };

  const handleQuickResend = async () => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setLocalError("Por favor ingresa tu correo electrónico para reenviarte el enlace de activación.");
      return;
    }

    setIsResending(true);
    try {
      const res = await authApi.reenviarVerificacion(cleanEmail);
      setResendMsg(res.mensaje || "Correo de verificación reenviado con éxito. Revisa tu bandeja de entrada.");
      setLocalError(null);
      clearError();
    } catch (err: any) {
      setLocalError(err?.message || "No se pudo reenviar el correo. Verifica que el email sea el correcto.");
    } finally {
      setIsResending(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full max-w-md mx-auto px-8 sm:px-0">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground font-medium text-sm">Ingresa tus credenciales para acceder a tu cuenta.</p>
      </div>

      {/* Alerta de Éxito en Reenvío con Animación Suave */}
      <AnimatePresence mode="wait">
        {resendMsg && (
          <motion.div
            key="resend-success"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span className="leading-relaxed">{resendMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta de Error con Transición Suave y Botón de Reenvío */}
      <AuthErrorAlert
        error={displayError}
        onResendVerification={handleQuickResend}
        isResending={isResending}
      />

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Correo electrónico</label>
            <input 
              type="email" 
              placeholder="tu@empresa.com" 
              required
              disabled={isLoading}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (displayError) {
                  setLocalError(null);
                  clearError();
                }
              }}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium disabled:opacity-60"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">Contraseña</label>
              <Link 
                to="/forgot-password" 
                onClick={() => clearError()}
                className="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required
                disabled={isLoading}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (displayError) {
                    setLocalError(null);
                    clearError();
                  }
                }}
                className="w-full px-4 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium disabled:opacity-60"
              />
              <button 
                type="button" 
                disabled={isLoading}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-5 text-base font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Verificando credenciales...
            </>
          ) : (
            "Ingresar a la plataforma"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Link 
          to="/register" 
          onClick={() => clearError()}
          className="font-bold text-primary hover:text-primary/80 transition-colors"
        >
          Regístrate gratis
        </Link>
      </div>
    </div>
  );
}
