import { Skeleton } from '@/shared/components/ui/Skeleton';

/**
 * Esqueleto para la tarjeta de Identidad y Datos Personales en la columna izquierda.
 */
export function IdentityHeroSkeleton() {
  return (
    <div className="rounded-3xl bg-slate-50/95 dark:bg-card/70 border border-slate-200/90 dark:border-border/80 p-6 sm:p-7 shadow-sm space-y-6">
      {/* Avatar & Header */}
      <div className="flex flex-col items-center text-center space-y-4">
        <Skeleton variant="circular" className="w-24 h-24 sm:w-28 sm:h-28 shadow-sm" />
        
        <div className="space-y-2 w-full flex flex-col items-center">
          <Skeleton variant="text" className="w-3/4 h-6 rounded-lg" />
          <Skeleton variant="text" className="w-1/2 h-3.5" />
          
          <div className="flex gap-2 pt-2">
            <Skeleton variant="rounded" className="w-24 h-6 rounded-full" />
            <Skeleton variant="rounded" className="w-20 h-6 rounded-full" />
          </div>
        </div>
      </div>

      {/* Bloque de Edición de Datos Personales */}
      <div className="p-4 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/80 dark:border-border/60 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-border/40">
          <Skeleton variant="text" className="w-36 h-4" />
          <Skeleton variant="rounded" className="w-14 h-6 rounded-lg" />
        </div>

        <div className="space-y-3 pt-1">
          <div className="space-y-1">
            <Skeleton variant="text" className="w-20 h-3" />
            <Skeleton variant="rounded" className="w-full h-9 rounded-xl" />
          </div>
          <div className="space-y-1">
            <Skeleton variant="text" className="w-28 h-3" />
            <Skeleton variant="rounded" className="w-full h-9 rounded-xl" />
          </div>
        </div>
      </div>

      {/* Metadatos de Cuenta */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/80 dark:border-border/60 space-y-2.5 shadow-xs">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-24 h-3.5" />
          <Skeleton variant="rounded" className="w-16 h-5 rounded-md" />
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-border/40">
          <Skeleton variant="text" className="w-28 h-3.5" />
          <Skeleton variant="text" className="w-24 h-3.5" />
        </div>
      </div>
    </div>
  );
}

/**
 * Esqueleto para la tarjeta de Seguridad y Contraseña en la columna izquierda.
 */
export function SecurityPasswordSkeleton() {
  return (
    <div className="rounded-3xl bg-slate-50/95 dark:bg-card/70 border border-slate-200/90 dark:border-border/80 p-5 sm:p-6 shadow-sm space-y-5">
      <div className="border-b border-slate-200/80 dark:border-border/60 pb-3.5 space-y-1">
        <Skeleton variant="text" className="w-40 h-5" />
        <Skeleton variant="text" className="w-60 h-3" />
      </div>

      <div className="space-y-3.5">
        {/* Fila Contraseña */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/70 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Skeleton variant="rounded" className="w-9 h-9 rounded-xl" />
            <div className="space-y-1 flex-1">
              <Skeleton variant="text" className="w-36 h-4" />
              <Skeleton variant="text" className="w-48 h-3" />
            </div>
          </div>
          <Skeleton variant="rounded" className="w-full h-8 rounded-xl" />
        </div>

        {/* Fila Correo */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-muted/20 border border-slate-200/90 dark:border-border/70 space-y-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Skeleton variant="rounded" className="w-9 h-9 rounded-xl" />
            <div className="space-y-1 flex-1">
              <Skeleton variant="text" className="w-32 h-4" />
              <Skeleton variant="text" className="w-40 h-3" />
            </div>
          </div>
          <Skeleton variant="rounded" className="w-full h-8 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

/**
 * Esqueleto para la grilla de Negocios y Sedes en la columna derecha.
 */
export function BusinessBentoSkeleton() {
  return (
    <div className="rounded-3xl bg-slate-50/95 dark:bg-card/70 border border-slate-200/90 dark:border-border/80 p-6 sm:p-7 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-border/60 pb-4">
        <div className="space-y-1.5">
          <Skeleton variant="text" className="w-56 h-5" />
          <Skeleton variant="text" className="w-72 h-3" />
        </div>
        <Skeleton variant="rounded" className="w-32 h-9 rounded-xl" />
      </div>

      {/* Grid de Negocios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-5 rounded-2xl border border-slate-200/90 dark:border-border/70 bg-white dark:bg-background/50 space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-border/40">
              <div className="flex items-center gap-2.5">
                <Skeleton variant="rounded" className="w-10 h-10 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton variant="text" className="w-28 h-4" />
                  <Skeleton variant="rounded" className="w-16 h-4 rounded-md" />
                </div>
              </div>
              <Skeleton variant="rounded" className="w-8 h-8 rounded-lg" />
            </div>

            <div className="space-y-2 pt-1">
              <Skeleton variant="text" className="w-32 h-3" />
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-border/40">
                <Skeleton variant="rounded" className="w-full h-10 rounded-xl" />
                <Skeleton variant="rounded" className="w-full h-10 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Esqueleto para los Canales de WhatsApp en la columna derecha.
 */
export function WhatsAppChannelsSkeleton() {
  return (
    <div className="rounded-3xl bg-slate-50/95 dark:bg-card/70 border border-slate-200/90 dark:border-border/80 p-6 sm:p-7 shadow-sm space-y-5">
      <div className="space-y-2 border-b border-slate-200/80 dark:border-border/60 pb-4">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="w-64 h-5" />
          <Skeleton variant="rounded" className="w-28 h-6 rounded-full" />
        </div>
        <Skeleton variant="rounded" className="w-full h-2 rounded-full" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl border border-slate-200/90 dark:border-border/70 bg-white dark:bg-background/50 flex items-center justify-between shadow-xs"
          >
            <div className="flex items-center gap-2.5">
              <Skeleton variant="rounded" className="w-9 h-9 rounded-xl" />
              <div className="space-y-1">
                <Skeleton variant="text" className="w-28 h-4" />
                <Skeleton variant="text" className="w-36 h-3" />
              </div>
            </div>
            <Skeleton variant="rounded" className="w-16 h-7 rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
