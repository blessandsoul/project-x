import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger,
} from '@/components/ui/sheet';
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
  onReset: () => void; // global reset (chips "Clear All")
  onDrawerReset: () => void; // local reset inside drawer only
  activeFilterLabels: Array<{ id: string; label: string }>;
  onRemoveFilter: (id: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
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
  onDrawerReset,
  activeFilterLabels,
  onRemoveFilter,
  isOpen,
  onOpenChange,
}: AuctionFiltersProps) {
  const { t } = useTranslation();

  const currentYear = new Date().getFullYear() + 1;
  const years = Array.from({ length: currentYear - 1990 + 1 }, (_, i) => currentYear - i);

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ [key]: value });
  };

  return (
    <section className="space-y-4" aria-label={t('auction.filters.title')}>
      {/* Primary Search Bar & Toggle */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
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
        
        <div className="flex items-center gap-2">
          <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetTrigger asChild>
              <Button
                variant="default"
                size="lg"
                className="h-10 px-4 gap-2 bg-orange-500 hover:bg-orange-600 text-white border border-orange-500 shadow-sm"
              >
                <Icon icon="mdi:tune" className="w-5 h-5" />
                <span>{t('common.filters')}</span>
                {activeFilterLabels.length > 0 && (
                   <Badge variant="secondary" className="ml-1 px-1.5 h-5 min-w-[20px] flex items-center justify-center bg-primary/10 text-primary">
                     {activeFilterLabels.length}
                   </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto flex flex-col p-0">
               <SheetHeader className="px-4 py-3 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                 <SheetTitle className="text-lg font-bold flex items-center gap-2">
                    <Icon icon="mdi:tune" className="w-5 h-5 text-primary" />
                    {t('pages.auction.more_filters')}
                 </SheetTitle>
               </SheetHeader>

               <div className="flex-1 px-3 py-3 space-y-2 overflow-y-auto">
                 {/* Vehicle Type */}
                 <div className="space-y-1.5">
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
                            className={`flex flex-col items-center justify-center gap-1 p-1.5 rounded-md border text-[10px] font-medium transition-all ${
                              filters.searchKind === type.value
                              ? 'border-primary bg-primary/5 text-primary'
                              : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                            }`}
                         >
                            <Icon icon={type.icon} className="w-4 h-4" />
                            <span className="truncate w-full text-center">{type.label}</span>
                         </button>
                       ))}
                    </div>
                 </div>

                 {/* Make & Model */}
                 <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-0.5">
                       <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{t('common.make')}</label>
                       <Select
                         value={filters.selectedMakeId}
                         onValueChange={(val) => {
                            updateFilter('selectedMakeId', val);
                            updateFilter('selectedModelId', 'all');
                         }}
                         disabled={isLoadingMakes}
                       >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t('common.select_make')} /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t('common.all')}</SelectItem>
                            {(catalogMakes ?? []).map(make => (
                               <SelectItem key={make.makeId} value={String(make.makeId)}>{make.name}</SelectItem>
                            ))}
                          </SelectContent>
                       </Select>
                    </div>
                    <div className="space-y-0.5">
                       <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{t('common.model')}</label>
                       <Select
                         value={filters.selectedModelId}
                         onValueChange={(val) => updateFilter('selectedModelId', val)}
                         disabled={filters.selectedMakeId === 'all' || isLoadingModels}
                       >
                          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={t('common.select_model')} /></SelectTrigger>
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
                 <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('common.price')}</span>
                        <button
                          onClick={() => updateFilter('priceRange', [0, 0])}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title={t('common.reset')}
                        >
                          <Icon icon="mdi:refresh" className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            className="h-9 pl-5 text-xs" 
                            placeholder={t('common.from')}
                            value={filters.priceRange[0] || ''}
                            onChange={(e) => updateFilter('priceRange', [Number(e.target.value), filters.priceRange[1]])}
                          />
                       </div>
                       <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
                          <Input 
                            type="number" 
                            className="h-9 pl-5 text-xs" 
                            placeholder={t('common.to')}
                            value={filters.priceRange[1] || ''}
                            onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value)])}
                          />
                       </div>
                    </div>
                 </div>

                 {/* Year Range */}
                 <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
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
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                       <Select 
                          value={String(filters.yearRange[0])} 
                          onValueChange={(v) => updateFilter('yearRange', [Number(v), filters.yearRange[1]])}
                       >
                          <SelectTrigger className="h-9 text-xs">
                             <SelectValue placeholder={t('common.from')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                             {years.map((year) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>

                       <Select 
                          value={String(filters.yearRange[1])} 
                          onValueChange={(v) => updateFilter('yearRange', [filters.yearRange[0], Number(v)])}
                       >
                          <SelectTrigger className="h-9 text-xs">
                             <SelectValue placeholder={t('common.to')} />
                          </SelectTrigger>
                          <SelectContent className="max-h-[200px]">
                             {years.map((year) => (
                                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                             ))}
                          </SelectContent>
                       </Select>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1">
                       <span className="text-[10px] font-bold text-muted-foreground uppercase">{t('auction.exact_year')}</span>
                       <Input 
                          type="number" 
                          className="h-7 w-24 text-[10px] px-2 py-0 border-muted-foreground/30"
                          placeholder="მაგ: 2020" 
                          value={filters.exactYear}
                          onChange={(e) => updateFilter('exactYear', e.target.value ? Number(e.target.value) : '')}
                        />
                    </div>
                 </div>

                  {/* Technical Data */}
                 <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="space-y-0.5">
                       <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{t('common.fuel')}</label>
                       <Select value={filters.fuelType} onValueChange={(val) => updateFilter('fuelType', val)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                    <div className="space-y-0.5">
                       <label className="text-[9px] font-bold text-muted-foreground uppercase ml-1">{t('common.drive')}</label>
                       <Select value={filters.drive} onValueChange={(val) => updateFilter('drive', val)}>
                          <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                 <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center justify-between p-2 rounded-md border bg-muted/20 h-8">
                       <label htmlFor="buy-now" className="text-[10px] font-bold uppercase cursor-pointer">{t('auction.filters.buy_now_only')}</label>
                       <Checkbox 
                          id="buy-now" 
                          checked={filters.buyNowOnly} 
                          onCheckedChange={(checked) => updateFilter('buyNowOnly', !!checked)} 
                          className="h-3.5 w-3.5"
                       />
                    </div>
                    <div className="flex items-center gap-1 p-1 rounded-md border bg-muted/20 h-8 overflow-hidden">
                       {(['all', 'Copart', 'IAAI'] as const).map((source) => (
                          <button
                             key={source}
                             onClick={() => updateFilter('auctionFilter', source)}
                             className={`flex-1 h-full rounded-sm text-[9px] font-bold uppercase transition-colors ${
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

               </div>

               <SheetFooter className="px-4 py-3 border-t bg-background sticky bottom-0 z-10">
                  <div className="flex w-full gap-3">
                     <Button variant="outline" className="flex-1 h-10 text-sm" onClick={onDrawerReset}>
                        {t('common.reset')}
                     </Button>
                     <Button className="flex-1 h-10 text-sm" onClick={() => { onApply(); }}>
                        {t('common.show_results')}
                     </Button>
                  </div>
               </SheetFooter>
            </SheetContent>
          </Sheet>
          <Button onClick={onApply} className="h-11 px-6">
             {t('common.search')}
          </Button>
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
