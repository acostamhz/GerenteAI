import { useState } from 'react';
import { Building2, Phone, FileText, X, Loader2, PlusCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { CreateNegocioDto } from '../types';

interface CreateBusinessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateNegocioDto) => Promise<any>;
}

export function CreateBusinessModal({ isOpen, onClose, onSubmit }: CreateBusinessModalProps) {
  const [formData, setFormData] = useState<CreateNegocioDto>({
    nombre: '',
    telefono: '',
    telefonoSecundario: '',
    contexto: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim() || !formData.telefono.trim()) {
      setError('Por favor completa el nombre y teléfono del negocio.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        telefonoSecundario: formData.telefonoSecundario?.trim() || undefined,
        contexto: formData.contexto?.trim() || undefined,
      });
      setFormData({ nombre: '', telefono: '', telefonoSecundario: '', contexto: '' });
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
            className="relative w-full max-w-lg bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-6 overflow-hidden"
          >
            {/* Ambient header glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />

            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-500" />
                  Registrar Nuevo Negocio
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Crea una nueva empresa o sede para gestionar con Inteligencia Artificial.
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
              {/* Nombre del Negocio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Nombre de la Empresa / Sede *
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
                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                  />
                </div>
              </div>

              {/* Teléfono Principal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Teléfono Principal *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      name="telefono"
                      required
                      placeholder="+573001234567"
                      value={formData.telefono}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    />
                  </div>
                </div>

                {/* Teléfono Secundario */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                    Teléfono Secundario (Opcional)
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="tel"
                      name="telefonoSecundario"
                      placeholder="+573109876543"
                      value={formData.telefonoSecundario}
                      onChange={handleChange}
                      className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contexto del Negocio */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider">
                  Contexto o Descripción de Operaciones
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 absolute left-4 top-3.5 text-muted-foreground" />
                  <textarea
                    name="contexto"
                    rows={3}
                    placeholder="Describe a qué se dedica tu negocio, horario de atención, tipo de productos..."
                    value={formData.contexto}
                    onChange={handleChange}
                    className="w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm resize-none"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
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
                      Crear Negocio
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
