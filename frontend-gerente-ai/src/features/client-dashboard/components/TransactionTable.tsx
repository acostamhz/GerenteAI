import { useState } from "react";
import {
  Search,
  ArrowUp,
  ArrowDown,
  Download,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import { Skeleton } from "@/shared/components/ui/Skeleton";
import { DashboardTransactionItem } from "../types";
import { TransactionEmptyState } from "./TransactionEmptyState";

type TabType = "todas" | "ventas" | "gastos" | "convertidas";

interface TransactionTableProps {
  transactions?: DashboardTransactionItem[];
  isLoading?: boolean;
  error?: string | null;
  businessName?: string;
  onRetry?: () => void;
}

export function TransactionTable({
  transactions = [],
  isLoading = false,
  error = null,
  businessName,
  onRetry,
}: TransactionTableProps) {
  const [activeTab, setActiveTab] =
    useState<TabType>("todas");

  const [search, setSearch] = useState("");

  /*
   * ============================================================
   * FILTROS
   * ============================================================
   */

  const filtered = transactions.filter((tx) => {
    const matchesTab =
      activeTab === "todas"
        ? true
        : activeTab === "ventas"
          ? tx.type === "Venta"
          : activeTab === "gastos"
            ? tx.type === "Gasto"
            : tx.type === "Convertida";

    const normalizedSearch =
      search.toLowerCase().trim();

    const matchesSearch =
      tx.personName
        .toLowerCase()
        .includes(normalizedSearch) ||
      tx.activity
        .toLowerCase()
        .includes(normalizedSearch) ||
      tx.paymentMethod
        .toLowerCase()
        .includes(normalizedSearch) ||
      tx.amountFormatted
        .toLowerCase()
        .includes(normalizedSearch);

    return matchesTab && matchesSearch;
  });

  /*
   * ============================================================
   * CONTADORES
   * ============================================================
   */

  const countVentas = transactions.filter(
    (t) => t.type === "Venta",
  ).length;

  const countGastos = transactions.filter(
    (t) => t.type === "Gasto",
  ).length;

  const countConvertidas = transactions.filter(
    (t) => t.type === "Convertida",
  ).length;

  /*
   * ============================================================
   * EXPORTAR CSV
   * ============================================================
   */

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert(
        "No hay transacciones para exportar con los filtros seleccionados.",
      );

      return;
    }

    const headers = [
      "ID",
      "Tipo",
      "Monto (COP)",
      "Método de Pago",
      "Detalle",
      "Descripción",
      "Persona/Cliente",
      "Fecha",
    ];

    const rows = filtered.map((tx) => [
      tx.id,
      tx.type,
      tx.amount,
      `"${tx.paymentMethod}"`,
      `"${tx.pmDetails || ""}"`,
      `"${tx.activity}"`,
      `"${tx.personName}"`,
      `"${tx.date}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row) =>
          row.join(","),
        ),
      ].join("\n");

    const encodedUri =
      encodeURI(csvContent);

    const link =
      document.createElement("a");

    link.setAttribute(
      "href",
      encodedUri,
    );

    link.setAttribute(
      "download",
      `transacciones_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`,
    );

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <div className="mt-8 w-full min-w-0">
      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="flex flex-col gap-4 mb-4">
        {/* ====================================================
            TÍTULO + TABS
        ===================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
          <h2 className="text-xl font-bold text-foreground shrink-0">
            Transacciones
          </h2>

          {/* Tabs:
              En móvil pueden desplazarse horizontalmente
              sin provocar overflow en toda la página.
          */}

          <div className="w-full sm:w-auto min-w-0 overflow-x-auto scrollbar-thin">
            <div className="inline-flex items-center bg-muted/40 rounded-xl p-1 border border-border shadow-2xs min-w-max">
              <button
                type="button"
                onClick={() =>
                  setActiveTab("todas")
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "todas"
                    ? "bg-card shadow-xs text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Todas{" "}
                <span className="text-muted-foreground font-medium ml-1">
                  {transactions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("ventas")
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "ventas"
                    ? "bg-card shadow-xs text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Ventas{" "}
                <span className="text-muted-foreground font-medium ml-1">
                  {countVentas}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("gastos")
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "gastos"
                    ? "bg-card shadow-xs text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Gastos{" "}
                <span className="text-muted-foreground font-medium ml-1">
                  {countGastos}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("convertidas")
                }
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "convertidas"
                    ? "bg-card shadow-xs text-foreground border border-border"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                Convertidas{" "}
                <span className="text-muted-foreground font-medium ml-1">
                  {countConvertidas}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* ====================================================
            EXPORTAR + BUSCADOR
        ===================================================== */}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full">
          {/* Exportar */}

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={
              filtered.length === 0
            }
            className="flex items-center justify-center sm:justify-start gap-2 px-3 py-2 sm:py-1.5 rounded-lg text-sm font-bold text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all border border-transparent hover:border-border cursor-pointer disabled:opacity-40 w-full sm:w-auto shrink-0"
          >
            <Download className="w-4 h-4" />

            <span>Exportar</span>
          </button>

          {/* Buscador */}

          <div className="relative group w-full sm:w-64">
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Buscar por nombre, monto..."
              className="pl-9 pr-4 py-2 w-full bg-card border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-sm"
            />

            <Search
              className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2"
              strokeWidth={2.5}
            />
          </div>
        </div>
      </div>

      {/* ======================================================
          ERROR STATE
      ======================================================= */}

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-destructive text-sm font-medium">
          <div className="flex items-center gap-2 min-w-0">
            <AlertCircle className="w-5 h-5 shrink-0" />

            <span className="break-words">
              {error}
            </span>
          </div>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer text-xs shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />

              Reintentar
            </button>
          )}
        </div>
      )}

      {/* ======================================================
          EMPTY STATE
      ======================================================= */}

      {!isLoading &&
      transactions.length === 0 ? (
        <TransactionEmptyState
          businessName={businessName}
        />
      ) : (
        /*
         * ====================================================
         * TABLA
         *
         * IMPORTANTE:
         * El scroll horizontal vive AQUÍ y no en toda la página.
         * ====================================================
         */

        <div className="w-full min-w-0 bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-thin">
            <table className="w-full min-w-[900px] text-left border-collapse">
              {/* ==================================================
                  HEADER DE TABLA
              =================================================== */}

              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Tipo ↕
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Monto
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Método de Pago
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Descripción
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Persona
                  </th>

                  <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    Fecha ↕
                  </th>
                </tr>
              </thead>

              {/* ==================================================
                  BODY
              =================================================== */}

              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({
                    length: 5,
                  }).map((_, i) => (
                    <tr
                      key={i}
                      className="animate-in fade-in duration-300"
                    >
                      <td className="px-6 py-4">
                        <Skeleton
                          width={70}
                          height={20}
                          className="rounded-md"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <Skeleton
                          width={110}
                          height={20}
                          className="rounded-md"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <Skeleton
                          width={120}
                          height={18}
                          className="rounded-md"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <Skeleton
                          width={160}
                          height={18}
                          className="rounded-md"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <Skeleton
                          width={110}
                          height={18}
                          className="rounded-md"
                        />
                      </td>

                      <td className="px-6 py-4">
                        <Skeleton
                          width={90}
                          height={18}
                          className="rounded-md"
                        />
                      </td>
                    </tr>
                  ))
                ) : (
                  filtered.map((tx) => (
                    <tr
                      key={tx.id}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      {/* TIPO */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              tx.type === "Gasto"
                                ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            }`}
                          >
                            {tx.type ===
                            "Gasto" ? (
                              <ArrowDown
                                className="w-3 h-3"
                                strokeWidth={3}
                              />
                            ) : (
                              <ArrowUp
                                className="w-3 h-3"
                                strokeWidth={3}
                              />
                            )}
                          </div>

                          <span className="text-sm font-bold text-foreground">
                            {tx.type}
                          </span>
                        </div>
                      </td>

                      {/* MONTO */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p
                          className={`text-sm font-black ${
                            tx.type === "Gasto"
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-foreground"
                          }`}
                        >
                          {tx.amountFormatted}
                        </p>
                      </td>

                      {/* MÉTODO DE PAGO */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-foreground">
                          {tx.paymentMethod}
                        </p>

                        {tx.pmDetails && (
                          <p className="text-xs text-muted-foreground font-mono">
                            {tx.pmDetails}
                          </p>
                        )}
                      </td>

                      {/* DESCRIPCIÓN */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-foreground/80">
                          {tx.activity}
                        </span>
                      </td>

                      {/* PERSONA */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-foreground">
                          {tx.personName}
                        </span>
                      </td>

                      {/* FECHA */}

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground/80">
                        {tx.date}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ==================================================
              RESULTADO DE BÚSQUEDA VACÍO
          =================================================== */}

          {!isLoading &&
            filtered.length === 0 &&
            transactions.length > 0 && (
              <div className="py-12 px-6 text-center text-muted-foreground text-sm font-medium">
                No se encontraron
                transacciones que coincidan
                con tu búsqueda.
              </div>
            )}
        </div>
      )}
    </div>
  );
}