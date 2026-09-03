"use client";

import { Check, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { planesApi, PlanBackend, PLANES_FALLBACK } from "@/shared/api/planesApi";
import { lukaWhatsappUrl } from "@/lib/whatsapp";

type BillingPeriod = "monthly" | "annual";

const PRECIO_FORMATTER = new Intl.NumberFormat("es-CO");

export function CoworkingPricingSection() {
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [catalogo, setCatalogo] = useState<PlanBackend[]>(PLANES_FALLBACK);

  useEffect(() => {
    planesApi.getPlanesCatalogo().then((planes) => {
      if (planes && planes.length > 0) {
        setCatalogo(planes);
      }
    });
  }, []);

  const planAsistente = catalogo.find((p) => p.id === 1) || PLANES_FALLBACK[0];
  const planGerente = catalogo.find((p) => p.id === 2) || PLANES_FALLBACK[1];
  const planAdmin = catalogo.find((p) => p.id === 3) || PLANES_FALLBACK[2];
  const planSocio = catalogo.find((p) => p.id === 4) || PLANES_FALLBACK[3];
  const planCorp = catalogo.find((p) => p.id === 5) || PLANES_FALLBACK[4];

  const plans = [
    {
      name: "Asistente",
      description: "Empieza a organizar tu negocio con Luka.",
      monthlyPrice: "Gratis",
      annualPrice: "Gratis",
      annualBilling: "",
      features: [
        "Registro de ventas y gastos",
        "Consultas por WhatsApp",
        "Reportes básicos",
        "100 mensajes de IA / mes",
        "1 sede comercial",
      ],
      button: "Comenzar gratis",
      link: "/register",
      featured: false,
      dark: false,
    },
    {
      name: "Gerente",
      description: "Control total y copiloto con IA para 1 sede.",
      monthlyPrice: `$${PRECIO_FORMATTER.format(planGerente.precioMensual)}`,
      annualPrice: `$${PRECIO_FORMATTER.format(planGerente.precioMensual)}`,
      annualBilling: "Solo disponible mensual",
      features: [
        "Todo lo del plan Asistente",
        "Cuentas por Cobrar (Fiados)",
        "Reportes avanzados",
        "600 mensajes de IA / mes",
        "1 sede premium",
      ],
      button: "Elegir plan",
      link: "/subscription",
      featured: false,
      dark: false,
    },
    {
      name: "Administrador",
      description: "La mejor opción para pymes con varias sucursales.",
      monthlyPrice: `$${PRECIO_FORMATTER.format(planAdmin.precioMensual)}`,
      annualPrice: `$${PRECIO_FORMATTER.format(Math.round(planAdmin.precioAnual / 12))}`,
      annualBilling: `Facturado $${PRECIO_FORMATTER.format(planAdmin.precioAnual)}/año`,
      features: [
        "Todo lo del plan Gerente",
        "Multi-sede comparativa",
        "Inventario inteligente",
        "Exportación a Excel",
        "1.500 mensajes de IA / mes",
        `Hasta ${planAdmin.maxSedes} sedes`,
      ],
      button: "Elegir plan",
      link: "/subscription",
      featured: true,
      dark: false,
    },
    {
      name: "Socio",
      description: "Para cadenas que requieren máxima escala.",
      monthlyPrice: `$${PRECIO_FORMATTER.format(planSocio.precioMensual)}`,
      annualPrice: `$${PRECIO_FORMATTER.format(Math.round(planSocio.precioAnual / 12))}`,
      annualBilling: `Facturado $${PRECIO_FORMATTER.format(planSocio.precioAnual)}/año`,
      features: [
        "Todo lo del plan Administrador",
        `Hasta ${planSocio.maxSedes} sedes`,
        "Auditoría continua de negocio",
        "IA avanzada predictiva",
        "3.000 mensajes de IA / mes",
        "Soporte prioritario",
      ],
      button: "Elegir plan",
      link: "/subscription",
      featured: false,
      dark: false,
    },
    {
      name: "Corporativo",
      description: "Una solución diseñada para empresas a la medida.",
      monthlyPrice: "Cotizar",
      annualPrice: "Cotizar",
      annualBilling: "",
      features: [
        "Sedes por definir",
        "Mensajes de IA por definir",
        "Reportes avanzados",
        "Integraciones API y ERP personalizadas",
        "Soporte 24/7 y VIP",
      ],
      button: "Hablar con ventas",
      link: lukaWhatsappUrl("Hola Luka 👋, quisiera información sobre el Plan Corporativo de Luka AI"),
      featured: false,
      dark: true,
    },
  ];

  return (
    <section
      id="planes"
      className="relative py-24 px-6 md:px-12"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
            Planes y Precios
          </span>

          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
            Elige el plan ideal
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-cyan-500">
              para la etapa de tu negocio
            </span>
          </h2>

          <p className="mt-4 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Comienza gratis y escala con herramientas impulsadas por IA cuando
            tu negocio lo necesite.
          </p>
        </div>

        {/* Toggle mensual / anual */}
        <div className="flex justify-center mb-16">
          <div className="relative inline-flex items-center p-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-inner">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                billingPeriod === "monthly"
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {billingPeriod === "monthly" && (
                <motion.div
                  layoutId="active-landing-billing-pill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-full shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              Mensual
            </button>

            <button
              onClick={() => setBillingPeriod("annual")}
              className={`relative z-10 px-6 py-2.5 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                billingPeriod === "annual"
                  ? "text-slate-900 dark:text-white"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {billingPeriod === "annual" && (
                <motion.div
                  layoutId="active-landing-billing-pill"
                  className="absolute inset-0 bg-white dark:bg-slate-900 rounded-full shadow-sm -z-10"
                  transition={{ type: "spring", stiffness: 450, damping: 35 }}
                />
              )}
              <span>Anual</span>
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                Ahorra 16%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 items-stretch">
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
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={billingPeriod}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.15 }}
                      >
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
                      </motion.div>
                    </AnimatePresence>
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

                  {/* Button / Link */}
                  {plan.link.startsWith("http") ? (
                    <a
                      href={plan.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-full mt-8 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 text-center hover:scale-[1.02] active:scale-[0.98] ${
                        plan.featured
                          ? "bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
                          : plan.dark
                            ? "bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                            : "bg-gradient-to-r from-emerald-600 to-cyan-500 text-white hover:from-emerald-700 hover:to-cyan-600 shadow-lg shadow-emerald-500/15"
                      }`}
                    >
                      {plan.button}
                    </a>
                  ) : (
                    <Link
                      to={plan.link}
                      className={`w-full mt-8 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-300 text-center hover:scale-[1.02] active:scale-[0.98] ${
                        plan.featured
                          ? "bg-white text-slate-800 hover:bg-slate-50 shadow-sm"
                          : plan.dark
                            ? "bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
                            : "bg-gradient-to-r from-emerald-600 to-cyan-500 text-white hover:from-emerald-700 hover:to-cyan-600 shadow-lg shadow-emerald-500/15"
                      }`}
                    >
                      {plan.button}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}