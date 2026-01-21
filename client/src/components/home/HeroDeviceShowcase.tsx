import { useEffect, useState, useRef, memo } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Icon } from '@iconify/react';
import { searchVehicles } from '@/api/vehicles';
import { searchCompaniesFromApi } from '@/services/companiesApi';
import type { VehicleSearchItem } from '@/types/vehicles';
import type { Company } from '@/types/api';
import { CompanyListItem } from '@/components/catalog/CompanyListItem';
import Header from '@/components/Header';
import { navigationItems } from '@/config/navigation';

/**
 * HeroDeviceShowcase - iPhone + iPad device composition for hero section
 * 
 * Architecture:
 * - Device frame = visual mask with rotation
 * - Screen content = real viewport (360px iPhone, 768px iPad)
 * - Entire viewport is scaled to fit device frame
 * - iPad = Auction vehicles table (Desktop view of /auction-listings)
 * - iPhone = Companies list (Mobile view of /catalog)
 * - Cards render EXACTLY as on /auction-listings and /catalog
 * 
 * Hover behavior:
 * - Default: Real listings visible, devices look like finished UI preview
 * - On hover: Devices "come alive" with enhanced glow + auto-scroll
 */

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

// Viewport dimensions (real device widths)
const IPHONE_VIEWPORT_WIDTH = 375; // iPhone viewport

// Device frame dimensions
const IPAD_FRAME = { width: 380, height: 500, bezel: 28 };
const IPHONE_FRAME = { width: 220, height: 450, bezel: 22 };

// Screen dimensions (inside bezel)
const IPAD_SCREEN_WIDTH = IPAD_FRAME.width - IPAD_FRAME.bezel; // 352px
const IPAD_SCREEN_HEIGHT = IPAD_FRAME.height - IPAD_FRAME.bezel; // 472px
const IPHONE_SCREEN_WIDTH = IPHONE_FRAME.width - IPHONE_FRAME.bezel; // 198px
const IPHONE_SCREEN_HEIGHT = IPHONE_FRAME.height - IPHONE_FRAME.bezel; // 428px

// Scale factors: screen width / viewport width
const IPHONE_SCALE = IPHONE_SCREEN_WIDTH / IPHONE_VIEWPORT_WIDTH;

// Viewport heights (screen height / scale = how tall the viewport appears at full size)
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

                                    {/* Header (Absolute + Scaled) */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: 580,
                                            transform: `scale(${IPAD_SCREEN_WIDTH / 580})`,
                                            transformOrigin: 'top left',
                                            zIndex: 40,
                                        }}
                                    >
                                        <div className="relative">
                                            {/* Solid backing to prevent content bleed */}
                                            <div className="absolute inset-0 h-14 bg-[#115e59] z-[-1]" />
                                            <Header navigationItems={navigationItems} forceMobile forceScrolled />
                                        </div>
                                    </div>

                                    {/* Real Content (Auction Vehicles) */}
                                    <div className="h-full w-full overflow-hidden">
                                        <div
                                            ref={iPadScrollRef}
                                            className="overflow-y-auto overflow-x-hidden origin-top-left pt-14"
                                            style={{
                                                width: 580, // Reduced from 768px to "zoom in" content
                                                height: IPAD_SCREEN_HEIGHT / (IPAD_SCREEN_WIDTH / 580),
                                                transform: `scale(${IPAD_SCREEN_WIDTH / 580})`,
                                            }}
                                        >
                                            <IPadAuctionLayout
                                                vehicles={vehicles}
                                                loading={loading}
                                                error={error}
                                            />
                                        </div>
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

                                    {/* Header (Absolute + Scaled) */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: IPHONE_VIEWPORT_WIDTH,
                                            transform: `scale(${IPHONE_SCALE})`,
                                            transformOrigin: 'top left',
                                            zIndex: 40,
                                        }}
                                    >
                                        <div className="relative">
                                            {/* Solid backing to prevent content bleed */}
                                            <div className="absolute inset-0 h-14 bg-[#115e59] z-[-1]" />
                                            <Header navigationItems={navigationItems} forceMobile forceScrolled />
                                        </div>
                                    </div>

                                    {/* Companies List - matching /catalog mobile */}
                                    <div className="h-full w-full overflow-hidden">
                                        <div
                                            ref={iPhoneScrollRef}
                                            className="overflow-y-auto overflow-x-hidden origin-top-left pt-14"
                                            style={{
                                                width: IPHONE_VIEWPORT_WIDTH,
                                                height: IPHONE_VIEWPORT_HEIGHT,
                                                transform: `scale(${IPHONE_SCALE})`,
                                            }}
                                        >
                                            <IPhoneCompanyLayout
                                                companies={companies}
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
 * IPhoneCompanyLayout - Companies list for iPhone
 * 
 * Matches /catalog page mobile list view.
 */
