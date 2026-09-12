"use client";

import { Check, Star, Sparkles } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  planesApi,
  PlanBackend,
  PLANES_FALLBACK,
} from "@/shared/api/planesApi";
import { lukaWhatsappUrl } from "@/lib/whatsapp";

type BillingPeriod = "monthly" | "annual";

const PRECIO_FORMATTER = new Intl.NumberFormat("es-CO");

export function CoworkingPricingSection() {
  const [billingPeriod, setBillingPeriod] =
    useState<BillingPeriod>("monthly");

  const [catalogo, setCatalogo] =
    useState<PlanBackend[]>(PLANES_FALLBACK);

  useEffect(() => {
    planesApi.getPlanesCatalogo().then((planes) => {
      if (planes && planes.length > 0) {
        setCatalogo(planes);
      }
    });
  }, []);

  const planAsistente =
    catalogo.find((p) => p.id === 1) || PLANES_FALLBACK[0];

  const planGerente =
    catalogo.find((p) => p.id === 2) || PLANES_FALLBACK[1];

  const planAdmin =
    catalogo.find((p) => p.id === 3) || PLANES_FALLBACK[2];

  const planSocio =
    catalogo.find((p) => p.id === 4) || PLANES_FALLBACK[3];

  const planCorp =
    catalogo.find((p) => p.id === 5) || PLANES_FALLBACK[4];

  const plans = [
    {
      name: "Asistente",
      eyebrow: "PARA EMPEZAR",
      description:
        "Empieza a organizar tu negocio con Luka.",
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
      eyebrow: "PARA CRECER",
      description:
        "Control total y copiloto con IA para 1 sede.",
      monthlyPrice: `$${PRECIO_FORMATTER.format(
        planGerente.precioMensual,
      )}`,
      annualPrice: `$${PRECIO_FORMATTER.format(
        planGerente.precioMensual,
      )}`,
      annualBilling: "Solo disponible mensual",
      features: [
        "Todo lo del plan Asistente",
        "Cuentas por Cobrar (Fiados)",
        "Reportes avanzados",
        "500 mensajes de IA / mes",
        "1 sede premium",
      ],
      button: "Elegir plan",
      link: "/subscription",
      featured: false,
      dark: false,
    },
    {
      name: "Administrador",
      eyebrow: "MÁS ELEGIDO",
      description:
        "La mejor opción para pymes con varias sucursales.",
      monthlyPrice: `$${PRECIO_FORMATTER.format(
        planAdmin.precioMensual,
      )}`,
      annualPrice: `$${PRECIO_FORMATTER.format(
        Math.round(planAdmin.precioAnual / 12),
      )}`,
      annualBilling: `Facturado $${PRECIO_FORMATTER.format(
        planAdmin.precioAnual,
      )}/año`,
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
      eyebrow: "PARA ESCALAR",
      description:
        "Para cadenas que requieren máxima escala.",
      monthlyPrice: `$${PRECIO_FORMATTER.format(
        planSocio.precioMensual,
      )}`,
      annualPrice: `$${PRECIO_FORMATTER.format(
        Math.round(planSocio.precioAnual / 12),
      )}`,
      annualBilling: `Facturado $${PRECIO_FORMATTER.format(
        planSocio.precioAnual,
      )}/año`,
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
      eyebrow: "A MEDIDA",
      description:
        "Una solución diseñada para empresas a la medida.",
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
      link: lukaWhatsappUrl(
        "Hola Luka 👋, quisiera información sobre el Plan Corporativo de Luka AI",
      ),
      featured: false,
      dark: true,
    },
  ];

  return (
    <section
      id="planes"
      className="relative -mt-7 overflow-hidden px-6 pb-24 pt-0 md:-mt-18 md:px-12 md:pb-32 md:pt-0"
    >
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[12%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-emerald-500/[0.045] blur-[140px]" />

        <div className="absolute right-[-180px] top-[42%] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.025] blur-[130px]" />

        <div className="absolute bottom-[5%] left-[-180px] h-[380px] w-[380px] rounded-full bg-teal-500/[0.025] blur-[130px]" />
      </div>

      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.07] px-4 py-2 text-sm font-semibold text-emerald-400">
            <Sparkles className="h-4 w-4" />
            <span>Planes para cada etapa</span>
          </div>

          <h2 className="text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl md:text-6xl">
            Luka crece
            <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              contigo.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-400 md:text-lg">
            Empieza gratis y escala cuando tu negocio lo necesite.
            Elige las herramientas que tienen sentido para tu etapa.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="mt-10 flex justify-center">
          <div className="inline-flex items-center rounded-full border border-slate-700/80 bg-slate-900/80 p-1.5 shadow-[0_15px_40px_-20px_rgba(0,0,0,0.8)]">
            <button
              type="button"
              onClick={() => setBillingPeriod("monthly")}
              className={`relative z-10 rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                billingPeriod === "monthly"
                  ? "text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {billingPeriod === "monthly" && (
                <motion.div
                  layoutId="active-landing-billing-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}

              Mensual
            </button>

            <button
              type="button"
              onClick={() => setBillingPeriod("annual")}
              className={`relative z-10 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold transition-colors ${
                billingPeriod === "annual"
                  ? "text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {billingPeriod === "annual" && (
                <motion.div
                  layoutId="active-landing-billing-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}

              <span>Anual</span>

              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                Ahorra 16%
              </span>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="mt-16 grid grid-cols-1 items-stretch gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {plans.map((plan) => {
            const price =
              billingPeriod === "monthly"
                ? plan.monthlyPrice
                : plan.annualPrice;

            const isFeatured = plan.featured;
            const isCorporate = plan.dark;

            return (
              <motion.div
                key={plan.name}
                whileHover={{ y: -5 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 25,
                }}
                className={`group relative flex h-full min-h-[570px] flex-col overflow-visible rounded-[1.75rem] border ${
                  isFeatured
                    ? "border-emerald-400/30 bg-gradient-to-b from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-[0_30px_80px_-35px_rgba(16,185,129,0.55)]"
                    : isCorporate
                      ? "border-slate-700/70 bg-slate-900 text-white"
                      : "border-slate-800 bg-slate-900/75 text-white backdrop-blur-sm"
                }`}
              >
                {/* Featured decorative glow */}
                {isFeatured && (
                  <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.75rem]">
                    <div className="absolute right-[-70px] top-[-70px] h-48 w-48 rounded-full bg-white/10 blur-3xl" />

                    <div className="absolute bottom-[-80px] left-[-60px] h-48 w-48 rounded-full bg-cyan-300/10 blur-3xl" />
                  </div>
                )}

                {/* Popular badge */}
                {isFeatured && (
                  <div className="absolute -top-4 left-1/2 z-20 -translate-x-1/2">
                    <div className="flex items-center gap-1.5 rounded-full bg-amber-400 px-5 py-2 text-xs font-extrabold text-slate-950 shadow-lg">
                      <Star className="h-3.5 w-3.5 fill-current" />
                      MÁS POPULAR
                    </div>
                  </div>
                )}

                <div className="relative flex h-full flex-col p-6 md:p-7">
                  {/* Eyebrow */}
                  <div className="mb-5">
                    <span
                      className={`text-[10px] font-extrabold tracking-[0.2em] ${
                        isFeatured
                          ? "text-white/75"
                          : isCorporate
                            ? "text-cyan-400"
                            : "text-emerald-400"
                      }`}
                    >
                      {plan.eyebrow}
                    </span>
                  </div>

                  {/* Plan name */}
                  <div>
                    <h3 className="text-2xl font-extrabold tracking-tight">
                      {plan.name}
                    </h3>

                    <p
                      className={`mt-3 min-h-[48px] text-sm leading-relaxed ${
                        isFeatured
                          ? "text-white/80"
                          : "text-slate-400"
                      }`}
                    >
                      {plan.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mt-7">
                    <AnimatePresence
                      mode="wait"
                      initial={false}
                    >
                      <motion.div
                        key={billingPeriod}
                        initial={{
                          opacity: 0,
                          y: -5,
                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                        }}
                        exit={{
                          opacity: 0,
                          y: 5,
                        }}
                        transition={{
                          duration: 0.16,
                        }}
                      >
                        {/* Precio */}
                        <div
                          className={`text-[2.65rem] font-black leading-none tracking-[-0.045em] ${
                            isFeatured
                              ? "text-white"
                              : "text-white"
                          }`}
                        >
                          {price}
                        </div>

                        {/* Periodo */}
                        {plan.name !== "Asistente" &&
                          plan.name !== "Corporativo" && (
                            <span
                              className={`mt-2 block text-sm font-medium ${
                                isFeatured
                                  ? "text-white/75"
                                  : "text-slate-500"
                              }`}
                            >
                              /mes
                            </span>
                          )}

                        {/* Facturación anual */}
                        {billingPeriod === "annual" &&
                          plan.annualBilling && (
                            <p
                              className={`mt-2 text-[11px] font-medium ${
                                isFeatured
                                  ? "text-white/70"
                                  : "text-slate-500"
                              }`}
                            >
                              {plan.annualBilling}
                            </p>
                          )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Divider */}
                  <div
                    className={`my-7 h-px ${
                      isFeatured
                        ? "bg-white/15"
                        : "bg-slate-800"
                    }`}
                  />

                  {/* Features */}
                  <div className="flex-1">
                    <ul className="space-y-3.5">
                      {plan.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-sm"
                        >
                          <span
                            className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                              isFeatured
                                ? "bg-white/15"
                                : "bg-emerald-500/10"
                            }`}
                          >
                            <Check
                              className={`h-2.5 w-2.5 ${
                                isFeatured
                                  ? "text-white"
                                  : "text-emerald-400"
                              }`}
                            />
                          </span>

                          <span
                            className={
                              isFeatured
                                ? "text-white/90"
                                : "text-slate-300"
                            }
                          >
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA */}
                  {plan.link.startsWith("http") ? (
                    <a
                      href={plan.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`mt-8 flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-extrabold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                        isFeatured
                          ? "bg-white text-slate-900 hover:bg-slate-50"
                          : isCorporate
                            ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                            : "bg-emerald-500 text-white hover:bg-emerald-400"
                      }`}
                    >
                      {plan.button}
                    </a>
                  ) : (
                    <Link
                      to={plan.link}
                      className={`mt-8 flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-extrabold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                        isFeatured
                          ? "bg-white text-slate-900 hover:bg-slate-50"
                          : isCorporate
                            ? "bg-cyan-400 text-slate-950 hover:bg-cyan-300"
                            : "bg-emerald-500 text-white hover:bg-emerald-400"
                      }`}
                    >
                      {plan.button}
                    </Link>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom message */}
        <div className="mx-auto mt-14 max-w-3xl text-center">
          <p className="text-sm leading-relaxed text-slate-500">
            No necesitas empezar con todo.
            <span className="font-semibold text-slate-300">
              {" "}
              Empieza con lo que necesitas hoy y crece con Luka.
            </span>
          </p>
        </div>
      </div>
    </section>
  );
}