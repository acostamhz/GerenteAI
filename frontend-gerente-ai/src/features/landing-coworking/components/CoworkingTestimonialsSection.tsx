export function CoworkingTestimonialsSection() {
  const testimonials = [
    {
      quote: "Desde que uso Luka AI, dejé de perder horas en Excel. Ahora solo le envío un mensaje y sé exactamente cuánto he ganado en el mes.",
      author: "Carlos Gómez",
      role: "Dueño de Ferretería",
    },
    {
      quote: "La tranquilidad de tener mis finanzas claras no tiene precio. El asistente de IA me ha dado consejos que me ahorraron dinero real.",
      author: "Laura Martínez",
      role: "Propietaria de Restaurante",
    },
    {
      quote: "Pensé que sería difícil de usar, pero es como chatear con un amigo que sabe de finanzas. Totalmente recomendado.",
      author: "Andrés Silva",
      role: "Emprendedor",
    }
  ];

  return (
    <section id="testimonios" className="py-24 px-6 border-y border-slate-200/60 dark:border-white/5 bg-slate-100/50 dark:bg-slate-950/40 relative z-10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-xl mx-auto">
            Empresarios de toda la región confían en Luka AI para su día a día.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, i) => (
            <div 
              key={i} 
              className="p-8 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 shadow-lg shadow-black/5 dark:shadow-slate-950/50 hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1.5 transition-all duration-300 relative flex flex-col justify-between"
            >
              <div className="text-5xl text-emerald-500/20 absolute top-3 left-6 font-serif select-none">"</div>
              <p className="text-slate-700 dark:text-slate-300 mb-8 relative z-10 leading-relaxed font-medium pt-3">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold flex items-center justify-center text-lg shrink-0">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{testimonial.author}</h4>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
