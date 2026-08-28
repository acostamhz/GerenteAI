import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, Phone, AtSign, Loader2, Sparkles, MessageSquare } from 'lucide-react';
import { profileApi } from '@/features/shared-profile/api/profileApi';
import { ApiError } from '@/lib/apiClient';
import { getRandomUsernamePlaceholder } from '@/lib/activeBusiness';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (negocioId: string, nombre: string) => void;
}

const PHONE_REGEX = /^\+?[1-9]\d{6,14}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,30}$/;

export function CreateBusinessModal({ isOpen, onClose, onSuccess }: CreateBusinessModalProps) {
  // Datos Empresa Matriz
  const [nombre, setNombre] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [telefonoSecundario, setTelefonoSecundario] = useState('');

  // Datos Primera Sede / Sucursal
  const [nombreSede, setNombreSede] = useState('Sede Principal');
  const [direccionSede, setDireccionSede] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [whatsappUsername, setWhatsappUsername] = useState('');
  const [usernamePlaceholder, setUsernamePlaceholder] = useState('cafecentral');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setUsernamePlaceholder(getRandomUsernamePlaceholder());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanNombre = nombre.trim();
    const cleanNombreSede = nombreSede.trim();
    const cleanPhone = whatsappPhone.trim();
    const cleanUsername = whatsappUsername.trim().replace(/^@/, '');
    const cleanTelContacto = telefonoContacto.trim();
    const cleanTelSecundario = telefonoSecundario.trim();

    if (!cleanNombre) {
      setError('El nombre de la empresa o negocio matriz es obligatorio.');
      return;
    }

    if (!cleanNombreSede) {
      setError('El nombre de la sede/sucursal es obligatorio (ej. Sede Principal).');
      return;
    }

    if (!cleanPhone && !cleanUsername) {
      setError('Debes ingresar al menos un identificador de WhatsApp (número o usuario) para que Luka opere en esta sede.');
      return;
    }

    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setError('El número de WhatsApp de la sede debe tener formato internacional válido (ej. +573001234567 o 573001234567).');
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

    setIsSubmitting(true);

    try {
      const { negocio, sede } = await profileApi.createNegocioConSede({
        nombre: cleanNombre,
        telefonoContacto: cleanTelContacto || undefined,
        telefonoSecundario: cleanTelSecundario || undefined,
        nombreSede: cleanNombreSede,
        direccionSede: direccionSede.trim() || undefined,
        whatsappPhone: cleanPhone || undefined,
        whatsappUsername: cleanUsername || undefined,
      });

      // Persistir como negocio y sede activa
      localStorage.setItem('active_business_id', negocio.id);
      if (sede?.id) {
        localStorage.setItem('active_sede_id', sede.id);
        localStorage.setItem('active_sede_name', sede.nombre || cleanNombreSede);
      } else {
        localStorage.removeItem('active_sede_id');
        localStorage.removeItem('active_sede_name');
      }
      localStorage.setItem('active_business_name', negocio.nombre);

      // Notificar a toda la aplicación
      window.dispatchEvent(new Event('business_changed'));
      window.dispatchEvent(new Event('sede_changed'));

      if (onSuccess) {
        onSuccess(negocio.id, negocio.nombre);
      }

      onClose();
    } catch (err: any) {
      console.error('Error creando negocio y sede:', err);
      const msg = err instanceof ApiError ? err.message : 'No se pudo crear el negocio. Intenta de nuevo.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Glow de acento esmeralda */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              Crear Nuevo Negocio & Sede <Sparkles className="w-4 h-4 text-emerald-500" />
            </h2>
            <p className="text-xs text-muted-foreground">
              Configura tu empresa matriz y su primera sucursal para enlazar el bot Luka AI.
            </p>
          </div>
        </div>

        {/* Error inline */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Bloque 1: Empresa Matriz */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <Building2 className="w-4 h-4 text-emerald-500" />
              1. Datos de la Empresa Matriz
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground mb-1">
                Nombre de la Empresa o Marca Matriz <span className="text-emerald-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej. Grupo Gastronómico El Virrey S.A.S., Tienda La 80..."
                  className="w-full pl-10 pr-4 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                />
                <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Teléfono Administrativo Principal <span className="text-muted-foreground font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={telefonoContacto}
                    onChange={(e) => setTelefonoContacto(e.target.value)}
                    placeholder="Ej. +573001112233"
                    className="w-full pl-9 pr-3.5 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                  <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Teléfono Secundario / Soporte <span className="text-muted-foreground font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    value={telefonoSecundario}
                    onChange={(e) => setTelefonoSecundario(e.target.value)}
                    placeholder="Ej. +573109998877"
                    className="w-full pl-9 pr-3.5 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                  <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 2: Primera Sede / Sucursal */}
          <div className="p-4 rounded-2xl bg-muted/20 border border-border/80 space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <MapPin className="w-4 h-4 text-emerald-500" />
              2. Primera Sede / Sucursal Operativa
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-foreground mb-1">
                  Nombre de la Sede <span className="text-emerald-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={nombreSede}
                    onChange={(e) => setNombreSede(e.target.value)}
                    placeholder="Ej. Sede Principal - Chapinero"
                    className="w-full pl-9 pr-3.5 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Dirección Física <span className="text-muted-foreground font-normal">(Opcional)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={direccionSede}
                    onChange={(e) => setDireccionSede(e.target.value)}
                    placeholder="Ej. Calle 85 # 15-20, Bogotá"
                    className="w-full pl-9 pr-3.5 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                  />
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Canal WhatsApp de la Sede */}
            <div className="pt-2 border-t border-border/60 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                Canal de WhatsApp de esta Sede
                <span className="text-[10px] font-normal text-muted-foreground">(Al menos uno requerido)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Número de WhatsApp
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={whatsappPhone}
                      onChange={(e) => setWhatsappPhone(e.target.value)}
                      placeholder="Ej. +573001234567"
                      className="w-full pl-9 pr-3.5 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                    />
                    <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    El número desde el que le escribirás a Luka.
                  </p>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-foreground mb-1">
                    Usuario de WhatsApp <span className="text-muted-foreground font-normal">(Alternativo)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={whatsappUsername}
                      onChange={(e) => setWhatsappUsername(e.target.value)}
                      placeholder={`Ej. ${usernamePlaceholder} (sin @)`}
                      className="w-full pl-9 pr-3.5 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                    />
                    <AtSign className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Solo si tienes usuario en WhatsApp y tu número está oculto.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nombre.trim() || !nombreSede.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando Empresa & Sede...
                </>
              ) : (
                'Registrar Empresa & Sede'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
