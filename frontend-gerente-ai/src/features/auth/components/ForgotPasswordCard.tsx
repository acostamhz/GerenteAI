import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, Loader2, CheckCircle2, ArrowLeft, Send, KeyRound } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { authApi } from '../api/authApi';
import { ApiError } from '@/lib/apiClient';
import { AuthErrorAlert } from './AuthErrorAlert';

export function ForgotPasswordCard() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setErrorMessage('Por favor ingresa tu correo electrónico.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await authApi.forgotPassword({ email: cleanEmail });
      setSuccessMessage(
        res.mensaje || 'Se envió un enlace para restablecer tu contraseña. Revisa tu correo.'
      );
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : 'No se pudo procesar la solicitud. Verifica el correo e intenta de nuevo.';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 sm:px-0 py-6">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary mb-4 shadow-sm">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
          ¿Olvidaste tu contraseña?
        </h1>
        <p className="text-muted-foreground font-medium text-sm leading-relaxed">
          No te preocupes. Ingresa tu correo electrónico y te enviaremos un enlace de recuperación válido por 1 hora.
        </p>
      </div>

      {/* Alerta de Éxito */}
      <AnimatePresence mode="wait">
        {successMessage && (
          <motion.div
            key="success-box"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="mb-6 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold space-y-3 shadow-sm"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-foreground">¡Enlace enviado con éxito!</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium leading-relaxed">
                  Hemos enviado las instrucciones a <span className="font-bold text-foreground">{email.trim().toLowerCase()}</span>. Revisa tu bandeja de entrada o spam.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-emerald-500/20">
              <Link
                to="/login"
                className="text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:underline inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alerta de Error con Transición Suave */}
      <AuthErrorAlert error={errorMessage} />

      {/* Formulario */}
      {!successMessage && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">
              Correo electrónico registrado
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="tu@empresa.com"
                required
                disabled={isLoading}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errorMessage) setErrorMessage(null);
                }}
                className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium disabled:opacity-60"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full py-5 text-base font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all mt-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Enviando enlace...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar enlace de recuperación
              </>
            )}
          </Button>
        </form>
      )}

      <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
        <Link
          to="/login"
          className="font-bold text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a iniciar sesión
        </Link>
      </div>
    </div>
  );
}
