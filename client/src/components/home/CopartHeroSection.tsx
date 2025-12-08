import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export function CopartHeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <motion.section
      className="relative overflow-hidden bg-[#f5a623] lg:bg-gradient-to-b lg:from-background lg:via-background lg:to-background/95"
      role="banner"
      aria-labelledby="home-copart-hero-heading"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Yellow diagonal background shape - DESKTOP ONLY (≥1024px) */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[64%] bg-[#f5a623]/90 dark:bg-[#f5a623]/80 z-0 hidden lg:block"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 76% 100%, 0 100%)',
        }}
      />

      {/* Subtle texture/overlay for depth - DESKTOP ONLY (≥1024px) */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 dark:from-black/40 dark:via-transparent dark:to-black/60 mix-blend-soft-light hidden lg:block" />

      {/* ==================== DESKTOP LAYOUT (≥1024px) ==================== */}
      <div className="relative z-10 hidden lg:block">
        <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] mx-auto pt-24 pb-14">
          <div className="grid lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] gap-10 items-start">
            {/* Left Column - Text & CTA */}
            <div className="space-y-5 text-slate-900 dark:text-slate-50 max-w-xl">
              <h1
                id="home-copart-hero-heading"
                className="text-[40px] font-semibold leading-tight tracking-tight text-balance"
              >
                {t('home.copart_hero.title')}
              </h1>

              <p 
                className="text-base text-slate-700/85 dark:text-slate-100/80 max-w-xl"
                dangerouslySetInnerHTML={{ __html: t('home.copart_hero.subtitle') }}
              />

              {/* App Store Badges */}
              <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-950 text-white px-3.5 py-2 text-xs shadow-sm shadow-slate-900/40 hover:bg-slate-900 hover:shadow-md transition-colors">
                  <Icon icon="mdi:apple" className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left leading-tight rtl:text-right">
                    <div className="text-[9px] opacity-80">{t('home.copart_hero.download_appstore')}</div>
                    <div className="font-semibold text-[11px]">{t('home.copart_hero.appstore')}</div>
                  </div>
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-950 text-white px-3.5 py-2 text-xs shadow-sm shadow-slate-900/40 hover:bg-slate-900 hover:shadow-md transition-colors">
                  <Icon icon="mdi:google-play" className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left leading-tight rtl:text-right">
                    <div className="text-[9px] opacity-80">{t('home.copart_hero.get_on')}</div>
                    <div className="font-semibold text-[11px]">{t('home.copart_hero.google_play')}</div>
                  </div>
                </button>
              </div>

              {/* Feature Icons Row */}
              <div className="flex flex-wrap items-center justify-center gap-4 py-2 text-[13px] text-slate-900/90 dark:text-slate-50/90">
                <div className="inline-flex items-center gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm shadow-slate-900/30 dark:bg-slate-100 dark:text-slate-900">
                    <Icon icon="mdi:shield-check" className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="font-medium">{t('home.copart_hero.buyer_protection')}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm shadow-slate-900/30 dark:bg-slate-100 dark:text-slate-900">
                    <Icon icon="mdi:truck-delivery" className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="font-medium">{t('home.copart_hero.nationwide_delivery')}</span>
                </div>
                <div className="inline-flex items-center gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm shadow-slate-900/30 dark:bg-slate-100 dark:text-slate-900">
                    <Icon icon="mdi:file-document-check" className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <span className="font-medium">{t('home.copart_hero.vehicle_history')}</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-1">
                <Button
                  size="lg"
                  className="rounded-xl text-base font-semibold px-6 py-5 bg-slate-900 hover:bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.45)]"
                  onClick={() => navigate('/auction-listings')}
                >
                  {t('home.copart_hero.browse_inventory')}
                </Button>
              </div>
            </div>

            {/* Right Column - Cards + Car image (DESKTOP) */}
            <div className="relative flex items-center justify-center lg:h-[400px] xl:h-[420px]">
              {/* Background car lineup image */}
              <img
                src="/img/hero-suvs.png"
                alt="Auction vehicles lineup"
                className="pointer-events-none select-none absolute bottom-[-88px] xl:bottom-[-72px] right-0 xl:right-[-24px] 2xl:right-[-40px] lg:w-[500px] xl:w-[520px] 2xl:w-[580px] h-auto opacity-95"
              />

              <div className="relative z-10 grid grid-cols-2 gap-4 w-full max-w-md">
                {/* Auction / Bidding */}
                <div className="col-span-1 row-span-2 rounded-2xl bg-slate-900 text-white shadow-[0_18px_55px_rgba(15,23,42,0.45)] ring-1 ring-black/10 flex flex-col items-center justify-center p-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f5a623] text-slate-900 shadow-lg mb-4">
                    <Icon icon="mdi:gavel" className="w-10 h-10" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#f5a623] mb-1">Copart / IAAI</p>
                  <p className="text-sm font-medium text-center">
                    {t('auction.price_comparison')}
                  </p>
                </div>

                {/* Logistics / Delivery */}
                <div className="rounded-2xl bg-white/95 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.32)] ring-1 ring-black/5 flex flex-col items-center justify-center p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md mb-3">
                    <Icon icon="mdi:truck-fast" className="w-8 h-8" aria-hidden="true" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">
                    {t('auction.shipping')}
                  </p>
                  <p className="text-xs text-center text-slate-700">
                    {t('auction.compare.total_to_georgia')}
                  </p>
                </div>

                {/* Verified Importers / Documents */}
                <div className="rounded-2xl bg-white/90 text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.28)] ring-1 ring-black/5 flex flex-col items-center justify-center p-5">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md mb-3">
                    <Icon icon="mdi:file-certificate-outline" className="w-8 h-8" aria-hidden="true" />
                  </div>
                  <p className="text-xs text-center text-slate-700 font-semibold">
                    {t('home.copart_hero.verified_importers')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TABLET LAYOUT (768px–1023px) ==================== */}
      {/* Stacked layout: text block on top, visuals block below */}
      <div className="relative z-10 hidden md:block lg:hidden">
        <div className="w-full px-6 py-12">
          {/* TOP BLOCK - TEXT (full width, centered) */}
          <div className="max-w-3xl mx-auto space-y-4 text-slate-900 text-center">
            {/* Headline */}
            <h1
              id="home-copart-hero-heading-tablet"
              className="text-3xl font-bold leading-snug tracking-tight"
            >
              {t('home.copart_hero.title')}
            </h1>

            {/* Description */}
            <p 
              className="text-base text-slate-800/90 max-w-2xl leading-relaxed mx-auto text-center"
              dangerouslySetInnerHTML={{ __html: t('home.copart_hero.subtitle') }}
            />

            {/* App Store Badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 py-2">
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-950 text-white px-3.5 py-2.5 text-xs shadow-sm shadow-slate-900/40 hover:bg-slate-900 hover:shadow-md transition-colors">
                <Icon icon="mdi:apple" className="w-5 h-5" aria-hidden="true" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] opacity-80">{t('home.copart_hero.download_appstore')}</div>
                  <div className="font-semibold text-[11px]">{t('home.copart_hero.appstore')}</div>
                </div>
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-950 text-white px-3.5 py-2.5 text-xs shadow-sm shadow-slate-900/40 hover:bg-slate-900 hover:shadow-md transition-colors">
                <Icon icon="mdi:google-play" className="w-5 h-5" aria-hidden="true" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] opacity-80">{t('home.copart_hero.get_on')}</div>
                  <div className="font-semibold text-[11px]">{t('home.copart_hero.google_play')}</div>
                </div>
              </button>
            </div>

            {/* Feature Icons Row */}
            <div className="flex flex-wrap items-center justify-center gap-4 py-2 text-[13px] text-slate-900/90">
              <div className="inline-flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                  <Icon icon="mdi:shield-check" className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="font-medium">{t('home.copart_hero.buyer_protection')}</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                  <Icon icon="mdi:truck-delivery" className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="font-medium">{t('home.copart_hero.nationwide_delivery')}</span>
              </div>
              <div className="inline-flex items-center gap-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                  <Icon icon="mdi:file-document-check" className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="font-medium">{t('home.copart_hero.vehicle_history')}</span>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-2 flex justify-center">
              <Button
                size="lg"
                className="rounded-xl text-base font-semibold px-8 py-5 bg-slate-900 hover:bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.45)]"
                onClick={() => navigate('/auction-listings')}
              >
                {t('home.copart_hero.browse_inventory')}
              </Button>
            </div>
          </div>

          {/* BOTTOM BLOCK - VISUALS (cards + cars image) */}
          <div className="max-w-3xl mx-auto mt-10">
            {/* Cards Grid - 2x2 composition */}
            <div className="grid grid-cols-[1fr_1fr] gap-4 max-w-md mx-auto">
              {/* Auction / Bidding - tall left card */}
              <div className="row-span-2 rounded-2xl bg-slate-900 text-white shadow-[0_18px_55px_rgba(15,23,42,0.45)] ring-1 ring-black/10 flex flex-col items-center justify-center p-5">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#f5a623] text-slate-900 shadow-lg mb-3">
                  <Icon icon="mdi:gavel" className="w-8 h-8" aria-hidden="true" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#f5a623] mb-1">Copart / IAAI</p>
                <p className="text-sm font-medium text-center">
                  {t('auction.price_comparison')}
                </p>
              </div>

              {/* Logistics / Delivery */}
              <div className="rounded-2xl bg-white/95 text-slate-900 shadow-[0_16px_40px_rgba(15,23,42,0.32)] ring-1 ring-black/5 flex flex-col items-center justify-center p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md mb-2">
                  <Icon icon="mdi:truck-fast" className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 mb-0.5">
                  {t('auction.shipping')}
                </p>
                <p className="text-xs text-center text-slate-700">
                  {t('auction.compare.total_to_georgia')}
                </p>
              </div>

              {/* Verified Importers / Documents */}
              <div className="rounded-2xl bg-white/90 text-slate-900 shadow-[0_14px_32px_rgba(15,23,42,0.28)] ring-1 ring-black/5 flex flex-col items-center justify-center p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-md mb-2">
                  <Icon icon="mdi:file-certificate-outline" className="w-6 h-6" aria-hidden="true" />
                </div>
                <p className="text-xs text-center text-slate-700 font-semibold">
                  {t('home.copart_hero.verified_importers')}
                </p>
              </div>
            </div>

            {/* Cars Image - full width below cards */}
            <div className="w-full mt-6 -mb-3">
              <img
                src="/img/hero-suvs.png"
                alt="Auction vehicles lineup"
                className="w-full h-auto object-contain object-bottom"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== MOBILE LAYOUT (<768px) ==================== */}
      {/* Polished single-column layout: easy to read, touch-friendly, consistent with desktop */}
      <div className="relative z-10 md:hidden">
        <div className="w-full px-5 py-8">
          {/* Content Container - centered with max width */}
          <div className="max-w-[32rem] mx-auto space-y-4 text-slate-900 text-center">
            {/* Headline */}
            <h1
              id="home-copart-hero-heading-mobile"
              className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight text-center"
            >
              {t('home.copart_hero.title')}
            </h1>

            {/* Description - max 2-3 lines */}
            <p 
              className="text-sm sm:text-base text-slate-800/90 text-center leading-relaxed"
              dangerouslySetInnerHTML={{ __html: t('home.copart_hero.subtitle') }}
            />

            {/* App Store Badges - horizontal row, wraps on xs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-950 text-white px-3.5 py-2.5 text-xs shadow-sm shadow-slate-900/30 hover:bg-slate-900 active:scale-[0.98] transition-all">
                <Icon icon="mdi:apple" className="w-5 h-5" aria-hidden="true" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] opacity-80">{t('home.copart_hero.download_appstore')}</div>
                  <div className="font-semibold text-[11px]">{t('home.copart_hero.appstore')}</div>
                </div>
              </button>
              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-900/10 bg-slate-950 text-white px-3.5 py-2.5 text-xs shadow-sm shadow-slate-900/30 hover:bg-slate-900 active:scale-[0.98] transition-all">
                <Icon icon="mdi:google-play" className="w-5 h-5" aria-hidden="true" />
                <div className="text-left leading-tight">
                  <div className="text-[9px] opacity-80">{t('home.copart_hero.get_on')}</div>
                  <div className="font-semibold text-[11px]">{t('home.copart_hero.google_play')}</div>
                </div>
              </button>
            </div>

            {/* Feature Bullets - vertical list on xs, 2-col grid on sm */}
            <div className="space-y-2 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0 pt-2">
              <div className="flex items-center justify-center gap-2 text-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                  <Icon icon="mdi:shield-check" className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium">{t('home.copart_hero.buyer_protection')}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                  <Icon icon="mdi:truck-delivery" className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium">{t('home.copart_hero.nationwide_delivery')}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-center">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white shadow-sm">
                  <Icon icon="mdi:file-document-check" className="w-4 h-4" aria-hidden="true" />
                </div>
                <span className="text-sm font-medium">{t('home.copart_hero.vehicle_history')}</span>
              </div>
            </div>

            {/* CTA Button - full width on xs, constrained on sm */}
            <div className="pt-3">
              <Button
                size="lg"
                className="w-full sm:max-w-xs sm:mx-auto sm:block rounded-xl text-base font-semibold px-6 min-h-[44px] bg-slate-900 hover:bg-slate-950 active:scale-[0.98] text-white shadow-[0_8px_24px_rgba(15,23,42,0.35)] transition-all"
                onClick={() => navigate('/auction-listings')}
              >
                {t('home.copart_hero.browse_inventory')}
              </Button>
            </div>
          </div>

          {/* Cars Image - big visual at bottom */}
          <div className="w-full mt-6 -mb-2">
            <img
              src="/img/hero-suvs.png"
              alt="Auction vehicles lineup"
              className="w-full h-auto object-contain object-bottom"
            />
          </div>
        </div>
      </div>

    </motion.section>
  );
}
