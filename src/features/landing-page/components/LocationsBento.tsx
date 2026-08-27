import { MessageSquare, BarChart3, Zap, Shield } from "lucide-react";

export function LocationsBento() {
  const features = [
    {
      title: "Registro desde WhatsApp",
      description: "Olvídate de las hojas de cálculo. Envía un mensaje a tu asistente y él registrará tus gastos o ingresos automáticamente.",
      icon: MessageSquare,
      className: "md:col-span-2 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-white/80 dark:from-emerald-500/20 dark:via-teal-500/10 dark:to-slate-900/80",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      title: "Análisis en Tiempo Real",
      description: "Visualiza tus métricas clave, flujo de caja y rentabilidad en un dashboard intuitivo y siempre actualizado.",
      icon: BarChart3,
      className: "md:col-span-1 bg-white/70 dark:bg-slate-900/70",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Inteligencia Artificial",
      description: "Recibe consejos financieros personalizados y alertas tempranas sobre tu negocio.",
      icon: Zap,
      className: "md:col-span-1 bg-white/70 dark:bg-slate-900/70",
      iconColor: "text-amber-500",
    },
    {
      title: "Seguro y Privado",
      description: "Tus datos financieros están encriptados y seguros en la nube.",
      icon: Shield,
      className: "md:col-span-2 bg-gradient-to-br from-slate-100/90 to-white/70 dark:from-slate-900/90 dark:to-slate-800/70",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    }
  ];

  return (
    <section id="features" className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative z-10">
      <div className="mb-16 text-center md:text-left">
        <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">
          Todo lo que necesitas en un solo lugar
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-xl">
          Diseñado para simplificar tu operativa diaria con tecnología de punta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((feature, idx) => (
          <div 
            key={idx}
            className={`p-8 rounded-3xl border border-slate-200/80 dark:border-white/10 backdrop-blur-xl shadow-lg shadow-black/5 dark:shadow-slate-950/40 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-emerald-500/10 ${feature.className}`}
          >
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-800 shadow-md border border-slate-200/50 dark:border-white/10 flex items-center justify-center mb-6">
              <feature.icon className={`w-6 h-6 ${feature.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
