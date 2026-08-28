import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard,
  Bot,
  TrendingUp,
  Bell,
  Settings,
  Briefcase,
  Server,
  User,
  CreditCard,
  ShieldCheck,
  LogOut,
  ChevronDown,
  Building2,
  MapPin,
  Check,
  Layers
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/features/auth";
import { apiClient } from "@/lib/apiClient";
import { profileApi } from "@/features/shared-profile/api/profileApi";

interface NegocioItem {
  id: string;
  nombre: string;
}

interface SedeItem {
  id: string;
  nombre: string;
  negocioId: string;
  direccion?: string | null;
  telefono?: string | null;
  whatsappUsername?: string | null;
}

interface UsuarioMeResponse {
  id: string;
  nombre: string;
  email: string;
  rolGlobal: string;
  negocios: Array<{
    negocio: {
      id: string;
      nombre: string;
    };
  }>;
}

export function GlobalNavbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, token } = useAuth();
  const isAdmin = location.pathname.startsWith("/admin") || user?.rolGlobal === "MASTER";
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBusinessDropdownOpen, setIsBusinessDropdownOpen] = useState(false);
  const [isSedeDropdownOpen, setIsSedeDropdownOpen] = useState(false);

  const [negocios, setNegocios] = useState<NegocioItem[]>([]);
  const [sedes, setSedes] = useState<SedeItem[]>([]);

  const [activeBusinessName, setActiveBusinessName] = useState<string>(() => {
    return localStorage.getItem('active_business_name') || 'Mi Negocio';
  });
  const [activeBusinessId, setActiveBusinessId] = useState<string>(() => {
    return localStorage.getItem('active_business_id') || '';
  });

  const [activeSedeName, setActiveSedeName] = useState<string>(() => {
    return localStorage.getItem('active_sede_name') || 'Todas las Sedes';
  });
  const [activeSedeId, setActiveSedeId] = useState<string>(() => {
    return localStorage.getItem('active_sede_id') || 'all';
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const businessDropdownRef = useRef<HTMLDivElement>(null);
  const sedeDropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setIsDropdownOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  // Cargar sedes para un negocio dado
  const loadSedesForBusiness = async (negocioId: string) => {
    if (!negocioId) {
      setSedes([]);
      return;
    }
    try {
      const data = await profileApi.getSedes(negocioId);
      setSedes(data || []);

      const savedSedeId = localStorage.getItem('active_sede_id');
      if (savedSedeId === 'all' || !savedSedeId) {
        setActiveSedeId('all');
        setActiveSedeName('Todas las Sedes');
        localStorage.setItem('active_sede_id', 'all');
        localStorage.setItem('active_sede_name', 'Todas las Sedes');
      } else {
        const found = (data || []).find((s: SedeItem) => s.id === savedSedeId);
        if (found) {
          setActiveSedeId(found.id);
          setActiveSedeName(found.nombre);
          localStorage.setItem('active_sede_id', found.id);
          localStorage.setItem('active_sede_name', found.nombre);
        } else if (data && data.length > 0) {
          setActiveSedeId(data[0].id);
          setActiveSedeName(data[0].nombre);
          localStorage.setItem('active_sede_id', data[0].id);
          localStorage.setItem('active_sede_name', data[0].nombre);
        } else {
          setActiveSedeId('all');
          setActiveSedeName('Todas las Sedes');
          localStorage.setItem('active_sede_id', 'all');
          localStorage.setItem('active_sede_name', 'Todas las Sedes');
        }
      }
    } catch (err) {
      console.warn('Error cargando sedes para el negocio:', err);
      setSedes([]);
    }
  };

  // Cargar exclusivamente los negocios a los que este usuario tiene permiso
  useEffect(() => {
    if (!token) return;

    apiClient<UsuarioMeResponse>('/auth/usuarios/me')
      .then((data) => {
        const userBusinesses = data.negocios?.map((n) => n.negocio) || [];
        if (userBusinesses.length > 0) {
          setNegocios(userBusinesses);
          const savedId = localStorage.getItem('active_business_id');
          const matched = userBusinesses.find((n) => n.id === savedId) || userBusinesses[0];
          
          setActiveBusinessId(matched.id);
          setActiveBusinessName(matched.nombre);
          localStorage.setItem('active_business_id', matched.id);
          localStorage.setItem('active_business_name', matched.nombre);

          loadSedesForBusiness(matched.id);
        } else {
          setNegocios([]);
          setSedes([]);
          setActiveBusinessName('Sin Negocio');
          setActiveSedeName('Sin Sede');
        }
      })
      .catch((err) => {
        console.warn('No se pudieron cargar los negocios en el navbar:', err);
      });
  }, [token]);

  // Escuchar cambios de negocio o sede entre componentes
  useEffect(() => {
    const handleBusinessSync = () => {
      const savedName = localStorage.getItem('active_business_name');
      const savedId = localStorage.getItem('active_business_id');
      if (savedName) setActiveBusinessName(savedName);
      if (savedId && savedId !== activeBusinessId) {
        setActiveBusinessId(savedId);
        loadSedesForBusiness(savedId);
      }
    };

    const handleSedeSync = () => {
      const savedSedeName = localStorage.getItem('active_sede_name');
      const savedSedeId = localStorage.getItem('active_sede_id');
      if (savedSedeName) setActiveSedeName(savedSedeName);
      if (savedSedeId) setActiveSedeId(savedSedeId);
    };

    window.addEventListener('business_changed', handleBusinessSync);
    window.addEventListener('sede_changed', handleSedeSync);
    return () => {
      window.removeEventListener('business_changed', handleBusinessSync);
      window.removeEventListener('sede_changed', handleSedeSync);
    };
  }, [activeBusinessId]);

  const handleSelectBusiness = (negocio: NegocioItem) => {
    setActiveBusinessId(negocio.id);
    setActiveBusinessName(negocio.nombre);
    localStorage.setItem('active_business_id', negocio.id);
    localStorage.setItem('active_business_name', negocio.nombre);
    setIsBusinessDropdownOpen(false);

    loadSedesForBusiness(negocio.id).then(() => {
      window.dispatchEvent(new Event('business_changed'));
      window.dispatchEvent(new Event('sede_changed'));
    });
  };

  const handleSelectSede = (sedeId: string, nombre: string) => {
    setActiveSedeId(sedeId);
    setActiveSedeName(nombre);
    localStorage.setItem('active_sede_id', sedeId);
    localStorage.setItem('active_sede_name', nombre);
    setIsSedeDropdownOpen(false);
    window.dispatchEvent(new Event('sede_changed'));
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (businessDropdownRef.current && !businessDropdownRef.current.contains(event.target as Node)) {
        setIsBusinessDropdownOpen(false);
      }
      if (sedeDropdownRef.current && !sedeDropdownRef.current.contains(event.target as Node)) {
        setIsSedeDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clientNav = [
    { id: "/", Icon: LayoutDashboard, label: "Resumen" },
    { id: "/insights", Icon: Bot, label: "Recomendaciones de IA", badge: 2 },
    { id: "/cashflow", Icon: TrendingUp, label: "Flujo de Caja" },
  ];

  const adminNav = [
    { id: "/admin/crm", Icon: Briefcase, label: "Negocio (CRM)" },
    { id: "/admin/ops", Icon: Server, label: "Sistema (Ops)" },
  ];

  const nav: Array<{ id: string; Icon: any; label: string; badge?: number }> = isAdmin ? adminNav : clientNav;

  return (
    <header className="bg-card dark:bg-muted/10 border-b border-border shrink-0 relative z-10">
      {/* Top Main Navbar */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Logo & Actions */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">Luka AI</span>
          </div>

          <div className="w-px h-6 bg-border" />

          {/* Actions (Notifs, Settings, Theme) */}
          <div className="flex items-center gap-2">
            <button className="relative w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-pointer">
              <Bell className="w-5 h-5" strokeWidth={2} />
              <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-destructive rounded-full" />
            </button>
            <button className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted cursor-pointer">
              <Settings className="w-5 h-5" strokeWidth={2} />
            </button>
            <ThemeToggle />
          </div>
        </div>

        {/* Center: Page Selector */}
        <div className="flex-1 flex justify-center px-8">
          <nav className="flex items-center gap-1.5 p-1.5 bg-muted/40 border border-border rounded-2xl">
            {nav.map(({ id, Icon, label, badge }) => {
              const isActive = location.pathname === id || (id === "/" && location.pathname === "");
              return (
                <Link
                  key={id}
                  to={id}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 shadow-sm ring-1 ring-emerald-500/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600 dark:text-emerald-500' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
                  {label}
                  {badge && (
                    <span className={`ml-1.5 text-[10px] font-black rounded-full px-2 py-0.5 transition-colors ${
                      isActive 
                        ? "bg-emerald-500 text-white" 
                        : "bg-muted-foreground/20 text-muted-foreground group-hover:bg-muted-foreground/30"
                    }`}>
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Context Selectors (Business Dropdown, Sede Dropdown & User Profile) */}
        <div className="flex items-center gap-2.5 text-sm font-semibold">
          {!isAdmin && (
            <div className="flex items-center gap-1.5">
              {/* 🏢 1. Selector de Negocio / Empresa */}
              <div className="relative" ref={businessDropdownRef}>
                <button
                  onClick={() => {
                    setIsBusinessDropdownOpen(!isBusinessDropdownOpen);
                    setIsSedeDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted/80 px-3 py-1.5 rounded-lg border border-border cursor-pointer text-xs font-bold"
                  title="Empresa o Comercio Activo"
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="max-w-[120px] truncate">{activeBusinessName}</span>
                  <ChevronDown className={`w-3 h-3 text-muted-foreground/60 transition-transform ${isBusinessDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isBusinessDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-border text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                      <span>Tus Empresas</span>
                      <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    {negocios.length > 0 ? (
                      negocios.map((negocio) => (
                        <button
                          key={negocio.id}
                          onClick={() => handleSelectBusiness(negocio)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm font-medium text-left hover:bg-muted transition-colors cursor-pointer ${
                            activeBusinessId === negocio.id ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-500/5' : 'text-foreground'
                          }`}
                        >
                          <span className="truncate">{negocio.nombre}</span>
                          {activeBusinessId === negocio.id && <Check className="w-4 h-4 text-emerald-500" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-muted-foreground">
                        No tienes comercios registrados.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 📍 2. Selector de Sede / Sucursal */}
              <div className="relative" ref={sedeDropdownRef}>
                <button
                  onClick={() => {
                    setIsSedeDropdownOpen(!isSedeDropdownOpen);
                    setIsBusinessDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors bg-muted/50 hover:bg-muted/80 px-3 py-1.5 rounded-lg border border-border cursor-pointer text-xs font-bold"
                  title="Sede o Sucursal Activa"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="max-w-[110px] truncate">{activeSedeName}</span>
                  <ChevronDown className={`w-3 h-3 text-muted-foreground/60 transition-transform ${isSedeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isSedeDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-card border border-border rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="px-4 py-2 border-b border-border text-[11px] font-bold text-muted-foreground uppercase flex items-center justify-between">
                      <span>Sedes de {activeBusinessName}</span>
                      <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    </div>

                    {/* Opción Consolidado (Todas las Sedes) */}
                    <button
                      onClick={() => handleSelectSede('all', 'Todas las Sedes')}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm font-medium text-left hover:bg-muted transition-colors cursor-pointer border-b border-border/50 ${
                        activeSedeId === 'all' ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-500/5' : 'text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Todas las Sedes (Consolidado)</span>
                      </div>
                      {activeSedeId === 'all' && <Check className="w-4 h-4 text-emerald-500" />}
                    </button>

                    {/* Sedes Individuales */}
                    {sedes.length > 0 ? (
                      sedes.map((sede) => (
                        <button
                          key={sede.id}
                          onClick={() => handleSelectSede(sede.id, sede.nombre)}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm font-medium text-left hover:bg-muted transition-colors cursor-pointer ${
                            activeSedeId === sede.id ? 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50/50 dark:bg-emerald-500/5' : 'text-foreground'
                          }`}
                        >
                          <div className="truncate">
                            <div className="truncate font-semibold">{sede.nombre}</div>
                            {sede.direccion && (
                              <div className="text-[10px] text-muted-foreground truncate">{sede.direccion}</div>
                            )}
                          </div>
                          {activeSedeId === sede.id && <Check className="w-4 h-4 text-emerald-500 shrink-0 ml-2" />}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-xs text-muted-foreground">
                        No hay sucursales registradas para esta empresa.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100 hover:text-emerald-900 transition-colors bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-sm cursor-pointer"
            >
              {user?.nombre || "Usuario"} <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <Link to={isAdmin ? "/profile?admin=true" : "/profile"} onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <User className="w-4 h-4" /> Perfil
                </Link>
                <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4" /> Configuración
                </Link>
                <Link to="/subscription" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <CreditCard className="w-4 h-4" /> Planes de Suscripción
                </Link>
                <Link to="/manage-subscription" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                  <ShieldCheck className="w-4 h-4" /> Administrar Suscripción
                </Link>
                <div className="h-px bg-border my-2" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
