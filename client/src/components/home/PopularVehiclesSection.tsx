import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Icon } from '@iconify/react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { searchVehicles } from '@/api/vehicles';
import type { VehicleSearchItem } from '@/types/vehicles';

// Default mock popular vehicles data (used as graceful fallback)
const POPULAR_VEHICLES = [
  {
    id: 1,
    year: 2019,
    make: 'BMW',
    model: 'X5 xDrive40i',
    image: '/cars/1.webp',
    currentBid: 17850,
    buyNow: 22500,
    mileage: 45000,
    location: 'CA - Los Angeles',
    saleDate: 'Today 2:00 PM',
  },
  {
    id: 2,
    year: 2020,
    make: 'Mercedes-Benz',
    model: 'C300 4MATIC',
    image: '/cars/2.webp',
    currentBid: 14200,
    buyNow: 18500,
    mileage: 38000,
    location: 'TX - Dallas',
    saleDate: 'Tomorrow 10:00 AM',
  },
  {
    id: 3,
    year: 2021,
    make: 'Toyota',
    model: 'Camry SE',
    image: '/cars/3.webp',
    currentBid: 12500,
    buyNow: 15000,
    mileage: 25000,
    location: 'FL - Miami',
    saleDate: 'Dec 5, 9:00 AM',
  },
  {
    id: 4,
    year: 2018,
    make: 'Audi',
    model: 'Q7 Premium',
    image: '/cars/1.webp',
    currentBid: 19800,
    buyNow: 24000,
    mileage: 62000,
    location: 'NY - New York',
    saleDate: 'Today 4:00 PM',
  },
  {
    id: 5,
    year: 2022,
    make: 'Tesla',
    model: 'Model 3',
    image: '/cars/2.webp',
    currentBid: 24500,
    buyNow: 29000,
    mileage: 15000,
    location: 'WA - Seattle',
    saleDate: 'Dec 6, 11:00 AM',
  },
];

type PopularVehicleCard = {
  id: number;
  year: number | null;
  make: string;
  model: string;
  image: string;
  currentBid: number | null;
  buyNow: number | null;
  mileage: number | null;
  location: string;
  saleDate: string;
};

