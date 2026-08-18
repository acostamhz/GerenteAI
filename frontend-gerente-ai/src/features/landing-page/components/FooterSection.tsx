import { Bot, Twitter, Linkedin, Instagram } from "lucide-react";

export function InvestorFooter() {
  return (
    <footer className="relative z-10 border-t border-slate-200/80 bg-white/60 px-6 py-16 backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:bg-[#060A12]/80">
      <div className="mx-auto mb-4 grid max-w-7xl grid-cols-1 gap-10 md:grid-cols-4">
        {/* Brand */}
        <div className="md:col-span-1">
          <div className="mb-4 flex items-center gap-2 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            <Bot className="h-6 w-6" />
            Luka AI
          </div>

          <p className="text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
            Toma decisiones con datos, no con intuición. El futuro de la
            gestión para micronegocios en LATAM.
          </p>

          <p className="mt-6 text-sm font-medium text-slate-500 dark:text-slate-400">
            Hecho en Cali, Colombia con mucho ❤️
          </p>
        </div>

        {/* Producto */}
        <div>
          <h4 className="mb-4 font-bold text-slate-900 dark:text-white">
            Producto
          </h4>

          <ul className="space-y-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">
            <li>
              <a
                href="#overview"
                className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Características
              </a>
            </li>

            <li>
              <a
                href="#growth"
                className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Casos de Uso
              </a>
            </li>
          </ul>
        </div>

        {/* Compañía */}
        <div>
          <h4 className="mb-4 font-bold text-slate-900 dark:text-white">
            Compañía
          </h4>

          <ul className="space-y-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">
            <li>
              <a
                href="#"
                className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Preguntas Frecuentes
              </a>
            </li>

            <li>
              <a
                href="mailto:contacto@luka.ai"
                className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Contacto
              </a>
            </li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="mb-4 font-bold text-slate-900 dark:text-white">
            Legal
          </h4>

          <ul className="space-y-2.5 text-sm font-medium text-slate-600 dark:text-slate-400">
            <li>
              <a
                href="#"
                className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Términos de Servicio
              </a>
            </li>

            <li>
              <a
                href="#"
                className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
              >
                Política de Privacidad
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom */}
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-slate-200/80 pt-4 dark:border-white/10 sm:flex-row">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} Luka AI. Todos los derechos reservados.
        </p>

        <div className="flex items-center gap-5 text-slate-600 dark:text-slate-400">
          <a
            href="#"
            aria-label="Twitter"
            className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <Twitter className="h-5 w-5" />
          </a>

          <a
            href="#"
            aria-label="LinkedIn"
            className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <Linkedin className="h-5 w-5" />
          </a>

          <a
            href="#"
            aria-label="Instagram"
            className="transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
          >
            <Instagram className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
}