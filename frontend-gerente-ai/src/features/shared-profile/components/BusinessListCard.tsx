import { Building2, Plus, ExternalLink, Settings2, BarChart3, Bot } from "lucide-react";

export function BusinessListCard({ isAdmin }: { isAdmin: boolean }) {
  if (isAdmin) {
    return (
      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-full relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10" />
        
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-6 relative z-10">
          <Building2 className="w-5 h-5 text-emerald-500" />
          Nuestra Empresa
        </h2>
        
        <div className="flex-1 flex flex-col justify-center relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-400 flex items-center justify-center shadow-lg">
              <Bot className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight text-foreground">Gerente AI</h3>
              <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Sede Principal</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-muted/30 border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Clientes Activos</p>
              <p className="text-lg font-black text-foreground">42</p>
            </div>
            <div className="bg-muted/30 border border-border rounded-xl p-3">
              <p className="text-xs text-muted-foreground font-semibold mb-1">Ingresos MRR</p>
              <p className="text-lg font-black text-foreground">$12.5k</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Client view
  const businesses = [
    { id: 1, name: "El Virrey", role: "Propietario", active: true },
    { id: 2, name: "La Candelaria", role: "Gerente", active: false }
  ];

  return (
    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-500" />
            Mis Negocios
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Sedes y empresas administradas</p>
        </div>
        
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors cursor-pointer">
          <Plus className="w-4 h-4" />
          Añadir Negocio
        </button>
      </div>

      <div className="flex-1 space-y-3">
        {businesses.map((business) => (
          <div key={business.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-muted/10 hover:bg-muted/30 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm">
                <BarChart3 className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  {business.name}
                  {business.active && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Negocio Activo" />
                  )}
                </h3>
                <p className="text-xs font-medium text-muted-foreground">{business.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer" title="Configuración del Negocio">
                <Settings2 className="w-4 h-4" />
              </button>
              <button className="p-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors cursor-pointer" title="Abrir Dashboard">
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
