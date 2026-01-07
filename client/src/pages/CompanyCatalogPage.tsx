import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

// Header and Footer are provided by MainLayout
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/company/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { CompanyListItem } from '@/components/catalog/CompanyListItem';
import { CompanyComparisonModal } from '@/components/comparison/CompanyComparisonModal';
import { ShippingCalculator, type CalculatorResult, type CalculatorFormValues } from '@/components/catalog/ShippingCalculator';

import type { Company } from '@/types/api';
import { searchCompaniesFromApi } from '@/services/companiesApi';
// navigationItems/footerLinks now handled by MainLayout
import { cn } from '@/lib/utils';

// NOTE: Sorting is currently visual-only; backend ordering will be wired later.

const CompanyCatalogPage = () => {
  const { t } = useTranslation();

  const location = useLocation();

  const [page, setPage] = useState(1);
  const resetAll = () => {
    setPage(1);
  };

  const pageSize = 12; // List view standard
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Calculator state for showing prices in company rows
  // Map of companyId -> price for per-company pricing
  const [companyPrices, setCompanyPrices] = useState<Map<number, number>>(new Map());
  const [defaultPrice, setDefaultPrice] = useState<number | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [hasCalculation, setHasCalculation] = useState(false);

  // Calculator URL sync state - parse synchronously to avoid race condition
  const [calculatorInitialValues] = useState<Partial<CalculatorFormValues> | undefined>(() => {
    const params = new URLSearchParams(window.location.search);
    const calcCity = params.get('calc_city') ?? '';
    const calcPort = params.get('calc_port') ?? '';
    const calcVehicleType = params.get('calc_type') ?? '';
    const calcVehicleCategory = params.get('calc_category') ?? '';

    if (calcCity && calcPort && calcVehicleType && calcVehicleCategory) {
      return {
        city: calcCity,
        destinationPort: calcPort,
        vehicleType: calcVehicleType as CalculatorFormValues['vehicleType'],
        vehicleCategory: calcVehicleCategory as CalculatorFormValues['vehicleCategory'],
      };
    }
    return undefined;
  });
  const [calculatorAutoSubmit] = useState<boolean>(() => {
    const params = new URLSearchParams(window.location.search);
    const calcCity = params.get('calc_city') ?? '';
    const calcPort = params.get('calc_port') ?? '';
    const calcVehicleType = params.get('calc_type') ?? '';
    const calcVehicleCategory = params.get('calc_category') ?? '';
    return !!(calcCity && calcPort && calcVehicleType && calcVehicleCategory);
  });

  const [totalFromBackend, setTotalFromBackend] = useState<number | null>(null);

  type CatalogFiltersState = {
    search: string;
    country: string;
    city: string;
    minRating?: number;
    minBasePrice?: number;
    maxBasePrice?: number;
    isVip: boolean;
    orderBy: 'rating' | 'cheapest' | 'newest';
  };

  const defaultFilters: CatalogFiltersState = {
    search: '',
    country: '',
    city: '',
    minRating: undefined,
    minBasePrice: undefined,
    maxBasePrice: undefined,
    isVip: false,
    orderBy: 'rating',
  };

  const [filters, setFilters] = useState<CatalogFiltersState>(defaultFilters);

  const searchDraftRef = useRef<string>('');
  const countryDraftRef = useRef<string>('');
  const cityDraftRef = useRef<string>('');
  const priceDraftRef = useRef<[number, number]>([0, 0]);


  const toggleComparison = (id: number) => {
    setSelectedCompanies(prev => {
      if (prev.includes(id)) {
        return prev.filter(cId => cId !== id);
      }

      // Limit comparison to maximum 3 companies
      if (prev.length >= 3) {
        return prev;
      }

      return [...prev, id];
    });
  };


  const loadCompanies = useCallback(async (
    nextPage: number,
    options: CatalogFiltersState,
  ) => {
    setIsLoading(true);
    try {
      const offset = (nextPage - 1) * pageSize;
      const { companies, total } = await searchCompaniesFromApi({
        limit: pageSize,
        offset,
        search: options.search || undefined,
        country: options.country || undefined,
        city: options.city || undefined,
        minRating: typeof options.minRating === 'number' && options.minRating > 0
          ? options.minRating
          : undefined,
        minBasePrice: typeof options.minBasePrice === 'number' && options.minBasePrice > 0
          ? options.minBasePrice
          : undefined,
        orderBy: options.orderBy !== 'rating' ? options.orderBy : undefined,
        maxBasePrice: typeof options.maxBasePrice === 'number' && options.maxBasePrice > 0
          ? options.maxBasePrice
          : undefined,
        isVip: options.isVip === true,
      });

      setAllCompanies(companies);
      setTotalFromBackend(typeof total === 'number' ? total : companies.length);
      setPage(nextPage);
    } catch {
      // Handle error silently or show toaster
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  const updateUrlFromFilters = useCallback((nextFilters: CatalogFiltersState, nextPage: number) => {
    if (typeof window === 'undefined') return;

    const searchParams = new URLSearchParams(window.location.search);

    const trimmedSearch = nextFilters.search.trim();
    if (trimmedSearch.length > 0) {
      searchParams.set('q', trimmedSearch);
    } else {
      searchParams.delete('q');
    }

    const trimmedCountry = nextFilters.country.trim();
    if (trimmedCountry.length > 0) {
      searchParams.set('country', trimmedCountry);
    } else {
      searchParams.delete('country');
    }

    const trimmedCity = nextFilters.city.trim();
    if (trimmedCity.length > 0) {
      searchParams.set('city', trimmedCity);
    } else {
      searchParams.delete('city');
    }

    if (nextFilters.orderBy && nextFilters.orderBy !== 'rating') {
      searchParams.set('sort', nextFilters.orderBy);
    } else {
      searchParams.delete('sort');
    }

    if (typeof nextFilters.minRating === 'number' && nextFilters.minRating > 0) {
      searchParams.set('min_rating', String(nextFilters.minRating));
    } else {
      searchParams.delete('min_rating');
    }

    if (nextFilters.isVip) {
      searchParams.set('is_vip', 'true');
    } else {
      searchParams.delete('is_vip');
    }

    if (typeof nextFilters.minBasePrice === 'number' && nextFilters.minBasePrice > 0) {
      searchParams.set('min_price', String(nextFilters.minBasePrice));
    } else {
      searchParams.delete('min_price');
    }

    if (typeof nextFilters.maxBasePrice === 'number' && nextFilters.maxBasePrice > 0) {
      searchParams.set('max_price', String(nextFilters.maxBasePrice));
    } else {
      searchParams.delete('max_price');
    }

    // Pagination for deep-linking
    if (nextPage > 1) {
      searchParams.set('page', String(nextPage));
    } else {
      searchParams.delete('page');
    }

    const searchString = searchParams.toString();
    const newSearch = searchString.length > 0 ? `?${searchString}` : '';
    const newUrl = `${location.pathname}${newSearch}`;

    window.history.replaceState(null, '', newUrl);
  }, [location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const search = (params.get('q') ?? '').trim();
    const country = (params.get('country') ?? '').trim();
    const city = (params.get('city') ?? '').trim();
    const minRatingParam = params.get('min_rating');
    const minRating = minRatingParam ? Number(minRatingParam) : undefined;
    const isVipParam = params.get('is_vip');
    const isVip = isVipParam === 'true';
    const minPriceParam = params.get('min_price');
    const maxPriceParam = params.get('max_price');
    const minBasePrice = minPriceParam ? Number(minPriceParam) : undefined;
    const maxBasePrice = maxPriceParam ? Number(maxPriceParam) : undefined;
    const sortParam = params.get('sort');
    const orderBy: 'rating' | 'cheapest' | 'newest' =
      sortParam === 'newest' || sortParam === 'cheapest' ? sortParam : 'rating';

    // Read page from URL
    const pageParam = params.get('page');
    const initialPage = pageParam ? Math.max(1, parseInt(pageParam, 10) || 1) : 1;

    const initialFilters: CatalogFiltersState = {
      search,
      country,
      city,
      minRating: Number.isNaN(minRating) ? undefined : minRating,
      minBasePrice: Number.isNaN(minBasePrice as number) ? undefined : minBasePrice,
      maxBasePrice: Number.isNaN(maxBasePrice as number) ? undefined : maxBasePrice,
      isVip,
      orderBy,
    };

    setFilters(initialFilters);
    searchDraftRef.current = search;
    countryDraftRef.current = country;
    cityDraftRef.current = city;
    priceDraftRef.current = [minBasePrice ?? 0, maxBasePrice ?? 0];
    void loadCompanies(initialPage, initialFilters);
  }, [loadCompanies]);

  const totalResults = totalFromBackend ?? allCompanies.length;
  const totalPages = totalResults > 0 ? Math.ceil(totalResults / pageSize) : 1;
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const paginatedCompanies = useMemo(
    () => allCompanies,
    [allCompanies],
  );

  // Calculator event handlers
  const handleCalculationComplete = useCallback((result: CalculatorResult, formValues: CalculatorFormValues) => {
    // Build a map of companyId -> price from the quotes array
    const pricesMap = new Map<number, number>();
    if (result.quotes && Array.isArray(result.quotes)) {
      for (const quote of result.quotes) {
        pricesMap.set(quote.companyId, quote.totalPrice);
      }
    }
    setCompanyPrices(pricesMap);

    // Set fallback default price for companies without custom calculator
    const fallbackPrice = result.defaultPrice
      ?? result.data?.transportation_total
      ?? result.transportation_total
      ?? null;
    setDefaultPrice(fallbackPrice);

    setHasCalculation(true);
    setIsCalculatingPrice(false);

    // Update URL with calculator params
    const searchParams = new URLSearchParams(window.location.search);
    searchParams.set('calc_city', formValues.city);
    searchParams.set('calc_port', formValues.destinationPort);
    searchParams.set('calc_type', formValues.vehicleType);
    searchParams.set('calc_category', formValues.vehicleCategory);
    const newUrl = `${location.pathname}?${searchParams.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [location.pathname]);

  const handleCalculationStart = useCallback(() => {
    setIsCalculatingPrice(true);
  }, []);

  const handleCalculationClear = useCallback(() => {
    setCompanyPrices(new Map());
    setDefaultPrice(null);
    setHasCalculation(false);
    setIsCalculatingPrice(false);
  }, []);

  const resultsContent = useMemo(
    () => (
      <>
        {/* Results Header - Copart style - only show when calculator has been used */}
        {hasCalculation && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 border border-slate-200">
            <p className="text-[12px] font-medium text-slate-600">
              {t('catalog.results.showing')} <span className="font-bold text-slate-900">{paginatedCompanies.length}</span> {t('catalog.results.connector')} <span className="font-bold text-slate-900">{totalResults}</span> {t('catalog.results.of')}
            </p>

            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto sm:justify-end">


              <div className="flex items-center gap-2 sm:gap-3 sm:ml-auto">
                <span className="text-[11px] text-slate-500 whitespace-nowrap hidden sm:inline">{t('catalog.results.sort_label')}</span>
                <Select
                  value={filters.orderBy}
                  onValueChange={(value: 'rating' | 'cheapest' | 'newest') => {
                    if (value === filters.orderBy) return;
                    const nextFilters: CatalogFiltersState = { ...filters, orderBy: value };
                    setFilters(nextFilters);
                    setPage(1);
                    void loadCompanies(1, nextFilters);
                    updateUrlFromFilters(nextFilters, 1);
                  }}
                >
                  <SelectTrigger className="w-auto min-w-[120px] sm:w-[160px] h-7 text-[11px] bg-white border-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating" className="text-[11px]">{t('catalog.sort.rating')}</SelectItem>
                    <SelectItem value="cheapest" className="text-[11px]">{t('catalog.sort.cheapest')}</SelectItem>
                    <SelectItem value="newest" className="text-[11px]">{t('catalog.sort.newest')}</SelectItem>
                  </SelectContent>
                </Select>

              </div>
            </div>
          </div>
        )}


        {/* List Results - grid or list view based on viewMode */}
        {
          !hasCalculation ? (
            <div className="py-16 text-center">
              <p className="text-sm text-muted-foreground">
                {t('catalog.results.use_calculator_title', 'Companies will appear here')}
              </p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {t('catalog.results.use_calculator_hint', 'Fill in the calculator to see offers')}
              </p>
            </div>
          ) : isLoading ? (
            <div className="grid gap-3 xl:gap-4 grid-cols-1">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="rounded-md border border-slate-200 bg-white shadow-sm px-4 py-3 space-y-3">
                  {/* Compact card skeleton */}
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 xl:h-14 xl:w-14 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div className="space-y-1">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-12" />
                    <div className="ml-auto flex gap-1.5">
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-7 w-16" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : totalResults > 0 ? (
            <div className="grid gap-3 xl:gap-4 grid-cols-1">
              {paginatedCompanies.map((company) => (
                <CompanyListItem
                  key={company.id}
                  company={company}
                  isCompareMode={isCompareMode}
                  isSelected={selectedCompanies.includes(company.id)}
                  onToggleCompare={() => toggleComparison(company.id)}
                  hasAuctionBranch={hasCalculation}
                  calculatedShippingPrice={companyPrices.get(company.id) ?? defaultPrice ?? undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title={t('catalog.results.empty_title')}
              description={t('catalog.results.empty_description')}
              icon="mdi:clipboard-text-off-outline"
              action={<Button onClick={resetAll} variant="outline">{t('catalog.filters.reset')}</Button>}
            />
          )
        }

        {/* Pagination - Copart style */}
        {
          !isLoading && totalPages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-6">
              {/* Prev */}
              <Button
                id="catalog-prev-page"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (page <= 1) return;
                  const nextPage = page - 1;
                  setPage(nextPage);
                  void loadCompanies(nextPage, filters);
                  updateUrlFromFilters(filters, nextPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page <= 1}
                aria-disabled={page <= 1}
                className={cn(
                  'h-7 w-7 p-0 flex items-center justify-center text-[11px] transition-all',
                  page <= 1
                    ? 'border-slate-200 text-slate-400 bg-transparent cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                )}
              >
                <Icon icon="mdi:chevron-left" className="h-4 w-4" />
              </Button>

              {/* Page numbers */}
              <div className="flex items-center gap-0.5">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  const isActive = p === currentPage;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        if (isActive) return;
                        setPage(p);
                        void loadCompanies(p, filters);
                        updateUrlFromFilters(filters, p);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'h-7 min-w-[28px] px-2 text-[11px] font-medium transition-all border flex items-center justify-center',
                        isActive
                          ? 'bg-primary border-primary text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              {/* Next */}
              <Button
                id="catalog-next-page"
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  if (page >= totalPages) return;
                  const nextPage = page + 1;
                  setPage(nextPage);
                  void loadCompanies(nextPage, filters);
                  updateUrlFromFilters(filters, nextPage);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                disabled={page >= totalPages}
                aria-disabled={page >= totalPages}
                className={cn(
                  'h-7 w-7 p-0 flex items-center justify-center text-[11px] transition-all',
                  page >= totalPages
                    ? 'border-slate-200 text-slate-400 bg-transparent cursor-not-allowed'
                    : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                )}
              >
                <Icon icon="mdi:chevron-right" className="h-4 w-4" />
              </Button>
            </div>
          )
        }
      </>
    ),
    [
      t,
      paginatedCompanies,
      totalResults,
      isCompareMode,
      selectedCompanies,
      isLoading,
      totalPages,
      currentPage,
      resetAll,
      page,
      filters,
      loadCompanies,
      updateUrlFromFilters,
      hasCalculation,
      isCalculatingPrice,
      companyPrices,
      defaultPrice,
    ],
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header - Copart style */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">
            {t('catalog.title')}
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {t('catalog.subtitle')}
          </p>
        </div>
      </div>

      <main className="w-full max-w-[1400px] mx-auto px-4 py-4">
        <div className="flex gap-4">
          {/* Sidebar Filters - Fixed width like auction-listings */}
          <aside className="hidden lg:block w-[240px] flex-shrink-0 sticky top-4">
            <CatalogFilters
              initialSearch={filters.search}
              initialCountry={filters.country}
              initialCity={filters.city}
              initialMinRating={filters.minRating}
              initialPriceRange={[filters.minBasePrice ?? 0, filters.maxBasePrice ?? 0]}
              initialIsVip={filters.isVip}
              onSearchChange={(value) => {
                searchDraftRef.current = value;
              }}
              onCountryChange={(value) => {
                countryDraftRef.current = value;
              }}
              onCityChange={(value) => {
                cityDraftRef.current = value;
              }}
              onPriceRangeChange={(value) => {
                priceDraftRef.current = value;
              }}
              onApplyFilters={() => {
                const effectiveSearch = searchDraftRef.current.trim();
                const effectiveCountry = countryDraftRef.current.trim();
                const effectiveCity = cityDraftRef.current.trim();
                const effectivePrice = priceDraftRef.current;
                const nextMinPrice = effectivePrice[0] > 0 ? effectivePrice[0] : undefined;
                const nextMaxPrice = effectivePrice[1] > 0 ? effectivePrice[1] : undefined;

                // Check if anything actually changed
                const hasChanges =
                  effectiveSearch !== filters.search ||
                  effectiveCountry !== filters.country ||
                  effectiveCity !== filters.city ||
                  nextMinPrice !== filters.minBasePrice ||
                  nextMaxPrice !== filters.maxBasePrice;

                if (!hasChanges) {
                  return;
                }

                const nextFilters: CatalogFiltersState = {
                  ...filters,
                  search: effectiveSearch,
                  country: effectiveCountry,
                  city: effectiveCity,
                  minBasePrice: nextMinPrice,
                  maxBasePrice: nextMaxPrice,
                };
                setFilters(nextFilters);
                setPage(1);
                void loadCompanies(1, nextFilters);
                updateUrlFromFilters(nextFilters, 1);
              }}
              onResetFilters={() => {
                // Skip reload if filters are already at defaults
                const isAlreadyDefault =
                  filters.search === '' &&
                  filters.country === '' &&
                  filters.city === '' &&
                  filters.minRating === undefined &&
                  filters.minBasePrice === undefined &&
                  filters.maxBasePrice === undefined &&
                  filters.isVip === false &&
                  filters.orderBy === 'rating';

                if (isAlreadyDefault) {
                  return;
                }

                searchDraftRef.current = '';
                countryDraftRef.current = '';
                cityDraftRef.current = '';
                priceDraftRef.current = [0, 0];
                setFilters(defaultFilters);
                setPage(1);
                void loadCompanies(1, defaultFilters);
                updateUrlFromFilters(defaultFilters, 1);
              }}
              onSearchSubmit={(value) => {
                const trimmed = value.trim();
                searchDraftRef.current = trimmed;
                const nextFilters: CatalogFiltersState = {
                  ...filters,
                  search: trimmed,
                };
                setFilters(nextFilters);
                setPage(1);
                void loadCompanies(1, nextFilters);
                updateUrlFromFilters(nextFilters, 1);
              }}
              onMinRatingChange={(value) => {
                const normalized = value > 0 ? value : undefined;
                const effectiveSearch = searchDraftRef.current ?? filters.search;
                const nextFilters: CatalogFiltersState = {
                  ...filters,
                  search: effectiveSearch,
                  minRating: normalized,
                };
                setFilters(nextFilters);
                setPage(1);
                void loadCompanies(1, nextFilters);
                updateUrlFromFilters(nextFilters, 1);
              }}
              onVipChange={(value) => {
                const effectiveSearch = searchDraftRef.current ?? filters.search;
                const nextFilters: CatalogFiltersState = {
                  ...filters,
                  search: effectiveSearch,
                  isVip: value,
                };
                setFilters(nextFilters);
                setPage(1);
                void loadCompanies(1, nextFilters);
                updateUrlFromFilters(nextFilters, 1);
              }}
            />
          </aside>

          {/* Main Content - Flex grow */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Mobile Filter Button */}
            <div className="lg:hidden">
              <CatalogFilters
                initialSearch={filters.search}
                initialCountry={filters.country}
                initialCity={filters.city}
                initialMinRating={filters.minRating}
                initialPriceRange={[filters.minBasePrice ?? 0, filters.maxBasePrice ?? 0]}
                initialIsVip={filters.isVip}
                onSearchChange={(value) => {
                  searchDraftRef.current = value;
                }}
                onCountryChange={(value) => {
                  countryDraftRef.current = value;
                }}
                onCityChange={(value) => {
                  cityDraftRef.current = value;
                }}
                onPriceRangeChange={(value) => {
                  priceDraftRef.current = value;
                }}
                onApplyFilters={() => {
                  const effectiveSearch = searchDraftRef.current.trim();
                  const effectiveCountry = countryDraftRef.current.trim();
                  const effectiveCity = cityDraftRef.current.trim();
                  const effectivePrice = priceDraftRef.current;
                  const nextMinPrice = effectivePrice[0] > 0 ? effectivePrice[0] : undefined;
                  const nextMaxPrice = effectivePrice[1] > 0 ? effectivePrice[1] : undefined;
                  const hasChanges =
                    effectiveSearch !== filters.search ||
                    effectiveCountry !== filters.country ||
                    effectiveCity !== filters.city ||
                    nextMinPrice !== filters.minBasePrice ||
                    nextMaxPrice !== filters.maxBasePrice;
                  if (!hasChanges) return;
                  const nextFilters: CatalogFiltersState = {
                    ...filters,
                    search: effectiveSearch,
                    country: effectiveCountry,
                    city: effectiveCity,
                    minBasePrice: nextMinPrice,
                    maxBasePrice: nextMaxPrice,
                  };
                  setFilters(nextFilters);
                  setPage(1);
                  void loadCompanies(1, nextFilters);
                  updateUrlFromFilters(nextFilters, 1);
                }}
                onResetFilters={() => {
                  const isAlreadyDefault =
                    filters.search === '' &&
                    filters.country === '' &&
                    filters.city === '' &&
                    filters.minRating === undefined &&
                    filters.minBasePrice === undefined &&
                    filters.maxBasePrice === undefined &&
                    filters.isVip === false &&
                    filters.orderBy === 'rating';
                  if (isAlreadyDefault) return;
                  searchDraftRef.current = '';
                  countryDraftRef.current = '';
                  cityDraftRef.current = '';
                  priceDraftRef.current = [0, 0];
                  setFilters(defaultFilters);
                  setPage(1);
                  void loadCompanies(1, defaultFilters);
                  updateUrlFromFilters(defaultFilters, 1);
                }}
                onSearchSubmit={(value) => {
                  const trimmed = value.trim();
                  searchDraftRef.current = trimmed;
                  const nextFilters: CatalogFiltersState = { ...filters, search: trimmed };
                  setFilters(nextFilters);
                  setPage(1);
                  void loadCompanies(1, nextFilters);
                  updateUrlFromFilters(nextFilters, 1);
                }}
                onMinRatingChange={(value) => {
                  const normalized = value > 0 ? value : undefined;
                  const effectiveSearch = searchDraftRef.current ?? filters.search;
                  const nextFilters: CatalogFiltersState = { ...filters, search: effectiveSearch, minRating: normalized };
                  setFilters(nextFilters);
                  setPage(1);
                  void loadCompanies(1, nextFilters);
                  updateUrlFromFilters(nextFilters, 1);
                }}
                onVipChange={(value) => {
                  const effectiveSearch = searchDraftRef.current ?? filters.search;
                  const nextFilters: CatalogFiltersState = { ...filters, search: effectiveSearch, isVip: value };
                  setFilters(nextFilters);
                  setPage(1);
                  void loadCompanies(1, nextFilters);
                  updateUrlFromFilters(nextFilters, 1);
                }}
              />
            </div>

            {/* Shipping Calculator Section - Two column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Calculator */}
              <ShippingCalculator
                initialValues={calculatorInitialValues}
                autoSubmit={calculatorAutoSubmit}
                onCalculationComplete={handleCalculationComplete}
                onCalculationStart={handleCalculationStart}
                onCalculationClear={handleCalculationClear}
              />

              {/* Info Block */}
              <div className="rounded-md border border-slate-200 bg-white shadow-sm px-5 py-4">
                <div className="flex items-center gap-2 mb-3">
                  <Icon icon="mdi:information-outline" className="h-4 w-4 text-primary" />
                  <h3 className="text-base font-semibold text-primary">
                    {t('calculator.info.title', 'How It Works')}
                  </h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {t('calculator.info.description', 'Use this calculator to estimate shipping and import costs for your vehicle from the USA to Georgia.')}
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon icon="mdi:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('calculator.info.point1', 'Select your pickup city and destination port')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon icon="mdi:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('calculator.info.point2', 'Choose your vehicle type and category')}</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Icon icon="mdi:check-circle" className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>{t('calculator.info.point3', 'Compare prices from multiple import companies')}</span>
                  </li>
                </ul>
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <p className="text-xs text-muted-foreground/80 italic">
                    {t('calculator.info.disclaimer', 'Prices are indicative estimates and may vary based on actual conditions.')}
                  </p>
                </div>
              </div>
            </div>

            {/* Results from useMemo */}
            {resultsContent}
          </div>
        </div>
      </main>

      {/* Comparison Modal Floating Trigger - Copart style */}
      {selectedCompanies.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-1.5 items-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCompanies([]);
              setIsCompareMode(false);
            }}
            className="shadow-md bg-white hover:bg-slate-50 text-slate-600 border-slate-300 h-7 text-[11px] px-3"
          >
            <Icon icon="mdi:close" className="h-3.5 w-3.5 mr-1" />
            {t('catalog.comparison.cancel')}
          </Button>

          <Button
            onClick={() => setIsComparisonModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg px-4 h-10 flex items-center gap-2 transition-all text-[12px] font-semibold"
          >
            <div className="relative">
              <Icon icon="mdi:compare-horizontal" className="h-5 w-5" />
              <span className="absolute -top-1.5 -right-1.5 bg-accent text-primary text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                {selectedCompanies.length}
              </span>
            </div>
            <span>{t('catalog.comparison.compare_now')}</span>
          </Button>
        </div>
      )}

      <CompanyComparisonModal
        isOpen={isComparisonModalOpen}
        onClose={() => setIsComparisonModalOpen(false)}
        companies={allCompanies.filter(c => selectedCompanies.includes(c.id))}
      />
    </div>
  );
};

export default CompanyCatalogPage;
