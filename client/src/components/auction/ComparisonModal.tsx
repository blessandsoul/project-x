import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react/dist/iconify.js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import type { VehiclesCompareResponse } from '@/api/vehicles';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  error: string | null;
  data: VehiclesCompareResponse | null;
  backendItems: any[]; // Passing backend items to get photos if needed
}

const formatMoney = (
  value: number | string | null | undefined,
  currency: 'USD' | 'GEL' = 'USD',
): string | null => {
  if (value == null) return null;
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;
  return currency === 'GEL' ? `${numeric.toLocaleString()} GEL` : `$${numeric.toLocaleString()}`;
};

export function ComparisonModal({
  isOpen,
  onClose,
  isLoading,
  error,
  data,
  backendItems,
}: ComparisonModalProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-primary/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white w-fit max-w-[95vw] max-h-[90vh] rounded-xl shadow-2xl shadow-primary/10 overflow-y-auto flex flex-col border-2 border-primary/20 m-auto relative"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Accent top border */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-sub to-accent rounded-t-xl z-10" />
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b bg-white shrink-0">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight flex items-center gap-2">
                  <Icon icon="mdi:compare" className="w-6 h-6 text-primary" />
                  {t('auction.compare.title')}
                </h2>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {t('auction.compare.subtitle')}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted">
                <Icon icon="mdi:close" className="w-6 h-6" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative bg-muted/5">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Icon icon="mdi:loading" className="w-10 h-10 animate-spin text-primary" />
                  <p className="text-muted-foreground font-medium">{t('common.loading')}</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-2">
                    <Icon icon="mdi:alert-circle-outline" className="w-8 h-8 text-destructive" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{t('auction.compare.error_title')}</h3>
                  <p className="text-muted-foreground max-w-md">{error}</p>
                  <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
                </div>
              ) : !data || data.vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Icon icon="mdi:database-off" className="w-12 h-12 opacity-20 mb-4" />
                  <p>{t('auction.compare.no_quotes')}</p>
                </div>
              ) : (
                  <div className="h-full w-full overflow-hidden">
                    <div className="p-0.5 sm:p-3 w-full h-full">
                      <div className="grid grid-cols-2 gap-1 sm:flex sm:gap-3 h-full sm:overflow-x-auto">
                        {data.vehicles.map((vehicle) => {
                          const backendItem = backendItems.find(i => (i.vehicle_id ?? i.id) === vehicle.vehicle_id);
                          const thumb = backendItem?.primary_photo_url || backendItem?.primary_thumb_url || '/cars/1.webp';
                          
                          // Sort quotes by total price
                          const sortedQuotes = [...vehicle.quotes].sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
                          const bestQuote = sortedQuotes[0];

                          return (
                            <div key={vehicle.vehicle_id} className="w-full sm:w-[320px] flex flex-col gap-1 sm:gap-2.5 min-w-0">
                              {/* Vehicle Header Card */}
                              <Card className="overflow-hidden bg-transparent border-none shadow-none shrink-0 py-0 gap-0 sm:py-6 sm:gap-6">
                                <div className="aspect-[16/10] sm:aspect-[4/3] relative group">
                                  <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                  <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 text-white right-2">
                                    <div className="text-xs sm:text-lg font-bold leading-tight text-shadow-sm line-clamp-2">
                                      {vehicle.year} {vehicle.make} {vehicle.model}
                                    </div>
                                    {(vehicle.yard_name || vehicle.source) && (
                                      <div className="flex flex-wrap gap-1 sm:gap-2 mt-1 text-[9px] sm:text-[10px] font-medium text-white/80">
                                        <span>{vehicle.source}</span>
                                        <span className="hidden sm:inline">•</span>
                                        <span className="truncate max-w-[80px] sm:max-w-none">{vehicle.yard_name}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>

                              {/* Best Offer Highlight */}
                              {bestQuote ? (
                                <Card className="bg-emerald-50/40 dark:bg-emerald-950/10 border-emerald-200/80 dark:border-emerald-900/50 shadow-sm relative overflow-hidden shrink-0 py-0 gap-0 sm:py-6 sm:gap-6">
                                  <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded-bl-lg">
                                    {t('auction.compare.best_badge')}
                                  </div>
                                  <CardContent className="p-1.5 sm:p-3 flex flex-col gap-0.5 sm:gap-1">
                                    <div className="text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider truncate">
                                      {t('auction.compare.total_to_georgia')}
                                    </div>
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-lg sm:text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                        {formatMoney(bestQuote.total_price, data.currency)}
                                      </span>
                                    </div>
                                    <div className="pt-1.5 mt-1.5 sm:pt-2 sm:mt-2 border-t border-emerald-200/50 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                                      <span className="text-xs sm:text-sm font-medium text-foreground truncate">{bestQuote.company_name}</span>
                                      {bestQuote.delivery_time_days && (
                                        <span className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
                                          <Icon icon="mdi:clock-outline" className="w-3 h-3 hidden sm:block" />
                                          {bestQuote.delivery_time_days} d
                                        </span>
                                      )}
                                    </div>
                                  </CardContent>
                                </Card>
                              ) : (
                                <div className="p-1.5 sm:p-3 rounded-xl border border-dashed text-center text-muted-foreground text-xs sm:text-sm shrink-0">
                                  {t('auction.compare.no_quotes_for_vehicle')}
                                </div>
                              )}

                              {/* Vehicle Specs */}
                              <Card className="mt-0.5 sm:mt-2 border-border/40 shadow-sm bg-card/60 backdrop-blur-sm text-[11px] sm:text-sm py-0 gap-0 sm:py-6 sm:gap-6">
                                <CardContent className="p-1 sm:p-2.5 flex flex-col gap-0.5 sm:gap-1">
                                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                                    <span className="text-muted-foreground">
                                      {t('vehicle.specs.year')}: <span className="text-foreground font-medium">{vehicle.year}</span>
                                    </span>
                                    {typeof vehicle.mileage === 'number' && (
                                      <span className="text-muted-foreground">
                                        {t('vehicle.specs.mileage')}: <span className="text-foreground font-medium">{vehicle.mileage.toLocaleString()} {t('common.miles_short')}</span>
                                      </span>
                                    )}
                                    {typeof vehicle.distance_miles === 'number' && (
                                      <span className="text-muted-foreground">
                                        {t('auction.compare.distance')}: <span className="text-foreground font-medium">{vehicle.distance_miles.toLocaleString()} {t('common.miles_short')}</span>
                                      </span>
                                    )}
                                  </div>
                                  {(vehicle.source || vehicle.yard_name) && (
                                    <div className="flex flex-wrap gap-2 items-center text-[10px] sm:text-xs text-muted-foreground">
                                      {vehicle.source && (
                                        <span className="px-1.5 py-0.5 rounded-full bg-muted text-foreground/90 text-[10px] sm:text-xs font-medium">
                                          {vehicle.source}
                                        </span>
                                      )}
                                      {vehicle.yard_name && (
                                        <span className="truncate max-w-[120px] sm:max-w-[160px]">
                                          {vehicle.yard_name}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>

                              {/* Other Offers List */}
                              <div className="pr-0.5 sm:pr-2 space-y-1.5 sm:space-y-2.5">
                                <h4 className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider px-0.5 py-0.5">
                                  {t('auction.compare.other_offers')}
                                </h4>
                                {sortedQuotes.slice(1).length > 0 ? (
                                  sortedQuotes.slice(1).map((quote, idx) => (
                                    <div key={idx} className="bg-card rounded-lg border p-2 sm:p-3 shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0 group hover:border-primary/50 transition-colors">
                                      <div className="flex flex-col overflow-hidden">
                                        <span className="text-xs sm:text-sm font-medium truncate">{quote.company_name}</span>
                                        {quote.delivery_time_days && (
                                          <span className="text-[9px] sm:text-[10px] text-muted-foreground">{quote.delivery_time_days} d</span>
                                        )}
                                      </div>
                                      <div className="font-bold text-foreground text-sm sm:text-base">
                                        {formatMoney(quote.total_price, data.currency)}
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="text-[10px] sm:text-xs text-muted-foreground px-1 italic">{t('auction.compare.no_other_offers')}</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
