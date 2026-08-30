import { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  AtSign, 
  X, 
  Loader2, 
  PlusCircle, 
  AlertCircle, 
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { getRandomUsernamePlaceholder } from '@/lib/activeBusiness';
import { CreateNegocioConSedeDto } from '../types';

interface InlineCreateBusinessCardProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNegocioConSedeDto) => Promise<any>;
}

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;

export function InlineCreateBusinessCard({ isOpen, onClose, onSubmit }: InlineCreateBusinessCardProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefonoContacto: '',
    telefonoSecundario: '',
    contexto: '',
    nombreSede: 'Sede principal',
    direccionSede: '',
    whatsappPhone: '',
    whatsappUsername: '',
  });

  const [usernamePlaceholder, setUsernamePlaceholder] = useState('cafecentral');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsernamePlaceholder(getRandomUsernamePlaceholder());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = formData.nombre.trim();
    const cleanNombreSede = formData.nombreSede.trim();
    const cleanPhone = formData.whatsappPhone.trim();
    const cleanUsername = formData.whatsappUsername.trim().replace(/^@/, '');
    const cleanTelContacto = formData.telefonoContacto.trim();
    const cleanTelSecundario = formData.telefonoSecundario.trim();
    const cleanContexto = formData.contexto.trim();

    if (!cleanNombre) {
      setError('Por favor completa el nombre del negocio.');
      return;
    }

    if (!cleanTelContacto) {
      setError('Por favor ingresa el teléfono administrativo principal.');
      return;
    }

    if (!PHONE_REGEX.test(cleanTelContacto)) {
      setError('El teléfono administrativo principal debe tener formato internacional válido (ej. +573001234567).');
      return;
    }

    if (cleanTelSecundario && !PHONE_REGEX.test(cleanTelSecundario)) {
      setError('El teléfono administrativo secundario debe tener formato internacional válido.');
      return;
    }

    if (!cleanNombreSede) {
      setError('Por favor ingresa el nombre de la sede o sucursal.');
      return;
    }

    if (!cleanPhone && !cleanUsername) {
      setError('Debes ingresar al menos un identificador de WhatsApp (número o usuario) para vincular a Luka.');
      return;
    }

    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setError('El teléfono de WhatsApp debe tener formato internacional válido (ej. +573001234567).');
      return;
    }

    setIsLoading(true);
    try {
      await onSubmit({
        nombre: cleanNombre,
        telefonoContacto: cleanTelContacto,
        telefonoSecundario: cleanTelSecundario || undefined,
        contexto: cleanContexto || undefined,
        nombreSede: cleanNombreSede,
        direccionSede: formData.direccionSede.trim() || undefined,
        whatsappPhone: cleanPhone || undefined,
        whatsappUsername: cleanUsername || undefined,
      });
      setFormData({
        nombre: '',
        telefonoContacto: '',
        telefonoSecundario: '',
        contexto: '',
        nombreSede: 'Sede principal',
        direccionSede: '',
        whatsappPhone: '',
        whatsappUsername: '',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Error al crear el negocio.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, scale: 0.98 }}
      animate={{ opacity: 1, height: 'auto', scale: 1 }}
      exit={{ opacity: 0, height: 0, scale: 0.98 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden mb-6"
    >
      <div className="relative rounded-3xl bg-slate-50/95 dark:bg-card border-2 border-emerald-500/30 p-6 sm:p-7 shadow-xl space-y-6 overflow-hidden">
        {/* Glow de acento esmeralda */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

        {/* Header In-Page */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-border/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                Registrar Nuevo Negocio & Sede
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ingresa la información del negocio y vincula su primera sede operativa para Luka AI.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-slate-200/60 dark:hover:bg-muted/50 transition-colors cursor-pointer"
            title="Cerrar formulario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grilla 2 Columnas Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* 🏢 CARD 1: Negocio Principal */}
            <div className="p-5 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/80 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-border/50 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>1. Negocio Principal</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    Matriz
                  </span>
                </div>

                {/* Nombre del Negocio */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Nombre del Negocio o Razón Social *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      name="nombre"
                      required
                      placeholder="Ej: Inversiones Pérez S.A.S."
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                    />
                  </div>
                </div>

                {/* Teléfonos */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Teléfono Administrativo
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        name="telefonoContacto"
                        required
                        placeholder="Ej. +573001112233"
                        value={formData.telefonoContacto}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Teléfono Secundario <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        name="telefonoSecundario"
                        placeholder="Ej. 6023345678"
                        value={formData.telefonoSecundario}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Descripción o Rubro */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Descripción o Rubro <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    name="contexto"
                    placeholder="Ej. Comercialización y distribución de alimentos."
                    value={formData.contexto}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 📍 CARD 2: Primera Sede & Canal WhatsApp */}
            <div className="p-5 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/80 flex flex-col justify-between space-y-4 shadow-xs">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-border/50 pb-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>2. Primera Sede & Canal WhatsApp</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                    Sucursal
                  </span>
                </div>

                {/* Nombre Sede y Dirección */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground block">
                      Nombre de la Sede *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        name="nombreSede"
                        required
                        placeholder="Ej: Sede principal"
                        value={formData.nombreSede}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
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
                        name="direccionSede"
                        placeholder="Ej: Calle 10 # 4-50"
                        value={formData.direccionSede}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                      />
                    </div>
                  </div>
                </div>

                {/* Sub-bloque Canal WhatsApp */}
                <div className="pt-2.5 border-t border-slate-200/80 dark:border-border/60 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Línea de WhatsApp para Luka AI
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
                          name="whatsappPhone"
                          placeholder="Ej. +573043904488"
                          value={formData.whatsappPhone}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Línea desde la que escribirás a Luka.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground block">
                        Usuario WhatsApp <span className="text-muted-foreground font-normal">(Alias)</span>
                      </label>
                      <div className="relative">
                        <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          name="whatsappUsername"
                          placeholder={`Ej. ${usernamePlaceholder}`}
                          value={formData.whatsappUsername}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-background border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Solo si tienes usuario o número privado.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
          <div className="pt-4 border-t border-slate-200/80 dark:border-border/60 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-bold cursor-pointer border-slate-300 dark:border-border hover:bg-slate-100 dark:hover:bg-muted/50"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="rounded-xl px-6 py-2.5 text-xs font-black shadow-md cursor-pointer bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Registrando Negocio...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-1.5" />
                  Crear Negocio & Sede
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
