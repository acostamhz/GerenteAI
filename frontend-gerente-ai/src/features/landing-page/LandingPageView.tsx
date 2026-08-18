import { CoworkingNavbar } from "./components/CoworkingNavbar";
import { CoworkingHeroSection } from "./components/CoworkingHeroSection";
import { CoworkingHighlightsSection } from "./components/CoworkingHighlightsSection";
import { CoworkingBusinessesSection } from "./components/CoworkingBusinessesSection";
import { CoworkingHowItWorksSection } from "./components/CoworkingHowItWorksSection";
import { LocationsBento } from "./components/LocationsBento";
import { CoworkingBenefitsSection } from "./components/CoworkingBenefitsSection";
import { CoworkingFeaturesSection } from "./components/CoworkingFeaturesSection";
import { CoworkingPhilosophySection } from "./components/CoworkingPhilosophySection";
import { CoworkingTestimonialsSection } from "./components/CoworkingTestimonialsSection";
import { CoworkingPricingSection } from "./components/CoworkingPricingSection";
import { CoworkingFaqSection } from "./components/CoworkingFaqSection";
import { CoworkingFooterSection } from "./components/CoworkingFooterSection";

import { LukaChatProvider, LukaFloatingChat } from "@/features/assistant";

export function LandingPageView() {
  return (
    <LukaChatProvider>
      <div
        className="min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-50 transition-colors duration-500 font-sans relative overflow-hidden selection:bg-emerald-500/30"
      >
      {/* Modern Gradient Background & Ambient Lighting */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.18),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.22),transparent_70%)] blur-3xl" />

        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.15),transparent_70%)] blur-3xl" />

        <div className="absolute top-1/2 -left-40 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.12),transparent_70%)] dark:bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.15),transparent_70%)] blur-3xl" />

        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.1),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(15,23,42,0.8),transparent_70%)] blur-3xl" />

        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800d_1px,transparent_1px),linear-gradient(to_bottom,#8080800d_1px,transparent_1px)] bg-[size:36px_36px] dark:bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)]" />
      </div>

      <div className="relative z-10">
        <CoworkingNavbar />

        <main>
          {/* Inicio */}
          <section id="inicio" className="scroll-mt-28">
            <CoworkingHeroSection />
          </section>

          {/* Beneficios */}
          <section id="beneficios" className="scroll-mt-28">
            <CoworkingHighlightsSection />
          </section>

          {/* Negocios */}
          <section id="negocios" className="scroll-mt-28">
            <CoworkingBusinessesSection />
          </section>

          {/* Cómo funciona */}
          <section id="como-funciona" className="scroll-mt-28">
            <CoworkingHowItWorksSection />
          </section>

          {/* Ubicaciones / tipos de negocio */}
          <section id="ubicaciones" className="scroll-mt-28">
            <LocationsBento />
          </section>

          {/* Beneficios adicionales */}
          <section id="ventajas" className="scroll-mt-28">
            <CoworkingBenefitsSection />
          </section>

          {/* Características */}
          <section id="caracteristicas" className="scroll-mt-28">
            <CoworkingFeaturesSection />
          </section>

          {/* Filosofía */}
          <section id="filosofia" className="scroll-mt-28">
            <CoworkingPhilosophySection />
          </section>

          {/* Testimonios */}
          <section id="testimonios" className="scroll-mt-28">
            <CoworkingTestimonialsSection />
          </section>

          {/* Planes */}
          <section id="planes" className="scroll-mt-28">
            <CoworkingPricingSection />
          </section>

          {/* Preguntas frecuentes */}
          <section id="faq" className="scroll-mt-28">
            <CoworkingFaqSection />
          </section>
        </main>

        <CoworkingFooterSection />
      </div>

      {/* Global Floating Chat Widget */}
      <LukaFloatingChat />
    </div>
    </LukaChatProvider>
  );
}
