import React, { useState } from 'react';
import {
  Bot,
  Building2,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Layers,
  DollarSign,
  Check,
  ShieldCheck,
  Zap,
  MessageCircle,
  LayoutDashboard,
  FileSpreadsheet,
  BarChart3,
  Package,
  Headphones,
  Cpu,
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';

import {
  PlanBackend,
  MENSAJES_IA_POR_PLAN,
} from '@/shared/api/planesApi';

import { lukaWhatsappUrl } from '@/lib/whatsapp';
import { ResultadoTransaccionWompi } from '../types';

interface SubscriptionSuccessWizardProps {
  plan: PlanBackend;
  ciclo: 'mensual' | 'anual';
  montoTotal: number;
  negocioNombre?: string;
  resultadoTransaccion: ResultadoTransaccionWompi;
  onFinish: () => void;
}

const PRECIO_FORMATTER = new Intl.NumberFormat('es-CO');

export function SubscriptionSuccessWizard({
  plan,
  ciclo,
  montoTotal,
  negocioNombre = 'Tu Negocio',
  resultadoTransaccion: _resultadoTransaccion,
  onFinish,
}: SubscriptionSuccessWizardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  /**
   * Genera los slides dinámicos del carrusel con la información oficial exacta
   * acordada para cada uno de los 5 planes:
   *
   * 1. Plan Asistente ($0): 1 sede comercial, 100 msgs IA, reportes básicos.
   * 2. Plan Gerente ($39.900): 1 sede premium, 600 msgs IA, fiados, reportes avanzados.
   * 3. Plan Administrador ($79.900): hasta 3 sedes, 1.500 msgs IA, multisede, inventario inteligente, Excel, reportes avanzados.
   * 4. Plan Socio ($149.900): hasta 5 sedes, 3.000 msgs IA, IA predictiva, auditoría continua, soporte prioritario, Excel, reportes avanzados.
   * 5. Plan Corporativo (Cotizar): Sedes por definir, mensajes por definir, integraciones ERP/API, soporte VIP 24/7, reportes avanzados.
   *
   * CERO menciones de notas de voz, fotos o la palabra módulos.
   */
  const getSlides = () => {
    // =========================================================================
    // PLAN 2: GERENTE ($39.900/mes - 1 sede premium - 600 msgs IA)
    // =========================================================================
    if (plan.id === 2) {
      return [
        {
          id: 'gerente-ai',
          tag: 'Copiloto IA para tu Sede',
          icon: Bot,
          accentGlow: 'bg-emerald-500/20',
          iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          title: '600 Mensajes de IA al Mes',
          description: 'Tu asistente Luka AI listo en WhatsApp para registrar ventas, gastos y responder consultas.',
          features: [
            { icon: Zap, text: '600 mensajes de IA mensuales' },
            { icon: MessageSquare, text: 'Registro conversacional por WhatsApp' },
            { icon: Sparkles, text: 'Consultas de balance y caja en tiempo real' },
          ],
          highlightPill: '⚡ 600 Mensajes de IA Activos',
        },
        {
          id: 'gerente-sede',
          tag: '1 Sede Comercial Premium',
          icon: Building2,
          accentGlow: 'bg-blue-500/20',
          iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          title: 'Control Financiero para 1 Sede',
          description: 'Control de ingresos, egresos y flujo de caja real con base contable para tu negocio.',
          features: [
            { icon: Building2, text: '1 sede comercial conectada a WhatsApp' },
            { icon: Layers, text: 'Flujo de caja real en base caja' },
            { icon: ShieldCheck, text: 'Recomendaciones y analítica de margen' },
          ],
          highlightPill: '🏢 1 Sede Premium Habilitada',
        },
        {
          id: 'gerente-cartera',
          tag: 'Cuentas por Cobrar & Reportes',
          icon: TrendingUp,
          accentGlow: 'bg-amber-500/20',
          iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          title: 'Fiados & Reportes Avanzados',
          description: 'Gestión de cuentas por cobrar, seguimiento a deudores y reportes avanzados de ventas.',
          features: [
            { icon: DollarSign, text: 'Cuentas por Cobrar (control de fiados)' },
            { icon: BarChart3, text: 'Reportes avanzados por producto y período' },
            { icon: Check, text: 'Alertas y seguimiento de cobranza' },
          ],
          highlightPill: '📈 Reportes Avanzados Activos',
        },
      ];
    }

    // =========================================================================
    // PLAN 3: ADMINISTRADOR ($79.900/mes - Hasta 3 sedes - 1.500 msgs IA)
    // =========================================================================
    if (plan.id === 3) {
      return [
        {
          id: 'admin-ai',
          tag: 'Copiloto IA para Pymes',
          icon: Bot,
          accentGlow: 'bg-emerald-500/20',
          iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
          title: '1.500 Mensajes de IA al Mes',
          description: 'Capacidad ampliada para coordinar tus sucursales y finanzas en tiempo real por WhatsApp.',
          features: [
            { icon: Zap, text: '1.500 mensajes de IA mensuales' },
            { icon: MessageSquare, text: 'Consultas multi-sede en lenguaje natural' },
            { icon: Sparkles, text: 'Registro conversacional continuo 24/7' },
          ],
          highlightPill: '⚡ 1.500 Mensajes de IA Disponibles',
        },
        {
          id: 'admin-multisede',
          tag: 'Gestión Multi-Sede',
          icon: Building2,
          accentGlow: 'bg-blue-500/20',
          iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          title: 'Hasta 3 Sedes Comerciales',
          description: 'Sincroniza hasta 3 sucursales con números de WhatsApp independientes y panel centralizado.',
          features: [
            { icon: Building2, text: 'Hasta 3 sedes comerciales conectadas' },
            { icon: Layers, text: 'Multi-sede comparativa en 1 clic' },
            { icon: ShieldCheck, text: 'Roles de administrador y cajero' },
          ],
          highlightPill: '🏢 Hasta 3 Sedes Habilitadas',
        },
        {
          id: 'admin-operaciones',
          tag: 'Operaciones & Excel',
          icon: FileSpreadsheet,
          accentGlow: 'bg-amber-500/20',
          iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          title: 'Inventario & Exportación a Excel',
          description: 'Exporta tu libro contable oficial a Excel y administra inventario inteligente con fiados.',
          features: [
            { icon: FileSpreadsheet, text: 'Exportación a Excel en base caja' },
            { icon: Package, text: 'Inventario inteligente y control de stock' },
            { icon: DollarSign, text: 'Todo lo del plan Gerente (Fiados y Reportes avanzados)' },
          ],
          highlightPill: '📊 Exportación a Excel Habilitada',
        },
      ];
    }

    // =========================================================================
    // PLAN 4: SOCIO ($149.900/mes - Hasta 5 sedes - 3.000 msgs IA)
    // =========================================================================
    if (plan.id === 4) {
      return [
        {
          id: 'socio-ai',
          tag: 'IA Avanzada Predictiva',
          icon: Cpu,
          accentGlow: 'bg-purple-500/20',
          iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
          title: '3.000 Mensajes de IA al Mes',
          description: '3.000 mensajes mensuales para operaciones de alto volumen y proyecciones.',
          features: [
            { icon: Zap, text: '3.000 mensajes de IA mensuales' },
            { icon: Cpu, text: 'IA avanzada predictiva de flujo de caja' },
            { icon: Sparkles, text: 'Recomendaciones estratégicas proactivas' },
          ],
          highlightPill: '🚀 3.000 Mensajes de IA Activos',
        },
        {
          id: 'socio-multisede',
          tag: 'Escala Multi-Sede',
          icon: Building2,
          accentGlow: 'bg-blue-500/20',
          iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          title: 'Hasta 5 Sedes Comerciales',
          description: 'Consolidación directiva para cadenas y redes de hasta 5 sucursales simultáneas.',
          features: [
            { icon: Building2, text: 'Hasta 5 sedes comerciales con WhatsApp' },
            { icon: Layers, text: 'Tablero directivo consolidado' },
            { icon: Headphones, text: 'Soporte prioritario y preferente' },
          ],
          highlightPill: '🏢 Hasta 5 Sedes Habilitadas',
        },
        {
          id: 'socio-auditoria',
          tag: 'Auditoría Continua & Control',
          icon: TrendingUp,
          accentGlow: 'bg-amber-500/20',
          iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          title: 'Auditoría Continua de Negocio',
          description: 'Supervisión constante de márgenes, libro contable multisede en Excel y control de cartera.',
          features: [
            { icon: ShieldCheck, text: 'Auditoría continua de negocio en tiempo real' },
            { icon: FileSpreadsheet, text: 'Exportación contable a Excel de todas las sedes' },
            { icon: DollarSign, text: 'Control de fiados, inventario y reportes avanzados' },
          ],
          highlightPill: '👑 Plan Socio Activo',
        },
      ];
    }

    // =========================================================================
    // PLAN 5: CORPORATIVO (Cotizar - Sedes por definir - IA por definir)
    // =========================================================================
    if (plan.id === 5) {
      return [
        {
          id: 'corp-ai',
          tag: 'Solución Enterprise',
          icon: Bot,
          accentGlow: 'bg-purple-500/20',
          iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
          title: 'Mensajes de IA por Definir',
          description: 'Volumen de inteligencia artificial adaptado y dimensionado según la escala de tu empresa.',
          features: [
            { icon: Zap, text: 'Mensajes de IA por definir a convenir' },
            { icon: Cpu, text: 'Integraciones API y ERP personalizadas' },
            { icon: Headphones, text: 'Soporte 24/7 y atención VIP dedicada' },
          ],
          highlightPill: '🛡️ Soporte VIP & Enterprise',
        },
        {
          id: 'corp-sedes',
          tag: 'Infraestructura Corporativa',
          icon: Building2,
          accentGlow: 'bg-blue-500/20',
          iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
          title: 'Sedes por Definir',
          description: 'Despliegue escalable para el número de sucursales que requiera la operación de tu empresa.',
          features: [
            { icon: Building2, text: 'Sedes por definir y configurar a la medida' },
            { icon: Layers, text: 'Consolidación corporativa multi-empresa' },
            { icon: ShieldCheck, text: 'Acuerdo de nivel de servicio (SLA) dedicado' },
          ],
          highlightPill: '🏢 Sedes por Definir',
        },
        {
          id: 'corp-reports',
          tag: 'Estrategia & Auditoría',
          icon: TrendingUp,
          accentGlow: 'bg-amber-500/20',
          iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
          title: 'Reportes Avanzados Corporativos',
          description: 'Métricas a la medida, exportaciones contables masivas y acompañamiento dedicado.',
          features: [
            { icon: BarChart3, text: 'Reportes avanzados con tableros ejecutivos' },
            { icon: FileSpreadsheet, text: 'Exportaciones contables masivas y APIs' },
            { icon: Check, text: 'Acompañamiento directivo dedicado' },
          ],
          highlightPill: '💎 Solución Enterprise Activa',
        },
      ];
    }

    // =========================================================================
    // PLAN 1: ASISTENTE (Gratis - 1 sede - 100 msgs IA)
    // =========================================================================
    return [
      {
        id: 'asistente-ai',
        tag: 'IA Básica en WhatsApp',
        icon: Bot,
        accentGlow: 'bg-emerald-500/20',
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        title: '100 Mensajes de IA al Mes',
        description: 'Empieza a organizar tu negocio con Luka AI desde tu WhatsApp de forma conversacional.',
        features: [
          { icon: Zap, text: '100 mensajes de IA / mes' },
          { icon: MessageSquare, text: 'Registro de ventas y gastos por WhatsApp' },
          { icon: Sparkles, text: 'Consultas por WhatsApp' },
        ],
        highlightPill: '🤖 Plan Asistente Activo',
      },
      {
        id: 'asistente-reportes',
        tag: 'Control Financiero Esencial',
        icon: BarChart3,
        accentGlow: 'bg-blue-500/20',
        iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
        title: '1 Sede & Reportes Básicos',
        description: 'Control de caja diario para dar tus primeros pasos de orden financiero.',
        features: [
          { icon: Building2, text: '1 sede comercial con WhatsApp' },
          { icon: BarChart3, text: 'Reportes básicos de ingresos y egresos' },
          { icon: Check, text: 'Plan gratuito sin contratos ni vencimiento' },
        ],
        highlightPill: '📊 Reportes Básicos Habilitados',
      },
    ];
  };

  const slides = getSlides();

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onFinish();
      navigate('/manage-subscription');
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1);
    }
  };

  const handleGoDashboard = () => {
    onFinish();
    navigate('/');
  };

  const handleOpenWhatsApp = () => {
    const url = lukaWhatsappUrl(
      `Hola Luka 👋, acabo de activar el Plan ${plan.nombre} para ${negocioNombre}.`,
    );

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const activeSlide = slides[currentSlide];
  const IconComponent = activeSlide.icon;

  const textoCobroHeader = () => {
    if (montoTotal > 0) {
      const cicloTexto = ciclo === 'anual' ? 'Anual' : 'Mensual';
      return `Pago Aprobado • $${PRECIO_FORMATTER.format(montoTotal)} COP (${cicloTexto})`;
    }
    return `Plan ${plan.nombre} Activado`;
  };

  return (
    <div className="w-full max-w-[460px] mx-auto flex flex-col justify-between h-full min-h-[440px] select-none p-1 sm:p-2">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {textoCobroHeader()}
          </div>

          <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {currentSlide + 1} de {slides.length}
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="flex items-center gap-1.5 pt-1">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="flex-1 h-1.5 rounded-full overflow-hidden bg-muted cursor-pointer"
            >
              <div
                className={`h-full transition-all duration-300 ${
                  idx <= currentSlide
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 w-full'
                    : 'w-0'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Slide Central */}
      <div className="relative my-auto py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{
              opacity: 0,
              x: 22,
              scale: 0.97,
            }}
            animate={{
              opacity: 1,
              x: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              x: -22,
              scale: 0.97,
            }}
            transition={{
              duration: 0.24,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-4"
          >
            {/* Glow */}
            <div
              className={`absolute -top-12 -right-12 w-32 h-32 ${activeSlide.accentGlow} rounded-full blur-2xl pointer-events-none`}
            />

            {/* Cabecera */}
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-2xl ${activeSlide.iconBg} border flex items-center justify-center shrink-0 shadow-sm`}
              >
                <IconComponent className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                  {activeSlide.tag}
                </span>

                <h4 className="text-base sm:text-lg font-black text-foreground tracking-tight truncate">
                  {activeSlide.title}
                </h4>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {activeSlide.description}
            </p>

            {/* Features */}
            <div className="space-y-2 pt-1 border-t border-border/50">
              {activeSlide.features.map((feat, fIdx) => {
                const FeatIcon = feat.icon;

                return (
                  <div
                    key={fIdx}
                    className="flex items-center gap-2 text-xs text-foreground font-medium"
                  >
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <FeatIcon className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    </div>

                    <span className="truncate">{feat.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Highlight */}
            <div className="pt-2 flex items-center justify-between text-[11px] text-muted-foreground border-t border-border/40">
              <span className="font-semibold text-foreground/80 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />

                {activeSlide.highlightPill}
              </span>

              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                ✓ Desbloqueado
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="space-y-2 pt-1">
        {currentSlide === slides.length - 1 ? (
          <div className="space-y-2">
            {/* Dashboard + WhatsApp */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleGoDashboard}
                className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />

                <span>Ir al Dashboard</span>
              </button>

              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="py-2.5 px-3 bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-black text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5 fill-slate-950" />

                <span>Ir a WhatsApp</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="w-full py-2.5 bg-card hover:bg-muted text-foreground border border-border font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Ver Administrar suscripción</span>

              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-3.5 py-2.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />

                <span>Atrás</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Siguiente Beneficio</span>

              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}