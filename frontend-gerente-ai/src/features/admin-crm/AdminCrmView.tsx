import { AdminMetrics } from "./components/AdminMetrics";
import { TenantTable } from "./components/TenantTable";

export function AdminCrmView() {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-foreground mb-6">Negocio (CRM)</h2>
      <AdminMetrics />
      <TenantTable />
    </div>
  );
}
