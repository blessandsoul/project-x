import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/company/EmptyState';
import { Image } from '@/components/ui/image';

import type { Company } from '@/types/api';
import { searchCompaniesFromApi } from '@/services/companiesApi';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 12;

const CompaniesPage = () => {
  const { t } = useTranslation();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const loadCompanies = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { companies: data } = await searchCompaniesFromApi({ limit: 100 });
      setCompanies(data);
    } catch (err) {
      console.error('[CompaniesPage] Failed to load companies', err);
      setError(t('companies.error.load', 'Failed to load companies. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const totalPages = Math.ceil(companies.length / PAGE_SIZE);
  const paginatedCompanies = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return companies.slice(start, start + PAGE_SIZE);
  }, [companies, page]);

  const handleRetry = () => {
    void loadCompanies();
  };

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
        {/* Results Header */}
        {!isLoading && !error && companies.length > 0 && (
          <div className="flex items-center justify-between bg-white p-3 border border-slate-200 mb-4">
            <p className="text-[12px] font-medium text-slate-600">
              {t('catalog.results.showing')} <span className="font-bold text-slate-900">{paginatedCompanies.length}</span> {t('catalog.results.connector')} <span className="font-bold text-slate-900">{companies.length}</span> {t('catalog.results.of')}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
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

        {/* Companies Grid */}
        {!isLoading && !error && companies.length > 0 && (
          <>
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              {paginatedCompanies.map((company) => (
                <CompanyCard key={company.id} company={company} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage((p) => Math.max(1, p - 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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
                        onClick={() => {
                          if (!isActive) {
                            setPage(p);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setPage((p) => Math.min(totalPages, p + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
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

interface CompanyCardProps {
  company: Company;
}

function capitalize(str: string | undefined | null): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

function CompanyCard({ company }: CompanyCardProps) {
  const { t } = useTranslation();

  const isOnline = company.rating > 4.5;
  const cityDisplay = capitalize(company.location?.city) || t('catalog.card.default_city', 'Tbilisi');

  return (
    <Link
      to={`/company/${company.id}`}
      className={cn(
        'relative flex flex-col rounded-md border border-slate-200 bg-white shadow-sm px-4 py-3 space-y-3',
        'transition-all duration-200 hover:shadow-md hover:border-slate-300 hover:-translate-y-0.5',
        'focus:outline-none focus:ring-2 focus:ring-primary/50'
      )}
    >
      {/* TOP: Logo + Name + City */}
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 xl:h-14 xl:w-14 rounded-2xl overflow-hidden flex-shrink-0 bg-slate-100">
          <Image
            src={company.logo || '/car-logos/toyota.png'}
            alt={`${company.name} logo`}
            className="h-full w-full"
            fallbackSrc="/car-logos/toyota.png"
            loading="eager"
            objectFit="contain"
          />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-primary leading-tight line-clamp-1 capitalize">
            {company.name}
          </h3>
          <div className="flex items-center gap-1 text-[10px] xl:text-[11px] text-muted-foreground">
            <Icon icon="mdi:map-marker" className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{cityDisplay}</span>
            {company.vipStatus && (
              <span className="inline-flex items-center gap-0.5 ml-1 text-[8px] font-semibold text-amber-700 bg-amber-50 px-1 py-0.5 rounded">
                <Icon icon="mdi:crown" className="w-2 h-2" />
                {t('catalog.card.vip', 'VIP')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      {company.description && (
        <p className="text-[11px] xl:text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
          {company.description}
        </p>
      )}

      {/* Rating */}
      <div className="flex items-center justify-between text-[10px] xl:text-[11px]">
        <div className="flex items-center gap-1">
          <Icon icon="mdi:star" className="h-3 w-3 text-amber-500" />
          <span className="font-semibold text-[11px] xl:text-[12px] text-foreground">
            {company.rating}
          </span>
          <span className="text-muted-foreground">({company.reviewCount})</span>
        </div>
      </div>

      {/* BOTTOM: Status + Details Button */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-[10px] xl:text-[11px] text-muted-foreground">
          <span
            className={cn(
              'h-2 w-2 rounded-full flex-shrink-0',
              isOnline ? 'bg-green-500' : 'bg-slate-300'
            )}
          />
          <span className={isOnline ? 'text-green-600' : ''}>
            {isOnline ? t('catalog.card.online_now') : t('catalog.card.offline', 'Offline')}
          </span>
        </div>

        <div className="ml-auto">
          <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[10px] xl:text-[11px] font-semibold text-white bg-primary hover:bg-primary/90 rounded-md transition-colors">
            {t('catalog.card.view_details', 'View Details')}
            <Icon icon="mdi:arrow-right" className="h-3 w-3" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default CompaniesPage;
