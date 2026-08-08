import { Search, ArrowUp, ArrowDown, Download } from "lucide-react";

const TRANSACTIONS = [
  {
    id: 1,
    type: "Gasto",
    amount: "- 200.000 COP",
    usd: "",
    paymentMethod: "Tarjeta de Crédito",
    pmDetails: "**** 6969",
    status: "Exitoso",
    activity: "Enviando dinero a Sebastian Perez",
    personInitials: "S",
    personName: "Sebastian Perez",
    personBg: "bg-amber-500",
    date: "28 Ago, 2025 3:40 PM",
  },
  {
    id: 2,
    type: "Gasto",
    amount: "- 200.000 COP",
    usd: "",
    paymentMethod: "Giro",
    pmDetails: "**** 9830",
    status: "Exitoso",
    activity: "Enviando dinero a Alejandro Solarte",
    personInitials: "A",
    personName: "Alejandro Solarte",
    personBg: "bg-emerald-500",
    date: "28 Ago, 2025 3:40 PM",
  },
  {
    id: 3,
    type: "Venta",
    amount: "+ 1.500.000 COP",
    usd: "",
    paymentMethod: "Transferencia Bancaria",
    pmDetails: "**** 6663",
    status: "Exitoso",
    activity: "Recibiendo dinero de Angelica Marcillo",
    personAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    personName: "Angelica Marcillo",
    date: "28 Ago, 2025 3:40 PM",
  },
  {
    id: 4,
    type: "Venta",
    amount: "+ 2.500.000 COP",
    usd: "",
    paymentMethod: "PayPal",
    pmDetails: "@claristaj",
    status: "Exitoso",
    activity: "Pago por producto",
    personAvatar: "https://i.pravatar.cc/150?u=a042581f4e29026704c",
    personName: "Jose Daniel Arango",
    date: "28 Ago, 2025 3:40 PM",
  },
];

export function TransactionTable() {
  return (
    <div className="mt-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-foreground">Transacciones</h2>
          <div className="flex items-center bg-muted/30 rounded-lg p-1 border border-border">
            <button className="px-3 py-1 bg-card shadow-sm rounded text-sm font-bold text-foreground border border-border">
              Todas <span className="text-muted-foreground font-medium ml-1">150</span>
            </button>
            <button className="px-3 py-1 rounded text-sm font-bold text-muted-foreground hover:text-foreground">
              Ventas <span className="text-muted-foreground font-medium ml-1">15</span>
            </button>
            <button className="px-3 py-1 rounded text-sm font-bold text-muted-foreground hover:text-foreground">
              Gastos <span className="text-muted-foreground font-medium ml-1">5</span>
            </button>
            <button className="px-3 py-1 rounded text-sm font-bold text-muted-foreground hover:text-foreground">
              Convertidas <span className="text-muted-foreground font-medium ml-1">10</span>
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all border border-transparent hover:border-border">
            <Download className="w-4 h-4" /> Exportar
          </button>
          <div className="relative group">
            <input
              type="text"
              placeholder="Buscar"
              className="pl-9 pr-4 py-2 w-64 bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/30 border-b border-border">
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Tipo ↕</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Monto</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Método de Pago</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Descripción</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Persona</th>
              <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Fecha ↕</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {TRANSACTIONS.map((tx) => (
              <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${tx.type === 'Gasto' ? 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                      {tx.type === 'Gasto' ? <ArrowDown className="w-3 h-3" strokeWidth={3} /> : <ArrowUp className="w-3 h-3" strokeWidth={3} />}
                    </div>
                    <span className="text-sm font-bold text-foreground">{tx.type}</span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-black text-foreground">{tx.amount}</p>
                  {tx.usd && <p className="text-xs font-medium text-muted-foreground">{tx.usd}</p>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <p className="text-sm font-bold text-foreground">{tx.paymentMethod}</p>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-semibold text-foreground/80">{tx.activity}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="text-sm font-bold text-foreground">{tx.personName}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground/80">
                  {tx.date}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div className="px-6 py-4 border-t border-border text-center">
          <button className="text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400">
            Cargar Más ⌄
          </button>
        </div>
      </div>
    </div>
  );
}
