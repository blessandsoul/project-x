import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { motion, AnimatePresence } from 'framer-motion';
import type { CatalogMake, CatalogModel } from '@/api/catalog';

export interface FilterState {
  searchQuery: string;
  searchKind: 'all' | 'car' | 'moto' | 'van';
  auctionFilter: 'all' | 'Copart' | 'IAAI';
  fuelType: string;
  category: string;
  drive: string;
  yearRange: number[];
  priceRange: number[];
  maxMileage: number[];
  exactYear: number | '';
  minMileage: number | '';
  selectedMakeId: string;
  selectedModelId: string;
  buyNowOnly: boolean;
  limit: number;
}

interface AuctionFiltersProps {
  filters: FilterState;
  setFilters: (updates: Partial<FilterState>) => void;
  catalogMakes: CatalogMake[];
  catalogModels: CatalogModel[];
  isLoadingMakes: boolean;
  isLoadingModels: boolean;
  onApply: () => void;
  onReset: () => void;
  activeFilterLabels: Array<{ id: string; label: string }>;
  onRemoveFilter: (id: string) => void;
}

export function AuctionFilters({
  filters,
  setFilters,
  catalogMakes,
  catalogModels,
  isLoadingMakes,
  isLoadingModels,
  onApply,
  onReset,
  activeFilterLabels,
  onRemoveFilter,
}: AuctionFiltersProps) {
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ [key]: value });
  };

  return (
    <section className="space-y-4" aria-label={t('auction.filters.title')}>
      {/* Primary Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="relative flex-1 group">
          <Icon
            icon="mdi:magnify"
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors"
          />
          <Input
            placeholder={t('auction.search_placeholder')}
            value={filters.searchQuery}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') onApply();
            }}
            className="pl-10 h-11 text-base shadow-sm border-muted-foreground/20 focus-visible:ring-primary/30 rounded-lg bg-background"
          />
        </div>
        
        {/* Basic Filters - Always Visible on Mobile */}
        <div className="space-y-3">
          {/* Vehicle Type */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: 'all', label: t('common.all'), icon: 'mdi:apps', categoryValue: 'all' as const },
              { value: 'car', label: t('common.cars'), icon: 'mdi:car', categoryValue: 'v' as const },
              { value: 'moto', label: 'Moto', icon: 'mdi:motorbike', categoryValue: 'c' as const },
              { value: 'van', label: 'Quads', icon: 'mdi:van-utility', categoryValue: 'a' as const },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => {
                  updateFilter('searchKind', type.value as any);
                  if (type.categoryValue === 'all') updateFilter('category', 'all');
                  else updateFilter('category', type.categoryValue);
                }}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md border text-[11px] font-medium transition-all ${
                  filters.searchKind === type.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                }`}
              >
                <Icon icon={type.icon} className="w-5 h-5" />
                <span className="truncate w-full text-center">{type.label}</span>
              </button>
            ))}
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('common.make')}</label>
              <Select
                value={filters.selectedMakeId}
                onValueChange={(val) => {
                  updateFilter('selectedMakeId', val);
                  updateFilter('selectedModelId', 'all');
                }}
                disabled={isLoadingMakes}
              >
                <SelectTrigger className="h-10 w-full text-sm"><SelectValue placeholder={t('common.select_make')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {(catalogMakes ?? []).map(make => (
                    <SelectItem key={make.makeId} value={String(make.makeId)}>{make.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('common.model')}</label>
              <Select
                value={filters.selectedModelId}
                onValueChange={(val) => updateFilter('selectedModelId', val)}
                disabled={filters.selectedMakeId === 'all' || isLoadingModels}
              >
                <SelectTrigger className="h-10 w-full text-sm"><SelectValue placeholder={t('common.select_model')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  {(catalogModels ?? []).map(model => (
                    <SelectItem key={model.modelId} value={String(model.modelId)}>{model.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('common.price')}</span>
              <button
                onClick={() => updateFilter('priceRange', [0, 0])}
                className="text-muted-foreground hover:text-primary transition-colors"
                title={t('common.reset')}
              >
                <Icon icon="mdi:refresh" className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  className="h-10 pl-5 text-sm" 
                  placeholder={t('common.from')}
                  value={filters.priceRange[0] || ''}
                  onChange={(e) => updateFilter('priceRange', [Number(e.target.value), filters.priceRange[1]])}
                />
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                <Input 
                  type="number" 
                  className="h-10 pl-5 text-sm" 
                  placeholder={t('common.to')}
                  value={filters.priceRange[1] || ''}
                  onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
                />
              </div>
            </div>
          </div>

          {/* Year Range */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('common.year')}</span>
              <button
                onClick={() => {
                  updateFilter('yearRange', [0, 0]);
                  updateFilter('exactYear', '');
                }}
                className="text-muted-foreground hover:text-primary transition-colors"
                title={t('common.reset')}
              >
                <Icon icon="mdi:refresh" className="w-3 h-3" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select 
                value={filters.yearRange[0] > 0 ? String(filters.yearRange[0]) : ''} 
                onValueChange={(v) => updateFilter('yearRange', [Number(v), filters.yearRange[1]])}
              >
                <SelectTrigger className="h-10 w-full text-sm">
                  <SelectValue placeholder={t('common.from')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select 
                value={filters.yearRange[1] > 0 ? String(filters.yearRange[1]) : ''} 
                onValueChange={(v) => updateFilter('yearRange', [filters.yearRange[0], Number(v)])}
              >
                <SelectTrigger className="h-10 w-full text-sm">
                  <SelectValue placeholder={t('common.to')} />
                </SelectTrigger>
                <SelectContent className="max-h-[200px]">
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Technical Data */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('common.fuel')}</label>
              <Select value={filters.fuelType} onValueChange={(val) => updateFilter('fuelType', val)}>
                <SelectTrigger className="h-10 w-full text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="petrol">{t('common.fuel_gas')}</SelectItem>
                  <SelectItem value="hybrid">{t('common.fuel_hybrid')}</SelectItem>
                  <SelectItem value="electric">{t('common.fuel_electric')}</SelectItem>
                  <SelectItem value="diesel">{t('common.fuel_diesel')}</SelectItem>
                  <SelectItem value="flexible">{t('common.fuel_flexible')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">{t('common.drive')}</label>
              <Select value={filters.drive} onValueChange={(val) => updateFilter('drive', val)}>
                <SelectTrigger className="h-10 w-full text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('common.all')}</SelectItem>
                  <SelectItem value="front">Front</SelectItem>
                  <SelectItem value="rear">Rear</SelectItem>
                  <SelectItem value="full">AWD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center justify-between p-2.5 rounded-md border bg-muted/20 h-10">
              <label htmlFor="buy-now" className="text-[11px] font-bold uppercase cursor-pointer">{t('auction.filters.buy_now_only')}</label>
              <Checkbox 
                id="buy-now" 
                checked={filters.buyNowOnly} 
                onCheckedChange={(checked) => updateFilter('buyNowOnly', !!checked)} 
                className="h-4 w-4"
              />
            </div>
            <div className="flex items-center gap-1 p-1 rounded-md border bg-muted/20 h-10 overflow-hidden">
              {(['all', 'Copart', 'IAAI'] as const).map((source) => (
                <button
                  key={source}
                  onClick={() => updateFilter('auctionFilter', source)}
                  className={`flex-1 h-full rounded-sm text-[10px] font-bold uppercase transition-colors ${
                    filters.auctionFilter === source
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-background/50 text-muted-foreground'
                  }`}
                >
                  {source === 'all' ? 'All' : source}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={onReset}
              className="flex-1 h-11 border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-400"
            >
              <Icon icon="mdi:filter-remove" className="w-4 h-4 mr-2" />
              {t('common.reset')}
            </Button>
            <Button onClick={onApply} className="flex-1 h-11 px-6">
              {t('common.search')}
            </Button>
          </div>
        </div>
      </div>


      {/* Active Filters (Chips) */}
      <AnimatePresence>
        {activeFilterLabels.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
             {activeFilterLabels.map(tag => (
                <Badge 
                   key={tag.id} 
                   variant="secondary" 
                   className="px-2 py-1 h-7 gap-1 text-xs font-normal bg-secondary/50 hover:bg-secondary border-transparent transition-colors"
                >
                   {tag.label}
                   <button 
                      onClick={() => onRemoveFilter(tag.id)}
                      className="ml-1 hover:text-destructive focus:outline-none"
                      aria-label="Remove filter"
                   >
                      <Icon icon="mdi:close" className="w-3 h-3" />
                   </button>
                </Badge>
             ))}
             <Button 
                variant="link" 
                size="sm" 
                onClick={onReset} 
                className="h-7 text-xs text-muted-foreground hover:text-foreground px-0 ml-1"
             >
                {t('common.clear_all')}
             </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
