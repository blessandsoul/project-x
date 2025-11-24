import { useCallback, useEffect, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CompanyRating } from '@/components/company/CompanyRating';
import { VipBadge } from '@/components/company/VipBadge';
import { FilterTag } from '@/components/company/FilterTag';
import { EmptyState } from '@/components/company/EmptyState';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Icon } from '@iconify/react/dist/iconify.js';
import { navigationItems, footerLinks } from '@/config/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { Slider } from '@/components/ui/slider';
import type { Company } from '@/types/api';
import { fetchCompaniesFromApi } from '@/services/companiesApi';

type CatalogSortBy = 'rating' | 'cheapest' | 'name' | 'newest';

const DEFAULT_PRICE_RANGE: [number, number] = [0, 10000];

const useCatalogQueryParams = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>(DEFAULT_PRICE_RANGE);
  const [city, setCity] = useState('');
  const [isVipOnly, setIsVipOnly] = useState(false);
  const [onboardingFree, setOnboardingFree] = useState(false);
  const [sortBy, setSortBy] = useState<CatalogSortBy>('newest');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const qParam = params.get('q');
    if (qParam !== null && qParam !== searchTerm) {
      setSearchTerm(qParam);
    }

    const ratingParam = params.get('rating');
    if (ratingParam !== null) {
      const parsed = Number(ratingParam);
      if (Number.isInteger(parsed) && parsed >= 0 && parsed <= 5 && parsed !== minRating) {
        setMinRating(parsed);
      }
    }

    const cityParam = params.get('city');
    if (cityParam !== null && cityParam !== city) {
      setCity(cityParam);
    }

    const vipParam = params.get('vipOnly');
    if (vipParam !== null) {
      const nextVip = vipParam === '1' || vipParam === 'true';
      if (nextVip !== isVipOnly) {
        setIsVipOnly(nextVip);
      }
    }

    const onboardingParam = params.get('onboardingFree');
    if (onboardingParam !== null) {
      const nextOnboarding = onboardingParam === '1' || onboardingParam === 'true';
      if (nextOnboarding !== onboardingFree) {
        setOnboardingFree(nextOnboarding);
      }
    }

    const priceMinParam = params.get('priceMin');
    const priceMaxParam = params.get('priceMax');
    if (priceMinParam !== null && priceMaxParam !== null) {
      const parsedMin = Number(priceMinParam);
      const parsedMax = Number(priceMaxParam);
      if (Number.isFinite(parsedMin) && Number.isFinite(parsedMax)) {
        const nextRange: [number, number] = [parsedMin, parsedMax];
        if (nextRange[0] !== priceRange[0] || nextRange[1] !== priceRange[1]) {
          setPriceRange(nextRange);
        }
      }
    }

    const sortParam = params.get('sort');
    if (
      sortParam === 'rating' ||
      sortParam === 'cheapest' ||
      sortParam === 'name' ||
      sortParam === 'newest'
    ) {
      if (sortParam !== sortBy) {
        setSortBy(sortParam);
      }
    }

    const pageParam = params.get('page');
    if (pageParam !== null) {
      const parsed = Number(pageParam);
      if (Number.isInteger(parsed) && parsed > 0 && parsed !== page) {
        setPage(parsed);
      }
    }
  }, [location.search]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, minRating, priceRange, city, isVipOnly, onboardingFree, sortBy]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    const trimmedSearch = searchTerm.trim();
    if (trimmedSearch.length > 0) {
      params.set('q', trimmedSearch);
    } else {
      params.delete('q');
    }

    if (minRating > 0) {
      params.set('rating', String(minRating));
    } else {
      params.delete('rating');
    }

    if (priceRange[0] !== DEFAULT_PRICE_RANGE[0]) {
      params.set('priceMin', String(priceRange[0]));
    } else {
      params.delete('priceMin');
    }

    if (priceRange[1] !== DEFAULT_PRICE_RANGE[1]) {
      params.set('priceMax', String(priceRange[1]));
    } else {
      params.delete('priceMax');
    }

    if (city.trim().length > 0) {
      params.set('city', city.trim());
    } else {
      params.delete('city');
    }

    if (isVipOnly) {
      params.set('vipOnly', '1');
    } else {
      params.delete('vipOnly');
    }

    if (onboardingFree) {
      params.set('onboardingFree', '1');
    } else {
      params.delete('onboardingFree');
    }

    if (sortBy !== 'newest') {
      params.set('sort', sortBy);
    } else {
      params.delete('sort');
    }

    if (page > 1) {
      params.set('page', String(page));
    } else {
      params.delete('page');
    }

    const search = params.toString();

    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
      },
      { replace: true },
    );
  }, [
    searchTerm,
    minRating,
    priceRange,
    city,
    isVipOnly,
    onboardingFree,
    sortBy,
    page,
    location.pathname,
    navigate,
  ]);

  const setPageSafe = (value: number | ((prev: number) => number)) => {
    if (typeof value === 'function') {
      setPage((value as (prev: number) => number));
      return;
    }

    setPage(value);
  };

  return {
    searchTerm,
    setSearchTerm,
    minRating,
    setMinRating,
    priceRange,
    setPriceRange,
    city,
    setCity,
    isVipOnly,
    setIsVipOnly,
    onboardingFree,
    setOnboardingFree,
    sortBy,
    setSortBy,
    page,
    setPage: setPageSafe,
  };
};

