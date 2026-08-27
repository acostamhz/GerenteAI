import { useState } from "react";
import { Link } from "react-router";
import { Sparkles, RefreshCw, AlertTriangle, PlusCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BalanceCard } from "./components/BalanceCard";
import { SpendChartCard } from "./components/SpendChartCard";
import { TransactionTable } from "./components/TransactionTable";
import { NoBusinessState } from "./components/NoBusinessState";
import { CreateBusinessModal } from "./components/CreateBusinessModal";
import { useDashboardMetrics } from "./hooks/useDashboardMetrics";

export function DashboardView() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
                <h1 className="text-3xl font-black text-foreground tracking-tight">
                  Detalles de Saldo
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Monitoreo en tiempo real de ingresos, egresos y flujo de caja operativo.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-muted/40 hover:bg-muted/70 border border-border rounded-lg text-xs font-bold text-foreground transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-500" />
                  Nuevo Comercio
                </button>

                <Link
                  to="/subscription"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-400 shadow-sm hover:from-emerald-500/20 hover:to-emerald-500/10 transition-colors"
                >
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  Mejora tu Plan
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
                  Gestionar Saldo
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
                <SpendChartCard metrics={metrics} periodo={periodo} isLoading={isLoading || isChartLoading} />
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

      {/* Modal de Creación para cuando ya hay un negocio pero se desea agregar otro desde la cabecera */}
      <CreateBusinessModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refreshMetrics()}
      />
    </div>
  );
}
