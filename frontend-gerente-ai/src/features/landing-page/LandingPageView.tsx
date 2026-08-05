import { LandingNavbar } from './components/LandingNavbar';
import { HeroSection } from './components/HeroSection';
import { MediaSection } from './components/MediaSection';
import { BenefitsSection } from './components/BenefitsSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { FooterSection } from './components/FooterSection';

export function LandingPageView() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-emerald-500/30">
      {/* Background with heavily blurred custom abstract image */}
      <div className="fixed inset-0 z-0 bg-slate-950 overflow-hidden">
        <img 
          src="/landing-bg.png" 
          alt="Ambient Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 blur-[120px] scale-110 saturate-150 animate-pulse duration-1000"
          style={{ animationDuration: '10s' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/80 to-slate-950"></div>
      </div>
      
      <div className="relative z-10">
        <LandingNavbar />
        <HeroSection />
        <MediaSection />
        <BenefitsSection />
        <TestimonialsSection />
        <FaqSection />
        <FooterSection />
      </div>
    </div>
  );
}
