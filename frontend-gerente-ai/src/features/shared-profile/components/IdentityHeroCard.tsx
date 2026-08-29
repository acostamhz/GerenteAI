import { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  CheckCircle2, 
  Shield, 
  Mail, 
  Loader2, 
  Sparkles, 
  Calendar, 
  User, 
  Phone, 
  Edit3, 
  Save, 
  X,
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { AuthUser } from '@/features/auth';
import { IdentityHeroSkeleton } from './skeletons/ProfileSkeletons';

interface IdentityHeroCardProps {
  user: AuthUser | null;
  isLoading?: boolean;
  isSavingUser?: boolean;
  actionError?: string | null;
  actionSuccess?: string | null;
  onUpdatePersonalData?: (data: { nombre?: string; telefono?: string }) => Promise<boolean>;
  onClearFeedback?: () => void;
}

export function IdentityHeroCard({
  user,
  isLoading = false,
  isSavingUser = false,
  actionError = null,
  actionSuccess = null,
  onUpdatePersonalData,
  onClearFeedback,
}: IdentityHeroCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [telefono, setTelefono] = useState(user?.telefono || '');
  const [hasChanged, setHasChanged] = useState(false);

  const [avatar, setAvatar] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar estado cuando los datos reales del usuario carguen o cambien
  useEffect(() => {
    if (user) {
      setNombre(user.nombre || '');
      setTelefono(user.telefono || '');
      setAvatar(
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre || 'U')}&background=10b981&color=fff&size=256`
      );
      setHasChanged(false);
    }
  }, [user]);

  if (isLoading || !user) {
    return <IdentityHeroSkeleton />;
  }

  const isMaster = user.rolGlobal === 'MASTER';

  const handleInputChange = (field: 'nombre' | 'telefono', val: string) => {
    if (field === 'nombre') setNombre(val);
    if (field === 'telefono') setTelefono(val);
    if (onClearFeedback) onClearFeedback();

    const originalNombre = user?.nombre || '';
    const originalTelefono = user?.telefono || '';
    const currentNombre = field === 'nombre' ? val : nombre;
    const currentTelefono = field === 'telefono' ? val : telefono;

    setHasChanged(
      currentNombre.trim() !== originalNombre.trim() ||
      currentTelefono.trim() !== originalTelefono.trim()
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !onUpdatePersonalData) return;

    const ok = await onUpdatePersonalData({
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
    });

    if (ok) {
      setIsEditing(false);
      setHasChanged(false);
    }
  };

  const handleCancel = () => {
    setNombre(user.nombre || '');
    setTelefono(user.telefono || '');
    setHasChanged(false);
    setIsEditing(false);
    if (onClearFeedback) onClearFeedback();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setTimeout(() => {
        setAvatar(URL.createObjectURL(file));
        setIsUploading(false);
      }, 1000);
    }
  };

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
      })
    : null;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-50/95 dark:bg-card/70 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 p-6 sm:p-7 shadow-sm flex flex-col justify-between space-y-6">
      {/* Ambient Halo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Alertas de Feedback */}
      <AnimatePresence mode="wait">
        {actionSuccess && (
          <motion.div
            key="success-alert"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-xs z-10"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            key="error-alert"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2 shadow-xs z-10"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 flex flex-col items-center text-center space-y-4">
        {/* Avatar con Glow Ring */}
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
              alt={user.nombre}
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

          {/* Online active dot */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background shadow-sm flex items-center justify-center">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
          </div>
        </div>

        {/* Nombres y Badges Reales */}
        <div className="space-y-1.5 w-full">
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight line-clamp-1">
            {user.nombre}
          </h2>

          <p className="text-xs text-muted-foreground font-medium flex items-center justify-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span className="truncate max-w-[220px]">{user.email}</span>
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {/* Rol Badge */}
            <span
              className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border shadow-xs ${
                isMaster
                  ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30'
                  : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border-emerald-500/30'
              }`}
            >
              {isMaster ? 'Master Admin' : 'Dueño / Administrador'}
            </span>

            {/* Email Verified Chip */}
            {user.emailVerificado && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shadow-xs">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Verificado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 📝 Bloque de Datos Personales (Edición Inline) */}
      <div className="relative z-10 p-4 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/60 space-y-3.5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-border/40 pb-2.5">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
            <User className="w-3.5 h-3.5 text-emerald-500" />
            Datos Personales
          </span>

          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3 h-3" />
              <span>Editar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCancel}
              className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              <span>Cancelar</span>
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Nombre Completo
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => handleInputChange('nombre', e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Celular de Contacto
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => handleInputChange('telefono', e.target.value)}
                placeholder="+57 300 000 0000"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
              />
            </div>

            <div className="flex justify-end pt-1">
              <Button
                type="submit"
                size="sm"
                disabled={isSavingUser || !nombre.trim() || !hasChanged}
                className="rounded-xl px-4 py-2 text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
              >
                {isSavingUser ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-medium">Nombre:</span>
              <span className="font-bold text-foreground truncate max-w-[180px]">{user.nombre}</span>
            </div>

            <div className="flex items-center justify-between text-muted-foreground pt-1.5 border-t border-slate-100 dark:border-border/30">
              <span className="font-medium flex items-center gap-1">
                <Phone className="w-3 h-3 text-emerald-500" /> Celular:
              </span>
              <span className="font-bold text-foreground">
                {user.telefono || <span className="text-muted-foreground/60 italic font-normal">Sin registrar</span>}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Meta Specs de Cuenta Reales */}
      <div className="relative z-10 space-y-2">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/60 space-y-2.5 text-xs shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="font-semibold flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-500" /> ID de Cuenta
            </span>
            <span className="font-mono text-[11px] font-bold text-foreground bg-slate-100 dark:bg-background px-2 py-0.5 rounded-md border border-slate-200 dark:border-border">
              {user.id ? user.id.slice(0, 8) : '—'}
            </span>
          </div>

          {formattedDate && (
            <div className="flex items-center justify-between text-muted-foreground pt-2 border-t border-slate-100 dark:border-border/40">
              <span className="font-semibold flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-500" /> Miembro desde
              </span>
              <span className="text-[11px] font-medium text-foreground capitalize">
                {formattedDate}
              </span>
            </div>
          )}

          <div className="flex items-center justify-between text-muted-foreground pt-2 border-t border-slate-100 dark:border-border/40">
            <span className="font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Asistente IA
            </span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
              Luka AI Conectado
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
