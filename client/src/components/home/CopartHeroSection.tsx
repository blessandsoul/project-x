import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { HeroDeviceShowcase } from './HeroDeviceShowcase';
import { HeroFloatingOrbs } from './hero-widgets/HeroFloatingOrbs';
import { TabletCatalogPreview } from './hero-widgets/TabletCatalogPreview';

/**
 * Glass Card Component for Hero Section
 * Reusable translucent card with glass morphism effect
 */
interface GlassCardProps {
  icon: string;
  title: string;
  description: string;
  className?: string;
}

const GlassCard = ({ icon, title, description, className = '' }: GlassCardProps) => (
  <motion.div
    className={`group relative rounded-xl border border-white/15 bg-white/5 p-2 min-[500px]:p-4 transition-all duration-300 hover:bg-white/10 hover:border-white/25 hover:shadow-xl hover:shadow-black/10 ${className}`}
    style={{ backdropFilter: 'blur(15px)' }}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5 }}
  >
    <div className="flex flex-col items-center text-center lg:flex-row lg:items-start lg:text-left gap-1.5 min-[500px]:gap-3">
      <div className="flex h-7 w-7 min-[500px]:h-10 min-[500px]:w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white shadow-lg shadow-black/5">
        <Icon icon={icon} className="h-3.5 w-3.5 min-[500px]:h-5 min-[500px]:w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="!text-[9px] min-[500px]:!text-sm font-semibold text-white leading-[1.1] mb-0.5 xl:whitespace-nowrap">
          {title}
        </h3>
        <p className="!text-[8px] min-[500px]:!text-xs text-white/60 leading-relaxed line-clamp-2">
          {description}
        </p>
      </div>
    </div>
  </motion.div>
);


