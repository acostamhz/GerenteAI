import { CreditCard, Sparkles, History, Zap, ShieldCheck, Check, Building2, MessageSquare, Phone } from "lucide-react";

export function SubscriptionView() {
  const plans = [
    {
      name: "Asistente",
      price: "Gratuito",
      description: "Para empezar a explorar el poder de la IA en tu negocio.",
      features: [
        { icon: Phone, text: "1 número de WhatsApp" },
        { icon: MessageSquare, text: "50 mensajes de IA / mes" },
        { icon: Building2, text: "1 negocio" }
      ],
      isPopular: false,
      isActive: false,
      buttonText: "Plan Actual",
      disabled: true
    },
    {
      name: "Gerente",
      price: "79.900",
      currency: "COP",
      period: "/mes",
      description: "Ideal para pymes que necesitan automatización básica.",
      features: [
        { icon: Phone, text: "Hasta 3 números de WhatsApp" },
        { icon: MessageSquare, text: "500 mensajes de IA / mes" },
        { icon: Building2, text: "Hasta 4 negocios" }
      ],
      isPopular: true,
      isActive: true,
      buttonText: "Plan Actual",
      disabled: true
    },
    {
      name: "Director",
      price: "249.900",
      currency: "COP",
      period: "/mes",
      description: "Para empresas establecidas con alto volumen de consultas.",
      features: [
        { icon: Phone, text: "Hasta 10 números de WhatsApp" },
        { icon: MessageSquare, text: "5000 mensajes de IA / mes" },
        { icon: Building2, text: "Hasta 10 negocios" }
      ],
      isPopular: false,
      isActive: false,
      buttonText: "Mejorar a Director",
      disabled: false
    },
    {
      name: "Corporativo",
      price: "Contáctanos",
      description: "Soluciones a la medida para grandes corporaciones.",
      features: [
        { icon: Phone, text: "Números de WhatsApp ilimitados" },
        { icon: MessageSquare, text: "Volumen de mensajes personalizado" },
        { icon: Building2, text: "Negocios ilimitados" }
      ],
      isPopular: false,
      isActive: false,
      buttonText: "Contactar Ventas",
      disabled: false
    }
  ];

  return (
    <div className="pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Planes y Suscripción</h1>
          <p className="text-muted-foreground mt-1">Gestiona tu plan y escala el poder de Gerente AI</p>
        </div>
      </div>

      {/* Pricing Plans (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {plans.map((plan, index) => (
          <div 
            key={index} 
            className={`relative flex flex-col bg-card border rounded-3xl p-6 shadow-sm transition-all duration-300 ${
              plan.isActive 
                ? "border-emerald-500 ring-1 ring-emerald-500/20" 
                : "border-border hover:border-emerald-500/50"
            }`}
          >
            {plan.isPopular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-emerald-600 to-emerald-400 text-white text-[10px] font-bold uppercase tracking-wider rounded-full shadow-sm">
                Más Popular
              </div>
            )}
            
            <div className="mb-6">
              <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                {plan.name}
                {plan.isActive && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Plan Activo" />
                )}
              </h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-3xl font-black text-foreground">{plan.price}</span>
                {plan.currency && (
                  <span className="text-sm font-bold text-muted-foreground">{plan.currency}</span>
                )}
                {plan.period && (
                  <span className="text-sm font-medium text-muted-foreground">{plan.period}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground h-10">{plan.description}</p>
            </div>

            <div className="flex-1 space-y-4 mb-6">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{feature.text}</span>
                </div>
              ))}
            </div>

            <button 
              disabled={plan.disabled}
              className={`w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                plan.isActive 
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20" 
                  : plan.name === "Director"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    : "bg-muted hover:bg-muted/80 text-foreground"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Usage Limits - Medium Card */}
        <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="font-bold text-foreground">Consumo de IA</h3>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-md">Plan Gerente</span>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <span className="text-3xl font-black tracking-tighter">120</span>
              <span className="text-sm font-semibold text-muted-foreground mb-1">/ 500 msgs</span>
            </div>
            
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
              <div className="w-[24%] h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full" />
            </div>
            
            <p className="text-xs text-muted-foreground font-medium mt-3 text-center">
              Tu consumo se reinicia en 12 días
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground">Método de Pago</h3>
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer">
              Editar
            </button>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-muted/20 mt-auto">
            <div className="w-12 h-8 bg-black rounded flex items-center justify-center">
              <span className="text-white font-black italic text-xs">VISA</span>
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">Visa terminada en 4242</p>
              <p className="text-xs text-muted-foreground">Expira en 12/26</p>
            </div>
            <div className="ml-auto">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="md:col-span-4 bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <History className="w-4 h-4 text-muted-foreground" />
              </div>
              <h3 className="font-bold text-foreground">Facturas</h3>
            </div>
            <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors cursor-pointer">
              Ver todo
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {[
              { date: "15 Ago 2025", amount: "79.900", status: "Pagado" },
              { date: "15 Jul 2025", amount: "79.900", status: "Pagado" },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer border border-transparent hover:border-border">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-sm text-foreground">{invoice.date}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">${invoice.amount}</span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">PDF</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
