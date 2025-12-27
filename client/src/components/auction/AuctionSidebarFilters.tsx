import { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Check, ChevronsUpDown, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { FilterSection } from '@/components/filters/FiltersSidebarLayout';

import {
  fetchMakesByTransportType,
  fetchModelsByMake,
  type VehicleMake,
  type VehicleModel,
} from '@/api/vehicleMakesModels';
import { apiGet } from '@/lib/apiClient';

// Category filter type: 'v' = cars, 'c' = motorcycles, 'v,c' = both, undefined = all
export type CategoryFilter = 'v' | 'c' | 'v,c' | undefined;

export interface AuctionSidebarFiltersProps {
  /** Current category filter value */
  categoryFilter?: CategoryFilter;
  /** Callback when category filter changes - triggers immediate data fetch */
  onCategoryChange?: (category: CategoryFilter) => void;
  /** Current year range [from, to] - 0 means no filter */
  yearRange?: [number, number];
  /** Callback when year range changes - triggers immediate data fetch */
  onYearRangeChange?: (yearFrom: number, yearTo: number) => void;
  /** Currently selected make ID */
  selectedMakeId?: number;
  /** Callback when make changes */
  onMakeChange?: (makeId: number | undefined, makeName: string | undefined) => void;
  /** Currently selected model ID */
  selectedModelId?: number;
  /** Callback when model changes */
  onModelChange?: (modelId: number | undefined, modelName: string | undefined) => void;
  /** Current odometer/mileage range [from, to] - 0 means no filter, max 250000 */
  odometerRange?: [number, number];
  /** Callback when odometer range changes - triggers immediate data fetch */
  onOdometerRangeChange?: (odometerFrom: number, odometerTo: number) => void;
  /** Current price range [from, to] - 0 means no filter, max 500000 */
  priceRange?: [number, number];
  /** Callback when price range changes - triggers immediate data fetch */
  onPriceRangeChange?: (priceFrom: number, priceTo: number) => void;
  /** Current title type filter - comma-separated values or undefined for all */
  titleType?: string;
  /** Callback when title type changes - triggers immediate data fetch */
  onTitleTypeChange?: (titleType: string | undefined) => void;
  /** Current transmission filter - 'auto', 'manual', 'auto,manual', or undefined for all */
  transmission?: string;
  /** Callback when transmission changes - triggers immediate data fetch */
  onTransmissionChange?: (transmission: string | undefined) => void;
  /** Current fuel filter - comma-separated values or undefined for all */
  fuel?: string;
  /** Callback when fuel changes - triggers immediate data fetch */
  onFuelChange?: (fuel: string | undefined) => void;
  /** Current drive filter - comma-separated values or undefined for all */
  drive?: string;
  /** Callback when drive changes - triggers immediate data fetch */
  onDriveChange?: (drive: string | undefined) => void;
  /** Current cylinders filter - comma-separated values or undefined for all */
  cylinders?: string;
  /** Callback when cylinders change - triggers immediate data fetch */
  onCylindersChange?: (cylinders: string | undefined) => void;
  /** Current location filter - city name or undefined for all */
  location?: string;
  /** Callback when location changes - triggers immediate data fetch */
  onLocationChange?: (location: string | undefined) => void;
  /** Current source filter - comma-separated values (copart,iaai) or undefined for all */
  source?: string;
  /** Callback when source changes - triggers immediate data fetch */
  onSourceChange?: (source: string | undefined) => void;
  /** Current buy now filter - true to show only buy now vehicles */
  buyNow?: boolean;
  /** Callback when buy now changes - triggers immediate data fetch */
  onBuyNowChange?: (buyNow: boolean) => void;
  /** Current date filter - YYYY-MM-DD format or undefined for all */
  date?: string;
  /** Callback when date changes - triggers immediate data fetch */
  onDateChange?: (date: string | undefined) => void;
  /** Callback when "Use Filters" button is clicked - triggers manual filter application */
  onApplyFilters?: () => void;
  /** Callback when "Clear Filters" button is clicked - resets all filters */
  onResetFilters?: () => void;
}

// FilterSection is now imported from @/components/filters/FiltersSidebarLayout

// ============================================================================
// Searchable Combobox Components
// ============================================================================

interface MakeComboboxProps {
  makes: VehicleMake[];
  selectedMakeId?: number;
  onMakeChange: (value: string) => void;
  isLoading: boolean;
  placeholder: string;
  loadingText: string;
  searchPlaceholder: string;
  noResultsText: string;
}

function MakeCombobox({
  makes,
  selectedMakeId,
  onMakeChange,
  isLoading,
  placeholder,
  loadingText,
  searchPlaceholder,
  noResultsText,
}: MakeComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedMake = makes.find((m) => m.id === selectedMakeId);
  const displayValue = isLoading ? loadingText : (selectedMake?.name || placeholder);

  // Filter makes based on search (case-insensitive, contains)
  const filteredMakes = useMemo(() => {
    if (!search.trim()) return makes;
    const lowerSearch = search.toLowerCase();
    return makes.filter((make) => make.name.toLowerCase().includes(lowerSearch));
  }, [makes, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isLoading}
          className="h-7 w-full justify-between text-[10px] bg-white border-slate-300 font-normal px-2 rounded-none"
        >
          <span className={cn("truncate", !selectedMake && "text-muted-foreground")}>
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-8 text-[11px]"
          />
          <CommandList>
            <CommandEmpty className="py-3 text-[11px]">{noResultsText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onMakeChange('all');
                  setOpen(false);
                  setSearch('');
                }}
                className="text-[11px] py-1.5"
              >
                <Check
                  className={cn(
                    "mr-2 h-3 w-3",
                    !selectedMakeId ? "opacity-100" : "opacity-0"
                  )}
                />
                {placeholder}
              </CommandItem>
              {filteredMakes.map((make) => (
                <CommandItem
                  key={make.id}
                  value={String(make.id)}
                  onSelect={() => {
                    onMakeChange(String(make.id));
                    setOpen(false);
                    setSearch('');
                  }}
                  className="text-[11px] py-1.5"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      selectedMakeId === make.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {make.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface ModelComboboxProps {
  models: VehicleModel[];
  selectedModelId?: number;
  onModelChange: (value: string) => void;
  isLoading: boolean;
  disabled: boolean;
  placeholder: string;
  loadingText: string;
  searchPlaceholder: string;
  noResultsText: string;
}

function ModelCombobox({
  models,
  selectedModelId,
  onModelChange,
  isLoading,
  disabled,
  placeholder,
  loadingText,
  searchPlaceholder,
  noResultsText,
}: ModelComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectedModel = models.find((m) => m.id === selectedModelId);
  const displayValue = isLoading ? loadingText : (selectedModel?.name || placeholder);

  // Filter models based on search (case-insensitive, contains)
  const filteredModels = useMemo(() => {
    if (!search.trim()) return models;
    const lowerSearch = search.toLowerCase();
    return models.filter((model) => model.name.toLowerCase().includes(lowerSearch));
  }, [models, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="h-7 w-full justify-between text-[10px] bg-white border-slate-300 font-normal px-2 rounded-none"
        >
          <span className={cn("truncate", !selectedModel && "text-muted-foreground")}>
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-8 text-[11px]"
          />
          <CommandList>
            <CommandEmpty className="py-3 text-[11px]">{noResultsText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onModelChange('all');
                  setOpen(false);
                  setSearch('');
                }}
                className="text-[11px] py-1.5"
              >
                <Check
                  className={cn(
                    "mr-2 h-3 w-3",
                    !selectedModelId ? "opacity-100" : "opacity-0"
                  )}
                />
                {placeholder}
              </CommandItem>
              {filteredModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={String(model.id)}
                  onSelect={() => {
                    onModelChange(String(model.id));
                    setOpen(false);
                    setSearch('');
                  }}
                  className="text-[11px] py-1.5"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      selectedModelId === model.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {model.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface LocationComboboxProps {
  cities: string[];
  selectedLocation?: string;
  onLocationChange: (value: string) => void;
  isLoading: boolean;
  placeholder: string;
  searchPlaceholder: string;
  noResultsText: string;
}

function LocationCombobox({
  cities,
  selectedLocation,
  onLocationChange,
  isLoading,
  placeholder,
  searchPlaceholder,
  noResultsText,
}: LocationComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const displayValue = selectedLocation || placeholder;

  // Filter cities based on search (case-insensitive, contains)
  const filteredCities = useMemo(() => {
    if (!search.trim()) return cities;
    const lowerSearch = search.toLowerCase();
    return cities.filter((city) => city.toLowerCase().includes(lowerSearch));
  }, [cities, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={isLoading}
          className="h-7 w-full justify-between text-[10px] bg-white border-slate-300 font-normal px-2 rounded-none"
        >
          <span className={cn("truncate", !selectedLocation && "text-muted-foreground")}>
            {displayValue}
          </span>
          <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder}
            value={search}
            onValueChange={setSearch}
            className="h-8 text-[11px]"
          />
          <CommandList>
            <CommandEmpty className="py-3 text-[11px]">{noResultsText}</CommandEmpty>
            <CommandGroup>
              <CommandItem
                value="all"
                onSelect={() => {
                  onLocationChange('all');
                  setOpen(false);
                  setSearch('');
                }}
                className="text-[11px] py-1.5"
              >
                <Check
                  className={cn(
                    "mr-2 h-3 w-3",
                    !selectedLocation ? "opacity-100" : "opacity-0"
                  )}
                />
                {placeholder}
              </CommandItem>
              {filteredCities.map((city) => (
                <CommandItem
                  key={city}
                  value={city}
                  onSelect={() => {
                    onLocationChange(city);
                    setOpen(false);
                    setSearch('');
                  }}
                  className="text-[11px] py-1.5"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      selectedLocation === city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {city}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Main Component
// ============================================================================

/**
 * AuctionSidebarFilters - Sidebar filter component for auction listings
 * 
 * Currently implements:
 * - Transport type filter (cars, motorcycles, or both) via category API param
 * 
 * Other filters are design-only placeholders pending API integration.
 */
export function AuctionSidebarFilters({
  categoryFilter,
  onCategoryChange,
  yearRange = [0, 0],
  onYearRangeChange,
  selectedMakeId,
  onMakeChange,
  selectedModelId,
  onModelChange,
  odometerRange = [0, 0],
  onOdometerRangeChange,
  priceRange = [0, 0],
  onPriceRangeChange,
  titleType,
  onTitleTypeChange,
  transmission,
  onTransmissionChange,
  fuel,
  onFuelChange,
  drive,
  onDriveChange,
  cylinders,
  onCylindersChange,
  location,
  onLocationChange,
  source,
  onSourceChange,
  buyNow,
  onBuyNowChange,
  date,
  onDateChange,
  onApplyFilters,
  onResetFilters,
}: AuctionSidebarFiltersProps) {
  const { t } = useTranslation();

  // Makes state
  const [makes, setMakes] = useState<VehicleMake[]>([]);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);

  // Models state
  const [models, setModels] = useState<VehicleModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // Cities state for location filter
  const [cities, setCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Cylinders derived state
  const allowedCylinders = ['0', '1', '2', '3', '4', '5', '6', '8', '10', '12', 'U'];
  const selectedCylinders = (cylinders || '')
    .split(',')
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean)
    .filter((c) => allowedCylinders.includes(c));

  const isCylChecked = (value: string) => selectedCylinders.includes(value);

  const handleCylindersToggle = (value: string) => {
    const nextSelected = new Set(selectedCylinders);
    if (nextSelected.has(value)) {
      nextSelected.delete(value);
    } else {
      nextSelected.add(value);
    }
    const ordered = allowedCylinders.filter((c) => nextSelected.has(c));
    const next = ordered.length > 0 ? ordered.join(',') : undefined;
    onCylindersChange?.(next);
  };

  // Source filter derived state
  const allowedSources = ['copart', 'iaai'];
  const selectedSources = (source || '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .filter((s) => allowedSources.includes(s));

  const isSourceChecked = (value: string) => selectedSources.includes(value.toLowerCase());

  const handleSourceToggle = (value: string) => {
    const lowerValue = value.toLowerCase();
    const nextSelected = new Set(selectedSources);
    if (nextSelected.has(lowerValue)) {
      nextSelected.delete(lowerValue);
    } else {
      nextSelected.add(lowerValue);
    }
    const ordered = allowedSources.filter((s) => nextSelected.has(s));
    const next = ordered.length > 0 ? ordered.join(',') : undefined;
    onSourceChange?.(next);
  };

  // Track previous category to detect changes
  const prevCategoryRef = useRef<CategoryFilter>(categoryFilter);

  // Local state for year inputs (to allow typing before triggering API call)
  const [localYearFrom, setLocalYearFrom] = useState<string>(yearRange[0] > 0 ? String(yearRange[0]) : '');
  const [localYearTo, setLocalYearTo] = useState<string>(yearRange[1] > 0 ? String(yearRange[1]) : '');

  // Local state for odometer inputs
  const [localOdometerFrom, setLocalOdometerFrom] = useState<string>(odometerRange[0] > 0 ? String(odometerRange[0]) : '');
  const [localOdometerTo, setLocalOdometerTo] = useState<string>(odometerRange[1] > 0 ? String(odometerRange[1]) : '');

  // Local state for price inputs
  const [localPriceFrom, setLocalPriceFrom] = useState<string>(priceRange[0] > 0 ? String(priceRange[0]) : '');
  const [localPriceTo, setLocalPriceTo] = useState<string>(priceRange[1] > 0 ? String(priceRange[1]) : '');

  // Sync local state when props change (e.g., from URL or reset)
  useEffect(() => {
    setLocalYearFrom(yearRange[0] > 0 ? String(yearRange[0]) : '');
    setLocalYearTo(yearRange[1] > 0 ? String(yearRange[1]) : '');
  }, [yearRange[0], yearRange[1]]);

  // Sync odometer local state when props change
  useEffect(() => {
    setLocalOdometerFrom(odometerRange[0] > 0 ? String(odometerRange[0]) : '');
    setLocalOdometerTo(odometerRange[1] > 0 ? String(odometerRange[1]) : '');
  }, [odometerRange[0], odometerRange[1]]);

  // Sync price local state when props change
  useEffect(() => {
    setLocalPriceFrom(priceRange[0] > 0 ? String(priceRange[0]) : '');
    setLocalPriceTo(priceRange[1] > 0 ? String(priceRange[1]) : '');
  }, [priceRange[0], priceRange[1]]);

  // Fetch cities for location filter on mount
  useEffect(() => {
    const loadCities = async () => {
      setIsLoadingCities(true);
      try {
        const response = await apiGet<{ success: boolean; count: number; data: string[] }>('/api/cities');
        setCities(response.data);
      } catch (error) {
        console.error('Failed to load cities:', error);
        setCities([]);
      } finally {
        setIsLoadingCities(false);
      }
    };
    loadCities();
  }, []);

  // Fetch makes when category filter changes
  useEffect(() => {
    const loadMakes = async () => {
      setIsLoadingMakes(true);
      try {
        const fetchedMakes = await fetchMakesByTransportType(categoryFilter);
        setMakes(fetchedMakes);

        // Check if current selected make is still valid
        if (selectedMakeId) {
          const isStillValid = fetchedMakes.some((m) => m.id === selectedMakeId);
          if (!isStillValid) {
            // Clear invalid make and models
            onMakeChange?.(undefined, undefined);
            onModelChange?.(undefined, undefined);
            setModels([]);
          }
        }
      } catch (error) {
        console.error('[AuctionSidebarFilters] Failed to load makes:', error);
        setMakes([]);
      } finally {
        setIsLoadingMakes(false);
      }
    };

    loadMakes();

    // Track category change for clearing models
    if (prevCategoryRef.current !== categoryFilter) {
      // Category changed - clear models
      setModels([]);
      onModelChange?.(undefined, undefined);
      prevCategoryRef.current = categoryFilter;
    }
  }, [categoryFilter, selectedMakeId, onMakeChange, onModelChange]);

  // Fetch models when make is selected
  useEffect(() => {
    if (!selectedMakeId) {
      setModels([]);
      return;
    }

    const loadModels = async () => {
      setIsLoadingModels(true);
      try {
        const fetchedModels = await fetchModelsByMake(selectedMakeId, categoryFilter);
        setModels(fetchedModels);
      } catch (error) {
        console.error('[AuctionSidebarFilters] Failed to load models:', error);
        setModels([]);
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadModels();
  }, [selectedMakeId, categoryFilter]);

  // Handle make selection change
  const handleMakeChange = (value: string) => {
    if (value === 'all') {
      onMakeChange?.(undefined, undefined);
      onModelChange?.(undefined, undefined);
      setModels([]);
    } else {
      const makeId = parseInt(value, 10);
      const make = makes.find((m) => m.id === makeId);
      onMakeChange?.(makeId, make?.name);
      onModelChange?.(undefined, undefined); // Clear model when make changes
    }
  };

  // Handle model selection change
  const handleModelChange = (value: string) => {
    if (value === 'all') {
      onModelChange?.(undefined, undefined);
    } else {
      const modelId = parseInt(value, 10);
      const model = models.find((m) => m.id === modelId);
      onModelChange?.(modelId, model?.name);
    }
  };

  // Validate year: must be exactly 4 digits (1900-2099 range)
  const isValidYear = (value: string): boolean => {
    if (!value) return true; // Empty is valid (no filter)
    if (!/^\d{4}$/.test(value)) return false; // Must be exactly 4 digits
    const year = parseInt(value, 10);
    return year >= 1900 && year <= 2099;
  };

  // Handler for year input change - only allow digits, max 4 chars
  const handleYearInputChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Only allow digits and limit to 4 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    setter(cleaned);
  };

  // Handler for year input blur - validates and triggers API call
  const handleYearBlur = () => {
    if (!onYearRangeChange) return;

    // Validate both values - only use valid 4-digit years
    const fromValid = isValidYear(localYearFrom);
    const toValid = isValidYear(localYearTo);

    // If invalid, clear the invalid field
    if (!fromValid) setLocalYearFrom('');
    if (!toValid) setLocalYearTo('');

    const from = fromValid && localYearFrom ? parseInt(localYearFrom, 10) : 0;
    const to = toValid && localYearTo ? parseInt(localYearTo, 10) : 0;

    // Only trigger if values actually changed
    if (from !== yearRange[0] || to !== yearRange[1]) {
      onYearRangeChange(from, to);
    }
  };

  // Handler for Enter key - triggers API call
  const handleYearKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleYearBlur();
    }
  };

  // Validate odometer: must be 0-250000
  const isValidOdometer = (value: string): boolean => {
    if (!value) return true; // Empty is valid (no filter)
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0 && num <= 250000;
  };

  // Handler for odometer input change - only allow digits, max 6 chars (250000)
  const handleOdometerInputChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setter(cleaned);
  };

  // Handler for odometer input blur - validates and triggers API call
  const handleOdometerBlur = () => {
    if (!onOdometerRangeChange) return;

    // Validate both values
    const fromValid = isValidOdometer(localOdometerFrom);
    const toValid = isValidOdometer(localOdometerTo);

    // If invalid (>250000), cap at 250000
    let from = fromValid && localOdometerFrom ? parseInt(localOdometerFrom, 10) : 0;
    let to = toValid && localOdometerTo ? parseInt(localOdometerTo, 10) : 0;

    // Cap values at 250000
    if (from > 250000) {
      from = 250000;
      setLocalOdometerFrom('250000');
    }
    if (to > 250000) {
      to = 250000;
      setLocalOdometerTo('250000');
    }

    // Only trigger if values actually changed
    if (from !== odometerRange[0] || to !== odometerRange[1]) {
      onOdometerRangeChange(from, to);
    }
  };

  // Handler for Enter key on odometer - triggers API call
  const handleOdometerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleOdometerBlur();
    }
  };

  // Validate price: must be 0-500000
  const isValidPrice = (value: string): boolean => {
    if (!value) return true; // Empty is valid (no filter)
    const num = parseInt(value, 10);
    return !isNaN(num) && num >= 0 && num <= 500000;
  };

  // Handler for price input change - only allow digits, max 6 chars (500000)
  const handlePriceInputChange = (
    value: string,
    setter: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Only allow digits and limit to 6 characters
    const cleaned = value.replace(/\D/g, '').slice(0, 6);
    setter(cleaned);
  };

  // Handler for price input blur - validates and triggers API call
  const handlePriceBlur = () => {
    if (!onPriceRangeChange) return;

    // Validate both values
    const fromValid = isValidPrice(localPriceFrom);
    const toValid = isValidPrice(localPriceTo);

    // If invalid (>500000), cap at 500000
    let from = fromValid && localPriceFrom ? parseInt(localPriceFrom, 10) : 0;
    let to = toValid && localPriceTo ? parseInt(localPriceTo, 10) : 0;

    // Cap values at 500000
    if (from > 500000) {
      from = 500000;
      setLocalPriceFrom('500000');
    }
    if (to > 500000) {
      to = 500000;
      setLocalPriceTo('500000');
    }

    // Only trigger if values actually changed
    if (from !== priceRange[0] || to !== priceRange[1]) {
      onPriceRangeChange(from, to);
    }
  };

  // Handler for Enter key on price - triggers API call
  const handlePriceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handlePriceBlur();
    }
  };

  // Derive checkbox states from categoryFilter
  // 'all' checkbox is checked when no category filter (undefined)
  // 'car' checkbox is checked when categoryFilter includes 'v'
  // 'moto' checkbox is checked when categoryFilter includes 'c'
  const isAllChecked = categoryFilter === undefined;
  const isCarChecked = categoryFilter === 'v' || categoryFilter === 'v,c';
  const isMotoChecked = categoryFilter === 'c' || categoryFilter === 'v,c';

  const handleCategoryToggle = (type: 'all' | 'car' | 'moto') => {
    if (!onCategoryChange) return;

    if (type === 'all') {
      // Toggle all: if currently all, stay all; otherwise set to all (no filter)
      onCategoryChange(undefined);
      return;
    }

    // For car/moto toggles, we need to compute the new state
    let newCarChecked = isCarChecked;
    let newMotoChecked = isMotoChecked;

    if (type === 'car') {
      newCarChecked = !isCarChecked;
    } else if (type === 'moto') {
      newMotoChecked = !isMotoChecked;
    }

    // Determine the new category filter value
    if (newCarChecked && newMotoChecked) {
      onCategoryChange('v,c');
    } else if (newCarChecked) {
      onCategoryChange('v');
    } else if (newMotoChecked) {
      onCategoryChange('c');
    } else {
      // Neither selected = all (no filter)
      onCategoryChange(undefined);
    }
  };

  // Title type filter logic
  // Parse current titleType into individual checked states
  const titleTypes = titleType ? titleType.split(',').map(t => t.trim().toLowerCase()) : [];
  const isCleanTitleChecked = titleTypes.includes('clean title');
  const isNonRepairableChecked = titleTypes.includes('nonrepairable');
  const isSalvageTitleChecked = titleTypes.includes('salvage title');

  const handleTitleTypeToggle = (type: 'clean title' | 'nonrepairable' | 'salvage title') => {
    if (!onTitleTypeChange) return;

    // Compute new checked states
    let newClean = isCleanTitleChecked;
    let newNonRepairable = isNonRepairableChecked;
    let newSalvage = isSalvageTitleChecked;

    if (type === 'clean title') {
      newClean = !newClean;
    } else if (type === 'nonrepairable') {
      newNonRepairable = !newNonRepairable;
    } else if (type === 'salvage title') {
      newSalvage = !newSalvage;
    }

    // Build the new comma-separated value
    const selected: string[] = [];
    if (newClean) selected.push('clean title');
    if (newNonRepairable) selected.push('nonrepairable');
    if (newSalvage) selected.push('salvage title');

    // If none selected, pass undefined (no filter)
    onTitleTypeChange(selected.length > 0 ? selected.join(',') : undefined);
  };

  // Transmission filter logic
  // Parse current transmission into individual checked states
  const transmissionValues = transmission ? transmission.split(',').map(t => t.trim().toLowerCase()) : [];
  const isAutoChecked = transmissionValues.includes('auto');
  const isManualChecked = transmissionValues.includes('manual');

  const handleTransmissionToggle = (type: 'auto' | 'manual') => {
    if (!onTransmissionChange) return;

    // Compute new checked states
    let newAuto = isAutoChecked;
    let newManual = isManualChecked;

    if (type === 'auto') {
      newAuto = !newAuto;
    } else if (type === 'manual') {
      newManual = !newManual;
    }

    // Build the new comma-separated value
    const selected: string[] = [];
    if (newAuto) selected.push('auto');
    if (newManual) selected.push('manual');

    // If none selected, pass undefined (no filter = all)
    onTransmissionChange(selected.length > 0 ? selected.join(',') : undefined);
  };

  // Fuel filter logic
  // Parse current fuel into individual checked states
  const fuelValues = fuel ? fuel.split(',').map(f => f.trim().toLowerCase()) : [];
  const isPetrolChecked = fuelValues.includes('petrol');
  const isDieselChecked = fuelValues.includes('diesel');
  const isElectricChecked = fuelValues.includes('electric');
  const isFlexibleChecked = fuelValues.includes('flexible');
  const isHybridChecked = fuelValues.includes('hybrid');

  const handleFuelToggle = (type: 'petrol' | 'diesel' | 'electric' | 'flexible' | 'hybrid') => {
    if (!onFuelChange) return;

    // Compute new checked states
    let newPetrol = isPetrolChecked;
    let newDiesel = isDieselChecked;
    let newElectric = isElectricChecked;
    let newFlexible = isFlexibleChecked;
    let newHybrid = isHybridChecked;

    if (type === 'petrol') newPetrol = !newPetrol;
    else if (type === 'diesel') newDiesel = !newDiesel;
    else if (type === 'electric') newElectric = !newElectric;
    else if (type === 'flexible') newFlexible = !newFlexible;
    else if (type === 'hybrid') newHybrid = !newHybrid;

    // Build the new comma-separated value
    const selected: string[] = [];
    if (newPetrol) selected.push('petrol');
    if (newDiesel) selected.push('diesel');
    if (newElectric) selected.push('electric');
    if (newFlexible) selected.push('flexible');
    if (newHybrid) selected.push('hybrid');

    // If none selected, pass undefined (no filter = all)
    onFuelChange(selected.length > 0 ? selected.join(',') : undefined);
  };

  // Drive filter logic
  // Parse current drive into individual checked states
  const driveValues = drive ? drive.split(',').map(d => d.trim().toLowerCase()) : [];
  const isFrontChecked = driveValues.includes('front');
  const isRearChecked = driveValues.includes('rear');
  const isFullChecked = driveValues.includes('full');

  const handleDriveToggle = (type: 'front' | 'rear' | 'full') => {
    if (!onDriveChange) return;

    // Compute new checked states
    let newFront = isFrontChecked;
    let newRear = isRearChecked;
    let newFull = isFullChecked;

    if (type === 'front') newFront = !newFront;
    else if (type === 'rear') newRear = !newRear;
    else if (type === 'full') newFull = !newFull;

    // Build the new comma-separated value
    const selected: string[] = [];
    if (newFront) selected.push('front');
    if (newRear) selected.push('rear');
    if (newFull) selected.push('full');

    // If none selected, pass undefined (no filter = all)
    onDriveChange(selected.length > 0 ? selected.join(',') : undefined);
  };

  return (
    <div className="bg-white border border-slate-300 text-[11px]">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-2 py-2 bg-primary text-white">
        <Icon icon="mdi:filter-variant" className="w-3.5 h-3.5" />
        <span className="font-semibold text-[11px] uppercase tracking-wide">
          {t('auction.filters.refine')}
        </span>
      </div>

      {/* Vehicle Type */}
      <FilterSection title={t('auction.transport_type')}>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isAllChecked}
              onCheckedChange={() => handleCategoryToggle('all')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.all_vehicles')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isCarChecked}
              onCheckedChange={() => handleCategoryToggle('car')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.automobiles')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isMotoChecked}
              onCheckedChange={() => handleCategoryToggle('moto')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.motorcycles')}</span>
          </label>
        </div>
      </FilterSection>

      {/* Document Type / Title Type */}
      <FilterSection title={t('auction.filters.title_type')}>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isCleanTitleChecked}
              onCheckedChange={() => handleTitleTypeToggle('clean title')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">Clean Title</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isNonRepairableChecked}
              onCheckedChange={() => handleTitleTypeToggle('nonrepairable')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">NonRepairable</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isSalvageTitleChecked}
              onCheckedChange={() => handleTitleTypeToggle('salvage title')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">Salvage Title</span>
          </label>
        </div>
      </FilterSection>

      {/* Year */}
      <FilterSection title={t('auction.filters.year')}>
        <div className="flex items-center gap-1">
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder={t('common.from')}
            value={localYearFrom}
            onChange={(e) => handleYearInputChange(e.target.value, setLocalYearFrom)}
            onBlur={handleYearBlur}
            onKeyDown={handleYearKeyDown}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1 rounded-none"
          />
          <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder={t('common.to')}
            value={localYearTo}
            onChange={(e) => handleYearInputChange(e.target.value, setLocalYearTo)}
            onBlur={handleYearBlur}
            onKeyDown={handleYearKeyDown}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1 rounded-none"
          />
        </div>
      </FilterSection>

      {/* Make */}
      <FilterSection title={t('auction.filters.make')}>
        <MakeCombobox
          makes={makes}
          selectedMakeId={selectedMakeId}
          onMakeChange={handleMakeChange}
          isLoading={isLoadingMakes}
          placeholder={t('auction.filters.any_make')}
          loadingText={t('common.loading')}
          searchPlaceholder={t('common.search')}
          noResultsText={t('common.no_results')}
        />
      </FilterSection>

      {/* Model */}
      <FilterSection title={t('auction.filters.model')}>
        <ModelCombobox
          models={models}
          selectedModelId={selectedModelId}
          onModelChange={handleModelChange}
          isLoading={isLoadingModels}
          disabled={!selectedMakeId}
          placeholder={t('auction.filters.any_model')}
          loadingText={t('common.loading')}
          searchPlaceholder={t('common.search')}
          noResultsText={t('common.no_results')}
        />
      </FilterSection>

      {/* Odometer */}
      <FilterSection title={t('auction.filters.odometer')}>
        <div className="flex items-center gap-1">
          <Input
            type="text"
            inputMode="numeric"
            placeholder={t('common.from')}
            value={localOdometerFrom}
            onChange={(e) => handleOdometerInputChange(e.target.value, setLocalOdometerFrom)}
            onBlur={handleOdometerBlur}
            onKeyDown={handleOdometerKeyDown}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1 rounded-none"
          />
          <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
          <Input
            type="text"
            inputMode="numeric"
            placeholder={t('common.to')}
            value={localOdometerTo}
            onChange={(e) => handleOdometerInputChange(e.target.value, setLocalOdometerTo)}
            onBlur={handleOdometerBlur}
            onKeyDown={handleOdometerKeyDown}
            className="h-7 text-[10px] px-2 bg-white border-slate-300 flex-1 rounded-none"
          />
        </div>
      </FilterSection>

      {/* Price/Bid */}
      <FilterSection title={t('auction.filters.price_bid')}>
        <div className="flex items-center gap-1">
          <div className="relative flex-1">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">$</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={t('common.from')}
              value={localPriceFrom}
              onChange={(e) => handlePriceInputChange(e.target.value, setLocalPriceFrom)}
              onBlur={handlePriceBlur}
              onKeyDown={handlePriceKeyDown}
              className="h-7 text-[10px] pl-4 pr-1 bg-white border-slate-300 rounded-none"
            />
          </div>
          <span className="text-slate-400 text-[10px]">{t('common.to')}</span>
          <div className="relative flex-1">
            <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400">$</span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder={t('common.to')}
              value={localPriceTo}
              onChange={(e) => handlePriceInputChange(e.target.value, setLocalPriceTo)}
              onBlur={handlePriceBlur}
              onKeyDown={handlePriceKeyDown}
              className="h-7 text-[10px] pl-4 pr-1 bg-white border-slate-300 rounded-none"
            />
          </div>
        </div>
      </FilterSection>

      {/* Transmission */}
      <FilterSection title={t('auction.filters.transmission')} defaultOpen={false}>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isAutoChecked}
              onCheckedChange={() => handleTransmissionToggle('auto')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.automatic')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isManualChecked}
              onCheckedChange={() => handleTransmissionToggle('manual')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.manual')}</span>
          </label>
        </div>
      </FilterSection>

      {/* Fuel Type */}
      <FilterSection title={t('auction.filters.fuel_type')} defaultOpen={false}>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isPetrolChecked}
              onCheckedChange={() => handleFuelToggle('petrol')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.gasoline')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isDieselChecked}
              onCheckedChange={() => handleFuelToggle('diesel')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.diesel')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isHybridChecked}
              onCheckedChange={() => handleFuelToggle('hybrid')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.hybrid')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isElectricChecked}
              onCheckedChange={() => handleFuelToggle('electric')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.electric')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isFlexibleChecked}
              onCheckedChange={() => handleFuelToggle('flexible')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.flexible_fuel')}</span>
          </label>
        </div>
      </FilterSection>

      {/* Drive */}
      <FilterSection title={t('auction.filters.drive')} defaultOpen={false}>
        <div className="space-y-1">
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isFrontChecked}
              onCheckedChange={() => handleDriveToggle('front')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.front_wheel')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isRearChecked}
              onCheckedChange={() => handleDriveToggle('rear')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.rear_wheel')}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
            <Checkbox
              checked={isFullChecked}
              onCheckedChange={() => handleDriveToggle('full')}
              className="h-3.5 w-3.5 rounded-sm"
            />
            <span className="text-[11px] text-slate-700">{t('auction.filters.all_wheel')}</span>
          </label>
        </div>
      </FilterSection>

      {/* Sale Date */}
      <FilterSection title={t('auction.filters.sale_date')} defaultOpen={false}>
        <div className="space-y-1.5">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "h-7 w-full justify-start text-left text-[10px] px-2 bg-white border-slate-300 rounded-none font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-1.5 h-3 w-3" />
                {date ? (
                  new Date(date).toLocaleDateString('ka-GE', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })
                ) : (
                  <span>{t('auction.filters.select_date')}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date ? new Date(date) : undefined}
                onSelect={(selectedDate) => {
                  if (selectedDate) {
                    // Format date manually to avoid timezone conversion issues
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
                    const day = String(selectedDate.getDate()).padStart(2, '0');
                    const isoDate = `${year}-${month}-${day}`;
                    onDateChange?.(isoDate);
                  } else {
                    onDateChange?.(undefined);
                  }
                }}
                className="rounded-md border"
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {date && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-full text-[10px] text-slate-400 hover:text-slate-600"
              onClick={() => onDateChange?.(undefined)}
            >
              <Icon icon="mdi:close" className="w-3 h-3 mr-1" />
              {t('common.clear')}
            </Button>
          )}
          <div className="space-y-1">
            {[
              { value: 'today', label: t('auction.sale_date.today'), getDate: () => new Date() },
              { value: 'tomorrow', label: t('auction.sale_date.tomorrow'), getDate: () => { const d = new Date(); d.setDate(d.getDate() + 1); return d; } },
            ].map((preset) => {
              const presetDate = preset.getDate();
              const presetDateStr = presetDate.toISOString().split('T')[0];
              const isSelected = date === presetDateStr;
              return (
                <label key={preset.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onDateChange?.(presetDateStr);
                      } else {
                        onDateChange?.(undefined);
                      }
                    }}
                    className="h-3.5 w-3.5 rounded-sm"
                  />
                  <span className="text-[11px] text-slate-700">{preset.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      </FilterSection>

      {/* Location */}
      <FilterSection title={t('auction.filters.location')} defaultOpen={false}>
        <LocationCombobox
          cities={cities}
          selectedLocation={location}
          onLocationChange={(val) => onLocationChange?.(val === 'all' ? undefined : val)}
          isLoading={isLoadingCities}
          placeholder={t('auction.location.any')}
          searchPlaceholder={t('common.search')}
          noResultsText={t('common.no_results')}
        />
      </FilterSection>

      {/* Cylinders */}
      <FilterSection title={t('auction.filters.cylinders')} defaultOpen={false}>
        <div className="grid grid-cols-2 gap-1">
          {allowedCylinders.map((cyl) => (
            <label
              key={cyl}
              className="flex items-center gap-2 cursor-pointer px-1 py-0.5 rounded hover:bg-slate-50"
            >
              <Checkbox
                checked={isCylChecked(cyl)}
                onCheckedChange={() => handleCylindersToggle(cyl)}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{cyl}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Auction Source */}
      <FilterSection title={t('auction.filters.source')}>
        <div className="space-y-1">
          {[
            { value: 'copart', label: 'Copart' },
            { value: 'iaai', label: 'IAAI' },
          ].map((src) => (
            <label key={src.value} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
              <Checkbox
                checked={isSourceChecked(src.value)}
                onCheckedChange={() => handleSourceToggle(src.value)}
                className="h-3.5 w-3.5 rounded-sm"
              />
              <span className="text-[11px] text-slate-700">{src.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Buy Now Only */}
      <FilterSection title={t('auction.filters.buy_now')}>
        <label className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 px-1 py-0.5 rounded">
          <Checkbox
            checked={buyNow ?? false}
            onCheckedChange={(checked) => onBuyNowChange?.(checked === true)}
            className="h-3.5 w-3.5 rounded-sm"
          />
          <span className="text-[11px] text-slate-700">{t('auction.filters.buy_now_only')}</span>
        </label>
      </FilterSection>

      {/* Action Buttons */}
      <div className="p-2 bg-slate-50 border-t border-slate-200 space-y-1.5">
        <Button
          className="w-full h-7 text-[10px] bg-accent hover:bg-accent/90 text-primary font-bold"
          onClick={() => onApplyFilters?.()}
        >
          {t('auction.filters.apply')}
        </Button>
        <Button
          variant="outline"
          className="w-full h-7 text-[10px] border-slate-300 text-slate-600 hover:bg-slate-100"
          onClick={() => onResetFilters?.()}
        >
          {t('common.clear_all')}
        </Button>
      </div>
    </div>
  );
}
