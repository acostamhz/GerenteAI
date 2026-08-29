import React, { useState, useEffect } from 'react';
import { 
  X, 
  CreditCard, 
  Landmark, 
  Smartphone, 
  ShieldCheck, 
  Lock, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  RefreshCw,
  Building2,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { PlanBackend, CicloFacturacion } from '@/shared/api/planesApi';
import { 
  MetodoPagoWompi, 
  DatosFacturacion, 
  DatosTarjeta, 
  DatosPse, 
  DatosNequi, 
  ResultadoTransaccionWompi 
} from '../types';
import { wompiService } from '../services/wompiService';
import { InteractiveCreditCard } from './InteractiveCreditCard';
import { WompiPseForm } from './WompiPseForm';
import { WompiNequiForm } from './WompiNequiForm';
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
  const [metodo, setMetodo] = useState<MetodoPagoWompi>('CARD');
  const [paso, setPaso] = useState<'FORMULARIO' | 'PROCESANDO' | 'EXITO' | 'ERROR'>('FORMULARIO');
  const [progresoTexto, setProgresoTexto] = useState('Iniciando conexión segura...');
  const [resultadoTransaccion, setResultadoTransaccion] = useState<ResultadoTransaccionWompi | null>(null);
  const [simularError, setSimularError] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Estados del Formulario
  const [facturacion, setFacturacion] = useState<DatosFacturacion>({
    nombreCompleto: '',
    email: '',
    telefono: '',
    tipoDocumento: 'CC',
    numeroDocumento: '',
  });

  const [tarjeta, setTarjeta] = useState<DatosTarjeta>({
    numero: '',
    nombreTitular: '',
    expiracion: '',
    cvv: '',
    cuotas: 1,
  });

  const [pse, setPse] = useState<DatosPse>({
    bancoCodigo: '1007', // Bancolombia por defecto
    tipoPersona: '0',
  });

  const [nequi, setNequi] = useState<DatosNequi>({
    telefonoNequi: '',
  });

  // Reset al abrir
  useEffect(() => {
    if (isOpen) {
      setPaso('FORMULARIO');
      setFormError(null);
      setResultadoTransaccion(null);
    }
  }, [isOpen]);

  if (!isOpen || !plan) return null;

  const montoTotal = ciclo === 'anual' ? plan.precioAnual : plan.precioMensual;
  const liquidacion = wompiService.calcularLiquidacion(montoTotal, ciclo);

  const handleNumeroTarjetaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 16) val = val.substring(0, 16);
    const formateado = val.replace(/(\d{4})/g, '$1 ').trim();
    setTarjeta((prev) => ({ ...prev, numero: formateado }));
  };

  const handleExpiracionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.substring(0, 4);
    if (val.length >= 2) {
      val = `${val.substring(0, 2)}/${val.substring(2)}`;
    }
    setTarjeta((prev) => ({ ...prev, expiracion: val }));
  };

  const handlePagar = async () => {
    setFormError(null);

    // Validaciones básicas
    if (metodo === 'CARD') {
      const numSinEspacio = tarjeta.numero.replace(/\s+/g, '');
      if (numSinEspacio.length < 15) {
        setFormError('Por favor ingresa un número de tarjeta válido (15 o 16 dígitos).');
        return;
      }
      if (!tarjeta.nombreTitular.trim()) {
        setFormError('Por favor ingresa el nombre del titular de la tarjeta.');
        return;
      }
      if (tarjeta.expiracion.length < 5) {
        setFormError('Ingresa una fecha de expiración válida (MM/AA).');
        return;
      }
      if (tarjeta.cvv.length < 3) {
        setFormError('Ingresa un código de seguridad (CVV) válido.');
        return;
      }
    } else if (metodo === 'PSE') {
      if (!facturacion.nombreCompleto.trim()) {
        setFormError('Ingresa el nombre o razón social para PSE.');
        return;
      }
      if (!facturacion.email.includes('@')) {
        setFormError('Ingresa un correo electrónico válido registrado en PSE.');
        return;
      }
      if (!facturacion.numeroDocumento.trim()) {
        setFormError('Ingresa el número de documento de identificación.');
        return;
      }
    } else if (metodo === 'NEQUI') {
      if (nequi.telefonoNequi.length < 10) {
        setFormError('Ingresa un número de celular Nequi válido de 10 dígitos.');
        return;
      }
    }

    // Iniciar Paso de Procesamiento
    setPaso('PROCESANDO');
    setProgresoTexto('Conectando de forma segura con Wompi...');

    const timer1 = setTimeout(() => {
      setProgresoTexto('Tokenizando y validando con la entidad financiera...');
    }, 800);

    const timer2 = setTimeout(() => {
      setProgresoTexto('Verificando fondos y aplicando suscripción...');
    }, 1500);

    try {
      const resultado = await wompiService.procesarPago(
        {
          negocioId,
          plan,
          ciclo,
          metodo,
          facturacion,
          tarjeta,
          pse,
          nequi,
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
      }
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setPaso('ERROR');
      setFormError(err.message || 'Error en la conexión con la pasarela.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className={`relative w-full ${paso === 'EXITO' ? 'max-w-[480px]' : 'max-w-4xl'} bg-card border border-border rounded-3xl shadow-2xl overflow-hidden my-6 transition-all duration-300`}
      >
        {/* Cabecera del Modal */}
        {paso !== 'EXITO' && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-950 text-white dark:bg-white dark:text-slate-950 rounded-lg text-xs font-black tracking-wider uppercase">
                <span className="text-emerald-400 dark:text-emerald-600">●</span> Wompi
              </div>
              <div>
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest block">
                  Pasarela de Pagos
                </span>
                <span className="text-sm font-black text-foreground">
                  Suscripción Plan {plan.nombre} ({ciclo === 'anual' ? 'Anual -16%' : 'Mensual'})
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className={`p-5 ${paso === 'EXITO' ? 'sm:p-6' : 'md:p-8'}`}>
          <AnimatePresence mode="wait">
            {/* PASO 1: FORMULARIO DE CHECKOUT */}
            {paso === 'FORMULARIO' && (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8"
              >
                {/* Columna Izquierda: Métodos de Pago y Formularios (7 cols) */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Selector de Métodos Wompi */}
                  <div>
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
                      Selecciona tu Método de Pago
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setMetodo('CARD')}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          metodo === 'CARD'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                            : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <CreditCard className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-bold">Tarjeta</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodo('PSE')}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          metodo === 'PSE'
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                            : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <Landmark className="w-5 h-5 text-blue-500" />
                        <span className="text-xs font-bold">PSE</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMetodo('NEQUI')}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer ${
                          metodo === 'NEQUI'
                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-700 dark:text-purple-400 ring-2 ring-purple-500/20'
                            : 'bg-muted/20 border-border text-muted-foreground hover:text-foreground hover:bg-muted/40'
                        }`}
                      >
                        <Smartphone className="w-5 h-5 text-purple-500" />
                        <span className="text-xs font-bold">Nequi</span>
                      </button>
                    </div>
                  </div>

                  {/* Formulario según Método */}
                  {metodo === 'CARD' && (
                    <div className="space-y-4">
                      {/* Visualizador de Tarjeta de Crédito */}
                      <InteractiveCreditCard
                        numero={tarjeta.numero}
                        nombreTitular={tarjeta.nombreTitular}
                        expiracion={tarjeta.expiracion}
                      />

                      {/* Inputs de Tarjeta */}
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                            Número de Tarjeta
                          </label>
                          <input
                            type="text"
                            placeholder="4500 0000 0000 0000"
                            value={tarjeta.numero}
                            onChange={handleNumeroTarjetaChange}
                            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-mono tracking-wider font-semibold text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                            Nombre del Titular (como figura en el plástico)
                          </label>
                          <input
                            type="text"
                            placeholder="INVERSIONES PEREZ"
                            value={tarjeta.nombreTitular}
                            onChange={(e) => setTarjeta((prev) => ({ ...prev, nombreTitular: e.target.value.toUpperCase() }))}
                            className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold tracking-wide text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all uppercase"
                          />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                              Expiración
                            </label>
                            <input
                              type="text"
                              placeholder="MM/AA"
                              value={tarjeta.expiracion}
                              onChange={handleExpiracionChange}
                              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-mono font-semibold text-foreground text-center placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                              CVV / CVC
                            </label>
                            <input
                              type="password"
                              maxLength={4}
                              placeholder="123"
                              value={tarjeta.cvv}
                              onChange={(e) => setTarjeta((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-mono font-semibold text-foreground text-center placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                            />
                          </div>

                          <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                              Cuotas
                            </label>
                            <select
                              value={tarjeta.cuotas}
                              onChange={(e) => setTarjeta((prev) => ({ ...prev, cuotas: Number(e.target.value) }))}
                              className="w-full px-3 py-2.5 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer"
                            >
                              <option value={1}>1 cuota (Sin interés)</option>
                              <option value={3}>3 cuotas</option>
                              <option value={6}>6 cuotas</option>
                              <option value={12}>12 cuotas</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {metodo === 'PSE' && (
                    <WompiPseForm
                      facturacion={facturacion}
                      pse={pse}
                      onChangeFacturacion={(k, v) => setFacturacion((prev) => ({ ...prev, [k]: v }))}
                      onChangePse={(k, v) => setPse((prev) => ({ ...prev, [k]: v }))}
                    />
                  )}

                  {metodo === 'NEQUI' && (
                    <WompiNequiForm
                      nequi={nequi}
                      onChangeNequi={(v) => setNequi({ telefonoNequi: v })}
                    />
                  )}
                </div>

                {/* Columna Derecha: Resumen de Factura y Acción (5 cols) */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
                  {/* Tarjeta de Resumen */}
                  <div className="bg-muted/30 border border-border rounded-3xl p-6 space-y-4">
                    <div className="flex items-center justify-between border-b border-border/80 pb-3">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                          Comercio Asignado
                        </span>
                        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-emerald-500" />
                          {negocioNombre || 'Comercio Principal'}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                        Plan {plan.nombre}
                      </span>
                    </div>

                    {/* Desglose Financiero */}
                    <div className="space-y-2.5 text-xs">
                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span>Periodo de facturación:</span>
                        <span className="font-bold text-foreground capitalize">{ciclo}</span>
                      </div>

                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span>Base gravable subtotal:</span>
                        <span className="font-semibold text-foreground">
                          ${PRECIO_FORMATTER.format(liquidacion.baseGravable)} COP
                        </span>
                      </div>

                      <div className="flex justify-between text-muted-foreground font-medium">
                        <span>IVA (19% software SaaS):</span>
                        <span className="font-semibold text-foreground">
                          ${PRECIO_FORMATTER.format(liquidacion.iva)} COP
                        </span>
                      </div>

                      {ciclo === 'anual' && (
                        <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20">
                          <span className="flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5" /> Descuento Anual (16%):
                          </span>
                          <span>Aplicado</span>
                        </div>
                      )}

                      <div className="border-t border-border pt-3 mt-3 flex justify-between items-baseline">
                        <div>
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                            Total a Debitar
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium">
                            {ciclo === 'anual' ? 'Cobro anual recurrente' : 'Cobro mensual recurrente'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-2xl font-black text-foreground">
                            ${PRECIO_FORMATTER.format(liquidacion.total)}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground ml-1">COP</span>
                        </div>
                      </div>
                    </div>

                    {/* Simular Error (Para QA y Testing) */}
                    <div className="pt-2 border-t border-border/60">
                      <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={simularError}
                          onChange={(e) => setSimularError(e.target.checked)}
                          className="rounded border-border text-emerald-500 focus:ring-emerald-500/30"
                        />
                        <span>Simular rechazo de fondos (Prueba QA)</span>
                      </label>
                    </div>
                  </div>

                  {/* Mensaje de Error en Formulario */}
                  {formError && (
                    <div className="p-3.5 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-start gap-2.5 text-xs text-destructive font-medium">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Botón de Pago Principal */}
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handlePagar}
                      className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Lock className="w-4 h-4" />
                      <span>Pagar ${PRECIO_FORMATTER.format(montoTotal)} COP</span>
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[11px] font-medium text-muted-foreground">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Encriptación TLS 256-bit • Certificado PCI-DSS Nivel 1</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PASO 2: PROCESANDO TRANSACCIÓN */}
            {paso === 'PROCESANDO' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-16 text-center space-y-6 max-w-md mx-auto"
              >
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
                    <Loader2 className="w-9 h-9 text-white animate-spin" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-foreground">Procesando Pago</h3>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 animate-pulse">
                    {progresoTexto}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Por favor no cierres ni recargues esta ventana mientras confirmamos con la entidad emisora.
                  </p>
                </div>
              </motion.div>
            )}

            {/* PASO 3: ÉXITO - CARRUSEL / WIZARD DE BIENVENIDA */}
            {paso === 'EXITO' && resultadoTransaccion && (
              <motion.div
                key="success-wizard"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <SubscriptionSuccessWizard
                  plan={plan}
                  ciclo={ciclo}
                  montoTotal={montoTotal}
                  negocioNombre={negocioNombre}
                  resultadoTransaccion={resultadoTransaccion}
                  onFinish={onClose}
                />
              </motion.div>
            )}

            {/* PASO 4: ERROR / RECHAZO */}
            {paso === 'ERROR' && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="py-10 text-center space-y-6 max-w-md mx-auto"
              >
                <div className="w-20 h-20 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center mx-auto text-destructive">
                  <AlertCircle className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-black text-foreground">Transacción Declinada</h3>
                  <p className="text-xs text-muted-foreground">
                    {resultadoTransaccion?.mensaje || formError || 'La entidad financiera no pudo autorizar el cobro.'}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPaso('FORMULARIO')}
                    className="flex-1 py-3 bg-foreground text-background font-bold text-sm rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Intentar de Nuevo</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 border border-border text-foreground font-bold text-sm rounded-xl hover:bg-muted transition-colors cursor-pointer"
                  >
                    Cancelar
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
