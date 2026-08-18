import { useState, useRef } from 'react';
import { Camera, CheckCircle2, Shield, Mail, KeyRound, Loader2, Sparkles, Send, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { AuthUser } from '@/features/auth';

interface IdentityHeroCardProps {
  user: AuthUser | null;
  isSavingUser: boolean;
  onRequestEmailChange: (password: string, nuevoEmail: string) => Promise<boolean>;
}

export function IdentityHeroCard({
  user,
  isSavingUser,
  onRequestEmailChange,
}: IdentityHeroCardProps) {
  const [avatar, setAvatar] = useState<string>(
    user?.nombre
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=10b981&color=fff&size=256`
      : 'https://ui-avatars.com/api/?name=Usuario&background=10b981&color=fff&size=256'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMaster = user?.rolGlobal === 'MASTER';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setAvatar(URL.createObjectURL(file));
        setIsUploading(false);
      }, 1200);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !nuevoEmail) return;
    const ok = await onRequestEmailChange(currentPassword, nuevoEmail);
    if (ok) {
      setCurrentPassword('');
      setNuevoEmail('');
      setShowEmailModal(false);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
      {/* Ambient Halo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Avatar with Status Glow Ring */}
        <div className="relative group">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 blur-sm group-hover:opacity-100 transition duration-500" />
          <div
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-background shadow-xl cursor-pointer bg-background"
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onClick={() => fileInputRef.current?.click()}
          >
            <img
              src={avatar}
              alt={user?.nombre || 'Perfil'}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isHovering || isUploading ? 'brightness-50 scale-105' : ''
              }`}
            />
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center text-white transition-opacity duration-300 ${
                isHovering || isUploading ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Camera className="w-6 h-6 mb-1" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">Cambiar</span>
                </>
              )}
            </div>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {/* Active online pulse dot */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        </div>

        {/* User Identity Names & Badges */}
        <div className="space-y-2 w-full">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight line-clamp-1">
            {user?.nombre || 'Usuario Gerente AI'}
          </h2>
          <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="truncate max-w-[200px]">{user?.email || 'usuario@empresa.com'}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {/* Rol Badge */}
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-sm ${
                isMaster
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
              }`}
            >
              {isMaster ? 'Master Admin' : 'Cliente Corporativo'}
            </span>

            {/* Email Verified Chip */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              Verificado
            </span>
          </div>
        </div>
      </div>

      {/* Meta Specs / Security Summary Card */}
      <div className="relative z-10 space-y-3 pt-2">
        <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> ID de Cuenta
            </span>
            <span className="font-mono text-[11px] font-bold text-foreground bg-background px-2 py-0.5 rounded-md border border-border">
              {user?.id?.slice(0, 8) || 'USR-2026'}
            </span>
          </div>

          <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-border/40">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-500" /> Estado IA
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Luka Bot Activo
            </span>
          </div>
        </div>

        {/* Security Trigger Button */}
        <Button
          variant="outline"
          onClick={() => setShowEmailModal(!showEmailModal)}
          className="w-full rounded-2xl py-3 text-xs font-bold border-border/80 hover:bg-muted/60 transition-all shadow-sm cursor-pointer flex items-center justify-center gap-2"
        >
          <Lock className="w-3.5 h-3.5 text-primary" />
          {showEmailModal ? 'Ocultar Opciones de Seguridad' : 'Seguridad & Cambio de Correo'}
        </Button>

        {/* Expandable Email/Security Form */}
        <AnimatePresence>
          {showEmailModal && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="pt-2"
            >
              <form
                onSubmit={handleEmailSubmit}
                className="p-4 rounded-2xl bg-background/90 border border-primary/20 shadow-lg space-y-3 text-left"
              >
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-primary" />
                  Cambiar Correo de Acceso
                </h4>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Nuevo Correo
                  </label>
                  <input
                    type="email"
                    required
                    value={nuevoEmail}
                    onChange={(e) => setNuevoEmail(e.target.value)}
                    placeholder="nuevo@empresa.com"
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
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
                    className="w-full px-3 py-2 bg-muted/30 border border-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSavingUser || !nuevoEmail || !currentPassword}
                  className="w-full py-2.5 rounded-xl text-xs font-bold shadow-sm cursor-pointer mt-1"
                >
                  {isSavingUser ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      Solicitar Confirmación
                    </>
                  )}
                </Button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
