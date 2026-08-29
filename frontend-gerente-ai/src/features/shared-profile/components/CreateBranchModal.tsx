import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  AtSign, 
  X, 
  Loader2, 
  Plus, 
  Sparkles, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { motion } from 'motion/react';
import { CreateSedeDto } from '../types';

interface CreateBranchModalProps {
  isOpen: boolean;
  onClose: () => void;
  negocioId: string;
  negocioNombre?: string;
  onSubmit: (negocioId: string, dto: Omit<CreateSedeDto, 'negocioId'>) => Promise<any>;
}

export function CreateBranchModal({
  isOpen,
  onClose,
  negocioId,
  negocioNombre = 'este negocio',
  onSubmit,
}: CreateBranchModalProps) {
  const [nombre, setNombre] = useState('');
  const [direccion, setDireccion] = useState('');
  const [telefono, setTelefono] = useState('');
  const [whatsappUsername, setWhatsappUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre de la sede es obligatorio.');
      return;
    }

    // Validación formato teléfono si se incluye
    if (telefono.trim()) {
      const cleanPhone = telefono.trim().replace(/\s+/g, '');
      if (!/^\+?[0-9]{10,15}$/.test(cleanPhone)) {
        setError('El número de WhatsApp debe tener formato internacional válido (ej. +573001234567 o 573001234567).');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(negocioId, {
        nombre: nombre.trim(),
        direccion: direccion.trim() || undefined,
        telefono: telefono.trim() || undefined,
        whatsappUsername: whatsappUsername.trim().replace(/^@/, '') || undefined,
      });

      // Reset
      setNombre('');
      setDireccion('');
      setTelefono('');
      setWhatsappUsername('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al registrar la nueva sede.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-sm">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                Registrar Nueva Sede / Sucursal
              </h3>
              <p className="text-xs text-muted-foreground">
                Para la empresa: <strong className="text-foreground">{negocioNombre}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre de la Sede */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Nombre de la Sede o Sucursal <span className="text-emerald-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Sucursal Norte, Local Centro, Sede Poblado"
                className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Dirección Física */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Dirección Física
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                placeholder="Ej. Cra. 43A # 5-20, Medellín"
                className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* WhatsApp de la Sede & Usuario */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Línea WhatsApp de la Sede
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-500" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. +573043904488"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Usuario / Alias WhatsApp
              </label>
              <div className="relative">
                <AtSign className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={whatsappUsername}
                  onChange={(e) => setWhatsappUsername(e.target.value)}
                  placeholder="Ej. caja_norte"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="p-3 bg-muted/30 border border-border/60 rounded-2xl flex items-center gap-2.5 text-xs text-muted-foreground">
            <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Esta sede contará con su propio canal de WhatsApp para registrar ventas y gastos de forma independiente.</span>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !nombre.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creando Sede...</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Sede</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
