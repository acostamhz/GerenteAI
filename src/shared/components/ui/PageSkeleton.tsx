import { Loader2 } from "lucide-react";

export function PageSkeleton() {
  return (
    <div className="w-full h-full min-h-[60vh] flex flex-col items-center justify-center animate-in fade-in duration-500">
      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
      <p className="text-sm font-bold text-muted-foreground animate-pulse">Cargando...</p>
    </div>
  );
}
