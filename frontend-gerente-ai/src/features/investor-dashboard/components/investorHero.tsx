export function InvestorHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-32">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-emerald-200/30 blur-3xl" />

        <div className="absolute left-0 top-32 h-[350px] w-[350px] rounded-full bg-cyan-200/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />

            Luka Investor Relations
          </div>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            El crecimiento de Luka,
            <span className="block bg-gradient-to-r from-emerald-600 via-cyan-500 to-teal-500 bg-clip-text text-transparent">
              en tiempo real.
            </span>
          </h1>

          <p className="mt-7 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            Una visión transparente de la evolución de Luka AI:
            usuarios, negocios, crecimiento, ingresos, retención y
            actividad de nuestra plataforma.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium shadow-sm">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />

              Datos actualizados en tiempo real
            </div>

            <div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">
              Agosto 2026
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}