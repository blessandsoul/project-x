import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

// Header and Footer are provided by MainLayout
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { EmptyState } from '@/components/company/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { CompanyListItem } from '@/components/catalog/CompanyListItem';
import { CompanyComparisonModal } from '@/components/comparison/CompanyComparisonModal';
import { ShippingCalculator, type CalculatorResult } from '@/components/catalog/ShippingCalculator';

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

  const pageSize = 10; // List view standard
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  // Calculator state for showing prices in company rows
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [hasCalculation, setHasCalculation] = useState(false);

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
    orderBy: 'newest',
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
        orderBy: options.orderBy !== 'newest' ? options.orderBy : undefined,
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

    if (nextFilters.orderBy && nextFilters.orderBy !== 'newest') {
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
      sortParam === 'rating' || sortParam === 'cheapest' ? sortParam : 'newest';

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
  const handleCalculationComplete = useCallback((result: CalculatorResult) => {
    // Extract transportation_total from nested data object or root level
    const price = result.data?.transportation_total 
      ?? result.transportation_total 
      ?? result.shipping_cost 
      ?? result.total_price 
      ?? null;
    setCalculatedPrice(price);
    setHasCalculation(true);
    setIsCalculatingPrice(false);
  }, []);

  const handleCalculationStart = useCallback(() => {
    setIsCalculatingPrice(true);
  }, []);

  const handleCalculationClear = useCallback(() => {
    setCalculatedPrice(null);
    setHasCalculation(false);
    setIsCalculatingPrice(false);
  }, []);

  const resultsContent = useMemo(
    () => (
      <>
        {/* Results Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
          <p className="text-sm font-medium text-slate-600">
            {t('catalog.results.showing')} <span className="font-bold text-slate-900">{paginatedCompanies.length}</span> {t('catalog.results.connector')} <span className="font-bold text-slate-900">{totalResults}</span> {t('catalog.results.of')}
          </p>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Toggle 
              pressed={isCompareMode} 
              onPressedChange={setIsCompareMode}
              variant="outline"
              aria-label="Toggle compare mode"
              className="gap-2 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200 flex-1 sm:flex-none"
            >
              <Icon icon="mdi:compare-horizontal" className="h-4 w-4" />
              <span className="text-sm font-medium">{t('catalog.results.compare')}</span>
            </Toggle>

            <span className="text-sm text-slate-500 whitespace-nowrap hidden sm:inline">{t('catalog.results.sort_label')}</span>
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
              <SelectTrigger className="w-auto min-w-[130px] sm:w-[180px] bg-white border-slate-200 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t('catalog.sort.rating')}</SelectItem>
                <SelectItem value="cheapest">{t('catalog.sort.cheapest')}</SelectItem>
                <SelectItem value="newest">{t('catalog.sort.newest')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* List Results */}
        {isLoading ? (
          <div className="space-y-4">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-32 rounded-xl border border-slate-100 bg-white p-4 flex gap-4 items-center">
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-1/3" />
                  <Skeleton className="h-4 w-1/4" />
                </div>
                <div className="w-32 space-y-2 hidden md:block">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : totalResults > 0 ? (
          <div className="flex flex-col space-y-4">
            {paginatedCompanies.map((company) => (
              <CompanyListItem 
                key={company.id} 
                company={company} 
                isCompareMode={isCompareMode}
                isSelected={selectedCompanies.includes(company.id)}
                onToggleCompare={() => toggleComparison(company.id)}
                hasAuctionBranch={hasCalculation}
                isLoadingShipping={isCalculatingPrice}
                calculatedShippingPrice={calculatedPrice ?? undefined}
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
        )}

        {/* Pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12">
            {/* Prev */}
            <Button 
              id="catalog-prev-page"
              type="button"
              variant="outline" 
              size="icon"
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
                'h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
                page <= 1
                  ? 'border border-dashed border-slate-300 text-slate-400 bg-transparent cursor-not-allowed'
                  : 'border border-slate-300 text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              <Icon icon="mdi:chevron-left" className="h-5 w-5" />
            </Button>
            
            {/* Page numbers */}
            <div className="flex items-center gap-1 px-2">
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
                      'h-10 w-10 rounded-full text-sm font-medium transition-all border flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
                      isActive
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-110 pointer-events-none'
                        : 'bg-slate-100 border-transparent text-slate-800 hover:bg-slate-200 hover:text-slate-900'
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
              size="icon"
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
                'h-10 w-10 rounded-full flex items-center justify-center text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50',
                page >= totalPages
                  ? 'border border-dashed border-slate-300 text-slate-400 bg-transparent cursor-not-allowed'
                  : 'border border-slate-300 text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900'
              )}
            >
              <Icon icon="mdi:chevron-right" className="h-5 w-5" />
            </Button>
          </div>
        )}
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
      calculatedPrice,
    ],
  );

  return (
    <div className="flex-1 flex flex-col font-sans min-h-screen bg-transparent">
      <div className="flex-1 flex flex-col">
        {/* Header Section */}
        <div className="border-b border-slate-200 bg-white/80">
          <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] mx-auto py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="max-w-4xl">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
                  {t('catalog.title')}
                </h1>
                <p className="text-lg text-slate-600 max-w-2xl">
                  {t('catalog.subtitle')}
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      <main className="relative z-10 flex-1 w-full px-4 lg:px-8 lg:max-w-[1440px] mx-auto py-8">
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 lg:sticky lg:top-24 z-30">
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
                  filters.orderBy === 'newest';

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

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Shipping Calculator */}
            <ShippingCalculator
              onCalculationComplete={handleCalculationComplete}
              onCalculationStart={handleCalculationStart}
              onCalculationClear={handleCalculationClear}
            />
            
            {/* Results from useMemo */}
            {resultsContent}
          </div>
        </div>
      </main>
      
      {/* Comparison Modal Floating Trigger */}
      {selectedCompanies.length > 0 && (
         <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end">
            <Button 
               variant="secondary"
               size="sm"
               onClick={() => {
                 setSelectedCompanies([]);
                 setIsCompareMode(false);
               }}
               className="shadow-lg bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white border border-white/20 h-8 rounded-full px-4"
            >
               <Icon icon="mdi:close" className="h-4 w-4 mr-1" />
               {t('catalog.comparison.cancel')}
            </Button>
            
            <Button 
               onClick={() => setIsComparisonModalOpen(true)} 
               className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/30 rounded-full px-6 h-14 flex items-center gap-3 transition-all hover:scale-105"
            >
               <div className="relative">
                 <Icon icon="mdi:compare-horizontal" className="h-6 w-6" />
                 <span className="absolute -top-2 -right-2 bg-white text-primary text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                   {selectedCompanies.length}
                 </span>
               </div>
               <span className="font-bold text-lg tracking-tight">{t('catalog.comparison.compare_now')}</span>
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
