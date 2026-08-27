import { useState } from 'react';
import { User, Mail, Phone, Shield, Save, Loader2, KeyRound, AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { AuthUser } from '@/features/auth';

interface PersonalInfoTabProps {
  user: AuthUser | null;
  isSavingUser: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  onUpdatePhone: (telefono: string) => Promise<boolean>;
  onRequestEmailChange: (password: string, nuevoEmail: string) => Promise<boolean>;
  onClearFeedback: () => void;
}

export function PersonalInfoTab({
  user,
  isSavingUser,
  actionError,
  actionSuccess,
  onUpdatePhone,
  onRequestEmailChange,
  onClearFeedback,
}: PersonalInfoTabProps) {
  const [telefono, setTelefono] = useState<string>(user?.telefono || '');
  const [hasPhoneChanged, setHasPhoneChanged] = useState<boolean>(false);

  // Modal / Formulario de cambio de correo
  const [showEmailChange, setShowEmailChange] = useState<boolean>(false);
  const [currentPassword, setCurrentPassword] = useState<string>('');
  const [nuevoEmail, setNuevoEmail] = useState<string>('');

  const handlePhoneSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono) return;
    const ok = await onUpdatePhone(telefono);
    if (ok) setHasPhoneChanged(false);
  };

  const handleEmailChangeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !nuevoEmail) return;
    const ok = await onRequestEmailChange(currentPassword, nuevoEmail);
    if (ok) {
      setCurrentPassword('');
      setNuevoEmail('');
      setShowEmailChange(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Feedback (Éxito o Error) */}
      <AnimatePresence mode="wait">
        {actionSuccess && (
          <motion.div
            key="success-feedback"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            key="error-feedback"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tarjeta de Datos Personales */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
        <div className="border-b border-border/60 pb-4">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <User className="w-5 h-5 text-emerald-500" />
            Información de la Cuenta
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Datos principales asociados a tu perfil de acceso en Luka AI.
          </p>
        </div>

        <form onSubmit={handlePhoneSave} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Nombre Completo */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  disabled
                  value={user?.nombre || ''}
                  className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/60 rounded-xl text-sm font-medium text-foreground cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            {/* Teléfono / Celular (Editable) */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                Celular / Teléfono de Contacto
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    setHasPhoneChanged(true);
                    onClearFeedback();
                  }}
                  placeholder="+57 300 000 0000"
                  className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium shadow-sm transition-all"
                />
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-2 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Correo Electrónico
                </label>
                <button
                  type="button"
                  onClick={() => setShowEmailChange(!showEmailChange)}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors cursor-pointer"
                >
                  {showEmailChange ? 'Cancelar cambio' : '¿Cambiar correo?'}
                </button>
              </div>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full pl-11 pr-4 py-3 bg-muted/40 border border-border/60 rounded-xl text-sm font-medium text-foreground cursor-not-allowed opacity-80"
                />
              </div>
            </div>
          </div>

          {/* Botón Guardar Teléfono */}
          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              disabled={isSavingUser || !hasPhoneChanged}
              className="px-6 py-4 rounded-xl font-bold text-sm shadow-md transition-all cursor-pointer"
            >
              {isSavingUser ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando cambios...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Teléfono
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Sección Expandible: Solicitud de Cambio de Correo */}
        <AnimatePresence>
          {showEmailChange && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-6 pt-6 border-t border-border/60 space-y-4"
            >
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-primary" />
                    Solicitar Cambio de Correo Electrónico
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Por seguridad, debes ingresar tu contraseña actual. Te enviaremos un correo de confirmación a la nueva dirección.
                  </p>
                </div>

                <form onSubmit={handleEmailChangeSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground">Nuevo Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        value={nuevoEmail}
                        onChange={(e) => setNuevoEmail(e.target.value)}
                        placeholder="nuevo@empresa.com"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-foreground">Contraseña Actual</label>
                      <input
                        type="password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={isSavingUser || !nuevoEmail || !currentPassword}
                      className="py-3 px-5 text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                    >
                      {isSavingUser ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Enviando confirmación...
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 mr-2" />
                          Enviar Confirmación
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
