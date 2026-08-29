import { MessageSquare, CheckCircle2, AlertCircle, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Negocio, Sede } from '../types';
import { lukaWhatsappUrl } from '@/lib/whatsapp';
import { usePlanPermissions } from '@/shared/hooks/usePlanPermissions';
import { WhatsAppChannelsSkeleton } from './skeletons/ProfileSkeletons';

interface WhatsAppChannelsCardProps {
  negocios?: Negocio[];
  sedesByNegocio?: Record<string, Sede[]>;
  isLoading?: boolean;
}

export function WhatsAppChannelsCard({
  negocios = [],
  sedesByNegocio = {},
  isLoading = false,
}: WhatsAppChannelsCardProps) {
  const { planInfo, maxSedesPermitidas } = usePlanPermissions();

  if (isLoading) {
    return <WhatsAppChannelsSkeleton />;
  }

  // Consolidar todos los canales de WhatsApp reales
  const canales: Array<{
    id: string;
    telefono: string;
    whatsappUsername?: string;
    nombreSede: string;
    nombreNegocio: string;
  }> = [];

  negocios.forEach((negocio) => {
    const sedes = sedesByNegocio[negocio.id] || [];
    if (sedes.length > 0) {
      sedes.forEach((sede) => {
        if (sede.telefono || negocio.telefono) {
          canales.push({
            id: sede.id,
            telefono: sede.telefono || negocio.telefono,
            whatsappUsername: sede.whatsappUsername || undefined,
            nombreSede: sede.nombre,
            nombreNegocio: negocio.nombre,
          });
        }
      });
    } else if (negocio.telefono) {
      canales.push({
        id: negocio.id,
        telefono: negocio.telefono,
        nombreSede: 'Sede Principal',
        nombreNegocio: negocio.nombre,
      });
    }
  });

  const totalCanales = canales.length;
  // Capacidad total de líneas según plan (sedes permitidas por negocio * cantidad de negocios, mínimo el límite de 1 negocio)
  const sedesPorNegocio = maxSedesPermitidas === Infinity ? 50 : maxSedesPermitidas;
  const numNegocios = Math.max(1, negocios.length);
  const maxLimit = Math.max(sedesPorNegocio, numNegocios * sedesPorNegocio);
  const percentage = Math.min(100, Math.round((totalCanales / (maxLimit || 1)) * 100));

  const handleTestChat = (nombreNegocio: string) => {
    const url = lukaWhatsappUrl(`Hola Luka 👋, estoy probando la conexión para ${nombreNegocio}.`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="rounded-3xl bg-slate-50/95 dark:bg-card/70 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 p-6 sm:p-7 shadow-sm space-y-5">
      {/* Header & Quota */}
      <div className="space-y-3 border-b border-slate-200/80 dark:border-border/60 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              Canales y Líneas de WhatsApp Conectadas
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Líneas sincronizadas para capturar ventas, gastos y responder consultas autónomas.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1 rounded-full">
              {totalCanales} de {maxLimit} Líneas Activas • Plan {planInfo.nombre}
            </span>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="space-y-1">
          <div className="w-full bg-slate-200/70 dark:bg-muted/60 h-2 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
            />
          </div>
        </div>
      </div>

      {/* Lista de Canales Conectados */}
      {canales.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground space-y-2 bg-white dark:bg-muted/10 rounded-2xl border border-dashed border-slate-300 dark:border-border/60">
          <AlertCircle className="w-6 h-6 text-muted-foreground/50 mx-auto" />
          <p className="text-xs font-medium">
            No hay canales de WhatsApp registrados. Añade una sede a tu negocio para activar la línea.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {canales.map((canal) => (
            <motion.div
              key={canal.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/90 dark:border-border/70 bg-white dark:bg-background/50 hover:bg-slate-50 dark:hover:bg-background/80 transition-all shadow-xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0 shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div className="min-w-0">
                  <h5 className="text-xs sm:text-sm font-bold text-foreground tracking-tight truncate">
                    {canal.telefono}
                  </h5>
                  <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                    {canal.nombreNegocio} • {canal.nombreSede}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleTestChat(canal.nombreNegocio)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-muted/60 hover:bg-emerald-500/10 hover:text-emerald-700 dark:hover:text-emerald-400 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer shrink-0 border border-slate-200 dark:border-border/60"
                title="Probar Chat en WhatsApp"
              >
                <span>Probar</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
