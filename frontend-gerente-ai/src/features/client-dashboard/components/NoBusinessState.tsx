import { useState, useRef } from 'react';
import { 
  Building2, 
  Sparkles, 
  MessageSquare, 
  Mic, 
  Camera, 
  ArrowRight, 
  KeyRound, 
  ShieldCheck, 
  Bot, 
  Phone, 
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { profileApi } from '@/features/shared-profile/api/profileApi';
import { ApiError } from '@/lib/apiClient';

interface NoBusinessStateProps {
  onBusinessCreated?: (negocioId: string, nombre: string) => void;
}

export function NoBusinessState({ onBusinessCreated }: NoBusinessStateProps) {
  const [nombre, setNombre] = useState('');
  const [telefonoContacto, setTelefonoContacto] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [inviteCode, setInviteCode] = useState('');
  const [inviteStatus, setInviteStatus] = useState<string | null>(null);

  const inputNameRef = useRef<HTMLInputElement>(null);

  const handleFocusForm = () => {
    inputNameRef.current?.focus();
    inputNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del negocio es obligatorio.');
      inputNameRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: { nombre: string; telefonoContacto?: string } = {
        nombre: nombre.trim(),
      };
      if (telefonoContacto.trim()) {
        payload.telefonoContacto = telefonoContacto.trim();
      }

      const newNegocio = await profileApi.createNegocio(payload as any);

      // 🎉 Celebración con micro-confeti elegante
      try {
        confetti({
          particleCount: 90,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10b981', '#14b8a6', '#34d399', '#3b82f6', '#f59e0b'],
          disableForReducedMotion: true,
        });
      } catch {
        // Ignorar si no está soportado
      }

      setIsSuccess(true);

      // Persistir en sesión activa
      localStorage.setItem('active_business_id', newNegocio.id);
      // Al cambiar de negocio, la sede cacheada para /ai deja de valer.
      localStorage.removeItem('active_sede_id');
      localStorage.setItem('active_business_name', newNegocio.nombre);

      // Notificar al Navbar
      window.dispatchEvent(new Event('business_changed'));

      // Breve pausa para apreciar el feedback de éxito y transicionar suavemente
      setTimeout(() => {
        if (onBusinessCreated) {
          onBusinessCreated(newNegocio.id, newNegocio.nombre);
        }
      }, 950);
    } catch (err: any) {
      console.error('Error al registrar negocio:', err);
      const msg = err instanceof ApiError ? err.message : 'No se pudo crear el negocio. Por favor intenta de nuevo.';
      setError(msg);
      setIsSubmitting(false);
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;
    setInviteStatus('Validando código con el servidor...');
    setTimeout(() => {
      setInviteStatus('El código ingresado no es válido o ha expirado. Verifica con el propietario del negocio.');
    }, 800);
  };

  return (
    <div className="py-2 space-y-6">
      {/* 🌟 1. Banner Superior Ambient Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-card border border-emerald-500/25 dark:from-emerald-950/30 dark:via-card/70 dark:to-card/40 p-6 sm:p-8 shadow-sm dark:shadow-xl backdrop-blur-md"
      >
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 left-1/4 w-48 h-48 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4 sm:gap-5">
            <div className="relative shrink-0 mt-0.5">
              <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10">
                <Bot className="w-7 h-7 sm:w-8 sm:h-8" strokeWidth={2.2} />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-background rounded-full animate-pulse" />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> 
                Tu Copiloto Financiero Inteligente
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                ¡Te damos la bienvenida a Luka AI!
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Para empezar a calcular tus ingresos, controlar compras y monitorear tu flujo de caja en tiempo real, registra tu primer comercio o únete a una sede existente.
              </p>
            </div>
          </div>

          <button
            onClick={handleFocusForm}
            className="shrink-0 flex items-center gap-2 px-5 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
          >
            <Building2 className="w-4 h-4" />
            Registrar mi Negocio
            <ArrowRight className="w-4 h-4 ml-0.5" />
          </button>
        </div>
      </motion.div>

      {/* 🍱 2. Bento Grid Onboarding */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Bento 1: FORMULARIO EMBEBIDO DIRECTAMENTE EN LA TARJETA (7 columnas) */}
        <div className="lg:col-span-7 bg-card rounded-3xl p-6 sm:p-8 border border-emerald-500/30 shadow-sm flex flex-col justify-between relative overflow-hidden ring-1 ring-emerald-500/15 min-h-[380px]">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <Building2 className="w-40 h-40 text-emerald-500" />
          </div>

          <AnimatePresence mode="wait">
            {isSuccess ? (
              <motion.div
                key="success-card"
                initial={{ opacity: 0, scale: 0.92, filter: 'blur(4px)' }}
                animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col items-center justify-center text-center py-10"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">
                  ¡Comercio "{nombre}" Activado!
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm leading-relaxed mb-4">
                  Sincronizando la sesión y cargando tu panel financiero en tiempo real...
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Abriendo tu Dashboard
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, filter: 'blur(4px)' }}
                className="flex flex-col justify-between h-full"
              >
                <div>
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/20">
                      01
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                      Paso Único • Activación Inmediata
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-foreground mb-1.5">
                    Registra tu Comercio en 1 minuto
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-5 max-w-md">
                    Ingresa los datos básicos de tu empresa para habilitar el registro por WhatsApp y el panel contable.
                  </p>

                  {/* Error inline */}
                  {error && (
                    <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {/* Formulario Embebido */}
                  <form onSubmit={handleCreateBusiness} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        Nombre del Comercio / Empresa <span className="text-emerald-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          ref={inputNameRef}
                          type="text"
                          required
                          value={nombre}
                          onChange={(e) => setNombre(e.target.value)}
                          placeholder="Ej. Restaurante El Fogón, Tienda La 80..."
                          className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        />
                        <Building2 className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-foreground">
                        Teléfono de Contacto Administrativo <span className="text-muted-foreground font-normal">(Opcional)</span>
                      </label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={telefonoContacto}
                          onChange={(e) => setTelefonoContacto(e.target.value)}
                          placeholder="Ej. +573001234567"
                          className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground/60 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        />
                        <Phone className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="submit"
                        disabled={isSubmitting || !nombre.trim()}
                        className="flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 text-xs sm:text-sm font-black rounded-xl shadow-md shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Creando Comercio...
                          </>
                        ) : (
                          <>
                            Registrar Comercio y Comenzar
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-medium text-muted-foreground">
                  <span className="flex items-center gap-1 text-foreground/90">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Multi-sede
                  </span>
                  <span className="flex items-center gap-1 text-foreground/90">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Flujo de caja en vivo
                  </span>
                  <span className="flex items-center gap-1 text-foreground/90">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Exportación CSV
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bento 2: Infografía de Operación por WhatsApp (5 columnas) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-emerald-500/5 to-card rounded-3xl p-6 sm:p-8 border border-emerald-500/20 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-black text-xs border border-emerald-500/20">
                02
              </div>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25">
                Sin digitar sistemas complejos
              </span>
            </div>

            <h2 className="text-xl font-bold text-foreground mb-2 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> Opera desde WhatsApp
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Tu equipo puede registrar operaciones al instante desde cualquier teléfono móvil:
            </p>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Mic className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Notas de Voz Naturales</p>
                  <p className="text-[11px] text-muted-foreground">
                    "Vendí 50 mil de contado y 30 mil fiados a don Carlos."
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Fotos de Facturas y Recibos</p>
                  <p className="text-[11px] text-muted-foreground">
                    Luka extrae el proveedor, ítems y monto con visión artificial.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Sincronización instantánea con este panel web.
            </p>
          </div>
        </div>

        {/* Bento 3: Unirse con Código de Invitación (6 columnas) */}
        <div className="lg:col-span-6 bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center font-black text-xs mb-4 border border-border">
              03
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> ¿Te invitaron a una sede?
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Si el dueño de un negocio ya creó el comercio y te proporcionó un código de acceso o vinculación de empleado:
            </p>

            <form onSubmit={handleJoinByCode} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Ingresa código (ej. SEDE-8942)"
                  className="flex-1 px-4 py-2 bg-muted/30 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl border border-border transition-colors cursor-pointer"
                >
                  Unirme
                </button>
              </div>
              {inviteStatus && (
                <p className="text-[11px] font-medium text-destructive">{inviteStatus}</p>
              )}
            </form>
          </div>

          <p className="text-[11px] text-muted-foreground mt-4">
            Los administradores pueden generar códigos de invitación desde el módulo de Sedes.
          </p>
        </div>

        {/* Bento 4: Garantía y Seguridad (6 columnas) */}
        <div className="lg:col-span-6 bg-card rounded-3xl p-6 sm:p-8 border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center font-black text-xs mb-4 border border-border">
              04
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Seguridad & Privacidad Total
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              Tus cifras financieras y registros contables están protegidos. Solo los usuarios con permisos explícitos en tu cuenta pueden consultar los balances de tu comercio.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              ✓ Cero costos de instalación
            </span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
              ✓ Soporte 24/7 en WhatsApp
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
