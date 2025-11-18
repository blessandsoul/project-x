import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { fetchVehiclePhotos, searchVehicles } from '@/api/vehicles';
import { fetchCatalogMakes, fetchCatalogModels } from '@/api/catalog';
import type { CatalogMake, CatalogModel, VehicleCatalogType } from '@/api/catalog';
import type { SearchVehiclesResponse, VehiclesSearchFilters } from '@/types/vehicles';

type AuctionHouse = 'all' | 'Copart' | 'IAAI' | 'Manheim';
type LotStatus = 'all' | 'run' | 'enhanced' | 'non-runner';
type DamageType = 'all' | 'front' | 'rear' | 'side';
type SortOption = 'relevance' | 'price-low' | 'price-high' | 'year-new' | 'year-old';

// NOTE: mockCars-based auction listings were used for demo purposes earlier.
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

const AuctionListingsPage = () => {
  const navigate = useNavigate();
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

  const buildFiltersFromDraft = (pageOverride?: number): VehiclesSearchFilters & { page: number; limit: number } => {
    const trimmed = searchQuery.trim().toLowerCase();
    const quickFilters = parseSearchQueryToFilters(trimmed);

    const hasExactYear = typeof exactYear === 'number' && !Number.isNaN(exactYear);
    const hasMinMileage = typeof minMileage === 'number' && !Number.isNaN(minMileage);

    const pageToUse = pageOverride ?? 1;

    const overrideMake = selectedMakeName;
    const overrideModel = selectedModelName;

    let kindCategory: string | undefined;
    if (searchKind === 'car') {
      kindCategory = 'car';
    } else if (searchKind === 'moto') {
      kindCategory = 'motorcycle';
    } else if (searchKind === 'van') {
      kindCategory = 'van';
    }

    const baseFilters: VehiclesSearchFilters & { page: number; limit: number } = {
      ...quickFilters,
      make: overrideMake ?? quickFilters.make,
      model: overrideModel ?? quickFilters.model,
      mileage_to: maxMileage[0],
      price_from: priceRange[0],
      price_to: priceRange[1],
      fuel_type: fuelType === 'all' ? undefined : fuelType,
      category: category === 'all' ? kindCategory : category,
      drive: drive === 'all' ? undefined : drive,
      limit,
      page: pageToUse,
    };

    if (hasExactYear) {
      baseFilters.year = exactYear;
    } else {
      const fromYear = Math.min(yearRange[0], yearRange[1]);
      const toYear = Math.max(yearRange[0], yearRange[1]);
      baseFilters.year_from = fromYear;
      baseFilters.year_to = toYear;
    }

    if (hasMinMileage) {
      const fromMileage = Math.min(minMileage as number, maxMileage[0]);
      baseFilters.mileage_from = fromMileage;
    }

    return baseFilters;
  };

  useEffect(() => {
    if (appliedFilters) {
      return;
    }

    const initialFilters = buildFiltersFromDraft(1);
    setAppliedFilters(initialFilters);
    setAppliedPage(1);
  }, []);

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
              ნახეთ დემო-ლისტინგები COPART, IAAI და Manheim აუქციონებიდან და გამოიყენეთ სწრაფი ფილტრები
              თქვენთვის საინტერესო ლოტების საპოვნელად.
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

                          const filters = buildFiltersFromDraft(1);
                          setPage(1);
                          setAppliedPage(1);
                          setAppliedFilters(filters);
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

                        const filters = buildFiltersFromDraft(1);
                        setPage(1);
                        setAppliedPage(1);
                        setAppliedFilters(filters);
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

                      const filters = buildFiltersFromDraft(1);
                      setPage(1);
                      setAppliedPage(1);
                      setAppliedFilters(filters);
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

                    const filters = buildFiltersFromDraft(1);
                    setPage(1);
                    setAppliedPage(1);
                    setAppliedFilters(filters);
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
                        setAppliedFilters({ ...appliedFilters, page: nextPage });
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
                        setAppliedFilters({ ...appliedFilters, page: nextPage });
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

                  return (
                    <Card key={`${item.id}-${item.make}-${item.model}`} className="overflow-hidden flex flex-col p-0">
                      <button
                        type="button"
                        className="relative w-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/60"
                        onClick={() => handleOpenBackendGallery(item, mainPhotoUrl)}
                      >
                        <div className="relative w-full h-40">
                          <img
                            src={mainPhotoUrl}
                            alt={`${item.year} ${item.make} ${item.model}`}
                            className="absolute inset-0 h-full w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      </button>
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
                            <span className="text-[10px] text-muted-foreground">
                              ფასი მანქანის აუქციონზე (без доставки და მომსახურების)
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="default"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => {
                                const vehicleKey = item.vehicle_id ?? item.id;
                                navigate(`/vehicle/${vehicleKey}`, {
                                  state: { scrollToOffers: true },
                                });
                              }}
                            >
                              ღირებულების გათვლა
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-3 text-xs"
                              onClick={() => {
                                const vehicleKey = item.vehicle_id ?? item.id;
                                navigate(`/vehicle/${vehicleKey}`);
                              }}
                            >
                              დეტალურად ნახვა
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
                              className={`h-12 w-16 overflow-hidden rounded-sm border ${
                                index === backendGalleryIndex
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
                            onClick={() =>
                              navigate(`/vehicle/${backendGallery.id}`, {
                                state: { scrollToOffers: true },
                              })
                            }
                          >
                            ღირებულების გათვლა
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => navigate(`/vehicle/${backendGallery.id}`)}
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
        </div>
      </main>
      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default AuctionListingsPage;
