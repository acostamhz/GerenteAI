import { useState } from 'react';
import { Building2, Plus, Phone, FileText, Trash2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { CreateBusinessModal } from './CreateBusinessModal';
import { CreateNegocioDto, Negocio } from '../types';

interface BusinessBentoGridProps {
  negocios: Negocio[];
  isLoading: boolean;
  onCreateNegocio: (dto: CreateNegocioDto) => Promise<any>;
  onDeleteNegocio: (id: string) => Promise<any>;
}

export function BusinessBentoGrid({
  negocios,
  isLoading,
  onCreateNegocio,
  onDeleteNegocio,
}: BusinessBentoGridProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas desvincular el negocio "${nombre}"?`)) {
      setDeletingId(id);
      try {
        await onDeleteNegocio(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="rounded-3xl bg-card/70 backdrop-blur-xl border border-border/80 p-6 sm:p-7 shadow-sm space-y-5">
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-500" />
            Empresas y Sedes Administradas ({negocios.length})
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organizaciones conectadas con agentes autónomos de IA.
          </p>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="rounded-2xl px-4 py-2.5 font-bold text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Registrar Empresa
        </Button>
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="py-12 text-center space-y-2">
          <Loader2 className="w-7 h-7 text-primary animate-spin mx-auto" />
          <p className="text-xs font-medium text-muted-foreground">Cargando empresas...</p>
        </div>
      ) : negocios.length === 0 ? (
        /* Empty State */
        <div className="py-10 px-6 rounded-2xl border border-dashed border-border/80 text-center space-y-3 bg-muted/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h4 className="text-sm font-bold text-foreground">No tienes empresas registradas</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Registra tu primera sede para activar el monitoreo en tiempo real y la atención inteligente de WhatsApp.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm cursor-pointer inline-flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Crear Empresa
          </Button>
        </div>
      ) : (
        /* Businesses List */
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {negocios.map((negocio) => (
            <motion.div
              key={negocio.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border border-border/70 bg-background/50 hover:bg-background/80 hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between space-y-3 group"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black text-sm shadow-sm">
                      {negocio.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground tracking-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {negocio.nombre}
                      </h4>
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block">
                        Sede Activa
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(negocio.id, negocio.nombre)}
                    disabled={deletingId === negocio.id}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
                    title="Eliminar Empresa"
                  >
                    {deletingId === negocio.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-destructive" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Details */}
                <div className="space-y-1 text-xs text-muted-foreground font-medium pt-1">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{negocio.telefono}</span>
                  </div>

                  {negocio.contexto && (
                    <div className="flex items-start gap-1.5 pt-0.5">
                      <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                      <p className="line-clamp-2 text-[11px] text-muted-foreground leading-relaxed">
                        {negocio.contexto}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                <span className="font-mono text-muted-foreground">ID: {negocio.id.slice(0, 8)}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  Luka Bot
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateBusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onCreateNegocio}
      />
    </div>
  );
}
