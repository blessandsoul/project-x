import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
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
  isSelected: _isSelected = false,
  onToggleSelect: _onToggleSelect,
  onViewDetails,
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
    <div className="flex items-stretch border-b border-slate-200 hover:bg-blue-50/50 transition-colors text-[11px]">
      {/* Image Column (fixed) */}
      <div className="w-[130px] flex-shrink-0 p-2">
        <button
          type="button"
          className="w-full aspect-[4/3] rounded overflow-hidden bg-slate-100 focus:outline-none cursor-pointer"
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

      {/* Lot Info Column (flex-[1.2]) */}
      <div className="flex-[1.2] min-w-[180px] p-2 border-l border-slate-100">
        {/* Title */}
        <button onClick={onViewDetails} className="text-left">
          <h3 className="font-bold text-[12px] text-[#0047AB] hover:underline leading-tight uppercase">
            {item.year} {item.make} {item.model}
          </h3>
        </button>
        <div className="text-slate-500 mt-0.5">
          {t('auction.lot')} <span className="text-[#0047AB]">{item.source_lot_id || item.id}</span>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-1 mt-2">
          {onToggleWatch && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleWatch();
              }}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded border text-[10px] font-medium",
                isWatched 
                  ? "bg-green-50 border-green-300 text-green-700" 
                  : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon icon="mdi:bookmark" className="w-3 h-3" />
              {t('auction.actions.watch')}
            </button>
          )}
          <button className="p-1 rounded border border-slate-300 hover:bg-slate-50">
            <Icon icon="mdi:plus-circle-outline" className="w-3.5 h-3.5 text-slate-500" />
          </button>
          <button className="p-1 rounded border border-slate-300 hover:bg-slate-50">
            <Icon icon="mdi:check-circle-outline" className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Vehicle Info Column (flex-[1.6]) */}
      <div className="flex-[1.6] min-w-[200px] p-2 border-l border-slate-100">
        <div className="text-slate-600">{t('auction.fields.odometer')}</div>
        <div className="font-semibold text-slate-900">
          {item.mileage ? item.mileage.toLocaleString() : 'N/A'}
        </div>
        <div className="text-[#0047AB] font-medium">(ACTUAL)</div>
        <div className="text-slate-500 mt-1">{t('auction.fields.estimated_retail_value')}</div>
        <div className="font-semibold text-slate-900">
          {retailValue ? formatMoney(retailValue) : 'N/A'}
        </div>
      </div>

      {/* Condition Column (flex-[0.9]) */}
      <div className="flex-[0.9] min-w-[140px] p-2 border-l border-slate-100">
        <div className="text-slate-900 font-medium">
          {item.sale_title_type || t('auction.fields.clean_title')} ({item.state || 'N/A'})
        </div>
        <div className="text-slate-600 mt-0.5">
          {item.damage_main_damages || t('auction.fields.minor_damage')}
        </div>
        <div className="text-slate-600 mt-0.5">
          {item.has_keys_readable || t('auction.fields.keys_available')}
        </div>
      </div>

      {/* Sale Info Column (flex-[0.9]) */}
      <div className="flex-[0.9] min-w-[140px] p-2 border-l border-slate-100">
        <div className="text-[#0047AB] font-medium flex items-center gap-1">
          {item.yard_name || item.city || 'N/A'}
          <Icon icon="mdi:chevron-right" className="w-3 h-3" />
        </div>
        <div className="text-slate-500 mt-0.5">-/-</div>
        <div className="text-slate-500">{t('auction.fields.item')}: {item.salvage_id || '0'}</div>
        <div className="text-[#0047AB] font-medium mt-0.5">
          {t('auction.fields.auction_time_placeholder')}
        </div>
      </div>

      {/* Bids Column (smallest, fixed) */}
      <div className="w-[130px] flex-shrink-0 p-2 border-l border-slate-100 text-right">
        <div className="text-slate-500">{t('auction.fields.current_bid')}:</div>
        <div className="text-[15px] font-bold text-slate-900">
          {formatMoney(currentBid)} <span className="text-[10px] font-normal text-slate-500">USD</span>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-col gap-1 mt-2">
          <Button
            size="sm"
            className="w-full h-6 text-[10px] bg-[#f7b500] hover:bg-[#e5a800] text-[#1a2b4c] font-bold rounded-sm"
            onClick={onViewDetails}
          >
            {t('auction.actions.bid_now')}
          </Button>
          {hasBuyNow ? (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                className="flex-1 h-6 text-[10px] bg-[#28a745] hover:bg-[#218838] text-white font-bold rounded-sm"
                onClick={onViewDetails}
              >
                {t('auction.actions.buy_it_now')}
              </Button>
              <span className="text-[10px] text-slate-700 font-semibold">
                {formatMoney(buyNowPrice)} <span className="text-slate-400">USD</span>
              </span>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="w-full h-6 text-[10px] border-slate-300 text-slate-600 font-medium rounded-sm"
              onClick={onViewDetails}
            >
              {t('common.details')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
