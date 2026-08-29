import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description: string;
  itemName?: string;
  confirmText?: string;
  isLoading?: boolean;
  requireStrictConfirmation?: boolean;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  confirmText = 'Eliminar Permanentemente',
  isLoading = false,
  requireStrictConfirmation = true,
}: DeleteConfirmationModalProps) {
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Reiniciar estado de confirmación cuando se abre o cierra el modal
  useEffect(() => {
    if (isOpen) {
      setIsConfirmed(!requireStrictConfirmation);
    }
  }, [isOpen, requireStrictConfirmation]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-[2px] overflow-y-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-card border border-border/90 rounded-3xl shadow-2xl overflow-hidden p-6 sm:p-7 space-y-5"
        >
          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Encabezado */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center shrink-0 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1 pr-6">
              <h3 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                {title}
              </h3>
              {itemName && (
                <p className="text-xs font-bold text-destructive">
                  "{itemName}"
                </p>
              )}
            </div>
          </div>

          {/* Descripción Base */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>

          {/* Bloque de Advertencia Destructiva y Confirmación Estricta */}
          {requireStrictConfirmation && (
            <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/25 space-y-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h5 className="text-xs font-bold text-destructive uppercase tracking-wider">
                    Pérdida Total e Irreversible de Datos
                  </h5>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Se borrarán permanentemente todas las ventas, registros de gastos, clientes fiados, historial de WhatsApp y métricas asociadas.
                  </p>
                </div>
              </div>

              <label className="flex items-start gap-2.5 pt-1.5 border-t border-destructive/20 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isConfirmed}
                  onChange={(e) => setIsConfirmed(e.target.checked)}
                  disabled={isLoading}
                  className="mt-0.5 w-4 h-4 rounded border-destructive/50 text-destructive focus:ring-destructive cursor-pointer accent-destructive shrink-0"
                />
                <span className="text-xs font-semibold text-foreground leading-tight">
                  Confirmo que deseo borrar todos los datos, registros y la línea de WhatsApp de forma definitiva.
                </span>
              </label>
            </div>
          )}

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading || (requireStrictConfirmation && !isConfirmed)}
              className="px-5 py-2.5 rounded-xl bg-destructive hover:bg-destructive/90 text-destructive-foreground font-black text-xs shadow-md shadow-destructive/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Eliminando...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{confirmText}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );

  return typeof document !== 'undefined'
    ? createPortal(modalContent, document.body)
    : modalContent;
}
