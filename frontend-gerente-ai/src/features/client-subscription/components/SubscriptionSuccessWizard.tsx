import React, { useState } from 'react';
import { 
  Bot, 
  Building2, 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Mic, 
  Camera, 
  Layers, 
  DollarSign, 
  Check, 
  ShieldCheck,
  Zap,
  MessageCircle,
  LayoutDashboard
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { PlanBackend } from '@/shared/api/planesApi';
import { lukaWhatsappUrl } from '@/lib/whatsapp';
import { WompiTransactionResult } from '../types';

interface SubscriptionSuccessWizardProps {
  plan: PlanBackend;
  ciclo: 'mensual' | 'anual';
  montoTotal: number;
  negocioNombre?: string;
  resultadoTransaccion: WompiTransactionResult;
  onFinish: () => void;
}

const PRECIO_FORMATTER = new Intl.NumberFormat('es-CO');

export function SubscriptionSuccessWizard({
  plan,
  ciclo: _ciclo,
  montoTotal,
  negocioNombre = 'Tu Negocio',
  resultadoTransaccion: _resultadoTransaccion,
  onFinish,
}: SubscriptionSuccessWizardProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      id: 'ai-assistant',
      tag: 'IA 24/7 en WhatsApp',
      icon: Bot,
      accentGlow: 'bg-emerald-500/20',
      iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      title: 'Tu Asistente Luka AI 24/7',
      description: 'Automatiza el registro de ventas, gastos y consultas financieras usando lenguaje natural.',
      features: [
        { icon: Mic, text: 'Registro por notas de voz en WhatsApp' },
        { icon: Camera, text: 'Lectura inteligente de tickets y facturas' },
        { icon: Zap, text: `${plan.mensajesIa || 500} mensajes de IA al mes` },
      ],
      highlightPill: '🎙️ Notas de Voz & Fotos Activas',
    },
    {
      id: 'multisede',
      tag: 'Gestión Multisede',
      icon: Building2,
      accentGlow: 'bg-blue-500/20',
      iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30',
      title: 'Sucursales & Multisede',
      description: `Capacidad desbloqueada para administrar hasta ${plan.maxSedes || 4} sedes independientes con consolidado total.`,
      features: [
        { icon: Building2, text: `Hasta ${plan.maxSedes || 4} sucursales sincronizadas` },
        { icon: Layers, text: 'Métricas consolidadas o por sede en 1 clic' },
        { icon: ShieldCheck, text: 'Permisos para administradores y cajeros' },
      ],
      highlightPill: `🏢 ${plan.maxSedes || 4} Sedes Habilitadas`,
    },
    {
      id: 'analytics',
      tag: 'Flujo de Caja & Fiados',
      icon: TrendingUp,
      accentGlow: 'bg-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      title: 'Márgenes & Control de Fiados',
      description: 'Reportes automáticos de rentabilidad, productos top y seguimiento en tiempo real de cuentas por cobrar.',
      features: [
        { icon: TrendingUp, text: 'Cálculo de margen y balance diario' },
        { icon: DollarSign, text: 'Control y recordatorios de cobro a fiados' },
        { icon: Check, text: 'Exportación de informes contables' },
      ],
      highlightPill: '📈 Analítica de Rentabilidad Activa',
    },
  ];

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
    const url = lukaWhatsappUrl(`Hola Luka 👋, acabo de activar el Plan ${plan.nombre} para ${negocioNombre}.`);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const activeSlide = slides[currentSlide];
  const IconComponent = activeSlide.icon;

  return (
    <div className="w-full max-w-[460px] mx-auto flex flex-col justify-between h-full min-h-[440px] select-none p-1 sm:p-2">
      {/* 1. Header Compacto */}
      <div className="space-y-3 text-center">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Pago Aprobado • ${PRECIO_FORMATTER.format(montoTotal)} COP
          </div>
          
          <span className="text-[11px] font-mono font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
            {currentSlide + 1} de {slides.length}
          </span>
        </div>

        {/* Stepper Progress Bar */}
        <div className="grid grid-cols-3 gap-1.5 pt-1">
          {slides.map((_, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className="h-1.5 rounded-full overflow-hidden bg-muted cursor-pointer"
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

      {/* 2. Slide Central Animado (Card 1:1) */}
      <div className="relative my-auto py-2">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSlide.id}
            initial={{ opacity: 0, x: 22, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -22, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card/90 border border-border/80 rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden space-y-4"
          >
            {/* Glow sutil */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 ${activeSlide.accentGlow} rounded-full blur-2xl pointer-events-none`} />

            {/* Cabecera del Beneficio */}
            <div className="flex items-center gap-3.5">
              <div className={`w-11 h-11 rounded-2xl ${activeSlide.iconBg} border flex items-center justify-center shrink-0 shadow-sm`}>
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

            {/* Lista Compacta de Features */}
            <div className="space-y-2 pt-1 border-t border-border/50">
              {activeSlide.features.map((feat, fIdx) => {
                const FeatIcon = feat.icon;
                return (
                  <div key={fIdx} className="flex items-center gap-2 text-xs text-foreground font-medium">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0">
                      <FeatIcon className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="truncate">{feat.text}</span>
                  </div>
                );
              })}
            </div>

            {/* Highlight Pill */}
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

      {/* 3. Footer / Navegación y Acciones Rápidas */}
      <div className="space-y-2 pt-1">
        {currentSlide === slides.length - 1 ? (
          <div className="space-y-2">
            {/* Botones de acción directos Dashboard y WhatsApp */}
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
              <span>Ver Administrar Suscripción</span>
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
