import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { Icon } from '@iconify/react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/company/EmptyState';
import { SearchFilterHeader } from '@/components/company/SearchFilterHeader';
import { CompanyList } from '@/components/company/CompanyList';

import type { Company } from '@/types/api';
import { searchCompaniesFromApi } from '@/services/companiesApi';
import { cn } from '@/lib/utils';

const DEFAULT_LIMIT = 20;

const CompaniesPage = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get URL params
  const searchQuery = searchParams.get('search') || '';
  const isVip = searchParams.get('vip') === 'true';
  const limit = Number(searchParams.get('limit')) || DEFAULT_LIMIT;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState(searchQuery);

  // Memoized load companies function
  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { companies: data, total } = await searchCompaniesFromApi({
        limit,
        search: searchQuery || undefined,
        isVip: isVip || undefined,
      });
      setCompanies(data);
      setTotalCompanies(total);
    } catch (err) {
      console.error('[CompaniesPage] Failed to load companies', err);
      setError(t('companies.error.load', 'Failed to load companies. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [t, limit, searchQuery, isVip]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  // Memoized paginated companies
  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * limit;
    return companies.slice(start, start + limit);
  }, [companies, page, limit]);

  const totalPages = useMemo(() => Math.ceil(companies.length / limit), [companies.length, limit]);

  // Memoized handlers
  const handleRetry = useCallback(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (searchInput.trim()) {
      newParams.set('search', searchInput.trim());
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
    setPage(1);
  }, [searchInput, searchParams, setSearchParams]);

  const handleSearchInputChange = useCallback((value: string) => {
    setSearchInput(value);
  }, []);

  const handleVipToggle = useCallback((checked: boolean) => {
    const newParams = new URLSearchParams(searchParams);
    if (checked) {
      newParams.set('vip', 'true');
    } else {
      newParams.delete('vip');
    }
    setSearchParams(newParams);
    setPage(1);
  }, [searchParams, setSearchParams]);

  const handleLimitChange = useCallback((newLimit: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('limit', String(newLimit));
    setSearchParams(newParams);
    setPage(1);
  }, [searchParams, setSearchParams]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="w-full max-w-[1400px] mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-slate-900">
            {t('navigation.companies')}
          </h1>
        </div>
      </div>

      <main className="w-full max-w-[1400px] mx-auto px-4 py-6">
        {/* Filters & Search Bar - Memoized Component */}
        {!isLoading && !error && (
          <SearchFilterHeader
            searchInput={searchInput}
            onSearchInputChange={handleSearchInputChange}
            onSearchSubmit={handleSearchSubmit}
            isVip={isVip}
            onVipToggle={handleVipToggle}
            limit={limit}
            onLimitChange={handleLimitChange}
            totalCompanies={companies.length}
            displayedCount={paginatedCompanies.length}
          />
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-3 xl:gap-4 grid-cols-1 md:grid-cols-2 min-[1400px]:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-white shadow-sm px-4 py-3 space-y-3">
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
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="py-16">
            <EmptyState
              icon="mdi:alert-circle-outline"
              title={t('companies.error.title', 'Something went wrong')}
              description={error}
              action={
                <Button onClick={handleRetry} variant="outline">
                  <Icon icon="mdi:refresh" className="mr-2 h-4 w-4" />
                  {t('common.retry', 'Try Again')}
                </Button>
              }
            />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && companies.length === 0 && (
          <div className="py-16">
            <EmptyState
              icon="mdi:office-building-outline"
              title={t('companies.empty.title', 'No companies found')}
              description={t('companies.empty.description', 'There are no companies available at the moment.')}
            />
          </div>
        )}

        {/* Companies List - Memoized Component */}
        {!isLoading && !error && companies.length > 0 && (
          <>
            <CompanyList companies={paginatedCompanies} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className={cn(
                    'h-7 w-7 p-0 flex items-center justify-center text-[11px] transition-all',
                    page <= 1
                      ? 'border-slate-200 text-slate-400 bg-transparent cursor-not-allowed'
                      : 'border-slate-300 text-slate-600 bg-white hover:bg-slate-50'
                  )}
                >
                  <Icon icon="mdi:chevron-left" className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-0.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                    const isActive = p === page;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => !isActive && handlePageChange(p)}
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                  disabled={page >= totalPages}
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
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default CompaniesPage;
