import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoginShowcase } from "@/features/auth/components/LoginShowcase";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { Activity } from "lucide-react";

export function LoginPage() {
  return (
    <div className="min-h-screen w-full flex bg-background font-body">
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative animate-in fade-in slide-in-from-left-8 duration-700">
        <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
          <ThemeToggle />
        </div>
        
        {/* Logo */}
        <div className="p-8 sm:p-12">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-black text-2xl tracking-tight text-foreground">Luka AI</span>
          </div>
        </div>

        {/* Center Form */}
        <div className="flex-1 flex items-center justify-center">
          <LoginForm />
        </div>
        
        {/* Footer info */}
        <div className="mt-auto p-8 sm:p-12 text-center lg:text-left text-sm font-medium text-muted-foreground">
          &copy; {new Date().getFullYear()} Luka AI. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side: Showcase */}
      <div className="hidden lg:block w-1/2 animate-in fade-in slide-in-from-right-8 duration-700">
        <LoginShowcase />
      </div>
    </div>
  );
}
