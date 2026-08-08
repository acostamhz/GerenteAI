import React from "react";

export function KpiCard({
  label,
  value,
  change,
  sub,
  Icon,
  accent = false,
}: {
  label: string;
  value: string;
  change: number;
  sub: string;
  Icon: React.ElementType;
  accent?: boolean;
}) {
  const up = change >= 0;
  return (
    <div className="bg-glass backdrop-blur-xl border border-glass-border rounded-2xl shadow-glass p-6 flex flex-col gap-4 hover:bg-glass-hover transition-colors duration-300">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            accent ? "bg-primary/20 border border-primary/30 shadow-[0_0_15px_rgba(94,234,212,0.2)]" : "bg-glass border border-glass-border"
          }`}
        >
          <Icon className={`w-5 h-5 ${accent ? "text-primary" : "text-muted-foreground"}`} strokeWidth={2} />
        </div>
      </div>
      <div>
        <div className="flex items-end gap-3 mb-2">
          <p className="text-3xl font-bold text-foreground tracking-tight leading-none">{value}</p>
          <span
            className={`mb-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
              up ? "bg-success/20 text-success border-success/30" : "bg-destructive/20 text-destructive border-destructive/30"
            }`}
          >
            {up ? "▲" : "▼"} {Math.abs(change)}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </div>
    </div>
  );
}
