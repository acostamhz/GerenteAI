import React from 'react';
import { motion } from 'motion/react';
import { Wifi } from 'lucide-react';

interface InteractiveCreditCardProps {
  numero: string;
  nombreTitular: string;
  expiracion: string;
  isFocused?: boolean;
}

export function InteractiveCreditCard({
  numero,
  nombreTitular,
  expiracion,
}: InteractiveCreditCardProps) {
  // Detectar franquicia
  const limpiarNumero = numero.replace(/\s+/g, '');
  let franquicia: 'visa' | 'mastercard' | 'amex' | 'generic' = 'generic';

  if (limpiarNumero.startsWith('4')) {
    franquicia = 'visa';
  } else if (/^5[1-5]/.test(limpiarNumero)) {
    franquicia = 'mastercard';
  } else if (/^3[47]/.test(limpiarNumero)) {
    franquicia = 'amex';
  }

  // Formatear visualmente en bloques de 4
  const numeroFormateado = (numero || '•••• •••• •••• ••••').padEnd(19, '•');

  return (
    <motion.div
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative w-full max-w-[360px] h-[210px] mx-auto rounded-2xl p-6 text-white shadow-2xl overflow-hidden select-none bg-gradient-to-tr from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/30"
    >
      {/* Glow ambiental y reflejo */}
      <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -left-12 -bottom-12 w-40 h-40 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />
      
      {/* Marca de agua sutil */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Cabecera de la tarjeta: Chip + Contactless + Franquicia */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          {/* Chip EMV Dorado con micro-ranuras */}
          <div className="w-11 h-8 bg-gradient-to-tr from-amber-300 via-amber-200 to-yellow-400 rounded-md border border-amber-400/60 shadow-inner flex items-center justify-center p-1 relative overflow-hidden">
            <div className="w-full h-full border border-amber-500/40 rounded-[2px] grid grid-cols-2 gap-1">
              <div className="border-r border-amber-500/40" />
              <div />
            </div>
          </div>
          <Wifi className="w-5 h-5 text-emerald-400/80 rotate-90" />
        </div>

        {/* Logo de Franquicia */}
        <div className="text-right">
          {franquicia === 'visa' && (
            <span className="font-black italic text-xl tracking-wider text-white">
              VISA
            </span>
          )}
          {franquicia === 'mastercard' && (
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-red-500/90 shadow-sm" />
              <div className="w-6 h-6 rounded-full bg-amber-400/90 shadow-sm" />
            </div>
          )}
          {franquicia === 'amex' && (
            <span className="font-black text-xs uppercase tracking-widest bg-cyan-600 px-2 py-0.5 rounded text-white">
              AMEX
            </span>
          )}
          {franquicia === 'generic' && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400/70 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Wompi Pay
            </span>
          )}
        </div>
      </div>

      {/* Número de Tarjeta */}
      <div className="mt-7 mb-4 relative z-10">
        <div className="font-mono text-lg sm:text-xl font-bold tracking-[0.18em] text-white/95 drop-shadow-md">
          {numeroFormateado}
        </div>
      </div>

      {/* Pie de la tarjeta: Titular y Expiración */}
      <div className="flex items-end justify-between relative z-10 text-xs">
        <div className="max-w-[70%]">
          <span className="block text-[9px] uppercase tracking-wider text-emerald-300/60 font-medium mb-0.5">
            Titular
          </span>
          <span className="font-semibold tracking-wide uppercase truncate block text-white/90 text-sm">
            {nombreTitular || 'NOMBRE DEL TITULAR'}
          </span>
        </div>

        <div className="text-right">
          <span className="block text-[9px] uppercase tracking-wider text-emerald-300/60 font-medium mb-0.5">
            Expira
          </span>
          <span className="font-mono font-semibold tracking-wider text-white/90 text-sm">
            {expiracion || 'MM/AA'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