export function PopularVehiclesSection() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [backendItems, setBackendItems] = useState<VehicleSearchItem[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadVehicles = async () => {
      try {
        setIsLoading(true);
        // Fetch a small slice of auction vehicles; let backend decide "popular" via sort if needed
        const response = await searchVehicles({
          limit: 10,
          sort: 'price_desc',
        });

        if (!isMounted) return;

        const items = response.items ?? [];
        setBackendItems(items);
      } catch (error) {
        // Silently fall back to mock POPULAR_VEHICLES
        if (!isMounted) return;
        setBackendItems(null);
      } finally {
        if (!isMounted) return;
        setIsLoading(false);
      }
    };

    void loadVehicles();

    return () => {
      isMounted = false;
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const cards: PopularVehicleCard[] = (() => {
    if (!isLoading && backendItems && backendItems.length > 0) {
      return backendItems.slice(0, 10).map((item, index) => {
        const year = typeof item.year === 'number' ? item.year : null;
        const make = item.make ?? '';
        const model = item.model ?? '';

        const image =
          item.primary_photo_url ||
          item.primary_thumb_url ||
          '/cars/1.webp';

        const rawCurrentBid = item.final_bid ?? item.calc_price ?? null;
        const rawBuyNow = item.buy_it_now_price ?? item.buy_it_now ?? item.retail_value ?? null;

        const parseMoney = (value: unknown): number | null => {
          if (value == null) return null;
          const numeric = typeof value === 'number' ? value : Number(value);
          return Number.isFinite(numeric) ? numeric : null;
        };

        const currentBid = parseMoney(rawCurrentBid);
        const buyNow = parseMoney(rawBuyNow);

        const mileage = typeof item.mileage === 'number' ? item.mileage : null;
        const location = item.yard_name || item.city || item.state || 'Auction yard';

        const sourceLabel = item.source ? item.source.toUpperCase() : 'AUCTION';
        const saleDate = sourceLabel;

        return {
          id: item.id ?? item.vehicle_id ?? index,
          year,
          make,
          model,
          image,
          currentBid,
          buyNow,
          mileage,
          location,
          saleDate,
        };
      });
    }

    // Fallback to static mock list
    return POPULAR_VEHICLES;
  })();

  return (
    <motion.section
      className="py-10 bg-muted/60"
      aria-labelledby="home-popular-vehicles-heading"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="w-full px-4 lg:px-8 lg:max-w-[1440px] lg:mx-auto">
        {/* Section Header */}
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2
              id="home-popular-vehicles-heading"
              className="text-xl md:text-2xl font-semibold tracking-tight text-foreground text-balance"
            >
              {t('home.popular_vehicles.title')} <span className="text-accent">{t('home.popular_vehicles.title_highlight')}</span>
            </h2>
          </div>
          <div className="hidden items-center gap-2 md:flex">
            <button
              type="button"
              aria-label="Scroll popular vehicles left"
              onClick={() => scroll('left')}
              className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Icon icon="mdi:chevron-left" className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Scroll popular vehicles right"
              onClick={() => scroll('right')}
              className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <Icon icon="mdi:chevron-right" className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Vehicles Carousel */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {cards.map((vehicle) => (
            <div
              key={vehicle.id}
              className="popular-vehicle-card flex-shrink-0 w-[160px] min-[680px]:w-[240px] snap-start rounded-2xl overflow-hidden bg-card border border-border/60 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col"
              onClick={() => navigate(`/vehicle/${vehicle.id}`)}
            >
              {/* Image */}
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={vehicle.image}
                  alt={`${vehicle.year ?? ''} ${vehicle.make} ${vehicle.model}`.trim()}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>

              {/* Content */}
              <div className="p-2 min-[680px]:p-3 flex flex-col flex-1 space-y-1 min-[680px]:space-y-2">
                {/* Title */}
                <h3 className="font-semibold text-xs min-[680px]:text-sm text-foreground line-clamp-2 min-[680px]:truncate leading-tight">
                  {vehicle.year ? `${vehicle.year} ` : ''}{vehicle.make} {vehicle.model}
                </h3>
                
                {/* Info Row */}
                <div className="flex items-center gap-1 min-[680px]:gap-2 text-[9px] min-[680px]:text-[11px] text-muted-foreground">
                  {typeof vehicle.mileage === 'number' ? (
                    <span>{vehicle.mileage.toLocaleString()} mi</span>
                  ) : (
                    <span>—</span>
                  )}
                  <span>•</span>
                  <span className="truncate">{vehicle.location}</span>
                </div>

                {/* Price Row */}
                <div className="pt-1 border-t border-border/40 flex-1 flex flex-col justify-end">
                  <div className="flex items-center justify-between text-[9px] min-[680px]:text-[11px] text-muted-foreground mb-0.5 min-[680px]:mb-1">
                    <span>{t('home.popular_vehicles.current_bid')}</span>
                    <span className="hidden min-[680px]:inline">{t('home.popular_vehicles.buy_now')}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm min-[680px]:text-base font-bold text-foreground">
                      {vehicle.currentBid != null ? `$${vehicle.currentBid.toLocaleString()}` : '—'}
                    </span>
                    <span className="text-xs min-[680px]:text-sm font-semibold text-green-600">
                      {vehicle.buyNow != null ? `$${vehicle.buyNow.toLocaleString()}` : '—'}
                    </span>
                  </div>
                </div>

                {/* Sale Date - hidden on mobile */}
                <div className="hidden min-[680px]:block text-[10px] text-muted-foreground/70">
                  {t('home.popular_vehicles.sale')}: {vehicle.saleDate}
                </div>

                {/* Action Buttons - single button on mobile, two on desktop */}
                <div className="flex gap-1.5 pt-1 mt-auto">
                  <Button 
                    size="sm" 
                    className="flex-1 h-7 px-2 text-[10px] min-[680px]:text-[11px] bg-primary hover:bg-primary/90 text-white font-semibold rounded-full"
                  >
                    {t('home.popular_vehicles.bid_now')}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="hidden min-[680px]:flex flex-1 h-7 px-2 text-[11px] border-green-500 text-green-600 hover:bg-green-50 font-semibold rounded-full"
                  >
                    {t('home.popular_vehicles.buy_now')}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
