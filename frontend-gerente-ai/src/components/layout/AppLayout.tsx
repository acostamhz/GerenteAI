import { Suspense } from "react";
import { Outlet, useLocation } from "react-router";
import { GlobalNavbar } from "@/shared/components/layout/GlobalNavbar";
import { GlobalFooter } from "@/shared/components/layout/GlobalFooter";
import { PageSkeleton } from "@/shared/components/ui/PageSkeleton";

export function AppLayout() {
  const location = useLocation();
  
  return (
    <div
      className="h-screen w-full overflow-hidden bg-background flex flex-col text-foreground font-sans"
    >
      <GlobalNavbar />
      <main className="flex-1 overflow-auto">
        <div key={location.pathname} className="max-w-[1400px] mx-auto w-full p-4 sm:p-6 animate-in fade-in zoom-in-95 duration-300">
          <Suspense fallback={<PageSkeleton />}>
            <Outlet />
          </Suspense>
        </div>
        <GlobalFooter />
      </main>
    </div>
  );
}
