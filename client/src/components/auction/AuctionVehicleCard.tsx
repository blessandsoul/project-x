import { useSyncExternalStore, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import type { VehicleSearchItem } from '@/types/vehicles';
import { cn } from '@/lib/utils';

// Shared mobile detection to avoid multiple resize listeners
let mobileState = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newState = window.innerWidth < 640;
      if (newState !== mobileState) {
        mobileState = newState;
        listeners.forEach(listener => listener());
      }
    }, 100);
  });
}

function useMobileDetect(): boolean {
  const subscribe = useCallback((callback: () => void) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  }, []);
  
  const getSnapshot = useCallback(() => mobileState, []);
  const getServerSnapshot = useCallback(() => false, []);
  
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface AuctionVehicleCardProps {
  item: VehicleSearchItem;
  isSelected?: boolean;
  onToggleSelect?: (checked: boolean) => void;
  onCalculate: () => void;
  onViewDetails: () => void;
  showCompareCheckbox?: boolean;
  priority?: boolean;
  onToggleWatch?: () => void;
  isWatched?: boolean;
}

const formatMoney = (
  value: number | string | null | undefined,
  currency: 'USD' | 'GEL' = 'USD',
): string | null => {
  if (value == null) return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return currency === 'GEL' ? `${numeric.toLocaleString()} GEL` : `$${numeric.toLocaleString()}`;
};

