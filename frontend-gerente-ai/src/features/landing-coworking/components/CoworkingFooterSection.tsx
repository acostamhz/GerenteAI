import { Bot, Twitter, Linkedin, Instagram } from "lucide-react";

export function CoworkingFooterSection() {
  return (
    <footer className="py-16 px-6 border-t border-slate-200/80 dark:border-white/10 bg-white/60 dark:bg-[#060A12]/80 backdrop-blur-xl transition-colors duration-300 relative z-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xl mb-4">
            <Bot className="w-6 h-6" />
            Luka AI
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed font-medium">
            Toma decisiones con datos, no con intuición. El futuro de la gestión para micronegocios en LATAM.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-4">Producto</h4>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <li><a href="#features" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Características</a></li>
            <li><a href="#beneficios" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Casos de Uso</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-4">Compañía</h4>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <li><a href="#faq" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Preguntas Frecuentes</a></li>
            <li><a href="mailto:contacto@luka.ai" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Contacto</a></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white mb-4">Legal</h4>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
            <li><a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Términos de Servicio</a></li>
            <li><a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">Política de Privacidad</a></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto pt-8 border-t border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          © {new Date().getFullYear()} Luka AI. Todos los derechos reservados.
        </p>
        <div className="flex items-center gap-5 text-slate-600 dark:text-slate-400">
          <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"><Twitter className="w-5 h-5" /></a>
          <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"><Linkedin className="w-5 h-5" /></a>
          <a href="#" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"><Instagram className="w-5 h-5" /></a>
        </div>
      </div>
    </footer>
  );
}
