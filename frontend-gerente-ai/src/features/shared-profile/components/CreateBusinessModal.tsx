import { useState, useEffect } from 'react';
import { Building2, MapPin, Phone, AtSign, X, Loader2, PlusCircle, AlertCircle, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { getRandomUsernamePlaceholder } from '@/lib/activeBusiness';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<any>;
}

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

export function CreateBusinessModal({ isOpen, onClose, onSubmit }: CreateBusinessModalProps) {
  const [formData, setFormData] = useState({
    nombre: '',
    telefonoContacto: '',
    telefonoSecundario: '',
    nombreSede: 'Sede Principal',
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

    if (!cleanNombre) {
      setError('Por favor completa el nombre de la empresa matriz.');
      return;
    }

    if (!cleanNombreSede) {
      setError('Por favor ingresa el nombre de la sede/sucursal.');
      return;
    }

    if (!cleanPhone && !cleanUsername) {
      setError('Debes ingresar al menos un identificador de WhatsApp (número o usuario) para vincular a Luka.');
      return;
    }

    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setError('El número de WhatsApp debe tener formato internacional válido (ej. +573001234567 o 573001234567).');
      return;
    }

    if (cleanTelContacto && !PHONE_REGEX.test(cleanTelContacto)) {
      setError('El teléfono administrativo principal debe tener formato internacional válido.');
      return;
    }

    if (cleanTelSecundario && !PHONE_REGEX.test(cleanTelSecundario)) {
      setError('El teléfono administrativo secundario debe tener formato internacional válido.');
      return;
    }

    if (cleanUsername && !USERNAME_REGEX.test(cleanUsername)) {
      setError('El usuario de WhatsApp debe tener entre 3 y 30 caracteres (solo letras, números, punto, guion o guion bajo).');
      return;
    }

    setIsLoading(true);

    try {
      await onSubmit({
        nombre: cleanNombre,
        telefonoContacto: cleanTelContacto || undefined,
        telefonoSecundario: cleanTelSecundario || undefined,
        nombreSede: cleanNombreSede,
        direccionSede: formData.direccionSede.trim() || undefined,
        whatsappPhone: cleanPhone || undefined,
        whatsappUsername: cleanUsername || undefined,
      });
      setFormData({
        nombre: '',
        telefonoContacto: '',
        telefonoSecundario: '',
        nombreSede: 'Sede Principal',
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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-xl bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5 overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Ambient header glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  Registrar Nuevo Negocio & Sede
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea una nueva empresa y vincula su sucursal inicial con Luka AI.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Bloque 1: Empresa Matriz */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <Building2 className="w-4 h-4 text-emerald-500" />
                  1. Empresa Matriz
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Nombre de la Empresa o Razón Social *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      name="nombre"
                      required
                      placeholder="Ej: Café El Virrey S.A.S."
                      value={formData.nombre}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Teléfono Administrativo <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        name="telefonoContacto"
                        placeholder="Ej. +573001112233"
                        value={formData.telefonoContacto}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Teléfono Secundario <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        name="telefonoSecundario"
                        placeholder="Ej. +573109998877"
                        value={formData.telefonoSecundario}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Primera Sede */}
              <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  2. Primera Sede / Sucursal
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Nombre de la Sede *
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        name="nombreSede"
                        required
                        placeholder="Ej: Sede Principal - Chapinero"
                        value={formData.nombreSede}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">
                      Dirección Física <span className="text-muted-foreground font-normal">(Opcional)</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        name="direccionSede"
                        placeholder="Ej: Calle 85 # 15-20"
                        value={formData.direccionSede}
                        onChange={handleChange}
                        className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque Canal WhatsApp */}
                <div className="pt-2 border-t border-border/60 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                    Canal de WhatsApp de esta Sede
                    <span className="text-[10px] font-normal text-muted-foreground">(Al menos uno requerido)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground">
                        Número de WhatsApp
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="tel"
                          name="whatsappPhone"
                          placeholder="Ej. +573001234567"
                          value={formData.whatsappPhone}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        El número desde el que le escribirás a Luka.
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-foreground">
                        Usuario de WhatsApp <span className="text-muted-foreground font-normal">(Alternativo)</span>
                      </label>
                      <div className="relative">
                        <AtSign className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="text"
                          name="whatsappUsername"
                          placeholder={`Ej. ${usernamePlaceholder} (sin @)`}
                          value={formData.whatsappUsername}
                          onChange={handleChange}
                          className="w-full pl-11 pr-4 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Solo si tienes usuario en WhatsApp y tu número está oculto.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="rounded-xl px-5 py-4 text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="rounded-xl px-6 py-4 text-xs font-bold shadow-md cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Crear Empresa & Sede
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
