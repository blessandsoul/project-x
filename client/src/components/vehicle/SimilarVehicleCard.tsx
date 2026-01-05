import { Icon } from '@iconify/react/dist/iconify.js';
import { useTranslation } from 'react-i18next';
import type { VehicleSearchItem } from '@/types/vehicles';
import { cn } from '@/lib/utils';

interface SimilarVehicleCardProps {
    item: VehicleSearchItem;
    onViewDetails?: () => void;
    onToggleWatch?: () => void;
    isWatched?: boolean;
    priority?: boolean;
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

export function SimilarVehicleCard({
    item,
    onViewDetails,
    onToggleWatch,
    isWatched = false,
    priority = false,
}: SimilarVehicleCardProps) {
    const { t } = useTranslation();

    const mainPhotoUrl = item.primary_photo_url || item.primary_thumb_url || '/cars/1.webp';

    // Last bid from API (preferred) or fallback to calc_price
    const lastBid = item.last_bid;
    let displayPrice: number = 0;

    if (lastBid && lastBid.bid != null) {
        displayPrice = lastBid.bid;
    } else if (item.calc_price != null) {
        const numericCalc = typeof item.calc_price === 'number' ? item.calc_price : Number(item.calc_price);
        if (Number.isFinite(numericCalc)) displayPrice = Math.max(0, numericCalc);
    }

    // Buy Now price (only when strictly positive)
    let buyNowRaw: number | null = null;
    if (item.buy_it_now_price != null) {
        const numeric = typeof item.buy_it_now_price === 'number'
            ? item.buy_it_now_price
            : Number(item.buy_it_now_price);
        if (Number.isFinite(numeric) && numeric > 0) buyNowRaw = numeric;
    } else if (item.buy_it_now != null) {
        const numeric = typeof item.buy_it_now === 'number'
            ? item.buy_it_now
            : Number(item.buy_it_now);
        if (Number.isFinite(numeric) && numeric > 0) buyNowRaw = numeric;
    }

    const hasBuyNow = buyNowRaw != null;
    const buyNowPriceLabel = hasBuyNow ? formatMoney(buyNowRaw) : null;

    return (
        <div className="similar-vehicle-card-wrapper w-full h-full">
            <div className="similar-vehicle-card-inner bg-white border border-slate-200 shadow-md flex flex-col h-full overflow-hidden rounded-lg">
                {/* Header - Title + Lot */}
                <div className="px-3 py-2">
                    <h3 className="font-bold text-[14px] leading-snug text-slate-900 uppercase tracking-tight line-clamp-1">
                        {item.year} {item.make} {item.model}
                    </h3>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                        {t('auction.lot')} {item.source_lot_id || item.id}
                    </p>
                </div>

                {/* Middle Row - Image (left) + Info (right) - Horizontal Layout */}
                <div className="flex flex-row items-stretch" style={{ minHeight: '100px', maxHeight: '120px' }}>
                    {/* Left: Car Image - 50% width */}
                    <div className="relative w-1/2 flex-shrink-0">
                        <button
                            type="button"
                            className="w-full h-full bg-slate-100 focus:outline-none cursor-pointer overflow-hidden"
                            onClick={onViewDetails}
                            aria-label={t('auction.view_vehicle_details')}
                        >
                            <img
                                src={mainPhotoUrl}
                                alt={`${item.year} ${item.make} ${item.model}`}
                                className="w-full h-full object-cover"
                                loading={priority ? 'eager' : 'lazy'}
                            />
                        </button>
                    </div>

                    {/* Right: Info - 50% width */}
                    <div className="w-1/2 flex flex-col justify-start p-2 gap-1 bg-slate-100">
                        {/* Current Bid section */}
                        <div className="mb-1">
                            <p className="text-[11px] font-bold text-slate-800">{t('auction.fields.current_bid')}:</p>
                            <p className="text-[13px] font-bold text-slate-900">
                                {formatMoney(displayPrice)} <span className="text-[10px] font-normal text-slate-500">USD</span>
                            </p>
                        </div>

                        {/* Buy Now section - only if exists */}
                        {hasBuyNow && buyNowPriceLabel && (
                            <div>
                                <p className="text-[11px] font-bold text-slate-800">{t('auction.buy_now_label')}:</p>
                                <p className="text-[13px] font-bold text-slate-900">
                                    {buyNowPriceLabel} <span className="text-[10px] font-normal text-slate-500">USD</span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom Buttons */}
                <div className="grid grid-cols-3 border-t border-slate-200 mt-auto">
                    {/* DETAILS button */}
                    <button
                        type="button"
                        className="flex items-center justify-center gap-1 h-[36px] bg-accent hover:bg-accent/90 text-slate-900 font-semibold text-[11px] transition-colors"
                        onClick={onViewDetails}
                    >
                        <Icon icon="mdi:plus-circle-outline" className="w-3.5 h-3.5" />
                        {t('common.details')}
                    </button>

                    {/* WATCH button */}
                    <button
                        type="button"
                        className={cn(
                            "flex items-center justify-center gap-1 h-[36px] font-semibold text-[11px] transition-colors border-l border-slate-200",
                            isWatched
                                ? "bg-green-50 text-green-600"
                                : "bg-white hover:bg-slate-50 text-blue-600"
                        )}
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleWatch?.();
                        }}
                    >
                        <Icon icon={isWatched ? "mdi:star" : "mdi:star-outline"} className="w-3.5 h-3.5" />
                        {t('auction.actions.watch')}
                    </button>

                    {/* BID NOW button */}
                    <button
                        type="button"
                        className="flex items-center justify-center gap-1 h-[36px] bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-[11px] transition-colors border-l border-slate-200"
                        onClick={onViewDetails}
                    >
                        {t('auction.actions.bid_now')}
                    </button>
                </div>
            </div>
        </div>
    );
}
