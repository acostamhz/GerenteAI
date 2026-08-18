import { useState } from 'react';
import { Phone, User, Save, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { AuthUser } from '@/features/auth';

interface QuickContactCardProps {
  user: AuthUser | null;
  isSavingUser: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  onUpdatePhone: (telefono: string) => Promise<boolean>;
  onClearFeedback: () => void;
}

export function QuickContactCard({
  user,
  isSavingUser,
  actionError,
  actionSuccess,
  onUpdatePhone,
  onClearFeedback,
}: QuickContactCardProps) {
  const [telefono, setTelefono] = useState<string>(user?.telefono || '');
  const [hasChanged, setHasChanged] = useState<boolean>(false);

  const handlePhoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono) return;
    const ok = await onUpdatePhone(telefono);
    if (ok) setHasChanged(false);
  };

  return (
    <div className="rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 p-6 sm:p-7 shadow-sm space-y-4">
      {/* Feedback Alerts */}
      <AnimatePresence mode="wait">
        {actionSuccess && (
          <motion.div
            key="success-alert"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            key="error-alert"
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2.5 shadow-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between border-b border-border/60 pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Información de Contacto Directo
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Canales de comunicación oficiales vinculados a tu cuenta.
          </p>
        </div>
      </div>

      <form onSubmit={handlePhoneSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Nombre Completo */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
            Nombre Completo
          </label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              disabled
              value={user?.nombre || ''}
              className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/60 rounded-xl text-xs sm:text-sm font-medium text-foreground cursor-not-allowed opacity-80"
            />
          </div>
        </div>

        {/* Teléfono / Celular con Guardado Inline */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider">
              Celular de Contacto
            </label>
            {hasChanged && (
              <span className="text-[10px] font-black text-amber-500 animate-pulse">
                • Cambios sin guardar
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value);
                  setHasChanged(true);
                  onClearFeedback();
                }}
                placeholder="+57 300 000 0000"
                className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all"
              />
            </div>

            <AnimatePresence>
              {hasChanged && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Button
                    type="submit"
                    disabled={isSavingUser || !telefono}
                    className="rounded-xl px-4 py-2.5 text-xs font-bold shadow-md cursor-pointer shrink-0"
                  >
                    {isSavingUser ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Guardar
                      </>
                    )}
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </form>
    </div>
  );
}
