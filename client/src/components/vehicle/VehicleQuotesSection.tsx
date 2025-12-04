import { Icon } from '@iconify/react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  onToggleHighRating: () => void;
  onChangeLimit: (limit: number) => void;
  onToggleCompareMode: () => void;
  onToggleSelection: (companyId: number) => void;
  onOpenBreakdown: (quote: VehicleQuote) => void;
  onOpenLeadModal: () => void;
}

const VehicleQuotesSection = ({
  filteredQuotes,
  priceStats,
  selectedCompanyIds,
  isCompareMode,
  quotesLimit,
  totalQuotes,
  isHighRatingOnly,
  error,
  onToggleHighRating,
  onChangeLimit,
  onToggleCompareMode,
  onToggleSelection,
  onOpenBreakdown,
  onOpenLeadModal,
}: VehicleQuotesSectionProps) => {
  return (
    <section
      className="bg-card rounded-2xl shadow-sm border border-border/60 overflow-hidden" 
      id="quotes-table"
      aria-label="Shipping quotes from import companies"
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-muted/60 border-b border-border/60">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-xs">
            <Icon icon="mdi:shield-car" className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[13px] font-semibold text-foreground tracking-tight">
              Trusted Importers
            </span>
            <span className="text-[11px] text-muted-foreground">
              Get quotes from {filteredQuotes.length} verified companies
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <Button
            type="button"
            variant={isHighRatingOnly ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleHighRating}
            className={cn(
              'hidden lg:inline-flex items-center gap-1 h-7 rounded-full px-2 py-1 text-[10px] font-medium',
              isHighRatingOnly
                ? 'bg-amber-500 text-white border-amber-500 hover:bg-amber-500/90 shadow-sm'
                : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100',
            )}
          >
            <Icon icon="mdi:star" className="w-3 h-3" />
            <span>{isHighRatingOnly ? 'Rating > 4.5' : 'Show 4.5+ only'}</span>
          </Button>

          <div className="hidden lg:flex items-center gap-1 px-2 py-1 rounded-full bg-primary text-primary-foreground font-semibold">
            <span>{Math.min(filteredQuotes.length, quotesLimit)}</span>
          </div>

          <Select
            value={String(quotesLimit)}
            onValueChange={(value) => onChangeLimit(Number(value))}
          >
            <SelectTrigger className="hidden lg:flex h-7 w-[70px] rounded-full border border-border bg-background px-2 text-[10px] text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="text-[11px]">
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="15">15</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={isCompareMode ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleCompareMode}
            className={cn(
              'h-7 rounded-full px-3 py-1.5 text-[10px] font-semibold flex items-center gap-1',
              !isCompareMode && 'bg-background border-border text-foreground hover:bg-muted/80',
            )}
          >
            <Icon icon="mdi:scale-balance" className="w-3 h-3" />
            <span>Compare</span>
          </Button>
        </div>
      </div>

      <div className="px-5 pt-3 pb-4 bg-card">
        {/* Table header */}
        <div className="grid grid-cols-[1.5fr_1fr_auto] text-[11px] text-muted-foreground font-medium py-2 border-b border-border/60">
          <span>Company</span>
          <span className="text-center">Transit time</span>
          <span className="text-right">Total price</span>
        </div>

        {/* Error state */}
        {error ? (
          <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 text-destructive">
              <Icon icon="mdi:alert-circle" className="w-4 h-4" />
              <span>We couldnt load shipping offers right now.</span>
            </div>
            <p className="max-w-sm text-xs text-muted-foreground">
              {error}
            </p>
          </div>
        ) : filteredQuotes.length === 0 ? (
          /* Empty state */
          <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-sm text-muted-foreground">
            <span>No shipping offers available yet for this vehicle.</span>
            <p className="max-w-sm text-xs text-muted-foreground">
              Try adjusting filters or check back a bit later 1 we continuously update quotes from trusted partners.
            </p>
          </div>
        ) : (
          /* Company List */
          <div className="divide-y divide-border/60">
          {filteredQuotes.map((quote) => {
            const isSelected = selectedCompanyIds.includes(quote.company_id);
            const price = Number(quote.total_price) || 0;
            const isBestPrice = priceStats.min > 0 && price <= priceStats.min * 1.03;
            const priceColorClass = isBestPrice ? 'text-emerald-600' : 'text-amber-600';

            return (
              <button
                key={quote.company_id}
                type="button"
                onClick={() => isCompareMode && onToggleSelection(quote.company_id)}
                className={cn(
                  'w-full grid grid-cols-[1.5fr_1fr_auto] items-center gap-4 py-3.5 text-left text-[12px] cursor-pointer transition-colors',
                  isSelected ? 'bg-primary/5' : 'hover:bg-muted/80',
                )}
              >
                {/* Company & checkbox */}
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {((quote as any).company_logo_url || (quote as any).logo_url) ? (
                      <img
                        src={(quote as any).company_logo_url || (quote as any).logo_url}
                        alt={quote.company_name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <span className="text-[10px] font-semibold text-foreground/80">
                        {quote.company_name
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((word) => word[0]?.toUpperCase())
                          .join('')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-start gap-2">
                    {isCompareMode && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => onToggleSelection(quote.company_id)}
                        className="mt-0.5 h-3.5 w-3.5"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground truncate max-w-[140px]">
                        {quote.company_name}
                      </span>
                      <span className="text-[10px] text-muted-foreground">International Auto Import</span>
                    </div>
                  </div>
                </div>

                {/* Transit */}
                <div className="flex flex-col text-center text-[10px] text-muted-foreground">
                  <span>{quote.delivery_time_days || '45-60'} days</span>
                  <span className="text-muted-foreground/70">Sea freight</span>
                </div>

                {/* Price & badge */}
                <div className="flex flex-col items-end">
                  <span className={cn('text-[12px] font-bold', priceColorClass)}>
                    ${price.toLocaleString()}
                  </span>
                  {isBestPrice && (
                    <span className="mt-0.5 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] text-emerald-700">
                      Best offer
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        )}

        {/* Bottom bar */}
        <div className="mt-3 border-t border-border/60 pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            Showing {filteredQuotes.length}
            {totalQuotes ? ` of ${totalQuotes}` : ''}
          </span>
          {filteredQuotes.length > 0 && (
            <button
              type="button"
              className="flex items-center gap-1 px-2 py-1 rounded-full border border-border text-[10px] text-foreground hover:bg-muted/80"
              onClick={() => onOpenBreakdown(filteredQuotes[0])}
            >
              <span>View all importers</span>
              <Icon icon="mdi:chevron-down" className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Request Quote Button */}
        {selectedCompanyIds.length > 0 && (
          <div className="mt-2">
            <Button
              className="w-full h-9 text-[11px] rounded-full font-semibold shadow-sm"
              onClick={onOpenLeadModal}
            >
              Request Quote ({selectedCompanyIds.length} selected)
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};

export default VehicleQuotesSection;
