import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { Eye, EyeOff, Loader2, Building2, User, Mail, Phone, Lock } from "lucide-react";
import { Button } from "@/app/components/ui/button";

export function RegisterForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    businessName: "",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculatePasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: "", color: "bg-border" };
    let score = 0;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;

    switch (score) {
      case 1:
        return { score: 25, label: "Débil", color: "bg-red-500" };
      case 2:
        return { score: 50, label: "Aceptable", color: "bg-amber-500" };
      case 3:
        return { score: 75, label: "Buena", color: "bg-blue-500" };
      case 4:
        return { score: 100, label: "Excelente", color: "bg-emerald-500" };
      default:
        return { score: 15, label: "Muy débil", color: "bg-red-500" };
    }
  };

  const strength = calculatePasswordStrength(formData.password);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setError("El número de celular debe tener al menos 10 dígitos.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!formData.termsAccepted) {
      setError("Debes aceptar los términos y condiciones para continuar.");
      return;
    }

    setIsLoading(true);

    // Simulación de registro
    setTimeout(() => {
      setIsLoading(false);
      navigate("/");
    }, 1200);
  };

  return (
    <div className="w-full max-w-md mx-auto px-8 sm:px-0 py-6">
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">Crea tu cuenta gratis</h1>
        <p className="text-muted-foreground font-medium text-sm">Empieza a gestionar tu negocio con Inteligencia Artificial hoy.</p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium flex items-center gap-2">
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre Completo */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">Nombre completo</label>
          <div className="relative">
            <User className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              name="fullName"
              placeholder="María Rodríguez"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Correo Electrónico */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">Correo electrónico</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              name="email"
              placeholder="tu@empresa.com"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full pl-11 pr-4 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
            />
          </div>
        </div>

        {/* Nombre del Negocio y Celular */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Nombre del Negocio</label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                name="businessName"
                placeholder="Mi Negocio S.A.S."
                required
                value={formData.businessName}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider">Celular</label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="tel"
                name="phone"
                placeholder="+57 300 000 0000"
                required
                minLength={10}
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Contraseña */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">Contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Mínimo 8 caracteres"
              required
              minLength={8}
              value={formData.password}
              onChange={handleChange}
              className="w-full pl-11 pr-11 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {formData.password && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Fortaleza:</span>
                <span className="font-bold">{strength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div className={`h-full transition-all duration-300 ${strength.color}`} style={{ width: `${strength.score}%` }} />
              </div>
            </div>
          )}
        </div>

        {/* Confirmar Contraseña */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-foreground uppercase tracking-wider">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirma tu contraseña"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full pl-11 pr-11 py-3 bg-card border border-border rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm shadow-sm font-medium"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Términos y Condiciones */}
        <div className="pt-2">
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              name="termsAccepted"
              checked={formData.termsAccepted}
              onChange={handleChange}
              className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary/20"
            />
            <span className="text-xs text-muted-foreground font-medium leading-relaxed">
              Acepto los{" "}
              <a href="#" className="font-bold text-primary hover:underline">
                Términos de Servicio
              </a>{" "}
              y la{" "}
              <a href="#" className="font-bold text-primary hover:underline">
                Política de Privacidad
              </a>{" "}
              de Luka AI.
            </span>
          </label>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full py-5 text-base font-bold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all mt-4"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Creando tu cuenta...
            </>
          ) : (
            "Crear cuenta y comenzar gratis"
          )}
        </Button>
      </form>

      {/* Redirect Login */}
      <div className="mt-8 text-center text-sm font-medium text-muted-foreground">
        ¿Ya tienes una cuenta?{" "}
        <Link to="/login" className="font-bold text-primary hover:text-primary/80 transition-colors">
          Inicia sesión aquí
        </Link>
      </div>
    </div>
  );
}
