import { ArrowRight, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export function InvestorSection() {
  return (
    <section id="inversores" className="py-24 px-6 relative z-10">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, type: "spring", stiffness: 100, damping: 20 }}
          className="rounded-3xl bg-gradient-to-r from-emerald-900/40 to-slate-900 p-8 md:p-12 border border-emerald-500/20 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 text-emerald-500/10 rotate-12">
            <TrendingUp className="w-64 h-64" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-6 font-heading">¿Eres Inversor?</h2>
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Estamos transformando la manera en que millones de micronegocios gestionan sus finanzas en LATAM. Únete a nuestra ronda de inversión y sé parte del crecimiento.
            </p>
            
            <a href="mailto:inversores@gerente.ai" className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-950 font-bold text-lg hover:bg-slate-200 transition-colors shadow-xl">
              Contáctanos
              <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
