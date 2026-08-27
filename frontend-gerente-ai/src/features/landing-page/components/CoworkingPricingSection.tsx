"use client";

import { Check, Star } from "lucide-react";
import { useState } from "react";

type BillingPeriod = "monthly" | "annual";

const plans = [
  {
    name: "Asistente",
    description: "Empieza a organizar tu negocio con Luka.",
    monthlyPrice: "Gratis",
    annualPrice: "Gratis",
    annualBilling: "",
    features: [
      "Registro de ventas",
      "Registro de gastos",
      "Consultas por WhatsApp",
      "Reportes básicos",
      "1 negocio",
    ],
    button: "Comenzar gratis",
    featured: false,
    dark: false,
  },
  {
    name: "Gerente",
    description: "La mejor opción para la mayoría de negocios.",
    monthlyPrice: "$79.900",
    annualPrice: "$66.583",
    annualBilling: "Facturado $799.000/año",
    features: [
      "Todo lo del plan Asistente",
      "Inventario inteligente",
      "Clientes y proveedores",
      "IA conversacional completa",
      "Automatizaciones",
      "Hasta 4 sedes",
    ],
    button: "Probar 30 días",
    featured: true,
    dark: false,
  },
  {
    name: "Administrador",
    description: "Para negocios en crecimiento.",
    monthlyPrice: "$249.900",
    annualPrice: "$208.250",
    annualBilling: "Facturado $2.499.000/año",
    features: [
      "Todo lo del plan Gerente",
      "Hasta 10 sedes",
      "Roles de usuarios",
      "Indicadores avanzados",
      "Reportes ejecutivos",
    ],
    button: "Elegir plan",
    featured: false,
    dark: false,
  },
  {
    name: "Corporativo",
    description: "Una solución diseñada para empresas.",
    monthlyPrice: "Cotizar",
    annualPrice: "Cotizar",
    annualBilling: "",
    features: [
      "Sedes ilimitadas",
      "Integraciones",
      "Soporte prioritario",
      "Desarrollo personalizado",
      "Acompañamiento",
    ],
    button: "Hablar con ventas",
    featured: false,
    dark: true,
  },
];

export function CoworkingPricingSection() {
  const [billingPeriod, setBillingPeriod] =
    useState<BillingPeriod>("monthly");

  return (
    <section
      id="planes"
      className="relative py-24 px-6 md:px-12"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
            Planes
          </span>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Elige el plan ideal
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-500">
              para tu negocio.
            </span>
          </h2>

          <p className="mt-5 text-base md:text-lg text-slate-600 dark:text-slate-400">
            Empieza gratis y crece con Luka cuando tu negocio lo necesite.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-12">
          <div className="relative inline-flex items-center p-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`relative z-10 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                billingPeriod === "monthly"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600"
              }`}
            >
              Mensual
            </button>

            <button
              type="button"
              onClick={() => setBillingPeriod("annual")}
              className={`relative z-10 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                billingPeriod === "annual"
                  ? "bg-emerald-600 text-white shadow-md"
                  : "text-slate-700 dark:text-slate-300 hover:text-emerald-600"
              }`}
            >
              Anual
            </button>

            {/* Discount Badge */}
            <span className="absolute -top-2.5 -right-2.5 z-20 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold shadow-sm">
              -20%
            </span>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 items-stretch">
          {plans.map((plan) => {
            const price =
              billingPeriod === "monthly"
                ? plan.monthlyPrice
                : plan.annualPrice;

            return (
              <div
                key={plan.name}
                className={`relative rounded-2xl border transition-all duration-300 ${
                  plan.dark
                    ? "bg-[#0F172A] border-[#0F172A] text-white"
                    : plan.featured
                      ? "bg-gradient-to-b from-teal-600 to-cyan-600 border-teal-600 text-white shadow-xl shadow-emerald-500/15"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                }`}
              >
                {/* Popular Badge */}
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-amber-400 text-slate-900 text-xs font-bold shadow-md whitespace-nowrap">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      MÁS POPULAR
                    </div>
                  </div>
                )}

                <div className="p-6 flex flex-col h-full min-h-[570px]">
                  {/* Plan name */}
                  <div>
                    <h3
                      className={`text-xl font-bold ${
                        plan.featured || plan.dark
                          ? "text-white"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {plan.name}
                    </h3>

                    <p
                      className={`mt-2 text-sm leading-relaxed min-h-[44px] ${
                        plan.featured || plan.dark
                          ? "text-white/75"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-6">
                    <div
                      className={`text-4xl font-extrabold tracking-tight ${
                        plan.featured || plan.dark
                          ? "text-white"
                          : "text-slate-950 dark:text-white"
                      }`}
                    >
                      {price}
                    </div>

                    {plan.name !== "Asistente" &&
                      plan.name !== "Corporativo" && (
                        <>
                          <span
                            className={`text-sm font-medium ${
                              plan.featured
                                ? "text-white/80"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            /mes
                          </span>

                          {billingPeriod === "annual" && (
                            <p
                              className={`mt-1 text-xs font-medium ${
                                plan.featured
                                  ? "text-white/75"
                                  : "text-slate-500 dark:text-slate-500"
                              }`}
                            >
                              {plan.annualBilling}
                            </p>
                          )}
                        </>
                      )}
                  </div>

                  {/* Features */}
                  <div className="mt-7 flex-1">
                    <ul className="space-y-4">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 text-sm"
                        >
                          <Check
                            className={`w-4 h-4 mt-0.5 shrink-0 ${
                              plan.featured || plan.dark
                                ? "text-emerald-300"
                                : "text-emerald-500"
                            }`}
                          />

                          <span
                            className={
                              plan.featured || plan.dark
                                ? "text-white/90"
                                : "text-slate-700 dark:text-slate-300"
                            }
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Button */}
                  <button
                    type="button"
                    className={`w-full mt-8 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                      plan.featured
                        ? "bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
                        : plan.dark
                          ? "bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                          : "bg-gradient-to-r from-emerald-600 to-cyan-500 text-white hover:from-emerald-700 hover:to-cyan-600 shadow-lg shadow-emerald-500/15"
                    }`}
                  >
                    {plan.button}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}