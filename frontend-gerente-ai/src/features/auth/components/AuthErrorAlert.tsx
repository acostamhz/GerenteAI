import { AlertCircle, Loader2, Send } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AuthErrorAlertProps {
  error: string | null;
  onResendVerification?: () => void;
  isResending?: boolean;
  className?: string;
}

export function AuthErrorAlert({
  error,
  onResendVerification,
  isResending = false,
  className = "",
}: AuthErrorAlertProps) {
  const isVerificationError =
    error?.toLowerCase().includes("verificar") ||
    error?.toLowerCase().includes("activar") ||
    error?.toLowerCase().includes("bandeja");

  return (
    <AnimatePresence mode="wait">
      {error && (
        <motion.div
          key="auth-error-alert"
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.98 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className={`mb-5 p-3.5 sm:p-4 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-xs sm:text-sm font-medium space-y-2.5 shadow-sm ${className}`}
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>

          {/* Botón contextual de Reenvío Rápido si el error es de verificación */}
          {isVerificationError && onResendVerification && (
            <div className="pt-2 border-t border-destructive/20 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onResendVerification}
                disabled={isResending}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 underline underline-offset-2 inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Reenviando enlace...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>¿No te llegó el correo? Reenviar enlace de activación</span>
                  </>
                )}
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
