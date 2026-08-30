"use client";

import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownLeft,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { ReporteFinanciero } from "../types";
import { formatNumber } from "../utils/formatters";

interface BalanceCardProps {
  metrics?: ReporteFinanciero;
  goalTarget?: number | null;
  isLoading?: boolean;
  onSetGoal?: () => void;
}

interface TRMRecord {
  valor: string;
  unidad: string;
  vigenciadesde: string;
  vigenciahasta: string;
}

const TRM_API_URL =
  "https://www.datos.gov.co/resource/32sa-8pi3.json";

export function BalanceCard({
  metrics,
  goalTarget = null,
  isLoading,
  onSetGoal,
}: BalanceCardProps) {
  const balanceValue = metrics?.balance ?? 0;

  const hasGoal =
    typeof goalTarget === "number" && goalTarget > 0;

  const progressPercent = hasGoal
    ? Math.min(
        100,
        Math.max(
          0,
          Math.round((balanceValue / goalTarget) * 100)
        )
      )
    : 0;

  const remainingForGoal = hasGoal
    ? Math.max(0, goalTarget - balanceValue)
    : 0;

  const [trm, setTrm] = useState<TRMRecord | null>(null);
  const [trmLoading, setTrmLoading] = useState(true);
  const [trmError, setTrmError] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    let cancelled = false;

    const fetchTRM = async () => {
      try {
        setTrmLoading(true);
        setTrmError(false);

        const url =
          `${TRM_API_URL}?$order=vigenciadesde%20DESC&$limit=1`;

        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            `Error al consultar la TRM: ${response.status}`
          );
        }

        const data: TRMRecord[] = await response.json();

        if (!data.length) {
          throw new Error(
            "No se encontró información de TRM."
          );
        }

        if (!cancelled) {
          setTrm(data[0]);
        }
      } catch (error) {
        console.error("Error obteniendo la TRM:", error);

        if (!cancelled) {
          setTrm(null);
          setTrmError(true);
        }
      } finally {
        if (!cancelled) {
          setTrmLoading(false);
        }
      }
    };

    fetchTRM();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const updateCurrentDate = () => {
      setCurrentDate(new Date());
    };

    const now = new Date();

    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);

    const timeUntilMidnight =
      nextMidnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      updateCurrentDate();

      const dailyInterval = setInterval(
        updateCurrentDate,
        24 * 60 * 60 * 1000
      );

      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => {
      clearTimeout(midnightTimeout);
    };
  }, []);

  const trmValue =
    trm !== null ? Number(trm.valor) : null;

  const formattedTRM =
    trmValue !== null && Number.isFinite(trmValue)
      ? trmValue.toLocaleString("es-CO", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : null;

  const formattedCurrentDate =
    currentDate.toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col h-full justify-between animate-in fade-in duration-300">
        <div>
          <div className="space-y-2 mb-6">
            <Skeleton width={100} height={16} />
            <Skeleton width={200} height={36} />
            <Skeleton width={160} height={14} />
          </div>

          <div className="flex gap-3 mb-8">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 w-12 rounded-xl" />
          </div>
        </div>

        <div className="pt-4 border-t border-border/60 space-y-2">
          <div className="flex justify-between">
            <Skeleton width={120} height={14} />
            <Skeleton width={80} height={14} />
          </div>

          <Skeleton
            height={8}
            className="w-full rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl p-6 shadow-sm border border-border flex flex-col h-full justify-between animate-in fade-in duration-300">
      <div>
        <div className="flex items-center gap-4 mb-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">
              Saldo total
            </p>

            <p className="text-3xl font-black text-foreground tracking-tight transition-all">
              {formatNumber(balanceValue)}{" "}
              <span className="text-xl font-bold text-muted-foreground">
                COP
              </span>
            </p>

            <p className="text-xs font-medium text-muted-foreground mt-1">
              <span className="text-foreground font-bold">
                1 USD
              </span>{" "}
              ={" "}
              {trmLoading ? (
                <span className="inline-block w-16 h-3 bg-muted rounded animate-pulse" />
              ) : trmError || !formattedTRM ? (
                <span>No disponible</span>
              ) : (
                <>
                  {formattedTRM} COP
                  <span className="ml-1">
                    · TRM {formattedCurrentDate}
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <button
            type="button"
            onClick={() =>
              alert(
                "Registrar Venta rápida: Abre el módulo de ventas o escribe a Luka por WhatsApp."
              )
            }
            className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            Venta
          </button>

          <button
            type="button"
            onClick={() =>
              alert(
                "Registrar gasto rápido: Abre el módulo de gastos o envía la foto a Luka por WhatsApp."
              )
            }
            className="flex-1 bg-foreground hover:bg-foreground/90 text-background font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            Gasto
          </button>

          <button
            type="button"
            className="w-12 bg-foreground hover:bg-foreground/90 text-background py-3 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sección de Metas */}
      <div className="pt-4 border-t border-border/60">
        {hasGoal ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-foreground shrink-0 text-xs">
                Metas
              </span>

              <div className="flex flex-wrap items-center justify-end gap-2 text-xs ml-4 text-right">
                <span className="text-muted-foreground font-medium">
                  {formatNumber(remainingForGoal)} COP restantes
                </span>

                <span className="font-black text-foreground">
                  {formatNumber(balanceValue)} /{" "}
                  {formatNumber(goalTarget)}
                </span>
              </div>
            </div>

            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-foreground text-xs block">
                Metas financieras
              </span>

              <p className="text-[11px] text-muted-foreground mt-0.5">
                No tienes metas configuradas para este comercio.
              </p>
            </div>

            <button
              type="button"
              onClick={
                onSetGoal ||
                (() =>
                  alert(
                    "Próximamente podrás configurar y monitorear metas financieras mensuales en tu comercio."
                  ))
              }
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Establecer meta
            </button>
          </div>
        )}
      </div>
    </div>
  );
}