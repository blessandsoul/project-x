import { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Image } from '@/components/ui/image';
import { Checkbox } from '@/components/ui/checkbox';

import type { Company } from '@/types/api';
import { cn } from '@/lib/utils';

interface CompanyListItemProps {
  company: Company;
  className?: string;
  isCompareMode?: boolean;
  /** Calculated shipping price from selected auction branch. If undefined, shows placeholder. */
  calculatedShippingPrice?: number | React.ReactNode;
  /** Whether an auction branch has been selected */
  hasAuctionBranch?: boolean;
  /** Whether shipping prices are currently being loaded */
  _isLoadingShipping?: boolean;
}

export const CompanyListItem = memo(({ company, className, isCompareMode = false, isSelected, onToggleCompare, calculatedShippingPrice, hasAuctionBranch = false }: CompanyListItemProps & { isSelected?: boolean, onToggleCompare?: (checked: boolean) => void }) => {
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

  // ===== LIST VIEW: Horizontal full-width layout (Always used) =====
  return (
    <div
      className={cn(
        "relative grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1.5 md:gap-4 items-center rounded-lg border border-slate-200 bg-white shadow-sm px-2 py-2.5 md:px-5 md:py-3 cursor-pointer",
        "transition-all duration-200 hover:bg-slate-50/50 hover:shadow-md hover:border-slate-300",
        isSelected && "bg-blue-50/50 border-blue-300 ring-1 ring-blue-200",
        className
      )}
      onClick={() => navigate(`/company/${company.id}`)}
    >
      {/* Compare checkbox - absolute positioned to not affect grid */}
      {isCompareMode && (
        <div className="absolute -left-6 top-1/2 -translate-y-1/2" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onToggleCompare?.(checked === true)}
            className="h-4 w-4 bg-white"
          />
        </div>
      )}

      {/* Column 1: Logo + Company Name + Location (Takes available space) */}
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        {/* Logo with Status Dot Overlay */}
        <div className="relative flex-shrink-0 h-11 w-11 md:h-[54px] md:w-[54px]">
          <button
            type="button"
            className="h-full w-full rounded-lg overflow-hidden bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer transition-all hover:shadow-sm"
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails();
            }}
          >
            <Image
              src={company.logo || '/car-logos/toyota.png'}
              alt={`${company.name} logo`}
              className="h-full w-full"
              fallbackSrc="/car-logos/toyota.png"
              objectFit="contain"
            />
          </button>
          {/* Status Dot - absolutely positioned outside button overflow */}
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 md:h-3 md:w-3 rounded-full ring-2 ring-white pointer-events-none",
              isOnline ? "bg-green-500" : "bg-slate-400"
            )}
          />
        </div>

        {/* Company Name + Location - Vertically Split */}
        <div className="flex flex-col justify-between min-w-0 flex-1 h-11 md:h-[54px] py-0.5">
          <button onClick={(e) => { e.stopPropagation(); handleViewDetails(); }} className="text-left py-0.5">
            <h3 className="text-xs md:text-sm font-semibold text-slate-900 hover:text-primary leading-tight transition-colors capitalize">
              {company.name}
            </h3>
          </button>
          <div className="flex items-center gap-1 text-[10px] md:text-xs text-slate-500 leading-none pb-0.5">
            <Icon icon="mdi:map-marker" className="h-2.5 w-2.5 md:h-3 md:w-3 flex-shrink-0" />
            <span className="truncate capitalize">{company.location?.city || t('catalog.card.default_city', 'Tbilisi')}</span>
          </div>
        </div>
      </div>

      {/* Column 2: Price + Transportation (Fit Content) */}
      <div className="border-l border-slate-100 pl-2 md:pl-4 h-full flex items-center">
        <div className="flex flex-col justify-between h-11 md:h-[54px] py-0.5 w-full">
          {/* Price - Top Aligned */}
          <div className="text-lg md:text-xl font-bold text-slate-900 tracking-tight tabular-nums leading-none whitespace-nowrap">
            {hasAuctionBranch && calculatedShippingPrice !== undefined ? (
              typeof calculatedShippingPrice === 'number' ? (
                calculatedShippingPrice >= 0 ? formatCurrency(calculatedShippingPrice) : <span className="text-sm md:text-base text-slate-400 font-normal">—</span>
              ) : (
                calculatedShippingPrice
              )
            ) : (
              <span className="text-sm md:text-base text-slate-400 font-normal">—</span>
            )}
          </div>
          {/* Logistics - Bottom Aligned */}
          <div className="flex items-center gap-1 md:gap-1.5 text-[10px] md:text-xs font-medium text-slate-500 leading-tight pb-0.5 whitespace-nowrap">
            <Icon icon="mdi:truck-fast" className="h-3 w-3 md:h-4 md:w-4 text-slate-400 flex-shrink-0" />
            <span>
              <span className="text-slate-900">45-60</span> {t('common.days')}
            </span>
          </div>
        </div>
      </div>

      {/* Column 3: Rating (Fit Content) - Always Visible */}
      <div className="flex items-center justify-center border-l border-slate-100 pl-2 md:pl-4 h-full">
        <div className="flex items-center gap-1 md:gap-1.5 whitespace-nowrap">
          <Icon icon="mdi:star" className="h-3 w-3 md:h-4 md:w-4 text-amber-400 fill-current" />
          <span className="font-semibold text-xs md:text-sm text-slate-700">{company.rating}</span>
          <span className="hidden md:inline text-xs text-slate-400">({company.reviewCount})</span>
        </div>
      </div>
    </div>
  );
});

CompanyListItem.displayName = 'CompanyListItem';
