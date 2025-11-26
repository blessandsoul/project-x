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
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-background w-fit max-w-[95vw] h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-border/50"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b bg-muted/30 shrink-0">
              <div className="space-y-1">
                <h2 className="text-xl font-bold tracking-tight flex items-center gap-2">
                  <Icon icon="mdi:compare" className="w-6 h-6 text-primary" />
                  {t('auction.compare_selected_prices')}
                </h2>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  {t('auction.compare_description')}
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
                  <h3 className="text-lg font-semibold text-foreground">{t('error.generic')}</h3>
                  <p className="text-muted-foreground max-w-md">{error}</p>
                  <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
                </div>
              ) : !data || data.vehicles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Icon icon="mdi:database-off" className="w-12 h-12 opacity-20 mb-4" />
                  <p>{t('auction.no_quotes_found')}</p>
                </div>
              ) : (
                <div className="h-full w-full overflow-x-auto overflow-y-hidden">
                  <div className="p-6 min-w-max h-full">
                    <div className="flex gap-6 h-full">
                      {data.vehicles.map((vehicle) => {
                        const backendItem = backendItems.find(i => (i.vehicle_id ?? i.id) === vehicle.vehicle_id);
                        const thumb = backendItem?.primary_photo_url || backendItem?.primary_thumb_url || '/cars/1.webp';
                        
                        // Sort quotes by total price
                        const sortedQuotes = [...vehicle.quotes].sort((a, b) => (a.total_price || 0) - (b.total_price || 0));
                        const bestQuote = sortedQuotes[0];

                        return (
                          <div key={vehicle.vehicle_id} className="w-[320px] flex flex-col gap-4 h-full">
                            {/* Vehicle Header Card */}
                            <Card className="overflow-hidden border-border shadow-sm shrink-0">
                              <div className="aspect-[4/3] relative group">
                                <img src={thumb} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                <div className="absolute bottom-3 left-3 text-white">
                                  <div className="text-lg font-bold leading-tight text-shadow-sm">
                                    {vehicle.year} {vehicle.make} {vehicle.model}
                                  </div>
                                  {(vehicle.yard_name || vehicle.source) && (
                                    <div className="flex gap-2 mt-1 text-[10px] font-medium text-white/80">
                                      <span>{vehicle.source}</span>
                                      <span>•</span>
                                      <span>{vehicle.yard_name}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>

                            {/* Best Offer Highlight */}
                            {bestQuote ? (
                              <Card className="bg-emerald-50/50 dark:bg-emerald-950/10 border-emerald-200 dark:border-emerald-900/50 shadow-sm relative overflow-hidden shrink-0">
                                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                                  BEST OFFER
                                </div>
                                <CardContent className="p-4 flex flex-col gap-1">
                                  <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                                    Total to Georgia
                                  </div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                                      {formatMoney(bestQuote.total_price, data.currency)}
                                    </span>
                                  </div>
                                  <div className="pt-2 mt-2 border-t border-emerald-200/50 dark:border-emerald-900/50 flex justify-between items-center">
                                    <span className="text-sm font-medium text-foreground">{bestQuote.company_name}</span>
                                    {bestQuote.delivery_time_days && (
                                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Icon icon="mdi:clock-outline" className="w-3 h-3" />
                                        {bestQuote.delivery_time_days} days
                                      </span>
                                    )}
                                  </div>
                                </CardContent>
                              </Card>
                            ) : (
                              <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground text-sm shrink-0">
                                No quotes available
                              </div>
                            )}

                            {/* Other Offers List */}
                            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 sticky top-0 bg-muted/5 backdrop-blur-sm py-1">Other Offers</h4>
                              {sortedQuotes.slice(1).length > 0 ? (
                                sortedQuotes.slice(1).map((quote, idx) => (
                                  <div key={idx} className="bg-card rounded-lg border p-3 shadow-sm flex justify-between items-center group hover:border-primary/50 transition-colors">
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium">{quote.company_name}</span>
                                      {quote.delivery_time_days && (
                                        <span className="text-[10px] text-muted-foreground">{quote.delivery_time_days} days</span>
                                      )}
                                    </div>
                                    <div className="font-bold text-foreground">
                                      {formatMoney(quote.total_price, data.currency)}
                                    </div>
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-muted-foreground px-1 italic">No other offers</div>
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
