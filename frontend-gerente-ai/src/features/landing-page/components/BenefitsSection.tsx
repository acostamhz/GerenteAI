import { LineChart, MessageCircle, Zap, Shield } from 'lucide-react';
import { motion } from 'motion/react';

const benefits = [
  {
    title: 'Registro desde WhatsApp',
    description: 'Olvídate de las hojas de cálculo. Envía un mensaje a tu asistente y él registrará tus gastos o ingresos automáticamente.',
    icon: <MessageCircle className="w-6 h-6 text-emerald-400" />,
    className: 'md:col-span-2 md:row-span-2 bg-gradient-to-br from-slate-900 to-slate-950 border border-white/5',
  },
  {
    title: 'Análisis en tiempo real',
    description: 'Visualiza tus métricas clave, flujo de caja y rentabilidad en un dashboard intuitivo y siempre actualizado.',
    icon: <LineChart className="w-6 h-6 text-emerald-400" />,
    className: 'md:col-span-1 bg-slate-900/50 border border-white/5',
  },
  {
    title: 'Inteligencia Artificial',
    description: 'Recibe consejos financieros personalizados y alertas tempranas sobre tu negocio.',
    icon: <Zap className="w-6 h-6 text-emerald-400" />,
    className: 'md:col-span-1 bg-slate-900/50 border border-white/5',
  },
  {
    title: 'Seguro y privado',
    description: 'Tus datos financieros están encriptados y seguros en la nube.',
    icon: <Shield className="w-6 h-6 text-emerald-400" />,
    className: 'md:col-span-2 bg-slate-900/50 border border-white/5 flex flex-row items-center gap-6',
    horizontal: true
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 }
  }
};

export function BenefitsSection() {
  return (
    <section id="beneficios" className="py-24 px-6 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 font-heading">Todo lo que necesitas en un solo lugar</h2>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
            Hemos diseñado una herramienta que simplifica la administración sin quitarte tiempo valioso.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]"
        >
          {benefits.map((benefit, i) => (
            <motion.div 
              key={i} 
              variants={itemVariants}
              className={`p-8 rounded-3xl flex ${benefit.horizontal ? 'flex-row items-center' : 'flex-col'} gap-6 transition-transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-emerald-500/10 ${benefit.className}`}
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                {benefit.icon}
              </div>
              <div>
                <h3 className="text-xl font-bold mb-3 font-heading">{benefit.title}</h3>
                <p className="text-slate-400 leading-relaxed">{benefit.description}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
