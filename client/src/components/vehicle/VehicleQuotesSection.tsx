/**
 * VehicleQuotesSection — Shipping Quotes Display
 * 
 * Displays shipping quotes from the server-side calculator API.
 * All pricing is calculated server-side - no client-side calculations.
 * 
 * Design: Linear/Notion/Vercel 2025 — Clean, minimal, premium
 */

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VehicleQuote } from '@/types/vehicles';
import { useTranslation } from 'react-i18next';
import { MessageSquare } from 'lucide-react';

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
  /** Handler for opening message/inquiry drawer */
  onOpenMessage?: (quote: VehicleQuote) => void;
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
  onOpenMessage,
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

  // Loading skeleton
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-slate-200/60 bg-white p-6">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="size-10 rounded-full bg-slate-100" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 rounded bg-slate-100" />
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
              <div className="h-5 w-24 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">{error}</p>
        <Button variant="ghost" size="sm" className="mt-3 text-xs">
          {t('vehicle.quotes_section.try_again', 'Try again')}
        </Button>
      </section>
    );
  }

  // Price not available state (city couldn't be matched)
  if (!priceAvailable) {
    return (
      <section className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center">
        <div className="text-slate-400 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="text-sm text-slate-600 font-medium mb-1">
          {t('vehicle.quotes_section.unavailable_title', 'Price calculation unavailable')}
        </p>
        <p className="text-xs text-slate-400 max-w-xs mx-auto">
          {priceUnavailableMessage || t('vehicle.quotes_section.unavailable_description', 'Shipping quotes cannot be calculated for this location.')}
        </p>
        <Button 
          onClick={onOpenLeadModal}
          variant="outline" 
          size="sm" 
          className="mt-4 text-xs"
        >
          {t('vehicle.quotes_section.request_custom_quote', 'Request Custom Quote')}
        </Button>
      </section>
    );
  }

  // Empty state
  if (filteredQuotes.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">{t('vehicle.quotes_section.empty', 'No offers available yet')}</p>
      </section>
    );
  }

  return (
    <section 
      className="vehicle-quotes-section rounded-2xl border border-slate-200/60 bg-white overflow-hidden"
      aria-label={t('vehicle.quotes_section.aria_label', 'Import quotes')}
    >
      {/* Minimal header */}
      <header className="px-5 py-4 border-b border-slate-100">
        <div className="vehicle-quotes-header flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              {t('vehicle.quotes_section.title', 'Shipping Quotes')}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('vehicle.quotes_section.verified_importers', '{{count}} verified importers', { count: filteredQuotes.length })}
            </p>
          </div>
          <span className="text-xs text-slate-400">
            {t('vehicle.quotes_section.prices_include_all_fees', 'Prices include all fees')}
          </span>
        </div>
      </header>

      {/* Clean list */}
      <div className="divide-y divide-slate-100">
        {filteredQuotes.map((quote, index) => {
          const price = Number(quote.total_price) || 0;
          const isBest = bestPrice > 0 && price <= bestPrice * 1.01;
          // Use rating from API response (company_rating), fallback to N/A
          const rating = quote.company_rating != null ? quote.company_rating.toFixed(1) : t('vehicle.quotes_section.rating_na', 'N/A');
          
          return (
            <button
              key={quote.company_id}
              type="button"
              onClick={() => onOpenBreakdown(quote)}
              className={cn(
                'vehicle-quotes-item w-full px-5 py-4 flex items-center gap-4 text-left transition-colors',
                'hover:bg-slate-50/80 focus:outline-none focus-visible:bg-slate-50',
                isBest && index === 0 && 'bg-emerald-50/40'
              )}
            >
              {/* Avatar */}
              <div className={cn(
                'size-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0',
                isBest && index === 0
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600'
              )}>
                {quote.company_name.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 text-sm truncate">
                    {quote.company_name}
                  </span>
                  {isBest && index === 0 && (
                    <span className="text-[10px] font-medium text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      {t('vehicle.quotes_section.best', 'Best')}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span>★ {rating}</span>
                  <span>·</span>
                  <span>
                    {quote.delivery_time_days
                      ? t('vehicle.quotes_section.delivery_days', '{{count}} days', { count: quote.delivery_time_days })
                      : t('vehicle.quotes_section.delivery_unknown', '—')}
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="vehicle-quote-price text-right shrink-0">
                <div className={cn(
                  'text-base font-semibold tabular-nums',
                  isBest && index === 0 ? 'text-emerald-600' : 'text-slate-900'
                )}>
                  {formatUsd(price)}
                </div>
                <div className="text-[11px] text-slate-400">
                  {t('vehicle.quotes_section.transportation_price', 'transportation price')}
                </div>
              </div>

              {/* Message button */}
              {onOpenMessage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-3 text-xs gap-1.5 shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenMessage(quote);
                  }}
                >
                  <MessageSquare className="size-3.5" />
                  {t('vehicle.quotes_section.message', 'Message')}
                </Button>
              )}

              {/* Chevron */}
              <svg 
                className="size-4 text-slate-300 shrink-0" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* Minimal footer */}
      <footer className="px-5 py-4 bg-slate-50/50 border-t border-slate-100">
        <Button
          onClick={onOpenLeadModal}
          className="w-full h-11 rounded-xl text-sm font-medium"
        >
          {t('vehicle.quotes_section.request_custom_quote', 'Request Custom Quote')}
        </Button>
        <p className="text-center text-[11px] text-slate-400 mt-2.5">
          {t('vehicle.quotes_section.footer_note', 'Free · No commitment · Reply within 24h')}
        </p>
      </footer>
    </section>
  );
};

export default VehicleQuotesSection;
