import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

import Header from '@/components/Header/index.tsx';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { EmptyState } from '@/components/company/EmptyState';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { CatalogFilters } from '@/components/catalog/CatalogFilters';
import { CompanyListItem } from '@/components/catalog/CompanyListItem';
import { CompanyComparisonModal } from '@/components/comparison/CompanyComparisonModal';

import type { Company } from '@/types/api';
import { fetchCompaniesFromApi } from '@/services/companiesApi';
import { navigationItems, footerLinks } from '@/config/navigation';

type CatalogSortBy = 'rating' | 'cheapest' | 'name' | 'newest';

const DEFAULT_PRICE_RANGE: [number, number] = [0, 10000];

// Helper to manage URL params as state
const useCatalogQueryParams = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const searchTerm = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const minRating = parseInt(searchParams.get('rating') || '0', 10);
  const isVipOnly = searchParams.get('vipOnly') === '1';
  const onboardingFree = searchParams.get('onboardingFree') === '1';
  const sortBy = (searchParams.get('sort') as CatalogSortBy) || 'newest';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const priceMin = parseInt(searchParams.get('priceMin') || String(DEFAULT_PRICE_RANGE[0]), 10);
  const priceMax = parseInt(searchParams.get('priceMax') || String(DEFAULT_PRICE_RANGE[1]), 10);
  const priceRange: [number, number] = [priceMin, priceMax];

  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      if (!Object.keys(updates).includes('page')) {
          next.set('page', '1');
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setPage = (p: number) => updateParams({ page: String(p) });

  return {
    searchTerm,
    setSearchTerm: (v: string) => updateParams({ q: v || null }),
    minRating,
    setMinRating: (v: number) => updateParams({ rating: v > 0 ? String(v) : null }),
    priceRange,
    setPriceRange: (v: [number, number]) => {
        const isDefault = v[0] === DEFAULT_PRICE_RANGE[0] && v[1] === DEFAULT_PRICE_RANGE[1];
        updateParams({
            priceMin: isDefault ? null : String(v[0]),
            priceMax: isDefault ? null : String(v[1])
        });
    },
    city,
    setCity: (v: string) => updateParams({ city: v || null }),
    isVipOnly,
    setIsVipOnly: (v: boolean) => updateParams({ vipOnly: v ? '1' : null }),
    onboardingFree,
    setOnboardingFree: (v: boolean) => updateParams({ onboardingFree: v ? '1' : null }),
    sortBy,
    setSortBy: (v: CatalogSortBy) => updateParams({ sort: v === 'newest' ? null : v }),
    page,
    setPage,
    resetAll: () => setSearchParams(new URLSearchParams(), { replace: true })
  };
};

const filterAndSortCompanies = (companies: Company[], options: any): Company[] => {
  const { searchTerm, city, minRating, isVipOnly, onboardingFree, priceRange, sortBy } = options;
  const trimmedSearch = searchTerm.trim().toLowerCase();
  const trimmedCity = city.trim().toLowerCase();

  const filtered = companies.filter((company) => {
    if (trimmedSearch && !company.name.toLowerCase().includes(trimmedSearch)) return false;
    if (trimmedCity && !company.location?.city?.toLowerCase().includes(trimmedCity)) return false;
    if (minRating > 0 && company.rating < minRating) return false;
    if (isVipOnly && !company.vipStatus) return false;
    if (onboardingFree && !company.onboarding?.isFree) return false;
    
    const min = company.priceRange?.min ?? 0;
    const max = company.priceRange?.max ?? 0;
    const hasRange = min > 0 || max > 0;
    const isDefault = priceRange[0] === DEFAULT_PRICE_RANGE[0] && priceRange[1] === DEFAULT_PRICE_RANGE[1];
    
    if (!isDefault && hasRange) {
       if (min < priceRange[0] || max > priceRange[1]) return false;
    }

    return true;
  });

  return [...filtered].sort((a, b) => {
    switch (sortBy) {
      case 'rating': return b.rating - a.rating;
      case 'cheapest': return (a.priceRange?.min ?? 0) - (b.priceRange?.min ?? 0);
      case 'name': return a.name.localeCompare(b.name);
      case 'newest': default: return (b.establishedYear ?? 0) - (a.establishedYear ?? 0);
    }
  });
};

