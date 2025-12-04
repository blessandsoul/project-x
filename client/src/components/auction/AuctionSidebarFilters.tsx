import { useState, useRef, useEffect } from 'react';
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

// Copart-style collapsible section with animation
function FilterSection({ 
  title, 
  children, 
  defaultOpen = true 
}: { 
  title: string; 
  children: React.ReactNode; 
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | undefined>(defaultOpen ? undefined : 0);

  useEffect(() => {
    if (isOpen) {
      const contentEl = contentRef.current;
      if (contentEl) {
        setHeight(contentEl.scrollHeight);
        // After animation, set to auto for dynamic content
        const timer = setTimeout(() => setHeight(undefined), 200);
        return () => clearTimeout(timer);
      }
    } else {
      setHeight(0);
    }
  }, [isOpen]);
  
  return (
    <div className="border-b border-slate-200">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-2 py-1.5 bg-slate-50 hover:bg-slate-100 transition-colors"
      >
        <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">
          {title}
        </span>
        <Icon 
          icon="mdi:chevron-down" 
          className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div 
        className="overflow-hidden transition-all duration-200 ease-in-out"
        style={{ height: height === undefined ? 'auto' : height }}
      >
        <div ref={contentRef} className="px-2 py-2 bg-white">
          {children}
        </div>
      </div>
    </div>
  );
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

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters({ [key]: value });
  };

  // Helper for local multi-select checkbox groups
  const toggleValue = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  // Local multi-select state for groups that currently map to single filter fields.
  // Backend still uses only the first selected value per group for now.
  const [selectedTransportTypes, setSelectedTransportTypes] = useState<string[]>(
    filters.searchKind ? [filters.searchKind] : []
  );
  const [selectedFuelTypes, setSelectedFuelTypes] = useState<string[]>(
    filters.fuelType ? [filters.fuelType] : []
  );
  const [selectedDrives, setSelectedDrives] = useState<string[]>(
    filters.drive ? [filters.drive] : []
  );
  const [selectedSources, setSelectedSources] = useState<string[]>(
    filters.auctionFilter ? [filters.auctionFilter] : []
  );

  // Additional purely visual multi-select groups (not yet mapped to backend)
  const [selectedTransmissions, setSelectedTransmissions] = useState<string[]>([]);
  const [selectedDamages, setSelectedDamages] = useState<string[]>([]);
  const [selectedSaleDates, setSelectedSaleDates] = useState<string[]>([]);

  // Sync local arrays when external filters are reset from the page
  useEffect(() => {
    setSelectedTransportTypes(filters.searchKind ? [filters.searchKind] : []);
  }, [filters.searchKind]);

  useEffect(() => {
    setSelectedFuelTypes(filters.fuelType ? [filters.fuelType] : []);
  }, [filters.fuelType]);

  useEffect(() => {
    setSelectedDrives(filters.drive ? [filters.drive] : []);
  }, [filters.drive]);

  useEffect(() => {
    setSelectedSources(filters.auctionFilter ? [filters.auctionFilter] : []);
  }, [filters.auctionFilter]);

  return (
    <div className="bg-white border border-slate-300 text-[11px]">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-2 bg-[#0047AB] text-white">
        <Icon icon="mdi:filter-variant" className="w-3.5 h-3.5" />
        <span className="font-semibold text-[11px] uppercase tracking-wide">
          {t('auction.filters.refine')}
        </span>
      </div>

      {/* Vehicle Type */}
      <FilterSection title={t('auction.transport_type')}>
        <div className="space-y-1">
          {[
            { value: 'all', label: t('auction.filters.all_vehicles'), count: null },
            { value: 'car', label: t('auction.filters.automobiles'), count: null },
            { value: 'moto', label: t('auction.filters.motorcycles'), count: null },
            { value: 'van', label: t('auction.filters.industrial_equipment'), count: null },
          ].map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
              <Checkbox
                checked={selectedTransportTypes.includes(type.value)}
                onCheckedChange={() => {
                  const next = toggleValue(selectedTransportTypes, type.value);
                  setSelectedTransportTypes(next);

                  // Backend uses only the first selected type for now
                  const primary = (next[0] ?? 'all') as FilterState['searchKind'];
                  updateFilter('searchKind', primary);

                  if (primary === 'all') updateFilter('category', 'all');
                  else if (primary === 'car') updateFilter('category', 'v');
                  else if (primary === 'moto') updateFilter('category', 'c');
                  else updateFilter('category', 'a');
                }}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{type.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Year */}
      <FilterSection title={t('auction.filters.year')}>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder={t('common.from')}
            value={filters.yearRange[0] || ''}
            onChange={(e) => updateFilter('yearRange', [Number(e.target.value) || 0, filters.yearRange[1]])}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1"
          />
          <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
          <Input
            type="number"
            placeholder={t('common.to')}
            value={filters.yearRange[1] || ''}
            onChange={(e) => updateFilter('yearRange', [filters.yearRange[0], Number(e.target.value) || 0])}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1"
          />
        </div>
      </FilterSection>

      {/* Make */}
      <FilterSection title={t('auction.filters.make')}>
        <Select
          value={filters.selectedMakeId}
          onValueChange={(val) => {
            updateFilter('selectedMakeId', val);
            updateFilter('selectedModelId', 'all');
          }}
          disabled={isLoadingMakes}
        >
          <SelectTrigger className="h-7 w-full text-[10px] bg-white border-slate-300">
            <SelectValue placeholder={t('auction.filters.any_make')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('auction.filters.any_make')}</SelectItem>
            {(catalogMakes ?? []).map((make) => (
              <SelectItem key={make.makeId} value={String(make.makeId)}>
                {make.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Model */}
      <FilterSection title={t('auction.filters.model')}>
        <Select
          value={filters.selectedModelId}
          onValueChange={(val) => updateFilter('selectedModelId', val)}
          disabled={filters.selectedMakeId === 'all' || isLoadingModels}
        >
          <SelectTrigger className="h-7 w-full text-[10px] bg-white border-slate-300">
            <SelectValue placeholder={t('auction.filters.any_model')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('auction.filters.any_model')}</SelectItem>
            {(catalogModels ?? []).map((model) => (
              <SelectItem key={model.modelId} value={String(model.modelId)}>
                {model.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Odometer */}
      <FilterSection title={t('auction.filters.odometer')}>
        <div className="flex items-center gap-1">
          <Input
            type="number"
            placeholder={t('common.from')}
            value={filters.mileageRange[0] || ''}
            onChange={(e) => updateFilter('mileageRange', [Number(e.target.value) || 0, filters.mileageRange[1]])}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1"
          />
          <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
          <Input
            type="number"
            placeholder={t('common.to')}
            value={filters.mileageRange[1] || ''}
            onChange={(e) => updateFilter('mileageRange', [filters.mileageRange[0], Number(e.target.value) || 0])}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1"
          />
        </div>
      </FilterSection>

      {/* Price/Bid */}
      <FilterSection title={t('auction.filters.price_bid')}>
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">$</span>
            <Input
              type="number"
              placeholder={t('common.from')}
              value={filters.priceRange[0] || ''}
              onChange={(e) => updateFilter('priceRange', [Number(e.target.value) || 0, filters.priceRange[1]])}
              className="h-7 text-[10px] pl-4 pr-1 bg-white border-slate-300"
            />
          </div>
          <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
          <div className="relative flex-1">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">$</span>
            <Input
              type="number"
              placeholder={t('common.to')}
              value={filters.priceRange[1] || ''}
              onChange={(e) => updateFilter('priceRange', [filters.priceRange[0], Number(e.target.value) || 0])}
              className="h-7 text-[10px] pl-4 pr-1 bg-white border-slate-300"
            />
          </div>
        </div>
      </FilterSection>

      {/* Transmission - NEW */}
      <FilterSection title={t('auction.filters.transmission')} defaultOpen={false}>
        <div className="space-y-1">
          {[
            { value: 'all', label: t('auction.filters.all') },
            { value: 'automatic', label: t('auction.filters.automatic') },
            { value: 'manual', label: t('auction.filters.manual') },
          ].map((trans) => (
            <label key={trans.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
              <Checkbox
                checked={selectedTransmissions.includes(trans.value)}
                onCheckedChange={() => {
                  setSelectedTransmissions((prev) => toggleValue(prev, trans.value));
                }}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{trans.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Fuel Type */}
      <FilterSection title={t('auction.filters.fuel_type')} defaultOpen={false}>
        <div className="space-y-1">
          {[
            { value: 'all', label: t('auction.filters.all') },
            { value: 'petrol', label: t('auction.filters.gasoline') },
            { value: 'diesel', label: t('auction.filters.diesel') },
            { value: 'hybrid', label: t('auction.filters.hybrid') },
            { value: 'electric', label: t('auction.filters.electric') },
            { value: 'flexible', label: t('auction.filters.flexible_fuel') },
          ].map((fuel) => (
            <label key={fuel.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
              <Checkbox
                checked={selectedFuelTypes.includes(fuel.value)}
                onCheckedChange={() => {
                  const next = toggleValue(selectedFuelTypes, fuel.value);
                  setSelectedFuelTypes(next);

                  // Backend: use first selected or 'all'
                  const primary = (next[0] ?? 'all') as string;
                  updateFilter('fuelType', primary);
                }}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{fuel.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Drive */}
      <FilterSection title={t('auction.filters.drive')} defaultOpen={false}>
        <div className="space-y-1">
          {[
            { value: 'all', label: t('auction.filters.all') },
            { value: 'front', label: t('auction.filters.front_wheel') },
            { value: 'rear', label: t('auction.filters.rear_wheel') },
            { value: 'full', label: t('auction.filters.all_wheel') },
          ].map((drive) => (
            <label key={drive.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
              <Checkbox
                checked={selectedDrives.includes(drive.value)}
                onCheckedChange={() => {
                  const next = toggleValue(selectedDrives, drive.value);
                  setSelectedDrives(next);

                  const primary = (next[0] ?? 'all') as string;
                  updateFilter('drive', primary as any);
                }}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{drive.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Damage - NEW */}
      <FilterSection title={t('auction.filters.damage')} defaultOpen={false}>
        <div className="space-y-1">
          {[
            { value: 'all', label: t('auction.filters.all') },
            { value: 'front', label: t('auction.filters.front_end') },
            { value: 'rear', label: t('auction.filters.rear_end') },
            { value: 'side', label: t('auction.filters.side') },
            { value: 'minor', label: t('auction.filters.minor_dents_scratches') },
            { value: 'normal', label: t('auction.filters.normal_wear') },
          ].map((damage) => (
            <label key={damage.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
              <Checkbox
                checked={selectedDamages.includes(damage.value)}
                onCheckedChange={() => {
                  setSelectedDamages((prev) => toggleValue(prev, damage.value));
                }}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{damage.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Sale Date - NEW */}
      <FilterSection title={t('auction.filters.sale_date')} defaultOpen={false}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1">
            <Input
              type="date"
              className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1"
            />
          </div>
          <div className="space-y-1">
            {[
              { value: 'today', label: t('auction.sale_date.today') },
              { value: 'tomorrow', label: t('auction.sale_date.tomorrow') },
              { value: 'this_week', label: t('auction.sale_date.this_week') },
              { value: 'next_week', label: t('auction.sale_date.next_week') },
            ].map((date) => (
              <label key={date.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                <Checkbox
                  checked={selectedSaleDates.includes(date.value)}
                  onCheckedChange={() => {
                    setSelectedSaleDates((prev) => toggleValue(prev, date.value));
                  }}
                  className="h-3.5 w-3.5 rounded-sm"
                />
                <span className="text-[11px] text-slate-700">{date.label}</span>
              </label>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Location - NEW */}
      <FilterSection title={t('auction.filters.location')} defaultOpen={false}>
        <Select>
          <SelectTrigger className="h-7 w-full text-[10px] bg-white border-slate-300">
            <SelectValue placeholder={t('auction.location.any')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('auction.location.any')}</SelectItem>
            <SelectItem value="ca">California</SelectItem>
            <SelectItem value="tx">Texas</SelectItem>
            <SelectItem value="fl">Florida</SelectItem>
            <SelectItem value="ny">New York</SelectItem>
            <SelectItem value="ga">Georgia</SelectItem>
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Auction Source */}
      <FilterSection title={t('auction.filters.source')}>
        <div className="space-y-1">
          {[
            { value: 'all', label: 'All Sources' },
            { value: 'Copart', label: 'Copart' },
            { value: 'IAAI', label: 'IAAI' },
          ].map((source) => (
            <label key={source.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
              <Checkbox
                checked={selectedSources.includes(source.value)}
                onCheckedChange={() => {
                  const next = toggleValue(selectedSources, source.value);
                  setSelectedSources(next);

                  const primary = (next[0] ?? 'all') as string;
                  updateFilter('auctionFilter', primary as any);
                }}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{source.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Buy Now Only */}
      <FilterSection title="Buy It Now">
        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
          <Checkbox
            checked={filters.buyNowOnly}
            onCheckedChange={(checked) => updateFilter('buyNowOnly', !!checked)}
            className="h-3.5 w-3.5 rounded-sm"
          />
          <span className="text-[11px] text-slate-700">{t('auction.filters.buy_now_only')}</span>
        </label>
      </FilterSection>

      {/* Action Buttons */}
      <div className="p-2 bg-slate-50 border-t border-slate-200 space-y-1.5">
        <Button 
          onClick={onApply} 
          className="w-full h-7 text-[10px] bg-[#f5a623] hover:bg-[#e5a800] text-[#1a2744] font-bold"
        >
          {t('auction.filters.apply')}
        </Button>
        <Button 
          variant="outline" 
          onClick={onReset} 
          className="w-full h-7 text-[10px] border-slate-300 text-slate-600 hover:bg-slate-100"
        >
          {t('common.clear_all')}
        </Button>
      </div>
    </div>
  );
}
