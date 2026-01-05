import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Card, CardContent } from '@/components/ui/card';
import { TabletAuctionPreview } from '../hero-widgets/TabletAuctionPreview';
import { PhoneCompanyPreview } from '../hero-widgets/PhoneCompanyPreview';

/**
 * ResponsiveHeroSection - A responsive Hero section with dynamic device showcase
 * 
 * Features:
 * - Responsive container with max-w-7xl
 * - Below 1024px: vertical stack (flex-col)
 * - Above 1024px: two-column grid (grid-cols-2)
 * - Percentage-based device positioning for fluid resizing
 * - Group hover with smooth device animations
 * - Overflow hidden to clip scaled devices
 * - Radial gradient background (forest green to dark emerald)
 */

// Feature cards data
const FEATURES = [
    {
        id: 'auction',
        icon: 'mdi:gavel',
        titleKey: 'home.responsive_hero.features.auction.title',
        descKey: 'home.responsive_hero.features.auction.description',
        fallbackTitle: 'Live Auctions',
        fallbackDesc: 'Access real-time vehicle auctions from trusted sources',
    },
    {
        id: 'companies',
        icon: 'mdi:domain',
        titleKey: 'home.responsive_hero.features.companies.title',
        descKey: 'home.responsive_hero.features.companies.description',
        fallbackTitle: 'Verified Companies',
        fallbackDesc: 'Connect with verified and rated import companies',
    },
    {
        id: 'calculator',
        icon: 'mdi:calculator',
        titleKey: 'home.responsive_hero.features.calculator.title',
        descKey: 'home.responsive_hero.features.calculator.description',
        fallbackTitle: 'Price Calculator',
        fallbackDesc: 'Calculate total import costs instantly',
    },
];

