import { useState, useRef } from 'react';
import { Camera, CheckCircle2, Shield, Mail, Phone, Calendar, Loader2 } from 'lucide-react';
import { AuthUser } from '@/features/auth';

interface ProfileHeroHeaderProps {
  user: AuthUser | null;
}

export function ProfileHeroHeader({ user }: ProfileHeroHeaderProps) {
  const [avatar, setAvatar] = useState<string>(
    user?.nombre
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(user.nombre)}&background=10b981&color=fff&size=256`
      : 'https://ui-avatars.com/api/?name=Usuario&background=10b981&color=fff&size=256'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const isMaster = user?.rolGlobal === 'MASTER';

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-card via-card to-emerald-500/5 border border-border/80 p-6 sm:p-8 shadow-sm">
      {/* Background ambient glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6">
        {/* Avatar Container */}
        <div className="relative group">
          <div
            className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden border-4 border-background shadow-xl cursor-pointer"
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
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Camera className="w-7 h-7 mb-1" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Cambiar</span>
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
        </div>

        {/* User Info Details */}
        <div className="flex-1 text-center md:text-left space-y-3">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {user?.nombre || 'Usuario Gerente AI'}
            </h1>

            {/* Badge de Rol */}
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                isMaster
                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              {isMaster ? 'Master Admin' : 'Cliente Corporativo'}
            </span>

            {/* Badge de Verificación */}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Correo Verificado
            </span>
          </div>

          {/* Subtítulos con iconos */}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs sm:text-sm text-muted-foreground font-medium pt-1">
            {user?.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-primary" />
                {user.email}
              </span>
            )}
            {user?.telefono && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500" />
                {user.telefono}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-teal-500" />
              ID: {user?.id?.slice(0, 8) || '---'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
