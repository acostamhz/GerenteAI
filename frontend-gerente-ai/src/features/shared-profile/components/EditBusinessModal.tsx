import React, { useState, useEffect } from 'react';
import { Building2, Phone, FileText, X, Loader2, Save, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Negocio, UpdateNegocioDto } from '../types';

interface EditBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  negocio: Negocio | null;
  onSubmit: (id: string, dto: UpdateNegocioDto) => Promise<any>;
}

export function EditBusinessModal({
  isOpen,
  onClose,
  negocio,
  onSubmit,
}: EditBusinessModalProps) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [telefonoSecundario, setTelefonoSecundario] = useState('');
  const [contexto, setContexto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (negocio) {
      setNombre(negocio.nombre || '');
      setTelefono(negocio.telefono || '');
      setTelefonoSecundario(negocio.telefonoSecundario || '');
      setContexto(negocio.contexto || '');
      setError(null);
    }
  }, [negocio, isOpen]);

  if (!isOpen || !negocio) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del negocio es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(negocio.id, {
        nombre: nombre.trim(),
        telefono: telefono.trim() || undefined,
        telefonoSecundario: telefonoSecundario.trim() || undefined,
        contexto: contexto.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error al actualizar el negocio.');
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
                Editar Negocio / Empresa
              </h3>
              <p className="text-xs text-muted-foreground">
                Actualiza los datos corporativos de la empresa matriz
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
          {/* Nombre Comercial */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Nombre de la Empresa <span className="text-emerald-500">*</span>
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Restaurante Sabor Criollo"
                className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Teléfonos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Teléfono Principal
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Ej. +573001234567"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground block">
                Teléfono Secundario
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="tel"
                  value={telefonoSecundario}
                  onChange={(e) => setTelefonoSecundario(e.target.value)}
                  placeholder="Ej. 6023345678"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Contexto / Descripción */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground block">
              Descripción o Rubro del Negocio
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={contexto}
                onChange={(e) => setContexto(e.target.value)}
                placeholder="Ej. Venta de almuerzos ejecutivos, bebidas y postres típicos en el centro de la ciudad."
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all resize-none"
              />
            </div>
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
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar Cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
