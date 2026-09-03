import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface LiveStatusBadgeProps {
  lastUpdated?: Date | null;
  isRefreshing?: boolean;
  onManualRefresh?: () => void;
  className?: string;
}

export function LiveStatusBadge({
  lastUpdated,
  isRefreshing = false,
  onManualRefresh,
  className = "",
}: LiveStatusBadgeProps) {
  const [timeAgo, setTimeAgo] = useState<string>("hace un momento");

  useEffect(() => {
    if (!lastUpdated) return;

    const updateRelativeTime = () => {
      const seconds = Math.max(
        0,
        Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
      );

      if (seconds < 5) {
        setTimeAgo("hace un momento");
      } else if (seconds < 60) {
        setTimeAgo(`hace ${seconds}s`);
      } else {
        const minutes = Math.floor(seconds / 60);
        setTimeAgo(`hace ${minutes}m`);
      }
    };

    updateRelativeTime();
    const interval = setInterval(updateRelativeTime, 3000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card/80 dark:bg-card/60 backdrop-blur-md border border-border/80 shadow-xs text-xs font-medium ${className}`}
      title={
        lastUpdated
          ? `Última sincronización: ${lastUpdated.toLocaleTimeString()}`
          : "Sincronización en tiempo real activa"
      }
    >
      {/* Indicador de pulso verde en vivo */}
      <span className="relative flex h-2 w-2 shrink-0">
        <span
          className={`absolute inline-flex h-full w-full rounded-full bg-emerald-400 ${
            isRefreshing ? "animate-spin opacity-40" : "animate-ping opacity-75"
          }`}
        />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>

      <span className="text-foreground/90 font-bold tracking-tight select-none">
        En vivo
      </span>

      <span className="text-muted-foreground/70 hidden sm:inline select-none">
        • {isRefreshing ? "actualizando..." : timeAgo}
      </span>

      {onManualRefresh && (
        <button
          type="button"
          onClick={onManualRefresh}
          disabled={isRefreshing}
          className="ml-0.5 p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          title="Actualizar ahora"
        >
          <RefreshCw
            className={`w-3 h-3 ${isRefreshing ? "animate-spin text-emerald-500" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