const IPhoneCompanyLayout = memo(function IPhoneCompanyLayout({ companies, loading, error }: LayoutProps) {
    const [displayCompanies, setDisplayCompanies] = useState<Company[]>([]);

    // Shuffle companies on mount
    useEffect(() => {
        if (loading || !companies || companies.length === 0) return;
        const shuffled = [...companies].sort(() => Math.random() - 0.5);
        setDisplayCompanies(shuffled);
    }, [companies, loading]);

    if (loading) {
        return (
            <div className="w-full bg-slate-50 p-3 space-y-2" aria-hidden="true">
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

    if (!displayCompanies || displayCompanies.length === 0) {
        return (
            <div className="w-full bg-slate-50 p-6 flex items-center justify-center min-h-[300px] pointer-events-none select-none" aria-hidden="true">
                <p className="text-sm text-slate-500 text-center">No companies found</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-slate-50" aria-hidden="true">
            <div className="p-3 space-y-2 pointer-events-none select-none">
                {displayCompanies.map((company, index) => {
                    const idSum = company.id.toString().split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
                    // Randomize between 1100-1500
                    const mockPrice = 1100 + (idSum % 401);

                    // Animation timing: Total 2s
                    const totalAnimationTime = 2; // seconds
                    const animationDuration = 0.5; // seconds
                    const totalCompanies = displayCompanies.length;
                    const delayPerItem = totalCompanies > 1
                        ? (totalAnimationTime - animationDuration) / (totalCompanies - 1)
                        : 0;

                    return (
                        <motion.div
                            key={company.id}
                            initial={{ opacity: 0, x: -20 }}
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
                                hideRating={true}
                            />
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
});

/**
 * IPadAuctionLayout - Auction vehicles table for iPad
 * 
 * Renders auction vehicles in a table layout (Desktop view).
 */
const IPadAuctionLayout = memo(function IPadAuctionLayout({ vehicles, loading, error }: LayoutProps) {



    if (loading) {
        return (
            <div className="w-full bg-white">
                <div className="p-4">
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-full mb-2" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full bg-white p-8 flex flex-col items-center justify-center min-h-[400px]">
                <Icon icon="mdi:alert-circle" className="h-8 w-8 text-red-500 mb-2" />
                <p className="text-sm text-red-600 text-center font-medium">Failed to load vehicles</p>
            </div>
        );
    }

    if (!vehicles || vehicles.length === 0) {
        return (
            <div className="w-full bg-white p-8 flex items-center justify-center min-h-[400px]">
                <p className="text-sm text-slate-500 text-center">No vehicles found</p>
            </div>
        );
    }

    // Render auction table (simplified version of TabletAuctionPreview)
    return (
        <div className="w-full bg-white text-foreground overflow-hidden" aria-hidden="true">
            <div className="h-full w-full overflow-auto pointer-events-none select-none">
                <table className="w-full text-left border-collapse table-fixed">
                    <colgroup>
                        <col className="w-[100px]" />
                        <col className="w-[100px]" />
                        <col className="w-[130px]" />
                        <col className="w-[120px]" />
                        <col className="w-[130px]" />
                    </colgroup>
                    <thead className="bg-white sticky top-0 z-10 border-b shadow-sm">
                        <tr>
                            <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase">Image</th>
                            <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase">Lot Info</th>
                            <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase">Vehicle</th>
                            <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase">Document</th>
                            <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase">Bids</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {vehicles.map((item) => {
                            const mainPhotoUrl = item.primary_photo_url || item.primary_thumb_url || '/cars/1.webp';
                            const currentBid = item.last_bid?.bid || item.calc_price || 0;
                            const retailValue = item.retail_value || null;

                            return (
                                <tr key={item.id} className="hover:bg-orange-50/30 transition-colors">
                                    <td className="p-2 align-top">
                                        <div className="relative aspect-[4/3] w-full rounded-md overflow-hidden bg-muted">
                                            <img
                                                src={mainPhotoUrl}
                                                alt={`${item.year} ${item.make} ${item.model}`}
                                                className="w-full h-full object-cover"
                                                loading="lazy"
                                            />
                                            {item.source && (
                                                <div className={`absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase text-white ${item.source.toLowerCase() === 'copart' ? 'bg-[#002d72]' : 'bg-[#c41230]'
                                                    }`}>
                                                    {item.source.toLowerCase() === 'copart' ? 'Copart' : 'IAAI'}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2.5 align-top">
                                        <div className="flex flex-col gap-1">
                                            <h3 className="font-semibold text-xs text-primary leading-tight uppercase">
                                                {item.year} {item.make} {item.model}
                                            </h3>
                                            <div className="text-muted-foreground text-[11px]">
                                                Lot <span className="text-primary font-medium">{item.source_lot_id || item.id}</span>
                                            </div>
                                            {item.yard_name && (
                                                <div className="text-[11px] text-muted-foreground truncate" title={item.yard_name}>
                                                    {item.yard_name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-2.5 align-top">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-muted-foreground text-[11px]">Odometer</div>
                                            <div className="font-semibold text-foreground text-sm">
                                                {item.mileage ? item.mileage.toLocaleString() : 'N/A'}
                                            </div>
                                            <div className="text-muted-foreground text-[11px] mt-1">Est. Retail</div>
                                            <div className="font-semibold text-foreground text-sm">
                                                {retailValue ? `$${retailValue.toLocaleString()}` : 'N/A'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-2.5 align-top">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-muted-foreground text-[10px]">Document</div>
                                            <div className="text-foreground font-medium text-[11px]">{item.document || 'N/A'}</div>
                                        </div>
                                    </td>
                                    <td className="p-2.5 align-top">
                                        <div className="flex flex-col">
                                            <div className="text-muted-foreground text-[10px]">Current Bid</div>
                                            <div className="text-base font-bold text-foreground">
                                                ${typeof currentBid === 'number' ? currentBid.toLocaleString() : currentBid}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
});

export default HeroDeviceShowcase;
