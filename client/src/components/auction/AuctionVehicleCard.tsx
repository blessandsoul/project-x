import { useSyncExternalStore, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useTranslation } from 'react-i18next';
import type { VehicleSearchItem } from '@/types/vehicles';
import { cn } from '@/lib/utils';

// Shared mobile detection to avoid multiple resize listeners
// Treat widths below 768px as "mobile" for the compact list layout
let mobileState = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
const listeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  let resizeTimeout: ReturnType<typeof setTimeout>;
  window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      const newState = window.innerWidth < 768;
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


  // Mobile card - Copart-style layout for <768px (EXACT match)
  if (isMobile) {
    // Format odometer like Copart: "70465 miles (E)"
    const odometerDisplay = item.mileage 
      ? `${item.mileage.toLocaleString()} ${t('common.miles_short')} (E)`
      : 'N/A';

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full mb-1.5"
      >
        <div className="w-full overflow-hidden bg-white border border-slate-200 shadow-md flex flex-col">
          {/* 1️⃣ HEADER - Title + Lot (Copart-style) */}
          <div className="px-4 py-3">
            <h3 className="font-bold text-[16px] leading-snug text-slate-900 uppercase tracking-tight">
              {item.year} {item.make} {item.model}
            </h3>
            <p className="text-[13px] text-slate-600 mt-0.5">
              Lot #{item.source_lot_id || item.id}
            </p>
          </div>

          {/* 2️⃣ MIDDLE ROW - Image (50%) + Info (50%), SAME HEIGHT */}
          <div className="flex flex-row items-stretch" style={{ minHeight: '140px' }}>
            {/* LEFT: Car Image - 50% width, full height */}
            <div className="relative w-1/2 flex-shrink-0">
              <button
                type="button"
                className="w-full h-full bg-slate-100 focus:outline-none cursor-pointer overflow-hidden"
                onClick={onViewDetails}
                aria-label={t('auction.view_vehicle_details')}
              >
                <img
                  src={mainPhotoUrl}
                  alt={`${item.year} ${item.make} ${item.model}`}
                  className="w-full h-full object-cover"
                  loading={priority ? 'eager' : 'lazy'}
                />
              </button>
              {/* Compare checkbox */}
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
            </div>

            {/* RIGHT: Info - 50% width, full height, top-aligned, light gray background */}
            <div className="w-1/2 flex flex-col justify-start p-3 gap-1 bg-slate-100">
              {/* Odometer section */}
              <div className="mb-1">
                <p className="text-[13px] font-bold text-slate-800">Odometer</p>
                <p className="text-[13px] text-slate-600">{odometerDisplay}</p>
              </div>

              {/* Current Bid section */}
              <div className="mb-1">
                <p className="text-[13px] font-bold text-slate-800">{t('auction.fields.current_bid')}:</p>
                <p className="text-[15px] font-bold text-slate-900">
                  {formatMoney(displayPrice)} <span className="text-[12px] font-normal text-slate-500">USD</span>
                </p>
              </div>

              {/* Buy Now section - plain text like Copart, only if exists */}
              {hasBuyNow && buyNowPriceLabel && (
                <div>
                  <p className="text-[13px] font-bold text-slate-800">{t('auction.buy_now_short')}:</p>
                  <p className="text-[15px] font-bold text-slate-900">
                    {buyNowPriceLabel} <span className="text-[12px] font-normal text-slate-500">USD</span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* 3️⃣ BOTTOM BUTTONS - Always 3 buttons on mobile */}
          <div className="grid grid-cols-3 border-t border-slate-200">
            {/* DETAILS button - Yellow/Gold */}
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 h-[44px] bg-[#f5a623] hover:bg-[#e09520] text-slate-900 font-semibold text-[13px] transition-colors"
              onClick={onViewDetails}
            >
              <Icon icon="mdi:plus-circle-outline" className="w-4 h-4" />
              Details
            </button>

            {/* WATCH button - White background, blue text */}
            <button
              type="button"
              className={cn(
                "flex items-center justify-center gap-1.5 h-[44px] font-semibold text-[13px] transition-colors border-l border-slate-200",
                isWatched 
                  ? "bg-amber-50 text-amber-600" 
                  : "bg-white hover:bg-slate-50 text-blue-600"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch?.();
              }}
            >
              <Icon icon={isWatched ? "mdi:star" : "mdi:star-outline"} className="w-4 h-4" />
              Watch
            </button>

            {/* BID NOW button - Blue, always visible on mobile */}
            <button
              type="button"
              className="flex items-center justify-center gap-1.5 h-[44px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[13px] transition-colors border-l border-slate-200"
              onClick={onViewDetails}
            >
              Bid now
            </button>
          </div>
        </div>
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
