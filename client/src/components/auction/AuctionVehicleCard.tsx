import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from 'react-i18next';
import type { VehicleSearchItem } from '@/types/vehicles';
import { cn } from '@/lib/utils';

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
  onCalculate,
  onViewDetails,
  showCompareCheckbox = false,
  priority = false,
  onToggleWatch,
  isWatched = false,
}: AuctionVehicleCardProps) {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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

  const translateDrive = (drive: string | null | undefined) => {
    if (!drive) return 'N/A';
    const key = drive.toLowerCase();
    if (key.includes('fwd') || key.includes('front')) return t('common.drive_types.fwd');
    if (key.includes('rwd') || key.includes('rear')) return t('common.drive_types.rwd');
    if (key.includes('awd') || key.includes('all')) return t('common.drive_types.awd');
    if (key.includes('4wd')) return t('common.drive_types.4wd');
    if (key.includes('full')) return t('common.drive_types.full');
    return drive;
  };


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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWatch();
                      }}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        isWatched 
                          ? 'bg-orange-500 text-white hover:bg-orange-600' 
                          : 'bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-600'
                      }`}
                      title={isWatched ? t('auction.remove_from_watchlist') : t('auction.add_to_watchlist')}
                    >
                      <Icon icon={isWatched ? "mdi:star" : "mdi:star-outline"} className="w-3.5 h-3.5" />
                      <span>{t('auction.watch')}</span>
                    </button>
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

  // Desktop card - original layout
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
      className="h-full"
    >
      <Card className="group relative h-full overflow-hidden rounded-2xl border-border/40 bg-card shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col p-0 gap-0">
        {/* Image Container */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
          <button
            type="button"
            className="w-full h-full focus:outline-none cursor-pointer"
            onClick={onViewDetails}
            aria-label={t('auction.view_vehicle_details')}
          >
            <img
              src={mainPhotoUrl}
              alt={`${item.year} ${item.make} ${item.model}`}
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>

          {/* Top Actions Overlay */}
          <div className="absolute top-3 inset-x-3 flex justify-start items-start pointer-events-none">
            {/* Left: Compare Checkbox */}
            <div className="pointer-events-auto flex gap-2">
              {showCompareCheckbox && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-background/90 backdrop-blur-md rounded-full px-3 py-1.5 shadow-sm border border-border/50 hover:bg-background transition-colors"
                >
                  <Checkbox
                    id={`compare-${item.id}`}
                    checked={isSelected}
                    onCheckedChange={(checked) => onToggleSelect?.(!!checked)}
                    className="w-4 h-4 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  />
                  <label
                    htmlFor={`compare-${item.id}`}
                    className="text-[10px] font-semibold uppercase tracking-wider cursor-pointer select-none"
                  >
                    {t('common.compare')}
                  </label>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom Image Overlay (Badges) */}
          <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 pointer-events-none max-w-[70%]">
            {(item.yard_name || item.source) && (
              <>
                {item.source && (
                  <Badge
                    className={cn(
                      "pointer-events-auto text-[10px] px-2 py-0.5 h-5 backdrop-blur-md border-none shadow-sm font-bold tracking-wide",
                      item.source.toLowerCase() === 'copart' ? "bg-[#0047AB] text-white" :
                      item.source.toLowerCase() === 'iaai' ? "bg-[#D40000] text-white" :
                      "bg-black/70 text-white"
                    )}
                  >
                    {item.source.toUpperCase()}
                  </Badge>
                )}
                {item.yard_name && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="secondary" className="pointer-events-auto text-[10px] px-2 py-0.5 h-5 bg-white/90 text-black backdrop-blur-md border-none shadow-sm max-w-full truncate cursor-help">
                          {item.yard_name.length > 15 ? `${item.yard_name.slice(0, 15)}...` : item.yard_name}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{item.yard_name}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </>
            )}
          </div>

        </div>

        {/* Content Body */}
        <CardContent className="flex flex-col flex-1 p-4 gap-3">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-lg leading-tight truncate min-w-0 group-hover:text-primary transition-colors" title={`${item.year} ${item.make} ${item.model}`}>
                {item.year} {item.make} {item.model}
              </h3>
            </div>
            {hasBuyNow && (
              <div className="flex items-center gap-1 mt-0.5">
                <Badge className="bg-emerald-500/90 text-white border-none h-5 px-2 text-[10px] font-semibold tracking-wide flex items-center gap-1">
                  <Icon icon="mdi:flash" className="w-3 h-3" />
                  {t('auction.filters.buy_now_only')}
                </Badge>
                {buyNowPriceLabel && (
                  <span className="text-xs font-semibold text-emerald-700">
                    {buyNowPriceLabel}
                  </span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.run_and_drive ? (
                <>
                  <span className={cn("font-medium flex items-center gap-1", item.run_and_drive.toLowerCase().includes('run') ? "text-emerald-600" : "text-orange-600")}>
                    <Icon icon="mdi:engine" className="w-3.5 h-3.5" />
                    {item.run_and_drive}
                  </span>
                </>
              ) : (
                <span className="h-4" /> // Spacer to keep alignment if no status
              )}
            </div>
          </div>

          {/* Bottom Section - Specs + Footer (always aligned) */}
          <div className="mt-auto flex flex-col gap-3">
            {/* Specs Grid */}
            <div className="grid grid-cols-3 gap-2 py-2 border-y border-dashed border-border/60">
            <div className="flex flex-col items-center justify-center text-center gap-0.5">
              <Icon icon="mdi:speedometer" className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-xs font-medium truncate w-full">{formatMileage(item.mileage)}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-0.5 border-l border-dashed border-border/60 pl-2">
              <Icon icon="mdi:gas-station" className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-xs font-medium capitalize truncate w-full">{translateFuel(item.fuel_type)}</span>
            </div>
            <div className="flex flex-col items-center justify-center text-center gap-0.5 border-l border-dashed border-border/60 pl-2">
              <Icon icon="mdi:car-traction-control" className="w-4 h-4 text-muted-foreground/70" />
              <span className="text-xs font-medium capitalize truncate w-full">{translateDrive(item.drive)}</span>
            </div>
            </div>

            {/* Footer: Price & Actions */}
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {item.calc_price ? t('auction.total_estimate') : t('auction.retail_value')}
                  </span>
                  <span className="text-xl font-extrabold text-primary tracking-tight">
                    {formatMoney(displayPrice)}
                  </span>
                </div>
                {onToggleWatch && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatch();
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                      isWatched 
                        ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-sm' 
                        : 'bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-600'
                    }`}
                    title={isWatched ? t('auction.remove_from_watchlist') : t('auction.add_to_watchlist')}
                  >
                    <Icon icon={isWatched ? "mdi:star" : "mdi:star-outline"} className="w-4 h-4" />
                    <span>{t('auction.watch')}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-full border-border hover:border-primary hover:text-primary transition-colors"
                  onClick={onCalculate}
                  title={t('auction.calculate_cost')}
                >
                  <Icon icon="mdi:calculator-variant" className="w-4.5 h-4.5" />
                </Button>
                <Button
                  size="sm"
                  className="flex-1 h-9 rounded-full px-4 font-semibold shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                  onClick={onViewDetails}
                >
                  {t('auction.join_live_auction')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
