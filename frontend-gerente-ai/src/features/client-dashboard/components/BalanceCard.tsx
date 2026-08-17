import { ArrowUpRight, ArrowDownLeft, MoreHorizontal, Pencil } from "lucide-react";

export function BalanceCard() {
  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Total</p>
          <p className="text-3xl font-black text-foreground tracking-tight">
            12.500.000 <span className="text-xl font-bold text-muted-foreground">COP</span>
          </p>
          <p className="text-xs font-medium text-muted-foreground mt-1">
            <span className="text-foreground font-bold">1 USD</span> = 4.150,50 COP, Al día de hoy
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <button className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <ArrowUpRight className="w-4 h-4" /> Venta
        </button>
        <button className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors">
          <ArrowDownLeft className="w-4 h-4" /> Gasto
        </button>
        <button className="w-12 bg-foreground hover:bg-foreground/90 text-background py-3 rounded-xl flex items-center justify-center transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-auto">
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-foreground shrink-0">Metas</span>
          <div className="flex flex-wrap items-center justify-end gap-3 text-sm ml-4 text-right">
            <span className="text-muted-foreground font-medium">3.500.000 COP restantes para alcanzar tus metas</span>
            <span className="font-black text-foreground">12.500 millones / 16.000 millones</span>
            <button className="text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 flex items-center gap-1 font-bold ml-1">
              <Pencil className="w-3 h-3" /> Editar
            </button>
          </div>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 rounded-full w-[78%]" />
        </div>
      </div>
    </div>
  );
}
