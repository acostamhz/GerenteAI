import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion } from 'motion/react';

const faqs = [
  {
    question: '¿Necesito saber de contabilidad para usar Luka AI?',
    answer: 'No, en absoluto. Nuestra Inteligencia Artificial está diseñada para que cualquier persona pueda gestionar su negocio como un experto sin conocimientos previos.'
  },
  {
    question: '¿Cómo funciona el registro por WhatsApp?',
    answer: 'Simplemente nos escribes como si hablaras con un amigo: "Gasté 50.000 en insumos hoy". Nuestro asistente lo clasifica y lo registra en tu dashboard automáticamente.'
  },
  {
    question: '¿Qué tan seguros están mis datos?',
    answer: 'Utilizamos encriptación de nivel bancario. Nadie más tiene acceso a tu información financiera y nunca la compartiremos con terceros.'
  },
  {
    question: '¿Puedo cambiar de plan más adelante?',
    answer: 'Sí, puedes mejorar o cancelar tu plan en cualquier momento desde la configuración de tu cuenta sin penalizaciones.'
  }
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 relative z-10">
      <div className="max-w-3xl mx-auto">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-5xl font-bold mb-12 text-center font-heading"
        >
          Preguntas Frecuentes
        </motion.h2>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-4"
        >
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="border border-white/10 rounded-2xl bg-slate-900/30 overflow-hidden transition-all duration-300"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span className="font-semibold text-lg">{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-emerald-400 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`} />
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === i ? 'max-h-48 pb-5 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-slate-400">{faq.answer}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
