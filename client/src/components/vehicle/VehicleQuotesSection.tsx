/**
 * VehicleQuotesSection — Shipping Quotes Display
 * 
 * Displays shipping quotes from the server-side calculator API.
 * All pricing is calculated server-side - no client-side calculations.
 * 
 * Design: Copart-inspired — Clean, minimal, scannable
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VehicleQuote } from '@/types/vehicles';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from 'lucide-react';

interface VehicleQuotesSectionProps {
  /** Quotes from the server API */
  filteredQuotes: VehicleQuote[];
  /** Price statistics for highlighting best price */
  priceStats: { min: number; max: number; avg: number };
  /** Error message to display */
  error?: string | null;
  /** Whether quotes are being loaded */
  isLoading?: boolean;
  /** Whether price calculation is available for this location */
  priceAvailable?: boolean;
  /** Message when price is not available */
  priceUnavailableMessage?: string | null;
  /** Handler for opening quote breakdown modal */
  onOpenBreakdown: (quote: VehicleQuote) => void;
  /** Handler for opening lead/contact modal */
  onOpenLeadModal: () => void;
  /** Pagination: total number of companies */
  total?: number;
  /** Pagination: current page (1-indexed) */
  currentPage?: number;
  /** Pagination: total pages */
  totalPages?: number;
  /** Pagination: handler for page change */
  onPageChange?: (page: number) => void;
}

