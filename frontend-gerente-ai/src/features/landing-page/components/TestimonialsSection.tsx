import { motion } from 'motion/react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 20 }
  }
};

export function TestimonialsSection() {
  const testimonials = [
    {
      quote: "Desde que uso Gerente AI, dejé de perder horas en Excel. Ahora solo le envío un mensaje y sé exactamente cuánto he ganado en el mes.",
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
    <section id="testimonios" className="py-24 px-6 bg-slate-900/20 border-y border-white/5 relative z-10">
      <div className="max-w-6xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold mb-16 text-center font-heading"
        >
          Lo que dicen nuestros clientes
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {testimonials.map((testimonial, i) => (
            <motion.div key={i} variants={itemVariants} className="p-8 rounded-3xl bg-slate-900/50 border border-white/5 relative">
              <div className="text-4xl text-emerald-500/20 absolute top-4 left-4 font-serif">"</div>
              <p className="text-slate-300 mb-8 relative z-10 italic">
                {testimonial.quote}
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-emerald-400 font-bold">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-100">{testimonial.author}</h4>
                  <p className="text-sm text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
