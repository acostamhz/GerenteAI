export function InvestorNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
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

        {/* Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          <a
            href="#overview"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            Overview
          </a>

          <a
            href="#growth"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            Growth
          </a>

          <a
            href="#financials"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            Financials
          </a>

          <a
            href="#activity"
            className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-950"
          >
            Activity
          </a>
        </nav>

        {/* Live indicator */}
        <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>

          <span className="text-xs font-semibold text-emerald-700">
            Live
          </span>
        </div>
      </div>
    </header>
  );
}