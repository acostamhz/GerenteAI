import { Link } from "react-router";
import { Sparkles, RefreshCw, AlertTriangle, Building2, MapPin, Layers } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BalanceCard } from "./components/BalanceCard";
import { SpendChartCard } from "./components/SpendChartCard";
import { TransactionTable } from "./components/TransactionTable";
import { NoBusinessState } from "./components/NoBusinessState";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";
import { usePlanPermissions } from "@/shared/hooks/usePlanPermissions";
import { PlanLimitPaywallModal } from "@/shared/components/modals/PlanLimitPaywallModal";

export function DashboardView() {
  const {
    isPaywallOpen,
    paywallMotivo,
    paywallPlanRecomendadoId,
    catalogo,
    cerrarPaywall,
  } = usePlanPermissions();

  const {
    metrics,
    generalMetrics,
    transactions,
    isLoading,
    isChartLoading,
    isRefreshing,
    error,
    hasNoBusiness,
    refreshMetrics,
    periodo,
    setPeriodo,
    businessName,
    sedeName,
    sedeId,
    isConsolidated,
  } = useDashboardMetrics();

  return (
    <div className="pb-8">
      <AnimatePresence mode="wait">
        {hasNoBusiness && !isLoading ? (
          <motion.div
            key="no-business-onboarding"
            initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          >
            <NoBusinessState onBusinessCreated={() => refreshMetrics()} />
          </motion.div>
        ) : (
          <motion.div
            key="financial-dashboard-view"
            initial={{ opacity: 0, y: 25, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
            transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Header */}
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-black text-foreground tracking-tight">
                    Detalles de saldo
                  </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5 text-foreground bg-muted/60 px-2.5 py-0.5 rounded-lg border border-border">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{businessName}</span>
                  </span>
                  <span className="text-muted-foreground/40">/</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20">
                    {sedeId && sedeId !== 'all' ? (
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>{sedeName}</span>
                  </span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/subscription"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-400 shadow-sm hover:from-emerald-500/20 hover:to-emerald-500/10 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Mejora tu plan
                </Link>
                
                {/* Selector Segmentado Interactivo y Reactivo */}
                <div className="flex items-center bg-card border border-border rounded-lg shadow-sm p-0.5">
                  <button
                    onClick={() => setPeriodo('mensual')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      periodo === 'mensual'
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    Últimos meses <span className="text-[9px]">▼</span>
                  </button>
                  <button
                    onClick={() => setPeriodo('semanal')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      periodo === 'semanal'
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    Esta semana <span className="text-[9px]">▼</span>
                  </button>
                  <button
                    onClick={() => setPeriodo('diario')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                      periodo === 'diario'
                        ? "bg-foreground text-background shadow-xs"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                  >
                    Hoy <span className="text-[9px]">▼</span>
                  </button>
                </div>
                
                <button
                  onClick={refreshMetrics}
                  disabled={isRefreshing || isLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-bold text-foreground/80 shadow-sm hover:bg-muted/50 transition-colors cursor-pointer disabled:opacity-50"
                  title="Sincronizar saldo con el servidor"
                >
                  <RefreshCw className={`w-4 h-4 text-muted-foreground ${isRefreshing ? "animate-spin text-emerald-500" : ""}`} />
                  Gestionar saldo
                </button>
              </div>
            </motion.div>

            {/* Error Alert Banner */}
            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-between gap-4 text-destructive shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold">No se pudieron cargar los datos del Panel Financiero</p>
                    <p className="text-xs opacity-90">{error}</p>
                  </div>
                </div>
                <button
                  onClick={refreshMetrics}
                  className="px-3 py-1.5 rounded-lg bg-destructive text-destructive-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3 h-3" /> Reintentar
                </button>
              </div>
            )}

            {/* Main Grid */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6"
            >
              <div className="lg:col-span-6 xl:col-span-5">
                <BalanceCard metrics={generalMetrics} isLoading={isLoading} />
              </div>
              <div className="lg:col-span-6 xl:col-span-7">
                <SpendChartCard 
                  metrics={metrics} 
                  transactions={transactions}
                  periodo={periodo} 
                  isLoading={isLoading || isChartLoading} 
                  sedeName={sedeName}
                  isConsolidated={isConsolidated}
                />
              </div>
            </motion.div>

            {/* Transactions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.18 }}
            >
              <TransactionTable
                transactions={transactions}
                isLoading={isLoading}
                error={null}
                businessName={businessName}
                onRetry={refreshMetrics}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Paywall para cuando se alcanza el límite de comercios del plan */}
      <PlanLimitPaywallModal
        isOpen={isPaywallOpen}
        onClose={cerrarPaywall}
        motivo={paywallMotivo}
        planRecomendadoId={paywallPlanRecomendadoId}
        catalogo={catalogo}
        negocioNombre={businessName}
        onUpgradeSuccess={() => {
          refreshMetrics();
        }}
      />
    </div>
  );
}
