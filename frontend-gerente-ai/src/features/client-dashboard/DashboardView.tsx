import { Link } from "react-router";
import { Settings, Sparkles } from "lucide-react";
import { BalanceCard } from "./components/BalanceCard";
import { SpendChartCard } from "./components/SpendChartCard";
import { TransactionTable } from "./components/TransactionTable";

export function DashboardView() {
  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Detalles de Saldo</h1>
        
        <div className="flex items-center gap-3">
          <Link to="/subscription" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 rounded-lg text-sm font-bold text-emerald-700 dark:text-emerald-400 shadow-sm hover:from-emerald-500/20 hover:to-emerald-500/10 transition-colors">
            <Sparkles className="w-4 h-4" />
            Mejora tu Plan
          </Link>
          
          <div className="flex items-center bg-card border border-border rounded-lg shadow-sm">
            <button className="px-3 py-2 text-sm font-bold text-foreground/80 border-r border-border hover:bg-muted/50 flex items-center gap-2">
              Últimos meses <span className="text-muted-foreground text-[10px]">▼</span>
            </button>
            <button className="px-3 py-2 text-sm font-bold text-foreground/80 hover:bg-muted/50 flex items-center gap-2">
              Ene - Ago 2025 <span className="text-muted-foreground text-[10px]">▼</span>
            </button>
          </div>
          
          <button className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-bold text-foreground/80 shadow-sm hover:bg-muted/50 transition-colors">
            <Settings className="w-4 h-4 text-muted-foreground" />
            Gestionar Saldo
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 xl:col-span-5">
          <BalanceCard />
        </div>
        <div className="lg:col-span-6 xl:col-span-7">
          <SpendChartCard />
        </div>
      </div>

      {/* Transactions */}
      <TransactionTable />
    </div>
  );
}
