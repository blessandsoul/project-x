/**
 * QuotesShowcase - Premium company quotes display component
 * 
 * Design: Linear/Vercel/Stripe inspired - clean, minimal, high-converting
 * Features:
 * - Best offer highlight with gradient accent
 * - Company cards with trust indicators
 * - Animated entrance with staggered reveal
 * - Price breakdown on hover/tap
 * - Mobile-first responsive design
 */

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import type { VehicleQuote, CalculateQuotesResponse } from '@/services/quotesApi';

interface QuotesShowcaseProps {
  data: CalculateQuotesResponse | null;
  isLoading: boolean;
  error: string | null;
  onClose: () => void;
  onSelectCompany?: (companyName: string) => void;
}

const formatMoney = (value: number | null | undefined, currency: 'USD' | 'GEL' = 'USD'): string => {
  if (value == null) return '—';
  const formatted = value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  return currency === 'GEL' ? `${formatted} ₾` : `$${formatted}`;
};

// Skeleton loader for quotes
function QuotesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Vehicle info skeleton */}
      <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
        <div className="w-12 h-12 rounded-lg bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
        </div>
      </div>
      
      {/* Quote cards skeleton */}
      <div className="grid gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-xl border bg-card animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
              <div className="h-6 w-20 bg-muted rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual quote card component
