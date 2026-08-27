import { Coins, Zap } from "lucide-react";

export function OpsMetrics() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Gross Margin Card */}
      <div className="bg-card rounded-2xl p-6 shadow-md border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-50 dark:bg-indigo-900/30 p-3 rounded-full text-indigo-500">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Margen Bruto de IA</p>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Rentabilidad vs costos de API</p>
            <div className="flex items-center gap-3">
              <p className="text-2xl font-black text-foreground tracking-tight">68%</p>
              <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Excelente</span>
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-emerald-600 font-bold">+2% este mes</p>
        </div>
      </div>

      {/* Response Time Card */}
      <div className="bg-card rounded-2xl p-6 shadow-md border border-border flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-rose-50 dark:bg-rose-900/30 p-3 rounded-full text-rose-500">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Tiempo de Respuesta</p>
            <p className="text-xs text-muted-foreground mb-1 font-medium">Recepción, procesamiento IA y respuesta</p>
            <p className="text-2xl font-black text-foreground tracking-tight">1.2s</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-emerald-600 font-bold">-0.3s (Mejora)</p>
          <p className="text-[10px] text-muted-foreground mt-1">Promedio en n8n</p>
        </div>
      </div>
    </div>
  );
}