export function ResponsiveHeroSection() {
    const { t } = useTranslation();

    return (
        <section
            id="responsive-hero-section"
            className="relative min-h-screen overflow-hidden"
            style={{
                background: 'radial-gradient(circle at top right, #0d5c42 0%, #0a3d2d 40%, #052218 100%)',
            }}
            aria-label={t('home.responsive_hero.section_label', 'Hero section showcasing our platform')}
        >
            {/* Subtle ambient glow */}
            <div
                className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none"
                aria-hidden="true"
            />
            <div
                className="absolute bottom-[30%] left-[5%] w-[300px] h-[300px] bg-teal-400/10 rounded-full blur-[100px] pointer-events-none"
                aria-hidden="true"
            />

            {/* Main container */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">

                {/* Responsive layout: flex-col below lg, grid-cols-2 above */}
                <div className="flex flex-col lg:grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">

                    {/* Left Column: Text + Feature Cards */}
                    <div className="space-y-8 text-white order-2 lg:order-1">

                        {/* Headline */}
                        <div className="space-y-4">
                            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
                                {t('home.responsive_hero.headline', 'Your Gateway to Premium Vehicles')}
                            </h1>
                            <p className="text-lg text-white/80 max-w-lg">
                                {t('home.responsive_hero.subheadline', 'Discover, compare, and import vehicles from trusted auctions with complete transparency.')}
                            </p>
                        </div>

                        {/* Feature Cards - 3 cards with shadcn Card */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3 gap-4">
                            {FEATURES.map((feature) => (
                                <Card
                                    key={feature.id}
                                    className="bg-white/5 hover:bg-white/10 border-0 transition-colors duration-300 cursor-default py-4"
                                    aria-label={t(feature.titleKey, feature.fallbackTitle)}
                                >
                                    <CardContent className="flex items-start gap-3 px-4">
                                        <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                            <Icon icon={feature.icon} className="h-5 w-5 text-primary" aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-white text-sm">
                                                {t(feature.titleKey, feature.fallbackTitle)}
                                            </h3>
                                            <p className="text-xs text-white/70 mt-0.5 line-clamp-2">
                                                {t(feature.descKey, feature.fallbackDesc)}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Device Showcase with aspect-ratio container */}
                    <div className="relative w-full order-1 lg:order-2">
                        {/* Aspect ratio container - uses CSS scale to fit at smaller viewports */}
                        <div
                            className="group relative w-full aspect-[4/3] lg:aspect-square overflow-hidden rounded-3xl device-showcase-container"
                            aria-hidden="true"
                        >
                            {/* Inner glow effect */}
                            <div
                                className="absolute inset-0 rounded-3xl"
                                style={{
                                    background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                                }}
                            />

                            {/* Tablet - ONLY VISIBLE AT XL+ (1280px) - same pattern as original HeroSection */}
                            <div
                                className="hero-tablet hidden xl:block absolute top-[10%] left-[5%] w-[65%]"
                                style={{ transformOrigin: 'center center' }}
                            >
                                {/* Tablet ambient glow */}
                                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-pink-500/20 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity duration-500" />

                                {/* iPad Frame */}
                                <div className="relative w-full rounded-[40px] p-[6px] bg-gradient-to-b from-[#4a4a4a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.2)_inset,0_40px_80px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10">
                                    {/* Inner Bezel */}
                                    <div className="w-full rounded-[34px] bg-black p-[8px] shadow-[0_0_3px_black_inset]">
                                        {/* Screen Area */}
                                        <div className="relative w-full aspect-[4/3] rounded-[26px] bg-slate-50 border border-slate-700/30 overflow-hidden">
                                            {/* Front Camera */}
                                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-900 rounded-full z-20 ring-1 ring-slate-800" />

                                            {/* Content */}
                                            <div className="absolute inset-0 pt-4">
                                                <TabletAuctionPreview />
                                            </div>

                                            {/* Home Indicator */}
                                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-900/30 rounded-full z-20" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Phone - Floating layer - visible at all lg+ breakpoints */}
                            {/* At lg (no tablet): centered and larger */}
                            {/* At xl+ (with tablet): positioned right and smaller */}
                            <div
                                className="hero-phone absolute z-20 lg:bottom-[15%] lg:right-[25%] lg:w-[40%] xl:bottom-[8%] xl:right-[5%] xl:w-[28%]"
                                style={{ transformOrigin: 'center center' }}
                            >
                                {/* Phone ambient glow */}
                                <div className="absolute inset-0 rounded-[50px] bg-gradient-to-br from-primary/30 via-emerald-500/20 to-teal-500/30 blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500" />

                                {/* iPhone Frame */}
                                <div className="relative w-full rounded-[50px] p-[5px] bg-gradient-to-b from-[#5a5a5a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.3)_inset,0_50px_100px_-25px_rgba(0,0,0,0.7),0_30px_60px_-15px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
                                    {/* Inner Bezel */}
                                    <div className="w-full rounded-[45px] bg-black p-[6px] shadow-[0_0_4px_black_inset]">
                                        {/* Screen Area */}
                                        <div className="relative w-full aspect-[9/19] rounded-[39px] bg-white border border-slate-800/50 overflow-hidden">
                                            {/* Dynamic Island */}
                                            <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[80px] h-[22px] bg-black rounded-[14px] z-20 flex items-center justify-center">
                                                <div className="flex items-center justify-between w-full px-2.5">
                                                    <div className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
                                                    <div className="w-0.5 h-0.5 rounded-full bg-[#0c0c0c] border border-[#1a1a1a]" />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="absolute inset-0 pt-8 bg-slate-50">
                                                <PhoneCompanyPreview />
                                            </div>

                                            {/* Home Bar */}
                                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-900/40 rounded-full z-20" />
                                        </div>
                                    </div>

                                    {/* Side Buttons */}
                                    <div className="absolute -left-[2px] top-20 w-[2px] h-6 bg-[#3a3a3a] rounded-l-md shadow-sm opacity-80" />
                                    <div className="absolute -left-[2px] top-28 w-[2px] h-10 bg-[#3a3a3a] rounded-l-md shadow-sm opacity-80" />
                                    <div className="absolute -right-[2px] top-24 w-[2px] h-12 bg-[#3a3a3a] rounded-r-md shadow-sm opacity-80" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CSS for device hover transforms - ONLY at xl+ (1280px+) */}
            <style>{`
        /* Scale down entire device showcase 20% below 1420px */
        @media (max-width: 1419px) {
          .device-showcase-container {
            transform: scale(0.8);
            transform-origin: center center;
          }
        }
        
        /* Base transitions for smooth hover */
        .hero-tablet,
        .hero-phone {
          transition: transform 700ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* NO hover transforms below xl - prevents all overflow issues */
        /* Hover transforms ONLY at xl+ (1280px+) */
        @media (min-width: 1280px) {
          .group:hover .hero-tablet {
            transform: translateX(-10px) scale(1.02);
          }
          .group:hover .hero-phone {
            transform: translateX(6px) translateY(-4px) scale(1.03);
          }
        }
        
        /* 2XL screens (1536px+): slightly larger transforms */
        @media (min-width: 1536px) {
          .group:hover .hero-tablet {
            transform: translateX(-14px) scale(1.03);
          }
          .group:hover .hero-phone {
            transform: translateX(8px) translateY(-5px) scale(1.05);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .hero-tablet,
          .hero-phone {
            transition: none !important;
          }
          .group:hover .hero-tablet,
          .group:hover .hero-phone {
            transform: none !important;
          }
        }
        
        @media (hover: none) {
          .group:hover .hero-tablet,
          .group:hover .hero-phone {
            transform: none !important;
          }
        }
      `}</style>
        </section>
    );
}

export default ResponsiveHeroSection;
