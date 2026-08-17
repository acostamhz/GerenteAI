import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Loader2, Lock, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { authApi } from '../api/authApi';
import { ApiError } from '@/lib/apiClient';

export function ResetPasswordCard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-border' };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[a-z]/.test(pass) && /[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: 'Débil', color: 'bg-red-500' };
      case 2:
        return { score: 50, label: 'Aceptable', color: 'bg-amber-500' };
      case 3:
        return { score: 75, label: 'Buena', color: 'bg-blue-500' };
      case 4:
        return { score: 100, label: 'Excelente', color: 'bg-emerald-500' };
      default:
        return { score: 15, label: 'Muy débil', color: 'bg-red-500' };
    }
  };

  const strength = calculatePasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      setErrorMessage('No se encontró ningún token de seguridad en el enlace.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/.test(password)) {
      setErrorMessage(
        'La contraseña debe incluir al menos una mayúscula, una minúscula, un número y un carácter especial.'
      );
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await authApi.resetPassword({
        token,
        newPassword: password,
      });
      setSuccess(true);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'El enlace de recuperación es inválido o ha expirado (válido por 1 hora).';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // -------------------------------------------------------------
  // ESTADO 1: SIN TOKEN EN LA URL
  // -------------------------------------------------------------
  if (!token) {
    return (
      <div className="w-full max-w-md mx-auto px-8 sm:px-0 py-10 text-center space-y-6 animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-3xl border border-destructive/20 flex items-center justify-center mx-auto shadow-sm">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-foreground">Enlace inválido o incompleto</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">
            No encontramos el código de verificación en el enlace. Por favor solicita un nuevo enlace de recuperación.
          </p>
        </div>
        <Button
          onClick={() => navigate('/forgot-password')}
          className="w-full py-5 text-base font-bold rounded-xl shadow-md hover:-translate-y-0.5 transition-all"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Solicitar nuevo enlace
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ESTADO 2: ÉXITO
  // -------------------------------------------------------------
  if (success) {
    return (
      <div className="w-full max-w-md mx-auto px-8 sm:px-0 py-10 text-center space-y-6 animate-in fade-in zoom-in-95 duration-500">
        <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="w-8 h-8 animate-bounce" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-black text-foreground tracking-tight">¡Contraseña actualizada!</h2>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed">
            Tu nueva contraseña ha sido guardada correctamente en el sistema. Ya puedes iniciar sesión con tus nuevas credenciales.
          </p>
        </div>
        <Button
          onClick={() => navigate('/login')}
          className="w-full py-5 text-base font-bold rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/20 hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          Iniciar sesión ahora
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>
      </div>
    );
  }

  // -------------------------------------------------------------
  // ESTADO 3: FORMULARIO PRINCIPAL
  // -------------------------------------------------------------
  return (
    <div className="w-full max-w-md mx-auto px-8 sm:px-0 py-6">
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
          Crea tu nueva contraseña
        </h1>
        <p className="text-muted-foreground font-medium text-sm">
          Ingresa y confirma tu nueva contraseña para recuperar el acceso a tu cuenta.
        </p>
      </div>

      {/* Alerta de Error con Animación Suave */}
      <AnimatePresence mode="wait">
        {errorMessage && (
          <motion.div
            key="reset-error-box"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium space-y-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>

            {/* Opción de reintentar si el token expiró */}
            <div className="pt-2 border-t border-destructive/20">
              <Link
                to="/forgot-password"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                ¿Solicitar un nuevo enlace de recuperación?
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Nueva Contraseña */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Nueva contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9, !@#)"
              required
              minLength={8}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full pl-11 pr-11 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {password && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Fortaleza:</span>
                <span className="font-bold">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${strength.color}`}
                  style={{ width: `${strength.score}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Confirmar Contraseña */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">
            Confirmar nueva contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repite tu nueva contraseña"
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              className="w-full pl-11 pr-11 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-5 text-base font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all mt-2 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Actualizando contraseña...
            </>
          ) : (
            'Guardar nueva contraseña'
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
        ¿Deseas cancelar?{' '}
        <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
          Volver al login
        </Link>
      </div>
    </div>
  );
}
