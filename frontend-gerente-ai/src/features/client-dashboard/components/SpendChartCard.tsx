import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { DateDropdown } from "@/shared/components/ui/DateDropdown";

const data = [
  { name: "Ene", income: 2000, outcome: 1500 },
  { name: "Feb", income: 3000, outcome: 2200 },
  { name: "Mar", income: 2800, outcome: 2600 },
  { name: "Abr", income: 3500, outcome: 1800 },
  { name: "May", income: 2100, outcome: 3100 },
  { name: "Jun", income: 3800, outcome: 2900 },
  { name: "Jul", income: 4200, outcome: 2100 },
  { name: "Ago", income: 3100, outcome: 2800 },
];

export function SpendChartCard() {
  return (
    <div className="bg-muted/30 rounded-2xl p-6 border border-border flex flex-col h-full shadow-sm">
      <div className="mb-6 flex justify-between items-start gap-4">
        <p className="text-[15px] font-bold text-foreground leading-snug">
          Parece que has gastado más de<br />25 Millones COP en los últimos meses.
        </p>
        <DateDropdown />
      </div>

      <div className="flex flex-1">
        <div className="w-1/3 flex flex-col justify-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-sm font-bold text-muted-foreground">Ingresos</span>
            </div>
            <p className="text-xl font-black text-foreground tracking-tight">
              35.898.000 <span className="text-sm font-bold text-muted-foreground">COP</span>
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              <span className="text-sm font-bold text-muted-foreground">Egresos</span>
            </div>
            <p className="text-xl font-black text-foreground tracking-tight">
              25.093.000 <span className="text-sm font-bold text-muted-foreground">COP</span>
            </p>
          </div>
        </div>

        <div className="w-2/3 h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} barGap={2} barSize={8}>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontWeight: 600 }} dy={10} />
              <YAxis orientation="right" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--color-muted-foreground)", fontWeight: 600 }} tickFormatter={(v) => `${v / 1000}M`} width={30} dx={10} />
              <Tooltip cursor={{ fill: "var(--color-muted)", opacity: 0.2 }} contentStyle={{ backgroundColor: 'var(--color-card)', color: 'var(--color-foreground)', borderRadius: '8px', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 4, 4]} />
              <Bar dataKey="outcome" fill="var(--color-muted-foreground)" radius={[4, 4, 4, 4]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6">
        <p className="text-sm font-medium text-muted-foreground">
          Establece tu presupuesto para ahorrar<br />aproximadamente <span className="text-foreground font-bold">3.890.000 COP</span> en el próximo período.
        </p>
      </div>
    </div>
  );
}
