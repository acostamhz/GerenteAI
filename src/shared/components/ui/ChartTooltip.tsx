export const fmt = (n: number) =>
  new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(Math.abs(n));

export const ChartTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ dataKey: string; color: string; value: number }>;
  label?: string;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-xl px-4 py-3 text-sm">
      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">{label}</p>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2.5 mb-1 last:mb-0">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
          <span className="text-xs text-muted-foreground">{p.dataKey === "ventas" ? "Ventas" : "Gastos"}</span>
          <span className="ml-auto text-xs font-bold text-foreground tabular-nums">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};
