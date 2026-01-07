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
  onCalculate?: () => void;
  onViewDetails?: () => void;
  showCompareCheckbox?: boolean;
  priority?: boolean;
  onToggleWatch?: () => void;
  isWatched?: boolean;
  /** 
   * 'default' = full interactive card
   * 'preview' = non-interactive preview for hero device screens (no buttons, no hover effects)
   */
  variant?: 'default' | 'preview';
  /**
   * Force mobile or desktop layout regardless of screen size
   * Useful for device screen previews
   */
  forceLayout?: 'mobile' | 'desktop';
  /**
   * Hide odometer section (useful for similar vehicles)
   */
  hideOdometer?: boolean;
  /**
   * Context determines styling variant:
   * 'similar' = used in similar vehicles carousel (horizontal layout preserved)
   * 'listing' = used in auction listings grid (vertical layout: image on top, data below)
   */
  context?: 'similar' | 'listing';
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
  variant = 'default',
  forceLayout,
  hideOdometer = false,
  context = 'listing',
}: AuctionVehicleCardProps) {
  const { t, i18n } = useTranslation();
  const isGeorgian = i18n.language?.startsWith('ka');
  const localeList = [
    'ka',
    'ka-GE',
    i18n.language || 'en',
    'en',
  ];
  const monthShortKa = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
  const detectedMobile = useMobileDetect();

  // Use forceLayout if provided, otherwise use detected mobile state
  const isMobile = forceLayout ? forceLayout === 'mobile' : detectedMobile;
  const isPreview = variant === 'preview';

  const mainPhotoUrl = item.primary_photo_url || item.primary_thumb_url || '/cars/1.webp';

  // Last bid from API (preferred) or fallback to calc_price
  const lastBid = item.last_bid;
  let displayPrice: number = 0;
  let bidTime: string | null = null;

  if (lastBid && lastBid.bid != null) {
    displayPrice = lastBid.bid;
    bidTime = lastBid.bid_time;
  } else if (item.calc_price != null) {
    const numericCalc = typeof item.calc_price === 'number' ? item.calc_price : Number(item.calc_price);
    if (Number.isFinite(numericCalc)) displayPrice = Math.max(0, numericCalc);
  }

  // Format bid time for display
  const formatBidTime = (isoTime: string | null): string => {
    if (!isoTime) return '';
    try {
      const date = new Date(isoTime);
      if (isGeorgian) {
        const month = monthShortKa[date.getMonth()];
        const day = date.getDate();
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month} ${day}, ${year}, ${hours}:${minutes}`;
      }
      return new Intl.DateTimeFormat(localeList, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return '';
    }
  };

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

    const auctionInfo = (() => {
      if (!item.sold_at_date) return null;
      try {
        const auctionDate = new Date(item.sold_at_date);
        const now = new Date();
        const isUpcoming = auctionDate > now;

        const dateStr = isGeorgian
          ? `${monthShortKa[auctionDate.getMonth()]} ${auctionDate.getDate()}, ${auctionDate.getFullYear()}`
          : new Intl.DateTimeFormat(localeList, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }).format(auctionDate);

        let timeStr = '';
        if (item.sold_at_time) {
          const [hours, minutes] = item.sold_at_time.split(':');
          const hour = parseInt(hours, 10);
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const hour12 = hour % 12 || 12;
          timeStr = `${hour12}:${minutes} ${ampm}`;
        } else {
          timeStr = new Intl.DateTimeFormat(localeList, {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }).format(auctionDate);
        }

        return { date: dateStr, time: timeStr, isUpcoming };
      } catch {
        return null;
      }
    })();

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="w-full mb-1.5"
      >
        <div className={cn(
          "auction-card-mobile w-full overflow-hidden bg-white border border-slate-200 shadow-md flex flex-col",
          context === 'similar' && "similar-vehicle-card force-horizontal-layout",
          context === 'listing' && "listing-vehicle-card"
        )}>
          {/* 1️⃣ HEADER - Title + Lot (Copart-style) */}
          <div className="auction-card-header px-4 py-3">
            <h3 className="font-bold text-[16px] leading-snug text-slate-900 uppercase tracking-tight truncate">
              {item.year} {item.make} {item.model}
            </h3>
            <p className="text-[13px] text-slate-600 mt-0.5">
              {t('auction.lot')} {item.source_lot_id || item.id}
            </p>
          </div>

          {/* 2️⃣ MIDDLE ROW - Image + Info, layout controlled by CSS based on context */}
          <div className="auction-card-middle flex items-stretch" style={{ minHeight: context === 'similar' ? '100px' : undefined, maxHeight: context === 'similar' ? '120px' : undefined }}>
            {/* Car Image - width controlled by CSS */}
            <div className="auction-card-image relative flex-shrink-0">
              {isPreview ? (
                <div className="w-full h-full bg-slate-100 overflow-hidden">
                  <img
                    src={mainPhotoUrl}
                    alt={`${item.year} ${item.make} ${item.model}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    style={{ imageRendering: 'auto' }}
                  />
                </div>
              ) : (
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
              )}
              {/* Compare checkbox - hidden in preview */}
              {showCompareCheckbox && !isPreview && (
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

            {/* Info - width controlled by CSS */}
            <div className="auction-card-info flex flex-col justify-start p-3 gap-1 bg-slate-100">
              {/* Odometer section - hidden if hideOdometer is true */}
              {!hideOdometer && (
                <div className="mb-1">
                  <p className="text-[13px] font-bold text-slate-800">{t('auction.fields.odometer')}</p>
                  <p className="text-[13px] text-slate-600">{odometerDisplay}</p>
                </div>
              )}

              {/* Current Bid section */}
              <div className="mb-0.5">
                <p className="text-[13px] font-bold text-slate-800">{t('auction.fields.current_bid')}</p>
                <p className="text-[15px] font-bold text-slate-900">
                  {formatMoney(displayPrice)} <span className="text-[12px] font-normal text-slate-500">USD</span>
                </p>
              </div>

              {/* Buy Now section - plain text like Copart, only if exists */}
              {hasBuyNow && buyNowPriceLabel && (
                <div className="mb-0.5">
                  <p className="text-[13px] font-bold text-slate-800">{t('auction.buy_now_label')}</p>
                  <p className="text-[15px] font-bold text-slate-900">
                    {buyNowPriceLabel} <span className="text-[12px] font-normal text-slate-500">USD</span>
                  </p>
                </div>
              )}

              {/* Auction start date (mobile) */}
              {auctionInfo && (
                <div className="mt-1 flex flex-col min-[501px]:flex-col max-[500px]:flex-row max-[500px]:justify-between max-[500px]:items-center gap-0.5">
                  <div className="flex items-center gap-1">
                    <Icon
                      icon={auctionInfo.isUpcoming ? "mdi:calendar-clock" : "mdi:calendar-check"}
                      className={`w-3.5 h-3.5 ${auctionInfo.isUpcoming ? 'text-emerald-600' : 'text-slate-500'} max-[500px]:hidden`}
                    />
                    <span className={`text-[11px] font-semibold uppercase tracking-wide ${auctionInfo.isUpcoming ? 'text-emerald-700' : 'text-slate-600'
                      }`}>
                      {isMobile && isGeorgian ? 'იწყება' : (auctionInfo.isUpcoming ? t('auction.auction_starts') : t('auction.auction_start_date'))}
                    </span>
                  </div>
                  <div className="flex flex-row gap-1 items-center">
                    <div className={`text-[13px] font-bold ${auctionInfo.isUpcoming ? 'text-emerald-800' : 'text-slate-700'
                      }`}>
                      {auctionInfo.date}
                    </div>
                    <div className={`text-[12px] font-semibold ${auctionInfo.isUpcoming ? 'text-emerald-600' : 'text-slate-500'
                      }`}>
                      {auctionInfo.time}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3️⃣ BOTTOM BUTTONS - Hidden in preview mode */}
          {!isPreview && (
            <div className="auction-card-buttons grid grid-cols-3 border-t border-slate-200">
              {/* DETAILS button - Yellow/Gold */}
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 h-[44px] bg-accent hover:bg-accent/90 text-slate-900 font-semibold text-[13px] transition-colors"
                onClick={onViewDetails}
              >
                <Icon icon="mdi:plus-circle-outline" className="w-4 h-4" />
                {t('common.details')}
              </button>

              {/* WATCH button - White background, blue text */}
              <button
                type="button"
                className={cn(
                  "flex items-center justify-center gap-1.5 h-[44px] font-semibold text-[13px] transition-colors border-l border-slate-200",
                  isWatched
                    ? "bg-green-50 text-green-600"
                    : "bg-white hover:bg-slate-50 text-blue-600"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWatch?.();
                }}
              >
                <Icon icon={isWatched ? "mdi:star" : "mdi:star-outline"} className="w-4 h-4" />
                {t('auction.actions.watch')}
              </button>

              {/* BID NOW button - Blue, always visible on mobile */}
              <button
                type="button"
                className="flex items-center justify-center gap-1.5 h-[44px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[13px] transition-colors border-l border-slate-200"
                onClick={onViewDetails}
              >
                {t('auction.actions.bid_now')}
              </button>
            </div>
          )}
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

          {/* Compare Checkbox - hidden in preview */}
          {showCompareCheckbox && !isPreview && (
            <div className="absolute top-2 left-2">
              <Checkbox
                id={`compare-${item.id}`}
                checked={isSelected}
                onCheckedChange={(checked) => onToggleSelect?.(!!checked)}
                className="w-4 h-4 bg-white border-slate-300"
              />
            </div>
          )}

          {/* Watch button - hidden in preview */}
          {onToggleWatch && !isPreview && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch();
              }}
              className="absolute top-2 right-2 bg-black/50 p-1 rounded hover:bg-black/70 transition-colors"
            >
              <Icon
                icon={isWatched ? "mdi:heart" : "mdi:heart-outline"}
                className={cn("w-4 h-4", isWatched ? "text-green-500" : "text-white")}
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
            <h3 className="font-semibold text-[13px] text-slate-900 hover:text-primary leading-snug truncate">
              {item.year} {item.make} {item.model}
            </h3>
          </button>

          {/* Lot # */}
          <div className="text-[10px] text-slate-500 mb-1.5">
            {t('auction.lot')} {item.source_lot_id || item.id}
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1 mb-2">
            {hasCleanTitle && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                <Icon icon="mdi:check-circle" className="w-2.5 h-2.5" />
                {t('auction.badges.clean_title')}
              </span>
            )}
            {isRunDrive && (
              <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                <Icon icon="mdi:car" className="w-2.5 h-2.5" />
                {t('auction.badges.run_drive')}
              </span>
            )}
          </div>

          {/* Specs */}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-2">
            <span className="flex items-center gap-0.5">
              <Icon icon="mdi:speedometer" className="w-3 h-3" />
              {item.mileage ? `${(item.mileage / 1000).toFixed(0)}k ${t('common.miles_short')}` : 'N/A'}
            </span>
            <span className="flex items-center gap-0.5">
              <Icon icon="mdi:gas-station" className="w-3 h-3" />
              {item.fuel_type || t('common.fuel_gas')}
            </span>
          </div>

          {/* Price & Buttons */}
          <div className="mt-auto space-y-2">
            <div>
              <div className="text-[9px] text-slate-400 uppercase">{t('auction.fields.current_bid')}</div>
              <div className="text-[16px] font-semibold text-slate-900">
                {formatMoney(displayPrice)} <span className="text-[9px] font-normal text-slate-400">USD</span>
              </div>
              {bidTime && (
                <div className="text-[9px] text-slate-400">
                  {formatBidTime(bidTime)}
                </div>
              )}
              {hasBuyNow && buyNowPriceLabel && (
                <div className="text-[10px] text-green-600 font-semibold">
                  {t('auction.buy_now_label')}: {buyNowPriceLabel}
                </div>
              )}
            </div>

            {/* Buttons - hidden in preview mode */}
            {!isPreview && (
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  className="w-full h-7 text-[11px] rounded-full bg-accent hover:bg-accent/90 text-primary font-semibold"
                  onClick={onViewDetails}
                >
                  {t('auction.actions.bid_now')}
                </Button>
                {hasBuyNow ? (
                  <Button
                    size="sm"
                    className="w-full h-7 text-[11px] rounded-full bg-accent hover:bg-accent/90 text-primary font-semibold"
                    onClick={onViewDetails}
                  >
                    {t('auction.actions.buy_it_now')}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full h-7 text-[11px] rounded-full border-slate-300 text-slate-600 font-medium hover:bg-slate-50"
                    onClick={onViewDetails}
                  >
                    {t('common.details')}
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
