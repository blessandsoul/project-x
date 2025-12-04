import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { VehicleQuote } from '@/types/vehicles';
import { useMemo } from 'react';

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
  onToggleHighRating: () => void;
  onChangeLimit: (limit: number) => void;
  onToggleCompareMode: () => void;
  onToggleSelection: (companyId: number) => void;
  onOpenBreakdown: (quote: VehicleQuote) => void;
  onOpenLeadModal: () => void;
}

// Generate consistent mock data based on company name hash
const getCompanyMeta = (companyName: string) => {
  const hash = companyName.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return {
    rating: (4.2 + (hash % 8) / 10).toFixed(1),
    reviewCount: 50 + (hash % 350),
    yearsActive: 2 + (hash % 12),
    isVerified: hash % 3 !== 0,
    recentOrders: 3 + (hash % 15),
    responseTime: ['< 1h', '< 2h', '< 30m'][hash % 3],
    isOnline: hash % 4 !== 0,
    specialization: ['Luxury', 'Economy', 'SUV', 'Sports'][hash % 4],
  };
};

const VehicleQuotesSection = ({
  filteredQuotes,
  priceStats,
  quotesLimit,
  totalQuotes,
  isHighRatingOnly,
  error,
  onToggleHighRating,
  onChangeLimit,
  onOpenBreakdown,
  onOpenLeadModal,
}: VehicleQuotesSectionProps) => {
  // Calculate potential savings
  const savings = useMemo(() => {
    if (filteredQuotes.length < 2) return 0;
    const prices = filteredQuotes.map(q => Number(q.total_price) || 0).filter(p => p > 0);
    if (prices.length < 2) return 0;
    return Math.max(...prices) - Math.min(...prices);
  }, [filteredQuotes]);

  return (
    <section
      className="bg-white rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-100 overflow-hidden" 
      id="quotes-table"
      aria-label="Shipping quotes from import companies"
    >
      {/* Premium Header with gradient accent */}
      <div className="relative">
        {/* Gradient accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-primary to-blue-500" />
        
        <div className="px-5 py-4 flex items-center justify-between bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                <Icon icon="mdi:shield-check" className="w-5 h-5" />
              </div>
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold text-slate-900 tracking-tight">
                Trusted Importers
              </span>
              <span className="text-xs text-slate-500">
                {filteredQuotes.length} verified companies ready to help
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Rating filter */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onToggleHighRating}
              className={cn(
                'hidden sm:inline-flex items-center gap-1.5 h-8 rounded-full px-3 text-xs font-medium transition-all',
                isHighRatingOnly
                  ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md shadow-amber-500/30'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
              )}
            >
              <Icon icon="mdi:star" className="w-3.5 h-3.5" />
              <span>{isHighRatingOnly ? '4.5+ Only' : 'Show 4.5+'}</span>
            </Button>

            {/* Limit selector */}
            <Select
              value={String(quotesLimit)}
              onValueChange={(value) => onChangeLimit(Number(value))}
            >
              <SelectTrigger className="hidden sm:flex h-8 w-16 rounded-full border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end" className="text-xs">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="15">15</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Savings banner */}
      {savings > 100 && (
        <div className="mx-5 mb-3 flex items-center gap-2 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shrink-0">
            <Icon icon="mdi:piggy-bank" className="w-4 h-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-emerald-800">
              Save up to <span className="text-emerald-600">${savings.toLocaleString()}</span> by comparing
            </p>
            <p className="text-[10px] text-emerald-600/80">Prices vary between importers</p>
          </div>
        </div>
      )}

      <div className="px-5 pb-5">
        {/* Error state */}
        {error ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
              <Icon icon="mdi:alert-circle" className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">Couldn't load offers</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">{error}</p>
            </div>
          </div>
        ) : filteredQuotes.length === 0 ? (
          /* Empty state */
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
              <Icon icon="mdi:truck-fast" className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">No offers yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                We're finding the best importers for this vehicle. Check back soon!
              </p>
            </div>
          </div>
        ) : (
          /* Company List - Premium Cards */
          <div className="space-y-2">
            {filteredQuotes.map((quote, index) => {
              const price = Number(quote.total_price) || 0;
              const isBestPrice = priceStats.min > 0 && price <= priceStats.min * 1.03;
              const meta = getCompanyMeta(quote.company_name);
              const isFirst = index === 0;

              return (
                <button
                  key={quote.company_id}
                  type="button"
                  onClick={() => onOpenBreakdown(quote)}
                  className={cn(
                    'w-full p-3 rounded-xl text-left transition-all duration-200 group',
                    'hover:shadow-md hover:-translate-y-0.5',
                    isBestPrice 
                      ? 'bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/50 border-2 border-emerald-200 shadow-sm shadow-emerald-100' 
                      : 'bg-slate-50/50 border border-slate-100 hover:border-slate-200 hover:bg-white',
                  )}
                >
                  {/* Best offer accent */}
                  {isBestPrice && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 rounded-t-xl" />
                  )}

                  <div className="flex items-center gap-3">
                    {/* Company Avatar */}
                    <div className="relative shrink-0">
                      <div className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold',
                        isBestPrice 
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' 
                          : 'bg-gradient-to-br from-slate-100 to-slate-50 text-slate-600 border border-slate-200'
                      )}>
                        {((quote as any).company_logo_url || (quote as any).logo_url) ? (
                          <img
                            src={(quote as any).company_logo_url || (quote as any).logo_url}
                            alt={quote.company_name}
                            className="w-full h-full object-contain rounded-xl"
                          />
                        ) : (
                          quote.company_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      {/* Verified badge */}
                      {meta.isVerified && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white">
                          <Icon icon="mdi:check" className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      {/* Online indicator */}
                      {meta.isOnline && (
                        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
                      )}
                    </div>

                    {/* Company Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm truncate">
                          {quote.company_name}
                        </span>
                        {isFirst && isBestPrice && (
                          <Badge className="bg-emerald-500 text-white border-0 text-[9px] px-1.5 py-0 h-4 font-bold">
                            BEST
                          </Badge>
                        )}
                      </div>
                      
                      {/* Rating & stats row */}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-0.5 text-[10px]">
                          <Icon icon="mdi:star" className="w-3 h-3 text-amber-500" />
                          <span className="font-medium text-slate-700">{meta.rating}</span>
                          <span className="text-slate-400">({meta.reviewCount})</span>
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[10px] text-slate-500">{meta.yearsActive} years</span>
                        {meta.recentOrders > 10 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-orange-600 font-medium flex items-center gap-0.5">
                              <Icon icon="mdi:fire" className="w-2.5 h-2.5" />
                              {meta.recentOrders} orders/week
                            </span>
                          </>
                        )}
                      </div>

                      {/* Delivery info */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                          {quote.delivery_time_days || '45-60'} days
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Icon icon="mdi:ship" className="w-3 h-3" />
                          Sea freight
                        </span>
                        <span className="flex items-center gap-1 text-[10px] text-emerald-600">
                          <Icon icon="mdi:message-reply-text" className="w-3 h-3" />
                          {meta.responseTime}
                        </span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="text-right shrink-0">
                      <div className={cn(
                        'text-lg font-bold',
                        isBestPrice ? 'text-emerald-600' : 'text-slate-900'
                      )}>
                        ${price.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Total price
                      </div>
                      {isBestPrice && (
                        <Badge variant="outline" className="mt-1 border-emerald-200 bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0">
                          Best offer
                        </Badge>
                      )}
                    </div>

                    {/* Arrow */}
                    <Icon 
                      icon="mdi:chevron-right" 
                      className="w-5 h-5 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all shrink-0" 
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Footer */}
        {filteredQuotes.length > 0 && (
          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Icon icon="mdi:shield-check" className="w-4 h-4 text-emerald-500" />
                <span>All importers are verified partners</span>
              </div>
              
              <button
                type="button"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                onClick={() => onOpenBreakdown(filteredQuotes[0])}
              >
                <span>View all {totalQuotes || filteredQuotes.length} importers</span>
                <Icon icon="mdi:arrow-right" className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* CTA Button */}
            <Button
              className="w-full mt-3 h-11 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5"
              onClick={onOpenLeadModal}
            >
              <Icon icon="mdi:send" className="w-4 h-4 mr-2" />
              Get Personalized Quotes
            </Button>
            
            <p className="text-center text-[10px] text-slate-400 mt-2">
              Free • No obligation • Response within 24h
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default VehicleQuotesSection;
