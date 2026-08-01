import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router";
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
  LogOut,
  ChevronDown
} from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export function GlobalNavbar() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
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

  const nav = isAdmin ? adminNav : clientNav;

  return (
    <header className="bg-card dark:bg-muted/10 border-b border-border shrink-0 relative z-10">
      {/* Top Main Navbar */}
      <div className="flex items-center justify-between px-6 py-3">
        {/* Left: Logo & Actions */}
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-emerald-400">Gerente AI</span>
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

        {/* Right: Context Selectors (El Virrey & Jose Mesa) */}
        <div className="flex items-center gap-4 text-sm font-semibold">
          {!isAdmin && (
            <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors bg-muted/50 px-3 py-1.5 rounded-lg border border-border cursor-pointer">
              El Virrey <ChevronDown className="w-3 h-3 text-muted-foreground/60" />
            </button>
          )}

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-emerald-800 dark:text-emerald-100 hover:text-emerald-900 transition-colors bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/20 shadow-sm cursor-pointer"
            >
              José Meza <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-lg py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <Link to={isAdmin ? "/profile?admin=true" : "/profile"} onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <User className="w-4 h-4" /> Perfil
                </Link>
                <Link to="/settings" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4" /> Configuración
                </Link>
                <Link to="/subscription" onClick={() => setIsDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors">
                  <CreditCard className="w-4 h-4" /> Suscripción
                </Link>
                <div className="h-px bg-border my-2" />
                <button onClick={() => setIsDropdownOpen(false)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors cursor-pointer">
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
