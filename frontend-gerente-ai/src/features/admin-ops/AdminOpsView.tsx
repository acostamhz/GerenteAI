import { SystemHealthChart } from "./components/SystemHealthChart";
import { OpsMetrics } from "./components/OpsMetrics";

export function AdminOpsView() {
  return (
    <div className="flex flex-col h-full">
      <h2 className="text-xl font-bold text-foreground mb-6">Sistema (Ops)</h2>
      <OpsMetrics />
      <SystemHealthChart />
    </div>
  );
}
