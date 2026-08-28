import { useEffect, useState } from "react";
import { ExternalLink, AlertCircle, CheckCircle2 } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

/** Lo que devuelve GET /negocios. */
interface Negocio {
  id: string;
  nombre: string;
  plan: number;
  planVenceEl: string | null;
  createdAt: string;
}

/** Lo que devuelve GET /planes (catálogo comercial). */
interface Plan {
  id: number;
  nombre: string;
  precioMensual: number;
}

type Estado = "active" | "risk" | "inactive";

interface Fila {
  id: string;
  name: string;
  status: Estado;
  plan: string;
  lastActive: string;
}

/**
 * El estado sale del vencimiento del plan, que es el único dato de actividad
 * que expone hoy el backend:
 *   sin fecha        -> plan gratuito vigente
 *   vence pronto     -> en riesgo (renovación a menos de 7 días)
 *   ya venció        -> inactivo
 */
function estadoDelPlan(venceEl: string | null): Estado {
  if (!venceEl) return "active";

  const dias = (new Date(venceEl).getTime() - Date.now()) / 86_400_000;
  if (dias < 0) return "inactive";
  if (dias <= 7) return "risk";
  return "active";
}

function textoVencimiento(venceEl: string | null, createdAt: string): string {
  if (!venceEl) {
    return `Alta ${new Date(createdAt).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" })}`;
  }

  const dias = Math.round((new Date(venceEl).getTime() - Date.now()) / 86_400_000);
  if (dias < 0) return `Venció hace ${Math.abs(dias)} días`;
  if (dias === 0) return "Vence hoy";
  return `Renueva en ${dias} días`;
}

export function TenantTable() {
  const [filas, setFilas] = useState<Fila[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    (async () => {
      try {
        // El catálogo traduce el plan (un número en la base) a su nombre
        // comercial. Se pide junto con los negocios para no hardcodearlo.
        const [negocios, planes] = await Promise.all([
          apiClient<Negocio[]>("/negocios"),
          apiClient<Plan[]>("/planes"),
        ]);

        if (cancelado) return;

        const nombrePlan = new Map(planes.map((p) => [p.id, p.nombre]));

        setFilas(
          negocios.map((n) => ({
            id: n.id,
            name: n.nombre,
            status: estadoDelPlan(n.planVenceEl),
            plan: nombrePlan.get(n.plan) ?? `Plan ${n.plan}`,
            lastActive: textoVencimiento(n.planVenceEl, n.createdAt),
          })),
        );
      } catch (e) {
        if (!cancelado) {
          setError(e instanceof Error ? e.message : "No se pudo cargar el listado.");
        }
      } finally {
        if (!cancelado) setIsLoading(false);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <h3 className="font-bold text-foreground">Listado de Negocios</h3>
        {!isLoading && !error && (
          <span className="text-xs font-bold text-muted-foreground">{filas.length} negocios</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Negocio</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">Suscripción</th>
              <th className="px-6 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Gestionar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Cargando negocios…
                </td>
              </tr>
            )}

            {!isLoading && error && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {error}
                </td>
              </tr>
            )}

            {!isLoading && !error && filas.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Todavía no hay negocios registrados
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              filas.map((tenant) => (
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
