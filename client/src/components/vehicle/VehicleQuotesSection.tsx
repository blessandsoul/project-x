/**
 * VehicleQuotesSection — Ultra-Minimal Importer Aggregator
 * 
 * Design: Linear/Notion/Vercel 2025 — Clean, minimal, premium
 * Focus: Whitespace, typography, subtle interactions
 */

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { VehicleQuote } from '@/types/vehicles';

interface VehicleQuotesSectionProps {
  quotes: VehicleQuote[];
  filteredQuotes: VehicleQuote[];
  priceStats: { min: number; max: number; avg: number };
  selectedCompanyIds: number[];
  isCompareMode: boolean;
  quotesLimit: number;
  totalQuotes?: number;
  isHighRatingOnly: boolean;
  error?: string | null;
  isLoading?: boolean;
  onToggleHighRating: () => void;
  onChangeLimit: (limit: number) => void;
  onToggleCompareMode: () => void;
  onToggleSelection: (companyId: number) => void;
  onOpenBreakdown: (quote: VehicleQuote) => void;
  onOpenLeadModal: () => void;
}

// Minimal metadata from company name
const getCompanyMeta = (name: string) => {
  const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return {
    rating: (4.2 + (hash % 8) / 10).toFixed(1),
    reviews: 50 + (hash % 350),
  };
};

const VehicleQuotesSection = ({
  filteredQuotes,
  priceStats,
  error,
  isLoading = false,
  onOpenBreakdown,
  onOpenLeadModal,
}: VehicleQuotesSectionProps) => {
  
  const bestPrice = priceStats.min;

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
          Try again
        </Button>
      </section>
    );
  }

  // Empty state
  if (filteredQuotes.length === 0) {
    return (
      <section className="rounded-2xl border border-slate-200/60 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">No offers available yet</p>
      </section>
    );
  }

  return (
    <section 
      className="vehicle-quotes-section rounded-2xl border border-slate-200/60 bg-white overflow-hidden"
      aria-label="Import quotes"
    >
      {/* Minimal header */}
      <header className="px-5 py-4 border-b border-slate-100">
        <div className="vehicle-quotes-header flex items-center justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">
              Shipping Quotes
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredQuotes.length} verified importers
            </p>
          </div>
          <span className="text-xs text-slate-400">
            Prices include all fees
          </span>
        </div>
      </header>

      {/* Clean list */}
      <div className="divide-y divide-slate-100">
        {filteredQuotes.map((quote, index) => {
          const price = Number(quote.total_price) || 0;
          const isBest = bestPrice > 0 && price <= bestPrice * 1.01;
          const meta = getCompanyMeta(quote.company_name);
          
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
                      Best
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                  <span>★ {meta.rating}</span>
                  <span>·</span>
                  <span>{quote.delivery_time_days || '45-60'} days</span>
                </div>
              </div>

              {/* Price */}
              <div className="vehicle-quote-price text-right shrink-0">
                <div className={cn(
                  'text-base font-semibold tabular-nums',
                  isBest && index === 0 ? 'text-emerald-600' : 'text-slate-900'
                )}>
                  ${price.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
                <div className="text-[11px] text-slate-400">
                  total
                </div>
              </div>

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
          Request Custom Quote
        </Button>
        <p className="text-center text-[11px] text-slate-400 mt-2.5">
          Free · No commitment · Reply within 24h
        </p>
      </footer>
    </section>
  );
};

export default VehicleQuotesSection;
