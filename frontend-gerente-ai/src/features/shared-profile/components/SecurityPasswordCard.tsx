import { useState, useEffect } from 'react';
import { 
  Lock, 
  KeyRound, 
  Mail, 
  Send, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  LogOut,
  ChevronDown,
  ChevronUp,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { useAuth } from '@/features/auth';
import { useNavigate } from 'react-router';
import { SecurityPasswordSkeleton } from './skeletons/ProfileSkeletons';

interface SecurityPasswordCardProps {
  userEmail?: string;
  isLoading?: boolean;
  isSavingUser: boolean;
  onRequestEmailChange: (password: string, nuevoEmail: string) => Promise<boolean>;
  onRequestPasswordReset: () => Promise<boolean>;
}

export function SecurityPasswordCard({
  userEmail,
  isLoading = false,
  isSavingUser,
  onRequestEmailChange,
  onRequestPasswordReset,
}: SecurityPasswordCardProps) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  
  const [cooldown, setCooldown] = useState<number>(0);
  const [isResetting, setIsResetting] = useState(false);

  // Estados de feedback localizados dentro del card
  const [resetFeedback, setResetFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [emailFeedback, setEmailFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  if (isLoading) {
    return <SecurityPasswordSkeleton />;
  }

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !nuevoEmail) return;
    setEmailFeedback(null);
    try {
      const ok = await onRequestEmailChange(currentPassword, nuevoEmail);
      if (ok) {
        setCurrentPassword('');
        setNuevoEmail('');
        setShowEmailForm(false);
        setEmailFeedback({
          type: 'success',
          message: 'Hemos enviado un correo de confirmación a tu nueva dirección.',
        });
      } else {
        setEmailFeedback({
          type: 'error',
          message: 'No se pudo cambiar el correo. Verifica tu contraseña actual.',
        });
      }
    } catch (err: any) {
      setEmailFeedback({
        type: 'error',
        message: err?.message || 'Error al solicitar el cambio de correo.',
      });
    }
  };

  const handlePasswordReset = async () => {
    if (cooldown > 0 || isResetting) return;
    setResetFeedback(null);
    setIsResetting(true);
    try {
      const ok = await onRequestPasswordReset();
      if (ok) {
        setCooldown(60);
        setResetFeedback({
          type: 'success',
          message: 'Se envió un enlace para restablecer tu contraseña. Revisa tu correo.',
        });
      } else {
        setResetFeedback({
          type: 'error',
          message: 'No se pudo enviar el enlace de restablecimiento. Inténtalo de nuevo.',
        });
      }
    } catch (err: any) {
      setResetFeedback({
        type: 'error',
        message: err?.message || 'Error al solicitar el restablecimiento.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="overflow-hidden rounded-3xl bg-slate-50/95 dark:bg-card/70 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 p-5 sm:p-6 shadow-sm space-y-5">
      {/* Header Seguridad */}
      <div className="border-b border-slate-200/80 dark:border-border/60 pb-3.5">
        <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-500 shrink-0" />
          Seguridad & Acceso
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          Gestiona las credenciales de acceso, correo electrónico y contraseña.
        </p>
      </div>

      <div className="space-y-3.5">
        {/* Fila Contraseña */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/70 shadow-xs space-y-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-2xs">
              <KeyRound className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                Contraseña de Seguridad
              </h4>
              <p className="text-[11px] text-muted-foreground truncate">
                Autenticación protegida y cifrada
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={cooldown > 0 || isResetting || isSavingUser}
            onClick={handlePasswordReset}
            className="w-full rounded-xl py-2 text-xs font-bold border-slate-300 dark:border-border hover:bg-slate-100 dark:hover:bg-muted/60 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
          >
            {isResetting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : cooldown > 0 ? (
              <>
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span>Reintentar en {cooldown}s</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Restablecer Contraseña</span>
              </>
            )}
          </Button>

          {/* 🔔 AVISO LOCALIZADO DE RESTABLECIMIENTO DE CONTRASEÑA */}
          <AnimatePresence>
            {resetFeedback && (
              <motion.div
                initial={{ opacity: 0, y: -4, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 shadow-2xs border ${
                  resetFeedback.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                    : 'bg-destructive/10 border-destructive/20 text-destructive'
                }`}
              >
                {resetFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                )}
                <span className="leading-snug">{resetFeedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fila Correo Electrónico con Formulario Desplegable */}
        {userEmail && (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/70 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 flex items-center justify-center shrink-0 shadow-2xs">
                <Mail className="w-4 h-4 text-teal-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">
                    Correo de Cuenta
                  </h4>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" /> Verificado
                  </span>
                </div>
                <p className="text-[11px] font-mono text-muted-foreground truncate" title={userEmail}>
                  {userEmail}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowEmailForm(!showEmailForm);
                setEmailFeedback(null);
              }}
              className="w-full rounded-xl py-2 text-xs font-bold border-slate-300 dark:border-border hover:bg-slate-100 dark:hover:bg-muted/60 transition-all cursor-pointer shadow-xs inline-flex items-center justify-center gap-1.5"
            >
              {showEmailForm ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" />
                  <span>Cancelar Cambio</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" />
                  <span>Cambiar Correo</span>
                </>
              )}
            </Button>

            {/* 🔔 AVISO LOCALIZADO DE CAMBIO DE CORREO */}
            <AnimatePresence>
              {emailFeedback && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  className={`p-3 rounded-xl text-xs font-bold flex items-start gap-2 shadow-2xs border ${
                    emailFeedback.type === 'success'
                      ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-800 dark:text-emerald-300'
                      : 'bg-destructive/10 border-destructive/20 text-destructive'
                  }`}
                >
                  {emailFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="leading-snug">{emailFeedback.message}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formulario Inline para Cambio de Correo */}
            <AnimatePresence>
              {showEmailForm && (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  onSubmit={handleEmailSubmit}
                  className="pt-3 border-t border-slate-200/80 dark:border-border/60 space-y-3"
                >
                  <div className="space-y-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Nuevo Correo Electrónico
                      </label>
                      <input
                        type="email"
                        required
                        value={nuevoEmail}
                        onChange={(e) => setNuevoEmail(e.target.value)}
                        placeholder="nuevo@empresa.com"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-muted/30 border border-slate-300 dark:border-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Contraseña Actual
                      </label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-muted/30 border border-slate-300 dark:border-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSavingUser || !nuevoEmail || !currentPassword}
                    className="w-full rounded-xl py-2 text-xs font-bold shadow-sm cursor-pointer inline-flex items-center justify-center gap-1.5"
                  >
                    {isSavingUser ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5 mr-1" />
                        <span>Confirmar Cambio</span>
                      </>
                    )}
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Fila Sesión / Desconexión */}
        <div className="p-3 sm:p-3.5 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/70 flex items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium min-w-0">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate text-[11px]">Sesión activa en este equipo</span>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-bold text-destructive hover:text-destructive/80 transition-colors inline-flex items-center gap-1 cursor-pointer px-2 py-1 rounded-lg hover:bg-destructive/10 shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  );
}
