import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { RegisterShowcase } from "@/features/auth/components/RegisterShowcase";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { Activity } from "lucide-react";
import { Link } from "react-router";

export function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex bg-background font-body">
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative animate-in fade-in slide-in-from-left-8 duration-700">
        <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
          <ThemeToggle />
        </div>

        {/* Logo */}
        <div className="p-8 sm:p-12 pb-0 sm:pb-0">
          <Link to="/home" className="inline-flex items-center gap-3 group">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="font-black text-2xl tracking-tight text-foreground">Luka AI</span>
          </Link>
        </div>

        {/* Center Form */}
        <div className="flex-1 flex items-center justify-center">
          <RegisterForm />
        </div>

        {/* Footer info */}
        <div className="mt-auto p-8 sm:p-12 text-center lg:text-left text-sm font-medium text-muted-foreground">
          &copy; {new Date().getFullYear()} Luka AI. Todos los derechos reservados.
        </div>
      </div>

      {/* Right side: Showcase */}
      <div className="hidden lg:block w-1/2 animate-in fade-in slide-in-from-right-8 duration-700">
        <RegisterShowcase />
      </div>
    </div>
  );
}
