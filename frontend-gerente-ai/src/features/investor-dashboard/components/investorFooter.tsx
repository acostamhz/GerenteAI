export function InvestorFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
                L
              </div>

              <div>
                <p className="text-sm font-bold tracking-tight text-slate-950">
                  Luka
                </p>

                <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Investor Relations
                </p>
              </div>
            </div>

            <p className="mt-5 max-w-md text-sm leading-6 text-slate-500">
              Inteligencia empresarial para los negocios que mueven
              Latinoamérica.
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-sm font-semibold text-slate-900">
              Información para inversionistas
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Datos presentados con fines informativos.
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Última actualización: Agosto 2026
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">
            © 2026 Luka. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}