const filterAndSortCompanies = (
  companies: Company[],
  options: {
    searchTerm: string;
    city: string;
    minRating: number;
    isVipOnly: boolean;
    onboardingFree: boolean;
    priceRange: [number, number];
    sortBy: CatalogSortBy;
  },
): Company[] => {
  const trimmedSearch = options.searchTerm.trim().toLowerCase();
  const trimmedCity = options.city.trim().toLowerCase();

  const filtered = companies.filter((company) => {
    const locationCity = company.location?.city ?? '';
    const locationState = company.location?.state ?? '';

    if (trimmedSearch.length > 0) {
      const source = `${company.name} ${company.description ?? ''} ${locationCity} ${locationState}`.toLowerCase();
      if (!source.includes(trimmedSearch)) {
        return false;
      }
    }

    if (trimmedCity.length > 0) {
      if (!locationCity.toLowerCase().includes(trimmedCity)) {
        return false;
      }
    }

    if (options.minRating > 0 && company.rating < options.minRating) {
      return false;
    }

    if (options.isVipOnly && !company.vipStatus) {
      return false;
    }

    if (options.onboardingFree && !company.onboarding?.isFree) {
      return false;
    }

    const companyMinPrice = company.priceRange?.min ?? 0;
    const companyMaxPrice = company.priceRange?.max ?? 0;
    const hasCompanyPriceRange = companyMinPrice > 0 || companyMaxPrice > 0;

    const isDefaultPriceRange =
      options.priceRange[0] === DEFAULT_PRICE_RANGE[0] &&
      options.priceRange[1] === DEFAULT_PRICE_RANGE[1];

    // Only apply price filtering when the user has changed the slider
    // from the default range, and only for companies that actually
    // have a meaningful price range configured.
    if (!isDefaultPriceRange && hasCompanyPriceRange) {
      if (companyMinPrice < options.priceRange[0] || companyMaxPrice > options.priceRange[1]) {
        return false;
      }
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (options.sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'cheapest':
        return (a.priceRange?.min ?? 0) - (b.priceRange?.min ?? 0);
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
      default:
        return (b.establishedYear ?? 0) - (a.establishedYear ?? 0);
    }
  });

  return sorted;
};

const CompanyCatalogPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { favorites, toggleFavorite } = useFavorites();
  const shouldReduceMotion = useReducedMotion();

  const {
    searchTerm,
    setSearchTerm,
    minRating,
    setMinRating,
    priceRange,
    setPriceRange,
    city,
    setCity,
    isVipOnly,
    setIsVipOnly,
    onboardingFree,
    setOnboardingFree,
    sortBy,
    setSortBy,
    page,
    setPage,
  } = useCatalogQueryParams();

  const pageSize = 9;

  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCardMotionProps = (index: number) => {
    if (shouldReduceMotion) {
      return {};
    }

    const delay = index * 0.035;

    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.25, ease: 'easeOut' as const, delay },
    };
  };

  const handleCardKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    targetCompanyId: string,
  ) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate(`/company/${targetCompanyId}`);
    }
  };

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const companiesFromApi = await fetchCompaniesFromApi();
      setAllCompanies(companiesFromApi);
    } catch (err) {
      setError(t('catalog.error.fetch'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  const handleRetry = useCallback(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const filteredCompanies = useMemo(
    () =>
      filterAndSortCompanies(allCompanies, {
        searchTerm,
        city,
        minRating,
        isVipOnly,
        onboardingFree,
        priceRange,
        sortBy,
      }),
    [allCompanies, searchTerm, city, minRating, isVipOnly, onboardingFree, priceRange, sortBy],
  );

  const totalResults = filteredCompanies.length;
  const totalPages = totalResults === 0 ? 0 : Math.ceil(totalResults / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const paginatedCompanies = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCompanies.slice(startIndex, startIndex + pageSize);
  }, [filteredCompanies, currentPage, pageSize]);

  const hasRatingFilter = minRating > 0;
  const hasVipFilter = isVipOnly;
  const hasPriceFilter =
    priceRange[0] > DEFAULT_PRICE_RANGE[0] || priceRange[1] < DEFAULT_PRICE_RANGE[1];
  const hasCityFilter = city.trim().length > 0;
  const hasOnboardingFilter = onboardingFree;

  const hasAnyActiveFilter =
    hasRatingFilter || hasVipFilter || hasPriceFilter || hasCityFilter || hasOnboardingFilter ||
    searchTerm.trim().length > 0 || sortBy !== 'newest';

  const handleResetAllFilters = () => {
    setSearchTerm('');
    setMinRating(0);
    setPriceRange(DEFAULT_PRICE_RANGE);
    setCity('');
    setIsVipOnly(false);
    setOnboardingFree(false);
    setSortBy('newest');
    setPage(1);

    // Ensure URL is fully reset so filters are URL-dependent and sharable
    navigate('/catalog', { replace: true });
  };

  const scrollToTopSmooth = () => {
    if (typeof window === 'undefined') return;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevPage = () => {
    setPage((prev) => {
      const nextPage = Math.max(1, prev - 1);
      if (nextPage !== prev) {
        scrollToTopSmooth();
      }
      return nextPage;
    });
  };

  const handleNextPage = () => {
    setPage((prev) => {
      const nextPage = Math.min(totalPages, prev + 1);
      if (nextPage !== prev) {
        scrollToTopSmooth();
      }
      return nextPage;
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={navigationItems}
      />

      <main
        className="flex-1"
        role="main"
        aria-busy={isLoading}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">{t('catalog.title')}</h1>
            <p className="text-muted-foreground">{t('catalog.subtitle')}</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('catalog.filters.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isLoading ? (
                    <>
                      <div className="space-y-3">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-2 w-full" />
                      </div>
                      <div className="space-y-3">
                        <Skeleton className="h-3 w-28" />
                        <Skeleton className="h-9 w-full" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Geography */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">{t('catalog.filters.geography')}</label>
                        <div className="space-y-2">
                          <Input
                            placeholder={t('catalog.filters.city_placeholder')}
                            value={city}
                            onChange={(event) => setCity(event.target.value)}
                          />
                        </div>
                      </div>

                      {/* Services */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">{t('catalog.filters.services')}</label>
                        <p className="text-xs text-muted-foreground">
                          {t('catalog.filters.services_soon')}
                        </p>
                      </div>

                      {/* Price Range */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          {t('catalog.filters.price')}: ${priceRange[0]} - ${priceRange[1]}
                        </label>
                        <Slider
                          value={priceRange}
                          onValueChange={(value: number[]) => setPriceRange([value[0], value[1]])}
                          max={10000}
                          min={0}
                          step={500}
                          className="w-full"
                        />
                      </div>

                      {/* Rating */}
                      <div>
                        <label className="text-sm font-medium mb-2 block">{t('catalog.filters.rating')}</label>
                        <Select
                          value={minRating.toString()}
                          onValueChange={(value) => setMinRating(parseInt(value, 10))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">{t('catalog.filters.rating_all')}</SelectItem>
                            <SelectItem value="3">{t('catalog.filters.rating_3_plus')}</SelectItem>
                            <SelectItem value="4">{t('catalog.filters.rating_4_plus')}</SelectItem>
                            <SelectItem value="5">{t('catalog.filters.rating_5')}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* VIP Only */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="vip"
                          checked={isVipOnly}
                          onCheckedChange={(checked) => setIsVipOnly(!!checked)}
                        />
                        <label htmlFor="vip" className="text-sm font-medium">{t('catalog.filters.vip_only')}</label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="onboarding-free"
                          checked={onboardingFree}
                          onCheckedChange={(checked) => setOnboardingFree(!!checked)}
                        />
                        <label htmlFor="onboarding-free" className="text-sm font-medium">{t('catalog.filters.free_onboarding')}</label>
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="w-full justify-center"
                        onClick={handleResetAllFilters}
                      >
                        {t('catalog.tags.reset_all')}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              {/* Search and Sort Controls */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                {isLoading ? (
                  <>
                    <Skeleton className="h-9 w-full flex-1" />
                    <Skeleton className="h-9 w-full sm:w-48" />
                  </>
                ) : (
                  <>
                    <div className="flex-1">
                      <Input
                        placeholder={t('catalog.search.placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder={t('catalog.sort.label')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">{t('catalog.sort.newest')}</SelectItem>
                        <SelectItem value="rating">{t('catalog.sort.rating')}</SelectItem>
                        <SelectItem value="cheapest">{t('catalog.sort.cheapest')}</SelectItem>
                        <SelectItem value="name">{t('catalog.sort.name')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </>
                )}
              </div>

              {/* Results Count */}
              <div className="mb-6">
                <p
                  className="text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  {t('catalog.results.showing')} {isLoading ? 0 : paginatedCompanies.length} {t('catalog.results.connector')} {totalResults}{t('catalog.results.of')}
                </p>
              </div>

              {error && !isLoading && (
                <Card className="mb-6 border-destructive/50" role="alert" aria-live="assertive">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 text-destructive">
                      <Icon icon="mdi:alert-circle" className="h-5 w-5" />
                      <span>{error}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      onClick={handleRetry}
                    >
                      <Icon icon="mdi:refresh" className="me-2 h-4 w-4" />
                      {t('catalog.error.retry')}
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="sm"
                      className="w-fit text-muted-foreground"
                    >
                      <Link to="/">
                        <Icon icon="mdi:home" className="me-2 h-4 w-4" aria-hidden="true" />
                        {t('navigation.home')}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {hasAnyActiveFilter && (
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">{t('catalog.tags.active')}</span>
                  {searchTerm.trim().length > 0 && (
                    <FilterTag onClick={() => setSearchTerm('')}>
                      {t('catalog.tags.search')} {searchTerm}
                    </FilterTag>
                  )}
                  {sortBy !== 'newest' && (
                    <FilterTag onClick={() => setSortBy('newest')}>
                      {t('catalog.tags.sort')} {sortBy === 'rating' ? t('catalog.sort.rating') : sortBy === 'cheapest' ? t('catalog.sort.cheapest') : t('catalog.sort.name')}
                    </FilterTag>
                  )}
                  {hasRatingFilter && (
                    <FilterTag onClick={() => setMinRating(0)}>
                      {t('catalog.filters.rating')} {minRating}+
                    </FilterTag>
                  )}
                  {hasPriceFilter && (
                    <FilterTag onClick={() => setPriceRange(DEFAULT_PRICE_RANGE)}>
                      {t('catalog.filters.price')} ${priceRange[0]} - ${priceRange[1]}
                    </FilterTag>
                  )}
                  {hasVipFilter && (
                    <FilterTag onClick={() => setIsVipOnly(false)}>
                      VIP
                    </FilterTag>
                  )}
                  {hasCityFilter && (
                    <FilterTag onClick={() => setCity('')}>
                      {city}
                    </FilterTag>
                  )}
                  {hasOnboardingFilter && (
                    <FilterTag onClick={() => setOnboardingFree(false)}>
                      {t('catalog.filters.free_onboarding')}
                    </FilterTag>
                  )}
                  <FilterTag onClick={handleResetAllFilters}>
                    {t('catalog.tags.reset_all')}
                  </FilterTag>
                </div>
              )}

              <div
                className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                aria-busy={isLoading}
                role="list"
              >
                {isLoading
                  ? Array.from({ length: pageSize }).map((_, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                            <Skeleton className="h-4 w-12 rounded-full" />
                          </div>
                          <Skeleton className="mt-2 h-4 w-3/4" />
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <Skeleton className="h-3 w-1/2" />
                            <Skeleton className="h-3 w-2/3" />
                            <Skeleton className="h-3 w-1/3" />
                            <Skeleton className="h-3 w-1/4" />
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  : paginatedCompanies.map((company, index) => {
                      const companyId = String(company.id);
                      const locationCity = company.location?.city ?? '';
                      const locationState = company.location?.state ?? '';
                      const priceMin = company.priceRange?.min ?? 0;
                      const priceMax = company.priceRange?.max ?? 0;
                      const services = company.services ?? [];
                      const isFavorite = favorites.includes(companyId);

                      return (
                        <motion.article
                          key={companyId}
                          {...getCardMotionProps(index)}
                          role="listitem"
                          className="h-full"
                        >
                          <Card
                            className="flex h-full flex-col cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                            role="link"
                            tabIndex={0}
                            onClick={() => navigate(`/company/${companyId}`)}
                            onKeyDown={(event) => handleCardKeyDown(event, companyId)}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                {company.logo && (
                                  <img
                                    src={company.logo}
                                    alt={company.name}
                                    className="w-12 h-12 rounded-lg object-cover"
                                  />
                                )}
                                <div className="flex items-center gap-2">
                                  {company.vipStatus && <VipBadge />}
                                  <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={(event) => {
                                      event.stopPropagation();
                                      toggleFavorite(companyId);
                                    }}
                                    aria-pressed={isFavorite}
                                    aria-label={isFavorite ? t('catalog.card.remove_favorite') : t('catalog.card.add_favorite')}
                                  >
                                    <Icon
                                      icon={isFavorite ? 'mdi:heart' : 'mdi:heart-outline'}
                                      className={isFavorite ? 'h-4 w-4 text-red-500' : 'h-4 w-4 text-muted-foreground'}
                                    />
                                  </Button>
                                </div>
                              </div>
                              <CardTitle className="text-lg leading-tight">{company.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-0 flex-1 flex flex-col">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center space-x-2">
                                  <CompanyRating rating={company.rating} />
                                  <span className="text-sm text-muted-foreground">
                                    ({company.reviewCount})
                                  </span>
                                </div>
                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Icon icon="mdi:map-marker" className="h-4 w-4 me-1" />
                                  {locationCity}, {locationState}
                                </div>
                                <div className="flex items-center text-sm">
                                  <Icon icon="mdi:cash" className="h-4 w-4 me-1 text-primary" />
                                  <span className="font-medium">
                                    ${priceMin} - ${priceMax}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                  {services.slice(0, 2).map((service) => (
                                    <span
                                      key={service}
                                      className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md"
                                    >
                                      {service}
                                    </span>
                                  ))}
                                  {services.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{services.length - 2} more
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {t('catalog.card.founded')} {company.establishedYear}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.article>
                      );
                    })}
              </div>

              {!isLoading && totalPages > 1 && (
                <nav
                  className="mt-6 flex items-center justify-between gap-4"
                  aria-label={t('catalog.pagination.label')}
                >
                  <p className="text-xs text-muted-foreground">
                    {t('catalog.pagination.page')} {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                      aria-label={t('catalog.pagination.prev')}
                      motionVariant="scale"
                    >
                      <Icon icon="mdi:chevron-left" className="me-1 h-4 w-4" />
                      {t('catalog.pagination.prev')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      aria-label={t('catalog.pagination.next')}
                      motionVariant="scale"
                    >
                      {t('catalog.pagination.next')}
                      <Icon icon="mdi:chevron-right" className="ms-1 h-4 w-4" />
                    </Button>
                  </div>
                </nav>
              )}

              {!isLoading && totalResults === 0 && (
                <Card className="mt-6 p-12">
                  <EmptyState
                    icon="mdi:magnify-remove"
                    title={t('catalog.results.empty_title')}
                    description={t('catalog.results.empty_description')}
                    action={(
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <Button
                          onClick={() => setSearchTerm('')}
                          motionVariant="scale"
                        >
                          {t('catalog.search.clear')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResetAllFilters}
                          motionVariant="scale"
                          className="inline-flex items-center gap-1"
                        >
                          <Icon
                            icon="mdi:filter-remove-outline"
                            className="h-4 w-4"
                            aria-hidden="true"
                          />
                          <span>{t('catalog.tags.reset_all')}</span>
                        </Button>
                      </div>
                    )}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer footerLinks={footerLinks} />
    </div>
  );
};

export default CompanyCatalogPage;
