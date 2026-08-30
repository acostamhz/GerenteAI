import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { 
  X, 
  Building2, 
  MapPin, 
  Phone, 
  AtSign, 
  Loader2, 
  Sparkles, 
  MessageSquare, 
  AlertCircle,
  PlusCircle
} from 'lucide-react';
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
  // Datos Negocio Principal
  const [nombre, setNombre] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [telefonoSecundario, setTelefonoSecundario] = useState('');
  const [contexto, setContexto] = useState('');

  // Datos Primera Sede / Sucursal
  const [nombreSede, setNombreSede] = useState('Sede principal');
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
    const cleanContexto = contexto.trim();

    if (!cleanNombre) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }

    if (!cleanTelContacto) {
      setError('Por favor ingresa el teléfono administrativo principal.');
      return;
    }

    if (!PHONE_REGEX.test(cleanTelContacto)) {
      setError('El teléfono administrativo principal debe tener formato internacional válido (ej: +573001234567).');
      return;
    }

    if (cleanTelSecundario && !PHONE_REGEX.test(cleanTelSecundario)) {
      setError('El teléfono administrativo secundario debe tener formato internacional válido.');
      return;
    }

    if (!cleanNombreSede) {
      setError('El nombre de la sede o sucursal es obligatorio (ej. Sede principal).');
      return;
    }

    if (!cleanPhone && !cleanUsername) {
      setError('Debes ingresar al menos un identificador de WhatsApp (número o usuario) para vincular a Luka.');
      return;
    }

    if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) {
      setError('El número de WhatsApp no es válido. Debe tener código de país (ej: +573001234567).');
      return;
    }

    if (cleanUsername && !USERNAME_REGEX.test(cleanUsername)) {
      setError('El nombre de usuario de WhatsApp no es válido (mínimo 3 caracteres, sin espacios ni @).');
      return;
    }

    setIsSubmitting(true);

    try {
      const { negocio, sede } = await profileApi.createNegocioConSede({
        nombre: cleanNombre,
        telefonoContacto: cleanTelContacto,
        telefonoSecundario: cleanTelSecundario || undefined,
        contexto: cleanContexto || undefined,
        nombreSede: cleanNombreSede,
        direccionSede: direccionSede.trim() || undefined,
        whatsappPhone: cleanPhone || undefined,
        whatsappUsername: cleanUsername || undefined,
      });

      // Sincronizar en localStorage
      localStorage.setItem('active_business_id', negocio.id);
      localStorage.setItem('active_business_name', negocio.nombre);
      if (sede?.id) {
        localStorage.setItem('active_sede_id', sede.id);
        localStorage.setItem('active_sede_name', sede.nombre || cleanNombreSede);
      } else {
        localStorage.removeItem('active_sede_id');
        localStorage.removeItem('active_sede_name');
      }

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
      <div className="relative w-full max-w-4xl sm:max-w-5xl bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto space-y-6">
        {/* Glow de acento esmeralda */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-border/60 pb-4">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              Crear Nuevo Negocio & Sede <Sparkles className="w-4 h-4 text-emerald-500" />
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Configura tu negocio y su primera sucursal para enlazar el bot Luka AI.
            </p>
          </div>
        </div>

        {/* Error inline */}
        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/25 text-destructive text-xs font-semibold flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            {(error.toLowerCase().includes('plan') || error.toLowerCase().includes('tope') || error.toLowerCase().includes('sede')) && (
              <Link
                to="/subscription"
                onClick={onClose}
                className="self-start text-[11px] font-bold underline hover:opacity-80 text-emerald-700 dark:text-emerald-400"
              >
                ⚡ Ver opciones para mejorar tu plan
              </Link>
            )}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grilla 2 Columnas Lado a Lado */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
            {/* 🏢 CARD 1: Negocio Principal */}
            <div className="p-5 sm:p-6 rounded-3xl bg-muted/20 border border-border/80 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <Building2 className="w-4 h-4 text-emerald-500" />
                    <span>1. Negocio Principal</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Matriz
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">
                    Nombre del Negocio o Razón Social *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Inversiones Pérez S.A.S."
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">
                      Teléfono Administrativo
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="tel"
                        required
                        value={telefonoContacto}
                        onChange={(e) => setTelefonoContacto(e.target.value)}
                        placeholder="Ej. +573001112233"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
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
                        value={telefonoSecundario}
                        onChange={(e) => setTelefonoSecundario(e.target.value)}
                        placeholder="Ej. 6023345678"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">
                    Descripción o Rubro <span className="text-muted-foreground font-normal">(Opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Ej. Restaurante, café de especialidad y repostería artesanal."
                    value={contexto}
                    onChange={(e) => setContexto(e.target.value)}
                    className="w-full px-3.5 py-2 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>

            {/* 📍 CARD 2: Primera Sede / Sucursal */}
            <div className="p-5 sm:p-6 rounded-3xl bg-muted/20 border border-border/80 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <MapPin className="w-4 h-4 text-emerald-500" />
                    <span>2. Primera Sede & Canal WhatsApp</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    Sucursal
                  </span>
                </div>

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
                        value={nombreSede}
                        onChange={(e) => setNombreSede(e.target.value)}
                        placeholder="Ej. Sede principal"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
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
                        value={direccionSede}
                        onChange={(e) => setDireccionSede(e.target.value)}
                        placeholder="Ej. Calle 10 # 4-50"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Canal WhatsApp de la Sede */}
                <div className="pt-3 border-t border-border/60 space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                      Línea de WhatsApp para Luka AI
                    </span>
                    <span className="text-[10px] font-normal text-muted-foreground">Requerido</span>
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
                          value={whatsappPhone}
                          onChange={(e) => setWhatsappPhone(e.target.value)}
                          placeholder="Ej. +573043904488"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
                        />
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Línea desde la que escribirás ventas o gastos.
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
                          value={whatsappUsername}
                          onChange={(e) => setWhatsappUsername(e.target.value)}
                          placeholder={`Ej. ${usernamePlaceholder}`}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm"
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

          {/* Footer de botones */}
          <div className="pt-4 border-t border-border/60 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !nombre.trim() || !nombreSede.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registrando Negocio & Sede...
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Crear Negocio & Sede
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
