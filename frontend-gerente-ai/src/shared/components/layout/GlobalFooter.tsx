import { Link } from "react-router";
import { Twitter, Linkedin, Instagram, Mail, ArrowRight } from "lucide-react";

export function GlobalFooter() {
  return (
    <footer className="w-full bg-zinc-950 text-zinc-400 relative mt-16">
      {/* Decorative Top Border Gradient */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      
      <div className="max-w-[1400px] mx-auto px-6 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 lg:gap-16 mb-16">
          
          {/* Brand & Description */}
          <div className="md:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-emerald-200">
                Gerente AI
              </span>
            </div>
            <p className="text-sm leading-relaxed text-zinc-400 max-w-xs">
              Empoderamos a los líderes con inteligencia artificial para tomar decisiones más rápidas, seguras y rentables.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all duration-300 hover:scale-110">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all duration-300 hover:scale-110">
                <Linkedin className="w-4 h-4" />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center hover:bg-emerald-500 hover:text-zinc-950 transition-all duration-300 hover:scale-110">
                <Instagram className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-1 space-y-6">
            <h3 className="text-zinc-200 font-bold tracking-tight">Plataforma</h3>
            <ul className="space-y-4">
              <li>
                <Link to="/" className="text-sm hover:text-emerald-400 transition-colors">Resumen</Link>
              </li>
              <li>
                <Link to="/cashflow" className="text-sm hover:text-emerald-400 transition-colors">Flujo de Caja</Link>
              </li>
              <li>
                <Link to="/insights" className="text-sm hover:text-emerald-400 transition-colors">Recomendaciones IA</Link>
              </li>
              <li>
                <Link to="/admin/crm" className="text-sm hover:text-emerald-400 transition-colors">Panel Admin</Link>
              </li>
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-1 space-y-6">
            <h3 className="text-zinc-200 font-bold tracking-tight">Legal</h3>
            <ul className="space-y-4">
              <li>
                <a href="#" className="text-sm hover:text-emerald-400 transition-colors">Términos de Servicio</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-400 transition-colors">Política de Privacidad</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-400 transition-colors">Seguridad de Datos</a>
              </li>
              <li>
                <a href="#" className="text-sm hover:text-emerald-400 transition-colors">Cookies</a>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-1 space-y-6">
            <h3 className="text-zinc-200 font-bold tracking-tight">Mantente actualizado</h3>
            <p className="text-sm text-zinc-400">
              Recibe las últimas novedades sobre nuestras herramientas de IA.
            </p>
            <div className="relative group">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-zinc-500" />
              </div>
              <input 
                type="email" 
                placeholder="tu@correo.com" 
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-28 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <button className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer">
                Suscribirse
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-zinc-500">
            © {new Date().getFullYear()} Gerente AI. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-zinc-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              Sistemas Operativos
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
