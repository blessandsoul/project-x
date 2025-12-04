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
      className="relative overflow-hidden bg-gradient-to-b from-background via-background to-background/95"
      role="banner"
      aria-labelledby="home-copart-hero-heading"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
    >
      {/* Yellow diagonal background shape */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-[64%] bg-[#f7b500]/90 dark:bg-[#f7b500]/80 z-0"
        style={{
          clipPath: 'polygon(0 0, 100% 0, 76% 100%, 0 100%)',
        }}
      />

      {/* Subtle texture/overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-black/5 dark:from-black/40 dark:via-transparent dark:to-black/60 mix-blend-soft-light" />

      {/* Main Hero Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-16 pb-10 md:pt-20 md:pb-12 lg:pt-24 lg:pb-14">
          <div className="grid lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] gap-8 lg:gap-10 items-start">
            {/* Left Column - Text & CTA */}
            <div className="space-y-5 text-slate-900 dark:text-slate-50 max-w-xl">
              {/* Main Heading */}
              <h1
                id="home-copart-hero-heading"
                className="text-3xl md:text-4xl lg:text-[40px] font-semibold leading-tight tracking-tight text-balance"
              >
                {t('home.copart_hero.title')}
              </h1>

              {/* Subheading */}
              <p 
                className="text-sm md:text-base text-slate-700/85 dark:text-slate-100/80 max-w-xl"
                dangerouslySetInnerHTML={{ __html: t('home.copart_hero.subtitle') }}
              />

              {/* App Store Badges */}
              <div className="flex flex-wrap items-center gap-3 py-2">
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
              <div className="flex flex-wrap items-center gap-4 py-2 text-xs md:text-[13px] text-slate-900/90 dark:text-slate-50/90">
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

              {/* CTA Button - Full Width on mobile */}
              <div className="pt-1">
                <Button
                  size="lg"
                  className="w-full sm:w-auto rounded-xl text-sm md:text-base font-semibold px-6 py-5 bg-slate-900 hover:bg-slate-950 text-white shadow-[0_10px_30px_rgba(15,23,42,0.45)]"
                  onClick={() => navigate('/auction-listings')}
                >
                  {t('home.copart_hero.browse_inventory')}
                </Button>
              </div>
            </div>

            {/* Right Column - Thematic Icons with subtle car image behind */}
            <div className="relative hidden lg:flex h-[340px] items-center justify-center">
              {/* Background car lineup image */}
              <img
                src="/img/hero-suvs.png"
                alt="Auction vehicles lineup"
                className="pointer-events-none select-none absolute right-[-40px] bottom-[-168px] h-[192px] opacity-95"
              />

              <div className="relative z-10 grid grid-cols-2 gap-4 w-full max-w-md">
                {/* Auction / Bidding */}
                <div className="col-span-1 row-span-2 rounded-2xl bg-slate-900 text-white shadow-[0_18px_55px_rgba(15,23,42,0.45)] ring-1 ring-black/10 flex flex-col items-center justify-center p-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#f7b500] text-slate-900 shadow-lg mb-4">
                    <Icon icon="mdi:gavel" className="w-10 h-10" aria-hidden="true" />
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#f7b500] mb-1">Copart / IAAI</p>
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

    </motion.section>
  );
}