export function AuctionVehicleCard({
  item,
  isSelected = false,
  onToggleSelect,
  onCalculate: _onCalculate,
  onViewDetails,
  showCompareCheckbox = false,
  priority = false,
  onToggleWatch,
  isWatched = false,
}: AuctionVehicleCardProps) {
  const { t } = useTranslation();
  const isMobile = useMobileDetect();

  const [showWatchBurst, setShowWatchBurst] = useState(false);

  const mainPhotoUrl = item.primary_photo_url || item.primary_thumb_url || '/cars/1.webp';

  // Price calculation
  let priceRaw: number | null = null;
  if (item.calc_price != null) {
    const numericCalc = typeof item.calc_price === 'number' ? item.calc_price : Number(item.calc_price);
    if (Number.isFinite(numericCalc)) priceRaw = numericCalc;
  }
  if (priceRaw == null && item.retail_value != null) {
    const numericRetail = typeof item.retail_value === 'number' ? item.retail_value : Number(item.retail_value);
    if (Number.isFinite(numericRetail)) priceRaw = numericRetail;
  }
  const displayPrice = priceRaw != null && Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : 0;

  // Buy Now price (only when strictly positive)
  let buyNowRaw: number | null = null;
  if (item.buy_it_now_price != null) {
    const numeric = typeof item.buy_it_now_price === 'number'
      ? item.buy_it_now_price
      : Number(item.buy_it_now_price);
    if (Number.isFinite(numeric) && numeric > 0) buyNowRaw = numeric;
  } else if (item.buy_it_now != null) {
    const numeric = typeof item.buy_it_now === 'number'
      ? item.buy_it_now
      : Number(item.buy_it_now);
    if (Number.isFinite(numeric) && numeric > 0) buyNowRaw = numeric;
  }

  const hasBuyNow = buyNowRaw != null;
  const buyNowPriceLabel = hasBuyNow ? formatMoney(buyNowRaw) : null;


  // Helpers for translation
  const formatMileage = (mileage: number | null | undefined) => {
    if (!mileage) return 'N/A';
    const k = (mileage / 1000).toFixed(0);
    return `${k}k ${t('common.miles_short')}`;
  };

  const translateFuel = (fuel: string | null | undefined) => {
    if (!fuel) return 'N/A';
    const key = fuel.toLowerCase();
    if (key.includes('gas') || key.includes('petrol')) return t('common.fuel_gas');
    if (key.includes('diesel')) return t('common.fuel_diesel');
    if (key.includes('hybrid')) return t('common.fuel_hybrid');
    if (key.includes('electric')) return t('common.fuel_electric');
    return fuel;
  };

  // translateDrive function removed - not used in Copart-style card


  // Mobile compact card - horizontal layout to fit 5+ per screen
  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="h-full"
      >
        <Card className="group relative overflow-hidden rounded-xl border-border/40 bg-card shadow-sm flex flex-row p-0 gap-0">
          {/* Image - Left side, smaller */}
          <div className="relative w-28 flex-shrink-0 overflow-hidden bg-muted/20">
            <button
              type="button"
              className="w-full h-full focus:outline-none cursor-pointer"
              onClick={onViewDetails}
              aria-label={t('auction.view_vehicle_details')}
            >
              <img
                src={mainPhotoUrl}
                alt={`${item.year} ${item.make} ${item.model}`}
                className="h-full w-full object-cover"
                loading={priority ? 'eager' : 'lazy'}
              />
            </button>
            {/* Source badge on image */}
            {item.source && (
              <Badge
                className={cn(
                  "absolute top-1 left-1 text-[8px] px-1.5 py-0 h-4 backdrop-blur-md border-none shadow-sm font-bold",
                  item.source.toLowerCase() === 'copart' ? "bg-[#0047AB] text-white" :
                  item.source.toLowerCase() === 'iaai' ? "bg-[#D40000] text-white" :
                  "bg-black/70 text-white"
                )}
              >
                {item.source.toUpperCase()}
              </Badge>
            )}
            {/* Compare checkbox */}
            {showCompareCheckbox && (
              <div className="absolute bottom-1 left-1">
                <Checkbox
                  id={`compare-${item.id}`}
                  checked={isSelected}
                  onCheckedChange={(checked) => onToggleSelect?.(!!checked)}
                  className="w-4 h-4 bg-white/90 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
              </div>
            )}
          </div>

          {/* Content - Right side, compact */}
          <CardContent className="flex flex-row flex-1 p-2 gap-2 min-w-0">
            {/* Left: Info */}
            <div className="flex flex-col flex-1 min-w-0 gap-0.5 justify-between h-full">
              <div className="space-y-1">
                <h3 className="font-semibold text-[15px] leading-tight truncate" title={`${item.year} ${item.make} ${item.model}`}>
                  {item.year} {item.make} {item.model}
                </h3>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-0.5">
                    <Icon icon="mdi:speedometer" className="w-3.5 h-3.5" />
                    {formatMileage(item.mileage)}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Icon icon="mdi:gas-station" className="w-3.5 h-3.5" />
                    {translateFuel(item.fuel_type)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-bold text-primary leading-tight">
                    {formatMoney(displayPrice)}
                  </span>
                  {onToggleWatch && (
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isWatched) {
                          setShowWatchBurst(true);
                        }
                        onToggleWatch();
                      }}
                      className={`relative flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        isWatched 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-600'
                      }`}
                      title={isWatched ? t('auction.remove_from_watchlist') : t('auction.add_to_watchlist')}
                    >
                      {showWatchBurst && !isWatched && (
                        <motion.span
                          initial={{ scale: 0, opacity: 0, y: 0 }}
                          animate={{ scale: 1.6, opacity: 0, y: -10 }}
                          transition={{ duration: 0.4, ease: 'easeOut' }}
                          onAnimationComplete={() => setShowWatchBurst(false)}
                          className="absolute -top-1 -right-1 text-orange-400 pointer-events-none"
                        >
                          <Icon icon="mdi:star" className="w-3 h-3" />
                        </motion.span>
                      )}
                      <Icon icon={isWatched ? "mdi:star" : "mdi:star-outline"} className="w-3.5 h-3.5" />
                      <span>{t('auction.watch')}</span>
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
            {/* Right: Actions stacked vertically */}
            <div className="flex flex-col justify-between items-end h-full">
              {hasBuyNow && buyNowPriceLabel ? (
                <span className="text-[10px] text-emerald-600 font-semibold text-right leading-tight">
                  <span className="block">{buyNowPriceLabel}</span>
                  <span className="text-[9px] font-medium">ახლავე ყიდვა</span>
                </span>
              ) : <span />}
              <button
                className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors text-[11px] font-semibold min-w-[44px]"
                onClick={onViewDetails}
                title={t('auction.join_live_auction')}
              >
                {t('auction.join_live_auction')}
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Desktop card - Copart style
  const hasCleanTitle = item.sale_title_type?.toLowerCase().includes('clean');
  const isRunDrive = item.run_and_drive?.toLowerCase().includes('run');

  return (
    <div className="h-full">
      <div className="group relative h-full overflow-hidden rounded-2xl bg-white/90 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <button
            type="button"
            className="w-full h-full focus:outline-none cursor-pointer"
            onClick={onViewDetails}
          >
            <img
              src={mainPhotoUrl}
              alt={`${item.year} ${item.make} ${item.model}`}
              className="h-full w-full object-cover"
              loading={priority ? 'eager' : 'lazy'}
            />
          </button>

          {/* Compare Checkbox */}
          {showCompareCheckbox && (
            <div className="absolute top-2 left-2">
              <Checkbox
                id={`compare-${item.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSelect?.(!!checked)}
                className="w-4 h-4 bg-white border-slate-300"
              />
            </div>
          )}

          {/* Watch button */}
          {onToggleWatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch();
              }}
              className="absolute top-2 right-2 bg-black/50 p-1 rounded hover:bg-black/70 transition-colors"
            >
              <Icon 
                icon={isWatched ? "mdi:heart" : "mdi:heart-outline"} 
                className={cn("w-4 h-4", isWatched ? "text-red-500" : "text-white")}
              />
            </button>
          )}

          {/* Photo count */}
          <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1">
            <Icon icon="mdi:camera" className="w-3 h-3" />
            <span>12</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-3">
          {/* Title */}
          <button onClick={onViewDetails} className="text-left mb-1.5">
            <h3 className="font-semibold text-[13px] text-slate-900 hover:text-[#0047AB] leading-snug line-clamp-2">
              {item.year} {item.make} {item.model}
            </h3>
          </button>

          {/* Lot # */}
          <div className="text-[10px] text-slate-500 mb-1.5">
            Lot# {item.source_lot_id || item.id}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {hasCleanTitle && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                <Icon icon="mdi:check-circle" className="w-2.5 h-2.5" />
                Clean Title
              </span>
            )}
            {isRunDrive && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                <Icon icon="mdi:car" className="w-2.5 h-2.5" />
                Run & Drive
              </span>
            )}
          </div>

          {/* Specs */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
            <span className="flex items-center gap-0.5">
              <Icon icon="mdi:speedometer" className="w-3 h-3" />
              {item.mileage ? `${(item.mileage / 1000).toFixed(0)}k mi` : 'N/A'}
            </span>
            <span className="flex items-center gap-0.5">
              <Icon icon="mdi:gas-station" className="w-3 h-3" />
              {item.fuel_type || 'Gas'}
            </span>
          </div>

          {/* Price & Buttons */}
          <div className="mt-auto space-y-2">
            <div>
              <div className="text-[9px] text-slate-400 uppercase">Current Bid</div>
              <div className="text-[16px] font-semibold text-slate-900">
                {formatMoney(displayPrice)} <span className="text-[9px] font-normal text-slate-400">USD</span>
              </div>
              {hasBuyNow && buyNowPriceLabel && (
                <div className="text-[10px] text-green-600 font-semibold">
                  Buy Now: {buyNowPriceLabel}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Button
                size="sm"
                className="w-full h-7 text-[11px] rounded-full bg-[#f5a623] hover:bg-[#e5a800] text-[#1a2744] font-semibold"
                onClick={onViewDetails}
              >
                Bid Now
              </Button>
              {hasBuyNow ? (
                <Button
                  size="sm"
                  className="w-full h-7 text-[11px] rounded-full bg-[#28a745] hover:bg-[#218838] text-white font-semibold"
                  onClick={onViewDetails}
                >
                  Buy Now
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full h-7 text-[11px] rounded-full border-slate-300 text-slate-600 font-medium hover:bg-slate-50"
                  onClick={onViewDetails}
                >
                  Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
