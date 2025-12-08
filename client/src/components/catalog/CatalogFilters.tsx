import { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

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

  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const countryInputRef = useRef<HTMLInputElement | null>(null);
  const cityInputRef = useRef<HTMLInputElement | null>(null);

  const [priceRange, setPriceRange] = useState<[number, number]>(initialPriceRange ?? [0, 5000]);

  useEffect(() => {
    if (initialPriceRange) {
      setPriceRange(initialPriceRange);
    }
  }, [initialPriceRange]);

  const filterContent = (
    <div className="space-y-3 sm:space-y-6">
      {/* Search */}
      <div className="space-y-1 sm:space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('common.search')}</label>
        <div className="relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t('catalog.filters.search_placeholder', 'Company name...')}
            className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 sm:h-10 focus:bg-white"
            ref={searchInputRef}
            defaultValue={initialSearch}
            onChange={(e) => {
              onSearchChange?.(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const value = searchInputRef.current?.value ?? '';
                onSearchSubmit?.(value);
              }
            }}
          />
        </div>
      </div>

      <Separator className="my-1 sm:my-2 bg-slate-200/60" />

      {/* Country */}
      <div className="space-y-1 sm:space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('catalog.filters.country', 'Country')}</label>
        <div className="relative">
          <Icon icon="mdi:earth" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder={t('catalog.filters.country_placeholder', 'Georgia, USA...')}
            className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 sm:h-10 focus:bg-white"
            ref={countryInputRef}
            defaultValue={initialCountry}
            onChange={(e) => {
              onCountryChange?.(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onApplyFilters?.();
              }
            }}
          />
        </div>
      </div>

      <Separator className="my-1 sm:my-2 bg-white/10" />

      {/* City Search */}
      <div className="space-y-1 sm:space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('catalog.filters.city_placeholder')}</label>
        <div className="relative">
          <Icon icon="mdi:map-marker" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="თბილისი, ბათუმი..." 
            className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 h-9 sm:h-10 focus:bg-white"
            ref={cityInputRef}
            defaultValue={initialCity}
            onChange={(e) => {
              onCityChange?.(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onApplyFilters?.();
              }
            }}
          />
        </div>
      </div>

      <Separator className="my-1 sm:my-2 bg-white/10" />

      {/* Rating */}
      <div className="space-y-1 sm:space-y-2">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('catalog.filters.rating')}</label>
        <Select
          value={initialMinRating && initialMinRating > 0 ? String(initialMinRating) : '0'}
          onValueChange={(value) => {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
              onMinRatingChange?.(parsed);
            }
          }}
        >
          <SelectTrigger className="bg-white border-slate-200 text-slate-900 h-9 sm:h-10 hover:bg-slate-50">
            <SelectValue placeholder={t('catalog.filters.rating_all')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{t('catalog.filters.rating_all')}</SelectItem>
            <SelectItem value="3">3+ {t('common.stars')}</SelectItem>
            <SelectItem value="4">4+ {t('common.stars')}</SelectItem>
            <SelectItem value="5">5 {t('common.stars')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price Range */}
      <div className="space-y-1.5 sm:space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
             <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{t('catalog.filters.price')}</label>
             <button
                onClick={() => {
                  const emptyRange: [number, number] = [0, 0];
                  setPriceRange(emptyRange);
                  onPriceRangeChange?.(emptyRange);
                }}
                className="text-slate-400 hover:text-primary transition-colors"
                title={t('common.reset')}
             >
                <Icon icon="mdi:refresh" className="w-3 h-3" />
             </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
           <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
              <Input 
                type="number" 
                className="h-9 pl-5 text-xs bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white" 
                placeholder={t('common.from')}
                value={priceRange[0] || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newRange: [number, number] = [val, priceRange[1]];
                  setPriceRange(newRange);
                  onPriceRangeChange?.(newRange);
                }}
              />
           </div>
           <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-white/40">$</span>
              <Input 
                type="number" 
                className="h-9 pl-5 text-xs bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:bg-white/15" 
                placeholder={t('common.to')}
                value={priceRange[1] || ''}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const newRange: [number, number] = [priceRange[0], val];
                  setPriceRange(newRange);
                  onPriceRangeChange?.(newRange);
                }}
              />
           </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-2 sm:space-y-3 pt-1 sm:pt-2">
        <div className="flex items-center space-x-3 rounded-lg border border-slate-200 p-2.5 sm:p-3 bg-white hover:bg-slate-50 transition-colors">
          <Checkbox
            id="vip"
            checked={!!initialIsVip}
            onCheckedChange={(checked) => onVipChange?.(!!checked)}
            className="border-slate-300 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <div className="grid gap-1 leading-none">
            <label
              htmlFor="vip"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 text-slate-900"
            >
              {t('catalog.filters.vip_only')}
              <Icon icon="mdi:crown" className="h-3.5 w-3.5 text-amber-500" />
            </label>
            <p className="text-[10px] text-slate-500">{t('catalog.filters.vip_desc')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 lg:flex hidden">
        <Button 
          variant="outline" 
          className="flex-1 border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
          onClick={() => {
            if (searchInputRef.current) searchInputRef.current.value = '';
            if (countryInputRef.current) countryInputRef.current.value = '';
            if (cityInputRef.current) cityInputRef.current.value = '';
            setPriceRange([0, 0]);
            onPriceRangeChange?.([0, 0]);
            onResetFilters?.();
          }}
        >
          <Icon icon="mdi:refresh" className="mr-2 h-4 w-4" />
          {t('catalog.filters.reset')}
        </Button>
        <Button 
          className="flex-1 bg-primary hover:bg-primary/90"
          onClick={() => {
            onApplyFilters?.();
          }}
        >
          <Icon icon="mdi:check" className="mr-2 h-4 w-4" />
          {t('catalog.filters.apply', 'Apply')}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={cn("hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-fit sticky top-24", className)}>
        <div className="flex items-center gap-2 mb-6">
          <div className="p-2 bg-slate-100 rounded-lg">
            <Icon icon="mdi:filter-variant" className="h-5 w-5 text-slate-700" />
          </div>
          <h3 className="font-bold text-slate-900">{t('catalog.filters.title', 'Filters')}</h3>
        </div>
        {filterContent}
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
          <SheetHeader className="px-4 py-3 border-b border-slate-100">
            <SheetTitle className="text-left flex items-center gap-2 text-base">
              <Icon icon="mdi:filter-variant" /> {t('catalog.filters.title', 'Filters')}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 px-4 py-3 overflow-y-auto">
            {filterContent}
          </div>
          
          <SheetFooter className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <div className="flex flex-col gap-2 w-full">
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 h-10 text-sm font-semibold shadow-sm"
                  onClick={() => {
                    if (searchInputRef.current) searchInputRef.current.value = '';
                    if (countryInputRef.current) countryInputRef.current.value = '';
                    if (cityInputRef.current) cityInputRef.current.value = '';
                    setPriceRange([0, 0]);
                    onPriceRangeChange?.([0, 0]);
                    onResetFilters?.();
                  }}
                >
                  <Icon icon="mdi:refresh" className="mr-2 h-4 w-4" />
                  {t('catalog.filters.reset')}
                </Button>
                <SheetClose asChild>
                  <Button
                    className="flex-1 h-10 text-sm font-semibold shadow-md"
                    onClick={() => {
                      onApplyFilters?.();
                    }}
                  >
                    {t('catalog.filters.show_results', 'Show Results')}
                  </Button>
                </SheetClose>
              </div>
              <SheetClose asChild>
                <Button
                  variant="outline"
                  className="w-full h-10 text-sm font-medium text-slate-600"
                >
                  {t('common.close', 'Close')}
                </Button>
              </SheetClose>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
