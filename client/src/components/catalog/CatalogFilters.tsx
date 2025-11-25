import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
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

  const filterContent = (
    <div className="space-y-6">
      {/* Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('common.search')}</label>
        <div className="relative">
          <Icon icon="mdi:magnify" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder={t('catalog.filters.search_placeholder', 'Company name...')}
            className="pl-9 bg-white"
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

      <Separator />

      {/* Country */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('catalog.filters.country', 'Country')}</label>
        <div className="relative">
          <Icon icon="mdi:earth" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder={t('catalog.filters.country_placeholder', 'Georgia, USA...')}
            className="pl-9 bg-white"
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

      <Separator />

      {/* City Search */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('catalog.filters.city_placeholder')}</label>
        <div className="relative">
          <Icon icon="mdi:map-marker" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Tbilisi, Batumi..." 
            className="pl-9 bg-white"
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

      <Separator />

      {/* Rating */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('catalog.filters.rating')}</label>
        <Select
          defaultValue={initialMinRating && initialMinRating > 0 ? String(initialMinRating) : '0'}
          onValueChange={(value) => {
            const parsed = Number(value);
            if (!Number.isNaN(parsed)) {
              onMinRatingChange?.(parsed);
            }
          }}
        >
          <SelectTrigger className="bg-white">
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('catalog.filters.price')}</label>
          <span className="text-xs font-medium text-slate-700">
            ${initialPriceRange?.[0] ?? 0} - ${initialPriceRange?.[1] ?? 5000}
          </span>
        </div>
        <Slider
          defaultValue={initialPriceRange ?? [0, 5000]}
          max={5000}
          step={100}
          className="py-2"
          onValueChange={(value) => {
            onPriceRangeChange?.(value as [number, number]);
          }}
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center space-x-3 rounded-lg border border-slate-100 p-3 bg-white hover:bg-slate-50 transition-colors">
          <Checkbox
            id="vip"
            defaultChecked={!!initialIsVip}
            onCheckedChange={(checked) => onVipChange?.(!!checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="vip"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2"
            >
              {t('catalog.filters.vip_only')}
              <Icon icon="mdi:crown" className="h-3.5 w-3.5 text-amber-500" />
            </label>
            <p className="text-[10px] text-slate-500">{t('catalog.filters.vip_desc')}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => {
            if (searchInputRef.current) searchInputRef.current.value = '';
            if (countryInputRef.current) countryInputRef.current.value = '';
            if (cityInputRef.current) cityInputRef.current.value = '';
            onResetFilters?.();
          }}
        >
          <Icon icon="mdi:refresh" className="mr-2 h-4 w-4" />
          {t('catalog.filters.reset')}
        </Button>
        <Button 
          className="flex-1"
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
          <Button variant="outline" className="lg:hidden w-full h-12 border-slate-200 shadow-sm bg-white justify-between px-4">
            <div className="flex items-center gap-2">
              <Icon icon="mdi:filter-variant" className="h-5 w-5 text-slate-600" />
              <span className="font-semibold text-slate-700">{t('catalog.filters.title', 'Filters')}</span>
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-[400px] p-0 flex flex-col h-full">
          <SheetHeader className="px-6 py-4 border-b border-slate-100">
            <SheetTitle className="text-left flex items-center gap-2">
              <Icon icon="mdi:filter-variant" /> {t('catalog.filters.title', 'Filters')}
            </SheetTitle>
          </SheetHeader>
          
          <div className="flex-1 px-6 py-6 overflow-y-auto">
            {filterContent}
          </div>
          
          <SheetFooter className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
            <SheetClose asChild>
              <Button
                className="w-full h-12 text-base font-semibold shadow-md"
                onClick={() => {
                  onApplyFilters?.();
                }}
              >
                {t('catalog.filters.show_results', 'Show Results')}
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
