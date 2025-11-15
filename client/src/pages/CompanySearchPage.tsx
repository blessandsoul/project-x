import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Skeleton } from '@/components/ui/skeleton';
import { mockNavigationItems, mockFooterLinks, mockSearchFilters, mockCompanies } from '@/mocks/_mockData';
import type { Company } from '@/mocks/_mockData';
import { useCompanySearch } from '@/hooks/useCompanySearch';
import { filterCompaniesBySearchFilters } from '@/lib/utils';
import { useFavorites } from '@/hooks/useFavorites';
import { useCompaniesData } from '@/hooks/useCompaniesData';

const CompanySearchPage = () => {
  const navigate = useNavigate();
  const { state, updateFilters, resetFilters } = useCompanySearch();
  const { filters } = state;
  const { favorites, toggleFavorite } = useFavorites();
  const { companies, isLoading } = useCompaniesData();
  const shouldReduceMotion = useReducedMotion();
  const filteredCompanies = filterCompaniesBySearchFilters(companies, filters);
  const previewCompanies = filteredCompanies.slice(0, 6);

  const getCardMotionProps = (index: number) => {
    if (shouldReduceMotion) {
      return {};
    }

    const delay = index * 0.04;

    return {
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.25, ease: 'easeOut' as const, delay },
    };
  };

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
    hasGeoFilter || hasServiceFilter || hasRatingFilter || hasVipFilter || hasPriceFilter;

  useEffect(() => {
    // Keep effect for potential future side effects related to search page lifecycle
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        user={null}
        navigationItems={mockNavigationItems}
      />

      <main className="flex-1" role="main">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">მოძებნეთ იმპორტის კომპანიები</h1>
            <p className="text-muted-foreground">გამოიყენეთ ფილტრები საუკეთესო ვარიანტის მოსაძებნად</p>
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
                      {mockSearchFilters.geography.map(state => (
                        <div key={state} className="flex items-center space-x-2">
                          <Checkbox
                            id={state}
                            checked={filters.geography.includes(state)}
                            onCheckedChange={(checked) => {
                              const newGeo = checked
                                ? [...filters.geography, state]
                                : filters.geography.filter(g => g !== state);
                              updateFilters({ geography: newGeo });
                            }}
                          />
                          <label htmlFor={state} className="text-sm">{state}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Services */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">მომსახურება</label>
                    <div className="space-y-2">
                      {mockSearchFilters.services.map(service => (
                        <div key={service} className="flex items-center space-x-2">
                          <Checkbox
                            id={service}
                            checked={filters.services.includes(service)}
                            onCheckedChange={(checked) => {
                              const newServices = checked
                                ? [...filters.services, service]
                                : filters.services.filter(s => s !== service);
                              updateFilters({ services: newServices });
                            }}
                          />
                          <label htmlFor={service} className="text-sm">{service}</label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      ფასი: ${filters.priceRange[0]} - ${filters.priceRange[1]}
                    </label>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value: number[]) => updateFilters({ priceRange: [value[0], value[1]] })}
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
                      value={filters.rating.toString()}
                      onValueChange={(value) => updateFilters({ rating: parseInt(value) })}
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
                      checked={filters.vipOnly}
                      onCheckedChange={(checked) => updateFilters({ vipOnly: !!checked })}
                    />
                    <label htmlFor="vip" className="text-sm font-medium">მხოლოდ VIP კომპანიები</label>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-3">
              <div className="mb-4 flex justify-between items-center">
                <p
                  className="text-sm text-muted-foreground"
                  role="status"
                  aria-live="polite"
                >
                  ნაპოვნია {previewCompanies.length} კომპანია
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate('/catalog')}
                  motionVariant="scale"
                >
                  <Icon icon="mdi:view-grid" className="mr-2 h-4 w-4" />
                  ნახე ყველა
                </Button>
              </div>

              {hasAnyActiveFilter && (
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className="text-muted-foreground">აქტიური ფილტრები:</span>
                  {hasGeoFilter &&
                    filters.geography.map((geo) => (
                      <Badge key={`geo-${geo}`} variant="outline">
                        {geo}
                      </Badge>
                    ))}
                  {hasServiceFilter &&
                    filters.services.map((service) => (
                      <Badge key={`service-${service}`} variant="outline">
                        {service}
                      </Badge>
                    ))}
                  {hasRatingFilter && (
                    <Badge variant="outline">რეიტინგი {filters.rating}+</Badge>
                  )}
                  {hasPriceFilter && (
                    <Badge variant="outline">
                      ფასი ${filters.priceRange[0]} - ${filters.priceRange[1]}
                    </Badge>
                  )}
                  {hasVipFilter && <Badge variant="outline">VIP</Badge>}
                </div>
              )}

              <div
                className="grid gap-4 md:grid-cols-2"
                aria-busy={isLoading}
                role="list"
              >
                {isLoading
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <Card key={index}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <Skeleton className="w-12 h-12 rounded-lg" />
                            <div className="flex-1 space-y-3">
                              <Skeleton className="h-4 w-3/4" />
                              <Skeleton className="h-3 w-1/2" />
                              <Skeleton className="h-3 w-2/3" />
                              <Skeleton className="h-3 w-1/3" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  : previewCompanies.map((company: Company, index) => (
                      <motion.article
                        key={company.id}
                        {...getCardMotionProps(index)}
                        role="listitem"
                      >
                        <Card
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/company/${company.id}`)}
                        >
                          <CardContent className="p-6">
                            <div className="flex items-start space-x-4">
                              <img
                                src={company.logo}
                                alt={company.name}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-semibold">{company.name}</h3>
                                  <div className="flex items-center gap-2">
                                    {company.vipStatus && (
                                      <span className="bg-orange-100 text-orange-800 text-xs px-2 py-1 rounded-full">
                                        VIP
                                      </span>
                                    )}
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
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="flex items-center">
                                    <Icon icon="mdi:star" className="h-4 w-4 text-yellow-400 fill-current" />
                                    <span className="text-sm ml-1">{company.rating}</span>
                                  </div>
                                  <span className="text-sm text-muted-foreground">
                                    ({company.reviewCount} შეფასება)
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {company.location.city}, {company.location.state}
                                </p>
                                <p className="text-sm">
                                  ${company.priceRange.min} - ${company.priceRange.max}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.article>
                    ))}
              </div>

              {!isLoading && previewCompanies.length === 0 && (
                <Card className="p-8 text-center">
                  <Icon
                    icon="mdi:magnify-remove"
                    className="h-12 w-12 mx-auto text-muted-foreground mb-4"
                  />
                  <h3 className="text-lg font-semibold mb-2">კომპანიები არ მოიძებნა</h3>
                  <p className="text-muted-foreground mb-4">ცადეთ სხვა ფილტრები</p>
                  <Button
                    onClick={() => resetFilters()}
                    motionVariant="scale"
                  >
                    გაასუფთავეთ ფილტრები
                  </Button>
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

export default CompanySearchPage;
