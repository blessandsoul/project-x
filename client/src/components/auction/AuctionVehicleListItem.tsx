import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import type { VehicleSearchItem } from '@/types/vehicles';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface AuctionVehicleListItemProps {
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

const formatMoney = (value: number | string | null | undefined): string => {
  if (value == null) return '$0';
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return '$0';
  return `$${numeric.toLocaleString()}`;
};

export function AuctionVehicleListItem({
  item,
  isSelected = false,
  onToggleSelect,
  onViewDetails,
  showCompareCheckbox = false,
  priority = false,
  onToggleWatch,
  isWatched = false,
}: AuctionVehicleListItemProps) {
  const { t } = useTranslation();
  const mainPhotoUrl = item.primary_photo_url || item.primary_thumb_url || '/cars/1.webp';

  // Current bid price
  let currentBid: number | null = null;
  if (item.calc_price != null) {
    const numericCalc = typeof item.calc_price === 'number' ? item.calc_price : Number(item.calc_price);
    if (Number.isFinite(numericCalc)) currentBid = numericCalc;
  }
  if (currentBid == null && item.retail_value != null) {
    const numericRetail = typeof item.retail_value === 'number' ? item.retail_value : Number(item.retail_value);
    if (Number.isFinite(numericRetail)) currentBid = numericRetail;
  }

  // Buy Now price
  let buyNowPrice: number | null = null;
  if (item.buy_it_now_price != null) {
    const numeric = typeof item.buy_it_now_price === 'number' ? item.buy_it_now_price : Number(item.buy_it_now_price);
    if (Number.isFinite(numeric) && numeric > 0) buyNowPrice = numeric;
  } else if (item.buy_it_now != null) {
    const numeric = typeof item.buy_it_now === 'number' ? item.buy_it_now : Number(item.buy_it_now);
    if (Number.isFinite(numeric) && numeric > 0) buyNowPrice = numeric;
  }

  const hasBuyNow = buyNowPrice != null;

  // Retail value
  const retailValue = item.retail_value 
    ? (typeof item.retail_value === 'number' ? item.retail_value : Number(item.retail_value))
    : null;

  return (
    <div className={cn(
      "flex items-stretch w-full border-b border-border hover:bg-orange-50/30 transition-colors text-xs",
      isSelected && "bg-blue-50/50"
    )}>
      {/* Checkbox + Image Column (fixed) */}
      <div className="w-[140px] flex-shrink-0 p-2 flex gap-2">
        {showCompareCheckbox && (
          <div className="flex items-start pt-1">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggleSelect?.(checked === true)}
              className="h-4 w-4"
            />
          </div>
        )}
        <button
          type="button"
          className={cn(
            "flex-1 aspect-[4/3] rounded-md overflow-hidden bg-muted focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer",
            showCompareCheckbox ? "max-w-[100px]" : "w-full"
          )}
          onClick={onViewDetails}
        >
          <img
            src={mainPhotoUrl}
            alt={`${item.year} ${item.make} ${item.model}`}
            className="w-full h-full object-cover"
            loading={priority ? 'eager' : 'lazy'}
          />
        </button>
      </div>

      {/* Lot Info Column (fixed width) */}
      <div className="w-[160px] flex-shrink-0 p-2.5 border-l border-border">
        {/* Title */}
        <button onClick={onViewDetails} className="text-left">
          <h3 className="font-semibold text-xs text-primary hover:underline leading-tight uppercase">
            {item.year} {item.make} {item.model}
          </h3>
        </button>
        <div className="text-muted-foreground mt-0.5 text-[11px]">
          {t('auction.lot')} <span className="text-primary font-medium">{item.source_lot_id || item.id}</span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 mt-2">
          {onToggleWatch && (
            <Button
              variant={isWatched ? "default" : "outline"}
              size="sm"
              className={cn(
                "h-6 text-[10px] gap-1",
                isWatched && "bg-green-600 hover:bg-green-700"
              )}
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch();
              }}
            >
              <Icon icon="mdi:bookmark" className="w-3 h-3" />
              {t('auction.actions.watch')}
            </Button>
          )}
        </div>
      </div>

      {/* Vehicle Info Column (flex) */}
      <div className="flex-[1] min-w-[140px] p-2.5 border-l border-border">
        <div className="text-muted-foreground text-[11px]">{t('auction.fields.odometer')}</div>
        <div className="font-semibold text-foreground">
          {item.mileage ? item.mileage.toLocaleString() : 'N/A'}
        </div>
        <div className="text-muted-foreground mt-1.5 text-[11px]">{t('auction.fields.estimated_retail_value')}</div>
        <div className="font-semibold text-foreground">
          {retailValue ? formatMoney(retailValue) : 'N/A'}
        </div>
      </div>

      {/* Condition Column (flex) */}
      <div className="flex-[1.2] min-w-[150px] p-2.5 border-l border-border">
        <div className="text-foreground font-medium text-[11px]">
          {item.sale_title_type || t('auction.fields.clean_title')} ({item.state || 'N/A'})
        </div>
        <div className="text-muted-foreground mt-0.5 text-[11px]">
          {item.damage_main_damages || t('auction.fields.minor_damage')}
        </div>
        <div className="text-muted-foreground mt-0.5 text-[11px]">
          {item.has_keys_readable || t('auction.fields.keys_available')}
        </div>
      </div>

      {/* Sale Info Column (flex) */}
      <div className="flex-[1.2] min-w-[150px] p-2.5 border-l border-border">
        <div className="text-primary font-medium flex items-center gap-1 text-[11px]">
          {item.yard_name || item.city || 'N/A'}
          <Icon icon="mdi:chevron-right" className="w-3 h-3" />
        </div>
        <div className="text-primary font-medium mt-0.5 text-[11px]">
          {t('auction.fields.auction_time_placeholder')}
        </div>
      </div>

      {/* Bids Column (fixed) */}
      <div className="w-[200px] flex-shrink-0 p-2.5 border-l border-border">
        <div className="text-muted-foreground text-[10px]">Current bid:</div>
        <div className="text-base font-bold text-foreground mb-2">
          {formatMoney(currentBid)} <span className="text-xs font-normal text-muted-foreground">USD</span>
        </div>
        
        <Button
          size="sm"
          className="w-full h-7 text-[11px] bg-[#0066CC] hover:bg-[#0052a3] text-white font-semibold mb-1.5"
          onClick={onViewDetails}
        >
          {t('auction.actions.bid_now')}
        </Button>
        
        {hasBuyNow ? (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-7 px-3 text-[11px] bg-amber-400 hover:bg-amber-500 text-amber-950 font-semibold"
              onClick={onViewDetails}
            >
              {t('auction.actions.buy_it_now')}
            </Button>
            <span className="text-sm text-foreground font-semibold">
              {formatMoney(buyNowPrice)} <span className="text-xs font-normal text-muted-foreground">USD</span>
            </span>
          </div>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="w-full h-7 text-[11px] border-primary text-primary hover:bg-primary/5"
            onClick={onViewDetails}
          >
            {t('common.details')}
          </Button>
        )}
      </div>
    </div>
  );
}
