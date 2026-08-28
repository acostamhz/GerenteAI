import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Info, Bot, X, RefreshCw } from "lucide-react";

import { insightsApi, tiempoRelativo, type Insight } from "./api/insightsApi";

export function InsightsView() {
  const [items, setItems] = useState<Insight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setItems(await insightsApi.generate());
    } catch (e) {
      // Generar recomendaciones cuesta una llamada al modelo: si falla se dice
      // por qué y se deja reintentar a mano, en vez de reintentar en bucle.
      setError(
        e instanceof Error
          ? e.message
          : "No pudimos generar tus recomendaciones en este momento.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Aplicar y descartar son locales: el backend todavía no persiste el estado
  // de lectura de cada recomendación.
  const apply = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  const dismiss = (id: string) =>
    setItems((prev) => prev.filter((i) => i.id !== id));

  const iconCfg = {
    warning: {
      Icon: AlertTriangle,
      bg: "bg-[#F59E0B]/10",
      iconColor: "text-foreground",
      border: "border-[#F59E0B]/20",
    },
    success: {
      Icon: CheckCircle,
      bg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-500",
      border: "border-emerald-200 dark:border-emerald-800",
    },
    info: {
      Icon: Info,
      bg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-500",
      border: "border-cyan-200 dark:border-cyan-800",
    },
  };

  const unread = items.filter((i) => !i.read).length;

  return (
    <div className="flex-1 overflow-auto pb-8 pr-4">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">
            Recomendaciones de IA
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-1">
            {isLoading
              ? "Analizando tu negocio…"
              : `${unread} alertas sin leer · ${items.length} total`}
          </p>
        </div>
        <button
          onClick={() => void cargar()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} strokeWidth={2} />
          Actualizar
        </button>
      </div>

      <div className="max-w-2xl flex flex-col gap-3">
        {isLoading &&
          [0, 1, 2].map((i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-2xl shadow-sm p-6 animate-pulse"
            >
              <div className="flex gap-4">
                <div className="w-9 h-9 rounded-xl bg-muted shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-4/5" />
                </div>
              </div>
            </div>
          ))}

        {!isLoading && error && (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 text-center">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-amber-500" strokeWidth={1.5} />
            <p className="text-sm font-bold text-foreground">
              No pudimos generar tus recomendaciones
            </p>
            <p className="text-xs mt-1 text-muted-foreground">{error}</p>
            <button
              onClick={() => void cargar()}
              className="mt-4 px-4 py-2.5 rounded-xl text-sm font-bold text-foreground border border-border hover:bg-muted transition-all cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {!isLoading &&
          !error &&
          items.map((item, index) => {
            const { Icon, bg, iconColor, border } = iconCfg[item.type] ?? iconCfg.info;
            return (
              <div
                key={item.id}
                className={`bg-card border border-border rounded-2xl shadow-sm p-6 transition-all duration-300 animate-cascade ${
                  item.read ? "opacity-65" : "hover:bg-muted/30"
                }`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div className="flex gap-4">
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0 mt-0.5`}
                  >
                    <Icon className={`w-4 h-4 ${iconColor}`} strokeWidth={1.5} />
                  </div>

                  {/* Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 mb-2">
                      <p className="text-base font-bold text-foreground tracking-tight flex-1">
                        {item.title}
                      </p>
                      <div className="flex items-center gap-1.5 shrink-0 mt-1">
                        {!item.read && (
                          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />
                        )}
                        <span className="text-[11px] text-muted-foreground font-medium">
                          {tiempoRelativo(item.generatedAt)}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-2">{item.body}</p>
                    {item.action && (
                      <p className="text-sm text-foreground font-medium leading-relaxed mb-5">
                        👉 {item.action}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => apply(item.id)}
                        disabled={item.read}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all disabled:opacity-40 cursor-pointer"
                      >
                        <CheckCircle className="w-4 h-4" strokeWidth={2} />
                        Aplicar
                      </button>
                      <button
                        onClick={() => dismiss(item.id)}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-muted-foreground border border-border hover:bg-muted hover:text-foreground transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" strokeWidth={2} />
                        Descartar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

        {!isLoading && !error && items.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <Bot className="w-12 h-12 mx-auto mb-4 text-muted" strokeWidth={1} />
            <p className="text-sm font-bold text-foreground">Sin insights pendientes</p>
            <p className="text-xs mt-1 text-muted-foreground">
              Registra algunos movimientos y Luka empezará a darte recomendaciones
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