const CompanyCatalogPage = () => {
  const { t } = useTranslation();
  const {
    searchTerm, setSearchTerm, minRating, setMinRating, priceRange, setPriceRange,
    city, setCity, isVipOnly, setIsVipOnly, onboardingFree, setOnboardingFree,
    sortBy, setSortBy, page, setPage, resetAll
  } = useCatalogQueryParams();

  const pageSize = 10; // List view standard
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [selectedCompanies, setSelectedCompanies] = useState<number[]>([]);
  const [isComparisonModalOpen, setIsComparisonModalOpen] = useState(false);

  const toggleComparison = (id: number) => {
    setSelectedCompanies(prev => 
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCompaniesFromApi();
      setAllCompanies(data);
    } catch {
       // Handle error silently or show toaster
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void loadCompanies(); }, [loadCompanies]);

  const filteredCompanies = useMemo(
    () => filterAndSortCompanies(allCompanies, {
        searchTerm, city, minRating, isVipOnly, onboardingFree, priceRange, sortBy
    }),
    [allCompanies, searchTerm, city, minRating, isVipOnly, onboardingFree, priceRange, sortBy]
  );

  const totalResults = filteredCompanies.length;
  const totalPages = Math.ceil(totalResults / pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(page, totalPages);

  const paginatedCompanies = useMemo(
    () => filteredCompanies.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredCompanies, currentPage, pageSize],
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Header navigationItems={navigationItems} user={null} />

      {/* Breadcrumb-like Header Section */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl"
          >
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {t('catalog.title')}
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl">
              Compare trusted auto importers, check ratings, and find the best rates for your vehicle delivery.
            </p>
          </motion.div>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8 items-start">
          {/* Sidebar Filters */}
          <aside className="lg:col-span-1 sticky top-24 z-30">
            <CatalogFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              minRating={minRating}
              setMinRating={setMinRating}
              priceRange={priceRange}
              setPriceRange={setPriceRange}
              city={city}
              setCity={setCity}
              isVipOnly={isVipOnly}
              setIsVipOnly={setIsVipOnly}
              onboardingFree={onboardingFree}
              setOnboardingFree={setOnboardingFree}
              resetAll={resetAll}
            />
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
             {/* Results Header */}
             <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-2xl border border-slate-200/60">
                <p className="text-sm font-medium text-slate-600">
                  Showing <span className="font-bold text-slate-900">{paginatedCompanies.length}</span> of <span className="font-bold text-slate-900">{totalResults}</span> companies
                </p>
                
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <Toggle 
                      pressed={isCompareMode} 
                      onPressedChange={setIsCompareMode}
                      variant="outline"
                      aria-label="Toggle compare mode"
                      className="gap-2 data-[state=on]:bg-blue-50 data-[state=on]:text-blue-700 data-[state=on]:border-blue-200"
                   >
                      <Icon icon="mdi:compare-horizontal" className="h-4 w-4" />
                      <span className="text-sm font-medium">Compare</span>
                   </Toggle>

                   <span className="text-sm text-slate-500 whitespace-nowrap hidden sm:inline">Sort by:</span>
                   <Select value={sortBy} onValueChange={(v) => setSortBy(v as CatalogSortBy)}>
                      <SelectTrigger className="w-full sm:w-[180px] bg-white border-slate-200 shadow-sm">
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                         <SelectItem value="rating">Highest Rated</SelectItem>
                         <SelectItem value="cheapest">Lowest Fees</SelectItem>
                         <SelectItem value="newest">Experience (Years)</SelectItem>
                         <SelectItem value="name">Name (A-Z)</SelectItem>
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
                 <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="flex flex-col space-y-4"
                 >
                    <AnimatePresence mode="popLayout">
                      {paginatedCompanies.map((company) => (
                        <CompanyListItem 
                           key={company.id} 
                           company={company} 
                           isCompareMode={isCompareMode}
                           isSelected={selectedCompanies.includes(company.id)}
                           onToggleCompare={() => toggleComparison(company.id)}
                        />
                      ))}
                    </AnimatePresence>
                 </motion.div>
             ) : (
                 <EmptyState 
                    title="No companies found" 
                    description="Try adjusting your filters to see more results." 
                    icon="mdi:clipboard-text-off-outline"
                    action={<Button onClick={resetAll} variant="outline">Clear Filters</Button>}
                 />
             )}

             {/* Pagination */}
             {!isLoading && totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12">
                   <Button 
                     variant="outline" 
                     size="icon"
                     onClick={() => setPage(page - 1)} 
                     disabled={page <= 1}
                     className="rounded-full h-10 w-10 hover:bg-slate-100"
                   >
                     <Icon icon="mdi:chevron-left" className="h-5 w-5" />
                   </Button>
                   
                   <div className="flex items-center gap-1 px-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-10 w-10 rounded-full text-sm font-medium transition-all ${
                            p === currentPage 
                              ? 'bg-slate-900 text-white shadow-md scale-110' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                   </div>

                   <Button 
                     variant="outline" 
                     size="icon"
                     onClick={() => setPage(page + 1)} 
                     disabled={page >= totalPages}
                     className="rounded-full h-10 w-10 hover:bg-slate-100"
                   >
                     <Icon icon="mdi:chevron-right" className="h-5 w-5" />
                   </Button>
                </div>
             )}
          </div>
        </div>
      </main>
      <Footer footerLinks={footerLinks} />
      
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
               className="shadow-sm bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 h-8 rounded-full px-4"
            >
               <Icon icon="mdi:close" className="h-4 w-4 mr-1" />
               Cancel
            </Button>
            
            <Button 
               onClick={() => setIsComparisonModalOpen(true)} 
               className="bg-slate-900 hover:bg-blue-600 text-white shadow-xl shadow-blue-900/20 rounded-full px-6 h-14 flex items-center gap-3 transition-all hover:scale-105"
            >
               <div className="relative">
                 <Icon icon="mdi:compare-horizontal" className="h-6 w-6" />
                 <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full border border-slate-900">
                   {selectedCompanies.length}
                 </span>
               </div>
               <span className="font-bold text-lg tracking-tight">Compare Now</span>
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
