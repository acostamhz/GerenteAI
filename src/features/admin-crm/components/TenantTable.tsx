import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";

const MOCK_TENANTS = [
  { id: 1, name: "El Virrey", status: "active", plan: "Pro", mrr: 50, lastActive: "Hace 5 min" },
  { id: 2, name: "Panadería La 80", status: "risk", plan: "Básico", mrr: 20, lastActive: "Hace 3 días" },
  { id: 3, name: "Ferretería Central", status: "active", plan: "Pro", mrr: 50, lastActive: "Hace 2 horas" },
  { id: 4, name: "Café del Parque", status: "inactive", plan: "Básico", mrr: 20, lastActive: "Hace 15 días" },
];

export function TenantTable() {
  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border">
        <h3 className="font-bold text-foreground">Listado de Negocios</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Negocio</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Última Actividad</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Gestionar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {MOCK_TENANTS.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-bold text-foreground">{tenant.name}</td>
                <td className="px-6 py-4">
                  {tenant.status === "active" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"><CheckCircle2 className="w-3.5 h-3.5" /> Activo</span>}
                  {tenant.status === "risk" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><AlertCircle className="w-3.5 h-3.5" /> En Riesgo</span>}
                  {tenant.status === "inactive" && <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-muted text-muted-foreground"><AlertCircle className="w-3.5 h-3.5" /> Inactivo</span>}
                </td>
                <td className="px-6 py-4">
                  <span className="font-medium text-foreground">{tenant.plan}</span>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground font-medium">{tenant.lastActive}</td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
                    Gestionar <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
