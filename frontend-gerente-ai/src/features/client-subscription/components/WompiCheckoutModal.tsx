import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Building2,
  Calendar,
  Check,
  Smartphone,
  Landmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PlanBackend, CicloFacturacion, MENSAJES_IA_POR_PLAN } from '@/shared/api/planesApi';
import { ResultadoTransaccionWompi } from '../types';
import { iniciarPago } from '../services/pagosApi';
import { wompiService, USE_MOCK_GATEWAY } from '../services/wompiService';
import { SubscriptionSuccessWizard } from './SubscriptionSuccessWizard';

interface WompiCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: PlanBackend | null;
  ciclo: CicloFacturacion;
  negocioId: string;
  negocioNombre?: string;
  onPaymentSuccess?: (resultado: ResultadoTransaccionWompi) => void;
}

const PRECIO_FORMATTER = new Intl.NumberFormat('es-CO');

export function WompiCheckoutModal({
  isOpen,
  onClose,
  plan,
  ciclo,
  negocioId,
  negocioNombre,
  onPaymentSuccess,
}: WompiCheckoutModalProps) {
  const [paso, setPaso] = useState<'RESUMEN' | 'PROCESANDO' | 'EXITO' | 'ERROR'>('RESUMEN');
  const [progresoTexto, setProgresoTexto] = useState('Iniciando conexión segura con Wompi...');
  const [resultadoTransaccion, setResultadoTransaccion] = useState<ResultadoTransaccionWompi | null>(null);
  const [simularError, setSimularError] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Reset de estados al abrir el modal
  useEffect(() => {
    if (isOpen) {
      setPaso('RESUMEN');
      setErrorMensaje(null);
      setResultadoTransaccion(null);
    }
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  const cicloEfectivo: 'mensual' | 'anual' = plan.id === 2 ? 'mensual' : ciclo;
  const montoTotal = cicloEfectivo === 'anual' ? plan.precioAnual : plan.precioMensual;
  const liquidacion = wompiService.calcularLiquidacion(montoTotal, cicloEfectivo);

  const textoSedesPlan = () => {
    if (plan.id === 5 || plan.maxSedes <= 0 || plan.maxSedes >= 999) {
      return 'Sedes por definir';
    }
    return plan.maxSedes === 1 ? '1 sede comercial' : `Hasta ${plan.maxSedes} sedes con WhatsApp`;
  };

  const handlePagar = async () => {
    setErrorMensaje(null);
    setPaso('PROCESANDO');
    setProgresoTexto('Conectando de forma segura con Wompi...');

    /**
     * PASARELA REAL (VITE_USE_MOCK_GATEWAY=false):
     * Se solicita la creación de la orden en el backend (`/pagos/checkout`)
     * y se redirige automáticamente al usuario al checkout oficial de Wompi.
     */
    if (!USE_MOCK_GATEWAY) {
      try {
        await iniciarPago(negocioId, plan.id, cicloEfectivo);
        return;
      } catch (err: any) {
        setPaso('ERROR');
        setErrorMensaje(err.message || 'No fue posible iniciar el pago con Wompi.');
        return;
      }
    }

    /**
     * MODO SIMULACIÓN / MOCK (Desarrollo local):
     * Simula la latencia de red bancaria y procesa la transacción de prueba.
     */
    const timer1 = setTimeout(() => {
      setProgresoTexto('Verificando orden y conectando pasarela de prueba...');
    }, 700);

    const timer2 = setTimeout(() => {
      setProgresoTexto('Confirmando activación del plan con el servidor...');
    }, 1400);

    try {
      const resultado = await wompiService.procesarPago(
        {
          negocioId,
          plan,
          ciclo: cicloEfectivo,
          metodo: 'CARD',
          facturacion: {
            nombreCompleto: negocioNombre || 'Comercio Luka',
            email: 'cliente@ejemplo.com',
            telefono: '3000000000',
            tipoDocumento: 'CC',
            numeroDocumento: '123456789',
          },
        },
        simularError
      );

      clearTimeout(timer1);
      clearTimeout(timer2);
      setResultadoTransaccion(resultado);

      if (resultado.estado === 'APROBADA') {
        setPaso('EXITO');
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
        });
        if (onPaymentSuccess) {
          onPaymentSuccess(resultado);
        }
      } else {
        setPaso('ERROR');
        setErrorMensaje('La transacción de prueba fue rechazada.');
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setPaso('ERROR');
      setErrorMensaje(err.message || 'Error en la conexión con la pasarela.');
    }
  };

  const modalMaxWidth =
    paso === 'EXITO'
      ? 'max-w-[480px]'
      : paso === 'RESUMEN'
        ? 'max-w-2xl lg:max-w-3xl'
        : 'max-w-lg';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full ${modalMaxWidth} bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-6 transition-all duration-300`}
      >
        {/* ======================================================
            CABECERA DEL MODAL
        ====================================================== */}
        {paso !== 'EXITO' && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-lg text-[11px] font-black tracking-wider uppercase shadow-xs">
                <span className="text-emerald-400 dark:text-emerald-600">●</span> Wompi
              </div>
              <h3 className="text-base font-black text-foreground">
                Confirmar Suscripción
              </h3>
            </div>

            <button
              onClick={onClose}
              disabled={paso === 'PROCESANDO'}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-40"
              aria-label="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ======================================================
            CUERPO DEL MODAL
        ====================================================== */}
        <div className="p-6 sm:p-7">
          <AnimatePresence mode="wait">
            {/* 1. RESUMEN DE ORDEN Y CONFIRMACIÓN EN 2 COLUMNAS */}
            {paso === 'RESUMEN' && (
              <motion.div
                key="resumen"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start"
              >
                {/* COLUMNA 1: PLAN Y BENEFICIOS */}
                <div className="space-y-4">
                  {/* Tarjeta de Plan y Comercio */}
                  <div className="bg-muted/40 border border-border rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Plan Seleccionado
                      </span>
                      <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold rounded-full">
                        {cicloEfectivo === 'anual' ? 'Anual (-16%)' : 'Mensual'}
                      </span>
                    </div>
                    <h4 className="text-xl font-black text-foreground tracking-tight">
                      Plan {plan.nombre}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{negocioNombre || 'Comercio activo'}</span>
                    </p>
                  </div>

                  {/* Beneficios incluidos */}
                  <div className="space-y-2.5 bg-background border border-border/70 rounded-2xl p-4">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Beneficios incluidos hoy
                    </span>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{textoSedesPlan()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{MENSAJES_IA_POR_PLAN[plan.id] || 'Mensajes con IA incluidos'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Reportes avanzados y cuentas por cobrar</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground font-medium">
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Activación automática e inmediata</span>
                      </div>
                    </div>
                  </div>

                  {/* Nota de Seguridad */}
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-500/[0.06] border border-emerald-500/20 text-[11px] text-muted-foreground leading-relaxed">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span>
                      Pago cifrado bajo <strong>PCI-DSS Nivel 1</strong>. Luka nunca solicita ni almacena los números de tu tarjeta.
                    </span>
                  </div>
                </div>

                {/* COLUMNA 2: DESGLOSE FINANCIERO Y PAGO */}
                <div className="space-y-4">
                  {/* Desglose Financiero */}
                  <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-2.5 text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Resumen del cobro
                    </span>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Base gravable:</span>
                      <span className="font-semibold text-foreground">
                        ${PRECIO_FORMATTER.format(liquidacion.baseGravable)} COP
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>IVA (19% Software SaaS):</span>
                      <span className="font-semibold text-foreground">
                        ${PRECIO_FORMATTER.format(liquidacion.iva)} COP
                      </span>
                    </div>
                    <div className="pt-2.5 border-t border-border flex items-baseline justify-between">
                      <span className="text-sm font-bold text-foreground">Total a Pagar:</span>
                      <div className="text-right">
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                          ${PRECIO_FORMATTER.format(liquidacion.total)}
                        </span>
                        <span className="text-[11px] font-bold text-muted-foreground ml-1">COP</span>
                      </div>
                    </div>
                  </div>

                  {/* Métodos Aceptados */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block text-center">
                      Medios aceptados en Wompi:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5 text-center">
                      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-muted/60 border border-border rounded-lg text-[11px] font-semibold text-foreground">
                        <CreditCard className="w-3.5 h-3.5 text-emerald-500" /> Tarjetas
                      </span>
                      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-muted/60 border border-border rounded-lg text-[11px] font-semibold text-foreground">
                        <Landmark className="w-3.5 h-3.5 text-cyan-500" /> PSE
                      </span>
                      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-muted/60 border border-border rounded-lg text-[11px] font-semibold text-foreground">
                        <Smartphone className="w-3.5 h-3.5 text-purple-500" /> Nequi
                      </span>
                      <span className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-muted/60 border border-border rounded-lg text-[11px] font-semibold text-foreground">
                        <Building2 className="w-3.5 h-3.5 text-amber-500" /> Bancolombia
                      </span>
                    </div>
                  </div>

                  {/* Switch de Sandbox si está en modo mock */}
                  {USE_MOCK_GATEWAY && (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-800 dark:text-amber-300">
                      <span className="font-semibold">Modo Sandbox (pruebas)</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={simularError}
                          onChange={(e) => setSimularError(e.target.checked)}
                          className="rounded accent-emerald-500"
                        />
                        <span>Simular rechazo</span>
                      </label>
                    </div>
                  )}

                  {/* Botón Principal de Acción */}
                  <button
                    type="button"
                    onClick={handlePagar}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] text-white font-black text-sm shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {USE_MOCK_GATEWAY
                        ? 'Simular Pago con Wompi ➔'
                        : 'Continuar al Pago Seguro con Wompi ➔'}
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* 2. PROCESANDO */}
            {paso === 'PROCESANDO' && (
              <motion.div
                key="procesando"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center animate-pulse">
                    <ShieldCheck className="w-8 h-8 text-emerald-500" />
                  </div>
                  <Loader2 className="w-16 h-16 text-emerald-500 animate-spin absolute inset-0 -m-0" />
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <h4 className="text-base font-black text-foreground">
                    Conectando con Wompi
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {progresoTexto}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 3. ÉXITO (MODO SIMULACIÓN) */}
            {paso === 'EXITO' && resultadoTransaccion && (
              <SubscriptionSuccessWizard
                plan={plan}
                ciclo={cicloEfectivo}
                montoTotal={montoTotal}
                negocioNombre={negocioNombre}
                resultadoTransaccion={resultadoTransaccion}
                onFinish={onClose}
              />
            )}

            {/* 4. ERROR */}
            {paso === 'ERROR' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
                  <AlertCircle className="w-7 h-7" />
                </div>

                <div className="space-y-1">
                  <h4 className="text-lg font-black text-foreground">
                    No pudimos procesar la orden
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    {errorMensaje || 'La pasarela no pudo completar la solicitud. Por favor intenta nuevamente.'}
                  </p>
                </div>

                <div className="flex gap-3 justify-center pt-2">
                  <button
                    type="button"
                    onClick={() => setPaso('RESUMEN')}
                    className="px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground text-xs font-bold transition-all cursor-pointer"
                  >
                    Volver al resumen
                  </button>
                  <button
                    type="button"
                    onClick={handlePagar}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Reintentar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
