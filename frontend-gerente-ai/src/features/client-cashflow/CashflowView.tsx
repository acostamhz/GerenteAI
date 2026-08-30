import { RealCashflow } from "./RealCashflow";
import { PendingCashflow } from "./PendingCashflow";

import { useDashboardMetrics } from "@/features/client-dashboard/hooks/useDashboardMetrics";
import { apiClient } from "@/lib/apiClient";

export function CashflowView() {
  const {
    fiados,
    isFiadosLoading,
    refreshFiados,
  } = useDashboardMetrics();

  const handleRegisterPayment = async (
    clienteId: string,
    ventaId: string,
    monto: number,
  ): Promise<void> => {
    await apiClient("/abonos", {
      method: "POST",
      body: JSON.stringify({
        clienteId,
        ventaId,
        monto,
      }),
    });

    await refreshFiados();
  };

  return (
    <div className="flex-1 overflow-auto pb-12 pr-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-8 pt-1">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Flujo de caja
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-7">
          <RealCashflow />
        </div>

        <div className="xl:col-span-5">
          <PendingCashflow
            fiados={fiados}
            isLoading={isFiadosLoading}
            onRegisterPayment={
              handleRegisterPayment
            }
          />
        </div>
      </div>
    </div>
  );
}