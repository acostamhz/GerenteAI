import { Link } from "react-router";
import { Wallet, Sparkles, ArrowLeft } from "lucide-react";
import { RealCashflow } from "./RealCashflow";
import { PendingCashflow } from "./PendingCashflow";
import { CashflowViewSkeleton } from "./components/CashflowSkeletons";
import { useDashboardMetrics } from "@/features/client-dashboard/hooks/useDashboardMetrics";
import { apiClient } from "@/lib/apiClient";
import { NoBusinessRedirectState } from "@/shared/components/states/NoBusinessRedirectState";

export function CashflowView() {
  const {
    metrics,
    transactions,
    fiados,
    isFiadosLoading,
    isLoading,
    isChartLoading,
    hasNoBusiness,
    periodo,
    setPeriodo,
    refreshFiados,
  } = useDashboardMetrics();

  const handleRegisterPayment = async (
    clienteId: string,
    ventaId: string,
    monto: number,
  ): Promise<void> => {
    await apiClient("/abonos", {
      method: "POST",
      body: JSON.stringify({
        clienteId,
        ventaId,
        monto,
      }),
    });

    await refreshFiados();
  };

  /*
   * 1. Estado de Carga con Esqueletos Shimmer de Alta Fidelidad
   */
  if (isLoading) {
    return <CashflowViewSkeleton />;
  }

  /*
   * 2. Estado cuando el usuario aún no tiene un negocio registrado
   */
  if (hasNoBusiness) {
    return (
      <div className="flex-1 overflow-auto pb-12 pr-4 min-w-0">
        <NoBusinessRedirectState
          title="Configura tu negocio para ver tu Flujo de Caja"
          description="Aún no tienes un comercio registrado. Registra tu negocio en la página principal para empezar a monitorear tus ingresos, egresos y cuentas por cobrar."
        />
      </div>
    );
  }

  /*
   * 3. Evaluación de si el negocio no tiene transacciones registradas aún
   */
  const hasNoData =
    (!transactions || transactions.length === 0) &&
    (!metrics || (
      (metrics.ingresos?.total ?? 0) === 0 &&
      (metrics.egresos?.total ?? 0) === 0 &&
      (fiados?.totales?.porCobrar ?? 0) === 0
    ));

  return (
    <div className="flex-1 overflow-auto pb-12 pr-4 min-w-0 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-6 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Flujo de caja
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Monitorea los ingresos reales, egresos operativos y cuentas pendientes de cobro en tiempo real.
          </p>
        </div>
      </div>

      {/* Aviso Inteligente cuando aún no hay datos ni transacciones */}
      {hasNoData && (
        <div className="mb-8 p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-card border border-emerald-500/25 shadow-sm relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
            <div className="flex items-start gap-4 sm:gap-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-500/20 ring-4 ring-emerald-500/10">
                <Wallet className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-2 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Control de Liquidez y Cartera
                </div>
                <h2 className="text-lg sm:text-xl font-black text-foreground tracking-tight">
                  Aún no tienes movimientos de caja registrados
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                  Registra tus primeras ventas o compras por WhatsApp con tu copiloto <strong className="text-foreground">Luka</strong>, o añade transacciones desde el panel para visualizar la evolución de tu saldo disponible y cuentas por cobrar.
                </p>

                {/* Chips informativos */}
                <div className="flex flex-wrap items-center gap-2 mt-3.5">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border text-[11px] font-semibold text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Ventas contado y abonos = Ingresos
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border text-[11px] font-semibold text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Compras y gastos = Egresos
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/80 border border-border text-[11px] font-semibold text-muted-foreground">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Ventas fiadas = Cuentas por cobrar
                  </span>
                </div>
              </div>
            </div>

            <Link
              to="/"
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ir al Resumen</span>
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7">
          <RealCashflow
            metrics={metrics}
            transactions={transactions}
            periodo={periodo}
            setPeriodo={setPeriodo}
            isLoading={isLoading}
            isChartLoading={isChartLoading}
          />
        </div>

        <div className="xl:col-span-5">
          <PendingCashflow
            fiados={fiados}
            isLoading={isFiadosLoading}
            onRegisterPayment={handleRegisterPayment}
          />
        </div>
      </div>
    </div>
  );
}