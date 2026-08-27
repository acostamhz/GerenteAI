import { Outlet } from "react-router";
import { Bot } from "lucide-react";

export function AdminDashboardLayout() {
  return (
    <div className="flex gap-6 h-[calc(100vh-140px)]">
      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 overflow-hidden">
        {/* Tab Content */}
        <div className="flex-1 overflow-auto bg-transparent">
          <Outlet />
        </div>
      </div>

      {/* Sidebar: Copilot IA */}
      <div className="w-80 bg-card rounded-2xl shadow-sm border border-border flex flex-col overflow-hidden shrink-0 h-full">
        <div className="p-4 border-b border-border bg-muted/30 flex items-center gap-2 shrink-0">
          <Bot className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Recomendaciones IA</h3>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-4 overflow-auto">
          {/* Mock Insight */}
          <div className="p-3 bg-muted/30 rounded-xl border border-border">
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground block mb-1">💡 Análisis listo</span>
              Todo funciona según lo esperado. Selecciona una vista para ver métricas específicas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
