import { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ReporteFinanciero, PeriodoTipo, DashboardTransactionItem } from '../types';
import { formatNumber } from '../utils/formatters';

interface SpendChartCardProps {
  metrics?: ReporteFinanciero;
  transactions?: DashboardTransactionItem[];
  periodo?: PeriodoTipo;
  isLoading?: boolean;
  sedeName?: string;
  isConsolidated?: boolean;
}

export function SpendChartCard({
  metrics,
  transactions = [],
  periodo = 'mensual',
  isLoading = false,
  sedeName,
  isConsolidated = false,
}: SpendChartCardProps) {
  const ingresosTotal = metrics?.ingresos?.total ?? 0;
  const egresosTotal = metrics?.egresos?.total ?? 0;

  // Adaptador de Datos 100% Real
  const chartData = useMemo(() => {
    // 1. Si estamos en modo consolidado con múltiples sedes, graficar la comparativa por sede
    if (metrics?.sedes && metrics.sedes.length > 1) {
      return metrics.sedes.map((s) => ({
        name: s.sede.nombre.length > 10 ? `${s.sede.nombre.slice(0, 9)}…` : s.sede.nombre,
        income: Math.round(s.ingresos.total / 1000),
        outcome: Math.round(s.egresos.total / 1000),
      }));
    }

    // 2. Si estamos en una sede específica o 1 sede, agrupar las transacciones reales en cubetas temporales
    if (periodo === 'diario') {
      const buckets = [
        { name: '00-08h', minH: 0, maxH: 8, income: 0, outcome: 0 },
        { name: '08-12h', minH: 8, maxH: 12, income: 0, outcome: 0 },
        { name: '12-16h', minH: 12, maxH: 16, income: 0, outcome: 0 },
        { name: '16-20h', minH: 16, maxH: 20, income: 0, outcome: 0 },
        { name: '20-24h', minH: 20, maxH: 24, income: 0, outcome: 0 },
      ];

      transactions.forEach((tx) => {
        const hour = new Date(tx.rawDate).getHours();
        const bucket = buckets.find((b) => hour >= b.minH && hour < b.maxH) || buckets[buckets.length - 1];
        if (tx.type === 'Gasto') {
          bucket.outcome += tx.amount;
        } else {
          bucket.income += tx.amount;
        }
      });

      return buckets.map((b) => ({
        name: b.name,
        income: Math.round(b.income / 1000),
        outcome: Math.round(b.outcome / 1000),
      }));
    }

    if (periodo === 'semanal') {
      const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      const weekBuckets: Record<string, { income: number; outcome: number }> = {};
      
      // Inicializar los últimos 7 días
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayKey = `${days[d.getDay()]} ${d.getDate()}`;
        weekBuckets[dayKey] = { income: 0, outcome: 0 };
      }

      transactions.forEach((tx) => {
        const d = new Date(tx.rawDate);
        const dayKey = `${days[d.getDay()]} ${d.getDate()}`;
        if (weekBuckets[dayKey]) {
          if (tx.type === 'Gasto') {
            weekBuckets[dayKey].outcome += tx.amount;
          } else {
            weekBuckets[dayKey].income += tx.amount;
          }
        }
      });

      return Object.entries(weekBuckets).map(([name, val]) => ({
        name,
        income: Math.round(val.income / 1000),
        outcome: Math.round(val.outcome / 1000),
      }));
    }

    // Mensual -> 4 Semanas reales del mes
    const weeks = [
      { name: 'Sem 1', minD: 1, maxD: 7, income: 0, outcome: 0 },
      { name: 'Sem 2', minD: 8, maxD: 14, income: 0, outcome: 0 },
      { name: 'Sem 3', minD: 15, maxD: 21, income: 0, outcome: 0 },
      { name: 'Sem 4', minD: 22, maxD: 31, income: 0, outcome: 0 },
    ];

    transactions.forEach((tx) => {
      const dayOfMonth = new Date(tx.rawDate).getDate();
      const week = weeks.find((w) => dayOfMonth >= w.minD && dayOfMonth <= w.maxD) || weeks[weeks.length - 1];
      if (tx.type === 'Gasto') {
        week.outcome += tx.amount;
      } else {
        week.income += tx.amount;
      }
    });

    return weeks.map((w) => ({
      name: w.name,
      income: Math.round(w.income / 1000),
      outcome: Math.round(w.outcome / 1000),
    }));
  }, [metrics, transactions, periodo]);

  const spendMessage =
    egresosTotal > 0
      ? `Has registrado ${formatNumber(egresosTotal)} COP en egresos durante este período.`
      : 'No has registrado gastos operativos en este período.';

  if (isLoading) {
    return (
      <div className="bg-muted/30 rounded-2xl p-6 border border-border flex flex-col h-full shadow-sm justify-between animate-in fade-in duration-300">
        <div>
          <div className="mb-6 space-y-1.5">
            <Skeleton width={260} height={18} />
            <Skeleton width={180} height={14} />
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-full sm:w-1/3 flex sm:flex-col justify-between sm:justify-center gap-4 sm:gap-6">
              <div className="space-y-1.5">
                <Skeleton width={80} height={14} />
                <Skeleton width={140} height={24} />
              </div>
              <div className="space-y-1.5">
                <Skeleton width={80} height={14} />
                <Skeleton width={140} height={24} />
              </div>
            </div>

            <div className="w-full sm:w-2/3 h-44 flex items-end justify-between gap-3 px-4 pb-2">
              <Skeleton className="h-28 flex-1 rounded-lg" />
              <Skeleton className="h-36 flex-1 rounded-lg" />
              <Skeleton className="h-20 flex-1 rounded-lg" />
              <Skeleton className="h-40 flex-1 rounded-lg" />
              <Skeleton className="h-24 flex-1 rounded-lg" />
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border/50">
          <Skeleton width={320} height={14} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/30 rounded-2xl p-6 border border-border flex flex-col h-full shadow-sm justify-between">
      <div>
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
          <div>
            <p className="text-[15px] font-bold text-foreground leading-snug">
              {spendMessage}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {metrics?.sedes && metrics.sedes.length > 1
                ? 'Desglose comparativo entre sucursales activas'
                : `Flujo transaccional real para ${sedeName || 'la sede seleccionada'}`}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="w-full sm:w-1/3 flex sm:flex-col justify-between sm:justify-center gap-4 sm:gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs sm:text-sm font-bold text-muted-foreground">Ingresos</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                {formatNumber(ingresosTotal)} <span className="text-xs sm:text-sm font-bold text-muted-foreground">COP</span>
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/40" />
                <span className="text-xs sm:text-sm font-bold text-muted-foreground">Egresos</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                {formatNumber(egresosTotal)} <span className="text-xs sm:text-sm font-bold text-muted-foreground">COP</span>
              </p>
            </div>
          </div>

          <div className="w-full sm:w-2/3 h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 0, bottom: 0, left: 0 }} barGap={4} barSize={12}>
                <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  orientation="right" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)', fontWeight: 600 }} 
                  tickFormatter={(v) => `${v}k`} 
                  width={35} 
                  dx={10} 
                />
                <Tooltip
                  cursor={{ fill: 'var(--color-muted)', opacity: 0.2 }}
                  formatter={(value: any) => [`${formatNumber(Number(value) * 1000)} COP`, '']}
                  contentStyle={{
                    backgroundColor: 'var(--color-card)',
                    color: 'var(--color-foreground)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Bar dataKey="income" name="Ingresos" fill="#10b981" radius={[4, 4, 4, 4]} />
                <Bar dataKey="outcome" name="Egresos" fill="var(--color-muted-foreground)" radius={[4, 4, 4, 4]} opacity={0.65} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-border/50">
        <p className="text-xs font-medium text-muted-foreground">
          Ventas de contado: <span className="text-foreground font-bold">{formatNumber(metrics?.ingresos?.ventasContado ?? 0)} COP</span> | Abonos de cartera: <span className="text-foreground font-bold">{formatNumber(metrics?.ingresos?.abonos ?? 0)} COP</span>
        </p>
      </div>
    </div>
  );
}
