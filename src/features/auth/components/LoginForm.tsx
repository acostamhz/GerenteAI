import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function LoginForm() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"client" | "admin">("client");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      if (role === "client") {
        navigate("/");
      } else {
        navigate("/admin");
      }
    }, 1000);
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 sm:px-0">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-3">Bienvenido de nuevo</h1>
        <p className="text-muted-foreground font-medium">Ingresa tus credenciales para acceder a tu cuenta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-5">
          <div className="space-y-2.5">
            <label className="text-sm font-bold text-foreground">Correo electrónico</label>
            <input 
              type="email" 
              placeholder="tu@empresa.com" 
              required
              className="w-full px-4 py-3.5 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
            />
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-bold text-foreground">Contraseña</label>
              <button type="button" className="text-sm font-bold text-primary hover:text-primary/80 transition-colors">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                required
                className="w-full px-4 py-3.5 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-2.5 pt-2">
            <label className="text-sm font-bold text-foreground flex items-center justify-between">
              <span>Seleccionar Perfil</span>
              <span className="text-xs font-bold px-2 py-0.5 bg-primary/10 text-primary rounded-full">Temporal</span>
            </label>
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-muted/50 rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setRole("client")}
                className={`py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  role === "client" ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Cliente
              </button>
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`py-2.5 px-4 rounded-lg text-sm font-bold transition-all ${
                  role === "admin" ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>

        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full py-6 text-base font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            "Ingresar a la plataforma"
          )}
        </Button>
      </form>

      <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
        ¿No tienes una cuenta?{" "}
        <Link to="/register" className="font-bold text-primary hover:text-primary/80 transition-colors">
          Regístrate gratis
        </Link>
      </div>
    </div>
  );
}
