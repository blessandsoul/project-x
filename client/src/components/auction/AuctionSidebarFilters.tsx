import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { CatalogMake, CatalogModel } from '@/api/catalog';
import type { FilterState } from './AuctionFilters';

interface AuctionSidebarFiltersProps {
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  catalogMakes: CatalogMake[];
  catalogModels: CatalogModel[];
  isLoadingMakes: boolean;
  isLoadingModels: boolean;
  onApply: () => void;
  onReset: () => void;
}

export function AuctionSidebarFilters({
  filters,
  setFilters,
  catalogMakes,
  catalogModels,
  isLoadingMakes,
  isLoadingModels,
  onApply,
  onReset,
}: AuctionSidebarFiltersProps) {
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ [key]: value });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 space-y-3">
      <div className="flex items-center gap-2 pb-2 border-b">
        <Icon icon="mdi:tune" className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">
          {t('auction.filters.title')}
        </h3>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Icon
          icon="mdi:magnify"
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
        />
        <Input
          placeholder={t('auction.search_placeholder')}
          value={filters.searchQuery}
          onChange={(e) => updateFilter('searchQuery', e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onApply();
          }}
          className="pl-8 h-9 text-sm bg-white"
        />
      </div>

      {/* Vehicle Type */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {t('auction.transport_type')}
        </label>
        <div className="grid grid-cols-4 gap-1">
          {[
            { value: 'all', label: 'ყველა', icon: 'mdi:apps', categoryValue: 'all' as const },
            { value: 'car', label: 'მანქანა', icon: 'mdi:car', categoryValue: 'v' as const },
            { value: 'moto', label: 'მოტო', icon: 'mdi:motorbike', categoryValue: 'c' as const },
            { value: 'van', label: 'კვადრო', icon: 'mdi:van-utility', categoryValue: 'a' as const },
          ].map((type) => (
            <button
              key={type.value}
              onClick={() => {
                updateFilter('searchKind', type.value as any);
                if (type.categoryValue === 'all') updateFilter('category', 'all');
                else updateFilter('category', type.categoryValue);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 p-1.5 rounded-md border text-[9px] font-medium transition-all ${
                filters.searchKind === type.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <Icon icon={type.icon} className="w-3.5 h-3.5" />
              <span className="truncate w-full text-center">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Make & Model */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {t('auction.brand_and_model')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.selectedMakeId}
            onValueChange={(val) => {
              updateFilter('selectedMakeId', val);
              updateFilter('selectedModelId', 'all');
            }}
            disabled={isLoadingMakes}
          >
            <SelectTrigger className="h-8 w-full text-xs bg-white">
              <SelectValue placeholder={t('auction.filters.make')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {(catalogMakes ?? []).map((make) => (
                <SelectItem key={make.makeId} value={String(make.makeId)}>
                  {make.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.selectedModelId}
            onValueChange={(val) => updateFilter('selectedModelId', val)}
            disabled={filters.selectedMakeId === 'all' || isLoadingModels}
          >
            <SelectTrigger className="h-8 w-full text-xs bg-white">
              <SelectValue placeholder={t('auction.filters.model')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              {(catalogModels ?? []).map((model) => (
                <SelectItem key={model.modelId} value={String(model.modelId)}>
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Year Range */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('auction.filters.year')}
          </label>
          <button
            onClick={() => {
              updateFilter('yearRange', [0, 0]);
              updateFilter('exactYear', '');
            }}
            className="text-slate-400 hover:text-primary transition-colors"
            title={t('common.reset')}
          >
            <Icon icon="mdi:refresh" className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={filters.yearRange[0] > 0 ? String(filters.yearRange[0]) : ''}
            onValueChange={(v) => updateFilter('yearRange', [Number(v), filters.yearRange[1]])}
          >
            <SelectTrigger className="h-8 w-full text-xs bg-white">
              <SelectValue placeholder={t('common.from')} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.yearRange[1] > 0 ? String(filters.yearRange[1]) : ''}
            onValueChange={(v) => updateFilter('yearRange', [filters.yearRange[0], Number(v)])}
          >
            <SelectTrigger className="h-8 w-full text-xs bg-white">
              <SelectValue placeholder={t('common.to')} />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-medium text-slate-500">{t('auction.exact_year')}</span>
          <Input
            type="number"
            className="h-8 w-full text-xs px-2 bg-white"
            placeholder="2020"
            value={filters.exactYear}
            onChange={(e) => updateFilter('exactYear', e.target.value ? Number(e.target.value) : '')}
          />
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('auction.filters.price')}
          </label>
          <button
            onClick={() => updateFilter('priceRange', [0, 0])}
            className="text-slate-400 hover:text-primary transition-colors"
            title={t('common.reset')}
          >
            <Icon icon="mdi:refresh" className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
            <Input
              type="number"
              className="h-8 w-full pl-5 text-xs bg-white"
              placeholder={t('common.from')}
              value={filters.priceRange[0] || ''}
              onChange={(e) => updateFilter('priceRange', [Number(e.target.value), filters.priceRange[1]])}
            />
          </div>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
            <Input
              type="number"
              className="h-8 w-full pl-5 text-xs bg-white"
              placeholder={t('common.to')}
              value={filters.priceRange[1] || ''}
              onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
            />
          </div>
        </div>
      </div>

      {/* Mileage Range */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            {t('auction.filters.mileage')}
          </label>
          <button
            onClick={() => updateFilter('mileageRange', [0, 0])}
            className="text-slate-400 hover:text-primary transition-colors"
            title={t('common.reset')}
          >
            <Icon icon="mdi:refresh" className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            className="h-8 w-full text-xs bg-white"
            placeholder={t('common.from')}
            value={filters.mileageRange[0] || ''}
            onChange={(e) => updateFilter('mileageRange', [Number(e.target.value), filters.mileageRange[1]])}
          />
          <Input
            type="number"
            className="h-8 w-full text-xs bg-white"
            placeholder={t('common.to')}
            value={filters.mileageRange[1] || ''}
            onChange={(e) => updateFilter('mileageRange', [filters.mileageRange[0], Number(e.target.value)])}
          />
        </div>
      </div>

      {/* Fuel & Drive */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {t('auction.technical_data')}
        </label>
        <div className="grid grid-cols-2 gap-2">
          <Select value={filters.fuelType} onValueChange={(val) => updateFilter('fuelType', val)}>
            <SelectTrigger className="h-8 w-full text-xs bg-white">
              <SelectValue placeholder={t('auction.filters.fuel')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="petrol">{t('common.fuel_gas')}</SelectItem>
              <SelectItem value="hybrid">{t('common.fuel_hybrid')}</SelectItem>
              <SelectItem value="electric">{t('common.fuel_electric')}</SelectItem>
              <SelectItem value="diesel">{t('common.fuel_diesel')}</SelectItem>
              <SelectItem value="flexible">{t('common.fuel_flexible')}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filters.drive} onValueChange={(val) => updateFilter('drive', val)}>
            <SelectTrigger className="h-8 w-full text-xs bg-white">
              <SelectValue placeholder={t('common.drive')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common.all')}</SelectItem>
              <SelectItem value="front">წინა</SelectItem>
              <SelectItem value="rear">უკანა</SelectItem>
              <SelectItem value="full">4x4</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Auction Source */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          {t('auction.filters.auction')}
        </label>
        <div className="flex items-center gap-1 p-1 rounded-lg border bg-slate-50">
          {(['all', 'Copart', 'IAAI'] as const).map((source) => (
            <button
              key={source}
              onClick={() => updateFilter('auctionFilter', source)}
              className={`flex-1 h-8 rounded-md text-xs font-medium transition-colors ${
                filters.auctionFilter === source
                  ? 'bg-white text-primary shadow-sm border'
                  : 'hover:bg-white/50 text-slate-500'
              }`}
            >
              {source === 'all' ? t('common.all') : source}
            </button>
          ))}
        </div>
      </div>

      {/* Buy Now Toggle */}
      <div className="flex items-center justify-between p-2 rounded-lg border bg-slate-50">
        <label htmlFor="sidebar-buy-now" className="text-xs font-medium cursor-pointer">
          {t('auction.filters.buy_now_only')}
        </label>
        <Checkbox
          id="sidebar-buy-now"
          checked={filters.buyNowOnly}
          onCheckedChange={(checked) => updateFilter('buyNowOnly', !!checked)}
          className="h-4 w-4"
        />
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-2 border-t">
        <Button 
          variant="outline" 
          onClick={onReset} 
          className="w-full h-9 text-sm border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400"
        >
          <Icon icon="mdi:filter-remove" className="w-4 h-4 mr-2" />
          {t('common.clear_filters')}
        </Button>
        <Button onClick={onApply} className="w-full h-9">
          {t('common.show_results')}
        </Button>
      </div>
    </div>
  );
}
