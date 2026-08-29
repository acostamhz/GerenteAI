import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { RegisterShowcase } from "@/features/auth/components/RegisterShowcase";
import { ThemeToggle } from "@/shared/components/layout/ThemeToggle";
import { Activity } from "lucide-react";
import { Link } from "react-router";

export function RegisterPage() {
  return (
    <div className="min-h-screen w-full flex bg-background font-body">
      {/* Left side: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between relative animate-in fade-in slide-in-from-left-8 duration-700 p-6 sm:p-8">
        <div className="absolute top-5 right-6 flex items-center gap-4 z-10">
          <ThemeToggle />
        </div>

        {/* Logo */}
        <div>
          <Link to="/home" className="inline-flex items-center gap-2.5 group">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-lg shadow-xs group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <span className="font-black text-xl tracking-tight text-foreground">Luka AI</span>
          </Link>
        </div>

        {/* Center Form */}
        <div className="my-auto py-2 flex items-center justify-center">
          <RegisterForm />
        </div>

        {/* Footer info */}
        <div className="text-center lg:text-left text-xs font-medium text-muted-foreground">
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
