import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Image } from '@/components/ui/image';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import type { Company } from '@/types/api';
import { cn } from '@/lib/utils';

interface CompanyListItemProps {
  company: Company;
  className?: string;
  isCompareMode?: boolean;
  /** Calculated shipping price from selected auction branch. If undefined, shows placeholder. */
  calculatedShippingPrice?: number;
  /** Whether an auction branch has been selected */
  hasAuctionBranch?: boolean;
  /** Whether shipping prices are currently being loaded */
  isLoadingShipping?: boolean;
  /** View mode: 'grid' for compact cards, 'list' for full-width horizontal layout */
  viewMode?: 'grid' | 'list';
}

export const CompanyListItem = memo(({ company, className, isCompareMode = false, isSelected, onToggleCompare, calculatedShippingPrice, hasAuctionBranch = false, isLoadingShipping = false, viewMode = 'grid' }: CompanyListItemProps & { isSelected?: boolean, onToggleCompare?: (checked: boolean) => void }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Online Status based on rating
  const isOnline = useMemo(() => company.rating > 4.5, [company.rating]);

  const handleViewDetails = () => {
    navigate(`/company/${company.id}`);
  };

  // ===== LIST VIEW: Horizontal full-width layout =====
  if (viewMode === 'list') {
    return (
      <div 
        className={cn(
          "relative flex items-center rounded-md border border-slate-200 bg-white shadow-sm px-5 py-3",
          "transition-all duration-200 hover:shadow-md hover:border-slate-300",
          isSelected && "bg-blue-50/50 border-blue-300 ring-1 ring-blue-200",
          className
        )}
      >
        {/* Compare checkbox */}
        {isCompareMode && (
          <div className="mr-4 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onToggleCompare?.(checked === true)}
              className="h-4 w-4 bg-white"
            />
          </div>
        )}

        {/* Logo */}
        <button
          type="button"
          className="h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          onClick={handleViewDetails}
        >
          <Image 
            src={company.logo || '/car-logos/toyota.png'} 
            alt={`${company.name} logo`} 
            className="h-full w-full"
            fallbackSrc="/car-logos/toyota.png"
            objectFit="contain"
          />
        </button>

        {/* Company Name + City */}
        <div className="flex flex-col justify-center min-w-0 ml-3 w-[160px] flex-shrink-0">
          <button onClick={handleViewDetails} className="text-left">
            <h3 className="text-[13px] font-semibold text-primary hover:underline leading-tight line-clamp-1">
              {company.name}
            </h3>
          </button>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
            <Icon icon="mdi:map-marker" className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{company.location?.city || t('catalog.card.default_city', 'Tbilisi')}</span>
            {company.vipStatus && (
              <span className="inline-flex items-center gap-0.5 ml-1 text-[8px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                <Icon icon="mdi:crown" className="w-2 h-2" />
                {t('catalog.card.vip', 'VIP')}
              </span>
            )}
          </div>
        </div>

        {/* Delivery Time */}
        <div className="w-[100px] flex-shrink-0 text-center border-l border-slate-200 px-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{t('catalog.card.delivery_time', 'Delivery')}</div>
          <div className="font-semibold text-[12px] text-foreground mt-0.5">45-60 {t('common.days')}</div>
        </div>

        {/* Rating */}
        <div className="w-[90px] flex-shrink-0 text-center border-l border-slate-200 px-3">
          <div className="text-[9px] text-muted-foreground uppercase tracking-wide">{t('catalog.card.rating_label', 'Rating')}</div>
          <div className="flex items-center justify-center gap-1 mt-0.5">
            <Icon icon="mdi:star" className="h-3.5 w-3.5 text-amber-500" />
            <span className="font-semibold text-[12px] text-foreground">{company.rating}</span>
            <span className="text-[10px] text-muted-foreground">({company.reviewCount})</span>
          </div>
        </div>

        {/* Shipping Price (if available) */}
        {hasAuctionBranch && (
          <div className="w-[100px] flex-shrink-0 text-center border-l border-slate-200 px-3">
            <div className="text-[9px] text-muted-foreground uppercase tracking-wide whitespace-nowrap">{t('catalog.card.shipping_cost', 'Shipping')}</div>
            {isLoadingShipping ? (
              <Icon icon="mdi:loading" className="h-4 w-4 text-primary animate-spin mt-0.5 mx-auto" />
            ) : (
              <div className="font-semibold text-[12px] text-foreground mt-0.5">
                {calculatedShippingPrice !== undefined && calculatedShippingPrice >= 0 
                  ? formatCurrency(calculatedShippingPrice) 
                  : t('catalog.card.contact', 'Contact')}
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1 min-w-[20px]" />

        {/* Online Status - right aligned */}
        <div className="flex-shrink-0 flex items-center gap-1.5 px-4">
          <span className={cn(
            "h-2 w-2 rounded-full flex-shrink-0",
            isOnline ? "bg-green-500" : "bg-slate-300"
          )} />
          <span className={cn(
            "text-[11px] whitespace-nowrap",
            isOnline ? "text-green-600 font-medium" : "text-muted-foreground"
          )}>
            {isOnline ? t('catalog.card.online_now') : t('catalog.card.offline', 'Offline')}
          </span>
        </div>

        {/* Action Buttons - stacked vertically */}
        <div className="flex flex-col gap-1.5 pl-4 border-l border-slate-200 flex-shrink-0">
          <Button
            size="sm"
            className="w-[100px] h-7 text-[11px] bg-primary hover:bg-primary/90 text-white font-semibold"
            onClick={handleViewDetails}
          >
            {t('catalog.card.send_request', 'გაგზავნა')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="w-[100px] h-7 text-[11px] border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={handleViewDetails}
          >
            {t('catalog.card.get_quote', 'Get Quote')}
          </Button>
        </div>
      </div>
    );
  }

  // ===== GRID VIEW: Compact vertical card layout (default) =====
  return (
    <div 
      className={cn(
        // Compact card layout
        "relative flex flex-col rounded-md border border-slate-200 bg-white shadow-sm px-4 py-3 space-y-3",
        "transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5",
        isSelected && "bg-blue-50/50 border-blue-300 ring-1 ring-blue-200",
        className
      )}
    >
      {/* Compare checkbox - absolute positioned */}
      {isCompareMode && (
        <div className="absolute top-2 right-2 z-10" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggleCompare?.(checked === true)}
            className="h-4 w-4 bg-white"
          />
        </div>
      )}

      {/* TOP: Logo + Name + City in one row */}
      <div className="flex items-center gap-3">
        {/* Logo */}
        <button
          type="button"
          className="h-12 w-12 xl:h-14 xl:w-14 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
          onClick={handleViewDetails}
        >
          <Image 
            src={company.logo || '/car-logos/toyota.png'} 
            alt={`${company.name} logo`} 
            className="h-full w-full"
            fallbackSrc="/car-logos/toyota.png"
            objectFit="contain"
          />
        </button>

        {/* Name + City stacked tight */}
        <div className="flex flex-col min-w-0 flex-1">
          <button onClick={handleViewDetails} className="text-left">
            <h3 className="text-sm font-semibold text-primary hover:underline leading-tight line-clamp-1">
              {company.name}
            </h3>
          </button>
          <div className="flex items-center gap-1 text-[10px] xl:text-[11px] text-muted-foreground">
            <Icon icon="mdi:map-marker" className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{company.location?.city || t('catalog.card.default_city', 'Tbilisi')}</span>
            {/* VIP Badge inline */}
            {company.vipStatus && (
              <span className="inline-flex items-center gap-0.5 ml-1 text-[8px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                <Icon icon="mdi:crown" className="w-2 h-2" />
                {t('catalog.card.vip', 'VIP')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* MIDDLE: Delivery + Rating + Shipping in compact block */}
      <div className="flex items-center justify-between text-[10px] xl:text-[11px]">
        {/* Left: Delivery + Rating stacked */}
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1">
            <span className="uppercase text-[9px] xl:text-[10px] text-muted-foreground">
              {t('catalog.card.delivery_time', 'Delivery')}:
            </span>
            <span className="font-semibold text-[11px] xl:text-[12px] text-foreground">
              45-60 {t('common.days')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Icon icon="mdi:star" className="h-3 w-3 text-amber-500" />
            <span className="font-semibold text-[11px] xl:text-[12px] text-foreground">{company.rating}</span>
            <span className="text-muted-foreground">
              ({company.reviewCount})
            </span>
          </div>
        </div>

        {/* Right: Shipping Price (if available) */}
        {hasAuctionBranch && (
          <div className="text-right">
            <div className="text-[9px] xl:text-[10px] text-muted-foreground uppercase">
              {t('catalog.card.shipping_cost', 'Shipping')}
            </div>
            {isLoadingShipping ? (
              <div className="flex items-center gap-1 justify-end">
                <Icon icon="mdi:loading" className="h-3 w-3 text-primary animate-spin" />
              </div>
            ) : (
              <div className="font-semibold text-[11px] xl:text-[12px] text-foreground">
                {calculatedShippingPrice !== undefined && calculatedShippingPrice >= 0 
                  ? formatCurrency(calculatedShippingPrice) 
                  : t('catalog.card.contact', 'Contact')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* BOTTOM: Status + Buttons in one row */}
      <div className="flex items-center gap-2">
        {/* Online Status */}
        <div className="flex items-center gap-1 text-[10px] xl:text-[11px] text-muted-foreground">
          <span className={cn(
            "h-2 w-2 rounded-full flex-shrink-0",
            isOnline ? "bg-green-500" : "bg-slate-300"
          )} />
          <span className={isOnline ? "text-green-600" : ""}>
            {isOnline ? t('catalog.card.online_now') : t('catalog.card.offline', 'Offline')}
          </span>
        </div>

        {/* Action Buttons - horizontal, compact */}
        <div className="ml-auto flex gap-1.5">
          <Button
            size="sm"
            className="px-2.5 h-7 text-[10px] xl:text-[11px] bg-primary hover:bg-primary/90 text-white font-semibold"
            onClick={handleViewDetails}
          >
            {t('catalog.card.send_request', 'გაგზავნა')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="px-2.5 h-7 text-[10px] xl:text-[11px] border-slate-300 text-slate-700 hover:bg-slate-50"
            onClick={handleViewDetails}
          >
            {t('catalog.card.get_quote', 'Get Quote')}
          </Button>
        </div>
      </div>
    </div>
  );
});

CompanyListItem.displayName = 'CompanyListItem';
