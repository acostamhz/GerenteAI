import React, { useState } from 'react';
import { X, Building2, Phone, FileText, Loader2, Sparkles } from 'lucide-react';
import { profileApi } from '@/features/shared-profile/api/profileApi';
import { ApiError } from '@/lib/apiClient';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (negocioId: string, nombre: string) => void;
}

export function CreateBusinessModal({ isOpen, onClose, onSuccess }: CreateBusinessModalProps) {
  const [nombre, setNombre] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [contexto, setContexto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: { nombre: string; telefonoContacto?: string; contexto?: string } = {
        nombre: nombre.trim(),
      };
      if (telefonoContacto.trim()) {
        payload.telefonoContacto = telefonoContacto.trim();
      }
      if (contexto.trim()) {
        payload.contexto = contexto.trim();
      }

      const newNegocio = await profileApi.createNegocio(payload as any);

      // Persistir como negocio activo
      localStorage.setItem('active_business_id', newNegocio.id);
      localStorage.setItem('active_business_name', newNegocio.nombre);

      // Notificar a toda la aplicación
      window.dispatchEvent(new Event('business_changed'));

      if (onSuccess) {
        onSuccess(newNegocio.id, newNegocio.nombre);
      }

      onClose();
    } catch (err: any) {
      console.error('Error creando negocio:', err);
      const msg = err instanceof ApiError ? err.message : 'No se pudo crear el negocio. Intenta de nuevo.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden">
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
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
              Crear Nuevo Negocio <Sparkles className="w-4 h-4 text-emerald-500" />
            </h2>
            <p className="text-xs text-muted-foreground">
              Configura tu comercio para empezar a centralizar tu flujo de caja y ventas.
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Nombre del Comercio / Empresa <span className="text-emerald-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Restaurante El Fogón, Tienda La Esquina..."
                className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Teléfono de Contacto Administrativo <span className="text-muted-foreground font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <input
                type="tel"
                value={telefonoContacto}
                onChange={(e) => setTelefonoContacto(e.target.value)}
                placeholder="Ej. +573001234567"
                className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Formato internacional con código de país (ej. +57 para Colombia).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground mb-1.5">
              Contexto o Actividad Comercial <span className="text-muted-foreground font-normal">(Opcional)</span>
            </label>
            <div className="relative">
              <textarea
                rows={2}
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                placeholder="Ej. Venta de almuerzos y bebidas, venta al detal de abarrotes..."
                className="w-full pl-10 pr-4 py-2 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none"
              />
              <FileText className="w-4 h-4 text-muted-foreground absolute left-3.5 top-3" />
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
              disabled={isSubmitting || !nombre.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 text-xs font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creando Negocio...
                </>
              ) : (
                'Registrar Negocio'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
