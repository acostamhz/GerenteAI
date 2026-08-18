import { useState } from 'react';
import { Building2, Plus, Phone, FileText, Trash2, Edit3, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/app/components/ui/button';
import { CreateBusinessModal } from './CreateBusinessModal';
import { CreateNegocioDto, Negocio } from '../types';

interface BusinessManagementTabProps {
  negocios: Negocio[];
  isLoading: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  onCreateNegocio: (dto: CreateNegocioDto) => Promise<any>;
  onDeleteNegocio: (id: string) => Promise<any>;
  onClearFeedback: () => void;
}

export function BusinessManagementTab({
  negocios,
  isLoading,
  actionError,
  actionSuccess,
  onCreateNegocio,
  onDeleteNegocio,
}: BusinessManagementTabProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, nombre: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el negocio "${nombre}"? Esta acción no se puede deshacer.`)) {
      setDeletingId(id);
      try {
        await onDeleteNegocio(id);
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Alerta de Feedback */}
      <AnimatePresence mode="wait">
        {actionSuccess && (
          <motion.div
            key="success-feedback"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center gap-3 shadow-sm"
          >
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            key="error-feedback"
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold flex items-center gap-3 shadow-sm"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header de la pestaña */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-emerald-500" />
              Empresas y Sedes Administradas
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              Negocios conectados con agentes de IA y flujos automatizados de WhatsApp.
            </p>
          </div>

          <Button
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl px-4 py-3 font-bold text-xs shadow-md inline-flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Añadir Negocio
          </Button>
        </div>

        {/* Lista de Negocios */}
        {isLoading ? (
          <div className="py-16 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-sm font-medium text-muted-foreground">Cargando tus negocios...</p>
          </div>
        ) : negocios.length === 0 ? (
          /* Estado Vacío */
          <div className="py-12 px-6 rounded-2xl border border-dashed border-border text-center space-y-4 bg-muted/10">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
              <Building2 className="w-7 h-7" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <h3 className="text-base font-bold text-foreground">No tienes negocios registrados</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registra tu primera empresa o sede para comenzar a recibir métricas y automatizar la atención.
              </p>
            </div>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="rounded-xl px-5 py-3 text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Crear mi primer negocio
            </Button>
          </div>
        ) : (
          /* Grid de Negocios Reales */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {negocios.map((negocio) => (
              <motion.div
                key={negocio.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl border border-border/80 bg-background/60 hover:bg-background/90 hover:border-emerald-500/30 transition-all shadow-sm flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-black shadow-sm">
                        {negocio.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-foreground tracking-tight group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                          {negocio.nombre}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md inline-block mt-0.5">
                          Sede Activa
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDelete(negocio.id, negocio.nombre)}
                      disabled={deletingId === negocio.id}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors cursor-pointer"
                      title="Eliminar Negocio"
                    >
                      {deletingId === negocio.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-destructive" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Teléfonos */}
                  <div className="space-y-1 pt-1 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{negocio.telefono}</span>
                      {negocio.telefonoSecundario && (
                        <span className="text-muted-foreground/70">/ {negocio.telefonoSecundario}</span>
                      )}
                    </div>

                    {negocio.contexto && (
                      <div className="flex items-start gap-2 pt-1">
                        <FileText className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                          {negocio.contexto}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-semibold text-[11px] text-muted-foreground/80">
                    ID: {negocio.id.slice(0, 8)}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold inline-flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Luka AI Conectado
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Crear Negocio */}
      <CreateBusinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={onCreateNegocio}
      />
    </div>
  );
}