const VehicleQuotesSection = ({
  filteredQuotes,
  priceStats,
  error,
  isLoading = false,
  priceAvailable = true,
  priceUnavailableMessage,
  onOpenBreakdown,
  onOpenLeadModal,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: VehicleQuotesSectionProps) => {
  const { t, i18n } = useTranslation();

  const bestPrice = priceStats.min;

  const formatUsd = (value: number): string => {
    try {
      const locale = (i18n.resolvedLanguage || i18n.language || 'en').split('-')[0];
      const intlLocale = locale === 'ge' ? 'ka' : locale;
      return new Intl.NumberFormat(intlLocale, {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0,
      }).format(value);
    } catch {
      return `$${value.toLocaleString('en-US', { minimumFractionDigits: 0 })}`;
    }
  };

  // Loading skeleton - Copart style
  if (isLoading) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
        </div>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="size-9 rounded-full bg-slate-100 shrink-0" />
              <div className="flex-1 min-w-0 space-y-2">
                <div className="h-3.5 w-28 rounded bg-slate-100" />
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
              <div className="h-4 w-20 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state - Copart style
  if (error) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 text-center">
        <p className="text-sm text-slate-600">{error}</p>
        <Button variant="ghost" size="sm" className="mt-3 text-xs">
          {t('vehicle.quotes_section.try_again', 'Try again')}
        </Button>
      </section>
    );
  }

  // Price not available state - Copart style
  if (!priceAvailable) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 text-center">
        <div className="text-slate-400 mb-3">
          <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-sm text-slate-700 font-medium mb-1">
          {t('vehicle.quotes_section.unavailable_title', 'Price calculation unavailable')}
        </p>
        <p className="text-xs text-slate-500 max-w-xs mx-auto mb-4">
          {priceUnavailableMessage || t('vehicle.quotes_section.unavailable_description', 'Shipping quotes cannot be calculated for this location.')}
        </p>
        <Button
          onClick={onOpenLeadModal}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {t('vehicle.quotes_section.request_custom_quote', 'Request Custom Quote')}
        </Button>
      </section>
    );
  }

  // Empty state - Copart style
  if (filteredQuotes.length === 0) {
    return (
      <section className="rounded-lg border border-slate-200 bg-white shadow-sm p-6 text-center">
        <p className="text-sm text-slate-600">{t('vehicle.quotes_section.empty', 'No offers available yet')}</p>
      </section>
    );
  }

  return (
    <section
      className="vehicle-quotes-section rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
      aria-label={t('vehicle.quotes_section.aria_label', 'Import quotes')}
    >
      {/* Copart-style header with summary */}
      <header className="px-4 py-3 border-b border-slate-100 bg-slate-50/30">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <h2 className="text-[13px] font-semibold text-slate-900 uppercase tracking-wide">
              {t('vehicle.quotes_section.title', 'Shipping Quotes')}
            </h2>

          </div>
          {/* Lowest offer summary - Copart style */}
          {bestPrice > 0 && (
            <div className="text-right">
              <div className="text-[11px] text-slate-500 uppercase tracking-wide">
                {t('vehicle.quotes_section.lowest_price', 'Lowest Price')}
              </div>
              <div className="text-lg font-bold text-emerald-600 tabular-nums">
                {formatUsd(bestPrice)}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Copart-style company rows - clean and scannable */}
      <div className="divide-y divide-slate-100">
        {filteredQuotes.map((quote, index) => {
          const price = Number(quote.total_price) || 0;
          const rating = quote.company_rating != null ? quote.company_rating.toFixed(1) : t('vehicle.quotes_section.rating_na', 'N/A');

          return (
            <div
              key={quote.company_id}
              className="vehicle-quotes-item px-4 py-3 flex items-center gap-3 min-w-0 transition-colors hover:bg-slate-50/50"
            >
              {/* Left: Avatar - Logo or Initial */}
              <div className="size-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden bg-slate-100 text-slate-700">
                {quote.logoUrl ? (
                  <img
                    src={quote.logoUrl}
                    alt={quote.company_name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback to initials if image fails to load
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      if (target.nextSibling) {
                        (target.nextSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <span className={quote.logoUrl ? 'hidden' : ''}>
                  {quote.company_name.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Middle: Company info - responsive wrapping */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onOpenBreakdown(quote)}
                    className="font-medium text-slate-900 text-[13px] hover:text-primary transition-colors truncate focus:outline-none focus:underline capitalize"
                  >
                    {quote.company_name}
                  </button>
                  {index === 0 && currentPage === 1 && (
                    <span className="text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0">
                      {t('vehicle.quotes_section.lowest_price', 'Lowest Price')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                  <span className="shrink-0">★ {rating}</span>

                </div>
              </div>

              {/* Right: Price + Website icon - responsive stacking on tiny screens */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                {/* Price */}
                <button
                  type="button"
                  onClick={() => onOpenBreakdown(quote)}
                  className="text-right focus:outline-none focus:ring-2 focus:ring-primary/20 rounded px-1"
                >
                  <div className="text-base font-bold tabular-nums whitespace-nowrap text-slate-900">
                    {formatUsd(price)}
                  </div>

                </button>

                {/* Website icon - only shown if company has a website */}
                {quote.website && (
                  <a
                    href={quote.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 shrink-0"
                    aria-label="Open company website"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination footer */}
      {onPageChange && totalPages > 1 && (
        <footer className="px-4 py-3 bg-slate-50/50 border-t border-slate-100">
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Page info */}


            {/* Pagination controls */}
            <div className="flex items-center gap-1">
              {/* Previous button */}
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1 || isLoading}
                className={cn(
                  'h-8 px-3 rounded-md text-[12px] font-medium transition-colors',
                  'border border-slate-200',
                  currentPage <= 1 || isLoading
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {t('vehicle.quotes_section.prev', 'Prev')}
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages: (number | 'ellipsis')[] = [];
                  const maxVisible = 5;

                  if (totalPages <= maxVisible) {
                    // Show all pages
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i);
                    }
                  } else {
                    // Show first, last, current, and neighbors
                    if (currentPage <= 3) {
                      for (let i = 1; i <= 4; i++) pages.push(i);
                      pages.push('ellipsis');
                      pages.push(totalPages);
                    } else if (currentPage >= totalPages - 2) {
                      pages.push(1);
                      pages.push('ellipsis');
                      for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      pages.push('ellipsis');
                      pages.push(currentPage - 1);
                      pages.push(currentPage);
                      pages.push(currentPage + 1);
                      pages.push('ellipsis');
                      pages.push(totalPages);
                    }
                  }

                  return pages.map((page, idx) => {
                    if (page === 'ellipsis') {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">
                          …
                        </span>
                      );
                    }

                    return (
                      <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        disabled={isLoading}
                        className={cn(
                          'h-8 min-w-[32px] px-2 rounded-md text-[12px] font-medium transition-colors',
                          'border',
                          page === currentPage
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900',
                          isLoading && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {page}
                      </button>
                    );
                  });
                })()}
              </div>

              {/* Next button */}
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || isLoading}
                className={cn(
                  'h-8 px-3 rounded-md text-[12px] font-medium transition-colors',
                  'border border-slate-200',
                  currentPage >= totalPages || isLoading
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                {t('vehicle.quotes_section.next', 'Next')}
              </button>
            </div>
          </div>
        </footer>
      )}
    </section>
  );
};

export default VehicleQuotesSection;
