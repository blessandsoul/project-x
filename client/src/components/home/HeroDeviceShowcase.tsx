import { useEffect, useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { searchVehicles } from '@/api/vehicles';
import { searchCompaniesFromApi } from '@/services/companiesApi';
import type { VehicleSearchItem } from '@/types/vehicles';
import type { Company } from '@/types/api';
import { AuctionVehicleCard } from '@/components/auction/AuctionVehicleCard';
import { CompanyListItem } from '@/components/catalog/CompanyListItem';

/**
 * HeroDeviceShowcase - iPhone + iPad device composition for hero section
 * 
 * Architecture:
 * - Device frame = visual mask with rotation
 * - Screen content = real viewport (360px iPhone, 768px iPad)
 * - Entire viewport is scaled to fit device frame
 * - iPad = List layout of Companies (Catalog view)
 * - iPhone = 2-column grid layout (Mobile view of /auction-listings)
 * - Cards render EXACTLY as on /auction-listings and /catalog
 * 
 * Hover behavior:
 * - Default: Real listings visible, devices look like finished UI preview
 * - On hover: Devices "come alive" with enhanced glow + auto-scroll
 */

// Viewport dimensions (real device widths)
const IPHONE_VIEWPORT_WIDTH = 375; // iPhone viewport
const IPAD_VIEWPORT_WIDTH = 768;   // iPad viewport

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
    const animationRef = useRef<number | null>(null);

    // Scroll state for yoyo animation (position and direction: 1=down, -1=up)
    const scrollState = useRef({
        ipad: { pos: 0, direction: 1 },
        iphone: { pos: 0, direction: 1 }
    });

    // Data state
    const [vehicles, setVehicles] = useState<VehicleSearchItem[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Fetch data for both devices
        const fetchData = async () => {
            try {
                const [vehiclesResult, companiesResult] = await Promise.all([
                    searchVehicles({ limit: 12, page: 1 }),
                    searchCompaniesFromApi({ limit: 8, offset: 0 })
                ]);

                setVehicles(vehiclesResult.items || []);
                setCompanies(companiesResult.companies || []);
                setError(null);
            } catch (err) {
                console.error('[HeroDeviceShowcase] Failed to fetch data:', err);
                setError(err instanceof Error ? err.message : 'Failed to load');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // Auto-scroll effect (Always active)
    useEffect(() => {
        const animate = () => {
            const updateScroll = (el: HTMLDivElement | null, key: 'ipad' | 'iphone') => {
                if (!el) return;

                const maxScroll = el.scrollHeight - el.clientHeight;
                if (maxScroll <= 0) {
                    scrollState.current[key].pos = 0;
                    return;
                }

                const state = scrollState.current[key];

                // Update position
                state.pos += state.direction * AUTO_SCROLL_SPEED;

                // Yoyo/Bounce logic
                if (state.pos >= maxScroll) {
                    state.pos = maxScroll;
                    state.direction = -1; // Switch to Up
                } else if (state.pos <= 0) {
                    state.pos = 0;
                    state.direction = 1; // Switch to Down
                }

                el.scrollTop = state.pos;
            };

            updateScroll(iPadScrollRef.current, 'ipad');
            updateScroll(iPhoneScrollRef.current, 'iphone');

            animationRef.current = requestAnimationFrame(animate);
        };

        animationRef.current = requestAnimationFrame(animate);

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

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
            <div
                className="device-showcase-wrapper relative w-full max-w-[650px] h-[480px] xl:h-[540px] group overflow-visible isolate"
            >

                {/* iPad - Behind, rotated left */}
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
                    <div className="hero-device-ipad w-full h-full backface-hidden">
                        {/* Static ambient glow */}
                        <div
                            className="absolute inset-0 rounded-[40px] opacity-40 group-hover:opacity-55 transition-opacity duration-300 -z-10"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
                            }}
                        />

                        {/* iPad Frame */}
                        <div className="relative h-full w-full rounded-[40px] p-[6px] bg-gradient-to-b from-[#3a3a3a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.15)_inset,0_25px_50px_-15px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                            <div className="h-full w-full rounded-[34px] bg-black p-[8px] shadow-[0_0_3px_black_inset]">
                                {/* Screen Mask */}
                                <div className="relative h-full w-full rounded-[26px] bg-slate-50 overflow-hidden">
                                    {/* Front Camera */}
                                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-slate-800 rounded-full z-30" />

                                    {/* Real Content (Companies) */}
                                    <div
                                        ref={iPadScrollRef}
                                        className="h-full overflow-y-auto overflow-x-hidden"
                                        style={{
                                            width: IPAD_VIEWPORT_WIDTH,
                                            height: IPAD_VIEWPORT_HEIGHT,
                                            zoom: IPAD_SCALE,
                                        }}
                                    >
                                        <IPadCompanyLayout
                                            companies={companies}
                                            loading={loading}
                                            error={error}
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
                    <div className="hero-device-iphone w-full h-full backface-hidden">
                        {/* Static ambient glow */}
                        <div
                            className="absolute inset-0 rounded-[45px] opacity-40 group-hover:opacity-55 transition-opacity duration-300 -z-10"
                            style={{
                                background: 'radial-gradient(ellipse at center, rgba(37, 99, 235, 0.4) 0%, transparent 70%)',
                            }}
                        />

                        {/* iPhone Frame */}
                        <div className="relative h-full w-full rounded-[45px] p-[5px] bg-gradient-to-b from-[#4a4a4a] via-[#2a2a2a] to-[#1a1a1a] shadow-[0_0_4px_rgba(255,255,255,0.2)_inset,0_25px_50px_-20px_rgba(0,0,0,0.4)] ring-1 ring-white/10">
                            {/* Inner Bezel */}
                            <div className="h-full w-full rounded-[40px] bg-black p-[6px] shadow-[0_0_4px_black_inset]">
                                {/* Screen Mask */}
                                <div className="relative h-full w-full rounded-[34px] bg-slate-50 overflow-hidden">
                                    {/* Dynamic Island */}
                                    <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-[70px] h-[22px] bg-black rounded-[12px] z-30 flex items-center justify-center">
                                        <div className="flex items-center justify-between w-full px-2">
                                            <div className="w-1 h-1 rounded-full bg-[#1a1a1a]" />
                                            <div className="w-0.5 h-0.5 rounded-full bg-[#0c0c0c]" />
                                        </div>
                                    </div>

                                    {/* Listings - matching /auction-listings mobile */}
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
                                                    <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center">
                                                        <Icon icon="mdi:car" className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div className="text-[13px] font-bold text-slate-900">Live Auctions</div>
                                                </div>
                                                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center">
                                                    <Icon icon="mdi:magnify" className="h-4 w-4 text-slate-500" />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Scrollable list area */}
                                        <div
                                            ref={iPhoneScrollRef}
                                            className="overflow-hidden bg-slate-50 scrollbar-hide pointer-events-none"
                                            style={{ height: IPHONE_VIEWPORT_HEIGHT - 100 }}
                                        >
                                            <IPhoneListingLayout
                                                vehicles={vehicles}
                                                loading={loading}
                                                error={error}
                                            />
                                        </div>
                                    </div>

                                    {/* Bottom fade mask */}
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
          transform: translateY(-50%) translateX(160px) rotate(-4deg) scale(0.95) translateZ(0);
          transform-origin: center center;
          transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .hero-device-iphone {
          transform: translateY(-50%) translateX(-120px) rotate(4deg) scale(0.95) translateZ(0);
          transform-origin: center center;
          transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        /* Hover transforms - Expand to show content */
        .group:hover .hero-device-ipad {
          transform: translateY(-50%) translateX(140px) rotate(-6deg) scale(0.98) translateZ(0);
        }
        .group:hover .hero-device-iphone {
          transform: translateY(-50%) translateX(-100px) rotate(6deg) scale(1.0) translateZ(0);
        }

        /* Special spacing for 1024px - 1300px (Laptop/Tablet Landscape) */
        @media (min-width: 1024px) and (max-width: 1299px) {
          .hero-device-ipad {
            transform: translateY(-50%) translateX(100px) rotate(-4deg) scale(0.95) translateZ(0);
          }
          .hero-device-iphone {
            transform: translateY(-50%) translateX(-60px) rotate(4deg) scale(0.95) translateZ(0);
          }
          
          /* Adjust hover for this range */
          .group:hover .hero-device-ipad {
            transform: translateY(-50%) translateX(80px) rotate(-6deg) scale(0.98) translateZ(0);
          }
          .group:hover .hero-device-iphone {
            transform: translateY(-50%) translateX(-40px) rotate(6deg) scale(1.0) translateZ(0);
          }
        }
        
        /* Full hover transforms at 1300px+ */
        @media (min-width: 1300px) {
          /* Default state - more separated */
          .hero-device-ipad {
            transform: translateY(-50%) translateX(100px) rotate(-4deg) scale(0.95) translateZ(0);
          }
          .hero-device-iphone {
            transform: translateY(-50%) translateX(-60px) rotate(4deg) scale(0.95) translateZ(0);
          }

          /* Hover state - expanded separation */
          .group:hover .hero-device-ipad {
            transform: translateY(-50%) translateX(60px) rotate(-8deg) scale(1.02) translateZ(0);
          }
          .group:hover .hero-device-iphone {
            transform: translateY(-50%) translateX(-20px) rotate(8deg) scale(1.05) translateZ(0);
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
    vehicles?: VehicleSearchItem[];
    companies?: Company[];
    loading: boolean;
    error: string | null;
    hideHeader?: boolean;
}

/**
 * IPhoneListingLayout - Auction list for iPhone
 * 
 * Matches /auction-listings page mobile list view.
 */
const IPhoneListingLayout = memo(function IPhoneListingLayout({ vehicles, loading, error }: LayoutProps) {
    if (loading) {
        return (
            <div className="w-full bg-slate-50 p-3 space-y-3" aria-hidden="true">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                        {/* Header Skeleton */}
                        <div className="px-4 py-3 border-b border-slate-100">
                            <Skeleton className="h-4 w-3/4 mb-1" />
                            <Skeleton className="h-3 w-1/4" />
                        </div>
                        {/* Image Skeleton */}
                        <div className="h-[180px] w-full bg-slate-100">
                            <Skeleton className="h-full w-full" />
                        </div>
                    </div>
                ))}
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

    if (!vehicles || vehicles.length === 0) {
        return (
            <div className="w-full bg-slate-50 p-6 flex items-center justify-center min-h-[300px] pointer-events-none select-none" aria-hidden="true">
                <p className="text-sm text-slate-500 text-center">No vehicles found</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-50" aria-hidden="true">
            <div className="p-2 pointer-events-none select-none">
                {/* Force 2-column grid to match mobile layout behavior even on desktop viewport */}
                <div className="grid grid-cols-2 gap-[10px] items-stretch">
                    {vehicles.map((vehicle) => (
                        <AuctionVehicleCard
                            key={vehicle.id}
                            item={vehicle}
                            variant="preview"
                            forceLayout="mobile"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
});

/**
 * IPadCompanyLayout - Company list for iPad
 * 
 * Renders companies in a list layout (Catalog view)
 */
/**
 * IPadCompanyLayout - Company list for iPad
 * 
 * Renders companies in a list layout (Catalog view).
 * Shuffles companies every 10 seconds to keep the preview alive.
 */
const IPadCompanyLayout = memo(function IPadCompanyLayout({ companies, loading, error }: LayoutProps) {
    const [displayCompanies, setDisplayCompanies] = useState<Company[]>([]);
    const [animationKey, setAnimationKey] = useState(0);

    // Initial load + Periodic Shuffle
    useEffect(() => {
        if (loading || !companies || companies.length === 0) return;

        // Function to shuffle and update
        const shuffleAndUpdate = () => {
            const shuffled = [...companies].sort(() => Math.random() - 0.5);
            setDisplayCompanies(shuffled);
            setAnimationKey(prev => prev + 1); // Trigger re-render of motion components
        };

        // Initial set
        shuffleAndUpdate();

        // Interval
        const intervalId = setInterval(shuffleAndUpdate, 10000);

        return () => clearInterval(intervalId);
    }, [companies, loading]);


    if (loading) {
        return (
            <div className="w-full bg-slate-50">
                <div className="px-4 py-3 bg-white border-b border-slate-200">
                    <Skeleton className="h-6 w-32" />
                </div>
                <div className="p-4 space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-lg border border-slate-200 p-3 flex items-center gap-3">
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-1/3" />
                                <Skeleton className="h-3 w-1/4" />
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
                <p className="text-sm text-red-600 text-center font-medium">Failed to load companies</p>
            </div>
        );
    }

    if (!displayCompanies || displayCompanies.length === 0) {
        return (
            <div className="w-full bg-slate-50 p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-slate-500 text-center">No companies found</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-50" aria-hidden="true">
            {/* App Header */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-10 pointer-events-none select-none">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                            <Icon icon="mdi:domain" className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-900">Trusted Importers</div>
                            <div className="text-xs text-slate-500">Verified partners</div>
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

            {/* Company List - Wrapped in pointer-events-none for showcase */}
            <div className="p-4 space-y-3 pointer-events-none select-none">
                {displayCompanies.map((company, index) => {
                    // Generate a deterministic "calculated" price based on company ID hash to keep it consistent per company even when shuffled
                    const idSum = company.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                    const mockPrice = 1450 + (idSum % 500);

                    // Calculate timing to complete all animations in 2 seconds
                    // Total time = 2s, Animation duration = 0.5s
                    // Available time for delays = 1.5s
                    const totalAnimationTime = 2; // seconds
                    const animationDuration = 0.5; // seconds
                    const totalCompanies = displayCompanies.length;
                    const delayPerItem = totalCompanies > 1
                        ? (totalAnimationTime - animationDuration) / (totalCompanies - 1)
                        : 0;

                    /**
                     * AnimatedCountingPrice - Counts up to the target value
                     */
                    function AnimatedCountingPrice({ value, delay = 0 }: { value: number; delay?: number }) {
                        const [displayValue, setDisplayValue] = useState(value - 400);

                        useEffect(() => {
                            let start = value - 400;
                            const duration = 2000;
                            let animationFrameId: number;
                            let timeoutId: number;

                            // Wait for the delay before starting animation
                            timeoutId = window.setTimeout(() => {
                                const startTime = performance.now();

                                const update = (now: number) => {
                                    const elapsed = now - startTime;
                                    const progress = Math.min(elapsed / duration, 1);

                                    // Ease out quart
                                    const ease = 1 - Math.pow(1 - progress, 4);

                                    const current = start + (value - start) * ease;
                                    setDisplayValue(current);

                                    if (progress < 1) {
                                        animationFrameId = requestAnimationFrame(update);
                                    }
                                };
                                animationFrameId = requestAnimationFrame(update);
                            }, delay * 1000); // Convert seconds to milliseconds

                            return () => {
                                clearTimeout(timeoutId);
                                if (animationFrameId) {
                                    cancelAnimationFrame(animationFrameId);
                                }
                            };
                        }, [value, delay]);

                        return (
                            <span>
                                {new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    maximumFractionDigits: 0,
                                }).format(displayValue)}
                            </span>
                        );
                    }

                    return (
                        <motion.div
                            key={`${company.id}-${animationKey}`} // Force re-render on shuffle
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{
                                duration: animationDuration,
                                delay: index * delayPerItem,
                                ease: "easeOut"
                            }}
                        >
                            <CompanyListItem
                                company={company}
                                hasAuctionBranch={true}
                                calculatedShippingPrice={<AnimatedCountingPrice value={mockPrice} delay={index * delayPerItem} />}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
});

export default HeroDeviceShowcase;
