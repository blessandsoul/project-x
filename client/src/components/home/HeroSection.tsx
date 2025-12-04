import { useEffect, useRef, useState, type CSSProperties, type WheelEvent, type FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

import { BENEFITS } from '@/components/home/BenefitsSection';
import { PhoneCompanyPreview } from './hero-widgets/PhoneCompanyPreview';
import { TabletAuctionPreview } from './hero-widgets/TabletAuctionPreview';
import { HeroCalculator } from './hero-widgets/HeroCalculator';
import { TestimonialsSection } from './testimonials';
import { HeroFloatingOrbs } from './hero-widgets/HeroFloatingOrbs';

interface HeroSectionProps {
  onSectionChange?: (id: 'hero' | 'testimonials') => void;
}

export const HeroSection: FC<HeroSectionProps> = ({ onSectionChange }) => {
  const { t } = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeSlide, setActiveSlide] = useState<'hero' | 'testimonials'>('hero');
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    onSectionChange?.(activeSlide);
  }, [activeSlide, onSectionChange]);

  const handleWheel = (event: WheelEvent<HTMLElement>) => {
    // Disable wheel scrolling on mobile (only enable on desktop lg+)
    if (window.innerWidth < 1024) return;
    
    if (isTransitioning) return;

    const direction = event.deltaY;

    if (direction > 20 && activeSlide === 'hero') {
      setIsTransitioning(true);
      setActiveSlide('testimonials');
      setTimeout(() => setIsTransitioning(false), 700);
    } else if (direction < -20 && activeSlide === 'testimonials') {
      setIsTransitioning(true);
      setActiveSlide('hero');
      setTimeout(() => setIsTransitioning(false), 700);
    }
  };

  const isHero = activeSlide === 'hero';

  const leftColumnStyle: CSSProperties = {
    transform: isHero
      ? 'translateX(0px) translateY(0px)'
      : 'translateX(-80px) translateY(30px)',
    opacity: isHero ? 1 : 0,
  };

  const rightColumnStyle: CSSProperties = {
    transform: isHero
      ? 'translateX(0px) translateY(0px) scale(1)'
      : 'translateX(80px) translateY(40px) scale(0.92)',
    opacity: isHero ? 1 : 0,
  };

  return (
    <section
      id="home-hero-section"
      ref={sectionRef}
      onWheel={handleWheel}
      className="relative hero-gradient-mesh min-h-screen flex items-center overflow-hidden bg-[#1F1F1F] lg:block"
    >
      {/* Enhanced animated background - deeper greens + warm orange accents */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        {/* Base green blurred blobs (static, more vivid) */}
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] bg-emerald-400/45 rounded-full blur-[110px]" />
        <div className="absolute top-1/4 -right-52 w-[640px] h-[640px] bg-emerald-500/35 rounded-full blur-[130px]" />
        <div className="absolute -bottom-52 left-1/4 w-[580px] h-[580px] bg-teal-400/35 rounded-full blur-[110px]" />

        {/* Warm orange glow behind tablet/phone (stronger and larger) */}
        <div className="absolute top-[28%] right-[6%] w-[520px] h-[520px] bg-orange-400/40 rounded-full blur-[120px]" />
        <div className="absolute top-[55%] right-[0%] w-[460px] h-[460px] bg-amber-300/32 rounded-full blur-[110px]" />

        {/* Floating Orbs & Ring Waves - Red/Salmon accent elements */}
        <HeroFloatingOrbs />

        {/* Subtle dark overlay to slightly mute the background */}
        <div className="absolute inset-0 bg-black/35" />
      </div>
      
      {/* Content container */}
      <div className="container mx-auto px-4 pt-[60px] pb-8 lg:pt-32 lg:pb-20 relative z-10">
        {/* Desktop: 2 columns side by side */}
        <div className="hidden lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] gap-10 items-start">
          
          {/* Left: Info blocks */}
          <div
            className="space-y-6 text-white will-change-transform transition-all duration-500 ease-out"
            style={leftColumnStyle}
          >
            {/* Benefits */}
            <div className="space-y-3">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-start gap-3 rounded-2xl border border-white/20 bg-white/5 px-4 py-4 shadow-lg shadow-black/10"
                >
                  <div className="flex h-12 w-12 flex-none items-center justify-center rounded-2xl bg-primary/20 text-white">
                    <Icon icon={benefit.icon} className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold leading-tight">
                      {t(`home.benefits.items.${benefit.id}.title`)}
                    </p>
                    <p className="text-sm text-white/75 leading-tight mt-0.5">
                      {t(`home.benefits.items.${benefit.id}.description`)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Stats badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/20">
                <div className="flex-shrink-0 bg-primary/20 text-primary p-2 rounded">
                  <Icon icon="mdi:shield-check" className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-white leading-tight">
                  14 კომპანია
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/20">
                <div className="flex-shrink-0 bg-primary/20 text-primary p-2 rounded">
                  <Icon icon="mdi:cash-multiple" className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-white leading-tight">
                  {t('home.hero.fixed_prices')}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-white/5 border border-white/20">
                <div className="flex-shrink-0 bg-primary/20 text-primary p-2 rounded">
                  <Icon icon="mdi:file-document-check" className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-sm font-semibold text-white leading-tight">
                  {t('home.hero.official_contracts')}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Phone */}
          {/* Wrapper - uses both group and peer logic for robust hover detection */}
          {/* pointer-events-none on wrapper ensures we only trigger hover when touching the actual devices (children) */}
          <div
            className="group flex items-start justify-end relative will-change-transform transition-all duration-500 ease-out pointer-events-none"
            style={rightColumnStyle}
          >
            {/* iPad - Auction Catalog (Behind) */}
            {/* Logic:
                1. peer: allows iPhone to react when iPad is hovered
                2. hover: moves itself when directly hovered
                3. group-hover: moves itself when iPhone (part of group) is hovered
            */}
            <div className="peer hidden xl:block absolute right-[200px] top-1/2 -translate-y-1/2 w-[380px] h-[510px] rotate-[-8deg] z-10 transition-transform duration-500 ease-out hover:-translate-x-16 hover:scale-105 group-hover:-translate-x-16 group-hover:scale-105 cursor-pointer pointer-events-auto">
              {/* Ambient glow */}
              <div className="absolute inset-0 rounded-[45px] bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-pink-500/20 blur-3xl opacity-50" aria-hidden="true" />
              
              {/* iPad Frame with shadow */}
              <div className="relative h-full w-full rounded-[45px] p-[8px] bg-gradient-to-b from-[#4a4a4a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.2)_inset,0_40px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                {/* Inner Bezel */}
                <div className="h-full w-full rounded-[37px] bg-black p-[10px] shadow-[0_0_3px_black_inset]">
                  {/* Screen Area */}
                  <div className="relative h-full w-full rounded-[27px] bg-slate-50 border border-slate-700/30 overflow-hidden">
                    
                    {/* Front Camera */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 rounded-full z-20 ring-1 ring-slate-800" />

                    {/* Content (Auction Catalog) */}
                    <div className="h-full bg-slate-50">
                      <TabletAuctionPreview />
                    </div>

                    {/* Home Indicator */}
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-900/30 rounded-full z-20" />
                  </div>
                </div>
              </div>
            </div>

            {/* iPhone 15 Pro - Company Catalog */}
            {/* Logic:
                1. peer-hover: moves right when iPad is hovered
                2. group-hover: moves right when group (wrapper) is hovered
            */}
            <div className="relative w-[280px] h-[570px] scale-[0.35] origin-top-right lg:scale-100 rotate-[5deg] z-20 transition-transform duration-500 ease-out peer-hover:translate-x-12 peer-hover:rotate-[2deg] group-hover:translate-x-12 group-hover:rotate-[2deg] cursor-pointer pointer-events-auto">
              {/* Ambient glow */}
              <div className="absolute inset-0 rounded-[55px] bg-gradient-to-br from-primary/30 via-emerald-500/20 to-teal-500/30 blur-3xl opacity-60" aria-hidden="true" />
              
              {/* iPhone Frame (Titanium finish) with shadow */}
              <div className="relative h-full w-full rounded-[55px] p-[6px] bg-gradient-to-b from-[#5a5a5a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.3)_inset,0_50px_100px_-25px_rgba(0,0,0,0.7),0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                {/* Inner Bezel (Black) */}
                <div className="h-full w-full rounded-[49px] bg-black p-[8px] shadow-[0_0_4px_black_inset]">
                  {/* Screen Area */}
                  <div className="relative h-full w-full rounded-[41px] bg-white border border-slate-800/50 overflow-hidden">
                    
                    {/* Dynamic Island */}
                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-[16px] z-20 flex items-center justify-center">
                       <div className="flex items-center justify-between w-full px-2.5">
                          <div className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
                          <div className="w-0.5 h-0.5 rounded-full bg-[#0c0c0c] border border-[#1a1a1a]" />
                       </div>
                    </div>

                    {/* Content (Company Catalog) */}
                    <div className="h-full bg-slate-50">
                      <PhoneCompanyPreview />
                    </div>

                    {/* Home Bar */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-900/40 rounded-full z-20" />
                  </div>
                </div>
                
                {/* Side Buttons */}
                <div className="absolute -left-[2px] top-24 w-[2px] h-8 bg-[#3a3a3a] rounded-l-md shadow-sm opacity-80" />
                <div className="absolute -left-[2px] top-36 w-[2px] h-12 bg-[#3a3a3a] rounded-l-md shadow-sm opacity-80" />
                <div className="absolute -right-[2px] top-32 w-[2px] h-16 bg-[#3a3a3a] rounded-r-md shadow-sm opacity-80" />
              </div>
            </div>

          </div>
        </div>

        {/* Mobile: Side-by-side layout (Phone Left, Info Right) */}
        <div className="lg:hidden flex flex-col space-y-4">
          
          <div className="grid grid-cols-[45%_55%] gap-2 items-center">
            {/* Left: Phone Preview */}
            <div className="relative h-[280px] w-full flex justify-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[570px] scale-[0.42] origin-center rotate-[5deg]">
                {/* Ambient glow */}
                <div className="absolute inset-0 rounded-[55px] bg-gradient-to-br from-primary/30 via-emerald-500/20 to-teal-500/30 blur-3xl opacity-60" aria-hidden="true" />
                
                {/* iPhone Frame */}
                <div className="relative h-full w-full rounded-[55px] p-[6px] bg-gradient-to-b from-[#5a5a5a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.3)_inset,0_50px_100px_-25px_rgba(0,0,0,0.7),0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                  <div className="h-full w-full rounded-[49px] bg-black p-[8px] shadow-[0_0_4px_black_inset]">
                    <div className="relative h-full w-full rounded-[41px] bg-white border border-slate-800/50 overflow-hidden">
                      {/* Dynamic Island */}
                      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[90px] h-[26px] bg-black rounded-[16px] z-20 flex items-center justify-center">
                        <div className="flex items-center justify-between w-full px-2.5">
                          <div className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
                          <div className="w-0.5 h-0.5 rounded-full bg-[#0c0c0c] border border-[#1a1a1a]" />
                        </div>
                      </div>
                      {/* Content */}
                      <div className="h-full bg-slate-50">
                        <PhoneCompanyPreview />
                      </div>
                      {/* Home Bar */}
                      <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-28 h-1 bg-slate-900/40 rounded-full z-20" />
                    </div>
                  </div>
                  {/* Side Buttons */}
                  <div className="absolute -left-[2px] top-24 w-[2px] h-8 bg-[#3a3a3a] rounded-l-md shadow-sm opacity-80" />
                  <div className="absolute -left-[2px] top-36 w-[2px] h-12 bg-[#3a3a3a] rounded-l-md shadow-sm opacity-80" />
                  <div className="absolute -right-[2px] top-32 w-[2px] h-16 bg-[#3a3a3a] rounded-r-md shadow-sm opacity-80" />
                </div>
              </div>
            </div>

            {/* Right: Info Grid - 2x2 compact cards */}
            <div className="grid grid-cols-1 gap-2 pr-1">
              {BENEFITS.map((benefit) => (
                <div
                  key={benefit.id}
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 p-2 shadow-lg"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-primary/20 text-white">
                    <Icon icon={benefit.icon} className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                  <p className="text-[10px] font-semibold leading-tight text-white line-clamp-2">
                    {t(`home.benefits.items.${benefit.id}.title`)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Stats - Vertical Grid (Fully Visible) */}
          <div className="grid grid-cols-1 gap-2 w-full px-1">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/20">
              <div className="flex-shrink-0 bg-primary/20 text-primary p-1.5 rounded">
                <Icon icon="mdi:shield-check" className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-white">
                14 კომპანია
              </span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/20">
              <div className="flex-shrink-0 bg-primary/20 text-primary p-1.5 rounded">
                <Icon icon="mdi:cash-multiple" className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-white">
                {t('home.hero.fixed_prices')}
              </span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/20">
              <div className="flex-shrink-0 bg-primary/20 text-primary p-1.5 rounded">
                <Icon icon="mdi:file-document-check" className="h-4 w-4" aria-hidden="true" />
              </div>
              <span className="text-xs font-semibold text-white">
                {t('home.hero.official_contracts')}
              </span>
            </div>
          </div>

          {/* Calculator Widget */}
          <div className="w-full pt-2">
             <HeroCalculator />
          </div>
        </div>
      </div>

      {/* Slide 2: How It Works overlay, appears on top when activeSlide === 'testimonials' - Desktop only */}
      <div className="hidden lg:block absolute inset-0 z-20 flex items-center justify-center px-4 pointer-events-none">
        <div
          className={`w-full h-full transition-all duration-500 ease-out ${
            isHero ? 'opacity-0 translate-y-6 pointer-events-none' : 'opacity-100 translate-y-0 pointer-events-auto'
          }`}
        >
          <TestimonialsSection />
        </div>
      </div>
    </section>
  );
};
