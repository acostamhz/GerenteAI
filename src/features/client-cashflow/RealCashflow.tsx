import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Search, Filter } from "lucide-react";
import { AREA_DATA, CASHFLOW_DATA } from "@/mocks";
import { fmt, ChartTooltip } from "@/shared/components/ui/ChartTooltip";
import { DateDropdown } from "@/shared/components/ui/DateDropdown";

export function RealCashflow() {
  const totalIngresos = CASHFLOW_DATA.filter((r) => r.tipo === "ingreso").reduce((s, r) => s + r.monto, 0);
  const totalGastos = CASHFLOW_DATA.filter((r) => r.tipo === "gasto").reduce((s, r) => s + Math.abs(r.monto), 0);
  const saldo = totalIngresos - totalGastos;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Chart Section */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 max-w-5xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-foreground">Evolución de Caja</h2>
          <DateDropdown value="30" />
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={AREA_DATA} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorGastos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value / 1000}k`} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "transparent", stroke: "currentColor", strokeDasharray: "4 4" }} />
              <Area type="monotone" dataKey="ventas" stroke="#059669" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)" />
              <Area type="monotone" dataKey="gastos" stroke="#e11d48" strokeWidth={3} fillOpacity={1} fill="url(#colorGastos)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-3 gap-5 max-w-5xl">
        <div className="bg-card border border-border rounded-2xl shadow-sm px-6 py-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Ingresos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-500">{fmt(totalIngresos)}</p>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">+5.2%</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-sm px-6 py-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Egresos</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-rose-600 dark:text-rose-500">{fmt(totalGastos)}</p>
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full">-2.1%</span>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl shadow-sm px-6 py-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Saldo Neto</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-foreground">{fmt(saldo)}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden max-w-5xl">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20">
          <div className="relative group">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Buscar transacción..." className="pl-9 pr-4 py-2 w-72 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm" />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-muted-foreground bg-card border border-border rounded-xl shadow-sm hover:text-foreground hover:bg-muted transition-colors">
            <Filter className="w-4 h-4" /> Filtros
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-6 py-4 w-24">Fecha</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-6 py-4">Concepto</th>
                <th className="text-left text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-6 py-4 w-36">Categoría</th>
                <th className="text-right text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-6 py-4 w-32">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CASHFLOW_DATA.map((row, i) => (
                <tr key={i} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-muted-foreground font-medium whitespace-nowrap">{row.fecha}</td>
                  <td className="px-6 py-4 text-sm text-foreground font-bold">{row.concepto}</td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                      row.categoria === 'Venta directa' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                      row.categoria === 'Operativo' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                      row.categoria === 'Personal' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                      'bg-muted text-muted-foreground border border-border'
                    }`}>
                      {row.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right tabular-nums">
                    <span className={`text-sm font-black ${row.tipo === "ingreso" ? "text-emerald-600 dark:text-emerald-500" : "text-rose-600 dark:text-rose-500"}`}>
                      {row.tipo === "ingreso" ? "+" : "−"}{fmt(row.monto)}
                    </span>
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
