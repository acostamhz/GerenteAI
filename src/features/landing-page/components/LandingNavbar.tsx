import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Bot, Menu, X, ArrowRight, LayoutDashboard, LogIn } from 'lucide-react';

// Easing curve: easeInOutQuart for a premium, silky smooth acceleration/deceleration
function easeInOutQuart(t: number): number {
  return t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2;
}

function customSmoothScroll(targetY: number, duration: number = 1000) {
  const startY = window.pageYOffset;
  const distance = targetY - startY;
  let startTime: number | null = null;

  function animation(currentTime: number) {
    if (startTime === null) startTime = currentTime;
    const timeElapsed = currentTime - startTime;
    const progress = Math.min(timeElapsed / duration, 1);

    const ease = easeInOutQuart(progress);
    window.scrollTo(0, startY + distance * ease);

    if (timeElapsed < duration) {
      requestAnimationFrame(animation);
    }
  }

  requestAnimationFrame(animation);
}

export function LandingNavbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Beneficios', href: '#beneficios' },
    { name: 'Testimonios', href: '#testimonios' },
    { name: 'Preguntas Frecuentes', href: '#faq' },
  ];

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    if (element) {
      const yOffset = -90; // offset for sticky navbar
      const targetY = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      customSmoothScroll(targetY, 1000); // 1000ms premium glide
    }
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled 
          ? 'bg-slate-950/80 backdrop-blur-md border-b border-white/10 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' 
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        {/* Left: Brand Logo */}
        <Link 
          to="/home" 
          onClick={(e) => {
            if (window.location.pathname === '/home') {
              e.preventDefault();
              customSmoothScroll(0, 1000);
            }
          }}
          className="group flex items-center gap-2.5 text-xl font-bold tracking-tight transition-transform duration-300 hover:scale-105"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-[0_0_15px_rgba(52,211,153,0.15)]">
            <Bot className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
          </div>
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-emerald-200 to-white font-heading font-black text-2xl tracking-tight">
            Luka AI
          </span>
        </Link>

        {/* Center: Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 border border-white/10 backdrop-blur-md px-3 py-1.5 rounded-full shadow-inner">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="relative px-4 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-all duration-300 group cursor-pointer"
            >
              <span className="relative z-10">{link.name}</span>
              {/* Subtle hover background capsule */}
              <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 rounded-full transition-all duration-300 scale-95 group-hover:scale-100" />
              {/* Glowing bottom indicator line */}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300 group-hover:w-3/5 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </a>
          ))}
        </nav>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Dashboard Link */}
          <Link
            to="/"
            className="group flex items-center gap-2 text-sm font-semibold text-slate-300 hover:text-white px-4 py-2.5 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/15 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]"
          >
            <LayoutDashboard className="w-4 h-4 text-emerald-400 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            Dashboard
          </Link>
          
          {/* Iniciar Sesion */}
          <Link
            to="/login"
            className="flex items-center gap-2 text-sm font-semibold text-slate-200 hover:text-white px-4 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-white/10 hover:border-emerald-500/40 transition-all duration-300 hover:scale-105 active:scale-95 shadow-sm"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            Iniciar Sesión
          </Link>

          {/* CTA: Comenzar Gratis */}
          <Link
            to="/login"
            className="group relative flex items-center gap-2 text-sm font-bold text-slate-950 bg-gradient-to-r from-emerald-400 via-emerald-300 to-teal-300 hover:from-emerald-300 hover:to-teal-200 px-5 py-2.5 rounded-xl shadow-[0_0_20px_rgba(52,211,153,0.35)] hover:shadow-[0_0_30px_rgba(52,211,153,0.65)] transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden"
          >
            {/* Shimmer sweep effect on hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" />
            <span className="relative z-10">Comenzar Gratis</span>
            <ArrowRight className="w-4 h-4 relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-slate-300 hover:text-white transition-transform active:scale-90"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/95 border-b border-white/10 px-6 py-6 space-y-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-300">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={(e) => handleSmoothScroll(e, link.href)}
              className="block text-base font-medium text-slate-300 hover:text-emerald-400 py-1.5 transition-colors"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 border-t border-white/10 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 font-semibold border border-white/10 transition-all active:scale-98"
            >
              <LayoutDashboard className="w-4 h-4 text-emerald-400" />
              Ir al Dashboard
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-slate-900 text-slate-200 font-semibold border border-white/10 hover:border-emerald-500/40 transition-all active:scale-98"
            >
              <LogIn className="w-4 h-4 text-emerald-400" />
              Iniciar Sesión
            </Link>
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 font-bold shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all active:scale-98"
            >
              Comenzar Gratis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
