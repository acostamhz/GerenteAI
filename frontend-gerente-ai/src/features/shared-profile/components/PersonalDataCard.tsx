import { useState, useEffect } from "react";
import { User, Phone, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/app/components/ui/button";
import { AuthUser } from "@/features/auth";

interface PersonalDataCardProps {
  user: AuthUser | null;
  isSavingUser: boolean;
  actionError: string | null;
  actionSuccess: string | null;
  onUpdatePersonalData: (data: { nombre?: string; telefono?: string }) => Promise<boolean>;
  onClearFeedback: () => void;
}

export function PersonalDataCard({
  user,
  isSavingUser,
  actionError,
  actionSuccess,
  onUpdatePersonalData,
  onClearFeedback,
}: PersonalDataCardProps) {
  const [nombre, setNombre] = useState(user?.nombre || "");
  const [telefono, setTelefono] = useState(user?.telefono || "");
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    if (user) {
      setNombre(user.nombre || "");
      setTelefono(user.telefono || "");
      setHasChanged(false);
    }
  }, [user]);

  const handleInputChange = (field: "nombre" | "telefono", value: string) => {
    if (field === "nombre") setNombre(value);
    if (field === "telefono") setTelefono(value);
    onClearFeedback();

    const originalNombre = user?.nombre || "";
    const originalTelefono = user?.telefono || "";
    const currentNombre = field === "nombre" ? value : nombre;
    const currentTelefono = field === "telefono" ? value : telefono;

    setHasChanged(
      currentNombre.trim() !== originalNombre.trim() ||
      currentTelefono.trim() !== originalTelefono.trim()
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim() || !hasChanged) return;

    const ok = await onUpdatePersonalData({
      nombre: nombre.trim(),
      telefono: telefono.trim() || undefined,
    });

    if (ok) {
      setHasChanged(false);
    }
  };

  return (
    <div className="rounded-3xl bg-slate-50/95 dark:bg-card/70 backdrop-blur-xl border border-slate-200/90 dark:border-border/80 p-6 sm:p-7 shadow-sm space-y-5">
      {/* Alertas de Feedback */}
      <AnimatePresence mode="wait">
        {actionSuccess && (
          <motion.div
            key="success-alert"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{actionSuccess}</span>
          </motion.div>
        )}

        {actionError && (
          <motion.div
            key="error-alert"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold flex items-center gap-2.5 shadow-xs"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{actionError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/80 dark:border-border/60 pb-4">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-500" />
            Información Personal
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Actualiza tu nombre y número de contacto principal.
          </p>
        </div>

        {hasChanged && (
          <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full animate-pulse self-start sm:self-auto">
            • Cambios pendientes por guardar
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre Completo */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-500" />
              Nombre Completo
            </label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => handleInputChange("nombre", e.target.value)}
              placeholder="Tu nombre completo"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-muted/30 border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
            />
          </div>

          {/* Celular de Contacto */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-foreground uppercase tracking-wider flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-500" />
              Celular de Contacto
            </label>
            <input
              type="tel"
              value={telefono}
              onChange={(e) => handleInputChange("telefono", e.target.value)}
              placeholder="+57 300 000 0000"
              className="w-full px-3.5 py-2.5 bg-white dark:bg-muted/30 border border-slate-300 dark:border-border rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-xs transition-all"
            />
          </div>
        </div>

        {/* Botón de Guardar Cambios */}
        <AnimatePresence>
          {hasChanged && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="flex justify-end pt-1"
            >
              <Button
                type="submit"
                disabled={isSavingUser || !nombre.trim()}
                className="rounded-xl px-5 py-2.5 text-xs font-bold shadow-md cursor-pointer inline-flex items-center gap-2"
              >
                {isSavingUser ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}
