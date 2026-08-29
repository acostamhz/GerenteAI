import React from 'react';
import { Smartphone, BellRing, ShieldCheck } from 'lucide-react';
import { DatosNequi } from '../types';

interface WompiNequiFormProps {
  nequi: DatosNequi;
  onChangeNequi: (value: string) => void;
}

export function WompiNequiForm({ nequi, onChangeNequi }: WompiNequiFormProps) {
  return (
    <div className="space-y-4">
      {/* Celular Nequi */}
      <div>
        <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
          <Smartphone className="w-3.5 h-3.5 text-purple-500" />
          Número de Celular Nequi
        </label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
            +57
          </span>
          <input
            type="tel"
            maxLength={10}
            placeholder="300 123 4567"
            value={nequi.telefonoNequi}
            onChange={(e) => onChangeNequi(e.target.value.replace(/[^\d]/g, ''))}
            className="w-full pl-12 pr-3.5 py-2.5 bg-background border border-border rounded-xl text-sm font-semibold tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 transition-all font-mono"
          />
        </div>
      </div>

      {/* Explicación de Notificación Push */}
      <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 text-xs space-y-3">
        <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold">
          <BellRing className="w-4 h-4 text-purple-500 animate-bounce" />
          ¿Cómo funciona el pago con Nequi?
        </div>
        <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground font-medium pl-1">
          <li>Ingresa tu número de celular registrado en Nequi.</li>
          <li>Haz clic en <strong>Pagar con Nequi</strong>.</li>
          <li>Abre la app de Nequi en tu celular y entra a la campana de notificaciones.</li>
          <li>Acepta el cobro dentro de los siguientes <strong>45 segundos</strong>.</li>
        </ol>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        <span>Pago procesado de forma instantánea por Wompi Bancolombia</span>
      </div>
    </div>
  );
}
