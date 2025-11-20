import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
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
import { mockNavigationItems, mockFooterLinks } from '@/mocks/_mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { Slider } from '@/components/ui/slider';
import type { Company } from '@/mocks/_mockData';
import { searchCompaniesFromApi } from '@/services/companiesApi';

const CompanyCatalogPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { favorites, toggleFavorite } = useFavorites();
  const shouldReduceMotion = useReducedMotion();

  const [searchTerm, setSearchTerm] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [priceRange, setPriceRange] = useState<[number, number]>([1000, 10000]);
  const [city, setCity] = useState('');
  const [isVipOnly, setIsVipOnly] = useState(false);
  const [onboardingFree, setOnboardingFree] = useState(false);
  const [sortBy, setSortBy] = useState<'rating' | 'cheapest' | 'name' | 'newest'>('newest');

  const [page, setPage] = useState(1);
  const pageSize = 9;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [total, setTotal] = useState(0);
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
  }, [
    location.search,
    searchTerm,
    minRating,
    priceRange,
    city,
    isVipOnly,
    onboardingFree,
    sortBy,
    page,
  ]);

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

    if (priceRange[0] !== 1000) {
      params.set('priceMin', String(priceRange[0]));
    } else {
      params.delete('priceMin');
    }

    if (priceRange[1] !== 10000) {
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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      const [minPrice, maxPrice] = priceRange;

      const params: Parameters<typeof searchCompaniesFromApi>[0] = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };

      const trimmedSearch = searchTerm.trim();
      if (trimmedSearch.length >= 4) {
        params.search = trimmedSearch;
      }

      if (minRating > 0) {
        params.minRating = minRating;
      }

      if (minPrice > 1000) {
        params.minBasePrice = minPrice;
      }

      if (maxPrice < 10000) {
        params.maxBasePrice = maxPrice;
      }

      if (city.trim().length > 0) {
        params.city = city.trim();
      }

      if (isVipOnly) {
        params.isVip = true;
      }

      if (onboardingFree) {
        params.onboardingFree = true;
      }

      switch (sortBy) {
        case 'rating':
          params.orderBy = 'rating';
          params.orderDirection = 'desc';
          break;
        case 'cheapest':
          params.orderBy = 'cheapest';
          params.orderDirection = 'asc';
          break;
        case 'name':
          params.orderBy = 'name';
          params.orderDirection = 'asc';
          break;
        case 'newest':
        default:
          break;
      }

      try {
        const result = await searchCompaniesFromApi(params);
        setCompanies(result.companies);
        setTotal(result.total);
      } catch (e) {
        setError('Failed to load companies');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [searchTerm, minRating, priceRange, city, isVipOnly, onboardingFree, sortBy, page, pageSize]);

  const totalResults = total;
  const totalPages = totalResults === 0 ? 0 : Math.ceil(totalResults / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const hasRatingFilter = minRating > 0;
  const hasVipFilter = isVipOnly;
  const hasPriceFilter = priceRange[0] > 1000 || priceRange[1] < 10000;
  const hasCityFilter = city.trim().length > 0;
  const hasOnboardingFilter = onboardingFree;

  const hasAnyActiveFilter =
    hasRatingFilter || hasVipFilter || hasPriceFilter || hasCityFilter || hasOnboardingFilter ||
    searchTerm.trim().length > 0 || sortBy !== 'newest';

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />

      <main
        className="flex-1"
        role="main"
        aria-busy={isLoading}
      >
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">კატალოგი იმპორტის კომპანიების</h1>
            <p className="text-muted-foreground">გაეცანით ყველა ხელმისაწვდომ კომპანიას</p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Filters Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">ფილტრები</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Geography */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">გეოგრაფია</label>
                    <div className="space-y-2">
                      <Input
                        placeholder="ქალაქი (მაგ. თბილისი)"
                        value={city}
                        onChange={(event) => setCity(event.target.value)}
                      />
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">მომსახურება</label>
                    <p className="text-xs text-muted-foreground">
                      მოამატებთ später, როცა იქნება API по услугам.
                    </p>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      ფასი: ${priceRange[0]} - ${priceRange[1]}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={(value: number[]) => setPriceRange([value[0], value[1]])}
                      max={10000}
                      min={1000}
                      step={500}
                      className="w-full"
                    />
                  </div>

                  {/* Rating */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">მინიმალური რეიტინგი</label>
                    <Select
                      value={minRating.toString()}
                      onValueChange={(value) => setMinRating(parseInt(value, 10))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">ყველა</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                        <SelectItem value="5">5</SelectItem>
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
                    <label htmlFor="vip" className="text-sm font-medium">მხოლოდ VIP კომპანიები</label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="onboarding-free"
                      checked={onboardingFree}
                      onCheckedChange={(checked) => setOnboardingFree(!!checked)}
                    />
                    <label htmlFor="onboarding-free" className="text-sm font-medium">უფასო ონბორდინგი</label>
                  </div>
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
                        placeholder="მოძებნეთ კომპანიები..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
                      <SelectTrigger className="w-full sm:w-48">
                        <SelectValue placeholder="დალაგება" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">უახლესი (ახალი)</SelectItem>
                        <SelectItem value="rating">რეიტინგით</SelectItem>
                        <SelectItem value="cheapest">ფასი (იაფი)</SelectItem>
                        <SelectItem value="name">სახელით</SelectItem>
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
                  ნაჩვენებია {companies.length} კომპანია {totalResults}-დან
                </p>
              </div>

              {hasAnyActiveFilter && (
                <div className="mb-4 flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">aktiuri filt'rebi:</span>
                  {searchTerm.trim().length > 0 && (
                    <FilterTag>ძიება: {searchTerm}</FilterTag>
                  )}
                  {sortBy !== 'newest' && (
                    <FilterTag>
                      დალაგება: {sortBy === 'rating' ? 'რეიტინგით' : sortBy === 'cheapest' ? 'ფასი (იაფი)' : 'სახელით'}
                    </FilterTag>
                  )}
                  {hasRatingFilter && (
                    <FilterTag>რეიტინგი {minRating}+</FilterTag>
                  )}
                  {hasPriceFilter && (
                    <FilterTag>
                      ფასი ${priceRange[0]} - ${priceRange[1]}
                    </FilterTag>
                  )}
                  {hasVipFilter && <FilterTag>VIP</FilterTag>}
                  {hasCityFilter && <FilterTag>{city}</FilterTag>}
                  {hasOnboardingFilter && <FilterTag>უფასო ონბორდინგი</FilterTag>}
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
                  : companies.map((company, index) => (
                      <motion.article
                        key={company.id}
                        {...getCardMotionProps(index)}
                        role="listitem"
                      >
                        <Card
                          className="cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                          onClick={() => navigate(`/company/${company.id}`)}
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
                                    toggleFavorite(company.id);
                                  }}
                                  aria-pressed={favorites.includes(company.id)}
                                  aria-label={favorites.includes(company.id) ? 'საყვარელი სიიდან ამოღება' : 'დამატება რჩეულებში'}
                                >
                                  <Icon
                                    icon={favorites.includes(company.id) ? 'mdi:heart' : 'mdi:heart-outline'}
                                    className={favorites.includes(company.id) ? 'h-4 w-4 text-red-500' : 'h-4 w-4 text-muted-foreground'}
                                  />
                                </Button>
                              </div>
                            </div>
                            <CardTitle className="text-lg leading-tight">{company.name}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <CompanyRating rating={company.rating} />
                                <span className="text-sm text-muted-foreground">
                                  ({company.reviewCount})
                                </span>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Icon icon="mdi:map-marker" className="h-4 w-4 mr-1" />
                                {company.location.city}, {company.location.state}
                              </div>
                              <div className="flex items-center text-sm">
                                <Icon icon="mdi:cash" className="h-4 w-4 mr-1 text-primary" />
                                <span className="font-medium">
                                  ${company.priceRange.min} - ${company.priceRange.max}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-1">
                                {company.services.slice(0, 2).map((service) => (
                                  <span
                                    key={service}
                                    className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-md"
                                  >
                                    {service}
                                  </span>
                                ))}
                                {company.services.length > 2 && (
                                  <span className="text-xs text-muted-foreground">
                                    +{company.services.length - 2} მეტი
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                დაფუძნებული: {company.establishedYear}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.article>
                    ))}
              </div>

              {!isLoading && totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-4">
                  <p className="text-xs text-muted-foreground">
                    გვერდი {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      aria-label="წინა გვერდი"
                      motionVariant="scale"
                    >
                      <Icon icon="mdi:chevron-left" className="mr-1 h-4 w-4" />
                      უკან
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="შემდეგი გვერდი"
                      motionVariant="scale"
                    >
                      შემდეგი
                      <Icon icon="mdi:chevron-right" className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!isLoading && totalResults === 0 && (
                <Card className="mt-6 p-12">
                  <EmptyState
                    icon="mdi:magnify-remove"
                    title="კომპანიები არ მოიძებნა"
                    description="სცადეთ სხვა საძიებო სიტყვები ან გაასუფთავეთ ფილტრები"
                    action={(
                      <Button
                        onClick={() => setSearchTerm('')}
                        motionVariant="scale"
                      >
                        გაასუფთავეთ საძიებო
                      </Button>
                    )}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default CompanyCatalogPage;
