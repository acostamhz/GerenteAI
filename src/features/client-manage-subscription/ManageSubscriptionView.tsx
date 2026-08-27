import { Zap, History, ShieldCheck, CreditCard as CardIcon } from "lucide-react";
import { Link } from "react-router";

export function ManageSubscriptionView() {
  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Administrar Suscripción</h1>
          <p className="text-muted-foreground mt-1">Gestiona tus límites, método de pago e historial de facturación</p>
        </div>
      </div>

      {/* Hero Card - Current Subscription */}
      <div className="bg-card border border-emerald-500/20 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between mb-8 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 mb-6 md:mb-0">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-black text-foreground">Plan Gerente</h2>
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-emerald-500/20">
              Activo
            </span>
          </div>
          <p className="text-muted-foreground font-medium mb-4">
            Tu suscripción se renovará automáticamente el <strong className="text-foreground">15 de Septiembre, 2026</strong>.
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-foreground">79.900</span>
            <span className="text-sm font-bold text-muted-foreground">COP /mes</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10 shrink-0">
          <Link 
            to="/subscription"
            className="px-6 py-3 bg-card border border-border text-foreground font-bold rounded-xl hover:bg-muted transition-colors text-center"
          >
            Cambiar Plan
          </Link>
          <button className="px-6 py-3 bg-destructive/10 text-destructive font-bold rounded-xl hover:bg-destructive/20 transition-colors">
            Cancelar Suscripción
          </button>
        </div>
      </div>

      {/* Bento Grid layout for the details */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Usage Limits */}
        <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-foreground">Consumo de IA</h3>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black tracking-tighter">120</span>
              <span className="text-sm font-semibold text-muted-foreground mb-1">/ 500 msgs</span>
            </div>
            
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="w-[24%] h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
            </div>
            
            <p className="text-xs text-muted-foreground font-medium mt-3 text-center">
              Tu consumo se reinicia en 12 días
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <CardIcon className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground">Método de Pago</h3>
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer">
              Editar
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/20 mt-auto">
            <div className="w-12 h-8 bg-black rounded flex items-center justify-center shrink-0">
              <span className="text-white font-black italic text-xs">VISA</span>
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-foreground text-sm truncate">Visa terminada en 4242</p>
              <p className="text-xs text-muted-foreground">Expira en 12/26</p>
            </div>
            <div className="ml-auto shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-full max-h-[250px]">
          <div className="flex items-center justify-between mb-6 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <History className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground">Facturas</h3>
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer">
              Ver todo
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {[
              { date: "15 Ago 2025", amount: "79.900", status: "Pagado" },
              { date: "15 Jul 2025", amount: "79.900", status: "Pagado" },
              { date: "15 Jun 2025", amount: "79.900", status: "Pagado" },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-sm text-foreground">{invoice.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">${invoice.amount}</span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">PDF</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
