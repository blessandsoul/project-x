import { useEffect, useState } from 'react';
import { searchVehicles } from '@/api/vehicles';
import type { VehicleSearchItem } from '@/types/vehicles';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Icon } from '@iconify/react';

// Helper to format money (imported logic from listings page)
const formatMoney = (
  value: number | string | null | undefined,
  currency: "USD" | "GEL" = "USD"
): string | null => {
  if (value == null) return null;

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return null;

  if (currency === "GEL") {
    return `${numeric.toLocaleString()} GEL`;
  }

  return `$${numeric.toLocaleString()}`;
};

export function TabletAuctionPreview() {
  const { t, i18n } = useTranslation();
  const [vehicles, setVehicles] = useState<VehicleSearchItem[]>([]);

  // Localization helpers
  const isGeorgian = i18n.language?.startsWith('ka');
  const monthShortKa = ['იან', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ'];
  const localeList = [
    i18n.language === 'ka' ? 'ka-GE' : i18n.language || 'en',
    'ka',
    'ka-GE',
    'en',
  ];

  useEffect(() => {
    searchVehicles({ limit: 6 })
      .then((response) => {
        if (response.items && response.items.length > 0) {
          setVehicles(response.items);
        }
      })
      .catch((error) => {
        console.error('Failed to fetch preview vehicles:', error);
      });
  }, []);

  if (vehicles.length === 0) {
    return (
      <div className="h-full w-full bg-white flex items-center justify-center">
        <div className="animate-pulse bg-muted h-full w-full rounded-md" />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-white text-foreground overflow-hidden flex flex-col transform scale-[0.48] origin-top-left" style={{ width: '208%', height: '208%' }}>
      <div className="h-full w-full overflow-auto">
        <table className="w-full text-left border-collapse table-fixed">
          {/* Explicit column widths to ensure alignment */}
          <colgroup>
            <col className="w-[140px]" />
            <col className="w-[160px]" />
            <col className="w-[180px] max-[470px]:hidden" />
            <col className="w-[200px]" />
            <col className="w-[180px] max-[470px]:w-[120px] max-[350px]:hidden" />
          </colgroup>
          <thead className="bg-white sticky top-0 z-10 border-b shadow-[0_1px_3px_rgb(0,0,0,0.05)]">
            <tr>
              <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase text-nowrap truncate leading-4 align-middle">
                {t('auction.columns.image', 'ფოტო')}
              </th>
              <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase text-nowrap truncate leading-4 align-middle">
                {t('auction.columns.lot_info', 'ლოტი')}
              </th>
              <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase text-nowrap truncate leading-4 align-middle max-[470px]:hidden">
                {t('auction.columns.vehicle_info', 'მანქანის ინფორმაცია')}
              </th>
              <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase text-nowrap truncate leading-4 align-middle">
                {t('auction.columns.document', 'დოკუმენტი')}
              </th>
              <th className="p-3 text-[11px] font-bold text-muted-foreground uppercase text-nowrap truncate leading-4 align-middle max-[350px]:hidden">
                {t('auction.columns.bids', 'ბიდები')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vehicles.map((item) => {
              const mainPhotoUrl = item.primary_photo_url || item.primary_thumb_url || '/cars/1.webp';
              const lastBid = item.last_bid;
              let currentBid: number | null = null;
              let bidTime: string | null = null;

              if (lastBid && lastBid.bid != null) {
                currentBid = lastBid.bid;
                bidTime = lastBid.bid_time;
              } else if (item.calc_price != null) {
                const numericCalc = typeof item.calc_price === 'number' ? item.calc_price : Number(item.calc_price);
                if (Number.isFinite(numericCalc)) currentBid = numericCalc;
              }

              let buyNowPrice: number | null = null;
              if (item.buy_it_now_price != null) {
                const numeric = typeof item.buy_it_now_price === 'number' ? item.buy_it_now_price : Number(item.buy_it_now_price);
                if (Number.isFinite(numeric) && numeric > 0) buyNowPrice = numeric;
              } else if (item.buy_it_now != null) {
                const numeric = typeof item.buy_it_now === 'number' ? item.buy_it_now : Number(item.buy_it_now);
                if (Number.isFinite(numeric) && numeric > 0) buyNowPrice = numeric;
              }

              const hasBuyNow = buyNowPrice != null;

              const retailValue = item.retail_value
                ? (typeof item.retail_value === 'number' ? item.retail_value : Number(item.retail_value))
                : null;

              // Logic from createColumns for date formatting
              const formatAuctionDate = (): { date: string; time: string; isUpcoming: boolean } | null => {
                if (!item.sold_at_date) return null;

                try {
                  const auctionDate = new Date(item.sold_at_date);
                  const now = new Date();
                  const isUpcoming = auctionDate > now;

                  // Format date: "Nov 12, 2025"
                  const dateStr = isGeorgian
                    ? `${monthShortKa[auctionDate.getMonth()]} ${auctionDate.getDate()}, ${auctionDate.getFullYear()}`
                    : new Intl.DateTimeFormat(localeList, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    }).format(auctionDate);

                  // Format time from sold_at_time if available, otherwise from the date
                  let timeStr = '';
                  if (item.sold_at_time) {
                    // Parse "18:00:00" format
                    const [hours, minutes] = item.sold_at_time.split(':');
                    const hour = parseInt(hours, 10);
                    const ampm = hour >= 12 ? 'PM' : 'AM';
                    const hour12 = hour % 12 || 12;
                    timeStr = `${hour12}:${minutes} ${ampm}`;
                  } else {
                    timeStr = new Intl.DateTimeFormat(localeList, {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true,
                    }).format(auctionDate);
                  }

                  return { date: dateStr, time: timeStr, isUpcoming };
                } catch {
                  return null;
                }
              };
              const auctionInfo = formatAuctionDate();

              // Logic from createColumns for bid time
              const formatBidTime = (isoTime: string | null): string => {
                if (!isoTime) return '';
                try {
                  const date = new Date(isoTime);
                  if (isGeorgian) {
                    const month = monthShortKa[date.getMonth()];
                    const day = date.getDate();
                    const year = date.getFullYear();
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${month} ${day}, ${year}, ${hours}:${minutes}`;
                  }
                  return new Intl.DateTimeFormat(localeList, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(date);
                } catch {
                  return '';
                }
              };

              return (
                <tr key={item.id} className="hover:bg-orange-50/30 transition-colors group">
                  {/* Image Column */}
                  <td className="p-2 align-top">
                    <div className="relative aspect-[4/3] w-full rounded-md overflow-hidden bg-muted">
                      <img
                        src={mainPhotoUrl}
                        alt={`${item.year} ${item.make} ${item.model}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {item.source && (
                        <div className={`absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] font-bold uppercase text-white ${item.source.toLowerCase() === 'copart' ? 'bg-[#002d72]' : 'bg-[#c41230]'
                          }`}>
                          {item.source.toLowerCase() === 'copart' ? 'Copart' : 'IAAI'}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Lot Info Column */}
                  <td className="p-2.5 align-top">
                    <div className="flex flex-col gap-1">
                      <div className="text-left cursor-default">
                        <h3 className="font-semibold text-xs text-primary hover:underline leading-tight uppercase whitespace-normal break-words">
                          {item.year} {item.make} {item.model}
                        </h3>
                      </div>
                      <div className="text-muted-foreground text-[11px]">
                        {t('auction.lot')} <span className="text-primary font-medium">{item.source_lot_id || item.id}</span>
                      </div>
                      {item.yard_name && (
                        <div className="text-[11px] text-muted-foreground truncate" title={item.yard_name}>
                          {item.yard_name}
                        </div>
                      )}
                      <div className="flex items-center gap-1 mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-6 text-[10px] gap-1"
                        >
                          <Icon icon="mdi:bookmark" className="w-3 h-3" />
                          {t('auction.actions.watch')}
                        </Button>
                      </div>
                    </div>
                  </td>

                  {/* Vehicle Info Column */}
                  <td className="p-2.5 align-top max-[470px]:hidden">
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <div className="text-muted-foreground text-[11px]">{t('auction.fields.odometer')}</div>
                      <div className="font-semibold text-foreground leading-none mb-1">
                        {item.mileage ? item.mileage.toLocaleString() : 'N/A'}
                      </div>
                      <div className="text-muted-foreground text-[11px]">{t('auction.fields.estimated_retail_value')}</div>
                      <div className="font-semibold text-foreground leading-none">
                        {retailValue ? formatMoney(retailValue) : 'N/A'}
                      </div>
                    </div>
                  </td>

                  {/* Document Column */}
                  <td className="p-2.5 align-top">
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <div className="whitespace-normal break-words">
                        <div className="text-muted-foreground text-[10px] mb-0.5">{t('auction.document_label')}</div>
                        <div className="text-foreground font-medium text-[11px] leading-tight mb-2">{item.document || 'N/A'}</div>

                        {auctionInfo && (
                          <div>
                            <div className="flex items-center gap-1 mb-0.5">
                              <Icon
                                icon={auctionInfo.isUpcoming ? "mdi:calendar-clock" : "mdi:calendar-check"}
                                className={`w-3.5 h-3.5 ${auctionInfo.isUpcoming ? 'text-emerald-600' : 'text-slate-500'}`}
                              />
                              <span className={`text-[9px] font-semibold uppercase tracking-wide ${auctionInfo.isUpcoming ? 'text-emerald-700' : 'text-slate-600'
                                }`}>
                                {auctionInfo.isUpcoming ? t('auction.auction_starts') : t('auction.auction_start_date')}
                              </span>
                            </div>
                            <div className={`text-[12px] font-bold ${auctionInfo.isUpcoming ? 'text-emerald-800' : 'text-slate-700'
                              }`}>
                              {auctionInfo.date}
                            </div>
                            <div className={`text-[11px] font-semibold ${auctionInfo.isUpcoming ? 'text-emerald-600' : 'text-slate-500'
                              }`}>
                              {auctionInfo.time}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Bids Column */}
                  <td className="p-2.5 align-top max-[470px]:p-1.5 max-[350px]:hidden">
                    <div className="flex flex-col w-full">
                      <div className="text-muted-foreground text-[10px] max-[470px]:text-[8px]">{t('auction.fields.current_bid')}</div>
                      <div className="text-base font-bold text-foreground max-[470px]:text-sm">
                        {formatMoney(currentBid)} <span className="text-xs font-normal text-muted-foreground max-[470px]:text-[9px]">USD</span>
                      </div>
                      {bidTime && (
                        <div className="text-[9px] text-muted-foreground mb-1.5 max-[470px]:text-[7px] max-[470px]:mb-1">
                          {formatBidTime(bidTime)}
                        </div>
                      )}
                      {!bidTime && <div className="mb-2 max-[470px]:mb-1" />}

                      {/* Bid Now Button - Dark Blue */}
                      <Button
                        size="sm"
                        className="w-full h-8 text-[11px] bg-[#1e293b] hover:bg-[#0f172a] text-white font-semibold mb-2 shadow-none rounded-md max-[470px]:h-6 max-[470px]:text-[9px] max-[470px]:px-1.5 max-[470px]:mb-1"
                      >
                        {t('auction.actions.bid_now')}
                      </Button>

                      {hasBuyNow ? (
                        <div className="flex items-center gap-2 w-full max-[470px]:gap-1 max-[470px]:flex-col">
                          <Button
                            size="sm"
                            className="flex-grow h-8 px-2 text-[11px] bg-[#fbbf24] hover:bg-[#f59e0b] text-black font-semibold whitespace-nowrap shadow-none border-none rounded-md max-[470px]:h-6 max-[470px]:text-[9px] max-[470px]:px-1.5 max-[470px]:w-full"
                          >
                            {t('auction.actions.buy_it_now')}
                          </Button>
                          <div className="text-[11px] font-bold text-foreground whitespace-nowrap max-[470px]:text-[9px]">
                            {formatMoney(buyNowPrice)} <span className="text-[9px] font-normal text-muted-foreground max-[470px]:text-[7px]">USD</span>
                          </div>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full h-8 text-[11px] border-slate-900 text-slate-900 hover:bg-slate-100 rounded-md max-[470px]:h-6 max-[470px]:text-[9px] max-[470px]:px-1.5"
                        >
                          {t('common.details')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
