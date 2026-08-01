import { Bot, Twitter, Linkedin, Instagram } from 'lucide-react';

export function FooterSection() {
  return (
    <footer className="py-12 px-6 border-t border-white/10 bg-slate-950 relative z-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xl mb-4">
            <Bot className="w-6 h-6" />
            Gerente AI
          </div>
          <p className="text-slate-400 text-sm">
            Toma decisiones con datos, no con intuición. El futuro de la gestión para micronegocios en LATAM.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">Producto</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Características</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Precios</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Casos de Uso</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Actualizaciones</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">Compañía</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Sobre Nosotros</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Inversores</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Contacto</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-white mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-slate-400">
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Términos de Servicio</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Política de Privacidad</a></li>
            <li><a href="#" className="hover:text-emerald-400 transition-colors">Tratamiento de Datos</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} Gerente AI. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-4 text-slate-400">
          <a href="#" className="hover:text-emerald-400 transition-colors"><Twitter className="w-5 h-5" /></a>
          <a href="#" className="hover:text-emerald-400 transition-colors"><Linkedin className="w-5 h-5" /></a>
          <a href="#" className="hover:text-emerald-400 transition-colors"><Instagram className="w-5 h-5" /></a>
        </div>
      </div>
    </footer>
  );
}