export function CopartHeroSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section
      className="relative min-h-screen overflow-hidden"
      role="banner"
      aria-labelledby="home-copart-hero-heading"
      style={{
        background: `linear-gradient(135deg, var(--hero-gradient-start) 0%, var(--hero-gradient-mid) 50%, var(--hero-gradient-end) 100%)`,
      }}
    >
      {/* Background layer (z-0) - gradient, glow, vignette */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Base gradient overlay for smoother look */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 120% 100% at 30% 20%, rgba(13, 148, 136, 0.3) 0%, transparent 50%)',
          }}
        />

        {/* Warm amber glow - BOTTOM-RIGHT position */}
        <div className="absolute bottom-[-150px] right-[-100px] w-[800px] h-[800px] bg-amber-500/15 rounded-full blur-[200px]" />

        {/* Subtle vignette overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 0%, rgba(0,0,0,0.08) 100%)',
          }}
        />
      </div>

      {/* Shapes layer (z-[5]) - OUTSIDE overflow-hidden, above background, below devices */}
      <div className="absolute inset-0 z-[5] pointer-events-none overflow-visible">
        <HeroFloatingOrbs />
      </div>

      {/* ==================== DESKTOP LAYOUT (≥1024px) ==================== */}
      <div className="relative z-10 hidden lg:block">
        <div className="w-full px-4 lg:px-6 xl:px-8 lg:max-w-[1440px] mx-auto pt-32 pb-20">
          <div className="grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-6 xl:gap-12 items-center">
            {/* Left Column - Glass Feature Cards */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {/* Main headline above cards */}
              <div className="mb-6">
                <h1
                  id="home-copart-hero-heading"
                  className="text-4xl xl:text-5xl font-bold leading-tight tracking-tight text-white mb-4"
                >
                  {t('home.copart_hero.title')}
                </h1>
                <p
                  className="hidden text-lg text-white/80 max-w-md leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: t('home.copart_hero.subtitle') }}
                />
              </div>

              {/* Glass Feature Cards */}
              <GlassCard
                icon="mdi:truck-delivery"
                title={t('home.copart_hero.nationwide_delivery')}
                description={t('home.copart_hero.all_prices_desc')}
              />
              <GlassCard
                icon="mdi:shield-check"
                title={t('home.copart_hero.buyer_protection')}
                description={t('home.copart_hero.transparent_prices_desc')}
              />
              <GlassCard
                icon="mdi:file-document-check"
                title={t('home.copart_hero.vehicle_history')}
                description={t('home.copart_hero.real_reviews_desc')}
              />

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Button
                  size="lg"
                  className="rounded-full text-base font-semibold px-8 py-6 bg-white hover:bg-white/90 text-[var(--hero-gradient-start)] shadow-xl shadow-black/20 transition-all hover:shadow-2xl hover:scale-[1.02]"
                  onClick={() => navigate('/auction-listings')}
                >
                  {t('home.copart_hero.browse_inventory')}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full text-base font-medium px-8 py-6 bg-[var(--glass-surface)] border-[var(--glass-border)] text-white hover:bg-[var(--glass-surface-hover)] hover:border-[var(--glass-border-hover)] backdrop-blur-sm transition-all"
                  onClick={() => navigate('/catalog')}
                >
                  {t('home.copart_hero.all_prices_title')}
                </Button>
              </div>

              {/* App Store Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white px-4 py-2.5 text-xs hover:bg-white/15 transition-colors">
                  <Icon icon="mdi:apple" className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left leading-tight">
                    <div className="text-[9px] opacity-70">{t('home.copart_hero.download_appstore')}</div>
                    <div className="font-semibold text-[11px]">{t('home.copart_hero.appstore')}</div>
                  </div>
                </button>
                <button className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm text-white px-4 py-2.5 text-xs hover:bg-white/15 transition-colors">
                  <Icon icon="mdi:google-play" className="w-5 h-5" aria-hidden="true" />
                  <div className="text-left leading-tight">
                    <div className="text-[9px] opacity-70">{t('home.copart_hero.get_on')}</div>
                    <div className="font-semibold text-[11px]">{t('home.copart_hero.google_play')}</div>
                  </div>
                </button>
              </div>
            </motion.div>

            {/* Right Column - Device Showcase (shifted right, overflow visible for hover) */}
            <div className="relative lg:h-[500px] xl:h-[560px] translate-x-12 xl:translate-x-16 overflow-visible">
              <HeroDeviceShowcase />
            </div>
          </div>
        </div>
      </div>

      {/* ==================== TABLET LAYOUT (768px–1023px) ==================== */}
      <div className="relative z-10 hidden md:block lg:hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-20 -right-20 w-[250px] h-[250px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div
            className="absolute top-1/3 -left-16 w-[180px] h-[180px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
        </div>

        {/* Main content - tight flex layout */}
        <div className="w-full px-6 pt-24 pb-6 flex flex-col items-center text-center gap-4">
          {/* Heading */}
          <motion.h1
            id="home-copart-hero-heading-tablet"
            className="text-2xl sm:text-3xl font-bold leading-snug tracking-tight text-white"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {t('home.copart_hero.title')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="hidden text-sm sm:text-base text-white/80 max-w-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t('home.copart_hero.subtitle') }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          />

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Button
              size="lg"
              className="rounded-full text-sm font-semibold px-6 py-4 bg-white hover:bg-white/95 text-[var(--hero-gradient-start)] shadow-[0_0_20px_rgba(255,255,255,0.25)] transition-all"
              onClick={() => navigate('/auction-listings')}
            >
              {t('home.copart_hero.browse_inventory')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full text-sm font-medium px-6 py-4 bg-white/5 border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all"
              onClick={() => navigate('/companies')}
            >
              {t('home.copart_hero.all_prices_title')}
            </Button>
          </motion.div>

          {/* Feature Cards - 2-column grid layout */}
          <motion.div
            className="w-full max-w-2xl grid grid-cols-1 min-[500px]:grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <GlassCard
              icon="mdi:truck-delivery"
              title={t('home.copart_hero.nationwide_delivery')}
              description={t('home.copart_hero.all_prices_desc')}
              className="min-[500px]:col-span-2"
            />
            <GlassCard
              icon="mdi:shield-check"
              title={t('home.copart_hero.buyer_protection')}
              description={t('home.copart_hero.transparent_prices_desc')}
            />
            <GlassCard
              icon="mdi:file-document-check"
              title={t('home.copart_hero.vehicle_history')}
              description={t('home.copart_hero.real_reviews_desc')}
            />
          </motion.div>

          {/* Device Showcase - Desktop/Laptop + Phone */}
          <motion.div
            className="group relative w-full max-w-[90%] aspect-video mt-4 mb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.2) 0%, transparent 60%)',
              }}
            />

            {/* Desktop/Laptop Monitor Frame */}
            <div
              className="absolute top-0 left-[5%] w-[90%] will-change-transform transition-all duration-500 ease-out group-hover:scale-[1.03] group-hover:-translate-y-2"
            >
              {/* Monitor bezel */}
              <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] p-[8px] shadow-2xl ring-1 ring-white/10">
                {/* Screen */}
                <div className="relative w-full aspect-video rounded-xl bg-slate-50 overflow-hidden">
                  {/* Webcam dot */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-800 rounded-full z-20" />
                  {/* Screen content */}
                  <div className="absolute inset-0 pt-3">
                    <TabletCatalogPreview />
                  </div>
                </div>
              </div>
              {/* Monitor stand neck */}
              <div className="mx-auto w-[15%] h-4 bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] rounded-b-sm" />
              {/* Monitor stand base */}
              <div className="mx-auto w-[35%] h-2 bg-gradient-to-b from-[#2a2a2a] to-[#3a3a3a] rounded-b-lg shadow-lg" />
            </div>
          </motion.div>

          {/* App Store Badges */}
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm text-white px-3 py-2 text-xs hover:bg-white/10 transition-all">
              <Icon icon="mdi:apple" className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-[10px]">{t('home.copart_hero.appstore')}</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm text-white px-3 py-2 text-xs hover:bg-white/10 transition-all">
              <Icon icon="mdi:google-play" className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-[10px]">{t('home.copart_hero.google_play')}</span>
            </button>
          </motion.div>
        </div>
      </div>

      {/* ==================== MOBILE LAYOUT (<768px) ==================== */}
      <div className="relative z-10 md:hidden">
        {/* Background orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div
            className="absolute -top-12 -right-12 w-[180px] h-[180px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
          <div
            className="absolute top-1/4 -left-10 w-[140px] h-[140px] rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%)',
              filter: 'blur(25px)',
            }}
          />
        </div>

        {/* Main content - tight flex layout */}
        <div className="w-full px-5 pt-20 pb-6 flex flex-col items-center text-center gap-4">
          {/* Heading */}
          <motion.h1
            id="home-copart-hero-heading-mobile"
            className="text-xl sm:text-2xl font-bold leading-snug tracking-tight text-white"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {t('home.copart_hero.title')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            className="hidden text-sm text-white/80 max-w-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: t('home.copart_hero.subtitle') }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          />

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Button
              size="lg"
              className="rounded-full text-sm font-semibold px-6 py-4 bg-white hover:bg-white/95 text-[var(--hero-gradient-start)] shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-[0.98] transition-all"
              onClick={() => navigate('/auction-listings')}
            >
              {t('home.copart_hero.browse_inventory')}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="rounded-full text-sm font-medium px-6 py-4 bg-white/5 border border-white/20 text-white hover:bg-white/10 backdrop-blur-sm transition-all"
              onClick={() => navigate('/companies')}
            >
              {t('home.copart_hero.all_prices_title')}
            </Button>
          </motion.div>

          {/* Feature Cards - 2-column grid layout matching tablet */}
          <motion.div
            className="w-full grid grid-cols-1 min-[700px]:grid-cols-2 gap-3"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <GlassCard
              icon="mdi:truck-delivery"
              title={t('home.copart_hero.nationwide_delivery')}
              description={t('home.copart_hero.all_prices_desc')}
              className="min-[700px]:col-span-2"
            />
            <GlassCard
              icon="mdi:shield-check"
              title={t('home.copart_hero.buyer_protection')}
              description={t('home.copart_hero.transparent_prices_desc')}
            />
            <GlassCard
              icon="mdi:file-document-check"
              title={t('home.copart_hero.vehicle_history')}
              description={t('home.copart_hero.real_reviews_desc')}
            />
          </motion.div>

          {/* Device Showcase - Desktop Only for Mobile */}
          <motion.div
            className="group relative w-full aspect-video mt-4 mb-8"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {/* Background glow */}
            <div
              className="absolute inset-0 -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.2) 0%, transparent 60%)',
              }}
            />

            {/* Desktop/Laptop Monitor Frame - Full width on mobile */}
            <div
              className="absolute top-0 left-0 w-full will-change-transform transition-all duration-500 ease-out group-hover:scale-[1.02] group-hover:-translate-y-1"
            >
              {/* Monitor bezel */}
              <div className="relative w-full rounded-2xl bg-gradient-to-b from-[#2a2a2a] via-[#1a1a1a] to-[#0f0f0f] p-[6px] shadow-2xl ring-1 ring-white/10">
                {/* Screen */}
                <div className="relative w-full aspect-video rounded-xl bg-slate-50 overflow-hidden">
                  {/* Webcam dot */}
                  <div className="absolute top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-800 rounded-full z-20" />
                  {/* Screen content */}
                  <div className="absolute inset-0 pt-2">
                    <TabletCatalogPreview />
                  </div>
                </div>
              </div>
              {/* Monitor stand neck */}
              <div className="mx-auto w-[12%] h-3 bg-gradient-to-b from-[#1a1a1a] to-[#2a2a2a] rounded-b-sm" />
              {/* Monitor stand base */}
              <div className="mx-auto w-[30%] h-1.5 bg-gradient-to-b from-[#2a2a2a] to-[#3a3a3a] rounded-b-md shadow-lg" />
            </div>
          </motion.div>

          {/* App Store Badges */}
          <motion.div
            className="flex items-center justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm text-white px-3 py-2 text-xs active:scale-[0.98] transition-all">
              <Icon icon="mdi:apple" className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-[10px]">{t('home.copart_hero.appstore')}</span>
            </button>
            <button className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 backdrop-blur-sm text-white px-3 py-2 text-xs active:scale-[0.98] transition-all">
              <Icon icon="mdi:google-play" className="w-4 h-4" aria-hidden="true" />
              <span className="font-medium text-[10px]">{t('home.copart_hero.google_play')}</span>
            </button>
          </motion.div>
        </div>
      </div>

    </section>
  );
}
