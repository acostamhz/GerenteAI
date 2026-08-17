import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  {
    question: "¿Necesito saber de contabilidad para usar Luka AI?",
    answer: "No, en absoluto. Nuestra Inteligencia Artificial está diseñada para que cualquier persona pueda gestionar su negocio como un experto sin conocimientos previos."
  },
  {
    question: "¿Cómo funciona el registro por WhatsApp?",
    answer: "Simplemente nos escribes como si hablaras con un amigo: 'Gasté 50.000 en insumos hoy'. Nuestro asistente lo clasifica y lo registra en tu dashboard automáticamente."
  },
  {
    question: "¿Qué tan seguros están mis datos?",
    answer: "Utilizamos encriptación de nivel bancario. Nadie más tiene acceso a tu información financiera y nunca la compartiremos con terceros."
  },
  {
    question: "¿Puedo cambiar de plan más adelante?",
    answer: "Sí, puedes mejorar o cancelar tu plan en cualquier momento desde la configuración de tu cuenta sin penalizaciones."
  }
];

export function CoworkingFaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 px-6 relative z-10">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-12 text-center tracking-tight">
          Preguntas Frecuentes
        </h2>
        
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className="border border-slate-200/80 dark:border-white/10 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-md shadow-black/5 dark:shadow-slate-950/40 overflow-hidden transition-all"
            >
              <button
                className="w-full px-6 py-5 flex items-center justify-between text-left font-bold text-slate-900 dark:text-white text-lg focus:outline-none"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span>{faq.question}</span>
                <ChevronDown className={`w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-300 ${openIndex === i ? "rotate-180" : ""}`} />
              </button>
              
              <div 
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === i ? "max-h-48 pb-6 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-slate-600 dark:text-slate-300 font-medium leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