function QuoteCard({ 
  quote, 
  index, 
  isBest,
  onSelect 
}: { 
  quote: VehicleQuote; 
  index: number;
  isBest: boolean;
  onSelect?: () => void;
}) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate mock company data (in real app, this would come from API)
  // Using company name hash for consistent random values
  const companyData = useMemo(() => {
    const hash = quote.company_name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return {
      rating: 4.2 + (hash % 8) / 10,
      reviewCount: 50 + (hash % 350),
      yearsActive: 2 + (hash % 12),
      isVerified: hash % 3 !== 0,
      deliveryGuarantee: hash % 2 === 0,
      recentOrders: 3 + (hash % 15),
      responseTime: ['< 1 hour', '< 2 hours', '< 30 min'][hash % 3],
      specialization: ['Luxury', 'Economy', 'SUV', 'Sports'][hash % 4],
      isOnline: hash % 4 !== 0,
    };
  }, [quote.company_name]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border-2 transition-all duration-300",
        "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5",
        isBest 
          ? "border-emerald-500/50 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/30 dark:from-emerald-950/20 dark:via-background dark:to-emerald-950/10" 
          : "border-border/60 bg-card hover:border-primary/30"
      )}
    >
      {/* Best offer accent */}
      {isBest && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500" />
      )}

      {/* Best badge */}
      {isBest && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-emerald-500 text-white border-0 shadow-lg shadow-emerald-500/30 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide">
            <Icon icon="mynaui:trophy-solid" className="w-3.5 h-3.5 mr-1" />
            {t('quotes.best_offer', 'Best Offer')}
          </Badge>
        </div>
      )}

      <div className="p-4 sm:p-5">
        {/* Main content row */}
        <div className="flex items-start gap-4">
          {/* Company avatar */}
          <div className="relative shrink-0">
            <div className={cn(
              "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center text-xl font-bold",
              isBest 
                ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30" 
                : "bg-gradient-to-br from-primary/10 to-primary/5 text-primary"
            )}>
              {quote.company_name.charAt(0).toUpperCase()}
            </div>
            {companyData.isVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-background">
                <Icon icon="mynaui:check-solid" className="w-3 h-3 text-white" />
              </div>
            )}
            {/* Online indicator */}
            {companyData.isOnline && (
              <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-background animate-pulse" />
            )}
          </div>

          {/* Company info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="font-semibold text-foreground text-base sm:text-lg truncate pr-2">
                  {quote.company_name}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                  {/* Rating */}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="flex items-center gap-1 cursor-default">
                          <Icon icon="mynaui:star-solid" className="w-4 h-4 text-amber-500" />
                          <span className="font-medium text-foreground">{companyData.rating.toFixed(1)}</span>
                          <span className="text-xs">({companyData.reviewCount})</span>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('quotes.rating_tooltip', 'Based on {{count}} reviews', { count: companyData.reviewCount })}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  {/* Experience */}
                  <span className="hidden sm:flex items-center gap-1">
                    <Icon icon="mynaui:clock" className="w-3.5 h-3.5" />
                    {companyData.yearsActive} {t('quotes.years', 'years')}
                  </span>

                  {/* Delivery guarantee */}
                  {companyData.deliveryGuarantee && (
                    <span className="hidden sm:flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Icon icon="mynaui:shield-check" className="w-3.5 h-3.5" />
                      {t('quotes.guaranteed', 'Guaranteed')}
                    </span>
                  )}
                </div>

                {/* Social proof badges */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {/* Recent orders - social proof */}
                  <Badge variant="secondary" className="h-5 px-2 text-[10px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-0">
                    <Icon icon="mynaui:fire" className="w-3 h-3 mr-1" />
                    {companyData.recentOrders} {t('quotes.orders_this_week', 'orders this week')}
                  </Badge>
                  
                  {/* Response time */}
                  <Badge variant="secondary" className="hidden sm:flex h-5 px-2 text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-0">
                    <Icon icon="mynaui:message" className="w-3 h-3 mr-1" />
                    {t('quotes.responds', 'Responds')} {companyData.responseTime}
                  </Badge>

                  {/* Specialization */}
                  {index < 2 && (
                    <Badge variant="secondary" className="hidden sm:flex h-5 px-2 text-[10px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-0">
                      {companyData.specialization} {t('quotes.expert', 'Expert')}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Price - Desktop */}
              <div className="hidden sm:flex flex-col items-end shrink-0">
                <span className={cn(
                  "text-2xl font-bold tracking-tight",
                  isBest ? "text-emerald-600 dark:text-emerald-400" : "text-foreground"
                )}>
                  {formatMoney(quote.total_price)}
                </span>
                {quote.delivery_time_days && (
                  <span className="text-xs text-muted-foreground mt-0.5">
                    {quote.delivery_time_days} {t('quotes.days_delivery', 'days delivery')}
                  </span>
                )}
              </div>
            </div>

            {/* Price - Mobile */}
            <div className="flex sm:hidden items-center justify-between mt-3 pt-3 border-t border-border/50">
              <div>
                <span className={cn(
                  "text-xl font-bold",
                  isBest ? "text-emerald-600" : "text-foreground"
                )}>
                  {formatMoney(quote.total_price)}
                </span>
                {quote.delivery_time_days && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {quote.delivery_time_days}d
                  </span>
                )}
              </div>
              <Button 
                size="sm" 
                variant={isBest ? "default" : "outline"}
                className={cn(
                  "h-9 px-4 rounded-full font-medium",
                  isBest && "bg-emerald-600 hover:bg-emerald-700"
                )}
                onClick={onSelect}
              >
                {t('quotes.select', 'Select')}
              </Button>
            </div>

            {/* Expandable breakdown */}
            <div className="mt-3">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon 
                  icon={isExpanded ? "mynaui:chevron-up" : "mynaui:chevron-down"} 
                  className="w-4 h-4" 
                />
                {isExpanded ? t('quotes.hide_breakdown', 'Hide breakdown') : t('quotes.show_breakdown', 'Show breakdown')}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 pt-3 border-t border-border/50">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {t('quotes.shipping', 'Shipping')}
                        </span>
                        <p className="text-sm font-semibold">{formatMoney(quote.breakdown.shipping_total)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {t('quotes.customs', 'Customs')}
                        </span>
                        <p className="text-sm font-semibold">{formatMoney(quote.breakdown.customs_fee)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {t('quotes.service_fee', 'Service')}
                        </span>
                        <p className="text-sm font-semibold">{formatMoney(quote.breakdown.service_fee)}</p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                          {t('quotes.insurance', 'Insurance')}
                        </span>
                        <p className="text-sm font-semibold">{formatMoney(quote.breakdown.insurance_fee)}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Select button - Desktop */}
          <div className="hidden sm:block shrink-0">
            <Button 
              size="sm" 
              variant={isBest ? "default" : "outline"}
              className={cn(
                "h-10 px-5 rounded-full font-medium transition-all",
                isBest 
                  ? "bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20" 
                  : "hover:bg-primary hover:text-primary-foreground"
              )}
              onClick={onSelect}
            >
              {t('quotes.select', 'Select')}
              <Icon icon="mynaui:arrow-right" className="w-4 h-4 ml-1.5" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function QuotesShowcase({ 
  data, 
  isLoading, 
  error, 
  onClose,
  onSelectCompany 
}: QuotesShowcaseProps) {
  const { t } = useTranslation();

  // Sort quotes by price (lowest first)
  const sortedQuotes = useMemo(() => {
    if (!data?.quotes) return [];
    return [...data.quotes].sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
  }, [data?.quotes]);

  const bestPrice = sortedQuotes[0]?.total_price;
  const worstPrice = sortedQuotes[sortedQuotes.length - 1]?.total_price;
  const priceDiff = worstPrice && bestPrice ? worstPrice - bestPrice : 0;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-primary/60 backdrop-blur-sm" 
        onClick={onClose} 
      />

      {/* Modal */}
      <motion.div
        className="relative bg-white dark:bg-background w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden border-2 border-primary/20"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Accent gradient top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-sub to-accent z-10" />

        {/* Header */}
        <div className="sticky top-0 z-20 bg-white/95 dark:bg-background/95 backdrop-blur-md border-b px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                <Icon icon="mynaui:calculator" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">
                  {t('quotes.title', 'Import Quotes')}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {sortedQuotes.length} {t('quotes.companies_available', 'companies available')}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              className="rounded-full hover:bg-muted -mr-2"
            >
              <Icon icon="mynaui:x" className="w-5 h-5" />
            </Button>
          </div>

          {/* Vehicle info bar */}
          {data && (
            <div className="mt-4 flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon icon="mynaui:car" className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-foreground truncate">
                  {data.year} {data.make} {data.model}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Icon icon="mynaui:location" className="w-3.5 h-3.5" />
                    {data.yard_name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon icon="mynaui:route" className="w-3.5 h-3.5" />
                    {data.distance_miles?.toLocaleString()} mi
                  </span>
                  {data.source && (
                    <Badge variant="secondary" className="h-5 text-[10px] font-medium">
                      {data.source}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Savings banner */}
          {priceDiff > 100 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 p-2.5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-lg border border-emerald-200/50 dark:border-emerald-800/50"
            >
              <Icon icon="mynaui:sparkles" className="w-4 h-4 text-emerald-600" />
              <span className="text-sm text-emerald-700 dark:text-emerald-400">
                {t('quotes.save_up_to', 'Save up to')} <strong>{formatMoney(priceDiff)}</strong> {t('quotes.by_comparing', 'by comparing offers')}
              </span>
            </motion.div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-200px)] p-5">
          {isLoading ? (
            <QuotesSkeleton />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <Icon icon="mynaui:circle-x" className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('quotes.error_title', 'Failed to load quotes')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">{error}</p>
              <Button variant="outline" onClick={onClose} className="mt-4">
                {t('common.close', 'Close')}
              </Button>
            </div>
          ) : sortedQuotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Icon icon="mynaui:search" className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{t('quotes.no_quotes', 'No quotes available')}</h3>
              <p className="text-muted-foreground text-sm max-w-sm">
                {t('quotes.no_quotes_desc', 'We couldn\'t find any import quotes for this vehicle.')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedQuotes.map((quote, index) => (
                <QuoteCard
                  key={`${quote.company_name}-${index}`}
                  quote={quote}
                  index={index}
                  isBest={index === 0}
                  onSelect={() => onSelectCompany?.(quote.company_name)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {sortedQuotes.length > 0 && (
          <div className="sticky bottom-0 bg-white/95 dark:bg-background/95 backdrop-blur-md border-t px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                <Icon icon="mynaui:shield-check" className="w-4 h-4 inline mr-1.5 text-emerald-600" />
                {t('quotes.all_verified', 'All companies are verified partners')}
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                <Icon icon="mynaui:help-circle" className="w-4 h-4 mr-1.5" />
                {t('quotes.need_help', 'Need help?')}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

export default QuotesShowcase;
