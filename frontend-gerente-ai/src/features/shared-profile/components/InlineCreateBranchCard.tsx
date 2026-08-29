import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  AtSign, 
  X, 
  Loader2, 
  PlusCircle, 
  AlertCircle, 
  MessageSquare,
  Edit3,
  Save
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { getRandomUsernamePlaceholder } from '@/lib/activeBusiness';
import { CreateSedeDto, Negocio, Sede, UpdateSedeDto } from '../types';

interface InlineCreateBranchCardProps {
  negocio: Negocio;
  isOpen: boolean;
  sedeToEdit?: Sede | null;
  onClose: () => void;
  onSubmit: (negocioId: string, dto: Omit<CreateSedeDto, 'negocioId'>) => Promise<any>;
  onUpdate?: (sedeId: string, negocioId: string, dto: UpdateSedeDto) => Promise<any>;
}

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

export function InlineCreateBranchCard({
  negocio,
  isOpen,
  sedeToEdit,
  onClose,
  onSubmit,
  onUpdate,
}: InlineCreateBranchCardProps) {
  const isEditing = !!sedeToEdit;

  const [nombre, setNombre] = useState(sedeToEdit?.nombre || '');
  const [direccion, setDireccion] = useState(sedeToEdit?.direccion || '');
  const [whatsappPhone, setWhatsappPhone] = useState(sedeToEdit?.telefono || '');
  const [whatsappUsername, setWhatsappUsername] = useState(sedeToEdit?.whatsappUsername || '');
  const [usernamePlaceholder, setUsernamePlaceholder] = useState('cafecentral');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (sedeToEdit) {
        setNombre(sedeToEdit.nombre || '');
        setDireccion(sedeToEdit.direccion || '');
        setWhatsappPhone(sedeToEdit.telefono || '');
        setWhatsappUsername(sedeToEdit.whatsappUsername || '');
      } else {
        setNombre('');
        setDireccion('');
        setWhatsappPhone('');
        setWhatsappUsername('');
        setUsernamePlaceholder(getRandomUsernamePlaceholder());
      }
      setError(null);
    }
  }, [isOpen, sedeToEdit]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombre.trim();
    const cleanPhone = whatsappPhone.trim();
    const cleanUsername = whatsappUsername.trim().replace(/^@/, '');

    if (!cleanNombre) {
      setError('Por favor ingresa el nombre de la sede.');
      return;
    }

    if (!cleanPhone && !cleanUsername) {
      setError('Debes ingresar al menos un identificador de WhatsApp (número o usuario) para vincular a Luka.');
      return;
    }

    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setError('El número de WhatsApp no es válido. Debe incluir código de país (ej: +573043904488).');
      return;
    }

    if (cleanUsername && !USERNAME_REGEX.test(cleanUsername)) {
      setError('El nombre de usuario de WhatsApp no es válido (mínimo 3 caracteres, sin espacios ni @).');
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing && sedeToEdit && onUpdate) {
        await onUpdate(sedeToEdit.id, negocio.id, {
          nombre: cleanNombre,
          direccion: direccion.trim() || undefined,
          telefono: cleanPhone || undefined,
          whatsappUsername: cleanUsername || undefined,
        });
      } else {
        await onSubmit(negocio.id, {
          nombre: cleanNombre,
          direccion: direccion.trim() || undefined,
          telefono: cleanPhone || undefined,
          whatsappUsername: cleanUsername || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || `Error al ${isEditing ? 'actualizar' : 'registrar'} la sede.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, scale: 0.98 }}
      animate={{ opacity: 1, height: 'auto', scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.98 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden my-3"
    >
      <div className="rounded-2xl bg-slate-100/95 dark:bg-muted/30 border-2 border-emerald-500/30 p-4 sm:p-5 space-y-4 shadow-sm relative">
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-border/50 pb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              {isEditing ? <Edit3 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-foreground flex items-center gap-1.5">
                {isEditing ? 'Editar Sede' : 'Nueva Sede'} para{' '}
                <span className="text-emerald-700 dark:text-emerald-400 truncate max-w-[180px]">
                  {negocio.nombre}
                </span>
              </h4>
              <p className="text-[11px] text-muted-foreground">
                {isEditing
                  ? 'Modifica los datos y la línea de WhatsApp de esta sucursal.'
                  : 'Configura una nueva sucursal y su línea de WhatsApp para reportar ventas.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-muted/50 transition-colors cursor-pointer"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Nombre de la Sede *
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="Ej: Sede Norte - Calle 140"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground block">
                Dirección Física <span className="text-muted-foreground font-normal">(Opcional)</span>
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Ej: Carrera 15 # 140-10"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200/80 dark:border-border/60 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-foreground">
              <span className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                Línea de WhatsApp de la Sede
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">Requerido</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground block">
                  Número de WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                  <input
                    type="tel"
                    placeholder="Ej. +573043904488"
                    value={whatsappPhone}
                    onChange={(e) => setWhatsappPhone(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-foreground block">
                  Usuario WhatsApp <span className="text-muted-foreground font-normal">(Alias)</span>
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder={`Ej. ${usernamePlaceholder}`}
                    value={whatsappUsername}
                    onChange={(e) => setWhatsappUsername(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-white dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl px-4 py-2 text-xs font-bold cursor-pointer border-slate-300 dark:border-border hover:bg-slate-200/60 dark:hover:bg-muted/50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isLoading}
              className="rounded-xl px-5 py-2 text-xs font-black shadow-md cursor-pointer bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? (
                <>
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                  Guardar Cambios
                </>
              ) : (
                <>
                  <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
                  Crear Sede
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
