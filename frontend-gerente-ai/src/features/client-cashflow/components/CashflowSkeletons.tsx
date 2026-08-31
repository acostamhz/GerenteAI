import { Skeleton } from "@/shared/components/ui/Skeleton";

/**
 * Esqueleto para la tarjeta de Evolución de Caja y Movimientos Reales.
 */
export function RealCashflowSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Chart Card Skeleton */}
      <div className="bg-card border border-border rounded-2xl shadow-sm p-6 max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-44 h-6 rounded-lg" />
          <Skeleton variant="button" className="w-36 h-9 rounded-xl" />
        </div>

        {/* Chart Area */}
        <Skeleton variant="rounded" className="h-64 w-full rounded-2xl" />
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden max-w-5xl">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 gap-4">
          <Skeleton variant="rounded" className="w-64 h-9 rounded-xl" />
          <Skeleton variant="text" className="w-24 h-4" />
        </div>

        <div className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/20 border border-border/50 gap-4"
            >
              <div className="flex items-center gap-3">
                <Skeleton variant="rounded" className="w-8 h-8 rounded-lg" />
                <div className="space-y-1">
                  <Skeleton variant="text" className="w-40 sm:w-56 h-4" />
                  <Skeleton variant="text" className="w-24 h-3" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton variant="rounded" className="w-16 h-6 rounded-full" />
                <Skeleton variant="text" className="w-20 h-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Esqueleto para la sección de Cuentas por Cobrar y Cartera de Clientes.
 */
export function PendingCashflowSkeleton() {
  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* 2 KPI Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl">
        <div className="bg-card border border-border rounded-2xl shadow-sm px-6 py-5 space-y-2">
          <Skeleton variant="text" className="w-36 h-3 uppercase" />
          <Skeleton variant="text" className="w-28 h-8 rounded-lg" />
        </div>

        <div className="bg-card border border-rose-500/20 rounded-2xl shadow-sm px-6 py-5 bg-rose-500/5 space-y-2">
          <Skeleton variant="text" className="w-32 h-3 uppercase" />
          <Skeleton variant="text" className="w-28 h-8 rounded-lg" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden max-w-5xl">
        <div className="p-4 border-b border-border flex items-center justify-between bg-muted/20 gap-4">
          <Skeleton variant="rounded" className="w-64 h-9 rounded-xl" />
          <Skeleton variant="text" className="w-24 h-4" />
        </div>

        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3.5 rounded-xl bg-muted/20 border border-border/50 gap-4"
            >
              <div className="space-y-1.5">
                <Skeleton variant="text" className="w-32 sm:w-44 h-4" />
                <Skeleton variant="text" className="w-20 h-3" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton variant="text" className="w-20 h-5" />
                <Skeleton variant="button" className="w-20 h-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Esqueleto completo para la vista de Flujo de Caja.
 */
export function CashflowViewSkeleton() {
  return (
    <div className="flex-1 overflow-auto pb-12 pr-4 min-w-0 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6 pt-1">
        <div className="space-y-2">
          <Skeleton variant="text" className="w-48 h-8 rounded-lg" />
          <Skeleton variant="text" className="w-72 sm:w-96 h-4" />
        </div>
      </div>

      {/* Banner Skeleton */}
      <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-muted/30 border border-border/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-start gap-4 sm:gap-5 w-full">
          <Skeleton variant="rounded" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shrink-0" />
          <div className="space-y-2 w-full max-w-xl">
            <Skeleton variant="rounded" className="w-44 h-5 rounded-full" />
            <Skeleton variant="text" className="w-3/4 h-6 rounded-lg" />
            <Skeleton variant="text" className="w-full h-4" />
          </div>
        </div>
        <Skeleton variant="button" className="w-36 h-10 rounded-xl shrink-0" />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7">
          <RealCashflowSkeleton />
        </div>

        <div className="xl:col-span-5">
          <PendingCashflowSkeleton />
        </div>
      </div>
    </div>
  );
}
