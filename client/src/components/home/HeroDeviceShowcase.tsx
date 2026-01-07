import { useEffect, useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { searchVehicles } from '@/api/vehicles';
import type { VehicleSearchItem } from '@/types/vehicles';
import { AuctionVehicleCard } from '@/components/auction/AuctionVehicleCard';
import { searchCompaniesFromApi } from '@/services/companiesApi';
import type { Company } from '@/types/api';

/**
 * HeroDeviceShowcase - iPhone + iPad device composition for hero section
 * 
 * Architecture:
 * - Device frame = visual mask with rotation
 * - Screen content = real viewport (360px iPhone, 768px iPad)
 * - Entire viewport is scaled to fit device frame
 * - iPad = 2-column grid layout
 * - iPhone = 2-column grid layout (matches /auction-listings mobile)
 * - Cards render EXACTLY as on /auction-listings
 * 
 * Hover behavior:
 * - Default: Real listings visible, devices look like finished UI preview
 * - On hover: Devices "come alive" with enhanced glow + auto-scroll
 */

// Viewport dimensions (real device widths)
const IPHONE_VIEWPORT_WIDTH = 375; // iPhone viewport
const IPAD_VIEWPORT_WIDTH = 768;   // iPad viewport for 2-column grid

// Device frame dimensions
const IPAD_FRAME = { width: 380, height: 500, bezel: 28 };
const IPHONE_FRAME = { width: 220, height: 450, bezel: 22 };

// Screen dimensions (inside bezel)
const IPAD_SCREEN_WIDTH = IPAD_FRAME.width - IPAD_FRAME.bezel; // 352px
const IPAD_SCREEN_HEIGHT = IPAD_FRAME.height - IPAD_FRAME.bezel; // 472px
const IPHONE_SCREEN_WIDTH = IPHONE_FRAME.width - IPHONE_FRAME.bezel; // 198px
const IPHONE_SCREEN_HEIGHT = IPHONE_FRAME.height - IPHONE_FRAME.bezel; // 428px

// Scale factors: screen width / viewport width
const IPAD_SCALE = IPAD_SCREEN_WIDTH / IPAD_VIEWPORT_WIDTH;
const IPHONE_SCALE = IPHONE_SCREEN_WIDTH / IPHONE_VIEWPORT_WIDTH;

// Viewport heights (screen height / scale = how tall the viewport appears at full size)
const IPAD_VIEWPORT_HEIGHT = IPAD_SCREEN_HEIGHT / IPAD_SCALE;
const IPHONE_VIEWPORT_HEIGHT = IPHONE_SCREEN_HEIGHT / IPHONE_SCALE;

// Auto-scroll speed (pixels per frame at ~60fps)
const AUTO_SCROLL_SPEED = 0.5;

export function HeroDeviceShowcase() {
  // Refs for auto-scroll
  const iPadScrollRef = useRef<HTMLDivElement>(null);
  const iPhoneScrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const animationRef = useRef<number | null>(null);
  // iPad shows vehicles, iPhone shows companies
  const [iPadVehicles, setIPadVehicles] = useState<VehicleSearchItem[]>([]);
  const [iPhoneCompanies, setIPhoneCompanies] = useState<Company[]>([]);
  const [iPadLoading, setIPadLoading] = useState(true);
  const [iPhoneLoading, setIPhoneLoading] = useState(true);
  const [iPadError, setIPadError] = useState<string | null>(null);
  const [iPhoneError, setIPhoneError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch iPad vehicles (page 1)
    const fetchIPadVehicles = async () => {
      try {
        const result = await searchVehicles({ limit: 12, page: 1 });
        setIPadVehicles(result.items || []);
        setIPadError(null);
      } catch (err) {
        console.error('[HeroDeviceShowcase] Failed to fetch iPad vehicles:', err);
        setIPadError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIPadLoading(false);
      }
    };

    // Fetch iPhone companies
    const fetchIPhoneCompanies = async () => {
      try {
        const result = await searchCompaniesFromApi({ limit: 8 });
        setIPhoneCompanies(result.companies || []);
        setIPhoneError(null);
      } catch (err) {
        console.error('[HeroDeviceShowcase] Failed to fetch iPhone companies:', err);
        setIPhoneError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setIPhoneLoading(false);
      }
    };

    fetchIPadVehicles();
    fetchIPhoneCompanies();
  }, []);

  // Auto-scroll effect on hover
  useEffect(() => {
    if (!isHovered) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = () => {
      // Auto-scroll iPad (stop at bottom, no loop)
      if (iPadScrollRef.current) {
        const el = iPadScrollRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (el.scrollTop < maxScroll) {
          el.scrollTop += AUTO_SCROLL_SPEED;
        }
        // Stop at bottom - no looping
      }

      // Auto-scroll iPhone (stop at bottom, no loop)
      if (iPhoneScrollRef.current) {
        const el = iPhoneScrollRef.current;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (el.scrollTop < maxScroll) {
          el.scrollTop += AUTO_SCROLL_SPEED;
        }
        // Stop at bottom - no looping
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isHovered]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Background glow - matches hero gradient */}
      <div
        className="absolute inset-0 rounded-3xl"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
        }}
      />

      {/* Device composition wrapper - group for hover detection */}
      {/* Rest state: tighter composition (devices closer, more overlap) */}
      {/* Hover state: expanded composition (devices spread out, more dynamic) */}
      {/* Performance: overflow-visible to prevent clipping, isolation for stacking context */}
      <div
        className="device-showcase-wrapper relative w-full max-w-[650px] h-[480px] xl:h-[540px] group overflow-visible isolate"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >

        {/* iPad - Behind, rotated left */}
        {/* Rest: translateX(60px), slight rotation, scale 0.95 */}
        {/* Hover: translateX(0), more rotation, full scale */}
        {/* IMPORTANT: Use transform-only for smooth animation (no left/right changes) */}
        <motion.div
          className="absolute left-0 top-1/2 z-10 will-change-transform"
          style={{
            width: IPAD_FRAME.width,
            height: IPAD_FRAME.height,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {/* Transform wrapper - CSS-only hover with consistent transform stack */}
          {/* Base: translateY(-50%) translateX(60px) rotate(-4deg) scale(0.95) */}
          {/* Hover: translateY(-50%) translateX(0) rotate(-8deg) scale(1.02) */}
          <div
            className="hero-device-ipad w-full h-full backface-hidden"
          >
            {/* Static ambient glow - no animation, just opacity change */}
            <div
              className="absolute inset-0 rounded-[40px] opacity-40 group-hover:opacity-55 transition-opacity duration-300 -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
              }}
            />

            {/* iPad Frame - static shadow, no transition */}
            <div className="relative h-full w-full rounded-[40px] p-[6px] bg-gradient-to-b from-[#3a3a3a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.15)_inset,0_25px_50px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
              {/* Inner Bezel */}
              <div className="h-full w-full rounded-[34px] bg-black p-[8px] shadow-[0_0_3px_black_inset]">
                {/* Screen Mask - clips content */}
                <div className="relative h-full w-full rounded-[26px] bg-slate-50 overflow-hidden">
                  {/* Front Camera */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-800 rounded-full z-30" />

                  {/* Real Listings - always visible */}
                  <div
                    ref={iPadScrollRef}
                    className="h-full overflow-y-auto overflow-x-hidden"
                    style={{
                      width: IPAD_VIEWPORT_WIDTH,
                      height: IPAD_VIEWPORT_HEIGHT,
                      zoom: IPAD_SCALE,
                    }}
                  >
                    {/* iPad Grid Layout - 2 columns */}
                    <IPadGridLayout
                      vehicles={iPadVehicles}
                      loading={iPadLoading}
                      error={iPadError}
                    />
                  </div>

                  {/* Bottom fade mask */}
                  <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-20" />

                  {/* Home Indicator */}
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-slate-900/30 rounded-full z-30" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* iPhone - Front, rotated right */}
        {/* Rest: translateX(-40px), slight rotation, scale 0.95 */}
        {/* Hover: translateX(0), more rotation, full scale */}
        {/* IMPORTANT: Use transform-only for smooth animation (no right changes) */}
        <motion.div
          className="absolute right-0 top-1/2 z-20 will-change-transform"
          style={{
            width: IPHONE_FRAME.width,
            height: IPHONE_FRAME.height,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {/* Transform wrapper - CSS-only hover with consistent transform stack */}
          {/* Base: translateY(-50%) translateX(-40px) rotate(4deg) scale(0.95) */}
          {/* Hover: translateY(-50%) translateX(0) rotate(8deg) scale(1.05) */}
          <div
            className="hero-device-iphone w-full h-full backface-hidden"
          >
            {/* Static ambient glow - no animation, just opacity change */}
            <div
              className="absolute inset-0 rounded-[45px] opacity-40 group-hover:opacity-55 transition-opacity duration-300 -z-10"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(245, 158, 11, 0.35) 0%, transparent 70%)',
              }}
            />

            {/* iPhone Frame - static shadow, no transition */}
            <div className="relative h-full w-full rounded-[45px] p-[5px] bg-gradient-to-b from-[#4a4a4a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.2)_inset,0_25px_50px_-20px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
              {/* Inner Bezel */}
              <div className="h-full w-full rounded-[40px] bg-black p-[6px] shadow-[0_0_4px_black_inset]">
                {/* Screen Mask - clips content */}
                <div className="relative h-full w-full rounded-[34px] bg-slate-50 overflow-hidden">
                  {/* Dynamic Island */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[70px] h-[22px] bg-black rounded-[12px] z-30 flex items-center justify-center">
                    <div className="flex items-center justify-between w-full px-2">
                      <div className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
                      <div className="w-0.5 h-0.5 rounded-full bg-[#0c0c0c]" />
                    </div>
                  </div>

                  {/* Companies list - matches /companies page */}
                  <div
                    className="pt-7"
                    style={{
                      width: IPHONE_VIEWPORT_WIDTH,
                      zoom: IPHONE_SCALE,
                    }}
                  >
                    {/* Fixed header outside scroll */}
                    <div className="px-3 py-2.5 bg-white border-b border-slate-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Icon icon="mdi:domain" className="h-4 w-4 text-white" />
                          </div>
                          <div className="text-[13px] font-bold text-slate-900">Companies</div>
                        </div>
                        <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Icon icon="mdi:magnify" className="h-4 w-4 text-slate-500" />
                        </div>
                      </div>
                    </div>
                    {/* Scrollable list area */}
                    <div
                      ref={iPhoneScrollRef}
                      className="overflow-y-auto overflow-x-hidden bg-slate-50"
                      style={{ height: IPHONE_VIEWPORT_HEIGHT - 100 }}
                    >
                      {/* iPhone Company List */}
                      <IPhoneCompanyLayout
                        companies={iPhoneCompanies}
                        loading={iPhoneLoading}
                        error={iPhoneError}
                      />
                    </div>
                  </div>

                  {/* Bottom fade mask - always visible */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pointer-events-none z-20" />

                  {/* Home Bar */}
                  <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-20 h-1 bg-slate-900/40 rounded-full z-30" />
                </div>
              </div>

              {/* Side Buttons */}
              <div className="absolute -left-[2px] top-20 w-[2px] h-6 bg-[#3a3a3a] rounded-l-md opacity-80" />
              <div className="absolute -left-[2px] top-28 w-[2px] h-10 bg-[#3a3a3a] rounded-l-md opacity-80" />
              <div className="absolute -right-[2px] top-24 w-[2px] h-12 bg-[#3a3a3a] rounded-r-md opacity-80" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* CSS for device hover transforms - GPU accelerated, no jump */}
      <style>{`
        /* Scale down entire device showcase 20% below 1420px - CENTERED */
        @media (max-width: 1419px) {
          .device-showcase-wrapper {
            transform: scale(0.8);
            transform-origin: center center;
          }
        }
        
        .hero-device-ipad {
          transform: translateY(-50%) translateX(60px) rotate(-4deg) scale(0.95) translateZ(0);
          transform-origin: center center;
          transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hero-device-iphone {
          transform: translateY(-50%) translateX(-40px) rotate(4deg) scale(0.95) translateZ(0);
          transform-origin: center center;
          transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Hover transforms - SMALLER below 1420px to prevent overflow */
        .group:hover .hero-device-ipad {
          transform: translateY(-50%) translateX(20px) rotate(-6deg) scale(0.98) translateZ(0);
        }
        .group:hover .hero-device-iphone {
          transform: translateY(-50%) translateX(-20px) rotate(6deg) scale(1.0) translateZ(0);
        }
        
        /* Full hover transforms at 1420px+ */
        @media (min-width: 1420px) {
          .group:hover .hero-device-ipad {
            transform: translateY(-50%) translateX(0px) rotate(-8deg) scale(1.02) translateZ(0);
          }
          .group:hover .hero-device-iphone {
            transform: translateY(-50%) translateX(0px) rotate(8deg) scale(1.05) translateZ(0);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .hero-device-ipad,
          .hero-device-iphone {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

interface LayoutProps {
  vehicles: VehicleSearchItem[];
  loading: boolean;
  error: string | null;
  hideHeader?: boolean;
}

interface CompanyLayoutProps {
  companies: Company[];
  loading: boolean;
  error: string | null;
}

/**
 * IPhoneCompanyLayout - Company list for iPhone
 * 
 * Matches /companies page list view with compact company cards.
 */
const IPhoneCompanyLayout = memo(function IPhoneCompanyLayout({ companies, loading, error }: CompanyLayoutProps) {
  // Format currency for price
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="w-full bg-slate-50 pointer-events-none select-none" aria-hidden="true">
        <div className="p-3 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-6 w-12 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-slate-50 p-6 flex flex-col items-center justify-center min-h-[300px] pointer-events-none select-none" aria-hidden="true">
        <Icon icon="mdi:alert-circle" className="h-6 w-6 text-red-500 mb-2" />
        <p className="text-sm text-red-600 text-center font-medium">Failed to load</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="w-full bg-slate-50 p-6 flex items-center justify-center min-h-[300px] pointer-events-none select-none" aria-hidden="true">
        <p className="text-sm text-slate-500 text-center">No companies found</p>
      </div>
    );
  }

  return (
    <div className="w-full bg-slate-50" aria-hidden="true">
      <div className="p-3 space-y-2 pointer-events-none select-none">
        {companies.map((company) => (
          <div
            key={company.id}
            className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 shadow-sm"
          >
            <div className="h-14 w-14 rounded-lg border border-slate-100 bg-white p-1.5 flex-shrink-0 overflow-hidden">
              <img
                src={company.logo ?? '/placeholder-company.png'}
                alt={company.name}
                className="h-full w-full object-contain"
                style={{ imageRendering: 'auto' }}
                loading="eager"
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-sm font-semibold text-slate-900 truncate">{company.name}</h4>
                {company.vipStatus && (
                  <Icon icon="mdi:crown" className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Icon icon="mdi:map-marker-outline" className="h-3 w-3" />
                <span className="truncate">{company.location?.city || 'Georgia'}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="flex items-center gap-0.5 bg-slate-50 px-1.5 py-0.5 rounded">
                <Icon icon="mdi:star" className="h-3 w-3 text-amber-400" />
                <span className="text-xs font-bold text-slate-900">{company.rating}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600">
                {company.priceRange?.min ? formatCurrency(company.priceRange.min) : 'Ask'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

/**
 * IPadGridLayout - 2-column grid layout for iPad
 * 
 * Renders cards in a 2-column grid with proper gutters.
 * Includes a mini app header for authenticity.
 */
const IPadGridLayout = memo(function IPadGridLayout({ vehicles, loading, error }: LayoutProps) {
  if (loading) {
    return (
      <div className="w-full bg-slate-50">
        {/* App Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
                <Icon icon="mdi:car" className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Live Auctions</div>
                <div className="text-xs text-slate-500">Find your next car</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon icon="mdi:magnify" className="h-4 w-4 text-slate-500" />
              </div>
              <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
                <Icon icon="mdi:filter-variant" className="h-4 w-4 text-slate-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Skeleton Grid */}
        <div className="p-4 grid grid-cols-2 gap-4 pb-16">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <Skeleton className="aspect-[4/3] w-full" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <div className="flex justify-between items-center pt-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-slate-50 p-8 flex flex-col items-center justify-center min-h-[400px]">
        <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-500 mb-2" />
        <p className="text-sm text-red-600 text-center font-medium">
          Failed to load listings
        </p>
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <div className="w-full bg-slate-50 p-8 flex items-center justify-center min-h-[400px]">
        <p className="text-sm text-slate-500 text-center">
          No listings found
        </p>
      </div>
    );
  }

  // Render 2-column grid (scroll handled by parent screen mask)
  return (
    <div className="w-full bg-slate-50">
      {/* App Header */}
      <div className="px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <Icon icon="mdi:car" className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-900">Live Auctions</div>
              <div className="text-xs text-slate-500">Find your next car</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon icon="mdi:magnify" className="h-4 w-4 text-slate-500" />
            </div>
            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center">
              <Icon icon="mdi:filter-variant" className="h-4 w-4 text-slate-500" />
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Grid - show all fetched vehicles for scrolling */}
      <div className="p-4 grid grid-cols-2 gap-4">
        {vehicles.map((vehicle) => (
          <AuctionVehicleCard
            key={vehicle.id}
            item={vehicle}
            variant="preview"
            forceLayout="desktop"
          />
        ))}
      </div>
    </div>
  );
});



export default HeroDeviceShowcase;
