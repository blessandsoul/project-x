import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Skeleton } from '@/components/ui/skeleton';
import { mockNavigationItems, mockFooterLinks } from '@/mocks/_mockData';
import { useVehiclePhotosMap } from '@/hooks/useVehiclePhotosMap';
import { useCompaniesData } from '@/hooks/useCompaniesData';
import { compareVehicles, fetchVehiclePhotos, searchVehicles } from '@/api/vehicles';
import type { VehiclesCompareResponse } from '@/api/vehicles';
import { fetchCatalogMakes, fetchCatalogModels } from '@/api/catalog';
import type { CatalogMake, CatalogModel, VehicleCatalogType } from '@/api/catalog';
import type { SearchVehiclesResponse, VehiclesSearchFilters } from '@/types/vehicles';
import { useCalculateVehicleQuotes } from '@/hooks/useCalculateVehicleQuotes';

type AuctionHouse = 'all' | 'Copart' | 'IAAI' | 'Manheim';
type LotStatus = 'all' | 'run' | 'enhanced' | 'non-runner';
type DamageType = 'all' | 'front' | 'rear' | 'side';
type SortOption = 'relevance' | 'price-low' | 'price-high' | 'year-new' | 'year-old';

// NOTE: mockCars-based auction listings were used earlier for mock/testing purposes.
// The page now relies solely on real API data via useVehicleSearchQuotes.

const getDeliveryRangeToPoti = (state: string): { min: number; max: number } => {
  switch (state) {
    case 'TX':
      return { min: 700, max: 900 };
    case 'FL':
      return { min: 650, max: 850 };
    case 'CA':
      return { min: 900, max: 1200 };
    case 'NJ':
      return { min: 750, max: 950 };
    default:
      return { min: 800, max: 1100 };
  }
};

const parseSearchQueryToFilters = (query: string): { make?: string; model?: string } => {
  if (!query) {
    return {};
  }

  const parts = query.split(/\s+/).filter(Boolean);

  if (parts.length === 1) {
    return { make: parts[0] };
  }

  return {
    make: parts[0],
    model: parts.slice(1).join(' '),
  };
};

type DraftFiltersInput = {
  searchQuery: string;
  exactYear: number | '';
  minMileage: number | '';
  maxMileage: number[];
  priceRange: number[];
  yearRange: number[];
  fuelType: string;
  category: string;
  drive: string;
  limit: number;
  page: number;
  searchKind: 'all' | 'car' | 'moto' | 'van';
  selectedMakeName?: string;
  selectedModelName?: string;
};

const buildFiltersFromDraftState = (
  input: DraftFiltersInput,
): VehiclesSearchFilters & { page: number; limit: number } => {
  const trimmed = input.searchQuery.trim().toLowerCase();
  const quickFilters = parseSearchQueryToFilters(trimmed);

  const hasExactYear = typeof input.exactYear === 'number' && !Number.isNaN(input.exactYear);
  const hasMinMileage = typeof input.minMileage === 'number' && !Number.isNaN(input.minMileage);

  let kindCategory: string | undefined;
  if (input.searchKind === 'car') {
    kindCategory = 'car';
  } else if (input.searchKind === 'moto') {
    kindCategory = 'motorcycle';
  } else if (input.searchKind === 'van') {
    kindCategory = 'van';
  }

  const baseFilters: VehiclesSearchFilters & { page: number; limit: number } = {
    ...quickFilters,
    make: input.selectedMakeName ?? quickFilters.make,
    model: input.selectedModelName ?? quickFilters.model,
    mileage_to: input.maxMileage[0],
    price_from: input.priceRange[0],
    price_to: input.priceRange[1],
    fuel_type: input.fuelType === 'all' ? undefined : input.fuelType,
    category: input.category === 'all' ? kindCategory : input.category,
    drive: input.drive === 'all' ? undefined : input.drive,
    limit: input.limit,
    page: input.page,
  };

  if (hasExactYear) {
    baseFilters.year = input.exactYear as number;
  } else {
    const fromYear = Math.min(input.yearRange[0], input.yearRange[1]);
    const toYear = Math.max(input.yearRange[0], input.yearRange[1]);
    baseFilters.year_from = fromYear;
    baseFilters.year_to = toYear;
  }

  if (hasMinMileage) {
    const fromMileage = Math.min(input.minMileage as number, input.maxMileage[0]);
    baseFilters.mileage_from = fromMileage;
  }

  return baseFilters;
};

const formatMoney = (
  value: number | string | null | undefined,
  currency: 'USD' | 'GEL' = 'USD',
): string | null => {
  if (value == null) return null;

  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;

  if (currency === 'GEL') {
    return `${numeric.toLocaleString()} GEL`;
  }

  return `$${numeric.toLocaleString()}`;
};

const AuctionListingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [auctionFilter, setAuctionFilter] = useState<AuctionHouse>('all');
  const [statusFilter, setStatusFilter] = useState<LotStatus>('all');
  const [damageFilter, setDamageFilter] = useState<DamageType>('all');
  const [priceRange, setPriceRange] = useState<number[]>([500, 30000]);
  const [yearRange, setYearRange] = useState<number[]>([2010, 2024]);
  const [maxMileage, setMaxMileage] = useState<number[]>([200000]);
  const [exactYear, setExactYear] = useState<number | ''>('');
  const [minMileage, setMinMileage] = useState<number | ''>('');
  const [fuelType, setFuelType] = useState('all');
  const [category, setCategory] = useState('all');
  const [drive, setDrive] = useState('all');
  const [limit, setLimit] = useState(20);
  const [page, setPage] = useState(1);
  const [buyNowOnly, setBuyNowOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedMakeId, setSelectedMakeId] = useState<string>('all');
  const [selectedModelId, setSelectedModelId] = useState<string>('all');
  const [catalogMakes, setCatalogMakes] = useState<CatalogMake[]>([]);
  const [catalogModels, setCatalogModels] = useState<CatalogModel[]>([]);
  const [isLoadingMakes, setIsLoadingMakes] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [searchKind, setSearchKind] = useState<'all' | 'car' | 'moto' | 'van'>('all');
  const [companySearch, setCompanySearch] = useState('');
  const [companyVipOnly, setCompanyVipOnly] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [showVinCodes, setShowVinCodes] = useState(false);
  const [backendGallery, setBackendGallery] = useState<{
    id: number;
    title: string;
    yardName: string | null;
    saleState: string | null;
    bestTotalPrice: number | null;
    distanceMiles: number | null;
    photos: string[];
  } | null>(null);
  const [backendGalleryIndex, setBackendGalleryIndex] = useState(0);
  const [searchValidationError, setSearchValidationError] = useState<string | null>(null);

  const [backendData, setBackendData] = useState<SearchVehiclesResponse | null>(null);
  const [isBackendLoading, setIsBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<
    (VehiclesSearchFilters & { page: number; limit: number }) | null
  >(null);
  const [appliedPage, setAppliedPage] = useState(1);
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);
  const { companies } = useCompaniesData();
  const [selectedVehicleIds, setSelectedVehicleIds] = useState<number[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isCompareLoading, setIsCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);
  const [compareResult, setCompareResult] = useState<VehiclesCompareResponse | null>(null);
  const [showCompareCheckboxes, setShowCompareCheckboxes] = useState(false);
  const [expandedQuoteKey, setExpandedQuoteKey] = useState<string | null>(null);
  const { data: calcData, isLoading: isCalcLoading, error: calcError, calculateQuotes } =
    useCalculateVehicleQuotes();
  const [isCalcModalOpen, setIsCalcModalOpen] = useState(false);

  const companySuggestions = useMemo(() => {
    if (!companies || companies.length === 0) {
      return [] as typeof companies;
    }

    const term = companySearch.trim().toLowerCase();
    if (!term) {
      return [] as typeof companies;
    }

    return companies
      .filter((company) => {
        if (companyVipOnly && !company.vipStatus) {
          return false;
        }

        return company.name.toLowerCase().includes(term);
      })
      .slice(0, 6);
  }, [companies, companySearch, companyVipOnly]);

  const companyFilterTerm = useMemo(() => {
    const fromSelected =
      selectedCompanyId && companies
        ? companies.find((company) => company.id === selectedCompanyId)?.name ?? ''
        : '';

    const base = fromSelected || companySearch;
    return base.trim().toLowerCase();
  }, [companies, selectedCompanyId, companySearch]);

  const getSelectedCompanyNameForLink = (): string | null => {
    if (selectedCompanyId && companies && companies.length > 0) {
      const matched = companies.find((company) => company.id === selectedCompanyId);
      if (matched?.name) {
        return matched.name;
      }
    }

    const trimmed = companySearch.trim();
    if (trimmed.length > 0) {
      return trimmed;
    }

    return null;
  };

  const vehicleCatalogType: VehicleCatalogType = useMemo(() => {
    if (searchKind === 'moto') {
      return 'motorcycle';
    }

    return 'car';
  }, [searchKind]);

  const selectedMakeName = useMemo(() => {
    if (selectedMakeId === 'all') {
      return undefined;
    }

    const matchedMake = catalogMakes.find((make) => String(make.makeId) === selectedMakeId);
    return matchedMake?.name;
  }, [selectedMakeId, catalogMakes]);

  const selectedModelName = useMemo(() => {
    if (selectedModelId === 'all') {
      return undefined;
    }

    const matchedModel = catalogModels.find((model) => String(model.modelId) === selectedModelId);
    return matchedModel?.name;
  }, [selectedModelId, catalogModels]);

  const updateUrlFromState = (options?: { page?: number; limit?: number; replace?: boolean }) => {
    const searchParams = new URLSearchParams(location.search);

    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length > 0) {
      searchParams.set('q', trimmedQuery);
    } else {
      searchParams.delete('q');
    }

    if (searchKind && searchKind !== 'all') {
      searchParams.set('kind', searchKind);
    } else {
      searchParams.delete('kind');
    }

    if (auctionFilter && auctionFilter !== 'all') {
      searchParams.set('auction', auctionFilter);
    } else {
      searchParams.delete('auction');
    }

    if (fuelType && fuelType !== 'all') {
      searchParams.set('fuel', fuelType);
    } else {
      searchParams.delete('fuel');
    }

    if (category && category !== 'all') {
      searchParams.set('category', category);
    } else {
      searchParams.delete('category');
    }

    if (drive && drive !== 'all') {
      searchParams.set('drive', drive);
    } else {
      searchParams.delete('drive');
    }

    const [yearFrom, yearTo] = yearRange;
    if (yearFrom !== 2010 || yearTo !== 2024) {
      searchParams.set('yearFrom', String(yearFrom));
      searchParams.set('yearTo', String(yearTo));
    } else {
      searchParams.delete('yearFrom');
      searchParams.delete('yearTo');
    }

    if (typeof exactYear === 'number' && !Number.isNaN(exactYear)) {
      searchParams.set('yearExact', String(exactYear));
    } else {
      searchParams.delete('yearExact');
    }

    if (maxMileage[0] !== 200000) {
      searchParams.set('maxMileage', String(maxMileage[0]));
    } else {
      searchParams.delete('maxMileage');
    }

    if (typeof minMileage === 'number' && !Number.isNaN(minMileage)) {
      searchParams.set('minMileage', String(minMileage));
    } else {
      searchParams.delete('minMileage');
    }

    if (priceRange[0] !== 500) {
      searchParams.set('priceMin', String(priceRange[0]));
    } else {
      searchParams.delete('priceMin');
    }

    if (priceRange[1] !== 30000) {
      searchParams.set('priceMax', String(priceRange[1]));
    } else {
      searchParams.delete('priceMax');
    }

    if (companySearch.trim().length > 0) {
      searchParams.set('company', companySearch.trim());
    } else {
      searchParams.delete('company');
    }

    if (companyVipOnly) {
      searchParams.set('vipOnly', '1');
    } else {
      searchParams.delete('vipOnly');
    }

    if (selectedCompanyId) {
      searchParams.set('companyId', selectedCompanyId);
    } else {
      searchParams.delete('companyId');
    }

    if (buyNowOnly) {
      searchParams.set('buyNow', '1');
    } else {
      searchParams.delete('buyNow');
    }

    if (showVinCodes) {
      searchParams.set('vin', '1');
    } else {
      searchParams.delete('vin');
    }

    if (sortBy && sortBy !== 'relevance') {
      searchParams.set('sort', sortBy);
    } else {
      searchParams.delete('sort');
    }

    const effectiveLimit = options?.limit ?? limit;
    if (effectiveLimit !== 20) {
      searchParams.set('limit', String(effectiveLimit));
    } else {
      searchParams.delete('limit');
    }

    const effectivePage = options?.page ?? appliedPage ?? 1;
    if (effectivePage > 1) {
      searchParams.set('page', String(effectivePage));
    } else {
      searchParams.delete('page');
    }

    const searchString = searchParams.toString();

    navigate(
      {
        pathname: location.pathname,
        search: searchString.length > 0 ? `?${searchString}` : '',
      },
      { replace: options?.replace ?? true },
    );
  };

  const activeFilterLabels = useMemo(
    () => {
      const labels: { id: string; label: string }[] = [];

      if (auctionFilter !== 'all') {
        labels.push({ id: 'auction', label: `აუქციონი: ${auctionFilter}` });
      }

      if (fuelType !== 'all') {
        labels.push({ id: 'fuel', label: `საწვავი: ${fuelType}` });
      }

      if (buyNowOnly) {
        labels.push({ id: 'buyNow', label: 'მხოლოდ Buy Now' });
      }

      if (showVinCodes) {
        labels.push({ id: 'vin', label: 'VIN კოდების ჩვენება' });
      }

      if (selectedMakeName) {
        labels.push({ id: 'make', label: `მარკა: ${selectedMakeName}` });
      }

      if (selectedModelName) {
        labels.push({ id: 'model', label: `მოდელი: ${selectedModelName}` });
      }

      if (companyFilterTerm) {
        labels.push({ id: 'company', label: `კომპანია: ${companyFilterTerm}` });
      }

      const hasExactYear = typeof exactYear === 'number' && !Number.isNaN(exactYear);
      if (hasExactYear) {
        labels.push({ id: 'yearExact', label: `წელი: ${exactYear}` });
      } else {
        labels.push({ id: 'yearRange', label: `წელი: ${yearRange[0]}-${yearRange[1]}` });
      }

      labels.push({ id: 'price', label: `ფასი: $${priceRange[0]}-$${priceRange[1]}` });

      return labels;
    },
    [
      auctionFilter,
      fuelType,
      buyNowOnly,
      showVinCodes,
      selectedMakeName,
      selectedModelName,
      companyFilterTerm,
      exactYear,
      yearRange,
      priceRange,
    ],
  );

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    // Parse all URL parameters into state values
    const nextSearchQuery = params.get('q') || '';
    const kindParam = params.get('kind');
    const nextSearchKind = (kindParam === 'all' || kindParam === 'car' || kindParam === 'moto' || kindParam === 'van') ? kindParam : 'all';

    const auctionParam = params.get('auction');
    const nextAuctionFilter = (auctionParam === 'all' || auctionParam === 'Copart' || auctionParam === 'IAAI' || auctionParam === 'Manheim') ? auctionParam as AuctionHouse : 'all';

    const fuelParam = params.get('fuel');
    const nextFuelType = (fuelParam && ['all', 'gas', 'diesel', 'hybrid', 'electric'].includes(fuelParam)) ? fuelParam : 'all';

    const categoryParam = params.get('category');
    const nextCategory = (categoryParam && ['all', 'suv', 'sedan', 'coupe', 'hatchback', 'pickup'].includes(categoryParam)) ? categoryParam : 'all';

    const driveParam = params.get('drive');
    const nextDrive = (driveParam && ['all', 'fwd', 'rwd', '4wd'].includes(driveParam)) ? driveParam : 'all';

    // Year range
    const yearFromParam = params.get('yearFrom');
    const yearToParam = params.get('yearTo');
    const nextYearRange = (yearFromParam && yearToParam) ? (() => {
      const from = Number(yearFromParam);
      const to = Number(yearToParam);
      return (Number.isFinite(from) && Number.isFinite(to)) ? [from, to] : [1990, new Date().getFullYear() + 1];
    })() : [1990, new Date().getFullYear() + 1];

    // Exact year
    const yearExactParam = params.get('yearExact');
    const nextExactYear = (yearExactParam !== null && yearExactParam !== '') ? (() => {
      const parsed = Number(yearExactParam);
      return Number.isNaN(parsed) ? '' : parsed;
    })() : '';

    // Mileage
    const maxMileageParam = params.get('maxMileage');
    const nextMaxMileage = maxMileageParam ? (() => {
      const parsed = Number(maxMileageParam);
      return (Number.isFinite(parsed) && parsed > 0) ? [parsed] : [200000];
    })() : [200000];

    const minMileageParam = params.get('minMileage');
    const nextMinMileage = (minMileageParam !== null && minMileageParam !== '') ? (() => {
      const parsed = Number(minMileageParam);
      return Number.isNaN(parsed) ? '' : parsed;
    })() : '';

    // Price range
    const priceMinParam = params.get('priceMin');
    const priceMaxParam = params.get('priceMax');
    const nextPriceRange = (priceMinParam && priceMaxParam) ? (() => {
      const min = Number(priceMinParam);
      const max = Number(priceMaxParam);
      return (Number.isFinite(min) && Number.isFinite(max)) ? [min, max] : [0, 50000];
    })() : [0, 50000];

    // Sort
    const sortParam = params.get('sort') as SortOption | null;
    const nextSortBy = (sortParam && ['relevance', 'price-low', 'price-high', 'year-new', 'year-old'].includes(sortParam)) ? sortParam : 'relevance';

    // Limit
    const limitParam = params.get('limit');
    const nextLimit = limitParam ? (() => {
      const parsed = Number(limitParam);
      return [10, 20, 30, 50].includes(parsed) ? parsed : 20;
    })() : 20;

    // Page
    const pageParam = params.get('page');
    const nextPage = pageParam ? (() => {
      const parsed = Number(pageParam);
      return (Number.isInteger(parsed) && parsed > 0) ? parsed : 1;
    })() : 1;

    // Company filters
    const nextCompanySearch = params.get('company') || '';
    const vipOnlyParam = params.get('vipOnly');
    const nextCompanyVipOnly = vipOnlyParam === '1' || vipOnlyParam === 'true';
    const companyIdParam = params.get('companyId');
    const nextSelectedCompanyId = (companyIdParam !== null && companyIdParam !== '') ? companyIdParam : null;

    // Build filters
    const filters = buildFiltersFromDraftState({
      searchQuery: nextSearchQuery,
      exactYear: nextExactYear,
      minMileage: nextMinMileage,
      maxMileage: nextMaxMileage,
      priceRange: nextPriceRange,
      yearRange: nextYearRange,
      fuelType: nextFuelType,
      category: nextCategory,
      drive: nextDrive,
      limit: nextLimit,
      page: nextPage,
      searchKind: nextSearchKind,
      selectedMakeName,
      selectedModelName,
    });

    // Set all state values
    setSearchQuery(nextSearchQuery);
    setSearchKind(nextSearchKind);
    setAuctionFilter(nextAuctionFilter);
    setFuelType(nextFuelType);
    setCategory(nextCategory);
    setDrive(nextDrive);
    setYearRange(nextYearRange);
    setExactYear(nextExactYear);
    setMaxMileage(nextMaxMileage);
    setMinMileage(nextMinMileage);
    setPriceRange(nextPriceRange);
    setSortBy(nextSortBy);
    setLimit(nextLimit);
    setCompanySearch(nextCompanySearch);
    setCompanyVipOnly(nextCompanyVipOnly);
    setSelectedCompanyId(nextSelectedCompanyId);
    setPage(nextPage);
    setAppliedFilters(filters);
    setAppliedPage(filters.page);
  }, [location.search, selectedMakeName, selectedModelName]);

  useEffect(() => {
    let isMounted = true;

    setIsLoadingMakes(true);

    fetchCatalogMakes(vehicleCatalogType)
      .then((items) => {
        if (!isMounted) return;
        setCatalogMakes(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setCatalogMakes([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingMakes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [vehicleCatalogType]);

  useEffect(() => {
    if (selectedMakeId === 'all') {
      setCatalogModels([]);
      return;
    }

    let isMounted = true;

    const parsedMakeId = Number.parseInt(selectedMakeId, 10);
    if (!Number.isFinite(parsedMakeId) || parsedMakeId <= 0) {
      setCatalogModels([]);
      return;
    }

    setIsLoadingModels(true);

    fetchCatalogModels(parsedMakeId, vehicleCatalogType)
      .then((items) => {
        if (!isMounted) return;
        setCatalogModels(items);
      })
      .catch(() => {
        if (!isMounted) return;
        setCatalogModels([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoadingModels(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedMakeId, vehicleCatalogType]);

  useEffect(() => {
    if (!appliedFilters) {
      return;
    }

    let isMounted = true;
    setIsBackendLoading(true);
    setBackendError(null);

    searchVehicles(appliedFilters)
      .then((result) => {
        if (!isMounted) return;
        setBackendData(result);
      })
      .catch((error: Error) => {
        if (!isMounted) return;
        setBackendError(error.message || 'Failed to load vehicles');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsBackendLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [appliedFilters]);

  const backendVehicleIds = useMemo(
    () => (backendData ? backendData.items.map((item) => item.vehicle_id ?? item.id) : []),
    [backendData],
  );

  const photosByVehicleId = useVehiclePhotosMap({ vehicleIds: backendVehicleIds });

  const randomCalcQuote = useMemo(() => {
    if (!calcData || !calcData.quotes || calcData.quotes.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * calcData.quotes.length);
    return calcData.quotes[index];
  }, [calcData]);

  type BackendData = NonNullable<typeof backendData>;
  type BackendItem = BackendData['items'][number];

  const filteredBackendItems: BackendItem[] = useMemo(() => {
    if (!backendData) {
      return [];
    }

    return backendData.items.filter((item) => {
      const byAuction =
        auctionFilter === 'all' ||
        (item.source && item.source.toLowerCase() === auctionFilter.toLowerCase());

      return byAuction;
    });
  }, [backendData, auctionFilter]);

  useEffect(() => {
    if (!backendData && !isBackendLoading && !backendError) {
      return;
    }
  }, [appliedFilters, isBackendLoading, backendError, backendData, filteredBackendItems]);

  const handleOpenBackendGallery = async (
    item: BackendItem,
    fallbackPhotoUrl: string,
  ) => {
    const vehicleKey = item.vehicle_id ?? item.id;

    setBackendGallery({
      id: vehicleKey,
      title: `${item.year} ${item.make} ${item.model}`,
      yardName: item.yard_name ?? null,
      saleState: item.source ?? null,
      bestTotalPrice:
        item.quotes && item.quotes.length > 0
          ? item.quotes.reduce(
            (min, quote) => (quote.total_price < min ? quote.total_price : min),
            item.quotes[0].total_price,
          )
          : null,
      distanceMiles: item.distance_miles ?? null,
      photos: [fallbackPhotoUrl],
    });
    setBackendGalleryIndex(0);

    try {
      const photos = await fetchVehiclePhotos(vehicleKey);
      const urls = Array.isArray(photos)
        ? photos
          .map((photo) => (photo.url || photo.thumb_url_middle || photo.thumb_url) ?? '')
          .filter((url) => url.length > 0)
        : [];

      if (urls.length > 0) {
        setBackendGallery((prev) => (prev ? { ...prev, photos: urls } : prev));
      }
    } catch {
      // keep fallback photo only
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />
      <main
        className="flex-1"
        role="main"
        aria-label="აქტიური აუქციონები"
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-bold">აქტიური აუქციონები</h1>
            <p className="text-muted-foreground">
              ნახეთ სასაჩვენო ლისტინგები COPART, IAAI და Manheim აუქციონებიდან და გამოიყენეთ სწრაფი
              ფილტრები თქვენთვის საინტერესო ლოტების საპოვნელად.
            </p>
          </div>
          <Card>
            <CardContent className="space-y-3">
              {/* Hero search: type + query + actions */}
              <section
                role="search"
                aria-label="ძირითადი ძებნა"
                className="flex flex-col gap-2 md:flex-row md:items-end md:gap-3"
              >
                <div className="space-y-1 w-full md:w-40">
                  <span className="text-xs text-muted-foreground">რა სახის ტრანსპორტი?</span>
                  <Select
                    value={searchKind}
                    onValueChange={(value) => {
                      const nextKind = value as typeof searchKind;
                      setSearchKind(nextKind);
                      setSelectedMakeId('all');
                      setSelectedModelId('all');
                      setCatalogModels([]);
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:car" className="h-4 w-4 text-muted-foreground" />
                        <SelectValue placeholder="ყველა" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="car">მანქანები</SelectItem>
                      <SelectItem value="moto">მოტოციკლები</SelectItem>
                      <SelectItem value="van">მიკროავტობუსები</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1 flex-1">
                  <span className="text-xs text-muted-foreground">ძებნა (მარკა, მოდელი ან VIN)</span>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="მაგ: BMW X5, Camry 2018, JTMBFREV7JD123456"
                      value={searchQuery}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSearchQuery(value);

                        const trimmed = value.trim();
                        if (trimmed.length === 0 || trimmed.length >= 4) {
                          setSearchValidationError(null);
                        }
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          const trimmed = searchQuery.trim();
                          if (trimmed.length > 0 && trimmed.length < 4) {
                            setSearchValidationError('მინ. 4 სიმბოლო ძიებისთვის');
                            return;
                          }

                          setPage(1);
                          setAppliedPage(1);
                          updateUrlFromState({ page: 1, replace: false });
                        }
                      }}
                      className="h-9 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-9 w-9"
                      aria-label="დამატებითი ფილტრები"
                      onClick={() => setIsAdvancedFiltersOpen(true)}
                    >
                      <Icon icon="mdi:tune" className="h-4 w-4" />
                    </Button>
                  </div>
                  {searchValidationError && (
                    <span className="text-[10px] text-destructive block mt-0.5">{searchValidationError}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 md:flex-col md:items-stretch md:w-auto">
                  <div className="flex items-stretch">
                    <Button
                      type="button"
                      size="sm"
                      className="bg-orange-500 hover:bg-orange-600 text-white rounded-r-none px-4"
                      onClick={() => {
                        const trimmed = searchQuery.trim();
                        if (trimmed.length > 0 && trimmed.length < 4) {
                          setSearchValidationError('მინ. 4 სიმბოლო ძიებისთვის');
                          return;
                        }

                        setPage(1);
                        setAppliedPage(1);
                        updateUrlFromState({ page: 1, replace: false });
                      }}
                    >
                      ძებნა
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          className="bg-orange-500 hover:bg-orange-600 text-white border-l border-orange-600 rounded-l-none px-2"
                          aria-label="ფილტრები"
                        >
                          <Icon icon="mdi:chevron-down" className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedMakeId('all');
                            setSelectedModelId('all');
                            setCatalogModels([]);
                            setYearRange([2010, 2024]);
                            setPriceRange([500, 30000]);
                            setAuctionFilter('all');
                            setFuelType('all');
                            setShowVinCodes(false);
                            setBuyNowOnly(false);
                            setSortBy('relevance');
                            setSearchQuery('');
                            setExactYear('');
                            setMinMileage('');
                            setCategory('all');
                            setDrive('all');
                            setLimit(20);
                            setPage(1);
                            setAppliedFilters(null);
                            setAppliedPage(1);
                            setBackendData(null);
                            setBackendError(null);
                            setSearchValidationError(null);
                            updateUrlFromState({ page: 1, limit: 20, replace: false });
                          }}
                        >
                          <Icon icon="mdi:filter-remove" className="mr-2 h-4 w-4" />
                          ფილტრების განულება
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </section>

              {/* Quick filters row: make/model, year, price, auction, fuel, VIN, Buy now */}
              <section
                aria-label="სწრაფი ფილტრები"
                className="flex flex-wrap items-center gap-1 text-xs"
              >
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">მარკა</span>
                  <Select
                    value={selectedMakeId}
                    onValueChange={(value) => {
                      setSelectedMakeId(value);
                      setSelectedModelId('all');
                      setCatalogModels([]);
                    }}
                    disabled={isLoadingMakes}
                  >
                    <SelectTrigger className="h-8">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:car-info" className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="აირჩიეთ მარკა" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      {catalogMakes.map((make) => (
                        <SelectItem key={make.makeId} value={String(make.makeId)}>
                          {make.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">მოდელი</span>
                  <Select
                    value={selectedModelId}
                    onValueChange={(value) => setSelectedModelId(value)}
                    disabled={selectedMakeId === 'all' || isLoadingModels}
                  >
                    <SelectTrigger className="h-8">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:car-info" className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue
                          placeholder={
                            selectedMakeId !== 'all' ? 'აირჩიეთ მოდელი' : 'ჯერ აირჩიეთ მარკა'
                          }
                        />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      {catalogModels.map((model) => (
                        <SelectItem key={model.modelId} value={String(model.modelId)}>
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">წელი</span>
                  <Select
                    value="all"
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setYearRange([2010, 2024]);
                      } else if (value === '2015+') {
                        setYearRange([2015, yearRange[1]]);
                      } else if (value === '2018+') {
                        setYearRange([2018, yearRange[1]]);
                      } else if (value === '2020+') {
                        setYearRange([2020, yearRange[1]]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:calendar-range" className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder={`ძ. ${yearRange[0]} - ${yearRange[1]}`} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="2015+">2015+</SelectItem>
                      <SelectItem value="2018+">2018+</SelectItem>
                      <SelectItem value="2020+">2020+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">ფასი</span>
                  <Select
                    value="all"
                    onValueChange={(value) => {
                      if (value === 'all') {
                        setPriceRange([500, 30000]);
                      } else if (value === 'to10000') {
                        setPriceRange([500, 10000]);
                      } else if (value === '10-20') {
                        setPriceRange([10000, 20000]);
                      } else if (value === '20+') {
                        setPriceRange([20000, 30000]);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:currency-usd" className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder={`$${priceRange[0]} - $${priceRange[1]}`} />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="to10000">მდე $10 000</SelectItem>
                      <SelectItem value="10-20">$10 000 - $20 000</SelectItem>
                      <SelectItem value="20+">$20 000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">აუქციონი</span>
                  <Select
                    value={auctionFilter}
                    onValueChange={(value) => setAuctionFilter(value as AuctionHouse)}
                  >
                    <SelectTrigger className="h-8">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:gavel" className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="ყველა" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="Copart">COPART</SelectItem>
                      <SelectItem value="IAAI">IAAI</SelectItem>
                      <SelectItem value="Manheim">Manheim</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">საწვავი</span>
                  <Select
                    value={fuelType}
                    onValueChange={(value) => setFuelType(value)}
                  >
                    <SelectTrigger className="h-8">
                      <div className="flex items-center gap-1">
                        <Icon icon="mdi:gas-station" className="h-3.5 w-3.5 text-muted-foreground" />
                        <SelectValue placeholder="ყველა" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">ყველა</SelectItem>
                      <SelectItem value="gas">ბენზინი</SelectItem>
                      <SelectItem value="diesel">დიზელი</SelectItem>
                      <SelectItem value="hybrid">ჰიბრიდი</SelectItem>
                      <SelectItem value="electric">ელექტრო</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="buy-now-only"
                      checked={buyNowOnly}
                      onCheckedChange={(checked) => setBuyNowOnly(!!checked)}
                    />
                    <label htmlFor="buy-now-only" className="cursor-pointer">
                      მხოლოდ Buy Now ლოტები
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="vin-only"
                      checked={showVinCodes}
                      onCheckedChange={(checked) => setShowVinCodes(!!checked)}
                    />
                    <label htmlFor="vin-only" className="cursor-pointer">
                      VIN კოდების ჩვენება
                    </label>
                  </div>
                </div>
              </section>
            </CardContent>
          </Card>

          <Sheet open={isAdvancedFiltersOpen} onOpenChange={setIsAdvancedFiltersOpen}>
            <SheetContent side="right" aria-label="დამატებითი ფილტრები">
              <SheetHeader>
                <SheetTitle>დამატებითი ფილტრები</SheetTitle>
              </SheetHeader>
              <motion.div
                className="flex-1 overflow-y-auto px-4 pb-4 space-y-6 mt-2 text-sm"
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 40 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {/* Company and brand/model filters */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">კომპანია / იმპორტიორი</h3>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">კომპანიით ძიება</span>
                    <Input
                      placeholder="მაგ: Premium Auto Import..."
                      value={companySearch}
                      onChange={(event) => {
                        setCompanySearch(event.target.value);
                        setSelectedCompanyId(null);
                      }}
                      className="h-9 text-xs"
                    />
                  </div>

                  {companySuggestions.length > 0 && (
                    <div className="mt-1 border rounded-md bg-background shadow-sm max-h-40 overflow-y-auto text-xs">
                      {companySuggestions.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          className="w-full text-left px-2 py-1 hover:bg-muted flex items-center justify-between gap-2"
                          onClick={() => {
                            setCompanySearch(company.name);
                            setSelectedCompanyId(company.id);
                          }}
                        >
                          <span className="truncate">{company.name}</span>
                          {company.vipStatus && (
                            <span className="text-[10px] text-orange-500">VIP</span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Checkbox
                      id="company-vip-only"
                      checked={companyVipOnly}
                      onCheckedChange={(checked) => setCompanyVipOnly(!!checked)}
                    />
                    <label htmlFor="company-vip-only" className="text-xs">
                      მხოლოდ VIP კომპანიები
                    </label>
                  </div>

                  {selectedCompanyId && (
                    <p className="text-[11px] text-muted-foreground">
                      ნაჩვენებია მხოლოდ ლოტები, სადაც ამ კომპანიის შეთავაზებებია.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">ბრენდი და მოდელი</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">მარკა</span>
                      <Select
                        value={selectedMakeId}
                        onValueChange={(value) => {
                          setSelectedMakeId(value);
                          setSelectedModelId('all');
                          setCatalogModels([]);
                        }}
                        disabled={isLoadingMakes}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="აირჩიეთ მარკა" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ყველა</SelectItem>
                          {catalogMakes.map((make) => (
                            <SelectItem key={make.makeId} value={String(make.makeId)}>
                              {make.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">მოდელი</span>
                      <Select
                        value={selectedModelId}
                        onValueChange={(value) => setSelectedModelId(value)}
                        disabled={selectedMakeId === 'all' || isLoadingModels}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue
                            placeholder={
                              selectedMakeId !== 'all' ? 'აირჩიეთ მოდელი' : 'ჯერ აირჩიეთ მარკა'
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ყველა</SelectItem>
                          {catalogModels.map((model) => (
                            <SelectItem key={model.modelId} value={String(model.modelId)}>
                              {model.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">ინფორმაცია ავტომობილზე</h3>
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground block">
                      წელი: {yearRange[0]} - {yearRange[1]}
                    </span>
                    <Slider
                      value={yearRange}
                      min={2010}
                      max={2024}
                      step={1}
                      onValueChange={setYearRange}
                    />
                    <span className="text-xs text-muted-foreground block">
                      მაქს. გარბენი: {maxMileage[0].toLocaleString()} km
                    </span>
                    <Slider
                      value={maxMileage}
                      min={20000}
                      max={250000}
                      step={10000}
                      onValueChange={setMaxMileage}
                    />
                    <span className="text-xs text-muted-foreground block">ზუსტი წელი / მინ. გარბენი</span>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        placeholder=" напр. 2018"
                        className="h-9 text-xs"
                        value={exactYear === '' ? '' : String(exactYear)}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === '') {
                            setExactYear('');
                            return;
                          }

                          const parsed = Number(value);
                          setExactYear(Number.isNaN(parsed) ? '' : parsed);
                        }}
                      />
                      <Input
                        type="number"
                        placeholder="min km"
                        className="h-9 text-xs"
                        value={minMileage === '' ? '' : String(minMileage)}
                        onChange={(event) => {
                          const value = event.target.value;
                          if (value === '') {
                            setMinMileage('');
                            return;
                          }

                          const parsed = Number(value);
                          setMinMileage(Number.isNaN(parsed) ? '' : parsed);
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">ფასი</h3>
                  <span className="text-xs text-muted-foreground block">
                    ${priceRange[0]} - ${priceRange[1]}
                  </span>
                  <Slider
                    value={priceRange}
                    min={500}
                    max={30000}
                    step={500}
                    onValueChange={setPriceRange}
                  />
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">ტექნიკური მონაცემები</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">საწვავი</span>
                      <Select
                        value={fuelType}
                        onValueChange={(value) => setFuelType(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="ყველა" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ყველა</SelectItem>
                          <SelectItem value="gas">ბენზინი</SelectItem>
                          <SelectItem value="diesel">დიზელი</SelectItem>
                          <SelectItem value="hybrid">ჰიბრიდი</SelectItem>
                          <SelectItem value="electric">ელექტრო</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">კატეგორია</span>
                      <Select
                        value={category}
                        onValueChange={(value) => setCategory(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="ყველა" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ყველა</SelectItem>
                          <SelectItem value="suv">SUV</SelectItem>
                          <SelectItem value="sedan">Sedan</SelectItem>
                          <SelectItem value="coupe">Coupe</SelectItem>
                          <SelectItem value="hatchback">Hatchback</SelectItem>
                          <SelectItem value="pickup">Pickup</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">წამყვანი</span>
                      <Select
                        value={drive}
                        onValueChange={(value) => setDrive(value)}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="ყველა" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">ყველა</SelectItem>
                          <SelectItem value="fwd">FWD</SelectItem>
                          <SelectItem value="rwd">RWD</SelectItem>
                          <SelectItem value="4wd">4WD / AWD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-muted-foreground">რაოდენობა ერთ გვერდზე</span>
                      <Select
                        value={String(limit)}
                        onValueChange={(value) => {
                          const parsed = Number(value);
                          setLimit(parsed);
                          setPage(1);
                        }}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="20" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                          <SelectItem value="30">30</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </motion.div>

              <SheetFooter>
                <div className="flex w-full items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAuctionFilter('all');
                      setStatusFilter('all');
                      setDamageFilter('all');
                      setPriceRange([500, 30000]);
                      setYearRange([2010, 2024]);
                      setMaxMileage([200000]);
                      setExactYear('');
                      setMinMileage('');
                      setFuelType('all');
                      setCategory('all');
                      setDrive('all');
                      setLimit(20);
                      setPage(1);
                      setBuyNowOnly(false);
                      setSearchQuery('');
                      setSortBy('relevance');
                      setAppliedFilters(null);
                      setAppliedPage(1);
                      setBackendData(null);
                      setBackendError(null);
                      setSearchValidationError(null);
                      updateUrlFromState({ page: 1, limit: 20, replace: false });
                    }}
                  >
                    ფილტრების განულება
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      const trimmed = searchQuery.trim();
                      if (trimmed.length > 0 && trimmed.length < 4) {
                        setSearchValidationError('მინ. 4 სიმბოლო ძიებისთვის');
                        return;
                      }

                      setPage(1);
                      setAppliedPage(1);
                      updateUrlFromState({ page: 1, replace: false });
                      setIsAdvancedFiltersOpen(false);
                    }}
                  >
                    გამოყენება
                  </Button>
                </div>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <div
            className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs text-muted-foreground"
            aria-live="polite"
          >
            <div className="flex flex-col gap-0.5">
              <span>
                {isBackendLoading && 'იტვირთება რეალური აუქციონის მონაცემები...'}
                {!isBackendLoading && backendError && backendError}
                {!isBackendLoading && !backendError && backendData && (
                  backendData.total > 0
                    ? `ნაჩვენებია ${filteredBackendItems.length} ლოტი ${backendData.total}-დან (რეალური API)`
                    : 'ამ ფილტრებით ვერ მოიძებნა მანქანები'
                )}
              </span>
              {!isBackendLoading && !backendError && backendData && backendData.total > 0 && (
                <span className="text-[11px] text-muted-foreground">
                  ნაპოვნი მანქანები: {backendData.total}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1 md:justify-end">
              {activeFilterLabels.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className="focus:outline-none"
                  onClick={() => {
                    switch (item.id) {
                      case 'auction':
                        setAuctionFilter('all');
                        break;
                      case 'fuel':
                        setFuelType('all');
                        break;
                      case 'buyNow':
                        setBuyNowOnly(false);
                        break;
                      case 'vin':
                        setShowVinCodes(false);
                        break;
                      case 'make':
                        setSelectedMakeId('all');
                        setSelectedModelId('all');
                        setCatalogModels([]);
                        break;
                      case 'model':
                        setSelectedModelId('all');
                        break;
                      case 'company':
                        setCompanySearch('');
                        setSelectedCompanyId(null);
                        break;
                      case 'yearExact':
                        setExactYear('');
                        break;
                      case 'yearRange':
                        setYearRange([2010, 2024]);
                        break;
                      case 'price':
                        setPriceRange([500, 30000]);
                        break;
                      default:
                        break;
                    }
                    setPage(1);
                    setAppliedPage(1);
                    updateUrlFromState({ page: 1, replace: false });
                  }}
                >
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5">
                    {item.label}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

          {/* Backend-powered results only */}
          <div className="space-y-3 mt-2">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold">რეალური შედეგები (Vehicles + Quotes API)</h2>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="hidden sm:inline">დალაგება:</span>
                <Select
                  value={sortBy}
                  onValueChange={(value) => setSortBy(value as SortOption)}
                >
                  <SelectTrigger className="h-8 w-[150px]">
                    <SelectValue placeholder="დალაგება" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">რელევანტურობით</SelectItem>
                    <SelectItem value="price-low">ფასი (დაბალი)</SelectItem>
                    <SelectItem value="price-high">ფასი (მაღალი)</SelectItem>
                    <SelectItem value="year-new">წელი (ახალი)</SelectItem>
                    <SelectItem value="year-old">წელი (ძველი)</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 px-3 text-[11px]"
                  variant="outline"
                  onClick={() => {
                    if (!showCompareCheckboxes) {
                      setShowCompareCheckboxes(true);
                      return;
                    }

                    if (showCompareCheckboxes && selectedVehicleIds.length === 0) {
                      setShowCompareCheckboxes(false);
                      return;
                    }
                  }}
                  aria-label="ავტომობილების შედარება ფასებით"
                >
                  ფასების შედარება{selectedVehicleIds.length > 0 ? ` (${selectedVehicleIds.length})` : ''}
                </Button>
                {showCompareCheckboxes && selectedVehicleIds.length === 1 && (
                  <span className="text-[10px] text-orange-600">
                    მინიმუმ 2 კომპანია აირჩიეთ შესადარებლად
                  </span>
                )}
              </div>
            </div>
            {isBackendLoading && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3" aria-busy="true">
                {Array.from({ length: 6 }).map((_, index) => (
                  <Card key={index} className="overflow-hidden flex flex-col">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="pt-3 space-y-2 text-xs">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isBackendLoading && backendError && (
              <Card className="border-destructive/40 bg-destructive/5 text-xs">
                <CardContent className="py-3 flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-destructive">ვერ მოხერხდა რეალური მონაცემების ჩატვირთვა</span>
                    <span className="text-[11px] text-muted-foreground break-words">
                      {backendError}
                    </span>
                  </div>
                  {appliedFilters && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-3 text-[11px]"
                      onClick={() => {
                        // перезапуск последнего поиска
                        setAppliedFilters({ ...appliedFilters });
                      }}
                    >
                      თავიდან ცდა
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {!isBackendLoading && !backendError && backendData && filteredBackendItems.length === 0 && (
              <Card className="text-xs">
                <CardContent className="py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">ამ ფილტრებით ვერ მოიძებნა მანქანები</span>
                    <span className="text-[11px] text-muted-foreground">
                      სცადეთ ფილტრების განულება ან შეცვლა და კიდევ ერთხელ სცადეთ.
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-3 text-[11px]"
                    onClick={() => {
                      setAuctionFilter('all')
                      setStatusFilter('all')
                      setDamageFilter('all')
                      setPriceRange([500, 30000])
                      setYearRange([2010, 2024])
                      setMaxMileage([200000])
                      setExactYear('')
                      setMinMileage('')
                      setFuelType('all')
                      setCategory('all')
                      setDrive('all')
                      setLimit(20)
                      setPage(1)
                      setBuyNowOnly(false)
                      setSearchQuery('')
                      setSortBy('relevance')
                      updateUrlFromState({ page: 1, limit: 20, replace: false })
                    }}
                  >
                    ფილტრების განულება
                  </Button>
                </CardContent>
              </Card>
            )}

            {!isBackendLoading && !backendError && backendData && filteredBackendItems.length > 0 && (
              <>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    გვერდი {appliedPage} / {backendData.totalPages ?? Math.max(1, Math.ceil(backendData.total / limit))}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      disabled={!appliedFilters || appliedPage <= 1}
                      onClick={() => {
                        if (!appliedFilters || appliedPage <= 1) return;
                        const nextPage = appliedPage - 1;
                        setPage(nextPage);
                        setAppliedPage(nextPage);
                        updateUrlFromState({ page: nextPage, replace: false });
                      }}
                    >
                      წინა
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      disabled={
                        !appliedFilters ||
                        !backendData ||
                        appliedPage >=
                        (backendData.totalPages ?? Math.max(1, Math.ceil(backendData.total / limit)))
                      }
                      onClick={() => {
                        if (!appliedFilters || !backendData) return;
                        const maxPage = backendData.totalPages ?? Math.max(1, Math.ceil(backendData.total / limit));
                        const nextPage = appliedPage >= maxPage ? appliedPage : appliedPage + 1;
                        if (nextPage === appliedPage) return;
                        setPage(nextPage);
                        setAppliedPage(nextPage);
                        updateUrlFromState({ page: nextPage, replace: false });
                      }}
                    >
                      შემდეგი
                    </Button>
                  </div>
                </div>
                <div
                  className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
                  aria-label="რეალური ლოტების შედეგები"
                >
                  {filteredBackendItems.map((item) => {
                    const vehicleKey = item.vehicle_id ?? item.id;
                    const extraPhotoUrls = photosByVehicleId[vehicleKey] || [];
                    const mainPhotoUrl =
                      item.primary_photo_url || item.primary_thumb_url || extraPhotoUrls[0] || '/cars/1.webp';
                    const priceRaw =
                      typeof item.calc_price === 'number'
                        ? item.calc_price
                        : typeof item.retail_value === 'number'
                          ? item.retail_value
                          : Number(item.retail_value ?? 0);
                    const displayPrice = Number.isFinite(priceRaw) ? Math.max(0, priceRaw) : 0;

                    const isSelected = selectedVehicleIds.includes(vehicleKey);

                    return (
                      <Card key={`${item.id}-${item.make}-${item.model}`} className="overflow-hidden flex flex-col p-0">
                        <div className="relative w-full">
                          <button
                            type="button"
                            className="relative w-full h-40 overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/60"
                            onClick={() => handleOpenBackendGallery(item, mainPhotoUrl)}
                          >
                            <img
                              src={mainPhotoUrl}
                              alt={`${item.year} ${item.make} ${item.model}`}
                              className="absolute inset-0 h-full w-full object-cover"
                              loading="lazy"
                            />
                          </button>
                          <AnimatePresence>
                            {showCompareCheckboxes && (
                              <motion.div
                                key="compare-checkbox"
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -8 }}
                                transition={{ duration: 0.18, ease: 'easeOut' }}
                                className="absolute top-1 left-1 flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[10px] text-white z-10"
                                onClick={(event) => event.stopPropagation()}
                              >
                                <span>შედარებისთვის არჩევა</span>
                                <Checkbox
                                  aria-label="აირჩიეთ მანქანა შედარებისთვის"
                                  checked={isSelected}
                                  onCheckedChange={(checked) => {
                                    setSelectedVehicleIds((prev) => {
                                      const exists = prev.includes(vehicleKey);
                                      if (checked && !exists) {
                                        const next = [...prev, vehicleKey];
                                        if (next.length > 5) {
                                          return prev;
                                        }
                                        return next;
                                      }
                                      if (!checked && exists) {
                                        return prev.filter((id) => id !== vehicleKey);
                                      }
                                      return prev;
                                    });
                                  }}
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        {extraPhotoUrls.length > 1 && (
                          <div className="flex items-center gap-1 px-2 pt-0.5 pb-1 overflow-x-auto">
                            {extraPhotoUrls.slice(0, 3).map((thumbUrl, index) => (
                              <button
                                key={`${item.id}-thumb-${index}`}
                                type="button"
                                className="h-10 w-14 flex-shrink-0 overflow-hidden rounded-sm border border-border hover:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/60"
                                onClick={() => handleOpenBackendGallery(item, thumbUrl)}
                              >
                                <img
                                  src={thumbUrl}
                                  alt={`${item.year} ${item.make} ${item.model} thumb ${index + 1}`}
                                  className="h-full w-full object-cover"
                                  loading="lazy"
                                />
                              </button>
                            ))}
                          </div>
                        )}
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-base leading-tight">
                                {item.year} {item.make} {item.model}
                              </CardTitle>
                              <p className="text-[11px] text-muted-foreground mt-1">
                                {item.yard_name} • {item.source}
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0 flex-1 flex flex-col justify-between text-xs">
                          <div className="space-y-2 mb-3">
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                              <div>
                                <span className="block text-[10px] text-muted-foreground">გარბენი</span>
                                <span>{item.mileage ? item.mileage.toLocaleString() : 'N/A'} km</span>
                              </div>
                              <div>
                                <span className="block text-[10px] text-muted-foreground">დისტანცია</span>
                                <span>
                                  {item.distance_miles != null
                                    ? item.distance_miles.toLocaleString()
                                    : 'N/A'}{' '}
                                  mi
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-3 pb-2 border-t mt-auto">
                            <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Icon icon="mdi:chart-line" className="h-3 w-3 text-primary" />
                                <span className="font-medium">
                                  ${displayPrice.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="ღირებულების გათვლა"
                                onClick={() => {
                                  const vehicleKey = item.vehicle_id ?? item.id;
                                  calculateQuotes(vehicleKey).then(() => {
                                    setIsCalcModalOpen(true);
                                  });
                                }}
                              >
                                <Icon icon="mdi:calculator-variant" className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                aria-label="დეტალურად ნახვა"
                                onClick={() => {
                                  const vehicleKey = item.vehicle_id ?? item.id;
                                  const companyName = getSelectedCompanyNameForLink();
                                  const search = companyName
                                    ? `?company=${encodeURIComponent(companyName)}`
                                    : '';

                                  navigate({
                                    pathname: `/vehicle/${vehicleKey}`,
                                    search,
                                  });
                                }}
                              >
                                <Icon icon="mdi:eye-outline" className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <AnimatePresence>
            {isCompareOpen && (
              <motion.div
                className="fixed inset-0 z-50 bg-black/90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => setIsCompareOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-label="შერჩეული მანქანების ფასების შედარება"
              >
                <div className="fixed inset-0 px-2 sm:px-4 py-4 sm:py-8 overflow-y-auto pointer-events-none">
                  <motion.div
                    className="relative left-1/2 top-1/2 z-[55] w-full max-w-5xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg overflow-y-auto flex flex-col pointer-events-auto"
                    initial={{ scale: 0.96, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.96, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <div className="flex flex-col gap-0.5 text-[11px]">
                        <div className="font-medium text-sm truncate">
                          შერჩეული მანქანების ფასების შედარება
                        </div>
                        <div className="text-muted-foreground">
                          ნახეთ ყველაზე მომგებიანი სრული ფასები და მიწოდების დრო რამდენიმე მანქანისთვის ერთად.
                        </div>
                        {compareResult && compareResult.vehicles.length > 0 && (
                          <div className="text-muted-foreground">
                            შედარებაში: {compareResult.vehicles.length} მანქანა
                          </div>
                        )}
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-7 w-7 text-[11px] transition-all duration-200 hover:bg-destructive hover:text-destructive-foreground"
                          onClick={() => setIsCompareOpen(false)}
                          aria-label="დახურვა"
                        >
                          <motion.div
                            animate={{ rotate: 0 }}
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                          >
                            <Icon icon="mdi:close" className="h-3 w-3" />
                          </motion.div>
                        </Button>
                      </motion.div>
                    </div>

                    <div className="px-4 py-3 text-xs space-y-3">
                      {isCompareLoading && (
                        <div className="space-y-2" aria-busy="true">
                          <Skeleton className="h-4 w-1/3" />
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-3 w-5/6" />
                        </div>
                      )}

                      {!isCompareLoading && compareError && (
                        <Card className="border-destructive/40 bg-destructive/5">
                          <CardContent className="py-3 text-[11px]">
                            {compareError}
                          </CardContent>
                        </Card>
                      )}

                      {!isCompareLoading && !compareError && compareResult && compareResult.vehicles.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">
                          შერჩეული მანქანებისთვის შეთავაზებები ვერ მოიძებნა.
                        </p>
                      )}

                      {!isCompareLoading && !compareError && compareResult && compareResult.vehicles.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>ვალუტა: {compareResult.currency}</span>
                            <span>შედარებაში: {compareResult.vehicles.length} მანქანა</span>
                          </div>
                          <div
                            className={
                              compareResult.vehicles.length === 2
                                ? 'grid gap-3 md:grid-cols-2'
                                : 'grid gap-3 md:grid-cols-2 lg:grid-cols-3'
                            }
                          >
                            {compareResult.vehicles.map((vehicle) => {
                              const backendItem = backendData?.items.find(
                                (item) => (item.vehicle_id ?? item.id) === vehicle.vehicle_id,
                              );
                              const extraPhotos = backendItem ? photosByVehicleId[vehicle.vehicle_id] || [] : [];
                              const thumbnailUrl =
                                backendItem?.primary_photo_url ||
                                backendItem?.primary_thumb_url ||
                                extraPhotos[0] ||
                                '/cars/1.webp';
                              const sortedQuotes = [...vehicle.quotes].sort((a, b) => {
                                const aRaw = a.total_price as number | string;
                                const bRaw = b.total_price as number | string;
                                const aNum = typeof aRaw === 'number' ? aRaw : Number(aRaw);
                                const bNum = typeof bRaw === 'number' ? bRaw : Number(bRaw);
                                return (Number.isFinite(aNum) ? aNum : 0) - (Number.isFinite(bNum) ? bNum : 0);
                              });

                              const bestQuote = sortedQuotes[0] ?? null;

                              const getCompanyOnlyPrice = (quote: (typeof vehicle.quotes)[number]) => {
                                const total = quote.breakdown?.total_price ?? quote.total_price;
                                const car = quote.breakdown?.retail_value ?? 0;
                                const totalNum = typeof total === 'number' ? total : Number(total);
                                const carNum = typeof car === 'number' ? car : Number(car);

                                if (!Number.isFinite(totalNum)) return null;
                                const company = totalNum - (Number.isFinite(carNum) ? carNum : 0);
                                return company > 0 ? company : null;
                              };

                              return (
                                <Card key={vehicle.vehicle_id} className="text-sm">
                                  <CardHeader className="pb-1 flex flex-row items-start gap-3">
                                    <div className="h-14 w-20 flex-shrink-0 overflow-hidden rounded border border-border bg-muted">
                                      <img
                                        src={thumbnailUrl}
                                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                        className="h-full w-full object-cover"
                                        loading="lazy"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <CardTitle className="text-base font-semibold truncate">
                                        {vehicle.year} {vehicle.make} {vehicle.model}
                                      </CardTitle>
                                      {vehicle.yard_name && (
                                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                                          {vehicle.yard_name} • {vehicle.source}
                                        </p>
                                      )}
                                    </div>
                                  </CardHeader>
                                  <CardContent className="pt-1 space-y-2">
                                    {bestQuote && (
                                      <div className="p-2 rounded-md border bg-muted/40 flex items-center justify-between gap-2">
                                        <div className="space-y-0.5">
                                          <div className="text-[11px] text-muted-foreground">
                                            ფასი მხოლოდ კომპანიის მომსახურებისთვის (მანქანის ფასის გარეშე)
                                          </div>
                                          <div className="text-base font-semibold text-emerald-600">
                                            {formatMoney(getCompanyOnlyPrice(bestQuote) ?? bestQuote.total_price, compareResult.currency) ?? '—'}
                                          </div>
                                          {bestQuote.delivery_time_days != null && (
                                            <div className="text-[11px] text-muted-foreground">
                                              მიწოდების მიახლოებითი დრო: {bestQuote.delivery_time_days} დღე
                                            </div>
                                          )}
                                        </div>
                                        <span className="text-[11px] font-medium text-foreground">
                                          {bestQuote.company_name}
                                        </span>
                                      </div>
                                    )}

                                    <div
                                      className="space-y-1.5"
                                      role="list"
                                      aria-label="კომპანიების შეთავაზებები ამ მანქანისთვის"
                                    >
                                      {sortedQuotes.slice(0, 3).map((quote) => {
                                        const companyOnly = getCompanyOnlyPrice(quote);
                                        const quoteKey = `${vehicle.vehicle_id}-${quote.company_name}-${quote.total_price}`;

                                        return (
                                          <div
                                            key={quoteKey}
                                            className="space-y-1.5 rounded-md border bg-muted/20 px-2 py-1.5"
                                            role="listitem"
                                          >
                                            <div className="flex items-start justify-between gap-2">
                                              <div className="space-y-0.5">
                                                <div className="text-[11px] font-semibold mb-0.5">
                                                  {quote.company_name}
                                                </div>
                                                <div className="text-[11px] text-muted-foreground">
                                                  ფასი მხოლოდ კომპანიის მომსახურებისთვის (მანქანის ფასის გარეშე)
                                                </div>
                                                {quote.delivery_time_days != null && (
                                                  <div className="text-[11px] text-muted-foreground">
                                                    მიწოდების დრო: {quote.delivery_time_days} დღე
                                                  </div>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-2 text-right">
                                                <Button
                                                  type="button"
                                                  variant="outline"
                                                  size="icon"
                                                  className="h-7 w-7"
                                                  aria-label="კალკულაცია"
                                                  onClick={() => {
                                                    setExpandedQuoteKey((prev) => (prev === quoteKey ? null : quoteKey));
                                                  }}
                                                >
                                                  <Icon icon="mdi:calculator-variant" className="h-3 w-3" />
                                                </Button>
                                                <div className="text-base font-bold text-emerald-600">
                                                  {formatMoney(companyOnly ?? quote.total_price, compareResult.currency) ?? '—'}
                                                </div>
                                              </div>
                                            </div>

                                            {expandedQuoteKey === quoteKey && (
                                              <motion.div
                                                initial={{ opacity: 0, y: -4 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -4 }}
                                                transition={{ duration: 0.16, ease: 'easeOut' }}
                                                className="mt-1.5 border-t pt-1.5 text-[11px] text-muted-foreground space-y-0.5"
                                              >
                                                <div className="flex items-center justify-between gap-2">
                                                  <span>მანქანის ფასი აუქციონზე</span>
                                                  <span>
                                                    {formatMoney(
                                                      quote.breakdown?.calc_price ?? 0,
                                                      compareResult.currency,
                                                    ) ?? '—'}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                  <span>ტრანსპორტირება / მიწოდება</span>
                                                  <span>
                                                    {formatMoney(
                                                      (quote.breakdown?.base_price ?? 0) +
                                                      (quote.breakdown?.mileage_cost ?? 0),
                                                      compareResult.currency,
                                                    ) ?? '—'}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                  <span>კომპანიის მომსახურება (service + broker)</span>
                                                  <span>
                                                    {formatMoney(
                                                      (quote.breakdown?.service_fee ?? 0) +
                                                      (quote.breakdown?.broker_fee ?? 0),
                                                      compareResult.currency,
                                                    ) ?? '—'}
                                                  </span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                  <span>საბაჟო + დაზღვევა</span>
                                                  <span>
                                                    {formatMoney(
                                                      (quote.breakdown?.customs_fee ?? 0) +
                                                      (quote.breakdown?.insurance_fee ?? 0),
                                                      compareResult.currency,
                                                    ) ?? '—'}
                                                  </span>
                                                </div>

                                                <div className="mt-1.5 pt-1.5 border-t flex items-center justify-between gap-2 font-semibold text-foreground">
                                                  <span>სრული ფასი (მანქანა + მიწოდება + მომსახურება)</span>
                                                  <span>
                                                    {formatMoney(
                                                      quote.breakdown?.total_price ?? quote.total_price,
                                                      compareResult.currency,
                                                    ) ?? '—'}
                                                  </span>
                                                </div>
                                              </motion.div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isCalcModalOpen && (
              <motion.div
                className="fixed inset-0 z-50 bg-black/70 px-2 sm:px-4 py-4 sm:py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => setIsCalcModalOpen(false)}
                role="dialog"
                aria-modal="true"
                aria-label="მანქანის კალკულაცია ერთი კომპანიისთვის"
              >
                <motion.div
                  className="fixed left-1/2 top-1/2 z-[55] w-[calc(100%-1.5rem)] max-w-xl max-h-[85vh] -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg overflow-y-auto flex flex-col"
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <div className="font-medium text-sm truncate">კალკულაცია ერთი კომპანიისთვის</div>
                      <div className="text-muted-foreground">
                        ნახეთ ერთი შემთხვევითი კომპანიის სრული საკურიერო ფასის მაგალითი ამ ლოტისთვის.
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-[11px]"
                      onClick={() => setIsCalcModalOpen(false)}
                      aria-label="დახურვა"
                    >
                      <Icon icon="mdi:close" className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="px-4 py-3 text-xs space-y-3">
                    {isCalcLoading && (
                      <div className="space-y-2" aria-busy="true">
                        <Skeleton className="h-4 w-1/3" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-5/6" />
                      </div>
                    )}

                    {!isCalcLoading && calcError && (
                      <Card className="border-destructive/40 bg-destructive/5">
                        <CardContent className="py-3 text-[11px]">
                          {calcError}
                        </CardContent>
                      </Card>
                    )}

                    {!isCalcLoading && !calcError && calcData && randomCalcQuote && (
                      <Card className="text-xs">
                        <CardHeader className="pb-1">
                          <CardTitle className="text-sm">
                            {calcData.year} {calcData.make} {calcData.model}
                          </CardTitle>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {calcData.yard_name} • {calcData.source}
                          </p>
                        </CardHeader>
                        <CardContent className="pt-2 space-y-2 text-[11px]">
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="text-muted-foreground">კომპანია</div>
                              <div className="text-sm font-semibold">{randomCalcQuote.company_name}</div>
                            </div>
                            <div className="text-right space-y-0.5">
                              <div className="text-muted-foreground">სრული ფასი</div>
                              <div className="text-base font-bold text-emerald-600">
                                {formatMoney(randomCalcQuote.total_price, 'USD') ?? '—'}
                              </div>
                              {randomCalcQuote.delivery_time_days != null && (
                                <div className="text-[11px] text-muted-foreground">
                                  მიწოდების დრო: {randomCalcQuote.delivery_time_days} დღე
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-2 border-t pt-2 space-y-1.5 text-[11px] text-muted-foreground">
                            <div className="flex items-center justify-between">
                              <span>მანქანის ფასი აუქციონზე</span>
                              <span>
                                {formatMoney(randomCalcQuote.breakdown?.calc_price ?? 0, 'USD') ?? '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>მიწოდება და ლოჯისტიკა</span>
                              <span>
                                {formatMoney(randomCalcQuote.breakdown?.shipping_total ?? 0, 'USD') ?? '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>სერვისის საფასური</span>
                              <span>
                                {formatMoney(randomCalcQuote.breakdown?.service_fee ?? 0, 'USD') ?? '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>ზღვრული დაზღვევა</span>
                              <span>
                                {formatMoney(randomCalcQuote.breakdown?.insurance_fee ?? 0, 'USD') ?? '—'}
                              </span>
                            </div>
                            <div className="flex items-center justify-between font-semibold text-foreground border-t pt-1.5 mt-1">
                              <span>ჯამური ფასი</span>
                              <span>
                                {formatMoney(
                                  randomCalcQuote.breakdown?.total_price ?? randomCalcQuote.total_price,
                                  'USD',
                                ) ?? '—'}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {backendGallery && (
              <motion.div
                className="fixed inset-0 z-40 bg-black/70 px-2 sm:px-4 py-4 sm:py-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                onClick={() => setBackendGallery(null)}
              >
                <motion.div
                  className="fixed left-1/2 top-1/2 z-[45] w-[calc(100%-1.5rem)] max-w-4xl max-h-[90vh] -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg overflow-y-auto flex flex-col"
                  initial={{ scale: 0.96, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.96, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-4 py-2 border-b">
                    <div className="flex flex-col gap-0.5 text-[11px]">
                      <div className="font-medium text-sm truncate">{backendGallery.title}</div>
                      <div className="text-muted-foreground">
                        {backendGallery.yardName}{' '}
                        {backendGallery.saleState ? `• ${backendGallery.saleState}` : ''}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="h-7 w-7 text-[11px]"
                      onClick={() => setBackendGallery(null)}
                      aria-label="დახურვა"
                    >
                      <Icon icon="mdi:close" className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-2/3 bg-background flex flex-col items-center justify-center">
                      <div className="w-full flex items-center justify-center p-3">
                        <div className="relative w-full max-w-[520px] aspect-square">
                          <img
                            src={backendGallery.photos[backendGalleryIndex] ?? backendGallery.photos[0]}
                            alt={backendGallery.title}
                            className="absolute inset-0 h-full w-full object-contain"
                          />
                        </div>
                      </div>
                      {backendGallery.photos.length > 1 && (
                        <div className="flex flex-wrap items-center justify-center gap-2 px-3 pb-3 w-full">
                          {backendGallery.photos.slice(0, 6).map((photoUrl, index) => (
                            <button
                              key={photoUrl + index}
                              type="button"
                              className={`h-12 w-16 overflow-hidden rounded-sm border ${index === backendGalleryIndex
                                ? 'border-primary'
                                : 'border-border hover:border-primary/60'
                                }`}
                              onClick={() => setBackendGalleryIndex(index)}
                            >
                              <img
                                src={photoUrl}
                                alt={`thumb-${index}`}
                                className="h-full w-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="w-full md:w-1/3 border-t md:border-t-0 md:border-l px-4 py-3 text-[11px] space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        {backendGallery.bestTotalPrice != null && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">საუკეთესო სრული ფასი</span>
                            <span className="font-semibold text-sm">
                              ${backendGallery.bestTotalPrice.toLocaleString()}
                            </span>
                          </div>
                        )}
                        {backendGallery.distanceMiles != null && (
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>დისტანცია ფოთამდე</span>
                            <span className="font-medium text-foreground">
                              {backendGallery.distanceMiles.toLocaleString()} mi
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-2">
                        <div className="flex items-center gap-2 ml-auto">
                          <Button
                            type="button"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => {
                              const companyName = getSelectedCompanyNameForLink();
                              const search = companyName
                                ? `?company=${encodeURIComponent(companyName)}`
                                : '';

                              navigate(
                                {
                                  pathname: `/vehicle/${backendGallery.id}`,
                                  search,
                                },
                                {
                                  state: { scrollToOffers: true },
                                },
                              );
                            }}
                          >
                            ღირებულების გათვლა
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => {
                              const companyName = getSelectedCompanyNameForLink();
                              const search = companyName
                                ? `?company=${encodeURIComponent(companyName)}`
                                : '';

                              navigate({
                                pathname: `/vehicle/${backendGallery.id}`,
                                search,
                              });
                            }}
                          >
                            დეტალურად ნახვა
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating compare button */}
          <AnimatePresence>
            {showCompareCheckboxes && selectedVehicleIds.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.9 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="fixed bottom-6 right-6 z-50"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    type="button"
                    size="lg"
                    className={`h-14 px-6 text-sm font-semibold shadow-xl text-white transition-all duration-300 ${isCompareOpen
                      ? 'bg-red-500 hover:bg-red-600 hover:shadow-red-500/25'
                      : 'bg-orange-500 hover:bg-orange-600 hover:shadow-orange-500/25'
                      }`}
                    onClick={async () => {
                      if (isCompareOpen) {
                        setIsCompareOpen(false);
                        return;
                      }

                      setIsCompareOpen(true);
                      setIsCompareLoading(true);
                      setCompareError(null);
                      setCompareResult(null);
                      try {
                        const response = await compareVehicles({
                          vehicle_ids: selectedVehicleIds,
                          quotes_per_vehicle: 3,
                          currency: 'usd',
                        });
                        setCompareResult(response);
                      } catch (error: any) {
                        setCompareError(error?.message || 'შედარების ჩატვირთვა ვერ მოხერხდა');
                      } finally {
                        setIsCompareLoading(false);
                      }
                    }}
                    aria-label={isCompareOpen ? 'შედარების დახურვა' : 'შედარების ფანჯრის გახსნა'}
                  >
                    <AnimatePresence mode="wait">
                      {isCompareOpen ? (
                        <motion.div
                          key="cancel"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center"
                        >
                          <Icon icon="mdi:close" className="h-5 w-5 mr-2" />
                          გაუქმება
                        </motion.div>
                      ) : (
                        <motion.div
                          key="compare"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                          className="flex items-center"
                        >
                          <Icon icon="mdi:compare" className="h-5 w-5 mr-2" />
                          შედარება ({selectedVehicleIds.length})
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default AuctionListingsPage;
