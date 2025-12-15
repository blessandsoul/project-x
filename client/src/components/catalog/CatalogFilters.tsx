import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import {
  FiltersSidebarLayout,
  FilterSection,
  FilterInput,
  FilterRangeInputs,
  FilterSelect,
} from '@/components/filters/FiltersSidebarLayout';

interface CatalogFiltersProps {
  className?: string;
  initialSearch?: string;
  onSearchSubmit?: (value: string) => void;
  onSearchChange?: (value: string) => void;
  initialCountry?: string;
  onCountryChange?: (value: string) => void;
  initialCity?: string;
  onCityChange?: (value: string) => void;
  initialMinRating?: number;
  onMinRatingChange?: (value: number) => void;
  initialPriceRange?: [number, number];
  onPriceRangeChange?: (value: [number, number]) => void;
  initialIsVip?: boolean;
  onVipChange?: (value: boolean) => void;
  onApplyFilters?: () => void;
  onResetFilters?: () => void;
}

export const CatalogFilters = ({
  className,
  initialSearch,
  onSearchSubmit,
  onSearchChange,
  initialCountry,
  onCountryChange,
  initialCity,
  onCityChange,
  initialMinRating,
  onMinRatingChange,
  initialPriceRange,
  onPriceRangeChange,
  initialIsVip,
  onVipChange,
  onApplyFilters,
  onResetFilters,
}: CatalogFiltersProps) => {
  const { t } = useTranslation();

  // Keep refs for backward compatibility (though we now use controlled inputs)
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const countryInputRef = useRef<HTMLInputElement | null>(null);
  const cityInputRef = useRef<HTMLInputElement | null>(null);
  
  // Suppress unused variable warnings - refs kept for potential future use
  void searchInputRef;
  void countryInputRef;
  void cityInputRef;

  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange ?? [0, 5000]);

  useEffect(() => {
    if (initialPriceRange) {
      setPriceRange(initialPriceRange);
    }
  }, [initialPriceRange]);

  // Local state for search input (to sync with ref)
  const [localSearch, setLocalSearch] = useState(initialSearch ?? '');
  const [localCountry, setLocalCountry] = useState(initialCountry ?? '');
  const [localCity, setLocalCity] = useState(initialCity ?? '');

  // Sync local state when initial values change
  useEffect(() => {
    setLocalSearch(initialSearch ?? '');
  }, [initialSearch]);

  useEffect(() => {
    setLocalCountry(initialCountry ?? '');
  }, [initialCountry]);

  useEffect(() => {
    setLocalCity(initialCity ?? '');
  }, [initialCity]);

  // Desktop sidebar content using shared layout
  const desktopFilterContent = (
    <FiltersSidebarLayout
      title={t('catalog.filters.title', 'Filters')}
      applyButtonText={t('catalog.filters.apply', 'Apply')}
      resetButtonText={t('catalog.filters.reset')}
      onApply={onApplyFilters}
      onReset={() => {
        setLocalSearch('');
        setLocalCountry('');
        setLocalCity('');
        setPriceRange([0, 0]);
        onPriceRangeChange?.([0, 0]);
        onResetFilters?.();
      }}
    >
      {/* Search */}
      <FilterSection title={t('common.search')}>
        <FilterInput
          value={localSearch}
          onChange={(value) => {
            setLocalSearch(value);
            onSearchChange?.(value);
          }}
          placeholder={t('catalog.filters.search_placeholder', 'Company name...')}
          icon="mdi:magnify"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearchSubmit?.(localSearch);
            }
          }}
        />
      </FilterSection>

      {/* Country */}
      <FilterSection title={t('catalog.filters.country', 'Country')}>
        <FilterInput
          value={localCountry}
          onChange={(value) => {
            setLocalCountry(value);
            onCountryChange?.(value);
          }}
          placeholder={t('catalog.filters.country_placeholder', 'Georgia, USA...')}
          icon="mdi:earth"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onApplyFilters?.();
            }
          }}
        />
      </FilterSection>

      {/* City */}
      <FilterSection title={t('catalog.filters.city', 'City')}>
        <FilterInput
          value={localCity}
          onChange={(value) => {
            setLocalCity(value);
            onCityChange?.(value);
          }}
          placeholder={t('catalog.filters.city_placeholder', 'City')}
          icon="mdi:map-marker"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onApplyFilters?.();
            }
          }}
        />
      </FilterSection>

      {/* Rating */}
      <FilterSection title={t('catalog.filters.rating')}>
        <FilterSelect
          value={initialMinRating && initialMinRating > 0 ? String(initialMinRating) : '0'}
          onValueChange={(value) => {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
              onMinRatingChange?.(parsed);
            }
          }}
          options={[
            { value: '0', label: t('catalog.filters.rating_all') },
            { value: '3', label: `3+ ${t('common.stars')}` },
            { value: '4', label: `4+ ${t('common.stars')}` },
            { value: '5', label: `5 ${t('common.stars')}` },
          ]}
        />
      </FilterSection>

      {/* Price Range */}
      <FilterSection title={t('catalog.filters.price')}>
        <FilterRangeInputs
          fromValue={priceRange[0] > 0 ? String(priceRange[0]) : ''}
          toValue={priceRange[1] > 0 ? String(priceRange[1]) : ''}
          onFromChange={(value) => {
            const val = Number(value) || 0;
            const newRange: [number, number] = [val, priceRange[1]];
            setPriceRange(newRange);
            onPriceRangeChange?.(newRange);
          }}
          onToChange={(value) => {
            const val = Number(value) || 0;
            const newRange: [number, number] = [priceRange[0], val];
            setPriceRange(newRange);
            onPriceRangeChange?.(newRange);
          }}
          showCurrencyPrefix
          inputMode="numeric"
        />
      </FilterSection>

      {/* VIP Toggle */}
      <FilterSection title={t('catalog.filters.vip_only')} defaultOpen={false}>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
          <Checkbox
            checked={!!initialIsVip}
            onCheckedChange={(checked) => onVipChange?.(!!checked)}
            className="h-3.5 w-3.5 rounded-sm"
          />
          <span className="text-[11px] text-slate-700 flex items-center gap-1">
            {t('catalog.filters.vip_only')}
            <Icon icon="mdi:crown" className="h-3 w-3 text-amber-500" />
          </span>
        </label>
        <p className="text-[9px] text-slate-500 mt-1 px-1">{t('catalog.filters.vip_desc')}</p>
      </FilterSection>
    </FiltersSidebarLayout>
  );

  // Mobile sheet content - uses same FilterSection components for consistent styling
  const mobileFilterContent = (
    <div className="bg-white">
      {/* Search */}
      <FilterSection title={t('common.search')}>
        <FilterInput
          value={localSearch}
          onChange={(value) => {
            setLocalSearch(value);
            onSearchChange?.(value);
          }}
          placeholder={t('catalog.filters.search_placeholder', 'Company name...')}
          icon="mdi:magnify"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearchSubmit?.(localSearch);
            }
          }}
        />
      </FilterSection>

      {/* Country */}
      <FilterSection title={t('catalog.filters.country', 'Country')}>
        <FilterInput
          value={localCountry}
          onChange={(value) => {
            setLocalCountry(value);
            onCountryChange?.(value);
          }}
          placeholder={t('catalog.filters.country_placeholder', 'Georgia, USA...')}
          icon="mdi:earth"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onApplyFilters?.();
            }
          }}
        />
      </FilterSection>

      {/* City */}
      <FilterSection title={t('catalog.filters.city_placeholder')}>
        <FilterInput
          value={localCity}
          onChange={(value) => {
            setLocalCity(value);
            onCityChange?.(value);
          }}
          placeholder="თბილისი, ბათუმი..."
          icon="mdi:map-marker"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onApplyFilters?.();
            }
          }}
        />
      </FilterSection>

      {/* Rating */}
      <FilterSection title={t('catalog.filters.rating')}>
        <FilterSelect
          value={initialMinRating && initialMinRating > 0 ? String(initialMinRating) : '0'}
          onValueChange={(value) => {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
              onMinRatingChange?.(parsed);
            }
          }}
          options={[
            { value: '0', label: t('catalog.filters.rating_all') },
            { value: '3', label: `3+ ${t('common.stars')}` },
            { value: '4', label: `4+ ${t('common.stars')}` },
            { value: '5', label: `5 ${t('common.stars')}` },
          ]}
        />
      </FilterSection>

      {/* Price Range */}
      <FilterSection title={t('catalog.filters.price')}>
        <FilterRangeInputs
          fromValue={priceRange[0] > 0 ? String(priceRange[0]) : ''}
          toValue={priceRange[1] > 0 ? String(priceRange[1]) : ''}
          onFromChange={(value) => {
            const val = Number(value) || 0;
            const newRange: [number, number] = [val, priceRange[1]];
            setPriceRange(newRange);
            onPriceRangeChange?.(newRange);
          }}
          onToChange={(value) => {
            const val = Number(value) || 0;
            const newRange: [number, number] = [priceRange[0], val];
            setPriceRange(newRange);
            onPriceRangeChange?.(newRange);
          }}
          showCurrencyPrefix
          inputMode="numeric"
        />
      </FilterSection>

      {/* VIP Toggle */}
      <FilterSection title={t('catalog.filters.vip_only')} defaultOpen={false}>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
          <Checkbox
            checked={!!initialIsVip}
            onCheckedChange={(checked) => onVipChange?.(!!checked)}
            className="h-3.5 w-3.5 rounded-sm"
          />
          <span className="text-[11px] text-slate-700 flex items-center gap-1">
            {t('catalog.filters.vip_only')}
            <Icon icon="mdi:crown" className="h-3 w-3 text-amber-500" />
          </span>
        </label>
        <p className="text-[9px] text-slate-500 mt-1 px-1">{t('catalog.filters.vip_desc')}</p>
      </FilterSection>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - Using shared FiltersSidebarLayout */}
      <div className={cn("hidden lg:block h-fit sticky top-24", className)}>
        {desktopFilterContent}
      </div>

      {/* Mobile Bottom Sheet */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="lg:hidden w-full h-12 border-slate-200 shadow-sm bg-white justify-between px-4 hover:bg-slate-50">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:filter-variant" className="h-5 w-5 text-slate-700" />
              <span className="font-semibold text-slate-900">{t('catalog.filters.title', 'Filters')}</span>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[400px] p-0 flex flex-col h-full bg-white">
          <SheetHeader className="px-2 py-2 bg-[#0047AB] text-white">
            <SheetTitle className="text-left flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-white">
              <Icon icon="mdi:filter-variant" className="w-3.5 h-3.5" /> {t('catalog.filters.title', 'Filters')}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto bg-white border-x border-slate-300">
            {mobileFilterContent}
          </div>
          
          <SheetFooter className="p-2 bg-slate-50 border-t border-slate-200">
            <div className="flex flex-col gap-1.5 w-full">
              <SheetClose asChild>
                <Button
                  className="w-full h-7 text-[10px] bg-[#f5a623] hover:bg-[#e5a800] text-[#1a2744] font-bold"
                  onClick={onApplyFilters}
                >
                  {t('catalog.filters.show_results', 'Show Results')}
                </Button>
              </SheetClose>
              <Button
                variant="outline"
                className="w-full h-7 text-[10px] border-slate-300 text-slate-600 hover:bg-slate-100"
                onClick={() => {
                  setLocalSearch('');
                  setLocalCountry('');
                  setLocalCity('');
                  setPriceRange([0, 0]);
                  onPriceRangeChange?.([0, 0]);
                  onResetFilters?.();
                }}
              >
                {t('catalog.filters.reset')}
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
