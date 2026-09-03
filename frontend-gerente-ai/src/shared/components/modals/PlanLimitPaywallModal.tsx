import { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Lock, 
  Check, 
  MessageSquare, 
  ShieldCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router';
import { PlanBackend, PLANES_FALLBACK, MENSAJES_IA_POR_PLAN } from '@/shared/api/planesApi';
import { WompiCheckoutModal } from '@/features/client-subscription/components/WompiCheckoutModal';
import { lukaWhatsappUrl } from '@/lib/whatsapp';

interface PlanLimitPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  motivo?: string;
  planRecomendadoId?: number;
  catalogo?: PlanBackend[];
  negocioId?: string;
  negocioNombre?: string;
  onUpgradeSuccess?: () => void;
}

const PRECIO_FORMATTER = new Intl.NumberFormat('es-CO');

export function PlanLimitPaywallModal({
  isOpen,
  onClose,
  motivo,
  planRecomendadoId = 2,
  catalogo = PLANES_FALLBACK,
  negocioId = '',
  negocioNombre = 'Tu Negocio',
  onUpgradeSuccess,
}: PlanLimitPaywallModalProps) {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isOpen) return null;

  const planRecomendado = catalogo.find((p) => p.id === planRecomendadoId) || catalogo[1] || PLANES_FALLBACK[1];

  const handleOpenWompi = () => {
    if (planRecomendado.id === 5) {
      handleOpenWhatsappSales();
      return;
    }
    setIsCheckoutOpen(true);
  };

  const handleOpenWhatsappSales = () => {
    const msg = `Hola Luka 👋, me gustaría recibir asesoría para ampliar el número de sedes o negocios en mi cuenta (${negocioNombre}).`;
    window.open(lukaWhatsappUrl(msg), '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-card border border-emerald-500/30 rounded-3xl shadow-2xl overflow-hidden my-6 p-6 sm:p-8"
        >
          {/* Glow ambiental */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

          {/* Botón Cerrar */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="text-center space-y-3 mb-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-xs font-bold text-amber-700 dark:text-amber-400">
              <Lock className="w-3.5 h-3.5" /> Capacidad del Plan Alcanzada
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
              Desbloquea Nuevas Sedes y Negocios con el Plan {planRecomendado.nombre}
            </h3>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {motivo || `Tu plan actual ha alcanzado el límite permitido de sedes o negocios. Mejora al Plan ${planRecomendado.nombre} para continuar expandiendo tu operación.`}
            </p>
          </div>

          {/* Tarjeta de Beneficios del Plan Recomendado */}
          <div className="bg-muted/30 border border-border rounded-2xl p-5 mb-6 space-y-4">
            <div className="flex items-baseline justify-between border-b border-border/80 pb-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Recomendado para ti
                </span>
                <span className="text-lg font-black text-foreground">
                  Plan {planRecomendado.nombre}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  ${PRECIO_FORMATTER.format(planRecomendado.precioMensual)}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground ml-1">COP /mes</span>
              </div>
            </div>

            {/* Lista de Features */}
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-foreground font-semibold">
                  Hasta {planRecomendado.maxSedes === 1 ? '1 sede' : `${planRecomendado.maxSedes} sedes`} y múltiples negocios simultáneos
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-foreground font-semibold">
                  {MENSAJES_IA_POR_PLAN[planRecomendado.id] || "Mensajes con IA incluidos"}
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-foreground font-semibold">
                  Registro ágil de ventas y gastos por WhatsApp 24/7
                </span>
              </div>

              <div className="flex items-start gap-2.5">
                <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-foreground font-semibold">
                  Reportes avanzados, métricas de fiados y control financiero
                </span>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOpenWompi}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {planRecomendado.id === 5
                  ? "Contactar a Asesor Comercial"
                  : `Desbloquear Plan ${planRecomendado.nombre} ($${PRECIO_FORMATTER.format(planRecomendado.precioMensual)} COP)`}
              </span>
            </button>

            <button
              type="button"
              onClick={handleOpenWhatsappSales}
              className="w-full py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
              <span>Hablar con Asesor Comercial (+57 3043904488)</span>
            </button>

            <Link
              to="/subscription"
              onClick={onClose}
              className="w-full py-1 text-center text-xs font-semibold text-muted-foreground/80 hover:text-foreground transition-colors block"
            >
              Ver comparativa completa de todos los planes
            </Link>
          </div>

          {/* Seguridad Wompi */}
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Pasarela Wompi Bancolombia • Cancelación en cualquier momento</span>
          </div>
        </motion.div>
      </div>

      {/* Checkout Wompi Modal */}
      {isCheckoutOpen && (
        <WompiCheckoutModal
          isOpen={isCheckoutOpen}
          onClose={() => setIsCheckoutOpen(false)}
          plan={planRecomendado}
          ciclo="mensual"
          negocioId={negocioId || ""}
          negocioNombre={negocioNombre}
          onPaymentSuccess={() => {
            setIsCheckoutOpen(false);
            onClose();
            if (onUpgradeSuccess) {
              onUpgradeSuccess();
            }
          }}
        />
      )}
    </>
  );
}
