import { 
  ArrowUpRight, 
  Check, 
  CheckCheck, 
  Bot, 
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { motion } from 'motion/react';

interface TransactionEmptyStateProps {
  businessName?: string;
  whatsappNumber?: string;
}

export function TransactionEmptyState({ 
  businessName = 'tu negocio',
  whatsappNumber = '573043904488'
}: TransactionEmptyStateProps) {

  const handleOpenWhatsApp = (customPrompt?: string) => {
    const text = customPrompt || `Hola Luka 👋, quiero registrar una operación en ${businessName}.`;
    const cleanNumber = (whatsappNumber || '573043904488').replace(/[^0-9]/g, '');
    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
    
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 sm:p-8 bg-card/60 rounded-2xl border border-border shadow-xs">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* 📱 Columna Izquierda: Simulación Visual de Chat WhatsApp */}
        <motion.div 
          initial={{ opacity: 0, x: -15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 bg-muted/30 dark:bg-muted/10 border border-border/80 rounded-2xl p-5 shadow-xs relative overflow-hidden"
        >
          {/* Header del Chat */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border/60 text-xs font-semibold text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-card rounded-full" />
              </div>
              <div>
                <p className="font-bold text-foreground flex items-center gap-1.5">
                  Luka AI <Sparkles className="w-3 h-3 text-emerald-500" />
                </p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">En línea • WhatsApp Bot</p>
              </div>
            </div>
          </div>

          {/* Burbujas de Mensajes */}
          <div className="space-y-3 font-sans">
            {/* Mensaje del Usuario */}
            <div className="flex justify-end">
              <div className="max-w-[85%] bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-500/20 rounded-2xl rounded-tr-xs p-3 text-xs text-emerald-950 dark:text-emerald-100 shadow-xs">
                <p className="font-medium leading-relaxed">
                  Hola Luka, vendí $85.000 en efectivo de almuerzos
                </p>
                <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-800/70 dark:text-emerald-300/70 mt-1 font-mono">
                  <span>10:42 AM</span>
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            {/* Respuesta de Luka AI */}
            <div className="flex justify-start">
              <div className="max-w-[88%] bg-card border border-border/90 rounded-2xl rounded-tl-xs p-3 text-xs text-foreground shadow-xs">
                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Venta Registrada Exitosamente</span>
                </div>
                <p className="font-semibold text-foreground text-[13px] mb-0.5">
                  + $85.000 COP <span className="text-[11px] text-muted-foreground font-normal">(Contado / Efectivo)</span>
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Tu balance del día se ha actualizado a <strong className="text-foreground">$85.000 COP</strong>.
                </p>
                <div className="flex items-center justify-end text-[10px] text-muted-foreground mt-1.5 font-mono">
                  10:42 AM
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 🚀 Columna Derecha: Explicación y Llamado a la Acción hacia WhatsApp */}
        <motion.div 
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col justify-center space-y-5"
        >
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2.5">
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Registro 100% Autónomo
            </div>
            <h3 className="text-2xl font-black text-foreground tracking-tight">
              Tu libro contable está listo para operar
            </h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Envía una nota de voz o foto de factura a Luka por WhatsApp para registrar tu primera venta o gasto.
            </p>
          </div>

          {/* Botón Principal de WhatsApp */}
          <div>
            <button
              onClick={() => handleOpenWhatsApp()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] active:scale-98 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-slate-950" />
              Abrir WhatsApp de Luka AI
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
