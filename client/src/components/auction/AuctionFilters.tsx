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
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { motion, AnimatePresence } from 'framer-motion';
import type { CatalogMake, CatalogModel } from '@/api/catalog';

export interface FilterState {
  searchQuery: string;
  searchKind: 'all' | 'car' | 'moto' | 'van';
  auctionFilter: 'all' | 'Copart' | 'IAAI' | 'Manheim';
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
  showVinCodes: boolean;
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
              <Button variant="outline" size="lg" className="h-11 px-4 gap-2 border-muted-foreground/20 hover:bg-muted/50">
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
               <SheetHeader className="px-6 py-4 border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                 <SheetTitle className="text-xl font-bold flex items-center gap-2">
                    <Icon icon="mdi:tune" className="w-5 h-5 text-primary" />
                    {t('auction.more_filters')}
                 </SheetTitle>
               </SheetHeader>

               <div className="flex-1 px-6 py-6 space-y-8">
                 {/* Vehicle Type + Category mapping */}
                 <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                       <Icon icon="mdi:car-side" className="w-4 h-4" />
                       {t('auction.transport_type')}
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                       {[
                         // ყველა – no category filter
                         { value: 'all', label: t('common.all'), icon: 'mdi:apps', categoryValue: 'all' as const },
                         // მანქანები – category "v"
                         { value: 'car', label: t('common.cars'), icon: 'mdi:car', categoryValue: 'v' as const },
                         // მოტოციკლები – category "c"
                         { value: 'moto', label: t('common.motorcycles'), icon: 'mdi:motorbike', categoryValue: 'c' as const },
                         // კვადროციკლები – category "a" (reuses vans icon for now)
                         { value: 'van', label: t('auction.quads'), icon: 'mdi:van-utility', categoryValue: 'a' as const },
                       ].map((type) => (
                         <button
                            key={type.value}
                            onClick={() => {
                              updateFilter('searchKind', type.value as any);
                              // Map to category codes expected by backend
                              if (type.categoryValue === 'all') {
                                updateFilter('category', 'all');
                              } else {
                                updateFilter('category', type.categoryValue);
                              }
                            }}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-all ${
                              filters.searchKind === type.value
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-border bg-card hover:bg-muted/50 text-muted-foreground'
                            }`}
                         >
                            <Icon icon={type.icon} className="w-4 h-4" />
                            {type.label}
                         </button>
                       ))}
                    </div>
                 </div>

                 <Separator />

                 {/* Make & Model */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                      <Icon icon="mdi:car-info" className="w-4 h-4" />
                      {t('auction.brand_and_model')}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-muted-foreground">{t('common.make')}</label>
                         <Select
                           value={filters.selectedMakeId}
                           onValueChange={(val) => {
                              updateFilter('selectedMakeId', val);
                              updateFilter('selectedModelId', 'all');
                           }}
                           disabled={isLoadingMakes}
                         >
                            <SelectTrigger className="h-10">
                               <SelectValue placeholder={t('common.select_make')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('common.all')}</SelectItem>
                              {catalogMakes.map(make => (
                                 <SelectItem key={make.makeId} value={String(make.makeId)}>{make.name}</SelectItem>
                              ))}
                            </SelectContent>
                         </Select>
                      </div>
                      <div className="space-y-1.5">
                         <label className="text-xs font-medium text-muted-foreground">{t('common.model')}</label>
                         <Select
                           value={filters.selectedModelId}
                           onValueChange={(val) => updateFilter('selectedModelId', val)}
                           disabled={filters.selectedMakeId === 'all' || isLoadingModels}
                         >
                            <SelectTrigger className="h-10">
                               <SelectValue placeholder={t('common.select_model')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">{t('common.all')}</SelectItem>
                              {catalogModels.map(model => (
                                 <SelectItem key={model.modelId} value={String(model.modelId)}>{model.name}</SelectItem>
                              ))}
                            </SelectContent>
                         </Select>
                      </div>
                    </div>
                 </div>

                 <Separator />

                 {/* Price Range */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Icon icon="mdi:currency-usd" className="w-4 h-4" />
                        {t('common.price')}
                      </h3>
                      <span className="text-xs font-mono font-medium bg-muted px-2 py-1 rounded">
                         ${filters.priceRange[0]} - ${filters.priceRange[1]}
                      </span>
                    </div>
                    <Slider
                      value={filters.priceRange}
                      min={0}
                      max={50000}
                      step={500}
                      onValueChange={(val) => updateFilter('priceRange', val)}
                      className="py-4"
                    />
                 </div>

                 {/* Year Range */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                        <Icon icon="mdi:calendar-range" className="w-4 h-4" />
                        {t('common.year')}
                      </h3>
                      <span className="text-xs font-mono font-medium bg-muted px-2 py-1 rounded">
                         {filters.yearRange[0]} - {filters.yearRange[1]}
                      </span>
                    </div>
                    <Slider
                      value={filters.yearRange}
                      min={1990}
                      max={new Date().getFullYear() + 1}
                      step={1}
                      onValueChange={(val) => updateFilter('yearRange', val)}
                      className="py-4"
                    />
                    
                    <div className="flex items-center gap-4">
                       <div className="flex-1 space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">{t('auction.exact_year')}</label>
                          <Input 
                            type="number" 
                            placeholder="e.g. 2020" 
                            value={filters.exactYear}
                            onChange={(e) => updateFilter('exactYear', e.target.value ? Number(e.target.value) : '')}
                          />
                       </div>
                    </div>
                 </div>

                  <Separator />

                  {/* Technical Data */}
                 <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider flex items-center gap-2">
                       <Icon icon="mdi:engine" className="w-4 h-4" />
                       {t('auction.technical_data')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">{t('common.fuel')}</label>
                          <Select value={filters.fuelType} onValueChange={(val) => updateFilter('fuelType', val)}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                {/* Backend expects these exact values: petrol, hybrid, electric, diesel, flexible */}
                                <SelectItem value="petrol">{t('common.fuel_gas')}</SelectItem>
                                <SelectItem value="hybrid">{t('common.fuel_hybrid')}</SelectItem>
                                <SelectItem value="electric">{t('common.fuel_electric')}</SelectItem>
                                <SelectItem value="diesel">{t('common.fuel_diesel')}</SelectItem>
                                <SelectItem value="flexible">{t('common.fuel_flexible')}</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">{t('common.drive')}</label>
                          <Select value={filters.drive} onValueChange={(val) => updateFilter('drive', val)}>
                             <SelectTrigger><SelectValue /></SelectTrigger>
                             <SelectContent>
                                <SelectItem value="all">{t('common.all')}</SelectItem>
                                <SelectItem value="fwd">{t('common.fwd')}</SelectItem>
                                <SelectItem value="rwd">{t('common.rwd')}</SelectItem>
                                <SelectItem value="4wd">{t('common.awd')}</SelectItem>
                             </SelectContent>
                          </Select>
                       </div>
                    </div>
                 </div>

                 {/* Toggles */}
                 <div className="space-y-3 p-4 rounded-lg bg-muted/30 border">
                    <div className="flex items-center justify-between">
                       <label htmlFor="buy-now" className="text-sm font-medium cursor-pointer">{t('auction.filters.buy_now_only')}</label>
                       <Checkbox 
                          id="buy-now" 
                          checked={filters.buyNowOnly} 
                          onCheckedChange={(checked) => updateFilter('buyNowOnly', !!checked)} 
                       />
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                       <label htmlFor="vin-codes" className="text-sm font-medium cursor-pointer">{t('auction.filters.show_vin')}</label>
                       <Checkbox 
                          id="vin-codes" 
                          checked={filters.showVinCodes} 
                          onCheckedChange={(checked) => updateFilter('showVinCodes', !!checked)} 
                       />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                       <label className="text-sm font-medium">{t('auction.filters.auction')}</label>
                        <div className="flex flex-wrap gap-2">
                          {(['all', 'Copart', 'IAAI', 'Manheim'] as const).map((source) => (
                             <button
                                key={source}
                                onClick={() => updateFilter('auctionFilter', source)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                                   filters.auctionFilter === source
                                   ? 'bg-primary text-primary-foreground'
                                   : 'bg-background border hover:bg-muted'
                                }`}
                             >
                                {source === 'all' ? t('common.all') : source}
                             </button>
                          ))}
                        </div>
                    </div>
                 </div>

               </div>

               <SheetFooter className="px-6 py-4 border-t bg-background sticky bottom-0 z-10">
                  <div className="flex w-full gap-3">
                     <Button variant="outline" className="flex-1" onClick={onDrawerReset}>
                        {t('common.reset')}
                     </Button>
                     <Button className="flex-1" onClick={() => { onApply(); }}>
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
