import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Icon } from '@iconify/react/dist/iconify.js';
import { mockNavigationItems, mockFooterLinks, mockCompanies, mockSearchFilters } from '@/mocks/_mockData';
import { useCompanySearch } from '@/hooks/useCompanySearch';
import { filterCompaniesBySearchFilters } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavorites } from '@/hooks/useFavorites';
import { useCompaniesData } from '@/hooks/useCompaniesData';

const CompanyCatalogPage = () => {
  const navigate = useNavigate();
  const { state } = useCompanySearch();
  const { filters } = state;
  const { favorites, toggleFavorite } = useFavorites();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('rating');
  const [page, setPage] = useState(1);
  const pageSize = 9;
  const shouldReduceMotion = useReducedMotion();
  const { companies, isLoading } = useCompaniesData();

  const filteredByFilters = filterCompaniesBySearchFilters(companies, filters);

  const filteredCompanies = filteredByFilters.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.location.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.services.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedCompanies = [...filteredCompanies].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.rating - a.rating;
      case 'price-low':
        return a.priceRange.min - b.priceRange.min;
      case 'price-high':
        return b.priceRange.max - a.priceRange.max;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  const totalResults = sortedCompanies.length;
  const totalPages = totalResults === 0 ? 0 : Math.ceil(totalResults / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedCompanies = totalPages === 0
    ? []
    : sortedCompanies.slice(startIndex, startIndex + pageSize);

  const hasGeoFilter =
    filters.geography.length > 0 &&
    filters.geography.length !== mockSearchFilters.geography.length;

  const hasServiceFilter =
    filters.services.length > 0 &&
    filters.services.length !== mockSearchFilters.services.length;

  const hasRatingFilter = filters.rating > 0;
  const hasVipFilter = filters.vipOnly;
  const hasPriceFilter =
    filters.priceRange[0] !== mockSearchFilters.priceRange[0] ||
    filters.priceRange[1] !== mockSearchFilters.priceRange[1];

  const hasAnyActiveFilter =
    hasGeoFilter || hasServiceFilter || hasRatingFilter || hasVipFilter || hasPriceFilter ||
    searchTerm.trim().length > 0 || sortBy !== 'rating';

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
    setPage(1);
  }, [searchTerm, sortBy, filters]);

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

          {/* Search and Sort Controls */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            {isLoading ? (
              <>
                <Skeleton className="h-9 w-full flex-1" />
                <Skeleton className="h-9 w-full sm:w-48" />
                <Skeleton className="h-9 w-full sm:w-40" />
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
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="დალაგება" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">რეიტინგით</SelectItem>
                    <SelectItem value="price-low">ფასი (დაბალი)</SelectItem>
                    <SelectItem value="price-high">ფასი (მაღალი)</SelectItem>
                    <SelectItem value="name">სახელით</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => navigate('/search')}
                  motionVariant="scale"
                >
                  <Icon icon="mdi:filter-variant" className="mr-2 h-4 w-4" />
                  დამატებითი ფილტრები
                </Button>
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
              ნაჩვენებია {totalResults} კომპანია {companies.length}-დან
            </p>
          </div>

          {hasAnyActiveFilter && (
            <div className="mb-4 flex flex-wrap gap-2 text-xs">
              <span className="text-muted-foreground">aktiuri filt'rebi:</span>
              {searchTerm.trim().length > 0 && (
                <FilterTag>ძიება: {searchTerm}</FilterTag>
              )}
              {sortBy !== 'rating' && (
                <FilterTag>
                  დალაგება: {sortBy === 'price-low' ? 'ფასი (დაბალი)' : sortBy === 'price-high' ? 'ფასი (მაღალი)' : 'სახელით'}
                </FilterTag>
              )}
              {hasGeoFilter &&
                filters.geography.map((geo) => (
                  <FilterTag key={`geo-${geo}`}>
                    {geo}
                  </FilterTag>
                ))}
              {hasServiceFilter &&
                filters.services.map((service) => (
                  <FilterTag key={`service-${service}`}>
                    {service}
                  </FilterTag>
                ))}
              {hasRatingFilter && (
                <FilterTag>რეიტინგი {filters.rating}+</FilterTag>
              )}
              {hasPriceFilter && (
                <FilterTag>
                  ფასი ${filters.priceRange[0]} - ${filters.priceRange[1]}
                </FilterTag>
              )}
              {hasVipFilter && <FilterTag>VIP</FilterTag>}
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
              : paginatedCompanies.map((company, index) => (
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
                          <img
                            src={company.logo}
                            alt={company.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
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
      </main>

      <Footer footerLinks={mockFooterLinks} />
    </div>
  );
};

export default CompanyCatalogPage;
