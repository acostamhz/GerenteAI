export function MediaSection() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="relative rounded-2xl md:rounded-[2rem] overflow-hidden border border-white/10 bg-slate-900/50 backdrop-blur-sm p-4 md:p-8 shadow-2xl">
          {/* Decorative glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-emerald-500/20 blur-[120px] rounded-full pointer-events-none"></div>
          
          <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/5 bg-slate-950 aspect-[16/9] flex items-center justify-center">
            {/* Placeholder for the actual app screenshot/video */}
            <div className="text-slate-500 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium">Demostración del Producto</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
