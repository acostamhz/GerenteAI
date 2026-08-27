import { Search, Clock, AlertTriangle } from "lucide-react";
import { fmt } from "@/shared/components/ui/ChartTooltip";

const PENDING_DATA = [
  { id: 1, fecha: "10 Jul", cliente: "Ferretería San José", monto: 1200000, diasRetraso: 5, estado: "vencido" },
  { id: 2, fecha: "15 Jul", cliente: "Distribuidora Central", monto: 4500000, diasRetraso: 0, estado: "al_dia" },
  { id: 3, fecha: "05 Jul", cliente: "Taller Hermanos", monto: 850000, diasRetraso: 10, estado: "critico" },
  { id: 4, fecha: "22 Jul", cliente: "Comercializadora XY", monto: 3200000, diasRetraso: -5, estado: "proximo" },
];

export function PendingCashflow() {
  const totalCobrar = PENDING_DATA.reduce((s, r) => s + r.monto, 0);
  const totalVencido = PENDING_DATA.filter(r => r.diasRetraso > 0).reduce((s, r) => s + r.monto, 0);

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-5 max-w-3xl">
        <div className="bg-card border border-border rounded-2xl shadow-sm px-6 py-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <Clock className="w-24 h-24" />
          </div>
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Total por Cobrar (En la calle)</p>
          <p className="text-3xl font-black tracking-tight text-foreground">{fmt(totalCobrar)}</p>
        </div>
        <div className="bg-card border border-rose-500/20 rounded-2xl shadow-sm px-6 py-5 bg-rose-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className="w-24 h-24 text-rose-500" />
          </div>
          <p className="text-[11px] font-bold text-rose-600 dark:text-rose-500 uppercase tracking-widest mb-3">Cartera Vencida</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black tracking-tight text-rose-600 dark:text-rose-500">{fmt(totalVencido)}</p>
            <AlertTriangle className="w-6 h-6 text-rose-500" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden max-w-5xl">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="relative group">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar cliente o factura..." className="pl-9 pr-4 py-2 w-72 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-36 whitespace-nowrap">Fecha Venc.</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Cliente / Deudor</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest w-40">Estado</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right w-32">Monto</th>
                <th className="px-6 py-4 text-[11px] font-bold text-muted-foreground uppercase tracking-widest text-right w-32">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {PENDING_DATA.map((row) => (
                <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-muted-foreground font-medium whitespace-nowrap">{row.fecha}</td>
                  <td className="px-6 py-4 text-sm font-bold text-foreground">{row.cliente}</td>
                  <td className="px-6 py-4">
                    {row.estado === "critico" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 whitespace-nowrap border border-rose-200 dark:border-rose-800"><Clock className="w-3 h-3" /> {row.diasRetraso} días mora</span>}
                    {row.estado === "vencido" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap border border-amber-200 dark:border-amber-800"><Clock className="w-3 h-3" /> {row.diasRetraso} días mora</span>}
                    {row.estado === "al_dia" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 whitespace-nowrap border border-emerald-200 dark:border-emerald-800">Vence hoy</span>}
                    {row.estado === "proximo" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 whitespace-nowrap border border-cyan-200 dark:border-cyan-800">En {Math.abs(row.diasRetraso)} días</span>}
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <span className="text-sm font-black text-foreground">{fmt(row.monto)}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select defaultValue="" className="w-full bg-card border border-border text-foreground text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer shadow-sm">
                      <option value="" disabled>Marcar pago...</option>
                      <option value="transfer">Transferencia</option>
                      <option value="cash">Efectivo</option>
                      <option value="card">Tarjeta</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
